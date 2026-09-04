'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { WebhookEvent } = require('../models/WebhookEvent');
const { Payment } = require('../models/Payment');
const { RecoveryCase } = require('../models/RecoveryCase');
const { Customer } = require('../models/Customer');

const { verifyWebhookSignature } = require('../services/razorpayService');
const { logAuditEvent } = require('../services/auditService');
const { isRazorpayConfigured } = require('../services/executionMode');

/**
 * POST /api/webhooks/razorpay
 * Razorpay Webhook Handler with Raw-Body Signature Verification and Idempotency
 */
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : '');

    // Signature Verification
    const sigCheck = verifyWebhookSignature(rawBody, signature);

    if (!sigCheck.verified) {
      console.warn('[WEBHOOK] Invalid Razorpay webhook signature:', sigCheck.reason);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Parse JSON payload after verification
    const payload = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(rawBody.toString('utf8'));

    const eventType = payload.event;
    // Derive eventId from payload or header or hash
    const eventId = payload.event_id ||
      req.headers['x-razorpay-event-id'] ||
      crypto.createHash('md5').update(rawBody).digest('hex');

    // Check Idempotency
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent && existingEvent.processed) {
      return res.status(200).json({
        status: 'ignored',
        reason: 'Duplicate event already processed',
        eventId,
      });
    }

    let targetOrderId = null;
    let targetPaymentId = null;
    let payloadAmount = null;
    let payloadCurrency = null;

    if (payload.payload) {
      if (payload.payload.payment && payload.payload.payment.entity) {
        targetPaymentId = payload.payload.payment.entity.id;
        targetOrderId = payload.payload.payment.entity.order_id;
        payloadAmount = payload.payload.payment.entity.amount;
        payloadCurrency = payload.payload.payment.entity.currency;
      } else if (payload.payload.order && payload.payload.order.entity) {
        targetOrderId = payload.payload.order.entity.id;
        payloadAmount = payload.payload.order.entity.amount_paid || payload.payload.order.entity.amount;
        payloadCurrency = payload.payload.order.entity.currency;
      } else if (payload.payload.payment_link && payload.payload.payment_link.entity) {
        targetOrderId = payload.payload.payment_link.entity.id;
        payloadAmount = payload.payload.payment_link.entity.amount_paid || payload.payload.payment_link.entity.amount;
        payloadCurrency = payload.payload.payment_link.entity.currency;
      }
    }

    // Find associated payment or recovery case in DB using trusted references
    let payment = null;
    let recoveryCase = null;

    if (targetOrderId || targetPaymentId) {
      payment = await Payment.findOne({
        $or: [
          { providerOrderId: targetOrderId },
          { externalOrderId: targetOrderId },
          { providerPaymentId: targetPaymentId },
          { externalPaymentId: targetPaymentId },
        ].filter(cond => Object.values(cond)[0] != null),
      });

      if (payment) {
        recoveryCase = await RecoveryCase.findOne({ paymentId: payment._id });
      }
    }

    // Fallback: Check if notes.caseId was attached to order/payment
    if (!recoveryCase && payload.payload) {
      const notes = payload.payload.payment?.entity?.notes || payload.payload.order?.entity?.notes || payload.payload.payment_link?.entity?.notes;
      if (notes && notes.caseId) {
        recoveryCase = await RecoveryCase.findOne({
          $or: [{ caseId: notes.caseId }, { _id: notes.caseId.match(/^[0-9a-fA-F]{24}$/) ? notes.caseId : null }],
        });
      }
    }

    // Handle Authorized Only (remain pending - not yet captured/recovered)
    if (eventType === 'payment.authorized') {
      if (payment) {
        payment.status = 'PENDING';
        payment.providerPaymentId = targetPaymentId || payment.providerPaymentId;
        payment.lastProviderEventAt = new Date();
        await payment.save();
      }
      if (recoveryCase) {
        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'RAZORPAY_PAYMENT_AUTHORIZED',
          actorType: 'WEBHOOK',
          message: `Payment authorized for order ${targetOrderId || targetPaymentId} (awaiting capture before recovery)`,
          metadata: { eventId, eventType, providerPaymentId: targetPaymentId },
        });
      }
    } else if (['payment.captured', 'order.paid', 'payment_link.paid'].includes(eventType)) {
      // Process Payment Success / Capture Events
      if (!payment && !recoveryCase) {
        console.warn(`[WEBHOOK] Unmatched event ${eventType} (${targetOrderId || targetPaymentId}). No recovery case found. Ignored safely.`);
        return res.status(200).json({
          status: 'ignored',
          reason: 'Unmatched webhook event - no associated payment or recovery case',
          eventId,
        });
      }

      // Strict Amount Validation (payload amount required, integer paise, positive, matching currency)
      const verifiedAmount = typeof payloadAmount === 'number' && Number.isInteger(payloadAmount) && payloadAmount > 0
        ? payloadAmount
        : null;

      if (!verifiedAmount) {
        console.warn(`[WEBHOOK] Invalid or missing provider payload amount (${payloadAmount}) for event ${eventId}. Recovery rejected.`);
        if (recoveryCase) {
          await logAuditEvent({
            caseId: recoveryCase._id,
            eventType: 'WEBHOOK_AMOUNT_REJECTED',
            actorType: 'WEBHOOK',
            message: `Webhook rejected: Provider payload amount is missing or invalid (${payloadAmount})`,
            metadata: { eventId, eventType, payloadAmount },
          });
        }
        return res.status(400).json({ error: 'Invalid or missing provider payload amount in webhook' });
      }

      if (payloadCurrency && payloadCurrency.toUpperCase() !== 'INR') {
        console.warn(`[WEBHOOK] Currency mismatch: ${payloadCurrency} !== INR for event ${eventId}. Recovery rejected.`);
        if (recoveryCase) {
          await logAuditEvent({
            caseId: recoveryCase._id,
            eventType: 'WEBHOOK_CURRENCY_REJECTED',
            actorType: 'WEBHOOK',
            message: `Webhook rejected: Currency mismatch (${payloadCurrency} !== INR)`,
            metadata: { eventId, eventType, payloadCurrency },
          });
        }
        return res.status(400).json({ error: 'Unsupported currency in webhook payload' });
      }

      if (payment) {
        payment.status = 'SUCCESS';
        payment.paidAt = new Date();
        payment.providerSignatureVerified = true;
        if (targetPaymentId) payment.providerPaymentId = targetPaymentId;
        payment.lastProviderEventAt = new Date();
        await payment.save();

        if (payment && payment.customerId) {
          await Customer.findByIdAndUpdate(payment.customerId, {
            $inc: { successfulPayments: 1, lifetimeValue: verifiedAmount },
            $set: { lastPaymentAt: new Date() },
          });
        }
      }

      if (recoveryCase && recoveryCase.status !== 'RECOVERED') {
        const remainingAtRisk = recoveryCase.amountAtRisk - (recoveryCase.recoveredAmount || 0);
        const actualRecovered = Math.min(verifiedAmount, remainingAtRisk > 0 ? remainingAtRisk : verifiedAmount);

        recoveryCase.recoveredAmount = Math.min(recoveryCase.amountAtRisk, (recoveryCase.recoveredAmount || 0) + actualRecovered);
        recoveryCase.status = 'RECOVERED';
        recoveryCase.resolvedAt = new Date();
        recoveryCase.resolutionReason = `Payment cryptographically verified via Razorpay webhook (${eventType})`;
        if (recoveryCase.promiseToPayStatus === 'PENDING') {
          recoveryCase.promiseToPayStatus = 'FULFILLED';
        }
        await recoveryCase.save();

        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'RAZORPAY_PAYMENT_VERIFIED',
          actorType: 'WEBHOOK',
          message: `Razorpay webhook signature verified: event ${eventType} for order ${targetOrderId || targetPaymentId}`,
          previousState: 'IN_RECOVERY',
          newState: 'RECOVERED',
          metadata: {
            eventId,
            eventType,
            amount: actualRecovered,
            provider: 'RAZORPAY',
            signatureVerified: true,
            providerPaymentId: targetPaymentId,
            providerOrderId: targetOrderId,
          },
        });

        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'PAYMENT_RECOVERY_CONFIRMED',
          actorType: 'SYSTEM',
          message: `Revenue recovery confirmed: ₹${(actualRecovered / 100).toFixed(2)}`,
          metadata: { recoveredAmount: actualRecovered, provider: 'RAZORPAY', verified: true },
        });
      }
    } else if (['payment.failed'].includes(eventType)) {
      if (payment) {
        payment.status = 'FAILED';
        payment.failedAt = new Date();
        payment.lastProviderEventAt = new Date();
        if (payload.payload && payload.payload.payment && payload.payload.payment.entity) {
          payment.failureReason = payload.payload.payment.entity.error_description || 'Payment failed';
          payment.failureCode = payload.payload.payment.entity.error_code || 'PAYMENT_FAILED';
        }
        await payment.save();
      }

      if (recoveryCase) {
        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'RAZORPAY_PAYMENT_FAILED',
          actorType: 'WEBHOOK',
          message: `Webhook received payment failure for order ${targetOrderId || targetPaymentId}`,
          metadata: { eventId, eventType },
        });
      }
    }

    const isConfigured = isRazorpayConfigured();

    // Save WebhookEvent document for idempotency
    try {
      await WebhookEvent.create({
        eventId,
        eventType,
        signatureVerified: true,
        processed: true,
        processedAt: new Date(),
        caseId: recoveryCase ? recoveryCase._id : null,
        paymentId: payment ? payment._id : null,
        _isDemoData: recoveryCase ? recoveryCase.executionMode === 'SIMULATION' : !isConfigured,
      });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        return res.status(200).json({ status: 'ignored', reason: 'Concurrent duplicate event', eventId });
      }
      throw dupErr;
    }

    res.status(200).json({ status: 'success', eventId, processed: true });
  } catch (err) {
    console.error('[WEBHOOK] Error processing Razorpay webhook:', err);
    res.status(500).json({ error: 'Internal webhook processing error' });
  }
});

module.exports = router;

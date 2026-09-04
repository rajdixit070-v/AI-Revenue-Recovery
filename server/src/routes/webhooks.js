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

    if (payload.payload) {
      if (payload.payload.payment && payload.payload.payment.entity) {
        targetPaymentId = payload.payload.payment.entity.id;
        targetOrderId = payload.payload.payment.entity.order_id;
      } else if (payload.payload.order && payload.payload.order.entity) {
        targetOrderId = payload.payload.order.entity.id;
      } else if (payload.payload.payment_link && payload.payload.payment_link.entity) {
        targetOrderId = payload.payload.payment_link.entity.id;
      }
    }

    // Find associated payment or recovery case in DB
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

    // Process Payment Success Events
    if (['payment.captured', 'payment.authorized', 'order.paid', 'payment_link.paid'].includes(eventType)) {
      if (payment) {
        payment.status = 'SUCCESS';
        payment.paidAt = new Date();
        payment.providerSignatureVerified = true;
        if (targetPaymentId) payment.providerPaymentId = targetPaymentId;
        payment.lastProviderEventAt = new Date();
        await payment.save();

        if (payment && payment.customerId) {
          await Customer.findByIdAndUpdate(payment.customerId, {
            $inc: { successfulPayments: 1, lifetimeValue: payment.amount },
            $set: { lastPaymentAt: new Date() },
          });
        }
      }

      if (recoveryCase && recoveryCase.status !== 'RECOVERED') {
        const recoverAmount = payment ? payment.amount : recoveryCase.amountAtRisk;
        recoveryCase.recoveredAmount = recoverAmount;
        recoveryCase.status = 'RECOVERED';
        recoveryCase.resolvedAt = new Date();
        recoveryCase.resolutionReason = `Payment verified via Razorpay webhook (${eventType})`;
        if (recoveryCase.promiseToPayStatus === 'PENDING') {
          recoveryCase.promiseToPayStatus = 'FULFILLED';
        }
        await recoveryCase.save();

        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'RAZORPAY_PAYMENT_VERIFIED',
          actorType: 'WEBHOOK',
          message: `Verified webhook ${eventType} for order ${targetOrderId || targetPaymentId}`,
          previousState: 'IN_RECOVERY',
          newState: 'RECOVERED',
          metadata: { eventId, eventType, amount: recoverAmount },
        });

        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'PAYMENT_RECOVERY_CONFIRMED',
          actorType: 'SYSTEM',
          message: `Revenue recovery confirmed: ₹${(recoverAmount / 100).toFixed(2)}`,
          metadata: { recoveredAmount: recoverAmount },
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

    // Save WebhookEvent document for idempotency
    await WebhookEvent.create({
      eventId,
      eventType,
      signatureVerified: true,
      processed: true,
      processedAt: new Date(),
      caseId: recoveryCase ? recoveryCase._id : null,
      paymentId: payment ? payment._id : null,
      _isDemoData: true,
    });

    res.status(200).json({ status: 'success', eventId, processed: true });
  } catch (err) {
    console.error('[WEBHOOK] Error processing Razorpay webhook:', err);
    res.status(500).json({ error: 'Internal webhook processing error' });
  }
});

module.exports = router;

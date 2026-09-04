'use strict';

/**
 * Action Executor Boundary (Phase 4 — Razorpay Test Mode Execution)
 */

const { RecoveryAction } = require('../models/RecoveryAction');
const { Payment } = require('../models/Payment');
const { logAuditEvent } = require('./auditService');
const razorpayService = require('./razorpayService');
const notificationService = require('./notificationService');
const { isRazorpayConfigured, getSystemExecutionMode } = require('./executionMode');

async function executeAction(action, context = {}) {
  const { caseId, recoveryCase, customer, payment } = context;

  if (!recoveryCase) {
    throw new Error('executeAction requires recoveryCase in context.');
  }

  const targetAmount = recoveryCase.amountAtRisk - recoveryCase.recoveredAmount;

  if (targetAmount <= 0) {
    return {
      executed: false,
      mode: 'SIMULATION',
      action,
      reason: 'Amount at risk already zero or fully recovered.',
    };
  }

  const isConfigured = isRazorpayConfigured();
  // If credentials are not configured, safely fall back to SIMULATION
  const executionMode = isConfigured ? (recoveryCase.executionMode || 'RAZORPAY_TEST_MODE') : 'SIMULATION';

  let razorpayResult = null;
  let notificationResult = null;
  let providerReference = null;
  let actionType = action;

  if (action === 'RETRY_PAYMENT') {
    actionType = 'RETRY_PAYMENT';
    razorpayResult = await razorpayService.createOrder({
      amount: targetAmount,
      currency: 'INR',
      receipt: `rcpt_${recoveryCase.caseId}_${Date.now()}`,
      notes: {
        caseId: recoveryCase.caseId,
        customerId: customer ? customer.externalCustomerId : '',
      },
      mode: executionMode,
    });
    providerReference = razorpayResult.id;

    // Attach providerOrderId to Payment record if present
    if (payment) {
      payment.providerOrderId = razorpayResult.id;
      payment.externalOrderId = razorpayResult.id;
      await payment.save();
    }
  } else if (action === 'CREATE_PAYMENT_LINK') {
    actionType = 'CREATE_PAYMENT_LINK';
    razorpayResult = await razorpayService.createPaymentLink({
      amount: targetAmount,
      currency: 'INR',
      description: `RecoverAI Recovery for Case ${recoveryCase.caseId}`,
      customer: {
        name: customer ? customer.name : 'Customer',
        email: customer ? customer.email : 'customer@example.com',
        phone: customer ? customer.phone : '',
      },
      reference_id: `ref_${recoveryCase.caseId}_${Date.now()}`,
      notes: { caseId: recoveryCase.caseId },
      mode: executionMode,
    });
    providerReference = razorpayResult.id;
  } else if (action === 'SEND_REMINDER') {
    actionType = 'SEND_REMINDER';
    notificationResult = await notificationService.sendRecoveryReminder({
      recipient: customer || { email: 'customer@example.com', phone: '' },
      channel: 'WHATSAPP',
      message: `Namaste, your pending invoice for case ${recoveryCase.caseId} is awaiting clearance.`,
      caseId: recoveryCase.caseId,
      amount: targetAmount,
    });
    providerReference = notificationResult.providerReference;
  } else if (action === 'ESCALATE') {
    actionType = 'ESCALATE';
    providerReference = `escalation_${recoveryCase.caseId}_${Date.now()}`;
  } else if (action === 'STOP') {
    actionType = 'STOP_WORKFLOW';
    providerReference = `stop_${recoveryCase.caseId}`;
  }

  // Record RecoveryAction document with strict executionMode
  const recoveryActionDoc = new RecoveryAction({
    caseId: recoveryCase._id,
    actionType,
    actorType: 'SYSTEM',
    reason: `Automated ${action} execution via ${executionMode}`,
    status: 'EXECUTING',
    attemptNumber: (recoveryCase.retryCount || 0) + 1,
    amountTargeted: targetAmount,
    amountRecovered: 0,
    providerReference,
    executionMode,
    metadata: {
      provider: action === 'SEND_REMINDER' ? 'NOTIFICATION_GATEWAY' : 'RAZORPAY',
      mode: executionMode,
      razorpayOutput: razorpayResult,
      notificationOutput: notificationResult,
    },
    startedAt: new Date(),
    _isDemoData: executionMode === 'SIMULATION',
  });

  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    await recoveryActionDoc.save();
  }

  // Increment counters on case
  if (action === 'RETRY_PAYMENT') recoveryCase.retryCount = (recoveryCase.retryCount || 0) + 1;
  if (action === 'SEND_REMINDER') recoveryCase.reminderCount = (recoveryCase.reminderCount || 0) + 1;
  if (action === 'ESCALATE') recoveryCase.escalationLevel = (recoveryCase.escalationLevel || 0) + 1;
  recoveryCase.lastActionAt = new Date();
  recoveryCase.executionMode = executionMode;

  if (mongoose.connection.readyState === 1 && typeof recoveryCase.save === 'function') {
    await recoveryCase.save();
  }

  const auditMessage =
    action === 'RETRY_PAYMENT'
      ? `Recovery payment attempt created on Razorpay (${providerReference}). Awaiting customer payment.`
      : action === 'SEND_REMINDER'
      ? `Recovery reminder notification queued in simulation (${notificationResult?.channel || 'WHATSAPP'}).`
      : action === 'CREATE_PAYMENT_LINK'
      ? `Payment link created on Razorpay (${providerReference}). Awaiting customer checkout.`
      : `Executed action ${action} (provider ref: ${providerReference})`;

  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: action === 'RETRY_PAYMENT' ? 'RAZORPAY_ORDER_CREATED' : 'RECOVERY_ACTION_EXECUTED',
    actorType: 'SYSTEM',
    message: auditMessage,
    metadata: { providerReference, action, amountTargeted: targetAmount, executionMode },
  });

  return {
    executed: true,
    mode: executionMode,
    action,
    providerReference,
    razorpayResult,
    notificationResult,
    recoveryActionId: recoveryActionDoc._id,
  };
}

module.exports = { executeAction };

'use strict';

/**
 * Action Executor Boundary (Phase 4 — Razorpay Test Mode Execution)
 */

const { RecoveryAction } = require('../models/RecoveryAction');
const { Payment } = require('../models/Payment');
const { logAuditEvent } = require('./auditService');
const razorpayService = require('./razorpayService');

async function executeAction(action, context = {}) {
  const { caseId, recoveryCase, customer, payment } = context;

  if (!recoveryCase) {
    throw new Error('executeAction requires recoveryCase in context.');
  }

  const targetAmount = recoveryCase.amountAtRisk - recoveryCase.recoveredAmount;

  if (targetAmount <= 0) {
    return {
      executed: false,
      mode: 'TEST_MODE',
      action,
      reason: 'Amount at risk already zero or fully recovered.',
    };
  }

  let razorpayResult = null;
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
    });
    providerReference = razorpayResult.id;

    // Attach providerOrderId to Payment record if present
    if (payment) {
      payment.providerOrderId = razorpayResult.id;
      payment.externalOrderId = razorpayResult.id;
      await payment.save();
    }
  } else if (action === 'CREATE_PAYMENT_LINK' || action === 'SEND_REMINDER') {
    actionType = action === 'SEND_REMINDER' ? 'SEND_REMINDER' : 'CREATE_PAYMENT_LINK';
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
    });
    providerReference = razorpayResult.id;
  } else if (action === 'ESCALATE') {
    actionType = 'ESCALATE';
    providerReference = `escalation_${recoveryCase.caseId}_${Date.now()}`;
  } else if (action === 'STOP') {
    actionType = 'STOP_WORKFLOW';
    providerReference = `stop_${recoveryCase.caseId}`;
  }

  // Record RecoveryAction document
  const recoveryActionDoc = new RecoveryAction({
    caseId: recoveryCase._id,
    actionType,
    actorType: 'SYSTEM',
    reason: `Automated ${action} execution via Razorpay Test Mode`,
    status: 'EXECUTING',
    attemptNumber: (recoveryCase.retryCount || 0) + 1,
    amountTargeted: targetAmount,
    amountRecovered: 0,
    providerReference,
    metadata: {
      provider: 'RAZORPAY',
      mode: 'TEST_MODE',
      razorpayOutput: razorpayResult,
    },
    startedAt: new Date(),
    _isDemoData: true,
  });

  await recoveryActionDoc.save();

  // Increment counters on case
  if (action === 'RETRY_PAYMENT') recoveryCase.retryCount = (recoveryCase.retryCount || 0) + 1;
  if (action === 'SEND_REMINDER') recoveryCase.reminderCount = (recoveryCase.reminderCount || 0) + 1;
  if (action === 'ESCALATE') recoveryCase.escalationLevel = (recoveryCase.escalationLevel || 0) + 1;
  recoveryCase.lastActionAt = new Date();
  await recoveryCase.save();

  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: action === 'RETRY_PAYMENT' ? 'RAZORPAY_ORDER_CREATED' : 'RECOVERY_ACTION_EXECUTED',
    actorType: 'SYSTEM',
    message: `Executed action ${action} (provider ref: ${providerReference})`,
    metadata: { providerReference, action, amountTargeted: targetAmount },
  });

  return {
    executed: true,
    mode: 'TEST_MODE',
    action,
    providerReference,
    razorpayResult,
    recoveryActionId: recoveryActionDoc._id,
  };
}

module.exports = { executeAction };

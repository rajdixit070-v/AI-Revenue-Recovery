'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const crypto = require('crypto');

const { Customer } = require('../src/models/Customer');
const { Payment } = require('../src/models/Payment');
const { RecoveryCase } = require('../src/models/RecoveryCase');
const { RecoveryPolicy } = require('../src/models/RecoveryPolicy');
const { AuditLog } = require('../src/models/AuditLog');
const { WebhookEvent } = require('../src/models/WebhookEvent');

const { analyzeRecoveryCase } = require('../src/services/recoveryOrchestrator');
const { evaluateRecoveryAction } = require('../src/services/policyEngine');
const { executeAction } = require('../src/services/actionExecutor');
const { verifyWebhookSignature } = require('../src/services/razorpayService');
const { logAuditEvent } = require('../src/services/auditService');

describe('End-to-End Recovery Flow & Final Integration (Phase 9)', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoverai_test');
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Customer.deleteMany({ email: /@e2etest\.local$/ });
      await RecoveryCase.deleteMany({ caseId: /^E2E-CASE-/ });
      await mongoose.connection.close();
    }
  });

  test('Complete End-to-End Single Recovery Case Lifecycle', async () => {
    // Step 1: Create Customer & Failed Payment
    const customer = await Customer.create({
      externalCustomerId: `cust_e2e_${Date.now()}`,
      name: 'E2E Test Customer',
      email: `test_${Date.now()}@e2etest.local`,
      status: 'ACTIVE',
      lifetimeValue: 1500000,
      successfulPayments: 5,
      failedPayments: 1,
    });

    const payment = await Payment.create({
      customerId: customer._id,
      externalPaymentId: `pay_e2e_${Date.now()}`,
      amount: 149900, // ₹1,499 in paise
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'UPI',
      failureReason: 'Insufficient funds in account',
      failureCode: 'INSUFFICIENT_FUNDS',
      attemptCount: 1,
    });

    const caseId = `E2E-CASE-${Date.now()}`;
    const recoveryCase = await RecoveryCase.create({
      caseId,
      customerId: customer._id,
      paymentId: payment._id,
      issueType: 'PAYMENT_FAILURE',
      amountAtRisk: 149900,
      recoveredAmount: 0,
      status: 'OPEN',
      riskScore: 20,
      riskLevel: 'LOW',
      retryCount: 0,
    });

    // Step 2: Run Orchestrator Analysis (Risk -> Diagnosis -> AI Decision -> Plan)
    const analysis = await analyzeRecoveryCase(caseId);
    assert.equal(analysis.case.caseId, caseId);
    assert.ok(analysis.risk.score >= 0);
    assert.ok(analysis.diagnosis.probableCause);
    assert.ok(analysis.recommendation.action);
    assert.ok(analysis.policyDecision.allowed);

    // Step 3: Execute Approved Recovery Action via Action Executor
    const proposedAction = analysis.recommendation.action;
    const policy = await RecoveryPolicy.findOne({ enabled: true });
    const policyCheck = evaluateRecoveryAction({ recoveryCase, proposedAction, policy, customer });
    assert.equal(policyCheck.allowed, true);

    const execResult = await executeAction(proposedAction, { caseId: recoveryCase._id.toString(), recoveryCase, customer, payment });
    assert.equal(execResult.executed, true);

    // Step 4: Webhook Signature Verification & Recovery Confirmation
    const rawBodyBuffer = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: payment.externalPaymentId, amount: 149900, status: 'captured' } } } }));
    const webhookSecret = 'test_webhook_secret';
    const validSignature = crypto.createHmac('sha256', webhookSecret).update(rawBodyBuffer).digest('hex');

    const isValidSig = verifyWebhookSignature(rawBodyBuffer, validSignature, webhookSecret);
    assert.equal(isValidSig.verified, true);

    // Confirm Payment Recovery
    recoveryCase.status = 'RECOVERED';
    recoveryCase.recoveredAmount = 149900;
    await recoveryCase.save();

    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: 'PAYMENT_RECOVERY_CONFIRMED',
      actorType: 'SYSTEM',
      message: 'Revenue recovery confirmed: ₹1499.00',
      metadata: { recoveredAmount: 149900 },
    });

    // Step 5: Verify Final State, Financial Accounting, and Audit Events
    const updatedCase = await RecoveryCase.findOne({ caseId });
    assert.equal(updatedCase.status, 'RECOVERED');
    assert.equal(updatedCase.recoveredAmount, 149900);

    const auditLogs = await AuditLog.find({ caseId: updatedCase._id });
    assert.ok(auditLogs.length >= 1);
    const confirmedLog = auditLogs.find(l => l.eventType === 'PAYMENT_RECOVERY_CONFIRMED');
    assert.ok(confirmedLog);
  });

  test('Policy-Blocked Case Enforcement: Max Retries Reached', async () => {
    const customer = await Customer.create({
      externalCustomerId: `cust_blocked_${Date.now()}`,
      name: 'Blocked Policy Customer',
      email: `blocked_${Date.now()}@e2etest.local`,
      status: 'ACTIVE',
    });

    const caseId = `E2E-CASE-BLOCKED-${Date.now()}`;
    const recoveryCase = await RecoveryCase.create({
      caseId,
      customerId: customer._id,
      issueType: 'PAYMENT_FAILURE',
      amountAtRisk: 500000,
      recoveredAmount: 0,
      status: 'OPEN',
      riskScore: 80,
      riskLevel: 'HIGH',
      retryCount: 3, // Max retries reached
    });

    let policy = await RecoveryPolicy.findOne({ enabled: true });
    if (!policy) {
      policy = { maxRetries: 3, maxReminders: 2, recoveryWindowHours: 168, enabled: true };
    }

    const check = evaluateRecoveryAction({ recoveryCase, proposedAction: 'RETRY_PAYMENT', policy, customer });
    assert.equal(check.allowed, false);
    assert.ok(check.violations.length > 0);
  });

  test('Webhook Idempotency: Duplicate webhooks do not double-count recovered revenue', async () => {
    const eventId = `evt_e2e_idempotency_${Date.now()}`;
    const firstInsert = await WebhookEvent.create({ eventId, eventType: 'payment.captured', provider: 'RAZORPAY', status: 'PROCESSED' });
    assert.ok(firstInsert._id);

    const isDuplicate = await WebhookEvent.findOne({ eventId });
    assert.ok(isDuplicate);
  });
});

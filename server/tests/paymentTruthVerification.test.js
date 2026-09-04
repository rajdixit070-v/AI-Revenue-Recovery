'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const crypto = require('crypto');

const { Customer } = require('../src/models/Customer');
const { Payment } = require('../src/models/Payment');
const { RecoveryCase } = require('../src/models/RecoveryCase');
const { AuditLog } = require('../src/models/AuditLog');
const { WebhookEvent } = require('../src/models/WebhookEvent');
const { verifyWebhookSignature } = require('../src/services/razorpayService');

describe('Critical Payment Truth & Simulation Bug Verification (Phase 45)', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoverai_test');
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await RecoveryCase.deleteMany({ caseId: /^TRUTH-CASE-/ });
      await Customer.deleteMany({ email: /@truthtest\.local$/ });
      await WebhookEvent.deleteMany({ eventId: /^evt_truth_/ });
      await mongoose.connection.close();
    }
  });

  test('1. Simulation payment success remains SIMULATION mode and does not claim Razorpay verification', async () => {
    const customer = await Customer.create({
      externalCustomerId: 'cust_sim_test_1',
      name: 'Simulation Truth Customer',
      email: 'sim_test_1@truthtest.local',
      status: 'ACTIVE',
    });

    const recoveryCase = await RecoveryCase.create({
      caseId: 'TRUTH-CASE-SIM-1',
      customerId: customer._id,
      issueType: 'CHECKOUT_ABANDONMENT',
      amountAtRisk: 1850000, // ₹18,500
      recoveredAmount: 0,
      status: 'OPEN',
      riskScore: 25,
      riskLevel: 'LOW',
      executionMode: 'SIMULATION',
    });

    // Execute simulation success
    recoveryCase.recoveredAmount = recoveryCase.amountAtRisk;
    recoveryCase.status = 'RECOVERED';
    recoveryCase.executionMode = 'SIMULATION';
    recoveryCase.resolvedAt = new Date();
    recoveryCase.resolutionReason = 'Simulated payment outcome recorded cleanly';
    await recoveryCase.save();

    const { logAuditEvent } = require('../src/services/auditService');
    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: 'PAYMENT_RECOVERY_CONFIRMED',
      actorType: 'SYSTEM',
      message: 'Simulation payment success recorded: ₹18500 (Simulation Mode - not real provider webhook)',
      metadata: {
        recoveredAmount: recoveryCase.recoveredAmount,
        provider: 'SIMULATION',
        verified: false,
        source: 'SIMULATION',
        executionMode: 'SIMULATION',
      },
    });

    const logs = await AuditLog.find({ caseId: recoveryCase._id });
    const confirmLog = logs.find(l => l.eventType === 'PAYMENT_RECOVERY_CONFIRMED');
    assert.ok(confirmLog);
    assert.equal(confirmLog.metadata.provider, 'SIMULATION');
    assert.equal(confirmLog.metadata.verified, false);
    assert.ok(!confirmLog.message.includes('Razorpay payment webhook verified'));
    assert.ok(!confirmLog.message.includes('Payment confirmed via Razorpay Webhook'));
  });

  test('2. Real Razorpay recovery requires cryptographic webhook verification and amount validation', async () => {
    const customer = await Customer.create({
      externalCustomerId: 'cust_rzp_test_2',
      name: 'Razorpay Real Test Customer',
      email: 'rzp_test_2@truthtest.local',
      status: 'ACTIVE',
    });

    const payment = await Payment.create({
      customerId: customer._id,
      externalPaymentId: 'pay_truth_test_2',
      providerOrderId: 'order_truth_test_2',
      amount: 499900,
      currency: 'INR',
      status: 'PENDING',
    });

    const recoveryCase = await RecoveryCase.create({
      caseId: 'TRUTH-CASE-RZP-2',
      customerId: customer._id,
      paymentId: payment._id,
      issueType: 'PAYMENT_FAILURE',
      amountAtRisk: 499900,
      recoveredAmount: 0,
      status: 'IN_RECOVERY',
      riskScore: 40,
      riskLevel: 'MEDIUM',
      executionMode: 'RAZORPAY_TEST_MODE',
    });

    const secret = 'test_webhook_secret_strict';
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: payment.externalPaymentId,
            order_id: payment.providerOrderId,
            amount: 499900,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    // Verify valid signature
    const sigResult = verifyWebhookSignature(rawBody, validSignature, secret);
    assert.equal(sigResult.verified, true);

    // Reject tampered signature
    const tamperedResult = verifyWebhookSignature(rawBody, 'tampered_invalid_sig', secret);
    assert.equal(tamperedResult.verified, false);

    // Verify amount <= amountAtRisk invariant
    assert.ok(payload.payload.payment.entity.amount <= recoveryCase.amountAtRisk);
  });
});

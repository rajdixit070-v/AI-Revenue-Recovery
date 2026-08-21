'use strict';

/**
 * 100-Case Synthetic Dataset Seed Helper
 * Creates 100 deterministic synthetic recovery cases with diverse issues, risk profiles, and customers.
 */

const mongoose = require('mongoose');
const { Customer } = require('../models/Customer');
const { Payment } = require('../models/Payment');
const { RecoveryCase } = require('../models/RecoveryCase');
const { RecoveryPolicy } = require('../models/RecoveryPolicy');

const ISSUE_TYPES = ['PAYMENT_FAILURE', 'CHECKOUT_ABANDONMENT', 'SUBSCRIPTION_FAILURE', 'OVERDUE_RECEIVABLE', 'MANDATE_FAILURE'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

async function ensureSyntheticDataset(count = 100) {
  const existingCount = await RecoveryCase.countDocuments({ caseId: /^BATCH-CASE-/ });
  if (existingCount >= count) {
    return await RecoveryCase.find({ caseId: /^BATCH-CASE-/ }).populate('customerId').populate('paymentId').sort({ caseId: 1 }).lean();
  }

  // Ensure default recovery policy
  let policy = await RecoveryPolicy.findOne({ enabled: true });
  if (!policy) {
    policy = await RecoveryPolicy.create({
      policyId: 'POL-DEFAULT-001',
      name: 'Default Recovery Guardrails',
      maxRetries: 3,
      retryIntervalHours: 24,
      maxReminders: 2,
      recoveryWindowHours: 168,
      maxEscalationLevel: 2,
      stopOnSuccess: true,
      stopOnCustomerOptOut: true,
      enabled: true,
    });
  }

  console.log(`[Synthetic Dataset] Generating ${count} synthetic recovery cases...`);

  const casesToCreate = [];

  for (let i = 1; i <= count; i++) {
    const padded = String(i).padStart(3, '0');
    const caseId = `BATCH-CASE-${padded}`;

    const issueType = ISSUE_TYPES[(i - 1) % ISSUE_TYPES.length];
    const riskLevel = RISK_LEVELS[(i - 1) % RISK_LEVELS.length];
    const riskScore = riskLevel === 'LOW' ? 15 : riskLevel === 'MEDIUM' ? 45 : riskLevel === 'HIGH' ? 75 : 95;
    const amountAtRisk = (1000 + ((i * 1499) % 25000)) * 100; // Rs 1000 to Rs 26,000 in paise

    const customerStatus = (i % 25 === 0) ? 'BLOCKED' : 'ACTIVE';

    const customer = await Customer.create({
      externalCustomerId: `cust_batch_${padded}`,
      name: `Synthetic Customer ${i}`,
      email: `customer${padded}@example.com`,
      status: customerStatus,
      lifetimeValue: (5000 + (i * 2000)) * 100,
      successfulPayments: (i % 5) + 1,
      failedPayments: (i % 3),
    });

    const payment = await Payment.create({
      customerId: customer._id,
      externalPaymentId: `pay_batch_${padded}`,
      amount: amountAtRisk,
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: i % 2 === 0 ? 'UPI' : 'CARD',
      failureReason: issueType === 'CHECKOUT_ABANDONMENT' ? 'Checkout abandoned by user' : 'Insufficient funds in account',
      failureCode: issueType === 'CHECKOUT_ABANDONMENT' ? 'CHECKOUT_ABANDONED' : 'INSUFFICIENT_FUNDS',
      attemptCount: 1,
    });

    const recommendedAction =
      issueType === 'CHECKOUT_ABANDONMENT' ? 'SEND_REMINDER' :
      riskLevel === 'CRITICAL' ? 'ESCALATE' : 'RETRY_PAYMENT';

    casesToCreate.push({
      caseId,
      customerId: customer._id,
      paymentId: payment._id,
      issueType,
      amountAtRisk,
      recoveredAmount: 0,
      status: 'OPEN',
      riskScore,
      riskLevel,
      recommendedAction,
      diagnosis: `Synthetic case ${caseId} diagnosis: ${issueType} detected`,
      retryCount: 0,
      reminderCount: 0,
      escalationLevel: 0,
    });
  }

  await RecoveryCase.insertMany(casesToCreate);
  console.log(`[Synthetic Dataset] ${count} synthetic cases created cleanly.`);

  return await RecoveryCase.find({ caseId: /^BATCH-CASE-/ }).populate('customerId').populate('paymentId').sort({ caseId: 1 }).lean();
}

module.exports = { ensureSyntheticDataset };

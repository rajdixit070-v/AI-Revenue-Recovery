'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseAndValidateResponse } = require('../src/services/ai/aiResponseParser');
const { detectPaymentDegradation } = require('../src/services/degradationService');

test('Strategy Optimizer & Comparison (Phases 4 & 16)', async (t) => {
  await t.test('parses and structures strategyComparison array cleanly', () => {
    const rawOutput = JSON.stringify({
      action: 'CREATE_PAYMENT_LINK',
      confidence: 0.88,
      priority: 'HIGH',
      reason: '1-click smart link maximizes recovery with minimal friction',
      diagnosis: {
        primaryCause: 'INSUFFICIENT_FUNDS',
        evidence: ['Previous successful payments exist'],
        uncertainty: [],
      },
      expectedOutcome: 'Customer completes payment via UPI link',
      alternativeActions: ['RETRY_PAYMENT', 'SEND_REMINDER'],
      strategyComparison: [
        {
          action: 'RETRY_PAYMENT',
          probability: 0.46,
          expectedRecovery: 4139,
          customerFriction: 'LOW',
          rationale: 'Automated gateway retry',
        },
        {
          action: 'CREATE_PAYMENT_LINK',
          probability: 0.78,
          expectedRecovery: 7019,
          customerFriction: 'LOW',
          rationale: 'WhatsApp payment link',
        },
        {
          action: 'SEND_REMINDER',
          probability: 0.31,
          expectedRecovery: 2789,
          customerFriction: 'LOW',
          rationale: 'Email reminder',
        },
        {
          action: 'ESCALATE',
          probability: 0.64,
          expectedRecovery: 5759,
          customerFriction: 'HIGH',
          rationale: 'Human escalation',
        },
      ],
      requiresHumanApproval: false,
    });

    const parsed = parseAndValidateResponse(rawOutput);
    assert.equal(parsed.isValid, true);
    assert.equal(parsed.data.action, 'CREATE_PAYMENT_LINK');
    assert.equal(parsed.data.strategyComparison.length, 4);

    const winning = parsed.data.strategyComparison.find(s => s.action === 'CREATE_PAYMENT_LINK');
    assert.equal(winning.probability, 0.78);
    assert.equal(winning.expectedRecovery, 7019);
    assert.equal(winning.customerFriction, 'LOW');
  });

  await t.test('supplies default strategy comparison matrix if missing from model output', () => {
    const rawOutput = JSON.stringify({
      action: 'RETRY_PAYMENT',
      confidence: 0.90,
      priority: 'HIGH',
      reason: 'Temporary bank decline',
      diagnosis: {
        primaryCause: 'GATEWAY_ERROR',
        evidence: [],
        uncertainty: [],
      },
      expectedOutcome: 'Retry succeeds',
      alternativeActions: ['CREATE_PAYMENT_LINK'],
      requiresHumanApproval: false,
    });

    const parsed = parseAndValidateResponse(rawOutput);
    assert.equal(parsed.isValid, true);
    assert.ok(Array.isArray(parsed.data.strategyComparison));
    assert.equal(parsed.data.strategyComparison.length, 4);
    assert.ok(parsed.data.strategyComparison.some(s => s.action === 'RETRY_PAYMENT'));
  });

  await t.test('detectPaymentDegradation returns healthy status on baseline', async () => {
    const degradation = await detectPaymentDegradation();
    assert.ok(degradation);
    assert.ok(degradation.channelHealth);
    assert.ok(typeof degradation.baselineSuccessRate === 'number');
    assert.ok(typeof degradation.currentSuccessRate === 'number');
    assert.ok(typeof degradation.dropPercentage === 'number');
  });
});

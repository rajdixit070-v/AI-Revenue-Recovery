'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getDecision } = require('../src/services/ai/aiDecisionService');

describe('AI Decision Service & Fallback', () => {
  test('returns structured decision in simulation mode', async () => {
    const result = await getDecision({
      recoveryCase: { issueType: 'PAYMENT_FAILURE', retryCount: 0, amountAtRisk: 10000, recoveredAmount: 0 },
    });
    assert.equal(typeof result.isFallback, 'boolean');
    assert.ok(result.decision.action);
    assert.ok(result.decision.confidence >= 0 && result.decision.confidence <= 1);
  });

  test('falls back safely to deterministic engine on invalid context', async () => {
    const result = await getDecision(null);
    assert.ok(result.decision.action);
    assert.equal(result.decision.action, 'STOP');
  });
});

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getFallbackRecommendation } = require('../src/services/fallbackDecisionEngine');

describe('Fallback Decision Engine', () => {
  test('recommends RETRY_PAYMENT for temporary failure within limits', () => {
    const rec = getFallbackRecommendation({
      recoveryCase: { issueType: 'PAYMENT_FAILURE', retryCount: 0, amountAtRisk: 10000, recoveredAmount: 0 },
      diagnosis: { probableCause: 'TEMPORARY_PROVIDER_FAILURE' },
      policy: { maxRetries: 3 },
    });
    assert.equal(rec.action, 'RETRY_PAYMENT');
  });

  test('recommends SEND_REMINDER for CHECKOUT_ABANDONMENT', () => {
    const rec = getFallbackRecommendation({
      recoveryCase: { issueType: 'CHECKOUT_ABANDONMENT', reminderCount: 0, amountAtRisk: 10000, recoveredAmount: 0 },
      policy: { maxReminders: 2 },
    });
    assert.equal(rec.action, 'SEND_REMINDER');
  });

  test('recommends STOP for recovered case', () => {
    const rec = getFallbackRecommendation({
      recoveryCase: { issueType: 'PAYMENT_FAILURE', status: 'RECOVERED', amountAtRisk: 10000, recoveredAmount: 10000 },
    });
    assert.equal(rec.action, 'STOP');
  });
});

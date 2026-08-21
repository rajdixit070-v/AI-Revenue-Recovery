'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateRecoveryAction } = require('../src/services/policyEngine');

describe('Policy Engine', () => {
  test('allows valid RETRY_PAYMENT within limits', () => {
    const result = evaluateRecoveryAction({
      recoveryCase: { retryCount: 1, amountAtRisk: 10000, recoveredAmount: 0, status: 'OPEN' },
      proposedAction: 'RETRY_PAYMENT',
      policy: { maxRetries: 3 },
    });
    assert.equal(result.allowed, true);
    assert.equal(result.violations.length, 0);
  });

  test('blocks RETRY_PAYMENT when max retries reached', () => {
    const result = evaluateRecoveryAction({
      recoveryCase: { retryCount: 3, amountAtRisk: 10000, recoveredAmount: 0, status: 'OPEN' },
      proposedAction: 'RETRY_PAYMENT',
      policy: { maxRetries: 3 },
    });
    assert.equal(result.allowed, false);
    assert.ok(result.violations.some(v => v.includes('Max retry count')));
  });

  test('blocks action if case is already RECOVERED', () => {
    const result = evaluateRecoveryAction({
      recoveryCase: { retryCount: 0, amountAtRisk: 10000, recoveredAmount: 10000, status: 'RECOVERED' },
      proposedAction: 'RETRY_PAYMENT',
    });
    assert.equal(result.allowed, false);
    assert.equal(result.stoppingRuleTriggered, true);
    assert.equal(result.stoppingReason, 'PAYMENT_ALREADY_RECOVERED');
  });

  test('blocks action if customer is BLOCKED', () => {
    const result = evaluateRecoveryAction({
      recoveryCase: { retryCount: 0, amountAtRisk: 10000, recoveredAmount: 0, status: 'OPEN' },
      proposedAction: 'RETRY_PAYMENT',
      customer: { status: 'BLOCKED' },
    });
    assert.equal(result.allowed, false);
    assert.equal(result.stoppingRuleTriggered, true);
  });

  test('blocks action if recovery window expired', () => {
    const pastDate = new Date(Date.now() - 3600000);
    const result = evaluateRecoveryAction({
      recoveryCase: { retryCount: 0, amountAtRisk: 10000, recoveredAmount: 0, status: 'OPEN', recoveryWindowEnd: pastDate },
      proposedAction: 'RETRY_PAYMENT',
    });
    assert.equal(result.allowed, false);
    assert.equal(result.stoppingRuleTriggered, true);
    assert.equal(result.stoppingReason, 'RECOVERY_WINDOW_EXPIRED');
  });

  test('rejects invalid action name', () => {
    const result = evaluateRecoveryAction({
      recoveryCase: { retryCount: 0, amountAtRisk: 10000, recoveredAmount: 0, status: 'OPEN' },
      proposedAction: 'INVALID_ACTION_NAME',
    });
    assert.equal(result.allowed, false);
  });
});

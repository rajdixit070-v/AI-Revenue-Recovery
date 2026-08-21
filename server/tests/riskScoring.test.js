'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calculateRiskScore, RISK_LEVEL } = require('../src/services/riskScoringService');

describe('Risk Scoring Service', () => {
  test('calculates low risk for low amount and default parameters', () => {
    const result = calculateRiskScore({ amountAtRisk: 5000 });
    assert.ok(result.score <= 25);
    assert.equal(result.level, RISK_LEVEL.LOW);
    assert.equal(result.isRuleBased, true);
  });

  test('calculates medium risk for moderate amount', () => {
    const result = calculateRiskScore({
      amountAtRisk: 1500000,
    });
    assert.ok(result.score >= 26);
    assert.ok(result.score <= 50);
    assert.equal(result.level, RISK_LEVEL.MEDIUM);
  });

  test('calculates high risk for hard decline and repeat attempts', () => {
    const result = calculateRiskScore({
      amountAtRisk: 1500000,
      payment: { attemptCount: 2, failureCode: 'CARD_DECLINED' },
    });
    assert.ok(result.score >= 51);
    assert.ok(result.score <= 75);
    assert.equal(result.level, RISK_LEVEL.HIGH);
  });

  test('calculates critical risk for very high amount, hard decline, and blocked customer', () => {
    const result = calculateRiskScore({
      amountAtRisk: 6000000,
      payment: { attemptCount: 3, failureCode: 'ACCOUNT_FROZEN' },
      customer: { status: 'BLOCKED' },
    });
    assert.ok(result.score >= 76);
    assert.equal(result.level, RISK_LEVEL.CRITICAL);
  });
});

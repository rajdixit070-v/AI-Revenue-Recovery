'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { diagnoseCase, PROBABLE_CAUSES, RECOVERABILITY } = require('../src/services/recoveryDiagnosisService');

describe('Recovery Diagnosis Service', () => {
  test('diagnoses INSUFFICIENT_FUNDS payment failure', () => {
    const result = diagnoseCase({
      recoveryCase: { issueType: 'PAYMENT_FAILURE' },
      payment: { failureCode: 'INSUFFICIENT_FUNDS' },
    });
    assert.equal(result.probableCause, PROBABLE_CAUSES.INSUFFICIENT_FUNDS);
    assert.equal(result.recoverability, RECOVERABILITY.HIGH);
    assert.ok(result.confidence > 0.8);
  });

  test('diagnoses CHECKOUT_ABANDONMENT issue', () => {
    const result = diagnoseCase({
      recoveryCase: { issueType: 'CHECKOUT_ABANDONMENT' },
    });
    assert.equal(result.probableCause, PROBABLE_CAUSES.CHECKOUT_ABANDONMENT);
    assert.equal(result.recoverability, RECOVERABILITY.HIGH);
  });

  test('diagnoses MANDATE_FAILURE issue', () => {
    const result = diagnoseCase({
      recoveryCase: { issueType: 'MANDATE_FAILURE' },
    });
    assert.equal(result.probableCause, PROBABLE_CAUSES.MANDATE_FAILURE);
  });

  test('sets recoverability to NONE if customer is BLOCKED', () => {
    const result = diagnoseCase({
      recoveryCase: { issueType: 'PAYMENT_FAILURE' },
      customer: { status: 'BLOCKED' },
    });
    assert.equal(result.recoverability, RECOVERABILITY.NONE);
  });
});

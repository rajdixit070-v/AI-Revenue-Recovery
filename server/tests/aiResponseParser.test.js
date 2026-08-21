'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { parseAndValidateResponse } = require('../src/services/ai/aiResponseParser');

describe('AI Response Parser & Schema Validation', () => {
  test('parses valid JSON response matching schema', () => {
    const validJson = JSON.stringify({
      action: 'RETRY_PAYMENT',
      confidence: 0.92,
      priority: 'HIGH',
      reason: 'Transient network failure detected',
      requiresHumanApproval: false,
      alternativeActions: ['CREATE_PAYMENT_LINK'],
    });

    const result = parseAndValidateResponse(validJson);
    assert.equal(result.isValid, true);
    assert.equal(result.data.action, 'RETRY_PAYMENT');
    assert.equal(result.data.confidence, 0.92);
  });

  test('parses JSON formatted inside Markdown block', () => {
    const markdownOutput = '```json\n{"action":"SEND_REMINDER","confidence":0.8,"priority":"MEDIUM","reason":"Checkout abandoned","requiresHumanApproval":false}\n```';

    const result = parseAndValidateResponse(markdownOutput);
    assert.equal(result.isValid, true);
    assert.equal(result.data.action, 'SEND_REMINDER');
  });

  test('rejects output with unpermitted action type', () => {
    const badJson = JSON.stringify({
      action: 'EXECUTE_REFUND',
      confidence: 0.9,
      priority: 'HIGH',
      reason: 'Illegal action name',
    });

    const result = parseAndValidateResponse(badJson);
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('Invalid or missing action'));
  });

  test('rejects output with invalid confidence range', () => {
    const badJson = JSON.stringify({
      action: 'RETRY_PAYMENT',
      confidence: 1.5,
      priority: 'HIGH',
      reason: 'Confidence > 1.0',
    });

    const result = parseAndValidateResponse(badJson);
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('Invalid confidence value'));
  });

  test('rejects non-JSON response', () => {
    const result = parseAndValidateResponse('Here is your recommendation: Retry the payment.');
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('JSON parse error'));
  });
});

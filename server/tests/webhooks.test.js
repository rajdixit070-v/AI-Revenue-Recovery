'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { verifyWebhookSignature } = require('../src/services/razorpayService');

describe('Razorpay Webhook Verification & Security', () => {
  const secret = 'whsec_test_secret_key_999';

  test('verifies valid raw-body HMAC SHA256 signature', () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', event_id: 'evt_test_001' }), 'utf8');
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const result = verifyWebhookSignature(rawBody, signature, secret);
    assert.equal(result.verified, true);
  });

  test('rejects signature if raw body is modified by 1 byte', () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 1000 }), 'utf8');
    const tamperedBody = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 1001 }), 'utf8');
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const result = verifyWebhookSignature(tamperedBody, signature, secret);
    assert.equal(result.verified, false);
  });

  test('rejects missing signature or missing secret', () => {
    const result1 = verifyWebhookSignature('{}', null, secret);
    assert.equal(result1.verified, false);

    const result2 = verifyWebhookSignature('{}', 'sig', null);
    assert.equal(result2.verified, false);
  });
});

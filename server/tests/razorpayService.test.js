'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const razorpayService = require('../src/services/razorpayService');

describe('Razorpay Integration Service (Test Mode)', () => {
  test('returns credential status cleanly', () => {
    const creds = razorpayService.getCredentials();
    assert.equal(typeof creds.isConfigured, 'boolean');
  });

  test('creates mock order when credentials not set in test environment', async () => {
    const order = await razorpayService.createOrder({ amount: 50000 });
    assert.ok(order.id);
    assert.equal(order.amount, 50000);
    assert.equal(order.currency, 'INR');
  });

  test('creates mock payment link when credentials not set', async () => {
    const link = await razorpayService.createPaymentLink({ amount: 50000, description: 'Test Link' });
    assert.ok(link.id);
    assert.equal(link.amount, 50000);
    assert.ok(link.short_url);
  });

  test('rejects signature verification with invalid inputs', () => {
    const result = razorpayService.verifyPaymentSignature({ orderId: 'ord_1', paymentId: 'pay_1', signature: 'invalid' });
    assert.equal(result.verified, false);
  });

  test('verifies valid HMAC SHA256 webhook signature', () => {
    const crypto = require('crypto');
    const secret = 'test_webhook_secret_123';
    const rawBody = JSON.stringify({ event: 'payment.captured', event_id: 'evt_123' });
    const signature = crypto.createHmac('sha256', secret).update(Buffer.from(rawBody, 'utf8')).digest('hex');

    const result = razorpayService.verifyWebhookSignature(rawBody, signature, secret);
    assert.equal(result.verified, true);
  });

  test('rejects tampered webhook signature', () => {
    const secret = 'test_webhook_secret_123';
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const tamperedBody = JSON.stringify({ event: 'payment.captured', hacked: true });
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', secret).update(Buffer.from(rawBody, 'utf8')).digest('hex');

    const result = razorpayService.verifyWebhookSignature(tamperedBody, signature, secret);
    assert.equal(result.verified, false);
  });
});

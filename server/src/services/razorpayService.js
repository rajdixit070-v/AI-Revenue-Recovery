'use strict';

const crypto = require('crypto');

let Razorpay = null;
try {
  Razorpay = require('razorpay');
} catch (err) {
  // Graceful fallback if razorpay package is not yet initialized
}

/**
 * Razorpay Test Mode Service Integration
 */

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('your_') &&
    !keySecret.includes('your_')
  );

  return { keyId, keySecret, webhookSecret, isConfigured };
}

function getRazorpayInstance() {
  const { keyId, keySecret, isConfigured } = getCredentials();

  if (!isConfigured) {
    throw new Error('Razorpay Test Mode credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.');
  }

  if (!Razorpay) {
    Razorpay = require('razorpay');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Create a Razorpay Order in Test Mode
 */
async function createOrder(params = {}) {
  const { amount, currency = 'INR', receipt, notes = {} } = params;

  if (!amount || amount <= 0) {
    throw new Error('Valid amount in paise is required to create a Razorpay order.');
  }

  const { isConfigured } = getCredentials();

  if (!isConfigured) {
    const mockId = `order_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return {
      id: mockId,
      entity: 'order',
      amount,
      amount_paid: 0,
      amount_due: amount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000),
      isMock: true,
    };
  }

  const instance = getRazorpayInstance();
  return await instance.orders.create({
    amount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes,
  });
}

/**
 * Create a Razorpay Payment Link in Test Mode
 */
async function createPaymentLink(params = {}) {
  const { amount, currency = 'INR', description = 'RecoverAI Revenue Recovery Link', customer = {}, reference_id, notes = {} } = params;

  const { isConfigured } = getCredentials();

  if (!isConfigured) {
    const mockLinkId = `plink_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return {
      id: mockLinkId,
      entity: 'payment_link',
      amount,
      currency,
      description,
      short_url: `https://rzp.test/l/${mockLinkId}`,
      status: 'created',
      customer,
      reference_id: reference_id || `ref_${Date.now()}`,
      notes,
      isMock: true,
    };
  }

  const instance = getRazorpayInstance();
  return await instance.paymentLink.create({
    amount,
    currency,
    description,
    customer: {
      name: customer.name || 'Valued Customer',
      email: customer.email || 'customer@example.com',
      contact: customer.phone || '+919999999999',
    },
    reference_id: reference_id || `ref_${Date.now()}`,
    notes,
  });
}

/**
 * Verify Razorpay Checkout Payment Signature
 * Signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
function verifyPaymentSignature(params = {}) {
  const { orderId, paymentId, signature } = params;
  const { keySecret } = getCredentials();

  if (!orderId || !paymentId || !signature) {
    return { verified: false, reason: 'Missing orderId, paymentId, or signature' };
  }

  if (!keySecret) {
    return { verified: false, reason: 'RAZORPAY_KEY_SECRET is not configured' };
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (err) {
    isMatch = false;
  }

  return { verified: isMatch, expectedSignature };
}

/**
 * Verify Razorpay Webhook Signature
 * Signature = HMAC_SHA256(rawBody, webhookSecret)
 */
function verifyWebhookSignature(rawBody, signature, customSecret) {
  const { webhookSecret: envSecret } = getCredentials();
  const secret = customSecret || envSecret;

  if (!rawBody || !signature) {
    return { verified: false, reason: 'Missing rawBody or x-razorpay-signature header' };
  }

  if (!secret) {
    return { verified: false, reason: 'RAZORPAY_WEBHOOK_SECRET is not configured' };
  }

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const expectedSignature = crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex');

  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (err) {
    isMatch = false;
  }

  return { verified: isMatch };
}

module.exports = {
  getCredentials,
  createOrder,
  createPaymentLink,
  verifyPaymentSignature,
  verifyWebhookSignature,
};

'use strict';

/**
 * Central Execution Mode Helper
 * Strictly distinguishes between RAZORPAY_TEST_MODE and SIMULATION.
 * Ensures consistent executionMode evaluation across all services.
 */

function isRazorpayConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return false;
  
  const dummyStrings = ['your_', 'sample', 'placeholder', 'dummy', 'xxxx', 'test_key'];
  const isKeyDummy = dummyStrings.some(d => keyId.toLowerCase().includes(d));
  const isSecretDummy = dummyStrings.some(d => keySecret.toLowerCase().includes(d));
  
  return Boolean(
    !isKeyDummy &&
    !isSecretDummy &&
    keyId.startsWith('rzp_test_')
  );
}

function getSystemExecutionMode() {
  return isRazorpayConfigured() ? 'RAZORPAY_TEST_MODE' : 'SIMULATION';
}

module.exports = {
  isRazorpayConfigured,
  getSystemExecutionMode,
};

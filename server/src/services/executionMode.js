'use strict';

/**
 * Central Execution Mode Helper
 * Strictly distinguishes between RAZORPAY_TEST_MODE and SIMULATION.
 * Ensures consistent executionMode evaluation across all services.
 */

function isRazorpayConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('your_') &&
    !keySecret.includes('your_')
  );
}

function getSystemExecutionMode() {
  return isRazorpayConfigured() ? 'RAZORPAY_TEST_MODE' : 'SIMULATION';
}

module.exports = {
  isRazorpayConfigured,
  getSystemExecutionMode,
};

'use strict';

/**
 * Money utilities for RecoverAI.
 *
 * All monetary values are stored as integers in the smallest currency unit.
 * For INR: 1 rupee = 100 paise, so store paise as an integer.
 *
 * Example: Rs 100.50 => 10050 paise
 *
 * DO NOT use floating-point arithmetic for financial calculations.
 */

/**
 * Convert a decimal rupee amount to integer paise.
 * @param {number} rupees - Amount in rupees (may be decimal)
 * @returns {number} Integer paise
 */
function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to a formatted rupee string.
 * @param {number} paise - Amount in paise
 * @returns {string} e.g. ₹100.50
 */
function paiseToRupeeString(paise) {
  const rupees = (paise / 100).toFixed(2);
  return Rs ;
}

/**
 * Assert that a paise value is a safe non-negative integer.
 * @param {number} paise
 * @returns {boolean}
 */
function isValidPaise(paise) {
  return Number.isInteger(paise) && paise >= 0;
}

module.exports = { rupeesToPaise, paiseToRupeeString, isValidPaise };

'use strict';

/**
 * Risk Scoring Service
 * Deterministic rule-based risk scoring model for RecoverAI.
 */

const RISK_LEVEL = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

function calculateRiskScore(context = {}) {
  const {
    amountAtRisk = 0,
    payment = null,
    customer = null,
    recoveryCase = null,
  } = context;

  let score = 20; // baseline score
  const factors = [];

  // Factor 1: Amount at risk
  if (amountAtRisk >= 5000000) { // >= Rs 50,000 in paise
    score += 30;
    factors.push({ factor: 'VERY_HIGH_AMOUNT_AT_RISK', weight: 30, description: 'Amount at risk exceeds ₹50,000' });
  } else if (amountAtRisk >= 1000000) { // >= Rs 10,000 in paise
    score += 15;
    factors.push({ factor: 'HIGH_AMOUNT_AT_RISK', weight: 15, description: 'Amount at risk exceeds ₹10,000' });
  }

  // Factor 2: Payment Failure Reasons & Attempts
  if (payment) {
    if (payment.attemptCount >= 3) {
      score += 20;
      factors.push({ factor: 'MULTIPLE_FAILED_ATTEMPTS', weight: 20, description: '3 or more payment attempts failed' });
    } else if (payment.attemptCount >= 2) {
      score += 10;
      factors.push({ factor: 'REPEAT_PAYMENT_FAILURE', weight: 10, description: '2 payment attempts failed' });
    }

    if (payment.failureCode === 'INSUFFICIENT_FUNDS') {
      score += 10;
      factors.push({ factor: 'INSUFFICIENT_FUNDS_SIGNAL', weight: 10, description: 'Failure due to insufficient funds' });
    } else if (['CARD_DECLINED', 'AUTH_FAILURE', 'ACCOUNT_FROZEN'].includes(payment.failureCode)) {
      score += 25;
      factors.push({ factor: 'HARD_DECLINE_SIGNAL', weight: 25, description: 'Hard decline or account frozen' });
    }
  }

  // Factor 3: Customer History & Status
  if (customer) {
    if (customer.status === 'INACTIVE' || customer.status === 'BLOCKED') {
      score += 25;
      factors.push({ factor: 'CUSTOMER_STATUS_RISK', weight: 25, description: `Customer status is ${customer.status}` });
    }

    if (customer.failedPayments > 3 && customer.successfulPayments === 0) {
      score += 20;
      factors.push({ factor: 'NO_SUCCESSFUL_HISTORY', weight: 20, description: 'Customer has no successful payment history' });
    } else if (customer.lifetimeValue > 5000000) {
      score -= 10; // High LTV reduces risk
      factors.push({ factor: 'HIGH_LTV_CUSTOMER', weight: -10, description: 'High lifetime value customer (lowers risk)' });
    }
  }

  // Factor 4: Case History & Escalations
  if (recoveryCase) {
    if (recoveryCase.retryCount >= 2) {
      score += 15;
      factors.push({ factor: 'REPEATED_RECOVERY_RETRIES', weight: 15, description: 'Case has had multiple recovery retries' });
    }
    if (recoveryCase.escalationLevel > 0) {
      score += 20;
      factors.push({ factor: 'ALREADY_ESCALATED', weight: 20, description: 'Case is already at an escalated level' });
    }
  }

  // Bound score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  let level = RISK_LEVEL.LOW;
  if (score >= 76) {
    level = RISK_LEVEL.CRITICAL;
  } else if (score >= 51) {
    level = RISK_LEVEL.HIGH;
  } else if (score >= 26) {
    level = RISK_LEVEL.MEDIUM;
  }

  const explanation = `Deterministic risk score calculated as ${score}/100 (${level}) based on ${factors.length} factor(s).`;

  return {
    score,
    level,
    factors,
    explanation,
    isRuleBased: true,
  };
}

module.exports = { calculateRiskScore, RISK_LEVEL };

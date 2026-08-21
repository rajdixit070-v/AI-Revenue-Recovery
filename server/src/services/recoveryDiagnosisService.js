'use strict';

/**
 * Recovery Diagnosis Service
 * Diagnoses root cause, severity, and recoverability of a revenue-at-risk case.
 */

const PROBABLE_CAUSES = {
  PAYMENT_METHOD_FAILURE: 'PAYMENT_METHOD_FAILURE',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  BANK_DECLINE: 'BANK_DECLINE',
  MANDATE_FAILURE: 'MANDATE_FAILURE',
  TEMPORARY_PROVIDER_FAILURE: 'TEMPORARY_PROVIDER_FAILURE',
  CHECKOUT_ABANDONMENT: 'CHECKOUT_ABANDONMENT',
  CUSTOMER_DELAY: 'CUSTOMER_DELAY',
  UNKNOWN: 'UNKNOWN',
};

const RECOVERABILITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  NONE: 'NONE',
};

function diagnoseCase(context = {}) {
  const { recoveryCase, payment, customer, riskAssessment } = context;
  const issue = recoveryCase ? recoveryCase.issueType : 'PAYMENT_FAILURE';

  let probableCause = PROBABLE_CAUSES.UNKNOWN;
  let recoverability = RECOVERABILITY.HIGH;
  let confidence = 0.75;
  const reasoning = [];

  if (issue === 'CHECKOUT_ABANDONMENT') {
    probableCause = PROBABLE_CAUSES.CHECKOUT_ABANDONMENT;
    recoverability = RECOVERABILITY.HIGH;
    reasoning.push('Fact: Customer abandoned checkout process before completion.');
    reasoning.push('Inference: Customer may need a payment link or timely reminder to resume checkout.');
    confidence = 0.85;
  } else if (issue === 'MANDATE_FAILURE') {
    probableCause = PROBABLE_CAUSES.MANDATE_FAILURE;
    recoverability = RECOVERABILITY.MEDIUM;
    reasoning.push('Fact: Recurring mandate execution failed.');
    reasoning.push('Inference: Mandate may be expired, cancelled, or revoked by bank.');
    confidence = 0.80;
  } else if (issue === 'OVERDUE_RECEIVABLE') {
    probableCause = PROBABLE_CAUSES.CUSTOMER_DELAY;
    recoverability = RECOVERABILITY.HIGH;
    reasoning.push('Fact: Invoice or receivable is past due date.');
    reasoning.push('Inference: Delay is likely administrative or cash flow timing.');
    confidence = 0.90;
  } else if (payment) {
    const code = payment.failureCode;
    if (code === 'INSUFFICIENT_FUNDS') {
      probableCause = PROBABLE_CAUSES.INSUFFICIENT_FUNDS;
      recoverability = RECOVERABILITY.HIGH;
      reasoning.push('Fact: Provider returned INSUFFICIENT_FUNDS error code.');
      reasoning.push('Inference: Retry after salary/month-beginning date has high success likelihood.');
      confidence = 0.92;
    } else if (code === 'TIMEOUT' || code === 'TEMPORARY_PROVIDER_FAILURE') {
      probableCause = PROBABLE_CAUSES.TEMPORARY_PROVIDER_FAILURE;
      recoverability = RECOVERABILITY.HIGH;
      reasoning.push('Fact: Provider reported bank network timeout or temporary failure.');
      reasoning.push('Inference: Transient network glitch; immediate retry is safe and recommended.');
      confidence = 0.95;
    } else if (code === 'CARD_DECLINED' || code === 'AUTH_FAILURE') {
      probableCause = PROBABLE_CAUSES.BANK_DECLINE;
      recoverability = RECOVERABILITY.MEDIUM;
      reasoning.push('Fact: Issuing bank declined transaction authentication.');
      reasoning.push('Inference: Card security block or expired credentials. Alternate link needed.');
      confidence = 0.82;
    } else if (code === 'INVALID_CARD' || code === 'ACCOUNT_FROZEN') {
      probableCause = PROBABLE_CAUSES.PAYMENT_METHOD_FAILURE;
      recoverability = RECOVERABILITY.LOW;
      reasoning.push('Fact: Card credentials invalid or account frozen.');
      reasoning.push('Inference: Automated retry on same card will fail. Method update required.');
      confidence = 0.88;
    } else {
      probableCause = PROBABLE_CAUSES.PAYMENT_METHOD_FAILURE;
      reasoning.push(`Fact: Payment failed with code ${code || 'UNSPECIFIED'}.`);
      reasoning.push('Uncertainty: Specific failure root cause could not be pin-pointed with certainty.');
      confidence = 0.65;
    }
  } else {
    reasoning.push('Fact: No detailed payment record attached.');
    reasoning.push('Uncertainty: Diagnosis based solely on case issue category.');
  }

  if (customer && customer.status === 'BLOCKED') {
    recoverability = RECOVERABILITY.NONE;
    reasoning.push('Fact: Customer account is BLOCKED.');
  } else if (riskAssessment && riskAssessment.level === 'CRITICAL' && recoverability === RECOVERABILITY.HIGH) {
    recoverability = RECOVERABILITY.MEDIUM;
    reasoning.push('Inference: Critical overall risk score reduces expected recovery probability.');
  }

  const severity = riskAssessment ? riskAssessment.level : 'MEDIUM';

  return {
    issue,
    probableCause,
    severity,
    recoverability,
    reasoning,
    confidence,
  };
}

module.exports = { diagnoseCase, PROBABLE_CAUSES, RECOVERABILITY };

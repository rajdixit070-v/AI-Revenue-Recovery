'use strict';

/**
 * Deterministic Simulation Provider
 * Simulates payment gateway / customer recovery outcomes reproducibly without calling Razorpay or using Math.random().
 */

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function processSimulatedAction({ recoveryCase, proposedAction, riskAssessment, customer }) {
  const caseId = recoveryCase ? recoveryCase.caseId : 'CASE-000';
  const amountAtRisk = recoveryCase ? recoveryCase.amountAtRisk : 0;
  const issueType = recoveryCase ? recoveryCase.issueType : 'PAYMENT_FAILURE';
  const riskLevel = riskAssessment ? riskAssessment.level : 'LOW';
  const retryCount = recoveryCase ? recoveryCase.retryCount : 0;

  const seed = simpleHash(`${caseId}_${proposedAction}_${retryCount}`);

  // Rule 1: STOP action or Terminal states
  if (proposedAction === 'STOP') {
    return {
      success: false,
      outcome: 'STOPPED',
      recoveredAmount: 0,
      reason: 'Workflow stopped cleanly as requested by policy or decision engine.',
      stoppingRule: 'EXPLICIT_STOP_ACTION',
    };
  }

  // Rule 2: ESCALATE action
  if (proposedAction === 'ESCALATE') {
    return {
      success: false,
      outcome: 'ESCALATED',
      recoveredAmount: 0,
      reason: 'Case escalated for operations human review.',
      stoppingRule: 'ESCALATED_FOR_HUMAN_APPROVAL',
    };
  }

  // Rule 3: Customer is BLOCKED or EXPIRED
  if (customer && customer.status === 'BLOCKED') {
    return {
      success: false,
      outcome: 'STOPPED',
      recoveredAmount: 0,
      reason: 'Customer account is blocked. Recovery stopped.',
      stoppingRule: 'CUSTOMER_BLOCKED',
    };
  }

  // Rule 4: Critical Risk with multiple failures -> Escalate / Not recovered
  if (riskLevel === 'CRITICAL' && retryCount >= 2) {
    return {
      success: false,
      outcome: 'ESCALATED',
      recoveredAmount: 0,
      reason: 'Critical risk level with repeated retry attempts.',
      stoppingRule: 'MAX_RETRIES_EXCEEDED',
    };
  }

  // Rule 5: Deterministic recovery success rules based on issue type and seed
  let isSuccessful = false;

  if (issueType === 'CHECKOUT_ABANDONMENT') {
    // 80% recovery rate on checkout abandonment reminders/payment links
    isSuccessful = (seed % 10) < 8;
  } else if (issueType === 'PAYMENT_FAILURE') {
    if (riskLevel === 'LOW') isSuccessful = (seed % 10) < 9; // 90%
    else if (riskLevel === 'MEDIUM') isSuccessful = (seed % 10) < 7; // 70%
    else if (riskLevel === 'HIGH') isSuccessful = (seed % 10) < 4; // 40%
    else isSuccessful = false;
  } else if (issueType === 'SUBSCRIPTION_FAILURE') {
    isSuccessful = (seed % 10) < 6; // 60%
  } else if (issueType === 'OVERDUE_RECEIVABLE') {
    isSuccessful = (seed % 10) < 5; // 50%
  } else if (issueType === 'MANDATE_FAILURE') {
    isSuccessful = (seed % 10) < 4; // 40%
  }

  if (isSuccessful) {
    return {
      success: true,
      outcome: 'RECOVERED',
      recoveredAmount: amountAtRisk,
      reason: `Simulated action '${proposedAction}' succeeded cleanly for ${issueType}.`,
      stoppingRule: 'RECOVERY_SUCCEEDED',
    };
  }

  return {
    success: false,
    outcome: 'NOT_RECOVERED',
    recoveredAmount: 0,
    reason: `Simulated action '${proposedAction}' failed to collect payment for ${issueType}.`,
    stoppingRule: retryCount >= 2 ? 'MAX_RETRIES_REACHED' : null,
  };
}

module.exports = { processSimulatedAction };

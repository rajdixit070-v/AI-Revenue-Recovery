'use strict';

/**
 * Fallback Decision Engine
 * Deterministic fallback logic to generate recovery recommendations.
 */

const ALLOWED_ACTIONS = ['RETRY_PAYMENT', 'CREATE_PAYMENT_LINK', 'SEND_REMINDER', 'ESCALATE', 'STOP'];

function getFallbackRecommendation(context = {}) {
  const { recoveryCase, customer, riskAssessment, diagnosis, policy } = context;

  if (!recoveryCase) {
    return {
      action: 'STOP',
      priority: 'LOW',
      reason: 'No recovery case provided',
      confidence: 1.0,
      expectedOutcome: 'Workflow stopped',
      requiresHumanApproval: false,
      alternatives: [],
    };
  }

  if (recoveryCase.status === 'RECOVERED' || recoveryCase.recoveredAmount >= recoveryCase.amountAtRisk) {
    return {
      action: 'STOP',
      priority: 'LOW',
      reason: 'Payment already recovered',
      confidence: 1.0,
      expectedOutcome: 'Case marked resolved',
      requiresHumanApproval: false,
      alternatives: [],
    };
  }

  if (customer && customer.status === 'BLOCKED') {
    return {
      action: 'STOP',
      priority: 'HIGH',
      reason: 'Customer account is blocked',
      confidence: 1.0,
      expectedOutcome: 'Recovery terminated due to policy',
      requiresHumanApproval: false,
      alternatives: [],
    };
  }

  if (recoveryCase.recoveryWindowEnd && new Date() > new Date(recoveryCase.recoveryWindowEnd)) {
    return {
      action: 'STOP',
      priority: 'MEDIUM',
      reason: 'Recovery window expired',
      confidence: 1.0,
      expectedOutcome: 'Case marked expired',
      requiresHumanApproval: false,
      alternatives: [],
    };
  }

  const maxRetries = policy ? policy.maxRetries : 3;
  const maxReminders = policy ? policy.maxReminders : 2;
  const maxEscalation = policy ? policy.maxEscalationLevel : 2;

  if (recoveryCase.escalationLevel >= maxEscalation) {
    return {
      action: 'STOP',
      priority: 'HIGH',
      reason: 'Maximum escalation level reached',
      confidence: 0.9,
      expectedOutcome: 'Case closed after maximum escalation',
      requiresHumanApproval: false,
      alternatives: [],
    };
  }

  const issue = recoveryCase.issueType;
  const probableCause = diagnosis ? diagnosis.probableCause : 'UNKNOWN';

  if (issue === 'CHECKOUT_ABANDONMENT' || issue === 'OVERDUE_RECEIVABLE') {
    if (recoveryCase.reminderCount < maxReminders) {
      return {
        action: 'SEND_REMINDER',
        priority: 'MEDIUM',
        reason: 'Send automated reminder for abandoned checkout or overdue payment',
        confidence: 0.85,
        expectedOutcome: 'Customer completes payment via reminder link',
        requiresHumanApproval: false,
        alternatives: ['CREATE_PAYMENT_LINK', 'ESCALATE'],
      };
    } else {
      return {
        action: 'CREATE_PAYMENT_LINK',
        priority: 'HIGH',
        reason: 'Reminder limit reached; generating dedicated payment link',
        confidence: 0.80,
        expectedOutcome: 'Payment link generated for direct settlement',
        requiresHumanApproval: false,
        alternatives: ['ESCALATE'],
      };
    }
  }

  if (probableCause === 'TEMPORARY_PROVIDER_FAILURE' || probableCause === 'INSUFFICIENT_FUNDS') {
    if (recoveryCase.retryCount < maxRetries) {
      return {
        action: 'RETRY_PAYMENT',
        priority: 'HIGH',
        reason: `Temporary or fund failure detected; retry attempt ${recoveryCase.retryCount + 1}/${maxRetries}`,
        confidence: 0.90,
        expectedOutcome: 'Payment retry succeeds',
        requiresHumanApproval: false,
        alternatives: ['CREATE_PAYMENT_LINK'],
      };
    }
  }

  if (probableCause === 'BANK_DECLINE' || probableCause === 'PAYMENT_METHOD_FAILURE') {
    if (recoveryCase.reminderCount < maxReminders) {
      return {
        action: 'CREATE_PAYMENT_LINK',
        priority: 'HIGH',
        reason: 'Card decline or method failure; alternate payment link required',
        confidence: 0.85,
        expectedOutcome: 'Customer provides new payment method via link',
        requiresHumanApproval: false,
        alternatives: ['SEND_REMINDER', 'ESCALATE'],
      };
    }
  }

  if (recoveryCase.retryCount < maxRetries) {
    return {
      action: 'RETRY_PAYMENT',
      priority: 'MEDIUM',
      reason: `Default automated retry attempt ${recoveryCase.retryCount + 1}/${maxRetries}`,
      confidence: 0.75,
      expectedOutcome: 'Transaction retried',
      requiresHumanApproval: false,
      alternatives: ['CREATE_PAYMENT_LINK', 'ESCALATE'],
    };
  }

  if (riskAssessment && (riskAssessment.level === 'HIGH' || riskAssessment.level === 'CRITICAL')) {
    return {
      action: 'ESCALATE',
      priority: 'CRITICAL',
      reason: 'High risk assessment and automated attempts exhausted; escalate for human intervention',
      confidence: 0.95,
      expectedOutcome: 'Escalated to operations team',
      requiresHumanApproval: true,
      alternatives: ['STOP'],
    };
  }

  return {
    action: 'ESCALATE',
    priority: 'HIGH',
    reason: 'Standard retries exhausted; escalating case',
    confidence: 0.80,
    expectedOutcome: 'Case escalated for review',
    requiresHumanApproval: true,
    alternatives: ['STOP'],
  };
}

module.exports = { getFallbackRecommendation, ALLOWED_ACTIONS };

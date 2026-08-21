'use strict';

/**
 * Policy Engine — Safety Guardrail Layer
 */

const ALLOWED_ACTIONS = ['RETRY_PAYMENT', 'CREATE_PAYMENT_LINK', 'SEND_REMINDER', 'ESCALATE', 'STOP'];

function evaluateRecoveryAction(context = {}) {
  const { recoveryCase, proposedAction, policy, customer } = context;

  const violations = [];
  const reasons = [];
  let allowed = true;
  let stoppingRuleTriggered = false;
  let stoppingReason = null;
  let requiresHumanApproval = false;

  if (!proposedAction || !ALLOWED_ACTIONS.includes(proposedAction)) {
    allowed = false;
    violations.push(`Invalid action '${proposedAction}'. Must be one of: ${ALLOWED_ACTIONS.join(', ')}`);
  }

  if (!recoveryCase) {
    return {
      allowed: false,
      action: proposedAction || 'STOP',
      reasons: ['No recovery case provided'],
      violations: ['Missing recoveryCase'],
      stoppingRuleTriggered: true,
      stoppingReason: 'MISSING_CASE',
      requiresHumanApproval: false,
    };
  }

  if (recoveryCase.status === 'RECOVERED' || recoveryCase.recoveredAmount >= recoveryCase.amountAtRisk) {
    allowed = false;
    stoppingRuleTriggered = true;
    stoppingReason = 'PAYMENT_ALREADY_RECOVERED';
    violations.push(`Case is already recovered (${recoveryCase.recoveredAmount}/${recoveryCase.amountAtRisk} paise).`);
  }

  if (customer && (customer.status === 'BLOCKED' || customer.status === 'INACTIVE')) {
    allowed = false;
    stoppingRuleTriggered = true;
    stoppingReason = 'CUSTOMER_BLOCKED_OR_OPTED_OUT';
    violations.push(`Customer is ${customer.status}. Policy forbids active recovery attempts.`);
  }

  if (recoveryCase.recoveryWindowEnd && new Date() > new Date(recoveryCase.recoveryWindowEnd)) {
    allowed = false;
    stoppingRuleTriggered = true;
    stoppingReason = 'RECOVERY_WINDOW_EXPIRED';
    violations.push(`Recovery window expired at ${recoveryCase.recoveryWindowEnd}.`);
  }

  if (['CLOSED', 'EXPIRED'].includes(recoveryCase.status)) {
    allowed = false;
    stoppingRuleTriggered = true;
    stoppingReason = `CASE_ALREADY_${recoveryCase.status}`;
    violations.push(`Case is in terminal state '${recoveryCase.status}'.`);
  }

  const maxRetries = policy ? policy.maxRetries : 3;
  const maxReminders = policy ? policy.maxReminders : 2;
  const maxEscalation = policy ? policy.maxEscalationLevel : 2;

  if (proposedAction === 'RETRY_PAYMENT') {
    if (recoveryCase.retryCount >= maxRetries) {
      allowed = false;
      violations.push(`Max retry count (${maxRetries}) reached for this case.`);
    }
  } else if (proposedAction === 'SEND_REMINDER') {
    if (recoveryCase.reminderCount >= maxReminders) {
      allowed = false;
      violations.push(`Max reminder count (${maxReminders}) reached for this case.`);
    }
  } else if (proposedAction === 'ESCALATE') {
    if (recoveryCase.escalationLevel >= maxEscalation) {
      allowed = false;
      stoppingRuleTriggered = true;
      stoppingReason = 'MAX_ESCALATION_LEVEL_REACHED';
      violations.push(`Max escalation level (${maxEscalation}) reached.`);
    }
    requiresHumanApproval = true;
  }

  if (proposedAction === 'STOP') {
    allowed = true;
    stoppingRuleTriggered = true;
    stoppingReason = stoppingReason || 'ACTION_IS_STOP';
    reasons.push('Action requested is STOP. Workflow will cease.');
  } else if (allowed) {
    reasons.push(`Action '${proposedAction}' complies with recovery policy parameters.`);
  }

  return {
    allowed,
    action: proposedAction,
    reasons,
    violations,
    stoppingRuleTriggered,
    stoppingReason,
    requiresHumanApproval,
  };
}

module.exports = { evaluateRecoveryAction, ALLOWED_ACTIONS };

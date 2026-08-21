'use strict';

/**
 * Recovery State Machine Helper
 */

const VALID_STATES = [
  'OPEN',
  'ANALYZING',
  'ACTION_PENDING',
  'IN_RECOVERY',
  'RECOVERED',
  'ESCALATED',
  'EXPIRED',
  'CLOSED',
];

const ALLOWED_TRANSITIONS = {
  OPEN: ['ANALYZING', 'CLOSED', 'EXPIRED'],
  ANALYZING: ['ACTION_PENDING', 'ESCALATED', 'EXPIRED', 'CLOSED', 'RECOVERED'],
  ACTION_PENDING: ['IN_RECOVERY', 'ESCALATED', 'EXPIRED', 'CLOSED', 'RECOVERED'],
  IN_RECOVERY: ['RECOVERED', 'ACTION_PENDING', 'ESCALATED', 'EXPIRED', 'CLOSED'],
  RECOVERED: ['CLOSED'],
  ESCALATED: ['CLOSED'],
  EXPIRED: ['CLOSED'],
  CLOSED: [],
};

function canTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNext) return false;
  return allowedNext.includes(nextStatus);
}

function transitionState(currentStatus, nextStatus) {
  if (!VALID_STATES.includes(nextStatus)) {
    return { valid: false, error: `Invalid state '${nextStatus}'. Must be one of: ${VALID_STATES.join(', ')}` };
  }
  if (!canTransition(currentStatus, nextStatus)) {
    return { valid: false, error: `Illegal state transition from '${currentStatus}' to '${nextStatus}'.` };
  }
  return { valid: true };
}

module.exports = { transitionState, canTransition, VALID_STATES, ALLOWED_TRANSITIONS };

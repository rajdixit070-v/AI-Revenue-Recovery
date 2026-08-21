'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { transitionState, canTransition } = require('../src/services/stateMachine');

describe('Recovery State Machine', () => {
  test('allows valid OPEN -> ANALYZING transition', () => {
    assert.equal(canTransition('OPEN', 'ANALYZING'), true);
    const res = transitionState('OPEN', 'ANALYZING');
    assert.equal(res.valid, true);
  });

  test('allows valid ANALYZING -> ACTION_PENDING transition', () => {
    assert.equal(canTransition('ANALYZING', 'ACTION_PENDING'), true);
  });

  test('allows valid IN_RECOVERY -> RECOVERED transition', () => {
    assert.equal(canTransition('IN_RECOVERY', 'RECOVERED'), true);
  });

  test('blocks illegal CLOSED -> IN_RECOVERY transition', () => {
    assert.equal(canTransition('CLOSED', 'IN_RECOVERY'), false);
    const res = transitionState('CLOSED', 'IN_RECOVERY');
    assert.equal(res.valid, false);
    assert.ok(res.error.includes('Illegal state transition'));
  });

  test('blocks transition to unknown state', () => {
    const res = transitionState('OPEN', 'SUPER_STATE');
    assert.equal(res.valid, false);
    assert.ok(res.error.includes('Invalid state'));
  });
});

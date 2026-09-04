'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sendRecoveryReminder, NOTIFICATION_CHANNELS } = require('../src/services/notificationService');
const { executeAction } = require('../src/services/actionExecutor');

test('Notification Service & Truthful Simulation (Phase 6)', async (t) => {
  await t.test('supports WhatsApp, Email, and SMS channels', () => {
    assert.deepEqual(NOTIFICATION_CHANNELS, ['WHATSAPP', 'EMAIL', 'SMS']);
  });

  await t.test('returns SIMULATED_QUEUED when no live gateway credentials configured', async () => {
    const res = await sendRecoveryReminder({
      recipient: { phone: '+919876543210', email: 'user@example.com' },
      channel: 'WHATSAPP',
      message: 'Test recovery reminder',
      caseId: 'CASE-TEST-1',
      amount: 499900,
    });

    assert.equal(res.status, 'SIMULATED_QUEUED');
    assert.equal(res.delivered, false);
    assert.equal(res.channel, 'WHATSAPP');
    assert.ok(res.note.includes('simulation'));
    assert.ok(res.providerReference.startsWith('sim_notif_'));
  });

  await t.test('executeAction SEND_REMINDER invokes notificationService without claiming real sent', async () => {
    const mockCase = {
      _id: '507f191e810c19729de860ea',
      caseId: 'CASE-NOTIF-TEST',
      amountAtRisk: 500000,
      recoveredAmount: 0,
      retryCount: 0,
      reminderCount: 0,
      save: async () => {},
    };

    const mockCustomer = {
      name: 'Pooja Verma',
      email: 'pooja@example.com',
      phone: '+919999999999',
    };

    const res = await executeAction('SEND_REMINDER', {
      caseId: mockCase.caseId,
      recoveryCase: mockCase,
      customer: mockCustomer,
    });

    assert.equal(res.executed, true);
    assert.equal(res.action, 'SEND_REMINDER');
    assert.ok(res.notificationResult);
    assert.equal(res.notificationResult.status, 'SIMULATED_QUEUED');
  });
});

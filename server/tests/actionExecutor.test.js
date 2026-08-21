'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { executeAction } = require('../src/services/actionExecutor');

describe('Action Executor (Phase 4 Test Mode)', () => {
  test('rejects execution if target amount is <= 0', async () => {
    const mockCase = { caseId: 'CASE-001', amountAtRisk: 1000, recoveredAmount: 1000 };
    const res = await executeAction('RETRY_PAYMENT', { caseId: 'CASE-001', recoveryCase: mockCase });
    assert.equal(res.executed, false);
    assert.ok(res.reason.includes('already zero or fully recovered'));
  });
});

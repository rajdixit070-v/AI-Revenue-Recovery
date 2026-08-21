'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { BatchEvaluation } = require('../src/models/BatchEvaluation');
const { BatchCaseResult } = require('../src/models/BatchCaseResult');
const { createBatch, runBatch, getBatchReport } = require('../src/services/batchRecoveryService');
const { processSimulatedAction } = require('../src/services/simulationProvider');

describe('Batch Recovery Engine & Evaluation (Phase 7)', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoverai_test');
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('creates evaluation batch cleanly', async () => {
    const batch = await createBatch({ name: 'Test Benchmark Batch', mode: 'SIMULATION', caseLimit: 10 });
    assert.ok(batch.batchId.startsWith('BATCH-'));
    assert.equal(batch.mode, 'SIMULATION');
    assert.equal(batch.status, 'CREATED');
    assert.equal(batch.totalCases, 10);
  });

  test('processSimulatedAction produces deterministic outcomes', () => {
    const context = {
      recoveryCase: { caseId: 'CASE-TEST-101', amountAtRisk: 50000, issueType: 'PAYMENT_FAILURE', retryCount: 0 },
      proposedAction: 'RETRY_PAYMENT',
      riskAssessment: { level: 'LOW', score: 20 },
      customer: { status: 'ACTIVE' },
    };

    const res1 = processSimulatedAction(context);
    const res2 = processSimulatedAction(context);

    assert.equal(res1.outcome, res2.outcome);
    assert.equal(res1.recoveredAmount, res2.recoveredAmount);
  });

  test('runs 10-case evaluation batch and calculates metrics correctly', async () => {
    const batch = await createBatch({ name: 'Run Benchmark', mode: 'SIMULATION', caseLimit: 10 });
    const completedBatch = await runBatch(batch.batchId);

    assert.equal(completedBatch.status, 'COMPLETED');
    assert.equal(completedBatch.processedCases, 10);
    assert.ok(completedBatch.totalAmountAtRisk > 0);
    assert.ok(typeof completedBatch.recoveryRate === 'number');

    const report = await getBatchReport(batch.batchId);
    assert.equal(report.summary.batchId, batch.batchId);
    assert.ok(Array.isArray(report.sampleResults));
  });

  test('idempotency: running completed batch twice does not re-process or duplicate revenue', async () => {
    const batch = await createBatch({ name: 'Idempotency Batch', mode: 'SIMULATION', caseLimit: 5 });
    const firstRun = await runBatch(batch.batchId);
    const firstRecovered = firstRun.totalRecoveredAmount;

    const secondRun = await runBatch(batch.batchId);
    assert.equal(secondRun.totalRecoveredAmount, firstRecovered);
    assert.equal(secondRun.processedCases, 5);
  });
});

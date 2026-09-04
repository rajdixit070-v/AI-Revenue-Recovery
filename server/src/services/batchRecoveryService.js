'use strict';

/**
 * Batch Recovery Engine
 * Manages evaluation batch processing, controlled concurrency, safety, policy checks, simulation execution, and aggregation.
 */

const { BatchEvaluation } = require('../models/BatchEvaluation');
const { BatchCaseResult } = require('../models/BatchCaseResult');
const { RecoveryCase } = require('../models/RecoveryCase');
const { Customer } = require('../models/Customer');
const { Payment } = require('../models/Payment');
const { RecoveryPolicy } = require('../models/RecoveryPolicy');
const { ensureSyntheticDataset } = require('./syntheticDataset');

const { calculateRiskScore } = require('./riskScoringService');
const { diagnoseCase } = require('./recoveryDiagnosisService');
const { getDecision } = require('./ai/aiDecisionService');
const { evaluateRecoveryAction } = require('./policyEngine');
const { processSimulatedAction } = require('./simulationProvider');
const { logAuditEvent } = require('./auditService');

const CONCURRENCY_LIMIT = 5;

async function createBatch({ name = 'Demo Recovery Evaluation', mode = 'SIMULATION', caseLimit = 100 } = {}) {
  const batchId = `BATCH-${Date.now()}`;
  const batch = await BatchEvaluation.create({
    batchId,
    name,
    mode: mode === 'RAZORPAY_TEST' ? 'RAZORPAY_TEST' : 'SIMULATION',
    status: 'CREATED',
    totalCases: caseLimit,
  });
  return batch;
}

async function runBatch(batchId) {
  const batch = await BatchEvaluation.findOne({ batchId });
  if (!batch) throw new Error(`Batch evaluation ${batchId} not found.`);

  if (batch.status === 'COMPLETED') {
    console.log(`[Batch Engine] Batch ${batchId} already completed. Returning existing results.`);
    return batch;
  }

  batch.status = 'RUNNING';
  batch.startedAt = new Date();
  await batch.save();

  // Load target cases (at least 100 synthetic cases)
  const allCases = await ensureSyntheticDataset(batch.totalCases || 100);
  
  // Reset synthetic cases to OPEN state for fresh evaluation run
  await RecoveryCase.updateMany(
    { caseId: /^BATCH-CASE-/ },
    { $set: { status: 'OPEN', recoveredAmount: 0, retryCount: 0, reminderCount: 0, escalationLevel: 0, resolvedAt: null, resolutionReason: null } }
  );

  const cases = allCases.slice(0, batch.totalCases || 100);
  const policy = (await RecoveryPolicy.findOne({ enabled: true })) || (await RecoveryPolicy.findOne());

  console.log(`[Batch Engine] Starting batch ${batchId} processing ${cases.length} cases (Concurrency: ${CONCURRENCY_LIMIT})...`);

  // Controlled concurrency batching
  for (let i = 0; i < cases.length; i += CONCURRENCY_LIMIT) {
    const chunk = cases.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map(c => processSingleBatchCase(batch, c, policy)));
  }

  // Final aggregations
  const results = await BatchCaseResult.find({ batchId }).lean();

  let totalAtRisk = 0;
  let totalRecovered = 0;
  let successCount = 0;
  let failCount = 0;
  let escalatedCount = 0;
  let stoppedCount = 0;
  let blockedCount = 0;
  let aiCount = 0;
  let fallbackCount = 0;

  results.forEach(r => {
    totalAtRisk += r.initialAmountAtRisk || 0;
    totalRecovered += r.finalRecoveredAmount || 0;

    if (r.outcome === 'RECOVERED') successCount++;
    else if (r.outcome === 'NOT_RECOVERED') failCount++;
    else if (r.outcome === 'ESCALATED') escalatedCount++;
    else if (r.outcome === 'STOPPED') stoppedCount++;
    else if (r.outcome === 'POLICY_BLOCKED') blockedCount++;

    if (r.decisionSource === 'AI') aiCount++;
    else fallbackCount++;
  });

  const totalCasesProcessed = results.length;
  const revenueRecoveryRate = totalAtRisk > 0 ? Number(((totalRecovered / totalAtRisk) * 100).toFixed(1)) : 0;
  const caseRecoveryRate = totalCasesProcessed > 0 ? Number(((successCount / totalCasesProcessed) * 100).toFixed(1)) : 0;

  batch.status = 'COMPLETED';
  batch.processedCases = totalCasesProcessed;
  batch.successfulRecoveries = successCount;
  batch.failedRecoveries = failCount;
  batch.escalatedCases = escalatedCount;
  batch.stoppedCases = stoppedCount;
  batch.policyBlockedCases = blockedCount;
  batch.totalAmountAtRisk = totalAtRisk;
  batch.totalRecoveredAmount = totalRecovered;
  batch.recoveryRate = revenueRecoveryRate;
  batch.caseRecoveryRate = caseRecoveryRate;
  batch.aiDecisionCount = aiCount;
  batch.fallbackDecisionCount = fallbackCount;
  batch.completedAt = new Date();

  await batch.save();
  console.log(`[Batch Engine] Batch ${batchId} completed successfully. Revenue Recovery Rate: ${revenueRecoveryRate}%.`);

  return batch;
}

async function processSingleBatchCase(batch, caseItem, policy) {
  const startTime = Date.now();
  const caseId = caseItem.caseId;

  // Idempotency check: Skip if already processed for this batch
  const existingResult = await BatchCaseResult.findOne({ batchId: batch.batchId, caseId });
  if (existingResult) return existingResult;

  let outcome = 'NOT_RECOVERED';
  let finalStatus = 'CLOSED';
  let recoveredAmount = 0;
  let finalAction = 'STOP';
  let decisionSource = 'FALLBACK';
  let policyAllowed = true;
  let stoppingRule = null;
  let errorMsg = null;

  try {
    const recoveryCase = await RecoveryCase.findById(caseItem._id);
    const customer = await Customer.findById(recoveryCase.customerId);
    const payment = recoveryCase.paymentId ? await Payment.findById(recoveryCase.paymentId) : null;

    // 1. Audit BATCH_CASE_STARTED
    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: 'BATCH_CASE_STARTED',
      actorType: 'SYSTEM',
      message: `Batch ${batch.batchId} case evaluation started`,
      metadata: { batchId: batch.batchId },
    }).catch(() => {});

    // 2. Risk Calculation & Diagnosis
    const riskAssessment = calculateRiskScore({ amountAtRisk: recoveryCase.amountAtRisk, payment, customer, recoveryCase });
    const diagnosis = diagnoseCase({ recoveryCase, payment, customer, riskAssessment });

    // 3. AI / Decision Service (Uses optimized simulation model for high-throughput batch evaluation)
    const aiResult = await getDecision({ recoveryCase, payment, customer, riskAssessment, diagnosis, policy, forceSimulation: true });
    const decision = aiResult.decision;
    decisionSource = aiResult.isFallback ? 'FALLBACK' : 'AI';

    // 4. Policy Engine Check
    const policyDecision = evaluateRecoveryAction({ recoveryCase, proposedAction: decision.action, policy, customer });
    policyAllowed = policyDecision.allowed;

    if (!policyAllowed) {
      outcome = 'POLICY_BLOCKED';
      finalStatus = 'STOPPED';
      finalAction = 'STOP';
      stoppingRule = 'POLICY_DENIED';

      await logAuditEvent({
        caseId: recoveryCase._id,
        eventType: 'RECOVERY_ACTION_BLOCKED',
        actorType: 'SYSTEM',
        message: `Action '${decision.action}' blocked by policy in batch evaluation`,
        reason: policyDecision.violations.join('; '),
      }).catch(() => {});
    } else {
      // 5. Action Execution (Simulation Mode)
      const simResult = processSimulatedAction({ recoveryCase, proposedAction: decision.action, riskAssessment, customer });
      finalAction = decision.action;
      outcome = simResult.outcome;
      recoveredAmount = simResult.recoveredAmount;
      stoppingRule = simResult.stoppingRule;

      if (simResult.success) {
        finalStatus = 'RECOVERED';
        recoveryCase.status = 'RECOVERED';
        recoveryCase.recoveredAmount = recoveredAmount;
        await recoveryCase.save();

        await logAuditEvent({
          caseId: recoveryCase._id,
          eventType: 'PAYMENT_RECOVERY_CONFIRMED',
          actorType: 'SYSTEM',
          message: `Simulated recovery succeeded for case ${caseId}. Amount: ₹${recoveredAmount / 100}`,
        }).catch(() => {});
      } else if (outcome === 'ESCALATED') {
        finalStatus = 'ESCALATED';
        recoveryCase.status = 'ESCALATED';
        await recoveryCase.save();
      } else {
        finalStatus = 'CLOSED';
        recoveryCase.status = 'CLOSED';
        await recoveryCase.save();
      }
    }

    // Audit BATCH_CASE_COMPLETED
    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: 'BATCH_CASE_COMPLETED',
      actorType: 'SYSTEM',
      message: `Batch case completed with outcome '${outcome}'`,
      metadata: { outcome, finalStatus, recoveredAmount },
    }).catch(() => {});

  } catch (err) {
    console.error(`[Batch Engine Error] Case ${caseId}:`, err.message);
    outcome = 'ERROR';
    finalStatus = 'CLOSED';
    errorMsg = err.message;
  }

  const durationMs = Date.now() - startTime;

  const result = await BatchCaseResult.create({
    batchId: batch.batchId,
    caseId,
    initialAmountAtRisk: caseItem.amountAtRisk || 0,
    finalRecoveredAmount: recoveredAmount,
    finalStatus,
    riskLevel: caseItem.riskLevel || 'LOW',
    issueType: caseItem.issueType || 'PAYMENT_FAILURE',
    recommendedAction: caseItem.recommendedAction || 'RETRY_PAYMENT',
    finalAction,
    decisionSource,
    policyAllowed,
    stoppingRule,
    outcome,
    error: errorMsg,
    durationMs,
  });

  return result;
}

async function getBatchReport(batchId) {
  const batch = await BatchEvaluation.findOne({ batchId }).lean();
  if (!batch) throw new Error(`Batch evaluation ${batchId} not found.`);

  const results = await BatchCaseResult.find({ batchId }).lean();

  const byIssueType = {};
  const byRiskLevel = {};
  const byAction = {};
  const exceptions = {};

  results.forEach(r => {
    byIssueType[r.issueType] = (byIssueType[r.issueType] || 0) + 1;
    byRiskLevel[r.riskLevel] = (byRiskLevel[r.riskLevel] || 0) + 1;
    byAction[r.finalAction] = (byAction[r.finalAction] || 0) + 1;
    if (r.error) exceptions[r.error] = (exceptions[r.error] || 0) + 1;
  });

  return {
    summary: batch,
    breakdowns: {
      byIssueType,
      byRiskLevel,
      byAction,
      exceptions,
    },
    sampleResults: results.slice(0, 20),
  };
}

module.exports = {
  createBatch,
  runBatch,
  getBatchReport,
};

'use strict';

/**
 * Recovery Orchestrator Service
 */

const { RecoveryCase } = require('../models/RecoveryCase');
const { Customer } = require('../models/Customer');
const { Payment } = require('../models/Payment');
const { RecoveryPolicy } = require('../models/RecoveryPolicy');

const { calculateRiskScore } = require('./riskScoringService');
const { diagnoseCase } = require('./recoveryDiagnosisService');
const { generateRecommendation } = require('./aiDecisionEngine');
const { evaluateRecoveryAction } = require('./policyEngine');
const { transitionState } = require('./stateMachine');
const { logAuditEvent } = require('./auditService');

async function analyzeRecoveryCase(caseIdOrDoc) {
  let recoveryCase = null;

  if (typeof caseIdOrDoc === 'string') {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(caseIdOrDoc);
    recoveryCase = await RecoveryCase.findOne(
      isObjectId ? { $or: [{ caseId: caseIdOrDoc }, { _id: caseIdOrDoc }] } : { caseId: caseIdOrDoc }
    );
  } else {
    recoveryCase = caseIdOrDoc;
  }

  if (!recoveryCase) {
    throw new Error(`Recovery case '${caseIdOrDoc}' not found.`);
  }

  const customer = await Customer.findById(recoveryCase.customerId);
  const payment = recoveryCase.paymentId ? await Payment.findById(recoveryCase.paymentId) : null;
  const policy = (await RecoveryPolicy.findOne({ enabled: true })) || (await RecoveryPolicy.findOne());

  const previousStatus = recoveryCase.status;

  if (['CLOSED', 'RECOVERED', 'EXPIRED'].includes(previousStatus)) {
    return {
      case: recoveryCase,
      stopped: true,
      stoppingReason: `CASE_ALREADY_${previousStatus}`,
      plan: null,
      message: `Case is in terminal state '${previousStatus}'. No analysis needed.`,
    };
  }

  const transAnalyzing = transitionState(previousStatus, 'ANALYZING');
  if (transAnalyzing.valid && previousStatus !== 'ANALYZING') {
    recoveryCase.status = 'ANALYZING';
    await recoveryCase.save();
    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: 'CASE_ANALYSIS_STARTED',
      actorType: 'SYSTEM',
      message: `Analysis started for case ${recoveryCase.caseId}`,
      previousState: previousStatus,
      newState: 'ANALYZING',
    });
  }

  // Risk Scoring
  const risk = calculateRiskScore({
    amountAtRisk: recoveryCase.amountAtRisk,
    payment,
    customer,
    recoveryCase,
  });

  recoveryCase.riskScore = risk.score;
  recoveryCase.riskLevel = risk.level;

  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: 'RISK_CALCULATED',
    actorType: 'SYSTEM',
    message: `Risk score calculated: ${risk.score} (${risk.level})`,
    metadata: { score: risk.score, level: risk.level, factorsCount: risk.factors.length },
  });

  // Diagnosis
  const diagnosis = diagnoseCase({
    recoveryCase,
    payment,
    customer,
    riskAssessment: risk,
  });

  recoveryCase.diagnosis = diagnosis.reasoning.join(' ');
  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: 'DIAGNOSIS_COMPLETED',
    actorType: 'SYSTEM',
    message: `Diagnosis completed: ${diagnosis.probableCause}`,
    metadata: { probableCause: diagnosis.probableCause, recoverability: diagnosis.recoverability },
  });

  // Recommendation
  const recommendation = await generateRecommendation({
    recoveryCase,
    payment,
    customer,
    riskAssessment: risk,
    diagnosis,
    policy,
  });

  recoveryCase.recommendedAction = recommendation.action;
  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: 'ACTION_RECOMMENDED',
    actorType: 'AI_AGENT',
    message: `Recommended action: ${recommendation.action}`,
    reason: recommendation.reason,
    metadata: { action: recommendation.action, confidence: recommendation.confidence },
  });

  // Policy Evaluation
  const policyDecision = evaluateRecoveryAction({
    recoveryCase,
    proposedAction: recommendation.action,
    policy,
    customer,
  });

  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: 'POLICY_CHECKED',
    actorType: 'SYSTEM',
    message: `Policy check result for ${recommendation.action}: allowed=${policyDecision.allowed}`,
    reason: policyDecision.allowed ? 'Policy passed' : policyDecision.violations.join('; '),
    metadata: { allowed: policyDecision.allowed, violations: policyDecision.violations },
  });

  let nextAction = policyDecision.allowed ? recommendation.action : 'STOP';
  let nextState = 'ACTION_PENDING';

  if (!policyDecision.allowed || policyDecision.stoppingRuleTriggered || nextAction === 'STOP') {
    nextAction = 'STOP';
    if (policyDecision.stoppingReason === 'PAYMENT_ALREADY_RECOVERED') {
      nextState = 'RECOVERED';
    } else if (policyDecision.stoppingReason === 'RECOVERY_WINDOW_EXPIRED') {
      nextState = 'EXPIRED';
    } else if (policyDecision.stoppingReason === 'MAX_ESCALATION_LEVEL_REACHED' || recommendation.action === 'ESCALATE') {
      nextState = 'ESCALATED';
    } else {
      nextState = 'ACTION_PENDING';
    }

    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: policyDecision.stoppingRuleTriggered ? 'STOPPING_RULE_TRIGGERED' : 'ACTION_BLOCKED',
      actorType: 'SYSTEM',
      message: `Action ${recommendation.action} blocked or stopped. Reasoning: ${policyDecision.violations.join(', ') || policyDecision.stoppingReason}`,
      reason: policyDecision.stoppingReason,
    });
  }

  const recoveryPlan = {
    caseId: recoveryCase.caseId,
    risk,
    diagnosis,
    recommendation,
    policyDecision,
    nextAction,
    stoppingRules: {
      triggered: policyDecision.stoppingRuleTriggered,
      reason: policyDecision.stoppingReason,
    },
    requiresHumanApproval: recommendation.requiresHumanApproval || policyDecision.requiresHumanApproval,
    createdAt: new Date().toISOString(),
  };

  const transNext = transitionState(recoveryCase.status, nextState);
  if (transNext.valid) {
    recoveryCase.status = nextState;
  }
  await recoveryCase.save();

  await logAuditEvent({
    caseId: recoveryCase._id,
    eventType: 'RECOVERY_PLAN_CREATED',
    actorType: 'SYSTEM',
    message: `Recovery plan generated for case ${recoveryCase.caseId}`,
    newState: recoveryCase.status,
    metadata: { nextAction, requiresHumanApproval: recoveryPlan.requiresHumanApproval },
  });

  return {
    case: recoveryCase,
    risk,
    diagnosis,
    recommendation,
    policyDecision,
    recoveryPlan,
  };
}

module.exports = { analyzeRecoveryCase };

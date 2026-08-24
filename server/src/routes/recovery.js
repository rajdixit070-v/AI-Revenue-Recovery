'use strict';

const express = require('express');
const { RecoveryCase } = require('../models/RecoveryCase');
const { RecoveryPolicy } = require('../models/RecoveryPolicy');
const { Customer } = require('../models/Customer');
const { Payment } = require('../models/Payment');
const { AuditLog } = require('../models/AuditLog');

const { createError } = require('../middleware/errorHandler');
const { analyzeRecoveryCase } = require('../services/recoveryOrchestrator');
const { executeAction } = require('../services/actionExecutor');
const { evaluateRecoveryAction, ALLOWED_ACTIONS } = require('../services/policyEngine');
const { logAuditEvent } = require('../services/auditService');
const { getDecision } = require('../services/ai/aiDecisionService');

const router = express.Router();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/recovery/metrics
 * Returns real calculated recovery dashboard metrics from MongoDB database
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const activeStatuses = ['OPEN', 'ANALYZING', 'ACTION_PENDING', 'IN_RECOVERY'];

    const [allCases, payments, blockedAuditLogs] = await Promise.all([
      RecoveryCase.find().populate('customerId', 'name email').populate('paymentId').lean(),
      Payment.find().lean(),
      AuditLog.find({ eventType: 'RECOVERY_ACTION_BLOCKED' }).lean(),
    ]);

    let revenueAtRisk = 0;
    let recoveredRevenue = 0;
    let openCases = 0;
    let highRiskCases = 0;
    let criticalRiskCases = 0;
    let escalatedCases = 0;

    const casesByRiskLevel = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const casesByStatus = { OPEN: 0, ANALYZING: 0, ACTION_PENDING: 0, IN_RECOVERY: 0, RECOVERED: 0, ESCALATED: 0, EXPIRED: 0, CLOSED: 0 };
    const casesByIssueType = {};

    allCases.forEach(rc => {
      const atRisk = Math.max(0, (rc.amountAtRisk || 0) - (rc.recoveredAmount || 0));
      const recovered = rc.recoveredAmount || 0;

      if (activeStatuses.includes(rc.status)) {
        revenueAtRisk += atRisk;
        openCases += 1;
      }
      recoveredRevenue += recovered;

      if (rc.riskLevel === 'HIGH') highRiskCases += 1;
      if (rc.riskLevel === 'CRITICAL') criticalRiskCases += 1;
      if (rc.status === 'ESCALATED') escalatedCases += 1;

      if (rc.riskLevel && casesByRiskLevel[rc.riskLevel] !== undefined) casesByRiskLevel[rc.riskLevel]++;
      if (rc.status && casesByStatus[rc.status] !== undefined) casesByStatus[rc.status]++;

      const issue = rc.issueType || 'OTHER';
      casesByIssueType[issue] = (casesByIssueType[issue] || 0) + 1;
    });

    const failedPayments = payments.filter(p => p.status === 'FAILED').length;
    const policyBlockedCases = blockedAuditLogs.length;

    const totalEligible = revenueAtRisk + recoveredRevenue;
    const revenueRecoveryRate = totalEligible > 0 ? Number(((recoveredRevenue / totalEligible) * 100).toFixed(1)) : 0;
    const totalCases = allCases.length;
    const caseRecoveryRate = totalCases > 0 ? Number(((casesByStatus.RECOVERED / totalCases) * 100).toFixed(1)) : 0;

    const needsAttention = allCases
      .filter(rc => rc.status === 'ESCALATED' || ['CRITICAL', 'HIGH'].includes(rc.riskLevel))
      .slice(0, 10);

    const isRazorpayConfigured = !!process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('your_');
    const environment = isRazorpayConfigured ? 'RAZORPAY TEST MODE' : 'SIMULATION MODE';

    res.json({
      data: {
        revenueAtRisk,
        recoveredRevenue,
        revenueRecoveryRate,
        caseRecoveryRate,
        openCases,
        totalCases,
        highRiskCases,
        criticalRiskCases,
        failedPayments,
        escalatedCases,
        policyBlockedCases,
        needsAttention,
        casesByRiskLevel,
        casesByStatus,
        casesByIssueType,
        environment,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/at-risk', async (req, res, next) => {
  try {
    const activeStatuses = ['OPEN', 'ANALYZING', 'ACTION_PENDING', 'IN_RECOVERY', 'ESCALATED'];
    const cases = await RecoveryCase.find({ status: { $in: activeStatuses } })
      .populate('customerId', 'name email status lifetimeValue successfulPayments failedPayments')
      .populate('paymentId', 'amount currency status failureReason paymentMethod attemptCount')
      .sort({ riskScore: -1, amountAtRisk: -1 })
      .lean();

    res.json({
      status: 'success',
      data: cases,
      total: cases.length,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/cases', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    if (req.query.issueType) filter.issueType = req.query.issueType;

    const [cases, total] = await Promise.all([
      RecoveryCase.find(filter)
        .populate('customerId', 'name email')
        .populate('paymentId', 'amount currency status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RecoveryCase.countDocuments(filter),
    ]);

    res.json({
      data: cases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/cases/:id', async (req, res, next) => {
  try {
    const recoveryCase = await RecoveryCase.findOne({
      $or: [{ caseId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    })
      .populate('customerId', 'name email phone status lifetimeValue successfulPayments failedPayments')
      .populate('paymentId')
      .lean();

    if (!recoveryCase) return next(createError('Recovery case not found', 404));

    const auditLogs = await AuditLog.find({ caseId: recoveryCase._id }).sort({ timestamp: -1 }).lean();

    res.json({
      data: {
        ...recoveryCase,
        auditLogs,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/policies', async (req, res, next) => {
  try {
    const policies = await RecoveryPolicy.find().lean();
    res.json({ data: policies });
  } catch (err) {
    next(err);
  }
});

router.post('/cases/:caseId/analyze', async (req, res, next) => {
  try {
    const result = await analyzeRecoveryCase(req.params.caseId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return next(createError(err.message, 404));
    }
    next(err);
  }
});

router.get('/cases/:caseId/plan', async (req, res, next) => {
  try {
    const result = await analyzeRecoveryCase(req.params.caseId);
    res.json({
      status: 'success',
      data: {
        caseId: result.case.caseId,
        status: result.case.status,
        recoveryPlan: result.recoveryPlan,
      },
    });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return next(createError(err.message, 404));
    }
    next(err);
  }
});

router.post('/cases/:caseId/ai-analyze', async (req, res, next) => {
  try {
    const caseId = req.params.caseId;
    const recoveryCase = await RecoveryCase.findOne({
      $or: [{ caseId }, { _id: caseId.match(/^[0-9a-fA-F]{24}$/) ? caseId : null }],
    });

    if (!recoveryCase) return next(createError('Recovery case not found', 404));

    const customer = await Customer.findById(recoveryCase.customerId);
    const payment = recoveryCase.paymentId ? await Payment.findById(recoveryCase.paymentId) : null;
    const policy = (await RecoveryPolicy.findOne({ enabled: true })) || (await RecoveryPolicy.findOne());

    const { calculateRiskScore } = require('../services/riskScoringService');
    const { diagnoseCase } = require('../services/recoveryDiagnosisService');

    const risk = calculateRiskScore({ amountAtRisk: recoveryCase.amountAtRisk, payment, customer, recoveryCase });
    const calculatedScore = typeof risk.score === 'number' ? risk.score : (risk.riskScore || 20);
    const calculatedLevel = risk.level || risk.riskLevel || recoveryCase.riskLevel || 'LOW';

    // Normalize risk object for response
    risk.riskScore = calculatedScore;
    risk.riskLevel = calculatedLevel;

    const diagnosis = diagnoseCase({ recoveryCase, payment, customer, riskAssessment: risk });

    const aiResult = await getDecision({ recoveryCase, payment, customer, riskAssessment: risk, diagnosis, policy });
    const policyDecision = evaluateRecoveryAction({ recoveryCase, proposedAction: aiResult.decision.action, policy, customer });

    // Persist AI findings and bounded action directly to recoveryCase document
    recoveryCase.riskScore = calculatedScore;
    recoveryCase.riskLevel = calculatedLevel;
    recoveryCase.recommendedAction = policyDecision.allowed ? aiResult.decision.action : 'STOP';
    recoveryCase.diagnosis = diagnosis.probableCause || diagnosis.reasoning;
    if (['OPEN', 'ANALYZING'].includes(recoveryCase.status)) {
      recoveryCase.status = 'ACTION_PENDING';
    }
    await recoveryCase.save();

    await logAuditEvent({
      caseId: recoveryCase._id,
      eventType: 'AI_ANALYSIS_COMPLETED',
      actorType: 'AI_AGENT',
      message: `AI re-analyzed case: ${recoveryCase.recommendedAction} (Confidence: ${Math.round((aiResult.decision.confidence || 0.85) * 100)}%)`,
      reason: diagnosis.probableCause,
      metadata: {
        diagnosis: diagnosis.probableCause,
        strategy: diagnosis.recommendedStrategy,
        confidence: aiResult.decision.confidence,
        signals: diagnosis.signals,
      },
    });

    res.json({
      status: 'success',
      data: {
        caseId: recoveryCase.caseId,
        risk,
        diagnosis,
        aiDecision: aiResult,
        policyDecision,
        finalRecommendation: {
          action: policyDecision.allowed ? aiResult.decision.action : 'STOP',
          allowedByPolicy: policyDecision.allowed,
          violations: policyDecision.violations,
        },
        executionAllowed: policyDecision.allowed,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/cases/:caseId/execute', async (req, res, next) => {
  try {
    const caseId = req.params.caseId;
    const recoveryCase = await RecoveryCase.findOne({
      $or: [{ caseId }, { _id: caseId.match(/^[0-9a-fA-F]{24}$/) ? caseId : null }],
    });

    if (!recoveryCase) return next(createError('Recovery case not found', 404));

    const customer = await Customer.findById(recoveryCase.customerId);
    const payment = recoveryCase.paymentId ? await Payment.findById(recoveryCase.paymentId) : null;
    const policy = (await RecoveryPolicy.findOne({ enabled: true })) || (await RecoveryPolicy.findOne());

    const proposedAction = req.body.action || recoveryCase.recommendedAction || 'RETRY_PAYMENT';

    const policyDecision = evaluateRecoveryAction({
      recoveryCase,
      proposedAction,
      policy,
      customer,
    });

    if (!policyDecision.allowed) {
      await logAuditEvent({
        caseId: recoveryCase._id,
        eventType: 'RECOVERY_ACTION_BLOCKED',
        actorType: 'SYSTEM',
        message: `Action '${proposedAction}' denied by policy engine`,
        reason: policyDecision.violations.join('; '),
        metadata: { violations: policyDecision.violations },
      });

      return res.status(403).json({
        status: 'denied',
        message: 'Action denied by Recovery Policy Engine',
        policyDecision,
      });
    }

    const result = await executeAction(proposedAction, {
      caseId: recoveryCase.caseId,
      recoveryCase,
      customer,
      payment,
    });

    // Advance status to IN_RECOVERY if not already terminal
    if (!['RECOVERED', 'CLOSED', 'EXPIRED'].includes(recoveryCase.status)) {
      recoveryCase.status = 'IN_RECOVERY';
      await recoveryCase.save();
    }

    res.json({
      status: 'success',
      message: `Recovery action '${proposedAction}' executed successfully in Test Mode. Reference: ${result.providerReference || 'N/A'}`,
      data: {
        caseId: recoveryCase.caseId,
        action: proposedAction,
        status: recoveryCase.status,
        execution: result,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/cases/:caseId/simulate-action', async (req, res, next) => {
  try {
    const { action } = req.body;
    const caseId = req.params.caseId;

    const recoveryCase = await RecoveryCase.findOne({
      $or: [{ caseId }, { _id: caseId.match(/^[0-9a-fA-F]{24}$/) ? caseId : null }],
    });

    if (!recoveryCase) return next(createError('Recovery case not found', 404));

    const targetAction = action || recoveryCase.recommendedAction || 'RETRY_PAYMENT';

    if (!ALLOWED_ACTIONS.includes(targetAction)) {
      return next(createError(`Invalid action '${targetAction}'. Must be one of: ${ALLOWED_ACTIONS.join(', ')}`, 400));
    }

    const executionResult = await executeAction(targetAction, {
      caseId: recoveryCase.caseId,
      recoveryCase,
    });

    res.json({
      status: 'success',
      message: 'Simulated recovery action processed cleanly',
      data: {
        caseId: recoveryCase.caseId,
        action: targetAction,
        result: executionResult,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

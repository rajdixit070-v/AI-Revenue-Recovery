'use strict';

const { RecoveryCase } = require('../models/RecoveryCase');
const { Payment } = require('../models/Payment');
const { AuditLog } = require('../models/AuditLog');
const { BatchEvaluation } = require('../models/BatchEvaluation');
const { createBatch, runBatch } = require('./batchRecoveryService');

const APPROVED_TOOLS = [
  {
    name: 'get_dashboard_metrics',
    description: 'Retrieves current RecoverAI platform metrics (revenue at risk, recovered revenue, recovery rate, case counts).',
    readOnly: true,
    financialImpact: false,
    execute: async () => {
      const cases = await RecoveryCase.find({});
      let revenueAtRisk = 0;
      let recoveredRevenue = 0;
      let openCases = 0;
      let highRiskCases = 0;

      cases.forEach(c => {
        if (c.status === 'RECOVERED') {
          recoveredRevenue += (c.recoveredAmount || 0);
        } else if (c.status !== 'CLOSED' && c.status !== 'EXPIRED' && c.status !== 'STOPPED') {
          revenueAtRisk += (c.amountAtRisk || 0);
          openCases += 1;
        }
        if (['HIGH', 'CRITICAL'].includes(c.riskLevel)) {
          highRiskCases += 1;
        }
      });

      const totalAtRiskAll = revenueAtRisk + recoveredRevenue;
      const revenueRecoveryRate = totalAtRiskAll > 0 ? Number(((recoveredRevenue / totalAtRiskAll) * 100).toFixed(1)) : 0;

      return {
        revenueAtRisk,
        recoveredRevenue,
        revenueRecoveryRate,
        openCases,
        totalCases: cases.length,
        highRiskCases,
        mode: process.env.RAZORPAY_KEY_ID ? 'RAZORPAY TEST MODE' : 'SIMULATION MODE',
      };
    },
  },
  {
    name: 'get_recovery_cases',
    description: 'Retrieves list of recovery cases with optional status or risk level filtering.',
    readOnly: true,
    financialImpact: false,
    execute: async (params = {}) => {
      const query = {};
      if (params.status) query.status = params.status;
      if (params.riskLevel) query.riskLevel = params.riskLevel;

      const cases = await RecoveryCase.find(query)
        .populate('customerId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(params.limit || 20);

      return cases.map(c => ({
        caseId: c.caseId,
        customerName: c.customerId?.name || 'Customer',
        issueType: c.issueType,
        amountAtRisk: c.amountAtRisk,
        recoveredAmount: c.recoveredAmount,
        status: c.status,
        riskLevel: c.riskLevel,
        riskScore: c.riskScore,
        retryCount: c.retryCount,
      }));
    },
  },
  {
    name: 'get_recovery_case',
    description: 'Retrieves comprehensive details for a specific recovery case by caseId.',
    readOnly: true,
    financialImpact: false,
    execute: async (params = {}) => {
      if (!params.caseId) throw new Error('caseId parameter is required');
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.caseId);
      const c = await RecoveryCase.findOne(
        isObjectId ? { $or: [{ caseId: params.caseId }, { _id: params.caseId }] } : { caseId: params.caseId }
      ).populate('customerId paymentId');

      if (!c) throw new Error(`Recovery case '${params.caseId}' not found.`);

      const auditLogs = await AuditLog.find({ caseId: c._id }).sort({ timestamp: -1 }).limit(10);

      return {
        caseId: c.caseId,
        customer: c.customerId ? { name: c.customerId.name, email: c.customerId.email } : null,
        payment: c.paymentId ? { amount: c.paymentId.amount, method: c.paymentId.paymentMethod, failureReason: c.paymentId.failureReason } : null,
        issueType: c.issueType,
        amountAtRisk: c.amountAtRisk,
        recoveredAmount: c.recoveredAmount,
        status: c.status,
        riskLevel: c.riskLevel,
        riskScore: c.riskScore,
        retryCount: c.retryCount,
        auditTimeline: auditLogs.map(l => ({ eventType: l.eventType, message: l.message, timestamp: l.timestamp })),
      };
    },
  },
  {
    name: 'get_evaluation_summary',
    description: 'Retrieves latest batch evaluation benchmark summary metrics.',
    readOnly: true,
    financialImpact: false,
    execute: async () => {
      const latestBatch = await BatchEvaluation.findOne({}).sort({ createdAt: -1 });
      if (!latestBatch) {
        return { message: 'No batch evaluations have been executed yet.' };
      }
      return {
        batchId: latestBatch.batchId,
        name: latestBatch.name,
        totalCases: latestBatch.totalCases,
        totalAmountAtRisk: latestBatch.totalAmountAtRisk,
        totalRecoveredAmount: latestBatch.totalRecoveredAmount,
        revenueRecoveryRate: latestBatch.revenueRecoveryRate,
        caseRecoveryRate: latestBatch.caseRecoveryRate,
        status: latestBatch.status,
      };
    },
  },
  {
    name: 'run_demo_evaluation',
    description: 'Triggers a synthetic 100-case evaluation benchmark in simulation mode.',
    readOnly: false,
    financialImpact: false, // Safe non-financial simulation benchmark
    execute: async (params = {}) => {
      const limit = params.caseLimit || 10;
      const batch = await createBatch({ name: 'Copilot Triggered Evaluation', mode: 'SIMULATION', caseLimit: limit });
      const result = await runBatch(batch.batchId);
      return {
        batchId: result.batch.batchId,
        totalCases: result.batch.totalCases,
        revenueRecoveryRate: result.batch.revenueRecoveryRate,
        totalRecoveredAmount: result.batch.totalRecoveredAmount,
        status: result.batch.status,
      };
    },
  },
];

module.exports = { APPROVED_TOOLS };

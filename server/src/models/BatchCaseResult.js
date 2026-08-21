'use strict';

const mongoose = require('mongoose');

const batchCaseResultSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, index: true },
    caseId: { type: String, required: true, index: true },
    initialAmountAtRisk: { type: Number, default: 0 },
    finalRecoveredAmount: { type: Number, default: 0 },
    finalStatus: { type: String, required: true },
    riskLevel: { type: String, default: 'LOW' },
    issueType: { type: String, default: 'PAYMENT_FAILURE' },
    recommendedAction: { type: String, default: 'RETRY_PAYMENT' },
    finalAction: { type: String, default: 'STOP' },
    decisionSource: { type: String, enum: ['AI', 'FALLBACK', 'RULE'], default: 'FALLBACK' },
    policyAllowed: { type: Boolean, default: true },
    stoppingRule: { type: String, default: null },
    outcome: {
      type: String,
      enum: ['RECOVERED', 'NOT_RECOVERED', 'ESCALATED', 'STOPPED', 'POLICY_BLOCKED', 'ERROR'],
      required: true,
    },
    error: { type: String, default: null },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

batchCaseResultSchema.index({ batchId: 1, caseId: 1 }, { unique: true });

const BatchCaseResult = mongoose.model('BatchCaseResult', batchCaseResultSchema);

module.exports = { BatchCaseResult };

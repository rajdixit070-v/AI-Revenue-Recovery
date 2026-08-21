'use strict';

const mongoose = require('mongoose');

const batchEvaluationSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Batch Recovery Evaluation' },
    mode: { type: String, enum: ['SIMULATION', 'RAZORPAY_TEST'], default: 'SIMULATION' },
    status: { type: String, enum: ['CREATED', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'CREATED' },
    totalCases: { type: Number, default: 0 },
    processedCases: { type: Number, default: 0 },
    successfulRecoveries: { type: Number, default: 0 },
    failedRecoveries: { type: Number, default: 0 },
    escalatedCases: { type: Number, default: 0 },
    stoppedCases: { type: Number, default: 0 },
    policyBlockedCases: { type: Number, default: 0 },
    totalAmountAtRisk: { type: Number, default: 0 },
    totalRecoveredAmount: { type: Number, default: 0 },
    recoveryRate: { type: Number, default: 0 },
    caseRecoveryRate: { type: Number, default: 0 },
    aiDecisionCount: { type: Number, default: 0 },
    fallbackDecisionCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const BatchEvaluation = mongoose.model('BatchEvaluation', batchEvaluationSchema);

module.exports = { BatchEvaluation };

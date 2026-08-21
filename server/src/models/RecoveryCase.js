'use strict';

const mongoose = require('mongoose');

const ISSUE_TYPE = [
  'PAYMENT_FAILURE',
  'CHECKOUT_ABANDONMENT',
  'SUBSCRIPTION_FAILURE',
  'OVERDUE_RECEIVABLE',
  'MANDATE_FAILURE',
];

const RISK_LEVEL = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const RECOMMENDED_ACTION = [
  'RETRY_PAYMENT',
  'CREATE_PAYMENT_LINK',
  'SEND_PAYMENT_LINK',
  'SEND_REMINDER',
  'ESCALATE',
  'STOP',
];

const CASE_STATUS = [
  'OPEN',
  'ANALYZING',
  'ACTION_PENDING',
  'IN_RECOVERY',
  'RECOVERED',
  'ESCALATED',
  'EXPIRED',
  'CLOSED',
];

const recoveryCaseSchema = new mongoose.Schema(
  {
    // Human-readable unique case identifier (e.g. CASE-00042)
    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    // Optional: not all issue types have a direct payment reference
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    issueType: {
      type: String,
      enum: ISSUE_TYPE,
      required: true,
      index: true,
    },
    // Amount at risk in paise
    amountAtRisk: {
      type: Number,
      required: true,
      min: [1, 'amountAtRisk must be positive'],
    },
    // 0-100 score from risk analysis
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: RISK_LEVEL,
      required: true,
      index: true,
    },
    // Human-readable diagnosis text.
    // IMPORTANT: This must be null until the AI analysis phase actually runs.
    // Demo data may contain a pre-generated diagnosis string for illustration only.
    diagnosis: { type: String, default: null },
    recommendedAction: {
      type: String,
      enum: RECOMMENDED_ACTION,
      default: null,
    },
    status: {
      type: String,
      enum: CASE_STATUS,
      default: 'OPEN',
      index: true,
    },
    retryCount: { type: Number, default: 0, min: 0 },
    reminderCount: { type: Number, default: 0, min: 0 },
    escalationLevel: { type: Number, default: 0, min: 0 },
    // Amount recovered in paise. Cannot exceed amountAtRisk (enforced in pre-save).
    recoveredAmount: { type: Number, default: 0, min: 0 },
    recoveryWindowStart: { type: Date, default: null },
    recoveryWindowEnd: { type: Date, default: null },
    lastActionAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    resolutionReason: { type: String, default: null },
    _isDemoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

recoveryCaseSchema.index({ status: 1, createdAt: -1 });
recoveryCaseSchema.index({ riskLevel: 1, status: 1 });

// Guard: recoveredAmount must never exceed amountAtRisk
recoveryCaseSchema.pre('save', function (next) {
  if (this.recoveredAmount > this.amountAtRisk) {
    return next(
      new Error(
        'recoveredAmount (' + this.recoveredAmount + ') cannot exceed amountAtRisk (' + this.amountAtRisk + ')'
      )
    );
  }
  next();
});

const RecoveryCase = mongoose.model('RecoveryCase', recoveryCaseSchema);

module.exports = { RecoveryCase, ISSUE_TYPE, RISK_LEVEL, RECOMMENDED_ACTION, CASE_STATUS };

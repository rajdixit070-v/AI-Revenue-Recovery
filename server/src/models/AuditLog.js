'use strict';

const mongoose = require('mongoose');

const AUDIT_EVENT_TYPE = [
  'CASE_CREATED',
  'CASE_ANALYSIS_STARTED',
  'RISK_CALCULATED',
  'DIAGNOSIS_COMPLETED',
  'AI_ANALYSIS_STARTED',
  'AI_ANALYSIS_COMPLETED',
  'AI_ANALYSIS_REQUESTED',
  'AI_ANALYSIS_FAILED',
  'AI_OUTPUT_REJECTED',
  'AI_FALLBACK_USED',
  'AI_RECOMMENDATION_ACCEPTED',
  'AI_RECOMMENDATION_BLOCKED',
  'ACTION_RECOMMENDED',
  'POLICY_CHECKED',
  'ACTION_STARTED',
  'ACTION_COMPLETED',
  'ACTION_FAILED',
  'ACTION_BLOCKED',
  'RECOVERY_PLAN_CREATED',
  'STOPPING_RULE_TRIGGERED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'RECOVERY_COMPLETED',
  'RECOVERY_STOPPED',
  'ESCALATED',
  'CASE_EXPIRED',
  'CASE_CLOSED',
  'WEBHOOK_RECEIVED',
  'RAZORPAY_ORDER_CREATED',
  'RAZORPAY_PAYMENT_VERIFICATION_STARTED',
  'RAZORPAY_PAYMENT_VERIFIED',
  'RAZORPAY_PAYMENT_FAILED',
  'RAZORPAY_WEBHOOK_RECEIVED',
  'RAZORPAY_WEBHOOK_REJECTED',
  'RECOVERY_ACTION_EXECUTED',
  'RECOVERY_ACTION_BLOCKED',
  'PAYMENT_RECOVERY_CONFIRMED',
  'BATCH_CASE_STARTED',
  'BATCH_CASE_COMPLETED',
  'POLICY_EVALUATION_PASSED',
];

const AUDIT_ACTOR_TYPE = ['SYSTEM', 'AI_AGENT', 'HUMAN', 'WEBHOOK'];

const auditLogSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecoveryCase',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: AUDIT_EVENT_TYPE,
      required: true,
    },
    actorType: {
      type: String,
      enum: AUDIT_ACTOR_TYPE,
      required: true,
    },
    message: { type: String, default: '' },
    reason: { type: String, default: null },
    previousState: { type: String, default: null },
    newState: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    _isDemoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

auditLogSchema.index({ caseId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog, AUDIT_EVENT_TYPE, AUDIT_ACTOR_TYPE };

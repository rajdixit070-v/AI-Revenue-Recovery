'use strict';

const mongoose = require('mongoose');

const ACTION_TYPE = [
  'RETRY_PAYMENT',
  'CREATE_PAYMENT_LINK',
  'SEND_REMINDER',
  'ESCALATE',
  'STOP_WORKFLOW',
  'VERIFY_PAYMENT',
];

const ACTOR_TYPE = ['SYSTEM', 'AI_AGENT', 'HUMAN', 'WEBHOOK'];

const ACTION_STATUS = [
  'PENDING',
  'EXECUTING',
  'SUCCESS',
  'FAILED',
  'SKIPPED',
  'CANCELLED',
];

const recoveryActionSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecoveryCase',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ACTION_TYPE,
      required: true,
    },
    actorType: {
      type: String,
      enum: ACTOR_TYPE,
      required: true,
    },
    reason: { type: String, default: null },
    status: {
      type: String,
      enum: ACTION_STATUS,
      default: 'PENDING',
    },
    attemptNumber: { type: Number, default: 1, min: 1 },
    // Amount targeted by this action in paise
    amountTargeted: { type: Number, default: 0, min: 0 },
    // Amount actually recovered in paise (filled after verification)
    amountRecovered: { type: Number, default: 0, min: 0 },
    // External reference from payment provider (e.g. Razorpay payment link ID).
    // NEVER store credentials or API secrets here.
    providerReference: { type: String, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    // Additional context. Must never contain secrets or credentials.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    _isDemoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

recoveryActionSchema.index({ caseId: 1, createdAt: 1 });

const RecoveryAction = mongoose.model('RecoveryAction', recoveryActionSchema);

module.exports = { RecoveryAction, ACTION_TYPE, ACTOR_TYPE, ACTION_STATUS };

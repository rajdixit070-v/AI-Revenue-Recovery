'use strict';

const mongoose = require('mongoose');

/**
 * RecoveryPolicy — the guardrail layer for the recovery engine.
 *
 * The AI agent may recommend an action, but the Policy Engine must
 * check these bounds BEFORE any action is executed.
 * The AI must NEVER bypass this policy.
 */
const recoveryPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
      unique: true,
    },
    // Maximum number of payment retries per case
    maxRetries: { type: Number, default: 3, min: 0 },
    // Minimum interval between retries in minutes (default: 6 hours)
    retryIntervalMinutes: { type: Number, default: 360, min: 1 },
    // Maximum reminder messages per case
    maxReminders: { type: Number, default: 2, min: 0 },
    // Total window in hours during which recovery is allowed (default: 7 days)
    recoveryWindowHours: { type: Number, default: 168, min: 1 },
    // Maximum escalation level before the case is closed
    maxEscalationLevel: { type: Number, default: 2, min: 0 },
    // Stop recovery immediately when payment succeeds
    stopOnSuccess: { type: Boolean, default: true },
    // Stop recovery if the customer has opted out
    stopOnCustomerOptOut: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const RecoveryPolicy = mongoose.model('RecoveryPolicy', recoveryPolicySchema);

module.exports = { RecoveryPolicy };

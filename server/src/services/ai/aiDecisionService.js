'use strict';

/**
 * AI Decision Service
 * High-level orchestration for AI analysis, prompt building, response validation, confidence thresholding, and deterministic fallback.
 */

const { buildSystemPrompt, buildUserPrompt } = require('./aiPromptBuilder');
const { generateRecoveryDecision } = require('./aiProvider');
const { parseAndValidateResponse } = require('./aiResponseParser');
const { getFallbackRecommendation } = require('../fallbackDecisionEngine');
const { logAuditEvent } = require('../auditService');

const CONFIDENCE_THRESHOLDS = {
  MIN_ACCEPTABLE: 0.50,
  HUMAN_APPROVAL_NEEDED: 0.75,
};

async function getDecision(context) {
  const safeContext = context || {};
  const recoveryCase = safeContext.recoveryCase;
  const caseObjectId = recoveryCase ? recoveryCase._id : null;

  if (caseObjectId) {
    await logAuditEvent({
      caseId: caseObjectId,
      eventType: 'AI_ANALYSIS_REQUESTED',
      actorType: 'AI_AGENT',
      message: 'AI decision analysis requested',
      metadata: { mode: process.env.AI_MODE || 'simulation' },
    }).catch(() => {});
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(safeContext);

  let rawOutput = null;
  let providerUsed = 'SIMULATION';

  try {
    const providerResult = await generateRecoveryDecision(systemPrompt, userPrompt, safeContext);
    rawOutput = providerResult.rawOutput;
    providerUsed = providerResult.provider;
  } catch (err) {
    if (caseObjectId) {
      await logAuditEvent({
        caseId: caseObjectId,
        eventType: 'AI_ANALYSIS_FAILED',
        actorType: 'SYSTEM',
        message: 'AI provider error: ' + err.message + '. Triggering fallback.',
        reason: err.message,
      }).catch(() => {});
    }
    return executeFallback(safeContext, 'AI_PROVIDER_ERROR', err.message);
  }

  // Validate response schema
  const parsed = parseAndValidateResponse(rawOutput);

  if (!parsed.isValid) {
    if (caseObjectId) {
      await logAuditEvent({
        caseId: caseObjectId,
        eventType: 'AI_OUTPUT_REJECTED',
        actorType: 'SYSTEM',
        message: 'AI output failed validation: ' + parsed.error,
        reason: parsed.error,
      }).catch(() => {});
    }
    return executeFallback(safeContext, 'AI_SCHEMA_INVALID', parsed.error);
  }

  const decision = parsed.data;

  // Apply Confidence Threshold Rules
  if (decision.confidence < CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE) {
    if (caseObjectId) {
      await logAuditEvent({
        caseId: caseObjectId,
        eventType: 'AI_OUTPUT_REJECTED',
        actorType: 'SYSTEM',
        message: 'AI confidence (' + decision.confidence + ') below minimum threshold (' + CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE + ')',
        reason: 'LOW_CONFIDENCE',
      }).catch(() => {});
    }
    return executeFallback(safeContext, 'LOW_CONFIDENCE', 'Confidence ' + decision.confidence + ' below threshold');
  }

  if (decision.confidence < CONFIDENCE_THRESHOLDS.HUMAN_APPROVAL_NEEDED) {
    decision.requiresHumanApproval = true;
    decision.reason += ' (Confidence ' + decision.confidence + ' requires human review)';
  }

  if (caseObjectId) {
    await logAuditEvent({
      caseId: caseObjectId,
      eventType: 'AI_ANALYSIS_COMPLETED',
      actorType: 'AI_AGENT',
      message: 'AI recommendation generated: ' + decision.action + ' (confidence: ' + decision.confidence + ')',
      metadata: { action: decision.action, confidence: decision.confidence, provider: providerUsed },
    }).catch(() => {});
  }

  return {
    isFallback: false,
    provider: providerUsed,
    decision,
  };
}

function executeFallback(context, fallbackReason, errorDetails) {
  const safeContext = context || {};
  const fallback = getFallbackRecommendation(safeContext);

  const decision = {
    action: fallback.action,
    confidence: 0.90,
    priority: fallback.priority || 'HIGH',
    reason: '[DETERMINISTIC FALLBACK] ' + fallback.reason + ' (Fallback cause: ' + fallbackReason + ')',
    diagnosis: {
      primaryCause: safeContext.diagnosis ? safeContext.diagnosis.probableCause : 'UNKNOWN',
      evidence: ['Fallback decision engine invoked'],
      uncertainty: [errorDetails],
    },
    expectedOutcome: fallback.expectedOutcome || 'Fallback execution outcome',
    alternativeActions: fallback.alternatives || [],
    requiresHumanApproval: fallback.requiresHumanApproval || false,
    stopReason: fallback.action === 'STOP' ? fallbackReason : null,
  };

  if (safeContext.recoveryCase && safeContext.recoveryCase._id) {
    logAuditEvent({
      caseId: safeContext.recoveryCase._id,
      eventType: 'AI_FALLBACK_USED',
      actorType: 'SYSTEM',
      message: 'Fallback decision engine used for action \'' + decision.action + '\'',
      reason: fallbackReason,
      metadata: { errorDetails },
    }).catch(() => {});
  }

  return {
    isFallback: true,
    fallbackReason,
    provider: 'FALLBACK_ENGINE',
    decision,
  };
}

module.exports = { getDecision, CONFIDENCE_THRESHOLDS };

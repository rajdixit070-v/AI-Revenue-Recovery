'use strict';

/**
 * AI Response Parser & Schema Validator
 */

const { ALLOWED_ACTIONS, ALLOWED_PRIORITIES } = require('./aiPromptBuilder');

function parseAndValidateResponse(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return { isValid: false, error: 'Raw output is missing or empty' };
  }

  let cleaned = rawOutput.trim();

  // Strip Markdown code fence wrappers if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return { isValid: false, error: `JSON parse error: ${err.message}` };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { isValid: false, error: 'Parsed output is not a valid JSON object' };
  }

  // Schema Validations
  if (!parsed.action || !ALLOWED_ACTIONS.includes(parsed.action)) {
    return { isValid: false, error: `Invalid or missing action: '${parsed.action}'. Allowed: ${ALLOWED_ACTIONS.join(', ')}` };
  }

  if (typeof parsed.confidence !== 'number' || isNaN(parsed.confidence) || parsed.confidence < 0 || parsed.confidence > 1) {
    return { isValid: false, error: `Invalid confidence value: ${parsed.confidence}. Must be a float between 0.0 and 1.0` };
  }

  if (!parsed.priority || !ALLOWED_PRIORITIES.includes(parsed.priority)) {
    return { isValid: false, error: `Invalid priority: '${parsed.priority}'. Allowed: ${ALLOWED_PRIORITIES.join(', ')}` };
  }

  if (!parsed.reason || typeof parsed.reason !== 'string' || parsed.reason.trim().length === 0) {
    return { isValid: false, error: 'Reason field is missing or empty' };
  }

  if (typeof parsed.requiresHumanApproval !== 'boolean') {
    parsed.requiresHumanApproval = Boolean(parsed.requiresHumanApproval);
  }

  if (!Array.isArray(parsed.alternativeActions)) {
    parsed.alternativeActions = [];
  }

  // Sanitize alternative actions to allowed list
  parsed.alternativeActions = parsed.alternativeActions.filter(act => ALLOWED_ACTIONS.includes(act));

  return {
    isValid: true,
    data: {
      action: parsed.action,
      confidence: parsed.confidence,
      priority: parsed.priority,
      reason: parsed.reason.trim(),
      diagnosis: parsed.diagnosis || { primaryCause: 'UNSPECIFIED', evidence: [], uncertainty: [] },
      expectedOutcome: parsed.expectedOutcome || '',
      alternativeActions: parsed.alternativeActions,
      requiresHumanApproval: parsed.requiresHumanApproval,
      stopReason: parsed.stopReason || null,
    },
  };
}

module.exports = { parseAndValidateResponse };

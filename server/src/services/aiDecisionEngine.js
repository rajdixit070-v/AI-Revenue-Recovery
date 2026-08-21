'use strict';

/**
 * AI Decision Engine Abstraction Layer
 * Delegates to Model-Driven AI Decision Service (Phase 5).
 */

const { getDecision } = require('./ai/aiDecisionService');
const { ALLOWED_ACTIONS } = require('./ai/aiPromptBuilder');

async function generateRecommendation(context = {}) {
  const aiResult = await getDecision(context);
  const decision = aiResult.decision;

  if (!ALLOWED_ACTIONS.includes(decision.action)) {
    console.warn(`[AI Decision Engine] Unrecognized action "${decision.action}". Falling back to STOP.`);
    return {
      action: 'STOP',
      priority: 'HIGH',
      reason: 'AI decision generated an unpermitted action type',
      confidence: 0,
      expectedOutcome: 'Halted due to invalid action output',
      requiresHumanApproval: true,
      alternatives: [],
    };
  }

  return decision;
}

module.exports = { generateRecommendation, ALLOWED_ACTIONS };

'use strict';

/**
 * AI Provider Abstraction Interface
 * Switches between 'simulation' mode (default) and 'gemini' mode based on AI_MODE env.
 */

const geminiProvider = require('./geminiProvider');
const { getFallbackRecommendation } = require('../fallbackDecisionEngine');

async function generateRecoveryDecision(systemPrompt, userPrompt, context = {}) {
  const mode = (process.env.AI_MODE || 'simulation').toLowerCase();

  if (mode === 'gemini') {
    try {
      const rawOutput = await geminiProvider.generateContent(systemPrompt, userPrompt);
      return { provider: 'GEMINI', rawOutput, isSimulation: false };
    } catch (err) {
      console.warn('[AI Provider] Gemini call failed, throwing for fallback handler:', err.message);
      throw err;
    }
  }

  // Default: Simulation mode - deterministic model simulation matching output contract
  const fallback = getFallbackRecommendation(context);
  const simulatedOutput = JSON.stringify({
    action: fallback.action,
    confidence: fallback.confidence || 0.85,
    priority: fallback.priority || 'HIGH',
    reason: `[AI SIMULATION MODE] ${fallback.reason}`,
    diagnosis: {
      primaryCause: context.diagnosis ? context.diagnosis.probableCause : 'PAYMENT_FAILURE',
      evidence: context.diagnosis ? context.diagnosis.reasoning : ['Simulated case analysis'],
      uncertainty: [],
    },
    expectedOutcome: fallback.expectedOutcome || 'Simulated execution outcome',
    alternativeActions: fallback.alternatives || [],
    requiresHumanApproval: fallback.requiresHumanApproval || false,
    stopReason: fallback.action === 'STOP' ? 'SIMULATION_STOP' : null,
  });

  return { provider: 'SIMULATION', rawOutput: simulatedOutput, isSimulation: true };
}

module.exports = { generateRecoveryDecision };

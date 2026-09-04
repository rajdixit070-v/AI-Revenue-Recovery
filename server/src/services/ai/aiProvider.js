'use strict';

/**
 * AI Provider Abstraction Interface
 * Switches between 'simulation' mode (default) and 'gemini' mode based on AI_MODE env.
 */

const geminiProvider = require('./geminiProvider');
const { getFallbackRecommendation } = require('../fallbackDecisionEngine');

async function generateRecoveryDecision(systemPrompt, userPrompt, context = {}) {
  const mode = (process.env.AI_MODE || 'simulation').toLowerCase();

  if (mode === 'gemini' || mode === 'live') {
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
  const amountAtRisk = (context.recoveryCase && context.recoveryCase.amountAtRisk) || 499900;
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
    strategyComparison: [
      {
        action: 'RETRY_PAYMENT',
        probability: fallback.action === 'RETRY_PAYMENT' ? (fallback.confidence || 0.88) : 0.46,
        expectedRecovery: Math.round(amountAtRisk * (fallback.action === 'RETRY_PAYMENT' ? (fallback.confidence || 0.88) : 0.46)),
        customerFriction: 'LOW',
        rationale: 'Automated gateway retry via secondary payment rail',
      },
      {
        action: 'CREATE_PAYMENT_LINK',
        probability: fallback.action === 'CREATE_PAYMENT_LINK' ? (fallback.confidence || 0.88) : 0.78,
        expectedRecovery: Math.round(amountAtRisk * (fallback.action === 'CREATE_PAYMENT_LINK' ? (fallback.confidence || 0.88) : 0.78)),
        customerFriction: 'LOW',
        rationale: '1-click smart Razorpay payment link sent via WhatsApp',
      },
      {
        action: 'SEND_REMINDER',
        probability: fallback.action === 'SEND_REMINDER' ? (fallback.confidence || 0.88) : 0.35,
        expectedRecovery: Math.round(amountAtRisk * (fallback.action === 'SEND_REMINDER' ? (fallback.confidence || 0.88) : 0.35)),
        customerFriction: 'LOW',
        rationale: 'Gentle email and notification reminder sequence',
      },
      {
        action: 'ESCALATE',
        probability: fallback.action === 'ESCALATE' ? (fallback.confidence || 0.88) : 0.62,
        expectedRecovery: Math.round(amountAtRisk * (fallback.action === 'ESCALATE' ? (fallback.confidence || 0.88) : 0.62)),
        customerFriction: 'HIGH',
        rationale: 'Priority operational escalation to customer success manager',
      },
    ],
    requiresHumanApproval: fallback.requiresHumanApproval || false,
    stopReason: fallback.action === 'STOP' ? 'SIMULATION_STOP' : null,
  });

  return { provider: 'SIMULATION', rawOutput: simulatedOutput, isSimulation: true };
}

module.exports = { generateRecoveryDecision };

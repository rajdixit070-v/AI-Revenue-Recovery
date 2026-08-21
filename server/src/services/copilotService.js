'use strict';

const { APPROVED_TOOLS } = require('./copilotTools');
const { logAuditEvent } = require('./auditService');

const FINANCIAL_KEYWORDS = ['retry', 'charge', 'refund', 'pay', 'execute', 'override', 'disable policy', 'mark paid', 'mark recovered', 'change policy', 'modify limit'];

function isFinancialActionIntent(message) {
  const lower = message.toLowerCase();
  return FINANCIAL_KEYWORDS.some(kw => lower.includes(kw));
}

async function processCopilotMessage({ message, context = {}, user }) {
  if (process.env.COPILOT_ENABLED === 'false') {
    throw new Error('RecoverAI Copilot is currently disabled via environment configuration.');
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Copilot message cannot be empty.');
  }

  if (message.length > 1000) {
    throw new Error('Copilot message exceeds maximum allowed length of 1000 characters.');
  }

  // Sanitize input
  const sanitizedInput = message.replace(/<[^>]*>/g, '').trim();

  // Safety Check: Reject Financial Action Execution Intents
  if (isFinancialActionIntent(sanitizedInput)) {
    return {
      success: true,
      message: "I can analyze the case and explain the recovery policy, but financial recovery actions must go through RecoverAI's policy-controlled recovery workflow.",
      toolUsed: 'none',
      refusedFinancialAction: true,
    };
  }

  // Intent Matching & Tool Selection
  const lowerMsg = sanitizedInput.toLowerCase();
  let toolToUse = null;
  let toolParams = {};

  if (lowerMsg.includes('at risk') || lowerMsg.includes('metric') || lowerMsg.includes('dashboard') || lowerMsg.includes('how much')) {
    toolToUse = APPROVED_TOOLS.find(t => t.name === 'get_dashboard_metrics');
  } else if (lowerMsg.includes('evaluation') || lowerMsg.includes('benchmark')) {
    toolToUse = APPROVED_TOOLS.find(t => t.name === 'get_evaluation_summary');
  } else if (context.caseId || lowerMsg.includes('case') || lowerMsg.includes('blocked') || lowerMsg.includes('why')) {
    toolToUse = APPROVED_TOOLS.find(t => t.name === 'get_recovery_case');
    toolParams = { caseId: context.caseId || (sanitizedInput.match(/RC-\d+|E2E-CASE-\d+|BATCH-CASE-\d+/) || [])[0] || 'BATCH-CASE-001' };
  } else {
    toolToUse = APPROVED_TOOLS.find(t => t.name === 'get_recovery_cases');
  }

  let toolResult = null;
  if (toolToUse) {
    try {
      toolResult = await toolToUse.execute(toolParams);
    } catch (err) {
      toolResult = { error: err.message };
    }
  }

  // Formulate Response
  let responseText = '';

  if (toolToUse?.name === 'get_dashboard_metrics') {
    responseText = `RecoverAI currently has ₹${((toolResult.revenueAtRisk || 0) / 100).toLocaleString('en-IN')} in revenue at risk across ${toolResult.openCases || 0} open cases. Confirmed recovered revenue stands at ₹${((toolResult.recoveredRevenue || 0) / 100).toLocaleString('en-IN')} (${toolResult.revenueRecoveryRate || 0}% recovery rate) in ${toolResult.mode || 'SIMULATION MODE'}.`;
  } else if (toolToUse?.name === 'get_recovery_case' && !toolResult.error) {
    responseText = `Case ${toolResult.caseId} (${toolResult.issueType}) for ${toolResult.customer?.name || 'Customer'} has ₹${(toolResult.amountAtRisk / 100).toFixed(2)} at risk. Risk Level: ${toolResult.riskLevel} (Score: ${toolResult.riskScore}). Status: ${toolResult.status}. Retries attempted: ${toolResult.retryCount}.`;
  } else if (toolToUse?.name === 'get_evaluation_summary' && !toolResult.error) {
    responseText = `Latest evaluation batch ${toolResult.batchId || ''} processed ${toolResult.totalCases || 0} synthetic cases in simulation mode with a ${toolResult.revenueRecoveryRate || 0}% revenue recovery rate. Total simulated revenue recovered: ₹${((toolResult.totalRecoveredAmount || 0) / 100).toLocaleString('en-IN')}.`;
  } else {
    responseText = `RecoverAI Copilot analyzed your request. ${toolResult ? 'Data retrieved cleanly from RecoverAI services.' : 'All financial recovery actions remain governed by RecoverAI policy engine.'}`;
  }

  return {
    success: true,
    message: responseText,
    toolUsed: toolToUse ? toolToUse.name : 'none',
    data: toolResult,
  };
}

module.exports = { processCopilotMessage, isFinancialActionIntent };

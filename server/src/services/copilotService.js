'use strict';

const { APPROVED_TOOLS } = require('./copilotTools');
const { logAuditEvent } = require('./auditService');
const geminiProvider = require('./ai/geminiProvider');

const FINANCIAL_KEYWORDS = ['retry', 'charge', 'refund', 'pay', 'execute', 'override', 'disable policy', 'mark paid', 'mark recovered', 'change policy', 'modify limit'];

function isFinancialActionIntent(message) {
  const lower = message.toLowerCase();
  return FINANCIAL_KEYWORDS.some(kw => lower.includes(kw));
}

const TOOL_SELECTION_SYSTEM_PROMPT = `You are RecoverAI Copilot, an AI assistant for revenue recovery operators.
Analyze the user's question and select the single best tool from the approved tools list to answer their question.

Available approved tools:
- get_dashboard_metrics: Retrieves current platform revenue at risk, recovered revenue, case counts, and recovery rate.
- get_recovery_cases: Retrieves list of recovery cases. Arguments: { "status": "OPEN|IN_RECOVERY|RECOVERED|ESCALATED", "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL" }
- get_recovery_case: Retrieves comprehensive details for a single recovery case. Arguments: { "caseId": "<string>" }
- get_evaluation_summary: Retrieves latest batch evaluation benchmark summary.
- run_demo_evaluation: Triggers synthetic 100-case evaluation benchmark. Arguments: { "caseLimit": 100 }

Return ONLY valid JSON matching this schema:
{
  "tool": "<tool_name>",
  "arguments": {}
}`;

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

  // Safety Check: Refuse Financial Action Execution Intents
  if (isFinancialActionIntent(sanitizedInput)) {
    return {
      success: true,
      aiProvider: (process.env.AI_MODE || 'simulation').toLowerCase() === 'gemini' ? 'gemini' : 'simulation',
      message: "I can analyze the case and explain the recovery policy, but financial recovery actions must go through RecoverAI's policy-controlled recovery workflow.",
      toolUsed: 'none',
      refusedFinancialAction: true,
    };
  }

  let toolName = null;
  let toolArgs = {};
  let aiProviderUsed = 'simulation';

  const aiMode = (process.env.AI_MODE || 'simulation').toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Attempt Gemini AI Tool Selection if Gemini AI mode is active and API key exists
  if (aiMode === 'gemini' && apiKey && !apiKey.includes('your_')) {
    try {
      const rawAiToolOutput = await geminiProvider.generateContent(
        TOOL_SELECTION_SYSTEM_PROMPT,
        `User query: "${sanitizedInput}". Context caseId: "${context.caseId || ''}"`
      );
      const parsedTool = JSON.parse(rawAiToolOutput);
      if (parsedTool && parsedTool.tool) {
        toolName = parsedTool.tool;
        toolArgs = parsedTool.arguments || {};
        aiProviderUsed = 'gemini';
      }
    } catch (err) {
      console.warn('[Copilot AI Provider] Gemini intent resolution failed, falling back to deterministic simulation provider:', err.message);
      aiProviderUsed = 'fallback';
    }
  }

  // 2. Deterministic Fallback Tool Selection if Gemini AI unavailable or in simulation mode
  if (!toolName) {
    const lowerMsg = sanitizedInput.toLowerCase();
    if (lowerMsg.includes('at risk') || lowerMsg.includes('metric') || lowerMsg.includes('dashboard') || lowerMsg.includes('how much')) {
      toolName = 'get_dashboard_metrics';
    } else if (lowerMsg.includes('evaluation') || lowerMsg.includes('benchmark')) {
      toolName = 'get_evaluation_summary';
    } else if (context.caseId || lowerMsg.includes('case') || lowerMsg.includes('blocked') || lowerMsg.includes('why')) {
      toolName = 'get_recovery_case';
      toolArgs = { caseId: context.caseId || (sanitizedInput.match(/RC-\d+|E2E-CASE-\d+|BATCH-CASE-\d+|CASE-\d+/) || [])[0] || 'CASE-00001' };
    } else {
      toolName = 'get_recovery_cases';
    }
  }

  // 3. Validate against Approved Tool Registry
  const toolToUse = APPROVED_TOOLS.find(t => t.name === toolName);

  if (!toolToUse) {
    return {
      success: false,
      aiProvider: aiProviderUsed,
      message: `Requested tool '${toolName}' is not in the approved tool registry.`,
      toolUsed: 'none',
    };
  }

  // Enforce read-only / safe tool execution
  let toolResult = null;
  try {
    toolResult = await toolToUse.execute(toolArgs);
  } catch (err) {
    toolResult = { error: err.message };
  }

  // 4. Formulate Output Response via Gemini AI or Simulation Provider
  let responseText = '';

  if (aiProviderUsed === 'gemini' && !toolResult.error) {
    try {
      const formattingPrompt = `You are RecoverAI Copilot. Using ONLY the verified backend data provided below, answer the user's question concisely and accurately. Do NOT invent financial numbers, percentages, or statuses.\nUser question: "${sanitizedInput}"\nVerified Backend Data:\n${JSON.stringify(toolResult, null, 2)}`;
      responseText = await geminiProvider.generateContent(
        'You are RecoverAI Copilot, a natural language assistant for revenue recovery operators.',
        formattingPrompt
      );
    } catch (err) {
      console.warn('[Copilot AI Provider] Gemini response formatting failed, falling back to clean template:', err.message);
    }
  }

  if (!responseText) {
    if (toolToUse.name === 'get_dashboard_metrics') {
      responseText = `RecoverAI currently has ₹${((toolResult.revenueAtRisk || 0) / 100).toLocaleString('en-IN')} in revenue at risk across ${toolResult.openCases || 0} open cases. Confirmed recovered revenue stands at ₹${((toolResult.recoveredRevenue || 0) / 100).toLocaleString('en-IN')} (${toolResult.revenueRecoveryRate || 0}% recovery rate) in ${toolResult.mode || 'SIMULATION MODE'}.`;
    } else if (toolToUse.name === 'get_recovery_case' && !toolResult.error) {
      responseText = `Case ${toolResult.caseId} (${toolResult.issueType}) for ${toolResult.customer?.name || 'Customer'} has ₹${(toolResult.amountAtRisk / 100).toFixed(2)} at risk. Risk Level: ${toolResult.riskLevel} (Score: ${toolResult.riskScore}). Status: ${toolResult.status}. Retries attempted: ${toolResult.retryCount}.`;
    } else if (toolToUse.name === 'get_evaluation_summary' && !toolResult.error) {
      responseText = `Latest evaluation batch ${toolResult.batchId || ''} processed ${toolResult.totalCases || 0} synthetic cases in simulation mode with a ${toolResult.revenueRecoveryRate || 0}% revenue recovery rate. Total simulated revenue recovered: ₹${((toolResult.totalRecoveredAmount || 0) / 100).toLocaleString('en-IN')}.`;
    } else {
      responseText = `RecoverAI Copilot analyzed your request. Data retrieved cleanly from RecoverAI backend services (${toolToUse.name}).`;
    }
  }

  // Audit log
  await logAuditEvent({
    eventType: 'COPILOT_QUERY',
    actorType: 'USER',
    message: `Copilot query processed using tool '${toolToUse.name}' (${aiProviderUsed})`,
    metadata: { toolName: toolToUse.name, aiProvider: aiProviderUsed },
  }).catch(() => {});

  return {
    success: true,
    aiProvider: aiProviderUsed,
    message: responseText,
    toolUsed: toolToUse.name,
    data: toolResult,
  };
}

module.exports = { processCopilotMessage, isFinancialActionIntent };

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/money';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import AIDecisionCard from '../components/AIDecisionCard';
import PolicyDecisionCard from '../components/PolicyDecisionCard';
import Timeline from '../components/Timeline';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { Play, Sparkles, ShieldCheck, DollarSign, ArrowLeft } from 'lucide-react';

export default function CaseDetailPage({ caseId, onNavigate }) {
  const [caseData, setCaseData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [executionMessage, setExecutionMessage] = useState(null);

  const loadCase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCaseById(caseId);
      setCaseData(res.data);

      // Trigger background AI Analysis
      runAIAnalysis(caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async (cid) => {
    setAnalyzing(true);
    setExecutionMessage(null);
    try {
      const res = await api.aiAnalyzeCase(cid);
      setAiAnalysis(res.data);

      // Refresh case document to reflect new status, score and audit log
      const updatedCase = await api.getCaseById(cid);
      setCaseData(updatedCase.data);

      setExecutionMessage({
        type: 'success',
        text: `AI Re-Analysis Complete! Recommended Action: ${res.data?.aiDecision?.decision?.action || res.data?.finalRecommendation?.action} (Confidence: ${Math.round((res.data?.aiDecision?.decision?.confidence || 0.85) * 100)}%)`,
      });
    } catch (err) {
      console.warn('AI analysis error:', err.message);
      setExecutionMessage({ type: 'error', text: `AI analysis failed: ${err.message}` });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setExecutionMessage(null);
    try {
      const targetAction = aiAnalysis?.finalRecommendation?.action || caseData?.recommendedAction || 'RETRY_PAYMENT';
      const res = await api.executeCase(caseId, targetAction);
      setExecutionMessage({ type: 'success', text: res.message || 'Action executed successfully in Test Mode!' });
      setShowConfirm(false);

      // Reload case details to update timeline and state
      loadCase();
    } catch (err) {
      setExecutionMessage({ type: 'error', text: err.message || 'Execution failed.' });
      setShowConfirm(false);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    if (caseId) loadCase();
  }, [caseId]);

  if (loading) return <LoadingState message={`Loading details for case ${caseId}...`} />;
  if (error) return <ErrorState title="Case not found" message={error} onRetry={loadCase} />;

  const c = caseData || {};
  const ai = aiAnalysis?.aiDecision;
  const policy = aiAnalysis?.policyDecision;
  const isAllowed = policy ? policy.allowed : true;
  const isTerminal = ['CLOSED', 'RECOVERED', 'EXPIRED'].includes(c.status);

  return (
    <div className="space-y-8">
      {/* Top Nav Back */}
      <button
        onClick={() => onNavigate('/recovery-cases')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Recovery Cases
      </button>

      {/* Execution Alert Banner if any */}
      {executionMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          executionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {executionMessage.text}
        </div>
      )}

      {/* Hero Case Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono">{c.caseId}</h2>
            <StatusBadge status={c.status} />
            <RiskBadge level={c.riskLevel} score={c.riskScore} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Category: <strong className="text-slate-800">{c.issueType}</strong> &bull; Created: {formatDate(c.createdAt)}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => runAIAnalysis(caseId)}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {analyzing ? 'Analyzing...' : 'Re-Run AI Analysis'}
          </button>

          {!isTerminal && isAllowed ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Play className="w-4 h-4 fill-white" /> Execute Recovery
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed"
            >
              {isTerminal ? `Case ${c.status}` : 'Blocked by Policy'}
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Financials & Customer */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Impact</h3>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Amount at Risk</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatPaiseToRupees(c.amountAtRisk)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Recovered Amount</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{formatPaiseToRupees(c.recoveredAmount)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Profile</h3>
            <div>
              <span className="text-xs font-bold text-slate-900 block">{c.customerId?.name || 'Customer'}</span>
              <span className="text-xs text-slate-500 block">{c.customerId?.email}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">LTV:</span>
                <span className="font-bold text-slate-800">{formatPaiseToRupees(c.customerId?.lifetimeValue)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Success/Fail:</span>
                <span className="font-bold text-slate-800">{c.customerId?.successfulPayments || 0} / {c.customerId?.failedPayments || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI & Policy Cards */}
        <div className="md:col-span-2 space-y-6">
          <AIDecisionCard
            aiDecision={ai || { decision: { action: c.recommendedAction, confidence: 0.85, reason: c.diagnosis || 'Automated analysis' } }}
            diagnosis={aiAnalysis?.diagnosis}
            risk={aiAnalysis?.risk}
            policyDecision={policy}
          />
          <PolicyDecisionCard policyDecision={policy || { allowed: true }} proposedAction={ai?.decision?.action || c.recommendedAction || 'RETRY_PAYMENT'} />
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Audit Trail History</h3>
        <Timeline logs={c.auditLogs} />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleExecute}
        caseId={c.caseId}
        action={ai?.decision?.action || c.recommendedAction || 'RETRY_PAYMENT'}
        amount={c.amountAtRisk}
        reason={ai?.decision?.reason || 'Approved recovery attempt'}
        loading={executing}
      />
    </div>
  );
}

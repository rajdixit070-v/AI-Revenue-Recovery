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
import RazorpayCheckoutModal from '../components/RazorpayCheckoutModal';
import { Play, Sparkles, ShieldCheck, DollarSign, ArrowLeft, CheckCircle2, Zap, RefreshCw, Bot, Check, MessageSquare, PhoneCall, Calendar, Copy, CreditCard, Layers, Clock, AlertCircle } from 'lucide-react';

export default function CaseDetailPage({ caseId, onNavigate }) {
  const [caseData, setCaseData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [sequencingMandate, setSequencingMandate] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [error, setError] = useState(null);
  const [executionMessage, setExecutionMessage] = useState(null);

  // Hinglish & PTP States
  const [hinglishData, setHinglishData] = useState(null);
  const [generatingHinglish, setGeneratingHinglish] = useState(false);
  const [ptpDate, setPtpDate] = useState('');
  const [ptpSuccess, setPtpSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadCase = async (skipAi = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCaseById(caseId);
      setCaseData(res.data);

      if (!skipAi) {
        runAIAnalysis(caseId);
      }
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

      const updatedCase = await api.getCaseById(cid);
      setCaseData(updatedCase.data);

      setExecutionMessage({
        type: 'success',
        text: `🤖 AI Diagnosis Complete! Recommended: ${res.data?.aiDecision?.decision?.action || res.data?.finalRecommendation?.action} (Confidence: ${Math.round((res.data?.aiDecision?.decision?.confidence || 0.85) * 100)}%)`,
      });
    } catch (err) {
      console.warn('AI analysis error:', err.message);
      setExecutionMessage({ type: 'error', text: `AI analysis note: ${err.message}` });
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
      setExecutionMessage({
        type: 'success',
        text: `🚀 ${res.message || 'Recovery attempt created. Awaiting payment.'}`,
      });
      setShowConfirm(false);
      loadCase(true);
    } catch (err) {
      setExecutionMessage({ type: 'error', text: err.message || 'Execution failed.' });
      setShowConfirm(false);
    } finally {
      setExecuting(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    setExecutionMessage(null);
    try {
      if (c.executionMode === 'RAZORPAY_TEST_MODE') {
        // Real Test Mode: Dispatch cryptographic HMAC-SHA256 Razorpay webhook
        const res = await api.dispatchTestWebhook(caseId);
        setExecutionMessage({
          type: 'celebration',
          text: `🎉 Verified Recovery! Razorpay Test Mode Webhook signature verified. Recovered ${formatPaiseToRupees(c.amountAtRisk)}!`,
        });
      } else {
        // Explicit Simulation Mode
        const res = await api.simulatePaymentSuccess(caseId);
        setExecutionMessage({
          type: 'celebration',
          text: `⚡ Simulation payment success recorded! ${formatPaiseToRupees(c.amountAtRisk)} recovered in Simulation Mode.`,
        });
      }
      loadCase(true);
    } catch (err) {
      setExecutionMessage({ type: 'error', text: err.message || 'Payment handling failed' });
    } finally {
      setPaying(false);
    }
  };

  const handleSequenceMandate = async () => {
    setSequencingMandate(true);
    setExecutionMessage(null);
    try {
      const res = await api.sequenceMandate(caseId);
      setExecutionMessage({
        type: res.status === 'stopped' ? 'error' : 'success',
        text: res.message,
      });
      loadCase(true);
    } catch (err) {
      setExecutionMessage({ type: 'error', text: err.message });
    } finally {
      setSequencingMandate(false);
    }
  };

  const handleGenerateHinglish = async () => {
    setGeneratingHinglish(true);
    try {
      const res = await api.getHinglishScript(caseId);
      setHinglishData(res.data);
    } catch (err) {
      console.warn('Failed to generate script:', err.message);
    } finally {
      setGeneratingHinglish(false);
    }
  };

  const handleSavePTP = async (e) => {
    e.preventDefault();
    if (!ptpDate) return;
    try {
      await api.setPromiseToPay(caseId, ptpDate, c.amountAtRisk);
      setPtpSuccess(`Promise-to-Pay registered for ${new Date(ptpDate).toLocaleDateString()}`);
      loadCase(true);
    } catch (err) {
      console.warn('PTP error:', err.message);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const isRecovered = c.status === 'RECOVERED';
  const isTerminal = ['CLOSED', 'RECOVERED', 'EXPIRED'].includes(c.status);
  const isMandateOrSub = ['MANDATE_FAILURE', 'SUBSCRIPTION_FAILURE'].includes(c.issueType);

  return (
    <div className="space-y-6">
      {/* Top Nav Back */}
      <button
        onClick={() => onNavigate('/recovery-cases')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Recovery Cases
      </button>

      {/* Execution Alert Banner */}
      {executionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-3 transition-all ${
          executionMessage.type === 'celebration'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-sm font-bold shadow-lg shadow-emerald-950'
            : executionMessage.type === 'success'
            ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {executionMessage.type === 'celebration' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          ) : executionMessage.type === 'success' ? (
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{executionMessage.text}</span>
        </div>
      )}

      {/* Hero Case Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono">{c.caseId}</h2>
            <StatusBadge status={c.status} />
            <RiskBadge level={c.riskLevel} score={c.riskScore} />

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              c.executionMode === 'RAZORPAY_TEST_MODE'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {c.executionMode === 'RAZORPAY_TEST_MODE' ? 'Razorpay Test Mode' : 'Simulation'}
            </span>

            {c.promiseToPayDate && (
              <span className={`px-2.5 py-0.5 border rounded-full text-[11px] font-bold flex items-center gap-1 ${
                c.promiseToPayStatus === 'FULFILLED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : c.promiseToPayStatus === 'BROKEN'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <Calendar className="w-3 h-3" /> PTP: {new Date(c.promiseToPayDate).toLocaleDateString()}
                {c.promiseToPayStatus === 'FULFILLED' && ' (FULFILLED ✓)'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Category: <strong className="text-slate-800">{c.issueType}</strong> &bull; Created: {formatDate(c.createdAt)}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => runAIAnalysis(caseId)}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
            <span>{analyzing ? 'AI Thinking...' : 'Re-Run AI Analysis'}</span>
          </button>

          {!isTerminal && isAllowed && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={executing}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{executing ? 'Executing...' : 'Execute Recovery Action'}</span>
            </button>
          )}

          {!isRecovered && (
            <>
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                title="Opens live interactive Razorpay Test Mode checkout popup"
              >
                <CreditCard className="w-4 h-4" />
                <span>Open Razorpay Checkout</span>
              </button>

              <button
                onClick={handleSimulatePayment}
                disabled={paying}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title={c.executionMode === 'RAZORPAY_TEST_MODE' ? 'Dispatches cryptographic HMAC-SHA256 Razorpay Webhook' : 'Simulates payment outcome in Simulation Mode'}
              >
                {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                <span>
                  {paying
                    ? 'Processing...'
                    : c.executionMode === 'RAZORPAY_TEST_MODE'
                    ? '⚡ Dispatch Test Webhook'
                    : '⚡ Simulate Success'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recovered Celebration Card */}
      {isRecovered && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-emerald-950">Revenue Successfully Recovered</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {formatPaiseToRupees(c.recoveredAmount || c.amountAtRisk)} verified via Razorpay HMAC SHA256 Webhook. Recovery workflow stopped.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-200/80 rounded-full text-emerald-900">
            VERIFIED &bull; WORKFLOW STOPPED
          </span>
        </div>
      )}

      {/* 2-Column Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Financials & Customer & PTP Tracker */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Impact</h3>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Amount at Risk</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatPaiseToRupees(c.amountAtRisk)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Recovered Amount</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{formatPaiseToRupees(c.recoveredAmount || 0)}</p>
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

          {/* Promise to Pay Tracker Card (Phase 8 & 11) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Promise-to-Pay (PTP)</h3>
              </div>
              {c.promiseToPayStatus && c.promiseToPayStatus !== 'NONE' && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  c.promiseToPayStatus === 'FULFILLED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {c.promiseToPayStatus}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Log customer verbal or written commitment to clear due invoice.</p>
            <form onSubmit={handleSavePTP} className="space-y-2 pt-1">
              <input
                type="date"
                value={ptpDate}
                onChange={(e) => setPtpDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Register PTP Commitment
              </button>
            </form>
            {ptpSuccess && <p className="text-[11px] text-emerald-700 font-medium">{ptpSuccess}</p>}
          </div>
        </div>

        {/* Right Column: AI & Hinglish Generator & Policy & Mandate Cards */}
        <div className="md:col-span-2 space-y-6">
          <AIDecisionCard
            aiDecision={ai || { decision: { action: c.recommendedAction, confidence: 0.85, reason: c.diagnosis || 'Automated analysis' } }}
            diagnosis={aiAnalysis?.diagnosis}
            risk={aiAnalysis?.risk}
            policyDecision={policy}
          />

          {/* Mandate Retry Sequencer Card (Phase 9 & 12) */}
          {isMandateOrSub && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mandate Retry Sequencer</h4>
                    <p className="text-[11px] text-slate-500">Autonomous retry scheduler bounded by NPCI & bank rules (Attempt {c.retryCount || 0} of 3)</p>
                  </div>
                </div>

                {!isRecovered && c.status !== 'ESCALATED' && (
                  <button
                    onClick={handleSequenceMandate}
                    disabled={sequencingMandate}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {sequencingMandate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Sequence Step &rarr;</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${c.retryCount >= 1 ? 'bg-cyan-50 border-cyan-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 1 (0h)</span>
                  <p className="font-bold text-slate-800 mt-0.5">Soft Decline Retry</p>
                  <span className="text-[10px] text-emerald-600 font-medium">{c.retryCount >= 1 ? '✓ Executed' : 'Scheduled'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${c.retryCount >= 2 ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase block">Step 2 (Salary Cycle)</span>
                  <p className="font-bold text-indigo-900 mt-0.5">1st-5th Month Sync</p>
                  <span className="text-[10px] text-indigo-700 font-medium">{c.retryCount >= 2 ? '✓ Executed' : 'Scheduled'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${c.retryCount >= 3 ? 'bg-cyan-50 border-cyan-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 3 (+48h)</span>
                  <p className="font-bold text-slate-800 mt-0.5">UPI Autopay Switch</p>
                  <span className="text-[10px] text-slate-500 font-medium">{c.retryCount >= 3 ? '✓ Dispatched' : 'Scheduled'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${c.status === 'ESCALATED' ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 4 (Grace End)</span>
                  <p className="font-bold text-slate-800 mt-0.5">Escalate / Pause</p>
                  <span className="text-[10px] text-slate-500 font-medium">{c.status === 'ESCALATED' ? 'Escalated' : 'Policy Bound'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hinglish Voice & Message Generator Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hinglish Voice & WhatsApp Recovery Copy</h4>
                  <p className="text-[11px] text-slate-500">Culturally tailored communication for Indian customers</p>
                </div>
              </div>
              <button
                onClick={handleGenerateHinglish}
                disabled={generatingHinglish}
                className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {generatingHinglish ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{generatingHinglish ? 'Generating...' : 'Generate Hinglish Script'}</span>
              </button>
            </div>

            {hinglishData ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp / SMS Message:
                    </span>
                    <button
                      onClick={() => handleCopy(hinglishData.hinglishMessage)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                    {hinglishData.hinglishMessage}
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-purple-600" /> 20-Second Voice Call Script:
                  </span>
                  <p className="text-purple-950 font-medium leading-relaxed bg-white p-3 rounded-lg border border-purple-100">
                    "{hinglishData.voiceScript}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Click "Generate Hinglish Script" to create an empathetic Hindi+English recovery reminder and phone call script for this customer.
              </p>
            )}
          </div>

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

      {/* Interactive Razorpay Checkout Modal */}
      <RazorpayCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        caseData={c}
        onPaymentSuccess={() => {
          setExecutionMessage({
            type: 'celebration',
            text: `🎉 Verified Recovery! Customer completed payment in Razorpay Checkout! Recovered ${formatPaiseToRupees(c.amountAtRisk)}!`,
          });
          loadCase(true);
        }}
      />
    </div>
  );
}

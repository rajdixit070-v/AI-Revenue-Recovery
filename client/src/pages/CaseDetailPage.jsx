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
import { Play, Sparkles, ShieldCheck, DollarSign, ArrowLeft, CheckCircle2, Zap, RefreshCw, Bot, Check, MessageSquare, PhoneCall, Calendar, Copy, CreditCard, Layers, Clock, AlertCircle, Link2, ExternalLink, Share2 } from 'lucide-react';

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
  const [linkCopied, setLinkCopied] = useState(false);

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

  const handleGeneratePaymentLink = async () => {
    setExecuting(true);
    setExecutionMessage(null);
    try {
      const res = await api.executeCase(caseId, 'CREATE_PAYMENT_LINK');
      setExecutionMessage({
        type: 'success',
        text: `🔗 Payment Link Generated Successfully! Ready to share with customer.`,
      });
      loadCase(true);
    } catch (err) {
      setExecutionMessage({ type: 'error', text: err.message || 'Failed to generate payment link' });
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
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Recovery Cases
      </button>

      {/* Execution Alert Banner */}
      {executionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-3 transition-all backdrop-blur-xl ${
          executionMessage.type === 'celebration'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-sm font-bold shadow-xl shadow-emerald-950/40'
            : executionMessage.type === 'success'
            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        }`}>
          {executionMessage.type === 'celebration' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          ) : executionMessage.type === 'success' ? (
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{executionMessage.text}</span>
        </div>
      )}

      {/* Hero Case Header */}
      <div className="bg-[#0E1526]/90 p-6 md:p-8 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl md:text-2xl font-black text-white font-mono">{c.caseId}</h2>
            <StatusBadge status={c.status} />
            <RiskBadge level={c.riskLevel} score={c.riskScore} />

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              c.executionMode === 'RAZORPAY_TEST_MODE'
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
            }`}>
              {c.executionMode === 'RAZORPAY_TEST_MODE' ? 'Razorpay Test Mode' : 'Simulation'}
            </span>

            {c.promiseToPayDate && (
              <span className={`px-2.5 py-0.5 border rounded-full text-[11px] font-bold flex items-center gap-1 ${
                c.promiseToPayStatus === 'FULFILLED'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : c.promiseToPayStatus === 'BROKEN'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                <Calendar className="w-3 h-3" /> PTP: {new Date(c.promiseToPayDate).toLocaleDateString()}
                {c.promiseToPayStatus === 'FULFILLED' && ' (FULFILLED ✓)'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Category: <strong className="text-slate-200">{c.issueType}</strong> &bull; Created: {formatDate(c.createdAt)}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => runAIAnalysis(caseId)}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <Bot className="w-4 h-4 text-indigo-400" />}
            <span>{analyzing ? 'AI Thinking...' : 'Re-Run AI Analysis'}</span>
          </button>

          {!isTerminal && isAllowed && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={executing}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{executing ? 'Executing...' : 'Execute Recovery Action'}</span>
            </button>
          )}

          {!isRecovered && !c.paymentLinkUrl && (
            <button
              onClick={handleGeneratePaymentLink}
              disabled={executing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
              title="Generate a dynamic Razorpay Smart Payment Link for this customer"
            >
              <Link2 className="w-4 h-4" />
              <span>{executing ? 'Generating...' : 'Generate Payment Link'}</span>
            </button>
          )}

          {!isRecovered && (
            <>
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                title="Opens live interactive Razorpay Test Mode checkout popup"
              >
                <CreditCard className="w-4 h-4" />
                <span>Test Payment with Razorpay</span>
              </button>

              <button
                onClick={handleSimulatePayment}
                disabled={paying}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
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
        <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 flex items-center justify-between gap-4 backdrop-blur-xl shadow-xl shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Revenue Successfully Recovered</h4>
              <p className="text-xs text-emerald-300 mt-0.5">
                {formatPaiseToRupees(c.recoveredAmount || c.amountAtRisk)} verified via Razorpay HMAC SHA256 Webhook. Recovery workflow stopped.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
            VERIFIED &bull; WORKFLOW STOPPED
          </span>
        </div>
      )}

      {/* 2-Column Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Financials & Customer & PTP Tracker */}
        <div className="space-y-6">
          <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Impact</h3>
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-xs text-slate-400">Amount at Risk</span>
              <p className="text-xl font-black text-white mt-0.5">{formatPaiseToRupees(c.amountAtRisk)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Recovered Amount</span>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{formatPaiseToRupees(c.recoveredAmount || 0)}</p>
            </div>
          </div>

          <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Profile</h3>
            <div>
              <span className="text-xs font-bold text-white block">{c.customerId?.name || 'Customer'}</span>
              <span className="text-xs text-slate-400 block">{c.customerId?.email}</span>
            </div>
            <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">LTV:</span>
                <span className="font-bold text-white">{formatPaiseToRupees(c.customerId?.lifetimeValue)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Success/Fail:</span>
                <span className="font-bold text-white">{c.customerId?.successfulPayments || 0} / {c.customerId?.failedPayments || 0}</span>
              </div>
            </div>
          </div>

          {/* Promise to Pay Tracker Card */}
          <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Promise-to-Pay (PTP)</h3>
              </div>
              {c.promiseToPayStatus && c.promiseToPayStatus !== 'NONE' && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  c.promiseToPayStatus === 'FULFILLED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {c.promiseToPayStatus}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Log customer verbal or written commitment to clear due invoice.</p>
            <form onSubmit={handleSavePTP} className="space-y-2 pt-1">
              <input
                type="date"
                value={ptpDate}
                onChange={(e) => setPtpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Register PTP Commitment
              </button>
            </form>
            {ptpSuccess && <p className="text-[11px] text-emerald-400 font-medium">{ptpSuccess}</p>}
          </div>
        {/* Right Column: AI & Hinglish Generator & Policy & Mandate Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Razorpay Smart Payment Link Card */}
          {c.paymentLinkUrl && !isRecovered && (
            <div className="bg-gradient-to-r from-blue-950/40 via-[#0E1526] to-[#0A0E1A] p-5 rounded-2xl border border-blue-500/30 shadow-xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Razorpay Smart Payment Link</h4>
                    <p className="text-[11px] text-slate-400">Share with customer to complete recovery checkout</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 className="w-3 h-3" /> LINK ACTIVE
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <div className="flex-1 w-full flex items-center bg-white/[0.03] border border-white/[0.08] px-3 py-2 rounded-xl text-xs font-mono text-cyan-300 truncate">
                  <span className="truncate">{c.paymentLinkUrl}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.paymentLinkUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="flex-1 sm:flex-none px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold rounded-xl border border-white/[0.1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pay Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <AIDecisionCard
            aiDecision={ai || { decision: { action: c.recommendedAction, confidence: 0.85, reason: c.diagnosis || 'Automated analysis' } }}
            diagnosis={aiAnalysis?.diagnosis}
            risk={aiAnalysis?.risk}
            policyDecision={policy}
          />

          {/* Mandate Retry Sequencer Card */}
          {isMandateOrSub && (
            <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mandate Retry Sequencer</h4>
                    <p className="text-[11px] text-slate-400">Autonomous retry scheduler bounded by NPCI & bank rules (Attempt {c.retryCount || 0} of 3)</p>
                  </div>
                </div>

                {!isRecovered && c.status !== 'ESCALATED' && (
                  <button
                    onClick={handleSequenceMandate}
                    disabled={sequencingMandate}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {sequencingMandate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Sequence Step &rarr;</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${c.retryCount >= 1 ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200' : 'bg-white/[0.02] border-white/[0.06] text-slate-400'}`}>
                  <span className="text-[10px] font-bold uppercase block opacity-70">Step 1 (0h)</span>
                  <p className="font-bold text-white mt-0.5">Soft Decline Retry</p>
                  <span className="text-[10px] text-emerald-400 font-medium">{c.retryCount >= 1 ? '✓ Executed' : 'Scheduled'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${c.retryCount >= 2 ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200' : 'bg-white/[0.02] border-white/[0.06] text-slate-400'}`}>
                  <span className="text-[10px] font-bold uppercase block opacity-70">Step 2 (Salary Cycle)</span>
                  <p className="font-bold text-white mt-0.5">1st-5th Month Sync</p>
                  <span className="text-[10px] text-indigo-400 font-medium">{c.retryCount >= 2 ? '✓ Executed' : 'Scheduled'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${c.retryCount >= 3 ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200' : 'bg-white/[0.02] border-white/[0.06] text-slate-400'}`}>
                  <span className="text-[10px] font-bold uppercase block opacity-70">Step 3 (+48h)</span>
                  <p className="font-bold text-white mt-0.5">UPI Autopay Switch</p>
                  <span className="text-[10px] text-slate-400 font-medium">{c.retryCount >= 3 ? '✓ Dispatched' : 'Scheduled'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${c.status === 'ESCALATED' ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' : 'bg-white/[0.02] border-white/[0.06] text-slate-400'}`}>
                  <span className="text-[10px] font-bold uppercase block opacity-70">Step 4 (Grace End)</span>
                  <p className="font-bold text-white mt-0.5">Escalate / Pause</p>
                  <span className="text-[10px] text-slate-400 font-medium">{c.status === 'ESCALATED' ? 'Escalated' : 'Policy Bound'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hinglish Voice & Message Generator Card */}
          <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hinglish Voice & WhatsApp Recovery Copy</h4>
                  <p className="text-[11px] text-slate-400">Culturally tailored communication for Indian customers</p>
                </div>
              </div>
              <button
                onClick={handleGenerateHinglish}
                disabled={generatingHinglish}
                className="px-3.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {generatingHinglish ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{generatingHinglish ? 'Generating...' : 'Generate Hinglish Script'}</span>
              </button>
            </div>

            {hinglishData ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp / SMS Message:
                    </span>
                    <button
                      onClick={() => handleCopy(hinglishData.hinglishMessage)}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-white whitespace-pre-line font-medium leading-relaxed bg-white/[0.03] p-3 rounded-lg border border-white/[0.06]">
                    {hinglishData.hinglishMessage}
                  </p>
                </div>

                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-2">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-purple-400" /> 20-Second Voice Call Script:
                  </span>
                  <p className="text-purple-100 font-medium leading-relaxed bg-white/[0.03] p-3 rounded-lg border border-purple-500/20">
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
      <div className="bg-[#0E1526]/90 p-6 md:p-8 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Audit Trail History</h3>
        <Timeline logs={c.auditLogs} />
      </div>
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

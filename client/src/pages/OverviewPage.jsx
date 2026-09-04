import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import SimulateFailureModal from '../components/SimulateFailureModal';
import JudgeModePanel from '../components/JudgeModePanel';
import { ShieldAlert, TrendingUp, DollarSign, Activity, AlertTriangle, ArrowRight, CheckCircle2, Sliders, Zap, Award, Layers, BarChart2, Check, Clock } from 'lucide-react';

export default function OverviewPage({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [degradation, setDegradation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [showJudgeMode, setShowJudgeMode] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, degRes] = await Promise.all([
        api.getMetrics(),
        api.getDegradationStatus().catch(() => ({ data: null })),
      ]);
      setMetrics(mRes.data);
      if (degRes && degRes.data) setDegradation(degRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Calculating revenue recovery metrics and health from database..." />;
  if (error) return <ErrorState title="Failed to load dashboard metrics" message={error} onRetry={loadData} />;

  const m = metrics || {};
  const funnel = m.funnel || {
    atRisk: { count: m.totalCases || 0, amount: (m.revenueAtRisk || 0) + (m.recoveredRevenue || 0) },
    aiAnalyzed: { count: m.totalCases || 0 },
    eligible: { count: m.totalCases || 0 },
    executed: { count: m.openCases || 0 },
    verified: { count: (m.casesByStatus?.RECOVERED || 0) },
    recovered: { count: (m.casesByStatus?.RECOVERED || 0), amount: m.recoveredRevenue || 0 },
  };

  const attribution = m.attribution || {
    PAYMENT_FAILURE: { recovered: m.recoveredRevenue || 0, atRisk: m.revenueAtRisk || 0, count: 0 },
    CHECKOUT_ABANDONMENT: { recovered: 0, atRisk: 0, count: 0 },
    SUBSCRIPTION_FAILURE: { recovered: 0, atRisk: 0, count: 0 },
    OVERDUE_RECEIVABLE: { recovered: 0, atRisk: 0, count: 0 },
    MANDATE_FAILURE: { recovered: 0, atRisk: 0, count: 0 },
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Tagline */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-[#0E1526] to-[#0A0E1A] text-white p-6 md:p-8 rounded-3xl shadow-xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              RecoverAI Enterprise
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Track 03 Verified
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black mt-2 text-white tracking-tight">
            Find revenue slipping away and win it back.
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Autonomous closed-loop detection, Gemini AI diagnosis, policy guardrails, bounded Razorpay execution, and cryptographic webhook verification.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative z-1">
          <button
            onClick={() => setShowJudgeMode(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Judge Mode</span>
          </button>

          <button
            onClick={() => setShowSimModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold rounded-xl border border-white/[0.1] transition-all shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Simulate Failure</span>
          </button>
        </div>
      </div>

      {/* Payment Channel Degradation Alert */}
      {degradation && degradation.activeDegradationDetected && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-amber-200">Payment Degradation Warning: Channel Success Dropped</strong>
              <p className="text-[11px] text-amber-400/90 mt-0.5">{degradation.alertMessage}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 rounded-lg text-amber-300 border border-amber-500/40">
            AUTO-GUARDRAIL ENGAGED
          </span>
        </div>
      )}

      {/* Hero Modals */}
      <SimulateFailureModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        onSuccess={(newCaseId) => onNavigate(`/recovery-cases/${newCaseId}`)}
      />

      <JudgeModePanel
        isOpen={showJudgeMode}
        onClose={() => setShowJudgeMode(false)}
        onNavigate={onNavigate}
      />

      {/* Top 4 Business Outcome Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div onClick={() => onNavigate('/at-risk')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard
            title="Revenue at Risk"
            value={formatPaiseToRupees(m.revenueAtRisk)}
            subtext="Active cases requiring recovery →"
            icon={ShieldAlert}
            badgeColor="rose"
            badgeText="HIGH IMPACT"
          />
        </div>

        <div onClick={() => onNavigate('/evaluations')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard
            title="Recovered Revenue"
            value={formatPaiseToRupees(m.recoveredRevenue)}
            subtext="Verified via Razorpay Webhooks →"
            icon={DollarSign}
            badgeColor="emerald"
            badgeText="MEASURED REVENUE"
          />
        </div>

        <div onClick={() => onNavigate('/evaluations')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard
            title="Revenue Recovery Rate"
            value={`${m.revenueRecoveryRate}%`}
            subtext="Measured across all cases →"
            icon={TrendingUp}
            badgeColor="indigo"
            badgeText="BENCHMARKED"
          />
        </div>

        <div onClick={() => onNavigate('/recovery-cases')} className="cursor-pointer transition-transform hover:-translate-y-1">
          <MetricCard
            title="Active Recovery Cases"
            value={m.openCases}
            subtext="Interventions in flight →"
            icon={Activity}
            badgeColor="amber"
            badgeText="ACTIVE"
          />
        </div>
      </div>

      {/* Closed-Loop Recovery Funnel */}
      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Closed-Loop Recovery Funnel</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Dynamic Live Pipeline</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">1. At Risk</span>
            <span className="text-sm font-black text-white block mt-1">{funnel.atRisk.count} Cases</span>
            <span className="text-[10px] text-rose-400 font-mono font-medium">{formatPaiseToRupees(funnel.atRisk.amount)}</span>
          </div>

          <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">2. AI Analyzed</span>
            <span className="text-sm font-black text-indigo-200 block mt-1">{funnel.aiAnalyzed.count} Cases</span>
            <span className="text-[10px] text-indigo-300 font-medium">Gemini 2.5</span>
          </div>

          <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Policy Checked</span>
            <span className="text-sm font-black text-white block mt-1">{funnel.eligible.count} Cases</span>
            <span className="text-[10px] text-emerald-400 font-medium">Guardrails Cleared</span>
          </div>

          <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">4. Executed</span>
            <span className="text-sm font-black text-indigo-200 block mt-1">{funnel.executed.count} Cases</span>
            <span className="text-[10px] text-indigo-300 font-medium">Links & Retries</span>
          </div>

          <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">5. Verified</span>
            <span className="text-sm font-black text-white block mt-1">{funnel.verified.count} Cases</span>
            <span className="text-[10px] text-cyan-400 font-medium">HMAC Webhooks</span>
          </div>

          <div className="p-3.5 bg-emerald-500/15 rounded-xl border border-emerald-500/30 text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">6. Recovered</span>
            <span className="text-sm font-black text-emerald-200 block mt-1">{funnel.recovered.count} Cases</span>
            <span className="text-[10px] text-emerald-300 font-mono font-bold">{formatPaiseToRupees(funnel.recovered.amount)}</span>
          </div>
        </div>
      </div>

      {/* Category Recovery Attribution */}
      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Revenue Recovery by Problem Category</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Multi-rail Attribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <span className="text-slate-400 font-bold block text-[11px]">Payment Failures</span>
            <span className="text-base font-black text-emerald-400 block mt-1">
              {formatPaiseToRupees(attribution.PAYMENT_FAILURE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">{attribution.PAYMENT_FAILURE.count} cases tracked</span>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <span className="text-slate-400 font-bold block text-[11px]">Checkout Dropoffs</span>
            <span className="text-base font-black text-emerald-400 block mt-1">
              {formatPaiseToRupees(attribution.CHECKOUT_ABANDONMENT.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">{attribution.CHECKOUT_ABANDONMENT.count} cases tracked</span>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <span className="text-slate-400 font-bold block text-[11px]">Subscriptions</span>
            <span className="text-base font-black text-emerald-400 block mt-1">
              {formatPaiseToRupees(attribution.SUBSCRIPTION_FAILURE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">{attribution.SUBSCRIPTION_FAILURE.count} cases tracked</span>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <span className="text-slate-400 font-bold block text-[11px]">B2B Receivables</span>
            <span className="text-base font-black text-emerald-400 block mt-1">
              {formatPaiseToRupees(attribution.OVERDUE_RECEIVABLE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">{attribution.OVERDUE_RECEIVABLE.count} cases tracked</span>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <span className="text-slate-400 font-bold block text-[11px]">Mandate Sequencer</span>
            <span className="text-base font-black text-emerald-400 block mt-1">
              {formatPaiseToRupees(attribution.MANDATE_FAILURE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">{attribution.MANDATE_FAILURE.count} cases tracked</span>
          </div>
        </div>
      </div>

      {/* Operational Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('/policies')}
          className="bg-[#0E1526]/90 p-5 rounded-2xl border border-white/[0.07] shadow-xl flex items-center justify-between cursor-pointer hover:border-indigo-500/40 hover:bg-[#121B32] transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Engine</span>
            <p className="text-lg font-black text-white mt-1">
              {m.policyBlockedCases || 0} Blocked Actions
            </p>
            <p className="text-[11px] text-indigo-400 mt-0.5">Strict stopping rules enforced →</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/recovery-cases')}
          className="bg-[#0E1526]/90 p-5 rounded-2xl border border-white/[0.07] shadow-xl flex items-center justify-between cursor-pointer hover:border-rose-500/40 hover:bg-[#121B32] transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Cases</span>
            <p className="text-lg font-black text-rose-400 mt-1">
              {m.highRiskCases + m.criticalRiskCases} Cases
            </p>
            <p className="text-[11px] text-rose-400/80 mt-0.5">Risk Score &gt; 50 →</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/recovery-cases')}
          className="bg-[#0E1526]/90 p-5 rounded-2xl border border-white/[0.07] shadow-xl flex items-center justify-between cursor-pointer hover:border-amber-500/40 hover:bg-[#121B32] transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escalated to Ops</span>
            <p className="text-lg font-black text-amber-400 mt-1">
              {m.escalatedCases} Cases
            </p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">Human review required →</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Needs Attention Table */}
      <div className="bg-[#0E1526]/90 rounded-2xl border border-white/[0.07] shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="p-5 md:p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Cases Needing Attention</h3>
            <p className="text-xs text-slate-400 mt-0.5">High risk failures and escalation queues</p>
          </div>
          <button
            onClick={() => onNavigate('/recovery-cases')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            View All Cases <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {m.needsAttention?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Case ID</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Amount at Risk</th>
                  <th className="py-3.5 px-6">Risk Level</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {m.needsAttention.map((rc) => (
                  <tr key={rc._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-cyan-300">{rc.caseId}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-200">{rc.customerId?.name || 'Customer'}</td>
                    <td className="py-3.5 px-6 text-slate-400">{rc.issueType}</td>
                    <td className="py-3.5 px-6 font-bold text-white">{formatPaiseToRupees(rc.amountAtRisk)}</td>
                    <td className="py-3.5 px-6">
                      <RiskBadge level={rc.riskLevel} score={rc.riskScore} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={rc.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => onNavigate(`/recovery-cases/${rc.caseId}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        Review &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            No high risk or escalated cases currently require attention.
          </div>
        )}
      </div>
    </div>
  );
}

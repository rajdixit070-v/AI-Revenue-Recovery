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
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
              RecoverAI Enterprise
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Track 03 Verified
            </span>
          </div>
          <h2 className="text-xl font-extrabold mt-1.5 text-white tracking-tight">Recover revenue before it slips away.</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Closed-loop detection, Gemini AI root-cause diagnosis, strategy optimizer, bounded Razorpay execution, and cryptographic webhook verification.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowJudgeMode(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Award className="w-4 h-4 fill-white" />
            <span>Judge Mode</span>
          </button>

          <button
            onClick={() => setShowSimModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Simulate Failure</span>
          </button>
        </div>
      </div>

      {/* Payment Channel Degradation Alert (Phase 8) */}
      {degradation && degradation.activeDegradationDetected && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300">
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

      {/* Top 4 Business Outcome Metrics (Interactive & Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div onClick={() => onNavigate('/at-risk')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Revenue at Risk"
            value={formatPaiseToRupees(m.revenueAtRisk)}
            subtext="Active cases requiring recovery &rarr;"
            icon={ShieldAlert}
            variant="warning"
          />
        </div>

        <div onClick={() => onNavigate('/evaluations')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Recovered Revenue"
            value={formatPaiseToRupees(m.recoveredRevenue)}
            subtext="Verified via Razorpay Webhooks &rarr;"
            icon={DollarSign}
            variant="success"
          />
        </div>

        <div onClick={() => onNavigate('/evaluations')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Revenue Recovery Rate"
            value={`${m.revenueRecoveryRate}%`}
            subtext="Measured across all eligible cases &rarr;"
            icon={TrendingUp}
            variant="info"
          />
        </div>

        <div onClick={() => onNavigate('/recovery-cases')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Active Recovery Cases"
            value={m.openCases}
            subtext="Interventions in flight &rarr;"
            icon={Activity}
            variant="default"
          />
        </div>
      </div>

      {/* Closed-Loop Recovery Funnel (Phase 20) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Closed-Loop Recovery Funnel</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Dynamic Live Pipeline</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">1. At Risk</span>
            <span className="text-sm font-extrabold text-slate-900 block mt-1">{funnel.atRisk.count} Cases</span>
            <span className="text-[10px] text-slate-500 font-mono">{formatPaiseToRupees(funnel.atRisk.amount)}</span>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-500 block">2. AI Analyzed</span>
            <span className="text-sm font-extrabold text-indigo-950 block mt-1">{funnel.aiAnalyzed.count} Cases</span>
            <span className="text-[10px] text-indigo-600 font-medium">Gemini 3.6 Flash</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Policy Eligible</span>
            <span className="text-sm font-extrabold text-slate-900 block mt-1">{funnel.eligible.count} Cases</span>
            <span className="text-[10px] text-slate-500 font-medium">Guardrails Cleared</span>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-500 block">4. Interventions</span>
            <span className="text-sm font-extrabold text-indigo-950 block mt-1">{funnel.executed.count} Cases</span>
            <span className="text-[10px] text-indigo-600 font-medium">Test Links / Retries</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">5. Verified</span>
            <span className="text-sm font-extrabold text-slate-900 block mt-1">{funnel.verified.count} Cases</span>
            <span className="text-[10px] text-slate-500 font-medium">HMAC Webhooks</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">6. Recovered</span>
            <span className="text-sm font-extrabold text-emerald-950 block mt-1">{funnel.recovered.count} Cases</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">{formatPaiseToRupees(funnel.recovered.amount)}</span>
          </div>
        </div>
      </div>

      {/* Category Recovery Attribution (Phase 15) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Revenue Recovery by Category</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Multi-rail Attribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block text-[11px]">Payment Failures</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">
              {formatPaiseToRupees(attribution.PAYMENT_FAILURE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{attribution.PAYMENT_FAILURE.count} cases tracked</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block text-[11px]">Checkout Dropoffs</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">
              {formatPaiseToRupees(attribution.CHECKOUT_ABANDONMENT.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{attribution.CHECKOUT_ABANDONMENT.count} cases tracked</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block text-[11px]">Subscriptions</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">
              {formatPaiseToRupees(attribution.SUBSCRIPTION_FAILURE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{attribution.SUBSCRIPTION_FAILURE.count} cases tracked</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block text-[11px]">B2B Receivables</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">
              {formatPaiseToRupees(attribution.OVERDUE_RECEIVABLE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{attribution.OVERDUE_RECEIVABLE.count} cases tracked</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-bold block text-[11px]">Mandate Recoveries</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">
              {formatPaiseToRupees(attribution.MANDATE_FAILURE.recovered)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{attribution.MANDATE_FAILURE.count} cases tracked</span>
          </div>
        </div>
      </div>

      {/* Operational Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('/policies')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Engine</span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {m.policyBlockedCases || 0} Blocked Actions
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Strict stopping rules enforced &rarr;</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/recovery-cases')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Cases</span>
            <p className="text-lg font-bold text-rose-600 mt-1">
              {m.highRiskCases + m.criticalRiskCases} Cases
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Risk Score &gt; 50 &rarr;</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/recovery-cases')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escalated to Ops</span>
            <p className="text-lg font-bold text-amber-600 mt-1">
              {m.escalatedCases} Cases
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Human review required &rarr;</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Needs Attention Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cases Needing Attention</h3>
            <p className="text-xs text-slate-500 mt-0.5">High risk failures and escalation queues</p>
          </div>
          <button
            onClick={() => onNavigate('/recovery-cases')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            View All Cases <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {m.needsAttention?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Case ID</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Amount at Risk</th>
                  <th className="py-3 px-6">Risk Level</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {m.needsAttention.map((rc) => (
                  <tr key={rc._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{rc.caseId}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">{rc.customerId?.name || 'Customer'}</td>
                    <td className="py-3.5 px-6 text-slate-600">{rc.issueType}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">{formatPaiseToRupees(rc.amountAtRisk)}</td>
                    <td className="py-3.5 px-6">
                      <RiskBadge level={rc.riskLevel} score={rc.riskScore} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={rc.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => onNavigate(`/recovery-cases/${rc.caseId}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No high risk or escalated cases currently require attention.
          </div>
        )}
      </div>
    </div>
  );
}

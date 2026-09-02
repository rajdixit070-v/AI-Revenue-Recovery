import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { ShieldAlert, TrendingUp, DollarSign, Activity, AlertTriangle, ArrowRight, CheckCircle2, Sliders, Zap } from 'lucide-react';
import SimulateFailureModal from '../components/SimulateFailureModal';

export default function OverviewPage({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSimModal, setShowSimModal] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMetrics();
      setMetrics(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) return <LoadingState message="Calculating revenue recovery metrics from database..." />;
  if (error) return <ErrorState title="Failed to load dashboard metrics" message={error} onRetry={loadMetrics} />;

  const m = metrics || {};

  return (
    <div className="space-y-8">
      {/* Top Banner Tagline */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">RecoverAI Platform</span>
          <h2 className="text-xl font-extrabold mt-1">Recover revenue before it disappears.</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Automated detection, AI root-cause diagnosis, and policy-bounded recovery execution with full auditability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Simulate Live Failure</span>
          </button>
          <button
            onClick={() => onNavigate('/recovery-cases')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>View Cases</span> &rarr;
          </button>
        </div>
      </div>

      <SimulateFailureModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        onSuccess={(newCaseId) => onNavigate(`/recovery-cases/${newCaseId}`)}
      />

      {/* Top 4 Business Outcome Metrics (Interactive & Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div onClick={() => onNavigate('/at-risk')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Revenue at Risk"
            value={formatPaiseToRupees(m.revenueAtRisk)}
            subtext="Active cases requiring recovery &rarr;"
            icon={DollarSign}
          />
        </div>
        <div onClick={() => onNavigate('/recovery-cases')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Recovered Revenue"
            value={formatPaiseToRupees(m.recoveredRevenue)}
            subtext="Confirmed recovered revenue &rarr;"
            icon={TrendingUp}
            badgeText="Verified"
            badgeColor="emerald"
          />
        </div>
        <div onClick={() => onNavigate('/evaluations')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Revenue Recovery Rate"
            value={`${m.revenueRecoveryRate}%`}
            subtext={`Benchmark: ${m.caseRecoveryRate}% &rarr;`}
            icon={CheckCircle2}
          />
        </div>
        <div onClick={() => onNavigate('/recovery-cases')} className="cursor-pointer transition-transform hover:-translate-y-0.5">
          <MetricCard
            title="Open Recovery Cases"
            value={m.openCases}
            subtext={`Total cases: ${m.totalCases} &rarr;`}
            icon={Activity}
          />
        </div>
      </div>

      {/* Secondary Metrics Bar (All 4 Tiles Functional & Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div onClick={() => onNavigate('/payments')} className="p-3 border-r border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
          <span className="text-xs font-semibold text-slate-400">Failed Payments</span>
          <p className="text-lg font-extrabold text-slate-800 mt-0.5 flex items-center justify-between">
            <span>{m.failedPayments}</span>
            <span className="text-[10px] text-slate-400 font-normal">&rarr;</span>
          </p>
        </div>
        <div onClick={() => onNavigate('/at-risk')} className="p-3 border-r border-slate-100 last:border-0 cursor-pointer hover:bg-amber-50/50 rounded-lg transition-colors">
          <span className="text-xs font-semibold text-slate-400">High / Critical Risk</span>
          <p className="text-lg font-extrabold text-amber-600 mt-0.5 flex items-center justify-between">
            <span>{(m.highRiskCases || 0) + (m.criticalRiskCases || 0)}</span>
            <span className="text-[10px] text-amber-500 font-normal">&rarr;</span>
          </p>
        </div>
        <div onClick={() => onNavigate('/policies')} className="p-3 border-r border-slate-100 last:border-0 cursor-pointer hover:bg-indigo-50/50 rounded-lg transition-colors">
          <span className="text-xs font-semibold text-slate-400">Policy Blocks</span>
          <p className="text-lg font-extrabold text-indigo-600 mt-0.5 flex items-center justify-between">
            <span>{m.policyBlockedCases}</span>
            <span className="text-[10px] text-indigo-500 font-normal">&rarr;</span>
          </p>
        </div>
        <div onClick={() => onNavigate('/recovery-cases')} className="p-3 cursor-pointer hover:bg-rose-50/50 rounded-lg transition-colors">
          <span className="text-xs font-semibold text-slate-400">Escalated Cases</span>
          <p className="text-lg font-extrabold text-rose-600 mt-0.5 flex items-center justify-between">
            <span>{m.escalatedCases}</span>
            <span className="text-[10px] text-rose-500 font-normal">&rarr;</span>
          </p>
        </div>
      </div>

      {/* Human Attention Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Needs Attention Queue</h3>
              <p className="text-xs text-slate-500">Cases requiring ops review or priority intervention</p>
            </div>
          </div>
          <button onClick={() => onNavigate('/at-risk')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All At Risk Queue &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {m.needsAttention?.length > 0 ? (
            m.needsAttention.map((c) => (
              <div key={c._id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <RiskBadge level={c.riskLevel} score={c.riskScore} />
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-900">{c.caseId}</span>
                    <h4 className="text-xs font-semibold text-slate-700 mt-0.5">{c.customerId?.name || 'Customer'} ({c.issueType})</h4>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{formatPaiseToRupees(c.amountAtRisk)}</span>
                    <p className="text-[11px] text-slate-400">Amount at Risk</p>
                  </div>
                  <StatusBadge status={c.status} />
                  <button
                    onClick={() => onNavigate(`/recovery-cases/${c.caseId}`)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No high-risk cases currently require attention.</div>
          )}
        </div>
      </div>
    </div>
  );
}

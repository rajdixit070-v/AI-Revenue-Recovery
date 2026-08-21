import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/money';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EnvironmentIndicator from '../components/EnvironmentIndicator';
import { DollarSign, TrendingUp, ShieldCheck, ArrowLeft, Download, AlertTriangle, CheckCircle2, Sliders, Brain } from 'lucide-react';

export default function BatchReportPage({ batchId, onNavigate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!batchId) return;
    api.getBatchReport(batchId)
      .then(res => setReport(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleExportCSV = () => {
    if (!report || !report.sampleResults) return;
    const headers = ['CaseID', 'IssueType', 'RiskLevel', 'AmountAtRisk', 'RecoveredAmount', 'FinalStatus', 'FinalAction', 'DecisionSource', 'PolicyAllowed', 'Outcome'];
    const rows = report.sampleResults.map(r => [
      r.caseId, r.issueType, r.riskLevel, r.initialAmountAtRisk, r.finalRecoveredAmount, r.finalStatus, r.finalAction, r.decisionSource, r.policyAllowed, r.outcome
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Evaluation_Report_${batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingState message={`Generating evaluation report for ${batchId}...`} />;
  if (error) return <ErrorState title="Batch report unavailable" message={error} />;

  const s = report?.summary || {};
  const b = report?.breakdowns || {};

  return (
    <div className="space-y-8">
      <button
        onClick={() => onNavigate('/evaluations')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Evaluations
      </button>

      {/* Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold font-mono text-slate-900">{s.batchId}</h2>
            <EnvironmentIndicator mode={s.mode === 'RAZORPAY_TEST' ? 'RAZORPAY TEST MODE' : 'SIMULATION MODE'} />
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {s.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Processed {s.processedCases} cases &bull; Completed: {formatDate(s.completedAt)}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Simulation Banner */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-950 flex items-center justify-between">
        <span>SIMULATION MODE — NO REAL MONEY MOVED. All financial values represent simulated revenue outcome calculations.</span>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Total Amount At Risk" value={formatPaiseToRupees(s.totalAmountAtRisk)} icon={DollarSign} />
        <MetricCard title="Simulated Recovered Revenue" value={formatPaiseToRupees(s.totalRecoveredAmount)} icon={TrendingUp} badgeText="Simulated" badgeColor="emerald" />
        <MetricCard title="Revenue Recovery Rate" value={`${s.recoveryRate}%`} subtext={`Case Rate: ${s.caseRecoveryRate}%`} icon={CheckCircle2} />
        <MetricCard title="Successful Recoveries" value={`${s.successfulRecoveries} / ${s.processedCases}`} icon={ShieldCheck} />
      </div>

      {/* Operational Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-xs">
        <div className="p-3 border-r border-slate-100 last:border-0">
          <span className="text-slate-400 font-semibold">Recovered:</span>
          <p className="text-base font-extrabold text-emerald-600 mt-0.5">{s.successfulRecoveries}</p>
        </div>
        <div className="p-3 border-r border-slate-100 last:border-0">
          <span className="text-slate-400 font-semibold">Policy Blocked:</span>
          <p className="text-base font-extrabold text-indigo-600 mt-0.5">{s.policyBlockedCases}</p>
        </div>
        <div className="p-3 border-r border-slate-100 last:border-0">
          <span className="text-slate-400 font-semibold">Escalated:</span>
          <p className="text-base font-extrabold text-rose-600 mt-0.5">{s.escalatedCases}</p>
        </div>
        <div className="p-3 border-r border-slate-100 last:border-0">
          <span className="text-slate-400 font-semibold">Stopped:</span>
          <p className="text-base font-extrabold text-slate-700 mt-0.5">{s.stoppedCases}</p>
        </div>
        <div className="p-3">
          <span className="text-slate-400 font-semibold">AI vs Fallback:</span>
          <p className="text-base font-extrabold text-purple-600 mt-0.5">{s.aiDecisionCount} AI / {s.fallbackDecisionCount} Fallback</p>
        </div>
      </div>

      {/* Case Level Sample Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Case-Level Evaluation Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Case ID</th>
                <th className="py-3.5 px-6">Issue Category</th>
                <th className="py-3.5 px-6">Risk</th>
                <th className="py-3.5 px-6">Initial At Risk</th>
                <th className="py-3.5 px-6">Recovered</th>
                <th className="py-3.5 px-6">Final Action</th>
                <th className="py-3.5 px-6">Decision Source</th>
                <th className="py-3.5 px-6">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {report?.sampleResults?.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900">{r.caseId}</td>
                  <td className="py-4 px-6 font-medium text-slate-700">{r.issueType}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{r.riskLevel}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{formatPaiseToRupees(r.initialAmountAtRisk)}</td>
                  <td className="py-4 px-6 font-bold text-emerald-600">{formatPaiseToRupees(r.finalRecoveredAmount)}</td>
                  <td className="py-4 px-6 font-extrabold text-indigo-700">{r.finalAction}</td>
                  <td className="py-4 px-6 font-semibold text-slate-600">{r.decisionSource}</td>
                  <td className="py-4 px-6 font-bold">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.outcome === 'RECOVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      r.outcome === 'POLICY_BLOCKED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      r.outcome === 'ESCALATED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {r.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

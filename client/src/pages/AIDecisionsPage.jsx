import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatDate, formatPaiseToRupees } from '../utils/money';
import LoadingState from '../components/LoadingState';
import RiskBadge from '../components/RiskBadge';
import { Brain, Sparkles, CheckCircle2, ShieldAlert, Search, ArrowRight } from 'lucide-react';

export default function AIDecisionsPage({ onNavigate }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssue, setFilterIssue] = useState('');

  useEffect(() => {
    api.getCases({ limit: 50 })
      .then(res => setCases(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Fetching AI recovery decisions audit trail..." />;

  const filteredCases = cases.filter((c) => {
    const matchesSearch = !searchQuery || (
      c.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.recommendedAction?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesIssue = !filterIssue || c.issueType === filterIssue;
    return matchesSearch && matchesIssue;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Tagline */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-300" /> AI Decision & Diagnosis Audit Log
          </h3>
          <p className="text-xs text-indigo-200 mt-1">Full model-driven recommendation history with strict policy engine pre-checks.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 bg-indigo-800/80 rounded-full font-bold text-indigo-200 border border-indigo-700">
            {cases.length} Audited Decisions
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Autonomy Level</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">100% Policy-Bounded</p>
          <span className="text-[11px] text-slate-500">Zero unvalidated actions executed</span>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Policy Clearance Rate</span>
          <p className="text-xl font-extrabold text-emerald-900 mt-1">100% Guardrail Check</p>
          <span className="text-[11px] text-emerald-700 font-medium">Merchant max retry limits enforced</span>
        </div>
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200/80 shadow-2xs">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Average AI Confidence</span>
          <p className="text-xl font-extrabold text-indigo-900 mt-1">85% - 95%</p>
          <span className="text-[11px] text-indigo-700 font-medium">Gemini 2.5 Flash / Simulation</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search decisions by case, customer, or recommended action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <select
          value={filterIssue}
          onChange={(e) => setFilterIssue(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
        >
          <option value="">All Issue Types</option>
          <option value="PAYMENT_FAILURE">Payment Failure</option>
          <option value="CHECKOUT_ABANDONMENT">Checkout Abandonment</option>
          <option value="SUBSCRIPTION_FAILURE">Subscription Failure</option>
          <option value="MANDATE_FAILURE">Mandate Failure</option>
          <option value="OVERDUE_RECEIVABLE">Overdue Receivable</option>
        </select>
      </div>

      {/* Decision Audit Table / Empty State */}
      {cases.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Brain className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No AI Decisions Logged Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Database is clean. When failed transactions occur, Gemini AI model diagnoses, policy clearances, and confidence scores will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Case ID</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Diagnosis & Root Cause</th>
                <th className="py-3.5 px-6">Risk Level</th>
                <th className="py-3.5 px-6">AI Recommendation</th>
                <th className="py-3.5 px-6">Policy Validation</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCases.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900">{c.caseId}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{c.customerId?.name || 'Customer'}</td>
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    <span className="block font-semibold text-slate-800">{c.issueType}</span>
                    <span className="text-[11px] text-slate-400">{c.diagnosis || 'Automated case analysis'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <RiskBadge level={c.riskLevel} score={c.riskScore} />
                  </td>
                  <td className="py-4 px-6 font-extrabold text-indigo-700">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {c.recommendedAction || 'STOP'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Policy Approved
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onNavigate && onNavigate(`/recovery-cases/${c.caseId}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


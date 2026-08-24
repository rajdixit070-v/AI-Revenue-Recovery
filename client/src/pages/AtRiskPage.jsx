import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { ShieldAlert, ArrowRight, Search, Sparkles, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';

export default function AtRiskPage({ onNavigate }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAtRiskCases();
      setCases(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Prioritizing revenue at risk..." />;
  if (error) return <ErrorState title="Failed to load at-risk queue" message={error} onRetry={loadData} />;

  // Computed summary metrics
  const totalAmountAtRisk = cases.reduce((sum, c) => sum + (c.amountAtRisk || 0), 0);
  const criticalCount = cases.filter(c => c.riskLevel === 'CRITICAL').length;
  const highCount = cases.filter(c => c.riskLevel === 'HIGH').length;

  const filteredCases = cases.filter((c) => {
    const matchesSearch = !searchQuery || (
      c.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issueType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesRisk = selectedRiskFilter === 'ALL' || c.riskLevel === selectedRiskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Summary KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue at Risk</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatPaiseToRupees(totalAmountAtRisk)}</p>
          <span className="text-[11px] text-slate-500">{cases.length} active recoverable cases</span>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Critical & High Priority</span>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{criticalCount + highCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">{criticalCount} Critical &bull; {highCount} High Risk</span>
        </div>
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200/80 shadow-2xs">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">AI Recovery Strategy</span>
          <p className="text-sm font-extrabold text-indigo-950 mt-1">Autonomous Retry & Links</p>
          <span className="text-[11px] text-indigo-700 font-medium">Governed by 3-Retry Policy Limit</span>
        </div>
      </div>

      {/* Search and Risk Level Filter Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search at-risk cases by ID, customer, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        {/* Risk Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRiskFilter(risk)}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                selectedRiskFilter === risk
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {risk === 'ALL' ? 'All Risks' : `${risk} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Case List */}
      {filteredCases.length === 0 ? (
        <EmptyState title="No matching at-risk cases" message="Try selecting another risk level filter or clearing the search query." />
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredCases.map((rc) => (
            <div
              key={rc._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-4">
                <RiskBadge level={rc.riskLevel} score={rc.riskScore} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{rc.caseId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{rc.issueType}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-700 mt-1">{rc.customerId?.name || 'Customer'}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> AI Strategy: <strong className="text-indigo-700">{rc.recommendedAction || 'RETRY_PAYMENT'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">{formatPaiseToRupees(rc.amountAtRisk)}</span>
                  <span className="text-[10px] text-slate-400">Amount at Risk</span>
                </div>
                <StatusBadge status={rc.status} />
                <button
                  onClick={() => onNavigate(`/recovery-cases/${rc.caseId}`)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                  Inspect Case <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


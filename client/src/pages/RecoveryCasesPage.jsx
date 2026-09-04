import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/money';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SimulateFailureModal from '../components/SimulateFailureModal';
import { Search, Filter, ArrowRight, RefreshCw, Zap } from 'lucide-react';

export default function RecoveryCasesPage({ onNavigate }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterIssue, setFilterIssue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSimModal, setShowSimModal] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (filterRisk) params.riskLevel = filterRisk;
      if (filterStatus) params.status = filterStatus;
      if (filterIssue) params.issueType = filterIssue;

      const res = await api.getCases(params);
      setCases(res.data || []);
      if (res.pagination) setTotalPages(res.pagination.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [page, filterRisk, filterStatus, filterIssue]);

  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.caseId?.toLowerCase().includes(q) ||
      c.customerId?.name?.toLowerCase().includes(q) ||
      c.issueType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      {/* Header & Controls */}
      <div className="bg-[#0E1526]/90 p-5 md:p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Case ID, Customer, or Issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters and New Simulation Button */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => setShowSimModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Live Failure</span>
          </button>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-300 font-semibold focus:outline-none"
          >
            <option value="" className="bg-[#0E162B]">All Risk Levels</option>
            <option value="LOW" className="bg-[#0E162B]">Low Risk</option>
            <option value="MEDIUM" className="bg-[#0E162B]">Medium Risk</option>
            <option value="HIGH" className="bg-[#0E162B]">High Risk</option>
            <option value="CRITICAL" className="bg-[#0E162B]">Critical Risk</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-300 font-semibold focus:outline-none"
          >
            <option value="" className="bg-[#0E162B]">All Statuses</option>
            <option value="OPEN" className="bg-[#0E162B]">Open</option>
            <option value="ANALYZING" className="bg-[#0E162B]">Analyzing</option>
            <option value="ACTION_PENDING" className="bg-[#0E162B]">Action Pending</option>
            <option value="IN_RECOVERY" className="bg-[#0E162B]">In Recovery</option>
            <option value="RECOVERED" className="bg-[#0E162B]">Recovered</option>
            <option value="ESCALATED" className="bg-[#0E162B]">Escalated</option>
            <option value="EXPIRED" className="bg-[#0E162B]">Expired</option>
            <option value="CLOSED" className="bg-[#0E162B]">Closed</option>
          </select>

          <button onClick={loadCases} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-slate-300 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SimulateFailureModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        onSuccess={(newCaseId) => onNavigate(`/recovery-cases/${newCaseId}`)}
      />

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading recovery cases..." />
      ) : error ? (
        <ErrorState title="Failed to load cases" message={error} onRetry={loadCases} />
      ) : filteredCases.length === 0 ? (
        <EmptyState title="No recovery cases found" message="Try adjusting your search or filter parameters." />
      ) : (
        <div className="bg-[#0E1526]/90 rounded-2xl border border-white/[0.07] shadow-xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Case ID</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Issue Category</th>
                  <th className="py-3.5 px-6">Amount at Risk</th>
                  <th className="py-3.5 px-6">Risk Assessment</th>
                  <th className="py-3.5 px-6">AI Recommendation</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredCases.map((rc) => (
                  <tr key={rc._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-cyan-300">{rc.caseId}</td>
                    <td className="py-4 px-6 font-semibold text-slate-200">{rc.customerId?.name || 'Customer'}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{rc.issueType}</td>
                    <td className="py-4 px-6 font-bold text-white">{formatPaiseToRupees(rc.amountAtRisk)}</td>
                    <td className="py-4 px-6">
                      <RiskBadge level={rc.riskLevel} score={rc.riskScore} />
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-400">{rc.recommendedAction || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={rc.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onNavigate(`/recovery-cases/${rc.caseId}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

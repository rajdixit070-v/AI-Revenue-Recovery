import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function AtRiskPage({ onNavigate }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getCases({ limit: 50 });
      // Only keep open/active cases
      const active = (res.data || []).filter(c => ['OPEN', 'ANALYZING', 'ACTION_PENDING', 'IN_RECOVERY'].includes(c.status));
      // Sort by risk score descending
      active.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
      setCases(active);
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

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-2xl flex items-center justify-between text-amber-900">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Revenue At Risk Priority Queue
          </h3>
          <p className="text-xs text-amber-800 mt-1">Cases ordered primarily by Risk Score and Amount at Risk for operational focus.</p>
        </div>
        <span className="text-xs font-extrabold px-3 py-1 bg-amber-200/60 rounded-full">{cases.length} Active At-Risk Cases</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cases.map((rc) => (
          <div key={rc._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-4">
              <RiskBadge level={rc.riskLevel} score={rc.riskScore} />
              <div>
                <span className="text-xs font-mono font-bold text-slate-900">{rc.caseId}</span>
                <h4 className="text-xs font-semibold text-slate-700 mt-0.5">{rc.customerId?.name || 'Customer'}</h4>
                <p className="text-[11px] text-slate-400">{rc.issueType}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-sm font-extrabold text-slate-900">{formatPaiseToRupees(rc.amountAtRisk)}</span>
                <p className="text-[11px] text-slate-400">At Risk</p>
              </div>
              <StatusBadge status={rc.status} />
              <button
                onClick={() => onNavigate(`/recovery-cases/${rc.caseId}`)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
              >
                View Case <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

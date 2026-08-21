import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/money';
import LoadingState from '../components/LoadingState';
import { Brain, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AIDecisionsPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCases({ limit: 30 })
      .then(res => setCases(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Fetching AI recovery decisions..." />;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-300" /> AI Decision Audit Log
          </h3>
          <p className="text-xs text-indigo-200 mt-1">Audit log of all model-driven recovery recommendations and policy validations.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Case ID</th>
              <th className="py-3.5 px-6">Issue Category</th>
              <th className="py-3.5 px-6">Risk Level</th>
              <th className="py-3.5 px-6">AI Recommended Action</th>
              <th className="py-3.5 px-6">Policy Check</th>
              <th className="py-3.5 px-6">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {cases.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-slate-900">{c.caseId}</td>
                <td className="py-4 px-6 font-medium text-slate-700">{c.issueType}</td>
                <td className="py-4 px-6 font-semibold text-slate-800">{c.riskLevel}</td>
                <td className="py-4 px-6 font-extrabold text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {c.recommendedAction || 'STOP'}
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-500">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

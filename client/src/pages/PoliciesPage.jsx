import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';
import { Sliders, ShieldCheck } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPolicies()
      .then(res => setPolicies(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading recovery policies..." />;

  return (
    <div className="space-y-6">
      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" /> Recovery Guardrail Policy Layer
        </h3>
        <p className="text-xs text-slate-400 mt-1">Read-only business guardrails governing AI action boundaries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((p) => (
          <div key={p._id} className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h4 className="text-sm font-bold text-white">{p.name}</h4>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <span className="text-slate-400 block">Max Retries:</span>
                <span className="font-bold text-white text-sm">{p.maxRetries}</span>
              </div>
              <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <span className="text-slate-400 block">Max Reminders:</span>
                <span className="font-bold text-white text-sm">{p.maxReminders}</span>
              </div>
              <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <span className="text-slate-400 block">Window Duration:</span>
                <span className="font-bold text-white text-sm">{p.recoveryWindowHours}h</span>
              </div>
              <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <span className="text-slate-400 block">Max Escalation Level:</span>
                <span className="font-bold text-white text-sm">{p.maxEscalationLevel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

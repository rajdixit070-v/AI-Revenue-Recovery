import React from 'react';
import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';

export default function PolicyDecisionCard({ policyDecision, proposedAction }) {
  if (!policyDecision) return null;

  const allowed = policyDecision.allowed;

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-xl ${allowed ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-rose-500/10 border-rose-500/25'}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${allowed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
            {allowed ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Policy Engine Validation</h3>
            <p className="text-xs text-slate-400">Evaluates proposed action against business guardrails</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          allowed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
        }`}>
          {allowed ? 'APPROVED' : 'BLOCKED BY POLICY'}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <div className="font-semibold text-slate-300">Proposed Action: <span className="text-white font-bold">{proposedAction}</span></div>

        {allowed ? (
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-2 text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Retry and reminder counts within allowed policy limits</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Active recovery window is open</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Customer account is active (not opted out / blocked)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 mt-2">
            {policyDecision.violations?.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-rose-300 font-medium">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

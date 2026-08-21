import React from 'react';
import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';

export default function PolicyDecisionCard({ policyDecision, proposedAction }) {
  if (!policyDecision) return null;

  const allowed = policyDecision.allowed;

  return (
    <div className={`p-6 rounded-2xl border ${allowed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {allowed ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Policy Engine Validation</h3>
            <p className="text-xs text-slate-500">Evaluates proposed action against business guardrails</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          allowed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
        }`}>
          {allowed ? 'APPROVED' : 'BLOCKED BY POLICY'}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <div className="font-semibold text-slate-700">Proposed Action: <span className="text-slate-900 font-bold">{proposedAction}</span></div>

        {allowed ? (
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-2 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Retry and reminder counts within allowed policy limits</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Active recovery window is open</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Customer account is active (not opted out / blocked)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 mt-2">
            {policyDecision.violations?.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-rose-800 font-medium">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

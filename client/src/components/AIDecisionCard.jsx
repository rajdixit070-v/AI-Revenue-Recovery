import React from 'react';
import { Brain, CheckCircle2, AlertCircle, Sparkles, Stethoscope, ShieldCheck, ArrowRight, TrendingUp, Zap, HelpCircle } from 'lucide-react';
import { formatPaiseToRupees } from '../utils/money';

export default function AIDecisionCard({ aiDecision, diagnosis, risk, policyDecision }) {
  if (!aiDecision) return null;

  const decision = aiDecision.decision || aiDecision;
  const confidencePct = Math.round((decision.confidence || 0) * 100);
  const diag = diagnosis || decision.diagnosis || {};
  const strategies = decision.strategyComparison || [];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Recovery Recommendation & Strategy Optimizer</h3>
            <p className="text-xs text-slate-500">Provider: <strong className="text-indigo-600">{aiDecision.provider || 'Gemini 3.6 Flash / Fallback'}</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-900">AI Confidence: {confidencePct}%</span>
        </div>
      </div>

      {/* Step-by-Step AI Reasoning Trail */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          <span>AI Root-Cause Diagnosis & Telemetry Signals:</span>
        </div>
        <div className="text-xs text-slate-700 space-y-1.5 pl-6">
          <p>
            <strong className="text-slate-900">Primary Cause:</strong> {diag.probableCause || diag.primaryCause || 'Payment failure detected'}
          </p>
          {diag.recommendedStrategy && (
            <p>
              <strong className="text-slate-900">Recommended Strategy:</strong> {diag.recommendedStrategy}
            </p>
          )}
          {Array.isArray(diag.reasoning) && diag.reasoning.length > 0 && (
            <div className="pt-1">
              <strong className="text-slate-900 block mb-1">Evidence & Signals:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                {diag.reasoning.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Comparison Matrix (Phase 4 & 16 Winning Feature) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Multi-Strategy Recovery Comparison
          </span>
          <span className="text-[11px] text-slate-400">Ranked by Expected Recovery & Policy Safety</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {strategies.map((strat, idx) => {
            const isSelected = strat.action === decision.action;
            const probPct = Math.round((strat.probability || 0.5) * 100);

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 text-[11px] font-mono">{strat.action}</span>
                  {isSelected && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Probability:</span>
                    <span className="font-bold text-slate-900">{probPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-400'}`}
                      style={{ width: `${probPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-slate-500">Expected:</span>
                    <span className="font-bold text-emerald-700">
                      {strat.expectedRecovery ? formatPaiseToRupees(strat.expectedRecovery) : `${probPct}% of due`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-slate-400">Friction:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        strat.customerFriction === 'HIGH'
                          ? 'bg-rose-100 text-rose-700'
                          : strat.customerFriction === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {strat.customerFriction || 'LOW'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WHY THIS ACTION? Explainability Box (Phase 21) */}
      <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-slate-50 rounded-xl border border-indigo-100 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Why Did AI Choose {decision.action}?</span>
        </div>
        <p className="text-slate-700 leading-relaxed pl-5">
          {decision.reason || `AI chose ${decision.action} because it maximizes expected recovered revenue while minimizing customer friction and complying with merchant retry policies.`}
        </p>
      </div>

      {/* Proposed Action & Expected Outcome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recommended Action</span>
          <div className="mt-1 text-lg font-extrabold text-indigo-700">{decision.action || 'STOP'}</div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">{decision.reason}</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expected Outcome</span>
          <p className="mt-1 text-xs font-medium text-slate-800 leading-relaxed">{decision.expectedOutcome || 'Resolution of recovery case'}</p>
          {decision.alternativeActions?.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Alternatives:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {decision.alternativeActions.map((alt, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[11px] font-medium">
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-xl space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Recovery Recommendation & Strategy Optimizer</h3>
            <p className="text-xs text-slate-400">Provider: <strong className="text-indigo-400">{aiDecision.provider || 'Gemini 3.6 Flash / Fallback'}</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300">AI Confidence: {confidencePct}%</span>
        </div>
      </div>

      {/* Step-by-Step AI Reasoning Trail */}
      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
          <Stethoscope className="w-4 h-4" />
          <span>AI Root-Cause Diagnosis & Telemetry Signals:</span>
        </div>
        <div className="text-xs text-slate-300 space-y-1.5 pl-6">
          <p>
            <strong className="text-white">Primary Cause:</strong> {diag.probableCause || diag.primaryCause || 'Payment failure detected'}
          </p>
          {diag.recommendedStrategy && (
            <p>
              <strong className="text-white">Recommended Strategy:</strong> {diag.recommendedStrategy}
            </p>
          )}
          {Array.isArray(diag.reasoning) && diag.reasoning.length > 0 && (
            <div className="pt-1">
              <strong className="text-white block mb-1">Evidence & Signals:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                {diag.reasoning.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Comparison Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Multi-Strategy Recovery Comparison
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
                    ? 'bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-bold text-white text-[11px] font-mono truncate" title={strat.action}>
                    {strat.action.replace(/_/g, ' ')}
                  </span>
                  {isSelected && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-500 text-white rounded-md shrink-0 shadow-xs">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Probability:</span>
                    <span className="font-bold text-white">{probPct}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSelected ? 'bg-indigo-500 shadow-[0_0_8px_#818cf8]' : 'bg-slate-500'}`}
                      style={{ width: `${probPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Expected:</span>
                    <span className="font-bold text-emerald-400">
                      {strat.expectedRecovery ? formatPaiseToRupees(strat.expectedRecovery) : `${probPct}% of due`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-slate-400">Friction:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        strat.customerFriction === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : strat.customerFriction === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
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

      {/* WHY THIS ACTION? Explainability Box */}
      <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-xl border border-indigo-500/20 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Why Did AI Choose {decision.action}?</span>
        </div>
        <p className="text-slate-300 leading-relaxed pl-5">
          {decision.reason || `AI chose ${decision.action} because it maximizes expected recovered revenue while minimizing customer friction and complying with merchant retry policies.`}
        </p>
      </div>

      {/* Proposed Action & Expected Outcome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recommended Action</span>
          <div className="mt-1 text-lg font-black text-indigo-400">{decision.action || 'STOP'}</div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{decision.reason}</p>
        </div>

        <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Expected Outcome</span>
          <p className="mt-1 text-xs font-medium text-slate-200 leading-relaxed">{decision.expectedOutcome || 'Resolution of recovery case'}</p>
          {decision.alternativeActions?.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Alternatives:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {decision.alternativeActions.map((alt, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] text-slate-300 rounded text-[11px] font-medium">
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

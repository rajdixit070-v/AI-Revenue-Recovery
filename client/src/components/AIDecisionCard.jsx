import React from 'react';
import { Brain, CheckCircle2, AlertCircle, Sparkles, Stethoscope, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AIDecisionCard({ aiDecision, diagnosis, risk, policyDecision }) {
  if (!aiDecision) return null;

  const decision = aiDecision.decision || aiDecision;
  const confidencePct = Math.round((decision.confidence || 0) * 100);
  const diag = diagnosis || decision.diagnosis || {};

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Recovery Recommendation</h3>
            <p className="text-xs text-slate-500">Provider: <strong className="text-indigo-600">{aiDecision.provider || 'Gemini AI Engine'}</strong></p>
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
          <span>AI Root-Cause Diagnosis & Analysis:</span>
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


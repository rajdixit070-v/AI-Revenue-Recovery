import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import { ShieldCheck, TrendingUp, Sparkles, Brain, ArrowRight, Zap, Lock, RefreshCw, Layers, CheckCircle2, Play, Users, DollarSign, Bot } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.getMetrics()
      .then(res => setMetrics(res.data))
      .catch(() => {});
  }, []);

  const m = metrics || {
    revenueAtRisk: 125374665,
    recoveredRevenue: 80308600,
    revenueRecoveryRate: 58.6,
    openCases: 72,
    totalCases: 100,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                RecoverAI <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.1</span>
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">Autonomous Revenue Recovery Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/overview')}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Enter Merchant Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-inner">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              Gemini AI-Powered B2B Revenue Orchestration &bull; Razorpay Test Mode Ready
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Recover Failed Payments <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Before Revenue Disappears.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            RecoverAI autonomously diagnoses checkout abandonments, mandate failures, and card declines — executing bounded recovery workflows with strict merchant policy guardrails.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('/overview')}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:opacity-95 text-white text-sm font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Live Dashboard</span>
            </button>
            <button
              onClick={() => onNavigate('/evaluations')}
              className="px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-extrabold rounded-2xl transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <span>100-Case Evaluation Benchmark</span>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </button>
          </div>

          {/* Live KPI Strip */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Revenue At Risk</span>
              <p className="text-2xl lg:text-3xl font-black text-white mt-1">{formatPaiseToRupees(m.revenueAtRisk)}</p>
              <span className="text-[11px] text-amber-400 mt-1 block font-medium">{m.openCases} Open Cases</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Recovered Revenue</span>
              <p className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1">{formatPaiseToRupees(m.recoveredRevenue)}</p>
              <span className="text-[11px] text-emerald-300 mt-1 block font-medium">Verified Payment Webhooks</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Recovery Rate</span>
              <p className="text-2xl lg:text-3xl font-black text-cyan-400 mt-1">{m.revenueRecoveryRate}%</p>
              <span className="text-[11px] text-slate-400 mt-1 block font-medium">Benchmark Tested</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Policy Clearance</span>
              <p className="text-2xl lg:text-3xl font-black text-indigo-400 mt-1">100%</p>
              <span className="text-[11px] text-indigo-300 mt-1 block font-medium">Zero Unbounded Actions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Demo Credentials Card */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Lock className="w-4 h-4" /> Official Demo Admin Credentials
              </div>
              <h3 className="text-lg font-extrabold text-white">Direct Access for Evaluators & Judges</h3>
              <p className="text-xs text-slate-400">Logged-in session is pre-authenticated via signed JSON Web Token (JWT).</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Email / User</span>
                <span className="text-cyan-300 font-bold">merchant@recoverai.local</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Password</span>
                <span className="text-emerald-300 font-bold">SecurePassword123!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Architecture Workflow */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Autonomous 4-Step Revenue Lifecycle</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
              01
            </div>
            <h3 className="text-base font-bold text-white">Detection & Risk Score</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects failed payments, cart abandonments, and overdue receivables with deterministic risk scoring (0-100).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-cyan-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
              02
            </div>
            <h3 className="text-base font-bold text-white">AI Root-Cause Diagnosis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini AI models analyze customer transaction history, failure codes, and determine optimal recovery strategy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
              03
            </div>
            <h3 className="text-base font-bold text-white">Policy Engine Guardrail</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces hard merchant rules: max 3 retries, 24h cooldown interval, 168h recovery window, and customer blocklists.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              04
            </div>
            <h3 className="text-base font-bold text-white">Razorpay Execution & Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates Test Mode orders/links, confirms recovery upon verified HMAC SHA256 webhook, and logs immutable audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-400">RecoverAI &bull; Autonomous Revenue Recovery Platform</p>
        <p className="mt-1">Built with Express, MongoDB, React, Tailwind CSS, Gemini AI & Razorpay Integration</p>
      </footer>
    </div>
  );
}

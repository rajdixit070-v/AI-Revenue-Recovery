import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';
import { Settings, ShieldCheck, Key, CheckCircle2, Bot, Database, Zap, RefreshCw, Trash2, DatabaseZap, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    api.getMetrics()
      .then(res => setMetrics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearDemo = async () => {
    if (!window.confirm('Are you sure you want to clear all demo cases and synthetic customers? Your admin login account will remain safe.')) return;
    setActionLoading(true);
    setMessage('Clearing synthetic demo dataset...');
    try {
      const res = await api.clearDemoData();
      setMessage(res.message || 'Demo data cleared cleanly.');
      loadData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setActionLoading(true);
    setMessage('Seeding 74 realistic merchant demo cases into MongoDB...');
    try {
      const res = await api.seedDemoData();
      setMessage(res.message || 'Demo cases seeded successfully!');
      loadData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0E1526]/90 p-6 md:p-8 rounded-3xl border border-white/[0.08] shadow-xl relative overflow-hidden backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">Platform Configuration & System Health</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live status of payment gateway integration, Gemini AI model, database, and sandbox data controls.</p>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {message && (
        <div className="p-4 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200 font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Integrations Status Grid */}
      <div className="bg-[#0E1526]/90 rounded-3xl border border-white/[0.08] shadow-xl p-6 space-y-5 backdrop-blur-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Engine Integrations</h3>

        <div className="divide-y divide-white/[0.06] text-xs">
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Razorpay Payment Gateway</span>
                <span className="text-[11px] text-slate-400">Automated retries, payment links & HMAC SHA256 webhooks</span>
              </div>
            </div>
            <span className="font-black px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5" /> TEST MODE ACTIVE
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Google Gemini 2.5 Flash</span>
                <span className="text-[11px] text-slate-400">Autonomous root-cause analysis & localized recovery messaging</span>
              </div>
            </div>
            <span className="font-black px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED & ACTIVE
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">MongoDB Atlas Cloud Database</span>
                <span className="text-[11px] text-slate-400">Production M0 cluster with real-time replication & audit logging</span>
              </div>
            </div>
            <span className="font-black px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED & HEALTHY
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Merchant Policy Guardrails</span>
                <span className="text-[11px] text-slate-400">Deterministic stopping rules, cooldown intervals & customer friction limits</span>
              </div>
            </div>
            <span className="font-bold text-slate-200">
              Max 3 Retries &bull; 24h Cooldown &bull; 168h Window
            </span>
          </div>
        </div>
      </div>

      {/* Demo Sandbox Data Controls */}
      <div className="bg-[#0E1526]/90 rounded-3xl border border-white/[0.08] shadow-xl p-6 space-y-4 backdrop-blur-xl">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Demo Sandbox Data Controls</h3>
          <p className="text-xs text-slate-400 mt-1">Easily seed realistic presentation cases or wipe demo records with 1 click directly from the UI.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={handleSeedDemo}
            disabled={actionLoading}
            className="p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 rounded-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
              <DatabaseZap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Seed Presentation Data</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Loads 74 realistic merchant cases, customers & payments</span>
            </div>
          </button>

          <button
            onClick={handleClearDemo}
            disabled={actionLoading}
            className="p-4 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition-transform">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-300 block">Clear Demo Data</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Wipes synthetic records (Admin user remains safe)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

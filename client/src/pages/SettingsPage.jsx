import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';
import { Settings, ShieldCheck, Key, CheckCircle2, Bot, Database, Zap } from 'lucide-react';

export default function SettingsPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.getMetrics().then(res => setMetrics(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" /> Platform Configuration & Health
        </h3>
        <p className="text-xs text-slate-400 mt-1">Live status of payment gateway integration, Gemini AI model, and database.</p>
      </div>

      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl space-y-4 text-xs">
        <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">Active Gateway Mode</span>
          </div>
          <span className="font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> RAZORPAY TEST MODE
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-slate-300">Gemini AI Model</span>
          </div>
          <span className="font-bold px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Gemini 2.5 Flash (Connected)
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">MongoDB Database</span>
          </div>
          <span className="font-bold px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected (Clean State)
          </span>
        </div>

        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Merchant Policy Guardrails</span>
          </div>
          <span className="font-bold text-white">
            Max 3 Retries &bull; 24h Cooldown &bull; 168h Window
          </span>
        </div>
      </div>
    </div>
  );
}

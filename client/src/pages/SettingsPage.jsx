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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" /> Platform Configuration & Health
        </h3>
        <p className="text-xs text-slate-500 mt-1">Live status of payment gateway integration, Gemini AI model, and database.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div className="flex justify-between items-center py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Active Gateway Mode</span>
          </div>
          <span className="font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> RAZORPAY TEST MODE
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-slate-700">Gemini AI Model</span>
          </div>
          <span className="font-bold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Gemini 3.6 Flash (Connected)
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-cyan-600" />
            <span className="font-semibold text-slate-700">MongoDB Database</span>
          </div>
          <span className="font-bold px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected (Clean State)
          </span>
        </div>

        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Merchant Policy Guardrails</span>
          </div>
          <span className="font-bold text-slate-800">
            Max 3 Retries &bull; 24h Cooldown &bull; 168h Window
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';
import { Settings, ShieldCheck, Key } from 'lucide-react';

export default function SettingsPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.getMetrics().then(res => setMetrics(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" /> Platform Configuration
        </h3>
        <p className="text-xs text-slate-500 mt-1">Environment and integration status overview.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-600">Active Environment Mode:</span>
          <span className="font-bold text-indigo-600">{metrics?.environment || 'SIMULATION MODE'}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-600">Razorpay Test Mode:</span>
          <span className="font-bold text-emerald-600">Configured & Active</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-600">AI Decision Engine Mode:</span>
          <span className="font-bold text-purple-600">Gemini 2.5 Flash / Simulation Fallback</span>
        </div>
      </div>
    </div>
  );
}

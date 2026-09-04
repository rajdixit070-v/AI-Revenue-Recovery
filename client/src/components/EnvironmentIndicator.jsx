import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

export default function EnvironmentIndicator({ mode = 'SIMULATION MODE' }) {
  const isRazorpay = mode.includes('RAZORPAY');
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition-all ${
        isRazorpay
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full animate-pulse ${
          isRazorpay ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-indigo-400 shadow-[0_0_8px_#818cf8]'
        }`}
      />
      {isRazorpay ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5 text-indigo-400" />}
      <span className="tracking-wide">{mode}</span>
    </div>
  );
}

import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

export default function EnvironmentIndicator({ mode = 'SIMULATION MODE' }) {
  const isRazorpay = mode.includes('RAZORPAY');
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
      isRazorpay
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-amber-50 text-amber-800 border-amber-200'
    }`}>
      {isRazorpay ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Zap className="w-3.5 h-3.5 text-amber-600" />}
      <span>{mode}</span>
    </div>
  );
}

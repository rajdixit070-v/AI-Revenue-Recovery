import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

const RISK_CONFIG = {
  LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/25', icon: ShieldCheck, label: 'Low Risk' },
  MEDIUM: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/25', icon: AlertTriangle, label: 'Medium Risk' },
  HIGH: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/25', icon: ShieldAlert, label: 'High Risk' },
  CRITICAL: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.25)]', icon: Flame, label: 'Critical Risk' },
};

export default function RiskBadge({ level, score }) {
  const conf = RISK_CONFIG[level] || RISK_CONFIG.LOW;
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${conf.bg} ${conf.text} ${conf.border}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{conf.label}</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono text-[10px]">[{score}]</span>
      )}
    </span>
  );
}

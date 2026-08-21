import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

const RISK_CONFIG = {
  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: ShieldCheck, label: 'Low Risk' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: AlertTriangle, label: 'Medium Risk' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: ShieldAlert, label: 'High Risk' },
  CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Flame, label: 'Critical Risk' },
};

export default function RiskBadge({ level, score }) {
  const conf = RISK_CONFIG[level] || RISK_CONFIG.LOW;
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {conf.label} {score !== undefined ? `(${score})` : ''}
    </span>
  );
}

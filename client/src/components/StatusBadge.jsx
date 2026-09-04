import React from 'react';

const STATUS_CONFIG = {
  OPEN: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/25', dot: 'bg-sky-400', label: 'Open' },
  ANALYZING: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/25', dot: 'bg-purple-400 animate-pulse', label: 'Analyzing' },
  ACTION_PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/25', dot: 'bg-amber-400', label: 'Action Pending' },
  IN_RECOVERY: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30', dot: 'bg-indigo-400 animate-pulse', label: 'In Recovery' },
  RECOVERED: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]', label: 'Recovered' },
  ESCALATED: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/25', dot: 'bg-rose-400', label: 'Escalated' },
  EXPIRED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400', label: 'Expired' },
  CLOSED: { bg: 'bg-slate-800/40', text: 'text-slate-400', border: 'border-slate-700/40', dot: 'bg-slate-500', label: 'Closed' },
  SUCCESS: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]', label: 'Success' },
  FAILED: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/25', dot: 'bg-rose-400', label: 'Failed' },
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/25', dot: 'bg-amber-400', label: 'Pending' },
};

export default function StatusBadge({ status }) {
  const conf = STATUS_CONFIG[status] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${conf.bg} ${conf.text} ${conf.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
}

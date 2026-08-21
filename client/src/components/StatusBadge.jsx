import React from 'react';

const STATUS_CONFIG = {
  OPEN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Open' },
  ANALYZING: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Analyzing' },
  ACTION_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Action Pending' },
  IN_RECOVERY: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'In Recovery' },
  RECOVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Recovered' },
  ESCALATED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Escalated' },
  EXPIRED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Expired' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'Closed' },
  SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Success' },
  FAILED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Failed' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
};

export default function StatusBadge({ status }) {
  const conf = STATUS_CONFIG[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: status || 'Unknown' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>
      {conf.label}
    </span>
  );
}

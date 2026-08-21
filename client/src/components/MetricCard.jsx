import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, badgeText, badgeColor = 'emerald' }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badgeText && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${badgeColor}-50 text-${badgeColor}-700 border border-${badgeColor}-200`}>
            {badgeText}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}

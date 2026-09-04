import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, badgeText, badgeColor = 'emerald' }) {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
      case 'indigo':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.15)]';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  return (
    <div className="bg-[#0E1526]/90 p-5 rounded-2xl border border-white/[0.07] backdrop-blur-xl shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 hover:bg-[#121B32] transition-all duration-300">
      {/* Ambient subtle card glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between relative z-1">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-200">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between relative z-1">
        <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">{value}</span>
        {badgeText && (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1.5 text-xs text-slate-400 relative z-1">{subtext}</p>}
    </div>
  );
}

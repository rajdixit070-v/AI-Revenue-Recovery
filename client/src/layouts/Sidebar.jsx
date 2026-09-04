import React from 'react';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  BarChart2,
  Terminal,
  CreditCard,
  Users,
  Brain,
  Sliders,
  FileText,
  Settings,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    group: 'COMMAND CENTER',
    items: [
      { path: '/', label: 'Overview', icon: LayoutDashboard },
      { path: '/recovery-cases', label: 'Recovery Cases', icon: Activity },
      { path: '/at-risk', label: 'At Risk Priority', icon: ShieldAlert },
    ],
  },
  {
    group: 'RECOVERY ENGINES',
    items: [
      { path: '/evaluations', label: 'Batch Evaluations', icon: BarChart2 },
      { path: '/agent-runs', label: 'Agent Console', icon: Terminal },
    ],
  },
  {
    group: 'INTELLIGENCE & DATA',
    items: [
      { path: '/ai-decisions', label: 'AI Decisions', icon: Brain },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    group: 'GOVERNANCE & SAFETY',
    items: [
      { path: '/policies', label: 'Recovery Policies', icon: Sliders },
      { path: '/audit', label: 'Audit Trail', icon: FileText },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ currentPath, onNavigate, onCloseMobile }) {
  return (
    <aside className="w-68 bg-[#0B101E]/95 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-300 z-20">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div
          onClick={() => { onNavigate('/'); if (onCloseMobile) onCloseMobile(); }}
          className="p-5 border-b border-white/[0.06] flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white rounded-xl shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B101E] rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight">RecoverAI</h1>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-amber-400" /> Revenue Recovery Agent
              </p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); onCloseMobile(); }}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 p-3.5 space-y-5 overflow-y-auto scrollbar-none">
          {NAV_GROUPS.map((sec) => (
            <div key={sec.group} className="space-y-1">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-1.5">
                {sec.group}
              </p>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? (currentPath === '/' || currentPath === '/overview' || currentPath === '/dashboard')
                    : currentPath.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-500/80 text-white shadow-lg shadow-indigo-600/20 font-bold border border-indigo-400/30'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_#22d3ee]" />
                    )}
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Status Badge */}
      <div className="p-4 border-t border-white/[0.06] bg-[#070A12]/80 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="font-semibold text-slate-300">Razorpay Engine</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
            HEALTHY
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Autonomous B2B Recovery</p>
      </div>
    </aside>
  );
}


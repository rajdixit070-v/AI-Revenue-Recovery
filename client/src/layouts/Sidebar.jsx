import React from 'react';
import { Home, LayoutDashboard, ShieldAlert, CreditCard, Users, Brain, Sliders, FileText, Settings, ShieldCheck, Activity, BarChart2, Terminal } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { path: '/recovery-cases', label: 'Recovery Cases', icon: Activity },
  { path: '/at-risk', label: 'At Risk Queue', icon: ShieldAlert },
  { path: '/evaluations', label: 'Batch Evaluations', icon: BarChart2 },
  { path: '/agent-runs', label: 'Agent Run Console', icon: Terminal },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/ai-decisions', label: 'AI Decisions', icon: Brain },
  { path: '/policies', label: 'Policies', icon: Sliders },
  { path: '/audit', label: 'Audit Trail', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPath, onNavigate }) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-300">
      <div>
        {/* Brand Header */}
        <div
          onClick={() => onNavigate('/')}
          className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
        >
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white rounded-xl shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
              RecoverAI <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">v1.1</span>
            </h1>
            <p className="text-[10px] font-medium text-slate-400">Revenue Recovery Agent</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? (currentPath === '/' || currentPath === '/overview' || currentPath === '/dashboard')
                : currentPath.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">RecoverAI Platform</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">READY</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">B2B Revenue Operations</p>
      </div>
    </aside>
  );
}


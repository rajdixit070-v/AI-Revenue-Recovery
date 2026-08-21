import React from 'react';
import { LayoutDashboard, ShieldAlert, CreditCard, Users, Brain, Sliders, FileText, Settings, ShieldCheck, Activity, BarChart2, Terminal } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
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
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">RecoverAI</h1>
            <p className="text-[11px] font-semibold text-slate-400">Revenue Recovery Agent</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-700">RecoverAI v1.0</p>
        <p>B2B Revenue Operations</p>
      </div>
    </aside>
  );
}

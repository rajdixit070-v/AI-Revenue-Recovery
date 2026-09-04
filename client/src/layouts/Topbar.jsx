import React, { useState, useEffect } from 'react';
import EnvironmentIndicator from '../components/EnvironmentIndicator';
import { User, LogIn, LogOut, ShieldCheck, CheckCircle2, ChevronRight, Sparkles, Layers, Menu, Settings } from 'lucide-react';
import { ensureAuthToken } from '../services/api';

export default function Topbar({ title, environment = 'SIMULATION MODE', currentPath = '/', onNavigate, onToggleMobile }) {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch (e) {}
      } else {
        setUser({ name: 'Demo Merchant', email: 'merchant@recoverai.local', role: 'ADMIN' });
      }
    };
    loadUser();
  }, []);

  const handleLoginDemo = async () => {
    await ensureAuthToken(true);
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) {}
    }
    setShowMenu(false);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowMenu(false);
    window.location.reload();
  };

  return (
    <header className="h-16 bg-[#0B101E]/95 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-black/20 shrink-0">
      {/* Mobile Hamburger & Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">RecoverAI</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <h2 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Quick Settings Icon */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('/settings')}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              currentPath === '/settings'
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]'
            }`}
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Quick Nav Trigger */}
        {onNavigate && currentPath !== '/evaluations' && (
          <button
            onClick={() => onNavigate('/evaluations')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Batch Evaluation
          </button>
        )}

        <EnvironmentIndicator mode={environment} />

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white font-bold text-[10px] flex items-center justify-center shadow-md">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DM'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-slate-100 block leading-tight">{user?.name || 'Demo Merchant'}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-none">{user?.role || 'ADMIN'}</span>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0E162B] rounded-2xl shadow-2xl border border-white/[0.08] py-2 z-50 text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-white/[0.06]">
                <p className="font-semibold text-white">{user?.name || 'Demo Merchant'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'merchant@recoverai.local'}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Authenticated via JWT
                </div>
              </div>
              <div className="p-1.5 space-y-1">
                {onNavigate && (
                  <button
                    onClick={() => { setShowMenu(false); onNavigate('/settings'); }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-white/[0.06] hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    System Settings
                  </button>
                )}
                <button
                  onClick={handleLoginDemo}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-white/[0.06] hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Refresh Session
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


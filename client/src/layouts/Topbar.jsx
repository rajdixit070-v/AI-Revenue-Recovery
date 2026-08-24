import React, { useState, useEffect } from 'react';
import EnvironmentIndicator from '../components/EnvironmentIndicator';
import { User, LogIn, LogOut, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ensureAuthToken } from '../services/api';

export default function Topbar({ title, environment = 'SIMULATION MODE' }) {
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
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10">
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        <EnvironmentIndicator mode={environment} />
        
        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DM'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">{user?.name || 'Demo Merchant'}</span>
              <span className="text-[10px] text-slate-500 font-medium leading-none">{user?.role || 'ADMIN'}</span>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{user?.name || 'Demo Merchant'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'merchant@recoverai.local'}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Authenticated (JWT)
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLoginDemo}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Refresh Demo Login
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
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


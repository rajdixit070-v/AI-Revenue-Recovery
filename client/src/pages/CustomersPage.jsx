import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import LoadingState from '../components/LoadingState';
import { Users, Search, RefreshCw, UserCheck } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = () => {
    setLoading(true);
    api.getCustomers({ limit: 50 })
      .then(res => setCustomers(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  if (loading) return <LoadingState message="Loading customers from database..." />;

  const filtered = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Customer Lifetime Directory
          </h3>
          <p className="text-xs text-slate-400 mt-1">Tracks customer payment reliability, LTV, and historical recovery rates.</p>
        </div>
        <button onClick={loadCustomers} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-xl transition-colors cursor-pointer border border-white/[0.08]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="bg-[#0E1526]/90 p-12 rounded-2xl border border-white/[0.08] shadow-xl text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20">
            <UserCheck className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-white">No Customer Records Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Customers will automatically be created and tracked here as payment failures or recoveries are processed.
          </p>
        </div>
      ) : (
        <div className="bg-[#0E1526]/90 rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.06] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Lifetime Value</th>
                  <th className="py-3.5 px-6">Successful Payments</th>
                  <th className="py-3.5 px-6">Failed Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-6 font-bold text-white">{c.name}</td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{c.email}</td>
                    <td className="py-4 px-6"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{c.status}</span></td>
                    <td className="py-4 px-6 font-bold text-white">{formatPaiseToRupees(c.lifetimeValue)}</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">{c.successfulPayments || 0}</td>
                    <td className="py-4 px-6 text-rose-400 font-bold">{c.failedPayments || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import LoadingState from '../components/LoadingState';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomers({ limit: 30 })
      .then(res => setCustomers(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading customers..." />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-6">Email</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Lifetime Value</th>
              <th className="py-3.5 px-6">Successful Payments</th>
              <th className="py-3.5 px-6">Failed Payments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900">{c.name}</td>
                <td className="py-4 px-6 text-slate-600 font-mono">{c.email}</td>
                <td className="py-4 px-6"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{c.status}</span></td>
                <td className="py-4 px-6 font-bold text-slate-900">{formatPaiseToRupees(c.lifetimeValue)}</td>
                <td className="py-4 px-6 text-emerald-600 font-bold">{c.successfulPayments}</td>
                <td className="py-4 px-6 text-rose-600 font-bold">{c.failedPayments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

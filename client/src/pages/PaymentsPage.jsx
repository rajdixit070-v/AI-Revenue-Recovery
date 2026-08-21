import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/money';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPayments({ limit: 30 })
      .then(res => setPayments(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading payment transactions..." />;
  if (error) return <ErrorState title="Failed to load payments" message={error} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Payment ID</th>
              <th className="py-3.5 px-6">Provider Order ID</th>
              <th className="py-3.5 px-6">Amount</th>
              <th className="py-3.5 px-6">Method</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Attempts</th>
              <th className="py-3.5 px-6">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {payments.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-slate-900">{p.externalPaymentId || p._id}</td>
                <td className="py-4 px-6 font-mono text-slate-600">{p.providerOrderId || p.externalOrderId || 'N/A'}</td>
                <td className="py-4 px-6 font-bold text-slate-900">{formatPaiseToRupees(p.amount)}</td>
                <td className="py-4 px-6 font-semibold text-slate-700">{p.paymentMethod}</td>
                <td className="py-4 px-6"><StatusBadge status={p.status} /></td>
                <td className="py-4 px-6 font-mono text-slate-600">{p.attemptCount}</td>
                <td className="py-4 px-6 text-slate-500">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

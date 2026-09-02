import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/money';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import SimulateFailureModal from '../components/SimulateFailureModal';
import { CreditCard, Search, RefreshCw, Zap } from 'lucide-react';

export default function PaymentsPage({ onNavigate }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimModal, setShowSimModal] = useState(false);

  const loadPayments = () => {
    setLoading(true);
    api.getPayments({ limit: 50 })
      .then(res => setPayments(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  if (loading) return <LoadingState message="Loading payment transactions from database..." />;
  if (error) return <ErrorState title="Failed to load payments" message={error} onRetry={loadPayments} />;

  const filtered = payments.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.externalPaymentId && p.externalPaymentId.toLowerCase().includes(q)) ||
      (p.providerOrderId && p.providerOrderId.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Simulation CTA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Payments Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">Audit trail of all incoming payments, gateway attempts, and failure telemetry.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Simulate Live Failure</span>
          </button>
          <button onClick={loadPayments} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SimulateFailureModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        onSuccess={(newCaseId) => onNavigate && onNavigate(`/recovery-cases/${newCaseId}`)}
      />

      {/* Payments Table / Empty State */}
      {payments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">No Payment Transactions Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Database is clean. Trigger a live failed checkout simulation to see transactions, failure codes, and retry orders appear here.
            </p>
          </div>
          <button
            onClick={() => setShowSimModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Simulate First Failed Transaction</span>
          </button>
        </div>
      ) : (
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
                  <th className="py-3.5 px-6">Failure Code</th>
                  <th className="py-3.5 px-6">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{p.externalPaymentId || p._id}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">{p.providerOrderId || p.externalOrderId || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{formatPaiseToRupees(p.amount)}</td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{p.paymentMethod || 'UPI'}</td>
                    <td className="py-4 px-6"><StatusBadge status={p.status} /></td>
                    <td className="py-4 px-6 font-mono text-rose-600 font-semibold">{p.failureCode || 'NONE'}</td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(p.createdAt)}</td>
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

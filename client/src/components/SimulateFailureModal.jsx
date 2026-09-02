import React, { useState } from 'react';
import { api } from '../services/api';
import { Zap, X, AlertTriangle, ArrowRight, User, DollarSign, RefreshCw } from 'lucide-react';

export default function SimulateFailureModal({ isOpen, onClose, onSuccess }) {
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerEmail, setCustomerEmail] = useState('rahul.sharma@example.com');
  const [amountInRupees, setAmountInRupees] = useState(4999);
  const [issueType, setIssueType] = useState('PAYMENT_FAILURE');
  const [failureCode, setFailureCode] = useState('INSUFFICIENT_FUNDS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateFailure({
        customerName,
        customerEmail,
        amountInRupees: Number(amountInRupees),
        issueType,
        failureCode,
      });
      if (res.data?.caseId) {
        onSuccess(res.data.caseId);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to simulate transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulate Live Payment Failure</h3>
              <p className="text-[11px] text-slate-400">Trigger a new real-time Razorpay checkout failure</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Customer Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Amount (INR ₹)</label>
            <div className="relative">
              <span className="text-slate-500 absolute left-3.5 top-2 font-bold text-sm">₹</span>
              <input
                type="number"
                required
                min="100"
                max="500000"
                value={amountInRupees}
                onChange={(e) => setAmountInRupees(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none"
              >
                <option value="PAYMENT_FAILURE">Payment Failure</option>
                <option value="CHECKOUT_ABANDONMENT">Checkout Dropoff</option>
                <option value="SUBSCRIPTION_FAILURE">Subscription</option>
                <option value="MANDATE_FAILURE">Mandate Failure</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Failure Reason</label>
              <select
                value={failureCode}
                onChange={(e) => setFailureCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none"
              >
                <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
                <option value="CARD_DECLINED">Card Declined</option>
                <option value="AUTH_FAILURE">OTP Timeout / Drop</option>
                <option value="GATEWAY_ERROR">Bank Server Busy</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
              <span>{loading ? 'Creating...' : 'Trigger Live Failure'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

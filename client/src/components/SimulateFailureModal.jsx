import React, { useState } from 'react';
import { api } from '../services/api';
import { Zap, X, AlertTriangle, ArrowRight, User, DollarSign, RefreshCw, Star, Sparkles } from 'lucide-react';

const HERO_SCENARIOS = [
  {
    id: 'hero_payment',
    label: 'Scenario 1: Payment Failure',
    amount: 4999,
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@example.com',
    issueType: 'PAYMENT_FAILURE',
    failureCode: 'INSUFFICIENT_FUNDS',
    tag: '₹4,999 • Temporary Decline',
  },
  {
    id: 'hero_checkout',
    label: 'Scenario 2: Checkout Abandonment',
    amount: 18500,
    customerName: 'Pooja Verma',
    customerEmail: 'pooja.verma@example.com',
    issueType: 'CHECKOUT_ABANDONMENT',
    failureCode: 'AUTH_FAILURE',
    tag: '₹18,500 • Drop during OTP',
  },
  {
    id: 'hero_b2b',
    label: 'Scenario 3: B2B Overdue Receivable',
    amount: 75000,
    customerName: 'Apex Tech Solutions',
    customerEmail: 'finance@apextech.in',
    issueType: 'OVERDUE_RECEIVABLE',
    failureCode: 'LIMIT_EXCEEDED',
    tag: '₹75,000 • 14 Days Overdue',
  },
  {
    id: 'hero_mandate',
    label: 'Scenario 4: Mandate / Subscription',
    amount: 1499,
    customerName: 'Ananya Iyer',
    customerEmail: 'ananya.iyer@example.com',
    issueType: 'MANDATE_FAILURE',
    failureCode: 'MANDATE_INVALID',
    tag: '₹1,499 • Autopay Expired',
  },
];

export default function SimulateFailureModal({ isOpen, onClose, onSuccess }) {
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerEmail, setCustomerEmail] = useState('rahul.sharma@example.com');
  const [amountInRupees, setAmountInRupees] = useState(4999);
  const [issueType, setIssueType] = useState('PAYMENT_FAILURE');
  const [failureCode, setFailureCode] = useState('INSUFFICIENT_FUNDS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const selectHeroScenario = (sc) => {
    setCustomerName(sc.customerName);
    setCustomerEmail(sc.customerEmail);
    setAmountInRupees(sc.amount);
    setIssueType(sc.issueType);
    setFailureCode(sc.failureCode);
  };

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
    <div className="fixed inset-0 z-50 bg-[#080C14]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0E162B] border border-white/[0.08] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
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
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 4 Hero Scenarios */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Four Hero Demo Scenarios (1-Click Presets)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HERO_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => selectHeroScenario(sc)}
                className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-amber-500/30 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="font-bold text-[11px] text-white block group-hover:text-amber-300">{sc.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{sc.tag}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs pt-2 border-t border-white/[0.06]">
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Customer / Company Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
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
            <div className="space-y-1">
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
                <option value="OVERDUE_RECEIVABLE">Overdue Receivable</option>
              </select>
            </div>

            <div className="space-y-1">
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
                <option value="LIMIT_EXCEEDED">Limit Exceeded</option>
                <option value="MANDATE_INVALID">Mandate Invalid</option>
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

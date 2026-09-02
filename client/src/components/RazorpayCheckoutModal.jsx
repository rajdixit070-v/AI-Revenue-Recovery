import React, { useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/money';
import { ShieldCheck, CheckCircle2, X, QrCode, CreditCard, Smartphone, RefreshCw, AlertTriangle, ArrowRight, Lock } from 'lucide-react';

export default function RazorpayCheckoutModal({ isOpen, onClose, caseData, onPaymentSuccess }) {
  const [method, setMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !caseData) return null;

  const amountPaise = caseData.amountAtRisk || 499900;
  const customer = caseData.customerId || { name: 'Customer', email: 'customer@example.com' };

  const handlePaySuccess = async () => {
    setProcessing(true);
    setError(null);
    try {
      await api.simulatePaymentSuccess(caseData.caseId);
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Payment simulation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white tracking-tight">Razorpay Checkout</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-400/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-slate-300">RecoverAI Smart Recovery Link</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Bar */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block font-semibold">Paying To: RecoverAI Merchant</span>
            <span className="text-xs font-bold text-slate-800 font-mono">{caseData.caseId}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Amount Due</span>
            <span className="text-lg font-black text-slate-900 block">{formatPaiseToRupees(amountPaise)}</span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Payment Methods Selection */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod('UPI')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                method === 'UPI'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${method === 'UPI' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-xs">UPI / QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('CARD')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                method === 'CARD'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${method === 'CARD' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-xs">Cards / NetBanking</span>
            </button>
          </div>

          {method === 'UPI' ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <div className="w-32 h-32 bg-white rounded-xl border border-slate-200 mx-auto flex items-center justify-center shadow-inner">
                <QrCode className="w-24 h-24 text-slate-800" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Scan with any UPI App (GPay, PhonePe, Paytm, CRED)
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700">
                  success@razorpay
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold block text-[11px]">Test Card Number</label>
                <input
                  type="text"
                  readOnly
                  value="4111 1111 1111 1111"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-semibold block text-[11px]">Expiry</label>
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block text-[11px]">CVV</label>
                  <input
                    type="text"
                    readOnly
                    value="123"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handlePaySuccess}
            disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>{processing ? 'Verifying with Razorpay Webhook...' : `Pay ${formatPaiseToRupees(amountPaise)} (Test Mode)`}</span>
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted &bull; Razorpay Sandbox
          </span>
          <span className="font-mono">HMAC-SHA256</span>
        </div>
      </div>
    </div>
  );
}

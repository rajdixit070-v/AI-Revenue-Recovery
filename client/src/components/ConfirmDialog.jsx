import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { formatPaiseToRupees } from '../utils/money';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, caseId, action, amount, reason, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Execute Recovery Action?</h3>
                <p className="text-xs text-slate-500">Case ID: {caseId}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Approved Action:</span>
              <span className="font-bold text-slate-900">{action}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Target Amount:</span>
              <span className="font-bold text-emerald-600">{formatPaiseToRupees(amount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium block mb-1">Reasoning:</span>
              <p className="text-slate-700 leading-relaxed italic">"{reason || 'Policy-approved recovery attempt'}"</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200/70 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>This action executes via <strong>Razorpay Test Mode</strong> or Simulation boundary. Amounts are derived strictly from backend records.</span>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Executing...' : 'Execute Recovery'}
          </button>
        </div>
      </div>
    </div>
  );
}

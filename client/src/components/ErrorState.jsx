import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-center bg-rose-500/10 rounded-2xl border border-rose-500/25 backdrop-blur-xl">
      <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-300 max-w-md">{message || 'Check database connection and backend status.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

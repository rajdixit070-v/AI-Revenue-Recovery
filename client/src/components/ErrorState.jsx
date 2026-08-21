import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-center bg-rose-50/50 rounded-xl border border-rose-200/80">
      <div className="p-3 bg-rose-100 rounded-full text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 max-w-md">{message || 'Check database connection and backend status.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

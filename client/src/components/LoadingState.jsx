import React from 'react';

export default function LoadingState({ message = 'Loading RecoverAI metrics...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[320px]">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
        <div className="absolute inset-0 rounded-full blur-md bg-indigo-500/20 animate-pulse"></div>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wide uppercase">{message}</p>
    </div>
  );
}

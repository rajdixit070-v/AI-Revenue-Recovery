import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No records found', message = 'No data matches your current criteria.' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.08]">
      <div className="p-3 bg-white/[0.04] rounded-2xl text-slate-400 mb-3 border border-white/[0.06]">
        <Inbox className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}

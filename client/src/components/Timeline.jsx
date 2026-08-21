import React from 'react';
import { formatDate } from '../utils/money';

export default function Timeline({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-xs text-slate-500 py-4 italic">No audit log entries recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {logs.map((log, idx) => (
        <div key={log._id || idx} className="relative group">
          <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100"></div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{log.eventType}</span>
              <span className="text-[11px] text-slate-400 font-medium">{formatDate(log.timestamp)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-700">{log.message}</p>
            {log.reason && <p className="mt-0.5 text-xs text-slate-500 italic">Reason: {log.reason}</p>}
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{log.actorType}</span>
              {log.previousState && <span>{log.previousState} &rarr; {log.newState}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

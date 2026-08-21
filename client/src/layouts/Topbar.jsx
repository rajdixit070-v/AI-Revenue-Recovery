import React from 'react';
import EnvironmentIndicator from '../components/EnvironmentIndicator';

export default function Topbar({ title, environment = 'SIMULATION MODE' }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10">
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        <EnvironmentIndicator mode={environment} />
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
          RA
        </div>
      </div>
    </header>
  );
}

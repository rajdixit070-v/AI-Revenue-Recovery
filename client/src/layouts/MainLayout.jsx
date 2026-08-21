import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CopilotWidget from '../components/CopilotWidget';

export default function MainLayout({ children, currentPath, onNavigate, title, environment }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} environment={environment} />
        <main className="p-8 flex-1">{children}</main>
        <CopilotWidget />
      </div>
    </div>
  );
}

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CopilotWidget from '../components/CopilotWidget';

export default function MainLayout({ children, currentPath, onNavigate, title, environment }) {
  return (
    <div className="flex min-h-screen bg-[#080c14] text-slate-100 relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_-10%,rgba(99,102,241,0.12),rgba(0,0,0,0))]" />
      
      {/* Sleek executive Sidebar */}
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-1 relative">
        <Topbar title={title} environment={environment} currentPath={currentPath} onNavigate={onNavigate} />
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
        <CopilotWidget />
      </div>
    </div>
  );
}

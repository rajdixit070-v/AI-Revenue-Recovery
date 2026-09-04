import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CopilotWidget from '../components/CopilotWidget';

export default function MainLayout({ children, currentPath, onNavigate, title, environment }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#080c14] text-slate-100 relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_-10%,rgba(99,102,241,0.12),rgba(0,0,0,0))]" />
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sleek executive Sidebar (Responsive Drawer on Mobile, Docked on lg screens) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-250 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentPath={currentPath} 
          onNavigate={(path) => {
            onNavigate(path);
            setMobileOpen(false);
          }} 
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-1 relative">
        <Topbar 
          title={title} 
          environment={environment} 
          currentPath={currentPath} 
          onNavigate={onNavigate}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
        <CopilotWidget />
      </div>
    </div>
  );
}

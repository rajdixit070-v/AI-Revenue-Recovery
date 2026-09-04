import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Timeline from '../components/Timeline';
import LoadingState from '../components/LoadingState';
import { Activity, RefreshCw } from 'lucide-react';

export default function AgentRunConsolePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 100 });
      setLogs(res.data || []);
    } catch (err) {
      console.warn('Error loading logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && logs.length === 0) return <LoadingState message="Connecting to Agent Run Stream..." />;

  return (
    <div className="space-y-6">
      <div className="bg-[#0E1526]/90 text-white p-6 rounded-2xl border border-white/[0.08] shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold flex items-center gap-2 font-mono">
            <Activity className="w-5 h-5 text-emerald-400" /> Agent Run Execution Console
          </h3>
          <p className="text-xs text-slate-400 mt-1">Live streaming operational audit log of detection, AI analysis, policy engine checks, and recovery executions.</p>
        </div>
        <button onClick={loadLogs} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-xl transition-colors cursor-pointer border border-white/[0.08]">
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
        </button>
      </div>

      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl">
        <Timeline logs={logs} />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Timeline from '../components/Timeline';
import LoadingState from '../components/LoadingState';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs({ limit: 50 })
      .then(res => setLogs(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading immutable audit trail..." />;

  return (
    <div className="space-y-6">
      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl">
        <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
        <p className="text-xs text-slate-400 mt-1">Append-only record of every system event, AI decision, and payment verification.</p>
      </div>

      <div className="bg-[#0E1526]/90 p-6 rounded-2xl border border-white/[0.08] shadow-xl">
        <Timeline logs={logs} />
      </div>
    </div>
  );
}

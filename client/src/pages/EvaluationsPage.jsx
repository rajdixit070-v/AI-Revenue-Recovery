import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/money';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EnvironmentIndicator from '../components/EnvironmentIndicator';
import { Play, Layers, BarChart2, ShieldCheck, RefreshCw, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function EvaluationsPage({ onNavigate }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingDemo, setStartingDemo] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBatches();
      setBatches(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    const interval = setInterval(loadBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDemoEvaluation = async () => {
    setStartingDemo(true);
    setDemoNotice('Generating synthetic 100-case dataset and executing AI benchmark...');
    try {
      const createRes = await api.createBatch({
        name: '100-Case Benchmark Evaluation',
        mode: 'SIMULATION',
        caseLimit: 100,
      });

      const batchId = createRes.data.batchId;
      await api.runBatch(batchId);

      setDemoNotice(`Batch evaluation ${batchId} completed! Loading report...`);
      loadBatches();

      setTimeout(() => {
        onNavigate(`/evaluations/${batchId}`);
      }, 1500);
    } catch (err) {
      setDemoNotice(`Failed to start evaluation: ${err.message}`);
    } finally {
      setStartingDemo(false);
    }
  };

  if (loading && batches.length === 0) return <LoadingState message="Loading evaluation batches..." />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Batch Recovery Evaluation Engine</h2>
              <p className="text-xs text-slate-500">Benchmark measured money recovered across 100+ cases with compliant policy enforcement.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunDemoEvaluation}
          disabled={startingDemo}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {startingDemo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{startingDemo ? 'Running 100-Case Benchmark...' : 'Run 100-Case Benchmark'}</span>
        </button>
      </div>

      {demoNotice && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{demoNotice}</span>
        </div>
      )}

      {/* Safety Notice Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Evaluation Safety Boundary:</strong> All evaluation batches operate under strict <strong>SIMULATION MODE</strong> parameters. Simulated revenue recovery is clearly distinguished from verified Razorpay Test Mode transactions.
        </div>
      </div>

      {/* Empty State / Batches Table */}
      {batches.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <BarChart2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">No Evaluation Batches Run Yet</h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
              Click the button below to generate a fresh 100-case evaluation dataset and benchmark the recovery rate (~58.6%) for your buildathon demonstration.
            </p>
          </div>
          <button
            onClick={handleRunDemoEvaluation}
            disabled={startingDemo}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            {startingDemo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{startingDemo ? 'Processing...' : 'Run 100-Case Evaluation Now'}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Evaluation History</h3>
            <button onClick={loadBatches} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Batch ID</th>
                <th className="py-3.5 px-6">Mode</th>
                <th className="py-3.5 px-6">Progress</th>
                <th className="py-3.5 px-6">Amount at Risk</th>
                <th className="py-3.5 px-6">Simulated Recovered</th>
                <th className="py-3.5 px-6">Revenue Recovery Rate</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {batches.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900">{b.batchId}</td>
                  <td className="py-4 px-6">
                    <EnvironmentIndicator mode={b.mode === 'RAZORPAY_TEST' ? 'RAZORPAY TEST MODE' : 'SIMULATION MODE'} />
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {b.processedCases} / {b.totalCases} cases
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">{formatPaiseToRupees(b.totalAmountAtRisk)}</td>
                  <td className="py-4 px-6 font-bold text-emerald-600">{formatPaiseToRupees(b.totalRecoveredAmount)}</td>
                  <td className="py-4 px-6 font-extrabold text-indigo-700">{b.recoveryRate}%</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      b.status === 'RUNNING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                      'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onNavigate(`/evaluations/${b.batchId}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      View Report &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

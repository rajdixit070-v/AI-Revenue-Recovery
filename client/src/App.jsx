import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import OverviewPage from './pages/OverviewPage';
import RecoveryCasesPage from './pages/RecoveryCasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import AtRiskPage from './pages/AtRiskPage';
import PaymentsPage from './pages/PaymentsPage';
import CustomersPage from './pages/CustomersPage';
import AIDecisionsPage from './pages/AIDecisionsPage';
import PoliciesPage from './pages/PoliciesPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import BatchReportPage from './pages/BatchReportPage';
import AgentRunConsolePage from './pages/AgentRunConsolePage';
import { api } from './services/api';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [environment, setEnvironment] = useState('SIMULATION MODE');

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    api.getMetrics()
      .then(res => {
        if (res.data?.environment) setEnvironment(res.data.environment);
      })
      .catch(() => {});
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const getTitle = () => {
    if (currentPath === '/') return 'Overview Dashboard';
    if (currentPath === '/recovery-cases') return 'Recovery Cases';
    if (currentPath.startsWith('/recovery-cases/')) return 'Recovery Case Details';
    if (currentPath === '/at-risk') return 'Revenue At Risk Priority Queue';
    if (currentPath === '/evaluations') return 'Batch Recovery Evaluation Engine';
    if (currentPath.startsWith('/evaluations/')) return 'Evaluation Batch Report';
    if (currentPath === '/agent-runs') return 'Agent Run Execution Console';
    if (currentPath === '/payments') return 'Payments Directory';
    if (currentPath === '/customers') return 'Customer Directory';
    if (currentPath === '/ai-decisions') return 'AI Decision Audit Log';
    if (currentPath === '/policies') return 'Recovery Policies';
    if (currentPath === '/audit') return 'Immutable Audit Trail';
    if (currentPath === '/settings') return 'Settings & Credentials';
    return 'Dashboard';
  };

  const renderContent = () => {
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <OverviewPage onNavigate={navigate} />;
    }
    if (currentPath === '/recovery-cases') {
      return <RecoveryCasesPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/recovery-cases/')) {
      const caseId = currentPath.split('/')[2];
      return <CaseDetailPage caseId={caseId} onNavigate={navigate} />;
    }
    if (currentPath === '/at-risk') {
      return <AtRiskPage onNavigate={navigate} />;
    }
    if (currentPath === '/evaluations') {
      return <EvaluationsPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/evaluations/')) {
      const batchId = currentPath.split('/')[2];
      return <BatchReportPage batchId={batchId} onNavigate={navigate} />;
    }
    if (currentPath === '/agent-runs') {
      return <AgentRunConsolePage />;
    }
    if (currentPath === '/payments') {
      return <PaymentsPage />;
    }
    if (currentPath === '/customers') {
      return <CustomersPage />;
    }
    if (currentPath === '/ai-decisions') {
      return <AIDecisionsPage />;
    }
    if (currentPath === '/policies') {
      return <PoliciesPage />;
    }
    if (currentPath === '/audit') {
      return <AuditPage />;
    }
    if (currentPath === '/settings') {
      return <SettingsPage />;
    }
    return <OverviewPage onNavigate={navigate} />;
  };

  return (
    <MainLayout
      currentPath={currentPath}
      onNavigate={navigate}
      title={getTitle()}
      environment={environment}
    >
      {renderContent()}
    </MainLayout>
  );
}

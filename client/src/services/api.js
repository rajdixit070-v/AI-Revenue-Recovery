const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

export async function ensureAuthToken(force = false) {
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token || force) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'merchant@recoverai.local', password: 'SecurePassword123!' }),
      });
      const json = await res.json();
      if (json.data?.token) {
        token = json.data.token;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(json.data.user || { name: 'Demo Merchant', email: 'merchant@recoverai.local', role: 'ADMIN' }));
        }
      }
    } catch (err) {
      console.warn('[AUTH] Demo auto-login failed:', err.message);
    }
  }
  return token;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/health')) {
    token = await ensureAuthToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    let res = await fetch(url, { ...options, headers });

    // Handles 401 retry with freshly issued token
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      const newToken = await ensureAuthToken(true);
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json.error?.message || json.message || `Request failed with status ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = json;
      throw err;
    }
    return json;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  getHealth: () => request('/health'),
  getMetrics: () => request('/recovery/metrics'),
  getDegradationStatus: () => request('/recovery/degradation-monitor'),
  getAtRiskCases: () => request('/recovery/at-risk'),
  getCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/recovery/cases${query ? `?${query}` : ''}`);
  },
  getCaseById: (id) => request(`/recovery/cases/${id}`),
  analyzeCase: (id) => request(`/recovery/cases/${id}/analyze`, { method: 'POST' }),
  aiAnalyzeCase: (id) => request(`/recovery/cases/${id}/ai-analyze`, { method: 'POST' }),
  executeCase: (id, action) => request(`/recovery/cases/${id}/execute`, { method: 'POST', body: JSON.stringify({ action }) }),
  simulateAction: (id, action) => request(`/recovery/cases/${id}/simulate-action`, { method: 'POST', body: JSON.stringify({ action }) }),
  simulateFailure: (data) => request('/recovery/simulate-failure', { method: 'POST', body: JSON.stringify(data) }),
  simulatePaymentSuccess: (caseId) => request(`/recovery/cases/${caseId}/simulate-payment-success`, { method: 'POST' }),
  dispatchTestWebhook: (caseId) => request(`/recovery/cases/${caseId}/dispatch-test-webhook`, { method: 'POST' }),
  getHinglishScript: (caseId) => request(`/recovery/cases/${caseId}/hinglish-script`, { method: 'POST' }),
  setPromiseToPay: (caseId, promiseDate, amount) => request(`/recovery/cases/${caseId}/promise-to-pay`, { method: 'POST', body: JSON.stringify({ promiseDate, amount }) }),
  sequenceMandate: (caseId) => request(`/recovery/cases/${caseId}/mandate-sequence`, { method: 'POST' }),
  clearDemoData: () => request('/recovery/clear-demo', { method: 'POST' }),
  seedDemoData: () => request('/recovery/seed-demo', { method: 'POST' }),
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  getPolicies: () => request('/recovery/policies'),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Phase 7 Evaluation API
  createBatch: (data) => request('/evaluations/batches', { method: 'POST', body: JSON.stringify(data) }),
  runBatch: (batchId) => request(`/evaluations/batches/${batchId}/run`, { method: 'POST' }),
  getBatches: () => request('/evaluations/batches'),
  getBatchById: (batchId) => request(`/evaluations/batches/${batchId}`),
  getBatchResults: (batchId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/evaluations/batches/${batchId}/results${query ? `?${query}` : ''}`);
  },
  getBatchReport: (batchId) => request(`/evaluations/batches/${batchId}/report`),

  // Phase 11 Copilot API
  sendCopilotMessage: (message, context = {}) => request('/copilot/chat', { method: 'POST', body: JSON.stringify({ message, context }) }),
};

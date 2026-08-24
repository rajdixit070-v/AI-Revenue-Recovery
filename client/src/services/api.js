const API_BASE = '/api';

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

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
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
  getHealth: () => request('/health'),
  getMetrics: () => request('/recovery/metrics'),
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

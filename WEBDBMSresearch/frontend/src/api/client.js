
const API = import.meta.env.VITE_API_URL || "http://localhost:8001";

let accessToken = localStorage.getItem('access_token') || null;
let refreshToken = localStorage.getItem('refresh_token') || null;

export function setTokens({ access, refresh }) {
  accessToken = access; refreshToken = refresh;
  if (access) localStorage.setItem('access_token', access); else localStorage.removeItem('access_token');
  if (refresh) localStorage.setItem('refresh_token', refresh); else localStorage.removeItem('refresh_token');
}

async function request(path, opts = {}) {
  const headers = opts.headers || {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (res.status === 401 && refreshToken) {
    // try refresh once
    const r = await fetch(`${API}/api/auth/refresh`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refresh_token: refreshToken }) });
    if (r.ok) {
      const j = await r.json();
      setTokens({ access: j.access_token, refresh: refreshToken });
      return request(path, opts);
    } else {
      setTokens({ access: null, refresh: null });
      throw new Error('Unauthorized');
    }
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ctype = res.headers.get('content-type') || '';
  return ctype.includes('application/json') ? res.json() : res.text();
}

export const api = {
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/api/auth/me'),
  listItems: (lab) => request(`/api/${lab}/items`),
  createItem: (lab, data) => request(`/api/${lab}/items`, { method: 'POST', body: JSON.stringify({ data }) }),
  updateItem: (lab, id, data) => request(`/api/${lab}/items/${id}`, { method: 'PUT', body: JSON.stringify({ data }) }),
  deleteItem: (lab, id) => request(`/api/${lab}/items/${id}`, { method: 'DELETE' }),
  // admin
  listUsers: () => request('/api/users'),
  createUser: (payload) => request('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  changePassword: (uid, new_password) => request(`/api/users/${uid}/password`, { method: 'PUT', body: JSON.stringify({ new_password }) }),
  // borrow workflow
  listBorrowRequests: () => request('/api/borrow'),
  
  // reports
  listReports: () => request('/api/reports'),
  createReport: (data) => request('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
  respondToReport: (reportId, message) => request(`/api/reports/${reportId}/respond`, { method: 'POST', body: JSON.stringify({ message }) }),
  updateReportStatus: (reportId, status) => request(`/api/reports/${reportId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  submitBorrowRequest: (payload) => request('/api/borrow', { method: 'POST', body: JSON.stringify(payload) }),
  approveBorrowRequest: (id) => request(`/api/borrow/${id}/approve`, { method: 'POST' }),
  cancelBorrowRequest: (id) => request(`/api/borrow/${id}/cancel`, { method: 'POST' }),
  returnBorrowedItem: (id) => request(`/api/borrow/${id}/return`, { method: 'POST' }),
}

export const preferences = {
  get: (uid) => request(`/api/users/${uid}/preferences`),
  put: (uid, data) => request(`/api/users/${uid}/preferences`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Normalize base URL to avoid double slashes (e.g., https://api.com/ + /auth -> //auth)
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = RAW_API_URL.replace(/\/+$/, '')

export function getToken() {
  return localStorage.getItem('token') || ''
}

export function setToken(t) {
  if (t) localStorage.setItem('token', t)
}

async function req(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...opts, headers })
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error || 'Request failed')
  return res.json()
}

export const api = {
  login: (identifier, password, role) => req('/auth/login', { method: 'POST', body: JSON.stringify({
    email: role === 'admin' ? identifier : undefined,
    loginId: role === 'faculty' ? identifier : undefined,
    password,
    role,
  }) }),
  register: (payload) => req('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  uploadCsv: async (endpoint, file) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
    if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error || 'Upload failed')
    return res.json()
  },
  generateSchedule: (date) => req(`/schedule/generate?date=${encodeURIComponent(date)}`, { method: 'POST' }),
  scheduleForDay: (date) => req(`/schedule/day?date=${encodeURIComponent(date)}`),
  clearScheduleForDay: (date) => req(`/schedule/day?date=${encodeURIComponent(date)}`, { method: 'DELETE' }),
  exportCsvUrl: (date) => `${API_URL}/schedule/export/day.csv?date=${encodeURIComponent(date)}`,
  notifyDay: (date) => req(`/schedule/notify/day?date=${encodeURIComponent(date)}`, { method: 'POST' }),
  myAllocations: () => req('/faculty/me/allocations'),
  submitRequest: (payload) => req('/faculty/requests', { method: 'POST', body: JSON.stringify(payload) }),
  adminRequests: (status='pending') => req(`/faculty/admin/requests?status=${encodeURIComponent(status)}`),
  approveRequest: (id, body={}) => req(`/faculty/requests/${encodeURIComponent(id)}/approve`, { method: 'POST', body: JSON.stringify(body) }),
  facultySearch: (q) => req(`/faculty/search?q=${encodeURIComponent(q)}`),
  reassign: (allocationId, toFacultyId) => req(`/schedule/reassign/${encodeURIComponent(allocationId)}`, { method: 'PATCH', body: JSON.stringify({ toFacultyId }) }),
  credentialsGenerate: (payload) => req('/faculty/credentials/generate', { method: 'POST', body: JSON.stringify(payload || {}) }),
  credentialsNotify: (credentials) => req('/faculty/credentials/notify', { method: 'POST', body: JSON.stringify({ credentials }) }),
  adminAddFaculty: (payload) => req('/faculty/admin/add', { method: 'POST', body: JSON.stringify(payload) }),
  adminRemoveFaculty: (payload) => req('/faculty/admin/remove', { method: 'POST', body: JSON.stringify(payload) }),
  credentialBatches: () => req('/faculty/credentials/batches'),
  credentialBatchById: (id) => req(`/faculty/credentials/batches/${encodeURIComponent(id)}`),
  clearCredentialBatches: () => req('/faculty/credentials/batches', { method: 'DELETE' }),
}


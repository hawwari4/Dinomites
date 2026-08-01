import client from './client'

export const authApi = {
  login: (role) => client.post('/api/auth/login', { role }).then((r) => r.data),
  loginIntern: (email, password) => client.post('/api/auth/login/intern', { email, password }).then((r) => r.data),
  loginRole: (role, username, password) =>
    client.post('/api/auth/login/role', { role, username, password }).then((r) => r.data),
}

export const candidateApi = {
  list: (params = {}) => client.get('/api/candidates', { params }).then((r) => r.data),
  get: (id) => client.get(`/api/candidates/${id}`).then((r) => r.data),
  matches: (id) => client.get(`/api/candidates/${id}/matches`).then((r) => r.data),
  update: (id, patch) => client.put(`/api/candidates/${id}`, patch).then((r) => r.data),
  assign: (id, startupId) => client.put(`/api/candidates/${id}/assign`, { startupId }).then((r) => r.data),
  advance: (id) => client.put(`/api/candidates/${id}/advance`).then((r) => r.data),
  reject: (id, feedback) => client.put(`/api/candidates/${id}/reject`, { feedback }).then((r) => r.data),
  rescore: (id) => client.put(`/api/candidates/${id}/rescore`).then((r) => r.data),
  remove: (id) => client.delete(`/api/candidates/${id}`).then((r) => r.data),
  push: (body) => client.post('/api/candidates/push', body).then((r) => r.data),
  bulk: (body) => client.post('/api/candidates/bulk', body).then((r) => r.data),
  apply: (body) => client.post('/api/candidates/apply', body).then((r) => r.data),
  extract: (file) => {
    const formData = new FormData()
    formData.append('cv', file)
    return client.post('/api/candidates/extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
}

export const startupApi = {
  list: () => client.get('/api/startups').then((r) => r.data),
  get: (id) => client.get(`/api/startups/${id}`).then((r) => r.data),
  update: (id, patch) => client.put(`/api/startups/${id}`, patch).then((r) => r.data),
  addNeed: (id, need) => client.post(`/api/startups/${id}/needs`, { need }).then((r) => r.data),
  removeNeed: (id, need) => client.delete(`/api/startups/${id}/needs/${encodeURIComponent(need)}`).then((r) => r.data),
  candidates: (id) => client.get(`/api/startups/${id}/candidates`).then((r) => r.data),
  internMatches: (id) => client.get(`/api/startups/${id}/matches`).then((r) => r.data),
  descriptions: (id) => client.get(`/api/startups/${id}/descriptions`).then((r) => r.data),
  uploadDescription: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return client
      .post(`/api/startups/${id}/descriptions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },
}

export const universityApi = {
  list: () => client.get('/api/universities').then((r) => r.data),
  get: (id) => client.get(`/api/universities/${id}`).then((r) => r.data),
}

export const contractApi = {
  list: (candidateId) => client.get('/api/contracts', { params: { candidateId } }).then((r) => r.data),
  sign: (id, signatureData) => client.put(`/api/contracts/${id}/sign`, { signatureData }).then((r) => r.data),
}

export const byocApi = {
  list: (startupId) => client.get('/api/byoc', { params: { startupId } }).then((r) => r.data),
  submit: (body) => client.post('/api/byoc', body).then((r) => r.data),
  approve: (id) => client.put(`/api/byoc/${id}/approve`).then((r) => r.data),
  reject: (id) => client.put(`/api/byoc/${id}/reject`).then((r) => r.data),
}

export const notificationApi = {
  list: (candidateId) => client.get('/api/notifications', { params: { candidateId } }).then((r) => r.data),
  send: (body) => client.post('/api/notifications', body).then((r) => r.data),
  markRead: (id) => client.put(`/api/notifications/${id}/read`).then((r) => r.data),
}

export const automationApi = {
  run: (kind, candidateIds, extra = {}) => client.post('/api/automation', { kind, candidateIds, ...extra }).then((r) => r.data),
  payrollPreview: () => client.get('/api/automation/payroll-preview').then((r) => r.data),
}

export const statsApi = {
  dashboard: () => client.get('/api/stats/dashboard').then((r) => r.data),
}

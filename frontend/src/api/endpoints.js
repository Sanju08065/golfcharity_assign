import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
  resetPassword: (email, otp, new_password) => api.post('/api/auth/reset-password', { email, otp, new_password }),
};

// Scores
export const scoresAPI = {
  add: (data) => api.post('/api/scores', data),
  getByUser: (userId) => api.get(`/api/scores/${userId}`),
  update: (id, data) => api.put(`/api/scores/${id}`, data),
  delete: (id) => api.delete(`/api/scores/${id}`),
};

// Subscriptions
export const subscriptionAPI = {
  subscribe: (plan) => api.post('/api/subscribe', { plan }),
  activate: (session_id) => api.post('/api/subscription/activate', { session_id }),
  status: (userId) => api.get(`/api/subscription/status/${userId}`),
  cancel: () => api.post('/api/subscription/cancel'),
};

// Charities
export const charitiesAPI = {
  list: (params) => api.get('/api/charities', { params }),
  get: (id) => api.get(`/api/charities/${id}`),
  updateUserCharity: (data) => api.put('/api/charities/user', data),
  donate: (data) => api.post('/api/charities/donate', data),
  create: (data) => api.post('/api/charities/admin', data),
  update: (id, data) => api.put(`/api/charities/admin/${id}`, data),
  remove: (id) => api.delete(`/api/charities/admin/${id}`),
};

// Draws
export const drawsAPI = {
  list: () => api.get('/api/draws'),
  get: (id) => api.get(`/api/draws/${id}`),
  current: () => api.get('/api/draws/current'),
  userHistory: () => api.get('/api/draws/user/history'),
  create: (data) => api.post('/api/draws/admin/create', data),
  simulate: (drawId) => api.post('/api/draws/admin/simulate', { draw_id: drawId }),
  publish: (drawId, winningNumbers) => api.post('/api/draws/admin/publish', { draw_id: drawId, winning_numbers: winningNumbers }),
};

// Winners
export const winnersAPI = {
  my: () => api.get('/api/winners/my'),
  uploadProof: (formData) => api.post('/api/winners/proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  adminList: () => api.get('/api/winners/admin/all'),
  verify: (id, status, reason) => api.put(`/api/winners/admin/${id}/verify`, { status, reason }),
  pay: (id) => api.put(`/api/winners/admin/${id}/pay`),
};

// Admin
export const adminAPI = {
  reports: () => api.get('/api/admin/reports'),
  users: (params) => api.get('/api/admin/users', { params }),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  userScores: (id) => api.get(`/api/admin/users/${id}/scores`),
  updateUserScore: (userId, scoreId, data) => api.put(`/api/admin/users/${userId}/scores/${scoreId}`, data),
  deleteUserScore: (userId, scoreId) => api.delete(`/api/admin/users/${userId}/scores/${scoreId}`),
};

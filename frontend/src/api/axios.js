import axios from 'axios';
import { triggerSubscriptionGate } from '../components/common/SubscriptionGate';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s timeout — never hang forever
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — handle auth + subscription errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // 401 — only logout on definitive auth failures
    if (status === 401 && ['INVALID_TOKEN', 'NO_TOKEN', 'AUTH_FAILED'].includes(code)) {
      if (window.location.pathname !== '/login') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    // 403 subscription required — show gate
    if (status === 403 && code === 'SUBSCRIPTION_REQUIRED') {
      triggerSubscriptionGate();
    }

    // 429 — do NOT retry, just reject silently
    // The component will render with whatever data it has

    return Promise.reject(error);
  }
);

export default api;

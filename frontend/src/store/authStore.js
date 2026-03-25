import { create } from 'zustand';
import { authAPI } from '../api/endpoints';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token') || null,
  loading: false,
  profileLoading: false,
  profileLoaded: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      const user = { ...data.data.user, profile: data.data.user.profile };
      const token = data.data.session.access_token;
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false, profileLoaded: true });
      return user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.register(formData);
      if (data.data?.session) {
        const token = data.data.session.access_token;
        localStorage.setItem('access_token', token);
        set({ token });
        const user = { ...data.data.user, profile: data.data.user.profile };
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, loading: false, profileLoaded: true });
      } else {
        set({ loading: false });
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  fetchProfile: async () => {
    // Block concurrent calls
    if (get().profileLoading) return get().user;
    set({ profileLoading: true });
    try {
      const { data } = await authAPI.me();
      const user = { ...data.data, profile: data.data.profile };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, profileLoading: false, profileLoaded: true });
      return user;
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      if (status === 401 && ['INVALID_TOKEN', 'NO_TOKEN', 'AUTH_FAILED'].includes(code)) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        set({ user: null, token: null, profileLoading: false, profileLoaded: true });
      } else {
        // 429, network error, 500 — keep cached user, stop loading
        set({ profileLoading: false, profileLoaded: true });
      }
      return get().user;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, profileLoaded: false });
  },

  isAdmin: () => get().user?.profile?.role === 'admin',
  isSubscribed: () => get().user?.profile?.subscription_status === 'active',

  updateProfile: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.updateProfile(formData);
      const user = { ...data.data, profile: data.data.profile };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Update failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

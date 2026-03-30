import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('nf_user') || 'null'),
  token: localStorage.getItem('nf_token') || null,
  isAuthenticated: !!localStorage.getItem('nf_token'),
  loading: false,
  error: null,

  register: async ({ username, email, password }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.register({ username, email, password });
      localStorage.setItem('nf_token', data.token);
      localStorage.setItem('nf_user', JSON.stringify(data));
      set({
        user: data,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('nf_token', data.token);
      localStorage.setItem('nf_user', JSON.stringify(data));
      set({
        user: data,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('nf_token');
    localStorage.removeItem('nf_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateModelPreferences: async (models) => {
    try {
      const { data } = await authAPI.updateModels(models);
      const updatedUser = { ...get().user, modelPreferences: data.modelPreferences };
      localStorage.setItem('nf_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (err) {
      console.error('Failed to update model preferences:', err);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

import { create } from 'zustand';
import { authAPI } from '../services/api';
import { sanitizeModelConfig } from '../utils/modelValidator';

const getInitialUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('nf_user') || 'null');
    if (stored?.modelPreferences) {
      stored.modelPreferences = sanitizeModelConfig(stored.modelPreferences);
    }
    return stored;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  isAuthenticated: !!getInitialUser(),
  loading: false,
  error: null,

  register: async ({ username, email, password }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.register({ username, email, password });
      localStorage.setItem('nf_user', JSON.stringify(data));
      set({
        user: data,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('nf_user', JSON.stringify(data));
      set({
        user: data,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  googleAuth: async (credential) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.googleAuth({ credential });
      localStorage.setItem('nf_user', JSON.stringify(data));
      set({
        user: data,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('nf_user');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateModelPreferences: async (models) => {
    try {
      const sanitized = sanitizeModelConfig(models);
      const { data } = await authAPI.updateModels(sanitized);
      const updatedUser = {
        ...get().user,
        modelPreferences: sanitizeModelConfig(data.modelPreferences),
      };
      localStorage.setItem('nf_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (err) {
      console.error('Failed to update model preferences:', err);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;


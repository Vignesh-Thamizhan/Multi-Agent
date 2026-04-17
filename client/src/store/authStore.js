import { create } from 'zustand';
import { authAPI } from '../services/api';

const getInitialUser = () => {
  try {
    return JSON.parse(localStorage.getItem('nf_user') || 'null');
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


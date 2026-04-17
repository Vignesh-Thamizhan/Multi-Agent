import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nf_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  updateModels: (data) => api.put('/auth/models', data),
};

// ── Generate (Pipeline) ──────────────────────────────
export const generateAPI = {
  trigger: (data) => api.post('/generate', data),
  getSessions: () => api.get('/generate/sessions'),
  getSession: (id) => api.get(`/generate/sessions/${id}`),
  deleteSession: (id) => api.delete(`/generate/sessions/${id}`),
};

// ── Upload ───────────────────────────────────────────
export const uploadAPI = {
  upload: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // longer timeout for file uploads
    }),
};

export const workspaceAPI = {
  listFiles: (sessionId) => api.get(`/workspace/${sessionId}/files`),
  readFile: (sessionId, filePath) =>
    api.get(`/workspace/${sessionId}/file`, { params: { path: filePath } }),
  download: (sessionId) => api.get(`/workspace/${sessionId}/download`),
};

export default api;

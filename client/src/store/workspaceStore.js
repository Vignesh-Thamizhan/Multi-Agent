import { create } from 'zustand';
import { workspaceAPI } from '../services/api';

const useWorkspaceStore = create((set) => ({
  files: [],
  selectedFile: null,
  selectedContent: '',
  toolCalls: [],
  ragContexts: [],
  isLoadingFiles: false,

  setToolCall: (entry) => set((state) => ({ toolCalls: [...state.toolCalls, entry] })),
  setRagContext: (entry) => set((state) => ({ ragContexts: [...state.ragContexts, entry] })),
  resetWorkspaceState: () =>
    set({ files: [], selectedFile: null, selectedContent: '', toolCalls: [], ragContexts: [] }),

  fetchFiles: async (sessionId) => {
    if (!sessionId) return;
    set({ isLoadingFiles: true });
    try {
      const { data } = await workspaceAPI.listFiles(sessionId);
      set({ files: data.files || [] });
    } finally {
      set({ isLoadingFiles: false });
    }
  },

  openFile: async (sessionId, path) => {
    const { data } = await workspaceAPI.readFile(sessionId, path);
    set({ selectedFile: path, selectedContent: data.content || '' });
  },
}));

export default useWorkspaceStore;

import { create } from 'zustand';
import { PIPELINE_STATUSES, AGENT_STATUSES, PIPELINE_ORDER } from '../utils/agentConfig';

const getSavedPipelineMode = () => {
  try {
    return localStorage.getItem('nf_pipeline_mode') || 'sequential';
  } catch {
    return 'sequential';
  }
};

const createInitialAgentState = () => ({
  status: AGENT_STATUSES.IDLE,
  content: '',
  model: null,
  error: null,
  retryAttempt: null,
});

const usePipelineStore = create((set, get) => ({
  // Pipeline-level state
  pipelineStatus: PIPELINE_STATUSES.IDLE,
  currentSessionId: null,
  pipelineMode: getSavedPipelineMode(),

  // Per-agent state
  agents: {
    planner: createInitialAgentState(),
    coder: createInitialAgentState(),
    reviewer: createInitialAgentState(),
    debugger: createInitialAgentState(),
    multimodal: createInitialAgentState(),
  },

  // Loaded session messages (from history)
  sessionMessages: [],

  // ── Actions ───────────────────────────────────────────

  startPipeline: (sessionId) => {
    set({
      pipelineStatus: PIPELINE_STATUSES.RUNNING,
      currentSessionId: sessionId,
      agents: {
        planner: createInitialAgentState(),
        coder: createInitialAgentState(),
        reviewer: createInitialAgentState(),
        debugger: createInitialAgentState(),
        multimodal: createInitialAgentState(),
      },
    });
  },

  onAgentStart: (agent, model) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: {
          ...state.agents[agent],
          status: AGENT_STATUSES.STREAMING,
          model,
          content: '',
          error: null,
        },
      },
    }));
  },

  onAgentChunk: (agent, chunk) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: {
          ...state.agents[agent],
          content: state.agents[agent].content + chunk,
        },
      },
    }));
  },

  onAgentComplete: (agent, content) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: {
          ...state.agents[agent],
          status: AGENT_STATUSES.COMPLETE,
          content,
        },
      },
    }));
  },

  onAgentError: (agent, error) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: {
          ...state.agents[agent],
          status: AGENT_STATUSES.ERROR,
          error,
        },
      },
    }));
  },

  onAgentRetry: (agent, attempt) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agent]: {
          ...state.agents[agent],
          status: AGENT_STATUSES.RETRYING,
          retryAttempt: attempt,
        },
      },
    }));
  },

  onPipelineComplete: (sessionId) => {
    set({
      pipelineStatus: PIPELINE_STATUSES.COMPLETE,
      currentSessionId: sessionId,
    });
  },

  onPipelineError: () => {
    set({
      pipelineStatus: PIPELINE_STATUSES.ERROR,
    });
  },

  setSessionMessages: (messages) => {
    set({ sessionMessages: messages });
  },

  setPipelineMode: (mode) => {
    const valid = ['sequential', 'parallel', 'local'];
    const resolved = valid.includes(mode) ? mode : 'sequential';
    try { localStorage.setItem('nf_pipeline_mode', resolved); } catch {}
    set({ pipelineMode: resolved });
  },

  resetPipeline: () => {
    set({
      pipelineStatus: PIPELINE_STATUSES.IDLE,
      currentSessionId: null,
      agents: {
        planner: createInitialAgentState(),
        coder: createInitialAgentState(),
        reviewer: createInitialAgentState(),
        debugger: createInitialAgentState(),
        multimodal: createInitialAgentState(),
      },
      sessionMessages: [],
    });
  },

  // Computed-like helpers
  getActiveAgent: () => {
    const { agents } = get();
    return (
      PIPELINE_ORDER.find((id) => agents[id].status === AGENT_STATUSES.STREAMING) ||
      (agents.multimodal.status === AGENT_STATUSES.STREAMING ? 'multimodal' : null)
    );
  },

  isRunning: () => get().pipelineStatus === PIPELINE_STATUSES.RUNNING,
}));

export default usePipelineStore;

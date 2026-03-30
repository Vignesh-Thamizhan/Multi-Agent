import { create } from 'zustand';
import { PIPELINE_STATUSES, AGENT_STATUSES, PIPELINE_ORDER } from '../utils/agentConfig';

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

  // Per-agent state
  agents: {
    planner: createInitialAgentState(),
    coder: createInitialAgentState(),
    reviewer: createInitialAgentState(),
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

  onAgentRetry: (agent, attempt, waitMs) => {
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

  onPipelineError: (error) => {
    set({
      pipelineStatus: PIPELINE_STATUSES.ERROR,
    });
  },

  setSessionMessages: (messages) => {
    set({ sessionMessages: messages });
  },

  resetPipeline: () => {
    set({
      pipelineStatus: PIPELINE_STATUSES.IDLE,
      currentSessionId: null,
      agents: {
        planner: createInitialAgentState(),
        coder: createInitialAgentState(),
        reviewer: createInitialAgentState(),
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

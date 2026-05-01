// Agent display configuration — colors, models, and metadata

export const AGENTS = {
  planner: {
    id: 'planner',
    label: 'Planner',
    description: 'Designs architecture & step-by-step plan',
    icon: '🧠',
    color: '#8b5cf6',       // violet-500
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gradientFrom: '#8b5cf6',
    gradientTo: '#6d28d9',
    provider: 'OpenRouter',
    models: [
      { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet', provider: 'OpenRouter' },
      { id: 'anthropic/claude-opus-4', label: 'Claude 4 Opus', provider: 'OpenRouter' },
      { id: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenRouter' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'OpenRouter' },
    ],
    defaultModel: 'anthropic/claude-3.7-sonnet',
  },
  coder: {
    id: 'coder',
    label: 'Coder',
    description: 'Generates production-ready code with file creation',
    icon: '⚡',
    color: '#06b6d4',       // cyan-500
    bgColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    gradientFrom: '#06b6d4',
    gradientTo: '#0891b2',
    provider: 'Gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Gemini' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Gemini' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'Gemini' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'OpenRouter' },
      { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet', provider: 'OpenRouter' },
    ],
    defaultModel: 'gemini-2.5-flash',
  },
  reviewer: {
    id: 'reviewer',
    label: 'Reviewer',
    description: 'Deep code review & quality analysis',
    icon: '🔍',
    color: '#f59e0b',       // amber-500
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gradientFrom: '#f59e0b',
    gradientTo: '#d97706',
    provider: 'OpenRouter',
    models: [
      { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', provider: 'OpenRouter' },
      { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet', provider: 'OpenRouter' },
      { id: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenRouter' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'OpenRouter' },
    ],
    defaultModel: 'anthropic/claude-3.5-haiku',
  },
  debugger: {
    id: 'debugger',
    label: 'Debugger',
    description: 'RAG-powered debugging and analysis',
    icon: '🛠️',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gradientFrom: '#ef4444',
    gradientTo: '#b91c1c',
    provider: 'OpenRouter',
    models: [
      { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', provider: 'OpenRouter' },
      { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet', provider: 'OpenRouter' },
      { id: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenRouter' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'OpenRouter' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Gemini' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Gemini' },
    ],
    defaultModel: 'anthropic/claude-3.5-haiku',
  },
  multimodal: {
    id: 'multimodal',
    label: 'Vision',
    description: 'Processes images, PDFs, and code files',
    icon: '👁️',
    color: '#10b981',       // emerald-500
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    provider: 'Gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Gemini' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Gemini' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'Gemini' },
    ],
    defaultModel: 'gemini-2.5-flash',
  },
};

export const PIPELINE_ORDER = ['planner', 'coder', 'reviewer', 'debugger'];

export const PIPELINE_STATUSES = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETE: 'complete',
  ERROR: 'error',
};

export const AGENT_STATUSES = {
  IDLE: 'idle',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  ERROR: 'error',
  RETRYING: 'retrying',
};

export const ACCEPTED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.webp'],
  documents: ['.pdf'],
  code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.rb', '.php', '.sh', '.sql'],
  text: ['.txt', '.md', '.yaml', '.yml', '.json', '.xml', '.csv'],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const getAllAcceptedExtensions = () =>
  Object.values(ACCEPTED_FILE_TYPES).flat();

export const getAcceptString = () =>
  getAllAcceptedExtensions()
    .map((ext) => {
      const mimeMap = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.webp': 'image/webp', '.pdf': 'application/pdf',
      };
      return mimeMap[ext] || ext;
    })
    .join(',');

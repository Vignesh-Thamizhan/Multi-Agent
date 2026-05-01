const openrouterService = require('./openrouterService');
const geminiService = require('./geminiService');
const ollamaService = require('./ollamaService');
const logger = require('../utils/logger');

/**
 * Unified provider registry.
 *
 * Each provider exposes:
 *   streamCompletion({ model, messages, onChunk, temperature, maxTokens }) → Promise<string>
 *
 * Providers with tool support also expose:
 *   streamWithTools({ model, messages, executeTool, onToolCall, onChunk, maxIterations }) → Promise<{ content, toolTrace }>
 *
 * This factory isolates agents from knowing WHICH service they're calling.
 * Adding a new provider = add one entry here, nothing else changes in agents.
 */
const PROVIDERS = {
  openrouter: {
    name: 'openrouter',
    streamCompletion: (params) => openrouterService.streamCompletion(params),
    streamWithTools: null,
    supportsTools: false,
    requiresApiKey: true,
    envKey: 'OPENROUTER_API_KEY',
    isLocal: false,
  },
  gemini: {
    name: 'gemini',
    streamCompletion: null, // Gemini uses a different API shape (streamMultimodal)
    streamWithTools: (params) => geminiService.streamGeminiWithTools(params),
    supportsTools: true,
    requiresApiKey: true,
    envKey: 'GEMINI_API_KEY',
    isLocal: false,
  },
  ollama: {
    name: 'ollama',
    streamCompletion: (params) => ollamaService.streamCompletion(params),
    streamWithTools: null,
    supportsTools: false, // qwen3.5:4b has limited tool support; treat as false for safety
    requiresApiKey: false,
    envKey: null,
    isLocal: true,
  },
};

/**
 * Returns a provider handler by name.
 * Validates env config at call time so we fail fast with a clear error.
 *
 * @param {string} providerName - 'groq' | 'openrouter' | 'gemini' | 'ollama'
 * @returns {Object} Provider object with streamCompletion, supportsTools, etc.
 */
const getProvider = (providerName) => {
  const provider = PROVIDERS[providerName];

  if (!provider) {
    throw new Error(
      `Unknown LLM provider: "${providerName}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`
    );
  }

  if (provider.requiresApiKey && !process.env[provider.envKey]) {
    throw new Error(
      `Provider "${providerName}" requires env var ${provider.envKey} which is not set.`
    );
  }

  logger.debug(`[LLMProviderFactory] Resolved provider: ${providerName} | supportsTools=${provider.supportsTools}`);
  return provider;
};

/**
 * Derive the intended provider from a model string.
 * Agents can call this when they only receive a model name and need to
 * determine which service to route to.
 *
 * Heuristic rules (ordered by specificity):
 *   - starts with "gemini"                                → gemini
 *   - contains ":" (ollama tags like "qwen3.5:4b")        → ollama
 *   - contains "/" (openrouter format like "anthropic/…")  → openrouter
 *   - default                                             → openrouter
 */
const inferProviderFromModel = (modelName = '') => {
  const m = modelName.toLowerCase();

  // Gemini models (e.g. "gemini-2.5-flash", "gemini-2.5-pro")
  if (m.startsWith('gemini')) {
    return 'gemini';
  }

  // Ollama models have colon tags (e.g. "qwen3.5:4b", "gemma3:2b", "llama3:8b")
  if (m.includes(':')) {
    return 'ollama';
  }

  // OpenRouter models use org/model format (e.g. "anthropic/claude-3.5-haiku")
  // Default is also OpenRouter
  return 'openrouter';
};

module.exports = { getProvider, inferProviderFromModel, PROVIDERS };

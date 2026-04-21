const logger = require('./logger');

/**
 * Valid model IDs for each provider
 * Maps agent name to list of valid model IDs
 */
const VALID_MODELS = {
  planner: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  coder: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  reviewer: ['anthropic/claude-3.5-haiku', 'anthropic/claude-3.5-sonnet'],
  debugger: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  multimodal: ['gemini-2.5-flash'],
};

/**
 * Default model for each agent
 */
const DEFAULT_MODELS = {
  planner: 'llama-3.3-70b-versatile',
  coder: 'llama-3.3-70b-versatile',
  reviewer: 'anthropic/claude-3.5-haiku',
  debugger: 'llama-3.3-70b-versatile',
  multimodal: 'gemini-2.5-flash',
};

/**
 * Check if a model ID is valid for a specific agent
 * @param {string} agentId - Agent identifier
 * @param {string} modelId - Model identifier
 * @returns {boolean} True if valid
 */
const isValidModelForAgent = (agentId, modelId) => {
  if (!VALID_MODELS[agentId]) return false;
  return VALID_MODELS[agentId].includes(modelId);
};

/**
 * Get the default model for an agent
 * @param {string} agentId - Agent identifier
 * @returns {string} Default model ID
 */
const getDefaultModelForAgent = (agentId) => {
  return DEFAULT_MODELS[agentId] || null;
};

/**
 * Sanitize model configuration by validating against whitelist
 * Invalid or stale model values are replaced with defaults
 * Defense-in-depth validation layer on the server
 * @param {Object} models - Object with agent -> modelId mappings
 * @returns {Object} Sanitized models object
 */
const sanitizeModelConfig = (models) => {
  if (!models || typeof models !== 'object') {
    // Return all defaults if input is invalid
    return {
      planner: getDefaultModelForAgent('planner'),
      coder: getDefaultModelForAgent('coder'),
      reviewer: getDefaultModelForAgent('reviewer'),
      debugger: getDefaultModelForAgent('debugger'),
      multimodal: getDefaultModelForAgent('multimodal'),
    };
  }

  const sanitized = {};
  Object.keys(DEFAULT_MODELS).forEach((agentId) => {
    const modelId = models[agentId];
    const defaultModel = getDefaultModelForAgent(agentId);

    // Use provided model if valid, otherwise use default
    if (modelId && isValidModelForAgent(agentId, modelId)) {
      sanitized[agentId] = modelId;
    } else {
      // Log warning for stale/invalid values
      if (modelId) {
        logger.warn(
          `Server: Model "${modelId}" is not valid for agent "${agentId}". Using default: "${defaultModel}"`
        );
      }
      sanitized[agentId] = defaultModel;
    }
  });

  return sanitized;
};

module.exports = {
  VALID_MODELS,
  DEFAULT_MODELS,
  isValidModelForAgent,
  getDefaultModelForAgent,
  sanitizeModelConfig,
};

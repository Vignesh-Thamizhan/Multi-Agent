import { AGENTS } from './agentConfig';

/**
 * Get all valid model IDs for a specific agent
 * @param {string} agentId - Agent identifier
 * @returns {string[]} Array of valid model IDs
 */
export const getValidModelsForAgent = (agentId) => {
  const agent = AGENTS[agentId];
  return agent ? agent.models.map((m) => m.id) : [];
};

/**
 * Check if a model ID is valid for a specific agent
 * @param {string} agentId - Agent identifier
 * @param {string} modelId - Model identifier
 * @returns {boolean} True if valid
 */
export const isValidModelForAgent = (agentId, modelId) => {
  return getValidModelsForAgent(agentId).includes(modelId);
};

/**
 * Get the default model for an agent
 * @param {string} agentId - Agent identifier
 * @returns {string} Default model ID
 */
export const getDefaultModelForAgent = (agentId) => {
  const agent = AGENTS[agentId];
  return agent ? agent.defaultModel : null;
};

/**
 * Sanitize model configuration by validating against whitelist
 * Invalid or stale model values are replaced with defaults
 * @param {Object} models - Object with agent -> modelId mappings
 * @returns {Object} Sanitized models object
 */
export const sanitizeModelConfig = (models) => {
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
  Object.keys(AGENTS).forEach((agentId) => {
    const modelId = models[agentId];
    const defaultModel = getDefaultModelForAgent(agentId);

    // Use provided model if valid, otherwise use default
    if (modelId && isValidModelForAgent(agentId, modelId)) {
      sanitized[agentId] = modelId;
    } else {
      // Silently fall back to default for stale/invalid values
      if (modelId) {
        console.warn(
          `Model "${modelId}" is not valid for agent "${agentId}". Using default: "${defaultModel}"`
        );
      }
      sanitized[agentId] = defaultModel;
    }
  });

  return sanitized;
};

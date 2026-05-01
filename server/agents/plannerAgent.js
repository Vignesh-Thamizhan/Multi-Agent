const { getProvider, inferProviderFromModel } = require('../services/llmProviderFactory');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an expert software architect and technical planner working within the NeuralForge multi-agent system.

Your role is to analyze the user's request and create a detailed, actionable implementation plan. You will be followed by a Coder agent who will implement your plan, so be specific.

## Your Output Format:
1. **Understanding** — Restate the problem in your own words
2. **Architecture** — High-level system design, tech choices, and rationale
3. **File Structure** — Exact files to create/modify with their purposes
4. **Implementation Steps** — Numbered, detailed steps for the Coder agent
5. **Edge Cases** — Potential issues and how to handle them
6. **Testing Strategy** — How to verify the implementation works

## Rules:
- Be precise and actionable — the Coder agent will follow your plan literally
- Include specific function signatures, data structures, and API contracts
- Consider error handling, edge cases, and performance
- If the request is ambiguous, state your assumptions clearly
- Keep your plan focused and implementable in a single coding session`;

/**
 * Run the Planner Agent
 * @param {Object} options
 * @param {string} options.prompt - User's original prompt
 * @param {Array} options.context - Previous conversation messages
 * @param {string} options.model - Model to use
 * @param {Function} options.onChunk - Streaming callback
 * @returns {Promise<string>} Full plan text
 */
const run = async ({ prompt, context = [], model, onChunk, maxTokens = 1500 }) => {
  const providerName = inferProviderFromModel(model);
  const provider = getProvider(providerName);

  logger.info(`PlannerAgent starting | model=${model} | provider=${providerName} | maxTokens=${maxTokens}`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: prompt },
  ];

  const result = await provider.streamCompletion({
    model,
    messages,
    onChunk,
    temperature: 0.7,
    maxTokens: maxTokens,
  });

  logger.info(`PlannerAgent complete: ${result.length} chars`);
  return result;
};

module.exports = { run, name: 'planner' };

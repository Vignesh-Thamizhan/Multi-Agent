const groqService = require('../services/groqService');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an expert code generator working within the NeuralForge multi-agent system.

You receive a detailed implementation plan from the Planner agent and must produce complete, production-ready code.

## Your Output Format:
For each file, output:
\`\`\`language:path/to/filename.ext
// complete file contents
\`\`\`

## Rules:
- Follow the Planner's architecture exactly
- Write complete, runnable code — no placeholders, no "TODO", no "..."
- Include proper error handling, input validation, and edge case coverage
- Add clear comments for complex logic
- Use modern best practices for the language/framework
- Include all necessary imports/dependencies
- If the Planner missed something, fill in the gaps intelligently
- Output ALL files needed, even config files, package.json changes, etc.

## Code Quality Standards:
- Clean, readable variable/function names
- Consistent formatting and style
- DRY — don't repeat yourself
- SOLID principles where applicable
- Proper TypeScript types if using TypeScript`;

/**
 * Run the Coder Agent
 * @param {Object} options
 * @param {string} options.prompt - User's original prompt
 * @param {string} options.plan - Planner agent's output
 * @param {Array} options.context - Previous conversation messages
 * @param {string} options.model - Model to use
 * @param {Function} options.onChunk - Streaming callback
 * @returns {Promise<string>} Full code output
 */
const run = async ({ prompt, plan, context = [], model, onChunk }) => {
  logger.info(`CoderAgent starting with model: ${model}`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: `## Original Request:\n${prompt}\n\n## Implementation Plan (from Planner Agent):\n${plan}\n\nNow generate the complete code following this plan. Output every file in full.`,
    },
  ];

  const result = await groqService.streamCompletion({
    model,
    messages,
    onChunk,
    temperature: 0.4,
    maxTokens: 8192,
  });

  logger.info(`CoderAgent complete: ${result.length} chars`);
  return result;
};

const runWithTools = async ({
  prompt,
  plan,
  context = [],
  model,
  onChunk,
  executeTool,
  onToolCall,
}) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.map((msg) => ({ role: msg.role, content: msg.content })),
    {
      role: 'user',
      content: `## Original Request:\n${prompt}\n\n## Implementation Plan (from Planner Agent):\n${plan}\n\nImplement files directly using MCP tools when needed.`,
    },
  ];

  const result = await groqService.streamGroqWithTools({
    model,
    messages,
    executeTool,
    onToolCall,
    onChunk,
  });

  return result;
};

module.exports = { run, runWithTools, name: 'coder' };

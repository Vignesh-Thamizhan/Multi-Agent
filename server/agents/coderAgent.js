const { getProvider, inferProviderFromModel } = require('../services/llmProviderFactory');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an expert code generator working within the NeuralForge multi-agent system.

You receive a detailed implementation plan from the Planner agent and must produce complete, production-ready code.

## Tool Usage Instructions:
When creating or modifying files, use the available tools:
- **create_file**: Create a new file with initial content
  - filePath: relative path from workspace root (e.g., "src/main.py", "components/Button.jsx")
  - content: complete file contents
- **write_file**: Update an existing file's content
  - filePath: relative path from workspace root
  - content: complete new file contents
- **read_file**: Read a file to understand its current state
  - filePath: relative path from workspace root
- **list_files**: Get a list of all files in the workspace

## Output Format:
For each file, ALWAYS use the create_file tool instead of markdown code blocks.
Example: create_file tool with filePath="src/main.py" and the complete content.

## Rules:
- Follow the Planner's architecture exactly
- Write complete, runnable code — no placeholders, no "TODO", no "..."
- Include proper error handling, input validation, and edge case coverage
- Add clear comments for complex logic
- Use modern best practices for the language/framework
- Include all necessary imports/dependencies
- If the Planner missed something, fill in the gaps intelligently
- Create ALL files needed, including config files, package.json changes, etc.
- Always use relative paths for file creation (e.g., "fibonacci.py" not "/absolute/path/fibonacci.py")

## Code Quality Standards:
- Clean, readable variable/function names
- Consistent formatting and style
- DRY — don't repeat yourself
- SOLID principles where applicable
- Proper TypeScript types if using TypeScript`;

/**
 * Run the Coder Agent (text-only streaming, no tools)
 * @param {Object} options
 * @param {string} options.prompt - User's original prompt
 * @param {string} options.plan - Planner agent's output
 * @param {Array} options.context - Previous conversation messages
 * @param {string} options.model - Model to use
 * @param {Function} options.onChunk - Streaming callback
 * @returns {Promise<string>} Full code output
 */
const run = async ({ prompt, plan, context = [], model, onChunk }) => {
  const providerName = inferProviderFromModel(model);
  const provider = getProvider(providerName);

  logger.info(`CoderAgent starting | model=${model} | provider=${providerName}`);

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

  const result = await provider.streamCompletion({
    model,
    messages,
    onChunk,
    temperature: 0.4,
    maxTokens: 8192,
  });

  logger.info(`CoderAgent complete: ${result.length} chars`);
  return result;
};

/**
 * Run the Coder Agent with MCP tool support.
 * Falls back to text-only mode for providers that don't support tools (e.g. Ollama).
 */
const runWithTools = async ({
  prompt,
  plan,
  context = [],
  model,
  onChunk,
  executeTool,
  onToolCall,
}) => {
  const providerName = inferProviderFromModel(model);
  const provider = getProvider(providerName);

  // If the provider doesn't support tools, fall back to text-only code generation
  if (!provider.supportsTools || !provider.streamWithTools) {
    logger.warn(
      `[CoderAgent] Provider "${providerName}" does not support tools. ` +
      `Falling back to text-only code generation.`
    );
    const content = await run({ prompt, plan, context, model, onChunk });
    return { content, toolTrace: [] };
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.map((msg) => ({ role: msg.role, content: msg.content })),
    {
      role: 'user',
      content: `## Original Request:\n${prompt}\n\n## Implementation Plan (from Planner Agent):\n${plan}\n\nNow implement all files using the create_file tool for each file. Use relative paths.`,
    },
  ];

  const result = await provider.streamWithTools({
    model,
    messages,
    executeTool,
    onToolCall,
    onChunk,
  });

  return result;
};

module.exports = { run, runWithTools, name: 'coder' };

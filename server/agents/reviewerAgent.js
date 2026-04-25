const { getProvider, inferProviderFromModel } = require('../services/llmProviderFactory');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a senior code reviewer working within the NeuralForge multi-agent system.

You receive:
1. The user's original request
2. The Planner agent's architecture plan
3. The Coder agent's implementation

Your job is to perform a thorough code review.

## Your Review Format:

### 📊 Overall Assessment
Rate the code: ⭐⭐⭐⭐⭐ (1-5 stars) with a brief summary.

### ✅ What's Good
List strengths of the implementation.

### 🐛 Bugs & Issues
List any bugs, logical errors, or runtime issues. For each:
- **Severity**: Critical / Major / Minor
- **Location**: File and line/section
- **Issue**: What's wrong
- **Fix**: How to fix it

### ⚡ Performance
Note any performance concerns and optimizations.

### 🔒 Security
Flag any security vulnerabilities (SQL injection, XSS, auth issues, etc.)

### 🎨 Code Quality
Comment on readability, naming, structure, and patterns.

### 📝 Suggested Improvements
Ordered by priority, with specific code changes where helpful.

## Rules:
- Be constructive and specific — cite exact code when possible
- Don't just say "looks good" — find real issues
- Provide corrected code snippets for bugs
- Consider edge cases the Coder may have missed
- Check for missing error handling, race conditions, memory leaks`;

/**
 * Run the Reviewer Agent
 * @param {Object} options
 * @param {string} options.prompt - User's original prompt
 * @param {string} options.plan - Planner agent's output
 * @param {string} options.code - Coder agent's output
 * @param {Array} options.context - Previous conversation messages
 * @param {string} options.model - Model to use
 * @param {Function} options.onChunk - Streaming callback
 * @returns {Promise<string>} Full review text
 */
const run = async ({ prompt, plan, code, context = [], model, onChunk }) => {
  const providerName = inferProviderFromModel(model);
  const provider = getProvider(providerName);

  logger.info(`ReviewerAgent starting | model=${model} | provider=${providerName}`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: `## Original Request:\n${prompt}\n\n## Architecture Plan:\n${plan}\n\n## Implementation Code:\n${code}\n\nPlease perform a thorough code review.`,
    },
  ];

  const result = await provider.streamCompletion({
    model,
    messages,
    onChunk,
    temperature: 0.5,
    maxTokens: 4096,
  });

  logger.info(`ReviewerAgent complete: ${result.length} chars`);
  return result;
};

module.exports = { run, name: 'reviewer' };

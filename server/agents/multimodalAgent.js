const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a multimodal AI assistant within the NeuralForge system.

You are specialized in analyzing uploaded files — images, documents, and code files.

## For Images:
- Describe what you see in detail
- If it's a UI mockup/wireframe, extract requirements and suggest implementation
- If it's a diagram, explain the architecture/flow
- If it's an error screenshot, diagnose the issue

## For Documents (PDF):
- Summarize the key content
- Extract actionable requirements or specifications
- Highlight important sections

## For Code Files:
- Analyze the code structure and purpose
- Identify issues, suggest improvements
- Explain complex logic in plain terms

## Rules:
- Be thorough but concise
- Use markdown formatting with code blocks where appropriate
- Provide actionable insights, not just descriptions`;

/**
 * Run the Multimodal Agent
 * @param {Object} options
 * @param {string} options.prompt - User's text prompt
 * @param {Object} options.file - Uploaded file { buffer, mimeType, originalname }
 * @param {Function} options.onChunk - Streaming callback
 * @returns {Promise<string>} Full analysis text
 */
const run = async ({ prompt, file, onChunk }) => {
  logger.info(`MultimodalAgent starting: file=${file?.originalname || 'none'}`);

  const fullPrompt = `${SYSTEM_PROMPT}\n\n## User's Request:\n${prompt}`;

  const result = await geminiService.streamMultimodal({
    prompt: fullPrompt,
    file,
    onChunk,
    model: 'gemini-2.5-flash',
  });

  logger.info(`MultimodalAgent complete: ${result.length} chars`);
  return result;
};

module.exports = { run, name: 'multimodal' };

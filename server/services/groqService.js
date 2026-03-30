const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Stream chat completions from Groq
 * @param {Object} options
 * @param {string} options.model - Model name (e.g., 'llama-3.3-70b-versatile')
 * @param {Array} options.messages - Chat messages array
 * @param {Function} options.onChunk - Callback for each text chunk
 * @param {number} options.temperature - Temperature (default: 0.7)
 * @param {number} options.maxTokens - Max tokens (default: 4096)
 * @returns {Promise<string>} Full accumulated response text
 */
const streamCompletion = async ({
  model = 'llama-3.3-70b-versatile',
  messages,
  onChunk,
  temperature = 0.7,
  maxTokens = 4096,
}) => {
  logger.info(`Groq streaming: model=${model}, messages=${messages.length}`);

  const stream = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullContent += delta;
      if (onChunk) {
        onChunk(delta);
      }
    }
  }

  logger.info(`Groq complete: ${fullContent.length} chars`);
  return fullContent;
};

module.exports = { streamCompletion };

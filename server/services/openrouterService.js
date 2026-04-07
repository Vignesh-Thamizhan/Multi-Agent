const logger = require('../utils/logger');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Stream chat completions from OpenRouter via SSE
 * @param {Object} options
 * @param {string} options.model - Model name (e.g., 'anthropic/claude-4-haiku')
 * @param {Array} options.messages - Chat messages array
 * @param {Function} options.onChunk - Callback for each text chunk
 * @param {number} options.temperature - Temperature (default: 0.7)
 * @param {number} options.maxTokens - Max tokens (default: 4096)
 * @returns {Promise<string>} Full accumulated response text
 */
const streamCompletion = async ({
  model = 'anthropic/claude-4-haiku',
  messages,
  onChunk,
  temperature = 0.7,
  maxTokens = 4096,
}) => {
  logger.info(`OpenRouter streaming: model=${model}, messages=${messages.length}`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'NeuralForge',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          if (onChunk) {
            onChunk(delta);
          }
        }
      } catch (e) {
        // Skip malformed JSON chunks
      }
    }
  }

  logger.info(`OpenRouter complete: ${fullContent.length} chars`);
  return fullContent;
};

module.exports = { streamCompletion };

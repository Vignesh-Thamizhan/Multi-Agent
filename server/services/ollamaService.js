const logger = require('../utils/logger');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Stream chat completions from a local Ollama model.
 * Uses the OpenAI-compatible /v1/chat/completions endpoint for consistent
 * interface with groqService / openrouterService.
 *
 * NOTE: Many local models have limited tool-call support.
 * Callers that need MCP tools should degrade gracefully when tools are absent.
 *
 * @param {Object} options
 * @param {string} options.model         - Ollama model tag (e.g. "qwen3.5:4b")
 * @param {Array}  options.messages      - OpenAI-format message array
 * @param {Function} options.onChunk     - Called with each text delta string
 * @param {number} options.temperature   - Temperature (default: 0.7)
 * @param {number} options.maxTokens     - Max tokens (default: 4096)
 * @returns {Promise<string>}            - Full assembled response
 */
const streamCompletion = async ({
  model = 'qwen3.5:4b',
  messages,
  onChunk,
  temperature = 0.7,
  maxTokens = 4096,
}) => {
  logger.info(`Ollama streaming: model=${model}, messages=${messages.length}`);

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  let response;
  const maxRetries = 2;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // Signal can be added here if we want a timeout
      });
      break; // Success
    } catch (err) {
      attempt++;
      logger.error(`[OllamaService] Fetch attempt ${attempt} failed: ${err.message}`);
      
      if (attempt >= maxRetries) {
        if (err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
          throw new OllamaConnectionError(
            `Ollama is not running at ${OLLAMA_BASE_URL}. Run: ollama serve`
          );
        }
        throw err;
      }
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${errBody}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE lines: each line is "data: <json>\n" or "data: [DONE]\n"
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete last line in buffer

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
      } catch {
        // Skip malformed JSON chunks
        logger.warn(`[OllamaService] Unparseable SSE chunk: ${data.slice(0, 100)}`);
      }
    }
  }

  logger.info(`Ollama complete: ${fullContent.length} chars`);
  return fullContent;
};

/**
 * Non-streaming call — useful for embedding or short utility calls.
 */
const callOllama = async ({ model, messages, systemPrompt }) => {
  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: fullMessages, stream: false }),
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
      throw new OllamaConnectionError(
        `Ollama is not running at ${OLLAMA_BASE_URL}. Run: ollama serve`
      );
    }
    throw err;
  }

  if (!response.ok) {
    throw new Error(`Ollama API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
};

/**
 * Health check — call this on server startup or before pipeline execution.
 * Returns { ok: boolean, models: string[] }
 */
const checkOllamaHealth = async () => {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, models: [] };
    const data = await res.json();
    const models = (data.models ?? []).map((m) => m.name);
    return { ok: true, models };
  } catch {
    return { ok: false, models: [] };
  }
};

class OllamaConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OllamaConnectionError';
    this.statusCode = 503;
  }
}

module.exports = { streamCompletion, callOllama, checkOllamaHealth, OllamaConnectionError };

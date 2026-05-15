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
  const fetchTimeout = 180000; // 3 minute timeout for streaming

  while (attempt < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

      response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      break; // Success
    } catch (err) {
      attempt++;
      const errorMsg = err.name === 'AbortError' 
        ? `timeout (${fetchTimeout}ms)` 
        : err.message;
      
      logger.error(`[OllamaService] Fetch attempt ${attempt} failed: ${errorMsg}`);
      
      if (attempt >= maxRetries) {
        if (err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
          throw new OllamaConnectionError(
            `Ollama is not running at ${OLLAMA_BASE_URL}. Run: ollama serve`
          );
        }
        if (err.name === 'AbortError') {
          throw new Error(
            `Ollama request timed out after ${fetchTimeout / 1000}s. Model may be stuck or server overloaded.`
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
  const chunkTimeout = 30000; // 30s timeout between chunks

  while (true) {
    try {
      // Add timeout for reading chunks
      const readPromise = reader.read();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stream chunk timeout - no data for 30s')), chunkTimeout)
      );
      
      const { done, value } = await Promise.race([readPromise, timeoutPromise]);
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines: each line is "data: <json>\n" or "data: [DONE]\n" or raw JSON
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete last line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let data = trimmed;
        
        // Handle SSE format (data: prefix)
        if (trimmed.startsWith('data: ')) {
          data = trimmed.slice(6);
        }
        // Handle raw JSON format (no data: prefix)
        else if (!trimmed.startsWith('{')) {
          continue;
        }

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
        } catch (err) {
          // Skip malformed JSON chunks - log only once per 100 chunks to avoid spam
          if (Math.random() < 0.01) {
            logger.warn(`[OllamaService] Unparseable chunk: ${data.slice(0, 100)}`);
          }
        }
      }
    } catch (err) {
      if (err.message.includes('Stream chunk timeout')) {
        logger.error(`[OllamaService] Stream stalled: ${err.message}`);
        throw err;
      }
      throw err;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: fullMessages, stream: false }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
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

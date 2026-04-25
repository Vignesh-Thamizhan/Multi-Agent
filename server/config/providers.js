const { checkOllamaHealth } = require('../services/ollamaService');
const logger = require('../utils/logger');

/**
 * Validate all configured LLM providers at startup.
 * Cloud providers: check env vars exist.
 * Ollama: active HTTP health check + model availability.
 *
 * @returns {Object} { groq: bool, openrouter: bool, gemini: bool, ollama: bool }
 */
const validateProviders = async () => {
  const results = {};

  // Cloud providers — just check env vars
  results.groq = !!process.env.GROQ_API_KEY;
  results.openrouter = !!process.env.OPENROUTER_API_KEY;
  results.gemini = !!process.env.GEMINI_API_KEY;

  if (results.groq) logger.info('[Providers] Groq ✓ (API key set)');
  else logger.warn('[Providers] Groq ✗ — GROQ_API_KEY not set');

  if (results.openrouter) logger.info('[Providers] OpenRouter ✓ (API key set)');
  else logger.warn('[Providers] OpenRouter ✗ — OPENROUTER_API_KEY not set');

  if (results.gemini) logger.info('[Providers] Gemini ✓ (API key set)');
  else logger.warn('[Providers] Gemini ✗ — GEMINI_API_KEY not set');

  // Ollama — active health check
  const ollamaHealth = await checkOllamaHealth();
  results.ollama = ollamaHealth.ok;

  if (ollamaHealth.ok) {
    logger.info(`[Providers] Ollama ✓ | Available models: ${ollamaHealth.models.join(', ') || '(none)'}`);

    // Warn if target model isn't pulled
    const targetModel = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
    if (!ollamaHealth.models.some((m) => m.startsWith(targetModel.split(':')[0]))) {
      logger.warn(
        `[Providers] Ollama is running but model "${targetModel}" is not pulled. ` +
        `Run: ollama pull ${targetModel}`
      );
    }
  } else {
    logger.warn('[Providers] Ollama ✗ — not reachable. Local mode will fail at runtime.');
  }

  return results;
};

module.exports = { validateProviders };

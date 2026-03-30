const logger = require('./logger');

/**
 * Exponential backoff with ±30% jitter
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Max number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Max delay in ms (default: 30000)
 * @param {string} options.label - Label for logging
 * @param {Function} options.onRetry - Callback on each retry (attempt, waitMs)
 */
const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    label = 'operation',
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logger.error(`${label}: All ${maxRetries + 1} attempts failed. Last error: ${error.message}`);
        throw error;
      }

      // Exponential backoff: baseDelay * 2^attempt
      let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Add ±30% jitter
      const jitter = delay * 0.3 * (Math.random() * 2 - 1);
      delay = Math.round(delay + jitter);

      logger.warn(`${label}: Attempt ${attempt + 1} failed (${error.message}). Retrying in ${delay}ms...`);

      if (onRetry) {
        onRetry(attempt + 1, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

module.exports = { retryWithBackoff };

const { getIO } = require('../config/socket');
const plannerAgent = require('../agents/plannerAgent');
const coderAgent = require('../agents/coderAgent');
const reviewerAgent = require('../agents/reviewerAgent');
const { retryWithBackoff } = require('../utils/retryHelper');
const sessionManager = require('../utils/sessionManager');
const logger = require('../utils/logger');

/**
 * Run the full agent pipeline: Planner → Coder → Reviewer
 * All progress is streamed via Socket.io to the user's private room.
 *
 * @param {Object} options
 * @param {string} options.userId - User ID for socket room
 * @param {string} options.sessionId - Session ID
 * @param {string} options.prompt - User's prompt
 * @param {Object} options.models - { planner, coder, reviewer } model names
 */
const runPipeline = async ({ userId, sessionId, prompt, models }) => {
  const io = getIO();
  const room = `user:${userId}`;
  const results = {};

  try {
    // Save the user prompt to session
    await sessionManager.addMessage(sessionId, {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    // Get context window
    const context = await sessionManager.getContextWindow(sessionId);

    // ── PLANNER AGENT ──────────────────────────────────────────
    const plannerModel = models.planner || 'llama-3.3-70b-versatile';
    io.to(room).emit('agent:start', { agent: 'planner', model: plannerModel });

    results.planner = await retryWithBackoff(
      () =>
        plannerAgent.run({
          prompt,
          context,
          model: plannerModel,
          onChunk: (chunk) => {
            io.to(room).emit('agent:chunk', { agent: 'planner', chunk });
          },
        }),
      {
        maxRetries: 2,
        baseDelay: 2000,
        label: 'PlannerAgent',
        onRetry: (attempt, waitMs) => {
          io.to(room).emit('agent:retry', {
            agent: 'planner',
            attempt,
            waitMs,
          });
        },
      }
    );

    io.to(room).emit('agent:complete', {
      agent: 'planner',
      content: results.planner,
    });

    // Save planner output
    await sessionManager.addMessage(sessionId, {
      role: 'assistant',
      agent: 'planner',
      content: results.planner,
      model: plannerModel,
      timestamp: new Date(),
    });

    // ── CODER AGENT ────────────────────────────────────────────
    const coderModel = models.coder || 'llama-3.3-70b-versatile';
    io.to(room).emit('agent:start', { agent: 'coder', model: coderModel });

    results.coder = await retryWithBackoff(
      () =>
        coderAgent.run({
          prompt,
          plan: results.planner,
          context,
          model: coderModel,
          onChunk: (chunk) => {
            io.to(room).emit('agent:chunk', { agent: 'coder', chunk });
          },
        }),
      {
        maxRetries: 2,
        baseDelay: 2000,
        label: 'CoderAgent',
        onRetry: (attempt, waitMs) => {
          io.to(room).emit('agent:retry', {
            agent: 'coder',
            attempt,
            waitMs,
          });
        },
      }
    );

    io.to(room).emit('agent:complete', {
      agent: 'coder',
      content: results.coder,
    });

    // Save coder output
    await sessionManager.addMessage(sessionId, {
      role: 'assistant',
      agent: 'coder',
      content: results.coder,
      model: coderModel,
      timestamp: new Date(),
    });

    // ── REVIEWER AGENT ─────────────────────────────────────────
    const reviewerModel = models.reviewer || 'anthropic/claude-4-haiku';
    io.to(room).emit('agent:start', {
      agent: 'reviewer',
      model: reviewerModel,
    });

    results.reviewer = await retryWithBackoff(
      () =>
        reviewerAgent.run({
          prompt,
          plan: results.planner,
          code: results.coder,
          context,
          model: reviewerModel,
          onChunk: (chunk) => {
            io.to(room).emit('agent:chunk', { agent: 'reviewer', chunk });
          },
        }),
      {
        maxRetries: 2,
        baseDelay: 2000,
        label: 'ReviewerAgent',
        onRetry: (attempt, waitMs) => {
          io.to(room).emit('agent:retry', {
            agent: 'reviewer',
            attempt,
            waitMs,
          });
        },
      }
    );

    io.to(room).emit('agent:complete', {
      agent: 'reviewer',
      content: results.reviewer,
    });

    // Save reviewer output
    await sessionManager.addMessage(sessionId, {
      role: 'assistant',
      agent: 'reviewer',
      content: results.reviewer,
      model: reviewerModel,
      timestamp: new Date(),
    });

    // ── PIPELINE COMPLETE ──────────────────────────────────────
    io.to(room).emit('pipeline:complete', { sessionId });
    logger.info(`Pipeline complete for session: ${sessionId}`);
  } catch (error) {
    logger.error(`Pipeline error: ${error.message}`);

    // Emit error with whatever partial results we have
    io.to(room).emit('pipeline:error', {
      error: error.message,
      partialResults: Object.keys(results),
    });

    // If any agent that errored, emit its specific error
    const failedAgent = !results.planner
      ? 'planner'
      : !results.coder
        ? 'coder'
        : 'reviewer';

    io.to(room).emit('agent:error', {
      agent: failedAgent,
      error: error.message,
    });
  }
};

module.exports = { runPipeline };

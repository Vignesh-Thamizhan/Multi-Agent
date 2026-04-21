const sessionManager = require('../utils/sessionManager');
const { runPipeline } = require('../services/agentOrchestrator');
const { sanitizeModelConfig } = require('../utils/modelValidator');
const Session = require('../models/Session');
const logger = require('../utils/logger');

/**
 * @route   POST /api/generate
 * @desc    Trigger the multi-agent pipeline (202 Accepted)
 */
const generate = async (req, res, next) => {
  try {
    const { prompt, sessionId, models, pipelineMode } = req.body;

    if (!prompt || !prompt.trim()) {
      res.status(400);
      throw new Error('Prompt is required');
    }

    const userId = req.user._id.toString();
    let session;

    if (sessionId) {
      // Use existing session
      session = await sessionManager.getSession(sessionId, userId);
    } else {
      // Create new session with truncated prompt as title
      const title = prompt.slice(0, 80) + (prompt.length > 80 ? '...' : '');
      session = await sessionManager.createSession(userId, title);
    }

    const resolvedMode = pipelineMode === 'parallel' ? 'parallel' : 'sequential';
    await Session.findByIdAndUpdate(session._id, { pipelineMode: resolvedMode });

    // Defense-in-depth: Sanitize models on server to prevent stale/invalid values
    const sanitizedModels = sanitizeModelConfig(models || req.user.modelPreferences || {});

    // Return 202 immediately — pipeline runs async
    res.status(202).json({
      message: 'Pipeline started',
      sessionId: session._id,
    });

    // Run pipeline asynchronously
    setImmediate(() => {
      runPipeline({
        userId,
        sessionId: session._id.toString(),
        prompt: prompt.trim(),
        models: sanitizedModels,
        pipelineMode: resolvedMode,
      }).catch((err) => {
        logger.error(`Pipeline failed for session ${session._id}: ${err.message}`);
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/generate/sessions
 * @desc    Get all sessions for the current user
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await sessionManager.getUserSessions(req.user._id);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/generate/sessions/:id
 * @desc    Get a specific session with full messages
 */
const getSession = async (req, res, next) => {
  try {
    const session = await sessionManager.getSession(
      req.params.id,
      req.user._id
    );
    res.json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/generate/sessions/:id
 * @desc    Delete a session
 */
const deleteSession = async (req, res, next) => {
  try {
    await sessionManager.deleteSession(req.params.id, req.user._id);
    res.json({ message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, getSessions, getSession, deleteSession };

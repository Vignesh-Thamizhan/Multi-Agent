const { getIO } = require('../config/socket');
const multimodalAgent = require('../agents/multimodalAgent');
const sessionManager = require('../utils/sessionManager');
const { retryWithBackoff } = require('../utils/retryHelper');
const logger = require('../utils/logger');

/**
 * @route   POST /api/upload
 * @desc    Upload a file for multimodal processing (202 Accepted)
 */
const upload = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const prompt = req.body.prompt || 'Analyze this file and provide insights.';
    const { sessionId } = req.body;
    const userId = req.user._id.toString();

    let session;

    if (sessionId) {
      session = await sessionManager.getSession(sessionId, userId);
    } else {
      const title = `📎 ${req.file.originalname}`;
      session = await sessionManager.createSession(userId, title);
    }

    // Return 202 immediately
    res.status(202).json({
      message: 'File processing started',
      sessionId: session._id,
      filename: req.file.originalname,
    });

    // Process file asynchronously
    setImmediate(async () => {
      const io = getIO();
      const room = `user:${userId}`;

      try {
        // Save user message
        await sessionManager.addMessage(session._id, {
          role: 'user',
          content: `[File Upload: ${req.file.originalname}] ${prompt}`,
          timestamp: new Date(),
        });

        io.to(room).emit('agent:start', {
          agent: 'multimodal',
          model: 'gemini-1.5-flash',
        });

        const result = await retryWithBackoff(
          () =>
            multimodalAgent.run({
              prompt,
              file: {
                buffer: req.file.buffer,
                mimeType: req.file.mimetype,
                originalname: req.file.originalname,
              },
              onChunk: (chunk) => {
                io.to(room).emit('agent:chunk', {
                  agent: 'multimodal',
                  chunk,
                });
              },
            }),
          {
            maxRetries: 2,
            baseDelay: 2000,
            label: 'MultimodalAgent',
            onRetry: (attempt, waitMs) => {
              io.to(room).emit('agent:retry', {
                agent: 'multimodal',
                attempt,
                waitMs,
              });
            },
          }
        );

        io.to(room).emit('agent:complete', {
          agent: 'multimodal',
          content: result,
        });

        // Save result
        await sessionManager.addMessage(session._id, {
          role: 'assistant',
          agent: 'multimodal',
          content: result,
          model: 'gemini-1.5-flash',
          timestamp: new Date(),
        });

        io.to(room).emit('pipeline:complete', { sessionId: session._id });
      } catch (error) {
        logger.error(`Multimodal processing failed: ${error.message}`);
        io.to(room).emit('agent:error', {
          agent: 'multimodal',
          error: error.message,
        });
        io.to(room).emit('pipeline:error', {
          error: error.message,
          partialResults: [],
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload };

const Session = require('../models/Session');
const logger = require('./logger');

const CONTEXT_WINDOW_SIZE = parseInt(process.env.CONTEXT_WINDOW_SIZE) || 10;

const sessionManager = {
  /**
   * Create a new session
   */
  async createSession(userId, title = 'New Session') {
    const session = await Session.create({
      userId,
      title,
      messages: [],
      status: 'active',
    });
    logger.info(`Session created: ${session._id} for user: ${userId}`);
    return session;
  },

  /**
   * Get session by ID (with ownership check)
   */
  async getSession(sessionId, userId) {
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  },

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId) {
    return Session.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title status createdAt updatedAt messages')
      .lean();
  },

  /**
   * Add a message to a session
   */
  async addMessage(sessionId, message) {
    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        $push: { messages: message },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );
    return session;
  },

  /**
   * Get context window (last N messages) for agent context
   */
  async getContextWindow(sessionId) {
    const session = await Session.findById(sessionId).lean();
    if (!session) return [];
    return session.messages.slice(-CONTEXT_WINDOW_SIZE);
  },

  /**
   * Update session title (auto-generate from first prompt)
   */
  async updateTitle(sessionId, title) {
    return Session.findByIdAndUpdate(sessionId, { title }, { new: true });
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId, userId) {
    const result = await Session.findOneAndDelete({ _id: sessionId, userId });
    if (!result) throw new Error('Session not found');
    logger.info(`Session deleted: ${sessionId}`);
    return result;
  },
};

module.exports = sessionManager;

const mongoose = require('mongoose');

const workspaceFileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    agent: {
      type: String,
      enum: ['planner', 'coder', 'reviewer', 'debugger', 'multimodal', 'system'],
      default: 'system',
    },
    auditLogs: {
      type: [
        {
          action: { type: String, enum: ['create', 'read', 'write', 'delete'], required: true },
          agent: { type: String, default: 'system' },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

workspaceFileSchema.index({ userId: 1, sessionId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceFile', workspaceFileSchema);

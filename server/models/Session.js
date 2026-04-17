const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    agent: {
      type: String,
      enum: ['planner', 'coder', 'reviewer', 'debugger', 'multimodal', null],
      default: null,
    },
    content: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Session',
      maxlength: 200,
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'error'],
      default: 'active',
    },
    pipelineMode: {
      type: String,
      enum: ['sequential', 'parallel'],
      default: 'sequential',
    },
  },
  { timestamps: true }
);

// Index for efficient user session queries
sessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);

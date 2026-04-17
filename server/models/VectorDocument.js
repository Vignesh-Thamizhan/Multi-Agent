const mongoose = require('mongoose');

const vectorDocumentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    file: {
      type: String,
      required: true,
      trim: true,
    },
    agent: {
      type: String,
      enum: ['planner', 'coder', 'reviewer', 'debugger', 'multimodal', 'system'],
      default: 'system',
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 8000,
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 768,
        message: 'Embedding must have 768 dimensions',
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

vectorDocumentSchema.index({ userId: 1, sessionId: 1, file: 1 });

module.exports = mongoose.model('VectorDocument', vectorDocumentSchema);

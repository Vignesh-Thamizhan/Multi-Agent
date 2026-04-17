const VectorDocument = require('../models/VectorDocument');
const { chunkText, generateEmbeddingsBatch, generateEmbedding } = require('./embeddingService');

const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
const cosineSimilarity = (a, b) => dot(a, b) / (norm(a) * norm(b) || 1);

const indexTextDocument = async ({ userId, sessionId, file, text, agent = 'system', metadata = {} }) => {
  const chunks = chunkText(text);
  if (!chunks.length) return 0;

  const embedded = await generateEmbeddingsBatch(chunks);
  const docs = embedded.map((item, idx) => ({
    userId,
    sessionId,
    file,
    agent,
    chunkIndex: idx,
    text: item.chunk,
    embedding: item.embedding,
    metadata,
  }));

  await VectorDocument.insertMany(docs, { ordered: false });
  return docs.length;
};

const searchSimilar = async ({ userId, sessionId, query, limit = 8, excludeSessionId }) => {
  const queryEmbedding = await generateEmbedding(query);
  const filter = { userId };

  if (sessionId) filter.sessionId = sessionId;
  if (excludeSessionId) filter.sessionId = { $ne: excludeSessionId };

  const docs = await VectorDocument.find(filter).lean();
  return docs
    .map((doc) => ({ ...doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const cleanupSessionVectors = async ({ userId, sessionId }) => {
  const result = await VectorDocument.deleteMany({ userId, sessionId });
  return result.deletedCount || 0;
};

module.exports = {
  indexTextDocument,
  searchSimilar,
  cleanupSessionVectors,
};

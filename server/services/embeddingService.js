const logger = require('../utils/logger');

// Use text-embedding-004 which is available on v1 API
// We bypass the SDK and use direct REST API calls to v1 endpoint
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;
const CHUNK_SIZE = 1200;
const OVERLAP_RATIO = 0.15;

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1';

const chunkText = (text, chunkSize = CHUNK_SIZE, overlapRatio = OVERLAP_RATIO) => {
  if (!text || !text.trim()) return [];
  const overlapSize = Math.floor(chunkSize * overlapRatio);
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
    start = end - overlapSize;
  }

  return chunks;
};

const generateEmbedding = async (text) => {
  if (!GOOGLE_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
    const url = `${GOOGLE_API_ENDPOINT}/models/${EMBEDDING_MODEL}:embedContent?key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Google API error (${response.status}): ${errorBody}`);
      throw new Error(`Google API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const embedding = data.embedding?.values || [];
    
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Unexpected embedding dimension ${embedding.length}, expected ${EMBEDDING_DIMENSION}`);
    }
    
    return embedding;
  } catch (error) {
    logger.error(`Embedding generation failed: ${error.message}`);
    throw error;
  }
};

const generateEmbeddingsBatch = async (chunks) => {
  const vectors = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    vectors.push({ chunk, embedding });
  }
  return vectors;
};

module.exports = {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
  chunkText,
  generateEmbedding,
  generateEmbeddingsBatch,
};

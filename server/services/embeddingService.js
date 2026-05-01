const logger = require('../utils/logger');

// Use gemini-embedding-001 which is the stable Google embedding model
// Available on v1beta API endpoint for embedContent
// gemini-embedding-001 returns 768 dimensions by default
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 768; // gemini-embedding-001 default output
const CHUNK_SIZE = 1200;
const OVERLAP_RATIO = 0.15;

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

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
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSION,
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

const { GoogleGenerativeAI } = require('@google/generative-ai');

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;
const CHUNK_SIZE = 1200;
const OVERLAP_RATIO = 0.15;

let genAI;

const getClient = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

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
  const model = getClient().getGenerativeModel({ model: EMBEDDING_MODEL });
  const response = await model.embedContent(text);
  const embedding = response.embedding?.values || [];
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(`Unexpected embedding dimension ${embedding.length}`);
  }
  return embedding;
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

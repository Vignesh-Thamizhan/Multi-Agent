const { searchSimilar, indexTextDocument } = require('./vectorStore');

const buildQueries = ({ prompt, codeSummary = '', intent = '' }) => {
  return [
    `Debug this issue: ${prompt}`,
    `Relevant code patterns for: ${codeSummary || prompt}`,
    `User intent and constraints: ${intent || prompt}`,
  ];
};

const retrieveDebugContext = async ({ userId, sessionId, prompt, codeSummary, intent }) => {
  const queries = buildQueries({ prompt, codeSummary, intent });
  const allHits = await Promise.all(
    queries.map((query) =>
      searchSimilar({
        userId,
        query,
        limit: 5,
        excludeSessionId: sessionId,
      })
    )
  );

  const unique = new Map();
  for (const list of allHits) {
    for (const hit of list) {
      const key = `${hit.file}:${hit.chunkIndex}`;
      if (!unique.has(key)) unique.set(key, hit);
    }
  }
  const contextChunks = [...unique.values()].slice(0, 12);
  return { queries, contextChunks };
};

const formatContext = (chunks) => {
  if (!chunks.length) return 'No similar context found.';
  return chunks
    .map(
      (chunk, idx) =>
        `#${idx + 1} [${chunk.file}] (score=${chunk.score.toFixed(3)})\n${chunk.text}`
    )
    .join('\n\n');
};

const asyncIndexAgentOutput = async ({ userId, sessionId, file, content, agent, metadata = {} }) => {
  if (!content || !content.trim()) return;
  setImmediate(async () => {
    try {
      await indexTextDocument({
        userId,
        sessionId,
        file,
        text: content,
        agent,
        metadata,
      });
    } catch (_) {
      // best-effort indexing should not break request flow
    }
  });
};

module.exports = {
  buildQueries,
  retrieveDebugContext,
  formatContext,
  asyncIndexAgentOutput,
};

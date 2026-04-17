const groqService = require('../services/groqService');
const { retrieveDebugContext, formatContext } = require('../services/ragService');

const SYSTEM_PROMPT = `You are the Debugger agent.
Analyze planner/coder/reviewer outputs with retrieved RAG context.
Return JSON with:
{
  "issues": [{"title":"", "severity":"critical|major|minor", "details":"", "fix":"", "file":""}],
  "actions": [{"type":"read|write|none", "reason":"", "filePath":""}],
  "summary":""
}`;

const run = async ({
  userId,
  sessionId,
  prompt,
  plannerOutput,
  coderOutput,
  reviewerOutput,
  executeTool,
  onChunk,
  onRagContext,
  onToolCall,
  model = 'llama-3.3-70b-versatile',
}) => {
  const { queries, contextChunks } = await retrieveDebugContext({
    userId,
    sessionId,
    prompt,
    codeSummary: coderOutput?.slice(0, 1200),
    intent: prompt,
  });

  onRagContext?.({ queries, count: contextChunks.length, chunks: contextChunks });
  const ragContext = formatContext(contextChunks);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        `User Prompt:\n${prompt}`,
        `Planner Output:\n${plannerOutput || 'N/A'}`,
        `Coder Output:\n${coderOutput || 'N/A'}`,
        `Reviewer Output:\n${reviewerOutput || 'N/A'}`,
        `RAG Context:\n${ragContext}`,
      ].join('\n\n'),
    },
  ];

  const result = await groqService.streamGroqWithTools({
    model,
    messages,
    executeTool,
    onToolCall,
    onChunk,
  });

  return { ...result, rag: { queries, contextChunks } };
};

module.exports = { run, name: 'debugger' };

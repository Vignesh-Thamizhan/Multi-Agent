const { getProvider, inferProviderFromModel } = require('../services/llmProviderFactory');
const { retrieveDebugContext, formatContext } = require('../services/ragService');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are the Debugger agent.
Analyze planner/coder/reviewer outputs with retrieved RAG context.
Return JSON with:
{
  "issues": [{"title":"", "severity":"critical|major|minor", "details":"", "fix":"", "file":""}],
  "actions": [{"type":"read|write|none", "reason":"", "filePath":""}],
  "summary":""
}`;

const SYSTEM_PROMPT_TEXT_ONLY = `You are the Debugger agent running in text-only mode (local model — no file tools available).
Analyze planner/coder/reviewer outputs with retrieved RAG context.
Since you cannot use file tools, provide your analysis as structured text.
Return JSON with:
{
  "issues": [{"title":"", "severity":"critical|major|minor", "details":"", "fix":"", "file":""}],
  "actions": [{"type":"none", "reason":"text-only mode"}],
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
  model = 'gemini-2.5-flash',
}) => {
  const providerName = inferProviderFromModel(model);
  const provider = getProvider(providerName);

  logger.info(`DebuggerAgent starting | model=${model} | provider=${providerName}`);

  // RAG retrieval — provider-agnostic
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
    { role: 'system', content: provider.supportsTools ? SYSTEM_PROMPT : SYSTEM_PROMPT_TEXT_ONLY },
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

  // Tool support degrades gracefully for providers that don't support them
  if (!provider.supportsTools || !provider.streamWithTools) {
    logger.warn(
      `[DebuggerAgent] Provider "${providerName}" does not support tools. ` +
      `Running in text-only debug mode. MCP file writes will be skipped.`
    );

    const content = await provider.streamCompletion({
      model,
      messages,
      onChunk,
      temperature: 0.3,
      maxTokens: 4096,
    });

    return { content, toolTrace: [], rag: { queries, contextChunks } };
  }

  // Full tool-supported path (Groq / Gemini)
  const result = await provider.streamWithTools({
    model,
    messages,
    executeTool,
    onToolCall,
    onChunk,
  });

  return { ...result, rag: { queries, contextChunks } };
};

module.exports = { run, name: 'debugger' };

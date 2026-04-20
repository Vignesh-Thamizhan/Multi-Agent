const { getIO } = require('../config/socket');
const plannerAgent = require('../agents/plannerAgent');
const coderAgent = require('../agents/coderAgent');
const reviewerAgent = require('../agents/reviewerAgent');
const debuggerAgent = require('../agents/debuggerAgent');
const sessionManager = require('../utils/sessionManager');
const {
  createFile,
  readFile,
  writeFile,
  listFiles,
  ensureSessionRoot,
} = require('./mcpFileService');
const { runParallelCoreAgents } = require('./parallelOrchestrator');
const { asyncIndexAgentOutput } = require('./ragService');
const logger = require('../utils/logger');

/**
 * Run the full agent pipeline: Planner → Coder → Reviewer
 * All progress is streamed via Socket.io to the user's private room.
 *
 * @param {Object} options
 * @param {string} options.userId - User ID for socket room
 * @param {string} options.sessionId - Session ID
 * @param {string} options.prompt - User's prompt
 * @param {Object} options.models - { planner, coder, reviewer } model names
 */
const runPipeline = async ({ userId, sessionId, prompt, models, pipelineMode = 'sequential' }) => {
  const io = getIO();
  const room = `user:${userId}`;
  const results = {};
  await ensureSessionRoot({ userId, sessionId });

  const emitStart = (agent, model) => io.to(room).emit('agent:start', { agent, model });
  const emitChunk = (agent, chunk) => io.to(room).emit('agent:chunk', { agent, chunk });
  const emitComplete = (agent, content) => io.to(room).emit('agent:complete', { agent, content });

  const executeTool = async (toolName, args = {}) => {
    switch (toolName) {
      case 'create_file':
        return createFile({ userId, sessionId, filePath: args.filePath, content: args.content, agent: 'debugger' });
      case 'read_file':
        return readFile({ userId, sessionId, filePath: args.filePath, agent: 'debugger' });
      case 'write_file':
        return writeFile({ userId, sessionId, filePath: args.filePath, content: args.content, agent: 'debugger' });
      case 'list_files':
        return listFiles({ userId, sessionId });
      default:
        throw new Error(`Unknown MCP tool: ${toolName}`);
    }
  };

  try {
    // Save the user prompt to session
    await sessionManager.addMessage(sessionId, {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    });

    // Get context window
    const context = await sessionManager.getContextWindow(sessionId);

    if (pipelineMode === 'parallel') {
      const parallelOutputs = await runParallelCoreAgents({
        prompt,
        context,
        models,
        emitStart,
        emitChunk,
        emitComplete,
      });
      Object.assign(results, Object.fromEntries(Object.entries(parallelOutputs).map(([k, v]) => [k, v.content])));
    } else {
      const plannerModel = models.planner || 'llama-3.3-70b-versatile';
      emitStart('planner', plannerModel);
      results.planner = await plannerAgent.run({ prompt, context, model: plannerModel, onChunk: (chunk) => emitChunk('planner', chunk) });
      emitComplete('planner', results.planner);

      const coderModel = models.coder || 'llama-3.3-70b-versatile';
      emitStart('coder', coderModel);
      const coderResult = await coderAgent.runWithTools({
        prompt,
        plan: results.planner,
        context,
        model: coderModel,
        executeTool,
        onToolCall: ({ toolName, args }) => io.to(room).emit('tool:call', { agent: 'coder', tool: toolName, args }),
        onChunk: (chunk) => emitChunk('coder', chunk),
      });
      results.coder = coderResult.content;
      emitComplete('coder', results.coder);

      const reviewerModel = models.reviewer || 'anthropic/claude-3.5-haiku';
      emitStart('reviewer', reviewerModel);
      results.reviewer = await reviewerAgent.run({
        prompt,
        plan: results.planner,
        code: results.coder,
        context,
        model: reviewerModel,
        onChunk: (chunk) => emitChunk('reviewer', chunk),
      });
      emitComplete('reviewer', results.reviewer);
    }

    for (const agent of ['planner', 'coder', 'reviewer']) {
      if (!results[agent]) continue;
      await sessionManager.addMessage(sessionId, {
        role: 'assistant',
        agent,
        content: results[agent],
        model: models[agent] || null,
        timestamp: new Date(),
      });
      await asyncIndexAgentOutput({
        userId,
        sessionId,
        file: `session/${agent}.md`,
        content: results[agent],
        agent,
      });
    }

    const debuggerModel = models.debugger || 'llama-3.3-70b-versatile';
    emitStart('debugger', debuggerModel);
    const debugResult = await debuggerAgent.run({
      userId,
      sessionId,
      prompt,
      plannerOutput: results.planner,
      coderOutput: results.coder,
      reviewerOutput: results.reviewer,
      model: debuggerModel,
      executeTool,
      onChunk: (chunk) => emitChunk('debugger', chunk),
      onToolCall: ({ toolName, args }) => io.to(room).emit('tool:call', { agent: 'debugger', tool: toolName, args }),
      onRagContext: ({ queries, count, chunks }) =>
        io.to(room).emit('rag:context', { agent: 'debugger', queries, count, chunks }),
    });
    results.debugger = debugResult.content;
    emitComplete('debugger', results.debugger);

    await sessionManager.addMessage(sessionId, {
      role: 'assistant',
      agent: 'debugger',
      content: results.debugger,
      model: debuggerModel,
      timestamp: new Date(),
    });

    // ── PIPELINE COMPLETE ──────────────────────────────────────
    io.to(room).emit('pipeline:complete', { sessionId });
    logger.info(`Pipeline complete for session: ${sessionId}`);
  } catch (error) {
    logger.error(`Pipeline error: ${error.message}`);

    // Emit error with whatever partial results we have
    io.to(room).emit('pipeline:error', {
      error: error.message,
      partialResults: Object.keys(results),
    });

    // If any agent that errored, emit its specific error
    const failedAgent = !results.planner
      ? 'planner'
      : !results.coder
        ? 'coder'
        : !results.reviewer
          ? 'reviewer'
          : 'debugger';

    io.to(room).emit('agent:error', {
      agent: failedAgent,
      error: error.message,
    });
  }
};

module.exports = { runPipeline };

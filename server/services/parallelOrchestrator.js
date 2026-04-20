const plannerAgent = require('../agents/plannerAgent');
const coderAgent = require('../agents/coderAgent');
const reviewerAgent = require('../agents/reviewerAgent');

const runParallelCoreAgents = async ({ prompt, context, models, emitStart, emitChunk, emitComplete }) => {
  const specs = [
    {
      id: 'planner',
      model: models.planner || 'llama-3.3-70b-versatile',
      run: () =>
        plannerAgent.run({
          prompt,
          context,
          model: models.planner || 'llama-3.3-70b-versatile',
          onChunk: (chunk) => emitChunk('planner', chunk),
        }),
    },
    {
      id: 'coder',
      model: models.coder || 'llama-3.3-70b-versatile',
      run: () =>
        coderAgent.run({
          prompt,
          plan: 'Run with best effort plan based on prompt.',
          context,
          model: models.coder || 'llama-3.3-70b-versatile',
          onChunk: (chunk) => emitChunk('coder', chunk),
        }),
    },
    {
      id: 'reviewer',
      model: models.reviewer || 'anthropic/claude-3.5-haiku',
      run: () =>
        reviewerAgent.run({
          prompt,
          plan: 'Parallel mode: planner output may arrive after this review.',
          code: 'Parallel mode: coder output may be partial.',
          context,
          model: models.reviewer || 'anthropic/claude-3.5-haiku',
          onChunk: (chunk) => emitChunk('reviewer', chunk),
        }),
    },
  ];

  const tasks = specs.map(async (spec) => {
    emitStart(spec.id, spec.model);
    const content = await spec.run();
    emitComplete(spec.id, content);
    return { agent: spec.id, content, model: spec.model };
  });

  const settled = await Promise.allSettled(tasks);
  return settled.reduce((acc, item) => {
    if (item.status === 'fulfilled') {
      acc[item.value.agent] = item.value;
    }
    return acc;
  }, {});
};

module.exports = { runParallelCoreAgents };

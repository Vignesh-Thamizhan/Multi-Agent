import { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import AgentCard from './AgentCard';
import MarkdownRenderer from './MarkdownRenderer';
import usePipelineStore from '../store/pipelineStore';
import useAutoScroll from '../hooks/useAutoScroll';
import { AGENTS, PIPELINE_ORDER, PIPELINE_STATUSES, AGENT_STATUSES } from '../utils/agentConfig';
import { User, Bot } from 'lucide-react';

const TimelineFeed = () => {
  const agents = usePipelineStore((s) => s.agents);
  const pipelineStatus = usePipelineStore((s) => s.pipelineStatus);
  const sessionMessages = usePipelineStore((s) => s.sessionMessages);

  // Build scroll dependency from all streaming content
  const scrollDep = useMemo(() => {
    return Object.values(agents).reduce((acc, a) => acc + a.content.length, 0);
  }, [agents]);

  const { containerRef } = useAutoScroll(scrollDep);

  // Determine which agent cards to show (only agents that have started)
  const activeAgents = useMemo(() => {
    const allAgents = [...PIPELINE_ORDER, 'multimodal'];
    return allAgents.filter(
      (id) => agents[id].status !== AGENT_STATUSES.IDLE
    );
  }, [agents]);

  const hasHistory = sessionMessages.length > 0;
  const hasActiveAgents = activeAgents.length > 0;
  const isIdle = pipelineStatus === PIPELINE_STATUSES.IDLE && !hasHistory && !hasActiveAgents;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Empty state */}
        {isIdle && (
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-500/20 flex items-center justify-center">
                <span className="text-4xl">🧠</span>
              </div>
              <Motion.div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              NeuralForge Pipeline
            </h2>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              Describe what you want to build. The Planner will architect a solution,
              the Coder will implement it, and the Reviewer will ensure quality.
            </p>
            <div className="flex items-center gap-6 mt-8">
              {PIPELINE_ORDER.map((id, i) => {
                const cfg = AGENTS[id];
                return (
                  <div key={id} className="flex items-center gap-3">
                    {i > 0 && (
                      <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          background: `linear-gradient(135deg, ${cfg.gradientFrom}30, ${cfg.gradientTo}30)`,
                          border: `1px solid ${cfg.borderColor}`,
                        }}
                      >
                        {cfg.icon}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Motion.div>
        )}

        {/* Session history messages */}
        {hasHistory && (
          <div className="space-y-3 mb-6">
            {sessionMessages.map((msg, i) => (
              <Motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {msg.role === 'user' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-white" />
                    </div>
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 max-w-2xl">
                      <p className="text-sm text-gray-300">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                      style={{
                        background: msg.agent
                          ? `linear-gradient(135deg, ${AGENTS[msg.agent]?.gradientFrom}, ${AGENTS[msg.agent]?.gradientTo})`
                          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      }}
                    >
                      {msg.agent ? AGENTS[msg.agent]?.icon : <Bot size={14} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {msg.agent && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                          {AGENTS[msg.agent]?.label || msg.agent}
                          {msg.model && ` · ${msg.model}`}
                        </span>
                      )}
                      <div className="mt-1">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  </div>
                )}
              </Motion.div>
            ))}
          </div>
        )}

        {/* Live agent cards */}
        {hasActiveAgents && (
          <div className="space-y-4">
            {activeAgents.map((id) => (
              <AgentCard key={id} agentId={id} agentState={agents[id]} />
            ))}
          </div>
        )}

        {/* Pipeline complete indicator */}
        {pipelineStatus === PIPELINE_STATUSES.COMPLETE && hasActiveAgents && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 py-4 text-emerald-400"
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <span className="text-xs font-medium">Pipeline complete</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-500/30" />
          </Motion.div>
        )}
      </div>
    </div>
  );
};

export default TimelineFeed;

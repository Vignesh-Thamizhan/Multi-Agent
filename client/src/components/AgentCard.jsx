import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AGENTS, AGENT_STATUSES } from '../utils/agentConfig';
import usePipelineStore from '../store/pipelineStore';
import MarkdownRenderer from './MarkdownRenderer';
import { Loader2, CheckCircle2, XCircle, RotateCw } from 'lucide-react';

const StatusIndicator = ({ status }) => {
  switch (status) {
    case AGENT_STATUSES.STREAMING:
      return <Loader2 size={16} className="animate-spin text-blue-400" />;
    case AGENT_STATUSES.COMPLETE:
      return <CheckCircle2 size={16} className="text-emerald-400" />;
    case AGENT_STATUSES.ERROR:
      return <XCircle size={16} className="text-red-400" />;
    case AGENT_STATUSES.RETRYING:
      return <RotateCw size={16} className="animate-spin text-amber-400" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-white/10" />;
  }
};

const AgentCard = ({ agentId, agentState }) => {
  const config = AGENTS[agentId];
  const pipelineMode = usePipelineStore((s) => s.pipelineMode);
  if (!config) return null;

  const { status, content, model, error, retryAttempt } = agentState;
  const isActive = status === AGENT_STATUSES.STREAMING;
  const hasContent = content && content.length > 0;
  
  // In local mode, show Ollama provider; otherwise show the agent's default provider
  const displayProvider = pipelineMode === 'local' ? 'Ollama' : config.provider;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative"
    >
      <div
        className="rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300"
        style={{
          borderColor: isActive ? config.borderColor : 'rgba(255,255,255,0.06)',
          background: `linear-gradient(135deg, ${config.bgColor}, rgba(0,0,0,0.3))`,
          boxShadow: isActive ? `0 0 30px ${config.bgColor}` : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{
                background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
              }}
            >
              {config.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {config.label}
                <StatusIndicator status={status} />
              </h3>
              <p className="text-xs text-gray-500">
                {model || config.defaultModel}
                {status === AGENT_STATUSES.RETRYING && (
                  <span className="ml-2 text-amber-400">Retry #{retryAttempt}</span>
                )}
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              color: config.color,
              background: config.bgColor,
            }}
          >
            {displayProvider}
          </span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {hasContent && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 py-3 max-h-[600px] overflow-y-auto custom-scrollbar"
            >
              <MarkdownRenderer content={content} />
              {isActive && (
                <Motion.span
                  className="inline-block w-2 h-4 ml-1 rounded-sm"
                  style={{ backgroundColor: config.color }}
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </Motion.div>
          )}

          {status === AGENT_STATUSES.ERROR && error && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-3"
            >
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </Motion.div>
  );
};

export default AgentCard;

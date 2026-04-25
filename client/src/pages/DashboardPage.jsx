import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import usePipelineStore from '../store/pipelineStore';
import { AGENTS } from '../utils/agentConfig';
import toast from 'react-hot-toast';
import {
  Zap, LogOut, ArrowRight, Cpu, ChevronDown, CheckCircle2,
  GitBranch, Layers, Wifi, WifiOff, Settings, Sparkles, Monitor,
} from 'lucide-react';

/* ── Pipeline flow visualizations ────────────────────────────── */

const SequentialFlow = ({ isActive }) => {
  const agents = ['planner', 'coder', 'reviewer', 'debugger'];
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 flex-wrap">
      {agents.map((id, i) => {
        const cfg = AGENTS[id];
        return (
          <div key={id} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <Motion.div
                className="flex items-center"
                animate={isActive ? { opacity: [0.3, 1, 0.3] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              >
                <div className="w-4 sm:w-6 h-px bg-gradient-to-r from-white/20 to-white/10" />
                <ArrowRight size={10} className="text-white/30 -ml-1" />
              </Motion.div>
            )}
            <Motion.div
              className="flex flex-col items-center gap-1"
              whileHover={{ scale: 1.1 }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}30, ${cfg.gradientTo}30)`,
                  border: `1px solid ${cfg.borderColor}`,
                }}
              >
                {cfg.icon}
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">{cfg.label}</span>
            </Motion.div>
          </div>
        );
      })}
    </div>
  );
};

const ParallelFlow = ({ isActive }) => {
  const parallel = ['planner', 'coder', 'reviewer'];
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Parallel group */}
      <div className="flex items-center gap-2 sm:gap-4">
        {parallel.map((id) => {
          const cfg = AGENTS[id];
          return (
            <Motion.div
              key={id}
              className="flex flex-col items-center gap-1"
              whileHover={{ scale: 1.1 }}
              animate={isActive ? { y: [0, -3, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: parallel.indexOf(id) * 0.2 }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}30, ${cfg.gradientTo}30)`,
                  border: `1px solid ${cfg.borderColor}`,
                }}
              >
                {cfg.icon}
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">{cfg.label}</span>
            </Motion.div>
          );
        })}
      </div>

      {/* Converging lines */}
      <div className="flex items-center gap-1">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/20" />
        <Motion.div
          animate={isActive ? { opacity: [0.3, 1, 0.3] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight size={12} className="text-white/30 rotate-90" />
        </Motion.div>
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/20" />
      </div>

      {/* Debugger */}
      <Motion.div
        className="flex flex-col items-center gap-1"
        whileHover={{ scale: 1.1 }}
      >
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base"
          style={{
            background: `linear-gradient(135deg, ${AGENTS.debugger.gradientFrom}30, ${AGENTS.debugger.gradientTo}30)`,
            border: `1px solid ${AGENTS.debugger.borderColor}`,
          }}
        >
          {AGENTS.debugger.icon}
        </div>
        <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Debugger</span>
      </Motion.div>
    </div>
  );
};

const LocalFlow = ({ isActive }) => {
  const agents = ['planner', 'coder', 'reviewer', 'debugger'];
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Ollama hub */}
      <Motion.div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10"
        animate={isActive ? { boxShadow: ['0 0 10px rgba(16,185,129,0.1)', '0 0 20px rgba(16,185,129,0.25)', '0 0 10px rgba(16,185,129,0.1)'] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Monitor size={14} className="text-emerald-400" />
        <span className="text-[10px] font-mono text-emerald-300 font-semibold">qwen3.5:4b</span>
      </Motion.div>

      {/* Fanning lines */}
      <div className="flex items-center gap-1">
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500/30" />
        <Motion.div
          animate={isActive ? { opacity: [0.3, 1, 0.3] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight size={12} className="text-emerald-500/40 rotate-90" />
        </Motion.div>
        <div className="w-8 h-px bg-gradient-to-l from-transparent to-emerald-500/30" />
      </div>

      {/* All four agents */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        {agents.map((id, i) => {
          const cfg = AGENTS[id];
          return (
            <Motion.div
              key={id}
              className="flex flex-col items-center gap-1"
              whileHover={{ scale: 1.1 }}
              animate={isActive ? { y: [0, -2, 0] } : {}}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}30, ${cfg.gradientTo}30)`,
                  border: `1px solid ${cfg.borderColor}`,
                }}
              >
                {cfg.icon}
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-500 font-medium">{cfg.label}</span>
            </Motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Agent Model Card ────────────────────────────────────────── */

const AgentModelCard = ({ agentId, currentModel, onModelChange }) => {
  const [open, setOpen] = useState(false);
  const config = AGENTS[agentId];
  if (!config) return null;

  const selected = config.models.find((m) => m.id === currentModel) ||
    config.models.find((m) => m.id === config.defaultModel) ||
    config.models[0];

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
      style={{ zIndex: open ? 50 : 1 }}
    >
      <div
        className="rounded-xl border backdrop-blur-sm p-4 transition-all duration-300 hover:border-white/15"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: `linear-gradient(135deg, ${config.bgColor}, rgba(0,0,0,0.3))`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
            }}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">{config.label}</h3>
            <p className="text-xs text-gray-500 truncate">{config.description}</p>
          </div>
          <span
            className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: config.color, background: config.bgColor }}
          >
            {config.provider}
          </span>
        </div>

        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Cpu size={12} style={{ color: config.color }} />
              <span className="text-xs text-gray-300 font-medium truncate">{selected.label}</span>
            </div>
            <ChevronDown
              size={12}
              className={`text-gray-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOpen(false)}
                />
                <Motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-white/10 shadow-2xl overflow-hidden"
                  style={{ background: '#1a1a2e' }}
                >
                  {config.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(agentId, model.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                        model.id === selected.id
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                    >
                      <Cpu size={10} style={{ color: config.color }} />
                      {model.label}
                      {model.id === config.defaultModel && (
                        <span className="ml-auto text-[9px] text-gray-600">default</span>
                      )}
                    </button>
                  ))}
                </Motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Motion.div>
  );
};

/* ── Dashboard Page ──────────────────────────────────────────── */

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateModelPreferences = useAuthStore((s) => s.updateModelPreferences);

  const pipelineMode = usePipelineStore((s) => s.pipelineMode);
  const setPipelineMode = usePipelineStore((s) => s.setPipelineMode);

  const [models, setModels] = useState({
    planner: user?.modelPreferences?.planner || AGENTS.planner.defaultModel,
    coder: user?.modelPreferences?.coder || AGENTS.coder.defaultModel,
    reviewer: user?.modelPreferences?.reviewer || AGENTS.reviewer.defaultModel,
    debugger: user?.modelPreferences?.debugger || AGENTS.debugger?.defaultModel,
  });

  const handleModelChange = (agentId, modelId) => {
    const updated = { ...models, [agentId]: modelId };
    setModels(updated);
    updateModelPreferences(updated);
    toast.success(`${AGENTS[agentId].label} model updated`);
  };

  const handleModeSelect = (mode) => {
    setPipelineMode(mode);
    toast.success(`Switched to ${mode} mode`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartBuilding = () => {
    navigate('/chat');
  };

  const initials = useMemo(() => {
    return user?.username?.slice(0, 2).toUpperCase() || '??';
  }, [user]);

  return (
    <div className="min-h-dvh bg-[#0a0a14] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-600/[0.03] blur-[120px]" />
      </div>

      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Neural<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Forge</span>
            </h1>
            <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider hidden sm:inline">
              Dashboard
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Profile Header ───────────────────────────────── */}
        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10"
        >
          {/* Avatar */}
          <Motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.05, rotate: 2 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(139,92,246,0.15)',
                '0 0 40px rgba(139,92,246,0.25)',
                '0 0 20px rgba(139,92,246,0.15)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
          </Motion.div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{user?.username}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Sparkles size={10} />
                Pro User
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 sm:gap-6 mt-2 sm:mt-0">
            <div className="text-center">
              <p className="text-lg font-bold text-white">
                {pipelineMode === 'local' ? '🖥' : pipelineMode === 'parallel' ? '⚡' : '🔄'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                MODE: <span className="font-bold text-white">
                  {pipelineMode === 'local' ? 'LOCAL' : pipelineMode === 'parallel' ? 'PARALLEL' : 'SEQUENTIAL'}
                </span>
              </p>
              {pipelineMode === 'local' && (
                <p className="text-[9px] text-emerald-400 font-mono mt-1">qwen3.5:4b</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">4</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Agents</p>
            </div>
          </div>
        </Motion.section>

        {/* ── Pipeline Mode Switcher ──────────────────────── */}
        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Pipeline Mode</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sequential Card */}
            <Motion.button
              onClick={() => handleModeSelect('sequential')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                pipelineMode === 'sequential'
                  ? 'border-violet-500/40 bg-violet-500/[0.06]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
              }`}
            >
              {pipelineMode === 'sequential' && (
                <Motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      'inset 0 0 30px rgba(139,92,246,0.05)',
                      'inset 0 0 50px rgba(139,92,246,0.1)',
                      'inset 0 0 30px rgba(139,92,246,0.05)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-violet-400" />
                    <h4 className="text-sm font-semibold text-white">Sequential</h4>
                  </div>
                  {pipelineMode === 'sequential' && (
                    <Motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
                    >
                      <CheckCircle2 size={12} className="text-white" />
                    </Motion.div>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Step-by-step execution. Each agent depends on the previous output. More stable and deterministic.
                </p>
                <SequentialFlow isActive={pipelineMode === 'sequential'} />
              </div>
            </Motion.button>

            {/* Parallel Card */}
            <Motion.button
              onClick={() => handleModeSelect('parallel')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                pipelineMode === 'parallel'
                  ? 'border-cyan-500/40 bg-cyan-500/[0.06]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
              }`}
            >
              {pipelineMode === 'parallel' && (
                <Motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      'inset 0 0 30px rgba(6,182,212,0.05)',
                      'inset 0 0 50px rgba(6,182,212,0.1)',
                      'inset 0 0 30px rgba(6,182,212,0.05)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">Parallel</h4>
                  </div>
                  {pipelineMode === 'parallel' && (
                    <Motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"
                    >
                      <CheckCircle2 size={12} className="text-white" />
                    </Motion.div>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Concurrent execution with Promise.allSettled. Faster results with partial-failure safety.
                </p>
                <ParallelFlow isActive={pipelineMode === 'parallel'} />
              </div>
            </Motion.button>

            {/* Local (Ollama) Card */}
            <Motion.button
              onClick={() => handleModeSelect('local')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                pipelineMode === 'local'
                  ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
              }`}
            >
              {pipelineMode === 'local' && (
                <Motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      'inset 0 0 30px rgba(16,185,129,0.05)',
                      'inset 0 0 50px rgba(16,185,129,0.1)',
                      'inset 0 0 30px rgba(16,185,129,0.05)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-emerald-400" />
                    <h4 className="text-sm font-semibold text-white">Local (Ollama)</h4>
                  </div>
                  {pipelineMode === 'local' && (
                    <Motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <CheckCircle2 size={12} className="text-white" />
                    </Motion.div>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-1">
                  Fully local, private inference via Ollama. All agents use <span className="text-emerald-400 font-mono">qwen3.5:4b</span>. No API keys needed.
                </p>
                <p className="text-[10px] text-amber-400/70 mb-2">
                  ⚠ Debugger runs in text-only mode (no file tools)
                </p>
                <LocalFlow isActive={pipelineMode === 'local'} />
              </div>
            </Motion.button>
          </div>
        </Motion.section>

        {/* ── Agent Configuration (hidden in local mode — models auto-set) ── */}
        {pipelineMode !== 'local' && (
        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Agent Models</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['planner', 'coder', 'reviewer', 'debugger'].map((id, i) => (
              <Motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <AgentModelCard
                  agentId={id}
                  currentModel={models[id]}
                  onModelChange={handleModelChange}
                />
              </Motion.div>
            ))}
          </div>
        </Motion.section>
        )}

        {/* ── Start Building CTA ──────────────────────────── */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center pt-4 pb-8"
        >
          <Motion.button
            onClick={handleStartBuilding}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow cursor-pointer"
          >
            <Zap size={18} />
            Start Building
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Motion.button>
        </Motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;

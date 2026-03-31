import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../utils/agentConfig';
import useAuthStore from '../store/authStore';
import { ChevronDown, Cpu } from 'lucide-react';

const ModelSelector = ({ agentId, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const config = AGENTS[agentId];
  if (!config) return null;

  const selected = config.models.find((m) => m.id === value) ||
    config.models.find((m) => m.id === config.defaultModel) ||
    config.models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
        style={{ color: config.color }}
      >
        <span className="text-sm">{config.icon}</span>
        <span className="text-gray-300 font-medium">{selected.label}</span>
        <ChevronDown
          size={12}
          className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
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
              className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  {config.label} · {config.provider}
                </p>
              </div>
              {config.models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onChange(agentId, model.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                    model.id === selected.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <Cpu size={12} style={{ color: config.color }} />
                  {model.label}
                  {model.id === config.defaultModel && (
                    <span className="ml-auto text-[10px] text-gray-600">default</span>
                  )}
                </button>
              ))}
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wrapper component showing all three agent model selectors
export const ModelSelectorBar = () => {
  const user = useAuthStore((s) => s.user);
  const updateModelPreferences = useAuthStore((s) => s.updateModelPreferences);
  const [models, setModels] = useState({
    planner: user?.modelPreferences?.planner || AGENTS.planner.defaultModel,
    coder: user?.modelPreferences?.coder || AGENTS.coder.defaultModel,
    reviewer: user?.modelPreferences?.reviewer || AGENTS.reviewer.defaultModel,
  });

  const handleChange = (agentId, modelId) => {
    const updated = { ...models, [agentId]: modelId };
    setModels(updated);
    updateModelPreferences(updated);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {['planner', 'coder', 'reviewer'].map((id) => (
        <ModelSelector
          key={id}
          agentId={id}
          value={models[id]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
};

export default ModelSelector;

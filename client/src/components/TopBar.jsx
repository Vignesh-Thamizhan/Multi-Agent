import { motion as Motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import usePipelineStore from '../store/pipelineStore';
import { ModelSelectorBar } from './ModelSelector';
import { PIPELINE_STATUSES, AGENTS, PIPELINE_ORDER } from '../utils/agentConfig';
import {
  LogOut, Wifi, WifiOff, Zap, CheckCircle2, AlertCircle, Loader2, Menu, X
} from 'lucide-react';

const TopBar = ({ socketConnected, onToggleSidebar, isSidebarOpen }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pipelineStatus = usePipelineStore((s) => s.pipelineStatus);
  const agents = usePipelineStore((s) => s.agents);

  const getActiveAgent = () => {
    return PIPELINE_ORDER.find((id) => agents[id].status === 'streaming') || null;
  };

  const activeAgent = getActiveAgent();

  const statusConfig = {
    [PIPELINE_STATUSES.IDLE]: {
      label: 'Ready',
      icon: <Zap size={14} />,
      color: 'text-gray-500',
      bg: 'bg-gray-500/10',
    },
    [PIPELINE_STATUSES.RUNNING]: {
      label: activeAgent ? `${AGENTS[activeAgent]?.label} running...` : 'Processing...',
      icon: <Loader2 size={14} className="animate-spin" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    [PIPELINE_STATUSES.COMPLETE]: {
      label: 'Complete',
      icon: <CheckCircle2 size={14} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    [PIPELINE_STATUSES.ERROR]: {
      label: 'Error',
      icon: <AlertCircle size={14} />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const status = statusConfig[pipelineStatus] || statusConfig[PIPELINE_STATUSES.IDLE];

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-xl z-20">
      {/* Left: logo + status */}
      <div className="flex items-center gap-4">
        {/* Mobile: sidebar toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <h1 className="text-sm font-bold text-white tracking-tight hidden sm:block">
            Neural<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Forge</span>
          </h1>
        </div>

        {/* Pipeline status badge */}
        <Motion.div
          key={pipelineStatus}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}
        >
          {status.icon}
          <span className="hidden sm:inline">{status.label}</span>
        </Motion.div>
      </div>

      {/* Center: model selectors */}
      <div className="hidden md:flex">
        <ModelSelectorBar />
      </div>

      {/* Right: connection + user */}
      <div className="flex items-center gap-3">
        {/* Connection indicator */}
        <div
          className={`flex items-center gap-1 text-xs ${
            socketConnected ? 'text-emerald-400' : 'text-red-400'
          }`}
          title={socketConnected ? 'Connected' : 'Disconnected'}
        >
          {socketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">
            {socketConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white uppercase">
              {user?.username?.charAt(0) || '?'}
            </span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">
            {user?.username}
          </span>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

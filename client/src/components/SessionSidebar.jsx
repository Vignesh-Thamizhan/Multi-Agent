import { useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { generateAPI } from '../services/api';
import usePipelineStore from '../store/pipelineStore';
import {
  MessageSquare, Plus, Trash2, Clock, ChevronLeft, ChevronRight,
  Loader2, Search
} from 'lucide-react';

const SessionSidebar = ({ onLoadSession, currentSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const resetPipeline = usePipelineStore((s) => s.resetPipeline);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await generateAPI.getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewSession = () => {
    resetPipeline();
    onLoadSession(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await generateAPI.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (currentSessionId === id) handleNewSession();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleLoadSession = async (session) => {
    try {
      const { data } = await generateAPI.getSession(session._id);
      onLoadSession(data);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Motion.aside
      animate={{ width: collapsed ? 56 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-[#0d0d1a]/80 border-r border-white/5 overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 min-h-[56px]">
        {!collapsed && (
          <Motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold text-gray-300"
          >
            Sessions
          </Motion.span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:inline-flex p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* New session button */}
          <div className="p-3">
            <button
              onClick={handleNewSession}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 hover:from-violet-600/30 hover:to-cyan-600/30 border border-violet-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              New Session
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/5 text-gray-300 placeholder:text-gray-600 outline-none focus:border-white/20 transition-colors"
                id="session-search"
              />
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-500" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={24} className="mx-auto text-gray-700 mb-2" />
                <p className="text-xs text-gray-600">
                  {search ? 'No sessions found' : 'No sessions yet'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredSessions.map((session) => (
                  <Motion.button
                    key={session._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => handleLoadSession(session)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 group transition-all cursor-pointer ${
                      currentSessionId === session._id
                        ? 'bg-white/10 border border-white/10'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-300 truncate flex-1 leading-snug">
                        {session.title || 'Untitled'}
                      </p>
                      <button
                        onClick={(e) => handleDelete(e, session._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600">
                        {formatDate(session.updatedAt)}
                      </span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : session.status === 'error'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </Motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* Collapsed: just icons */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 pt-3">
          <button
            onClick={handleNewSession}
            className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-white/5 transition-colors cursor-pointer"
            title="New Session"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={fetchSessions}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
            title="Refresh sessions"
          >
            <MessageSquare size={18} />
          </button>
        </div>
      )}
    </Motion.aside>
  );
};

export default SessionSidebar;

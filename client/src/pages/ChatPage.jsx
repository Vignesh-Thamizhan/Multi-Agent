import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import TopBar from '../components/TopBar';
import SessionSidebar from '../components/SessionSidebar';
import TimelineFeed from '../components/TimelineFeed';
import PromptInput from '../components/PromptInput';
import ToolCallBadge from '../components/ToolCallBadge';
import RagContextBadge from '../components/RagContextBadge';
import FileExplorer from '../components/FileExplorer';
import useSocket from '../hooks/useSocket';
import usePipelineStore from '../store/pipelineStore';
import useAuthStore from '../store/authStore';
import useWorkspaceStore from '../store/workspaceStore';
import { generateAPI, uploadAPI } from '../services/api';
import { sanitizeModelConfig } from '../utils/modelValidator';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { isConnected, stopPipeline } = useSocket();
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarPanelRef = useRef(null);
  const sidebarBackdropRef = useRef(null);

  const startPipeline = usePipelineStore((s) => s.startPipeline);
  const setSessionMessages = usePipelineStore((s) => s.setSessionMessages);
  const resetPipeline = usePipelineStore((s) => s.resetPipeline);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const pipelineStatus = usePipelineStore((s) => s.pipelineStatus);
  const pipelineMode = usePipelineStore((s) => s.pipelineMode);
  const user = useAuthStore((s) => s.user);
  const toolCalls = useWorkspaceStore((s) => s.toolCalls);
  const ragContexts = useWorkspaceStore((s) => s.ragContexts);
  const fetchFiles = useWorkspaceStore((s) => s.fetchFiles);
  const resetWorkspaceState = useWorkspaceStore((s) => s.resetWorkspaceState);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    const backdrop = sidebarBackdropRef.current;
    if (!panel || !backdrop) return;

    if (prefersReducedMotion) {
      gsap.set(panel, { x: mobileSidebarOpen ? 0 : -320 });
      gsap.set(backdrop, {
        opacity: mobileSidebarOpen ? 1 : 0,
        pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
      });
      return;
    }

    if (mobileSidebarOpen) {
      gsap.set(backdrop, { pointerEvents: 'auto' });
      gsap.to(backdrop, { opacity: 1, duration: 0.18, ease: 'power1.out' });
      gsap.to(panel, { x: 0, duration: 0.28, ease: 'power3.out' });
    } else {
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.18,
        ease: 'power1.in',
        onComplete: () => gsap.set(backdrop, { pointerEvents: 'none' }),
      });
      gsap.to(panel, { x: -320, duration: 0.22, ease: 'power2.in' });
    }
  }, [mobileSidebarOpen, prefersReducedMotion]);

  const handleSubmit = useCallback(async (prompt) => {
    try {
      const sanitizedModels = sanitizeModelConfig(user?.modelPreferences || {});
      const { data } = await generateAPI.trigger({
        prompt,
        sessionId: currentSessionId,
        models: sanitizedModels,
        pipelineMode: pipelineMode,
      });

      setCurrentSessionId(data.sessionId);
      startPipeline(data.sessionId);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(msg);
    }
  }, [currentSessionId, user, startPipeline, pipelineMode]);

  const handleFileUpload = useCallback(async (prompt, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);
      if (currentSessionId) formData.append('sessionId', currentSessionId);

      const { data } = await uploadAPI.upload(formData);
      setCurrentSessionId(data.sessionId);
      startPipeline(data.sessionId);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(msg);
    }
  }, [currentSessionId, startPipeline]);

  const handleLoadSession = useCallback((session) => {
    if (!session) {
      // New session
      resetPipeline();
      resetWorkspaceState();
      setCurrentSessionId(null);
      setMobileSidebarOpen(false);
      return;
    }

    resetPipeline();
    resetWorkspaceState();
    setCurrentSessionId(session._id);
    setSessionMessages(session.messages || []);
    setMobileSidebarOpen(false);
  }, [resetPipeline, setSessionMessages, resetWorkspaceState]);

  useEffect(() => {
    if (pipelineStatus === 'complete' && currentSessionId) {
      fetchFiles(currentSessionId);
    }
  }, [pipelineStatus, currentSessionId, fetchFiles]);

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0a14] text-white overflow-hidden">
      <TopBar
        socketConnected={isConnected}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        isSidebarOpen={mobileSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile drawer sidebar */}
        <div className="md:hidden">
          <div
            ref={sidebarBackdropRef}
            className="fixed inset-0 z-30 bg-black/50 opacity-0 pointer-events-none"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden={!mobileSidebarOpen}
          />
          <div
            ref={sidebarPanelRef}
            className="fixed left-0 top-[52px] bottom-0 z-40 w-[280px] max-w-[85vw] -translate-x-[320px]"
          >
            <SessionSidebar
              onLoadSession={handleLoadSession}
              currentSessionId={currentSessionId}
            />
          </div>
        </div>

        {/* Desktop docked sidebar */}
        <div className="hidden md:flex">
          <SessionSidebar
            onLoadSession={handleLoadSession}
            currentSessionId={currentSessionId}
          />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3 max-w-4xl mx-auto w-full flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              Mode: <span className="font-bold text-white">{pipelineMode.toUpperCase()}</span>
              {pipelineMode === 'local' && (
                <span className="text-emerald-400 font-mono ml-2">qwen3.5:4b</span>
              )}
            </span>
            {toolCalls.slice(-3).map((entry, idx) => (
              <ToolCallBadge key={`${entry.at}-${idx}`} tool={entry.tool} agent={entry.agent} />
            ))}
            {ragContexts.length > 0 && <RagContextBadge count={ragContexts[ragContexts.length - 1].count} />}
          </div>
          <TimelineFeed />
          {currentSessionId && pipelineMode !== 'local' && (
            <div className="px-4 pb-3">
              <div className="max-w-4xl mx-auto">
                <FileExplorer sessionId={currentSessionId} />
              </div>
            </div>
          )}
          <PromptInput
            onSubmit={handleSubmit}
            onFileUpload={handleFileUpload}
            isLoading={isRunning()}
            onStop={stopPipeline}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatPage;

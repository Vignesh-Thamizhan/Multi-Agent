import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import TopBar from '../components/TopBar';
import SessionSidebar from '../components/SessionSidebar';
import TimelineFeed from '../components/TimelineFeed';
import PromptInput from '../components/PromptInput';
import useSocket from '../hooks/useSocket';
import usePipelineStore from '../store/pipelineStore';
import useAuthStore from '../store/authStore';
import { generateAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { isConnected } = useSocket();
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarPanelRef = useRef(null);
  const sidebarBackdropRef = useRef(null);

  const startPipeline = usePipelineStore((s) => s.startPipeline);
  const setSessionMessages = usePipelineStore((s) => s.setSessionMessages);
  const resetPipeline = usePipelineStore((s) => s.resetPipeline);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const user = useAuthStore((s) => s.user);

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
      const { data } = await generateAPI.trigger({
        prompt,
        sessionId: currentSessionId,
        models: user?.modelPreferences || {},
      });

      setCurrentSessionId(data.sessionId);
      startPipeline(data.sessionId);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(msg);
    }
  }, [currentSessionId, user, startPipeline]);

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
      setCurrentSessionId(null);
      setMobileSidebarOpen(false);
      return;
    }

    resetPipeline();
    setCurrentSessionId(session._id);
    setSessionMessages(session.messages || []);
    setMobileSidebarOpen(false);
  }, [resetPipeline, setSessionMessages]);

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
          <TimelineFeed />
          <PromptInput
            onSubmit={handleSubmit}
            onFileUpload={handleFileUpload}
            isLoading={isRunning()}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatPage;

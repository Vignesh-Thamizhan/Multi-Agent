import { useState, useCallback } from 'react';
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
  const { socket, isConnected } = useSocket();
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const startPipeline = usePipelineStore((s) => s.startPipeline);
  const setSessionMessages = usePipelineStore((s) => s.setSessionMessages);
  const resetPipeline = usePipelineStore((s) => s.resetPipeline);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const user = useAuthStore((s) => s.user);

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
      return;
    }

    resetPipeline();
    setCurrentSessionId(session._id);
    setSessionMessages(session.messages || []);
  }, [resetPipeline, setSessionMessages]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a14] text-white overflow-hidden">
      <TopBar socketConnected={isConnected} />

      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          onLoadSession={handleLoadSession}
          currentSessionId={currentSessionId}
        />

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

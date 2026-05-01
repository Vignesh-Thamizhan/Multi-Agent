import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import usePipelineStore from '../store/pipelineStore';
import useWorkspaceStore from '../store/workspaceStore';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const onAgentStart = usePipelineStore((s) => s.onAgentStart);
  const onAgentChunk = usePipelineStore((s) => s.onAgentChunk);
  const onAgentComplete = usePipelineStore((s) => s.onAgentComplete);
  const onAgentError = usePipelineStore((s) => s.onAgentError);
  const onAgentRetry = usePipelineStore((s) => s.onAgentRetry);
  const onPipelineComplete = usePipelineStore((s) => s.onPipelineComplete);
  const onPipelineError = usePipelineStore((s) => s.onPipelineError);
  const setToolCall = useWorkspaceStore((s) => s.setToolCall);
  const setRagContext = useWorkspaceStore((s) => s.setRagContext);

  const stopPipelineInStore = usePipelineStore((s) => s.stopPipeline);
  const currentSessionId = usePipelineStore((s) => s.currentSessionId);

  const stopPipeline = useCallback(() => {
    if (socketRef.current && currentSessionId) {
      socketRef.current.emit('pipeline:stop', { sessionId: currentSessionId });
      stopPipelineInStore();
    }
  }, [currentSessionId, stopPipelineInStore]);

  const connect = useCallback(() => {
    if (!isAuthenticated || socketRef.current?.connected) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Agent events
    socket.on('agent:start', ({ agent, model }) => {
      onAgentStart(agent, model);
    });

    socket.on('agent:chunk', ({ agent, chunk }) => {
      onAgentChunk(agent, chunk);
    });

    socket.on('agent:complete', ({ agent, content }) => {
      onAgentComplete(agent, content);
    });

    socket.on('agent:error', ({ agent, error }) => {
      onAgentError(agent, error);
    });

    socket.on('agent:retry', ({ agent, attempt, waitMs }) => {
      onAgentRetry(agent, attempt, waitMs);
    });

    // Pipeline events
    socket.on('pipeline:complete', ({ sessionId }) => {
      onPipelineComplete(sessionId);
    });

    socket.on('pipeline:error', ({ error }) => {
      onPipelineError(error);
    });

    socket.on('tool:call', ({ agent, tool, args }) => {
      setToolCall({ agent, tool, args, at: Date.now() });
    });

    socket.on('rag:context', ({ agent, queries, count, chunks }) => {
      setRagContext({ agent, queries, count, chunks, at: Date.now() });
    });

    socketRef.current = socket;
  }, [isAuthenticated, onAgentStart, onAgentChunk, onAgentComplete, onAgentError, onAgentRetry, onPipelineComplete, onPipelineError, setToolCall, setRagContext]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    return () => disconnect();
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected,
    stopPipeline,
  };
};

export default useSocket;

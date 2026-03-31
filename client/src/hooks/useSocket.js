import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import usePipelineStore from '../store/pipelineStore';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const onAgentStart = usePipelineStore((s) => s.onAgentStart);
  const onAgentChunk = usePipelineStore((s) => s.onAgentChunk);
  const onAgentComplete = usePipelineStore((s) => s.onAgentComplete);
  const onAgentError = usePipelineStore((s) => s.onAgentError);
  const onAgentRetry = usePipelineStore((s) => s.onAgentRetry);
  const onPipelineComplete = usePipelineStore((s) => s.onPipelineComplete);
  const onPipelineError = usePipelineStore((s) => s.onPipelineError);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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

    socketRef.current = socket;
  }, [token, onAgentStart, onAgentChunk, onAgentComplete, onAgentError, onAgentRetry, onPipelineComplete, onPipelineError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }
    return () => disconnect();
  }, [isAuthenticated, token, connect, disconnect]);

  return {
    isConnected,
  };
};

export default useSocket;

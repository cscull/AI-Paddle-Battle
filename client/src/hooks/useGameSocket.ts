import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  GameState, MatchConfig, MatchStats, TrashTalkMessage, MoveDirection, DebugLogEntry,
  ServerToClientEvents, ClientToServerEvents,
} from '../types';

interface UseGameSocketOptions {
  onMatchEnd: (stats: MatchStats) => void;
}

export function useGameSocket({ onMatchEnd }: UseGameSocketOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [trashTalkLog, setTrashTalkLog] = useState<TrashTalkMessage[]>([]);
  const [debugLog, setDebugLog] = useState<DebugLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const onMatchEndRef = useRef(onMatchEnd);
  onMatchEndRef.current = onMatchEnd;

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('gameState', (state) => setGameState(state));
    socket.on('trashTalk', (msg) => setTrashTalkLog((prev) => [...prev, msg]));
    socket.on('debugLog', (entry) => setDebugLog((prev) => [...prev.slice(-199), entry]));
    socket.on('matchStart', () => { setTrashTalkLog([]); setDebugLog([]); });
    socket.on('matchEnd', (stats) => onMatchEndRef.current(stats));

    return () => { socket.disconnect(); };
  }, []);

  const startMatch = useCallback((config: MatchConfig) => {
    setTrashTalkLog([]);
    setDebugLog([]);
    setGameState(null);
    socketRef.current?.emit('startMatch', config);
  }, []);

  const pauseMatch = useCallback(() => socketRef.current?.emit('pauseMatch'), []);
  const resumeMatch = useCallback(() => socketRef.current?.emit('resumeMatch'), []);
  const endMatch = useCallback(() => socketRef.current?.emit('endMatch'), []);

  const sendHumanInput = useCallback((side: 'left' | 'right', direction: MoveDirection) => {
    socketRef.current?.emit('humanInput', { side, direction });
  }, []);

  const testConnection = useCallback((provider: string, model: string, apiKey: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('testConnection', { provider, model, apiKey });
      const handler = (result: { provider: string; success: boolean; error?: string }) => {
        if (result.provider === provider) {
          socketRef.current?.off('connectionTest', handler);
          resolve({ success: result.success, error: result.error });
        }
      };
      socketRef.current?.on('connectionTest', handler);
      // Timeout after 10 seconds
      setTimeout(() => {
        socketRef.current?.off('connectionTest', handler);
        resolve({ success: false, error: 'Connection test timed out' });
      }, 10000);
    });
  }, []);

  return {
    gameState,
    trashTalkLog,
    debugLog,
    isConnected,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    sendHumanInput,
    testConnection,
  };
}

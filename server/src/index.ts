import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import type { ServerToClientEvents, ClientToServerEvents } from './types.js';
import { MatchManager } from './match-manager.js';
import { PROVIDERS } from './models.js';
import { createAdapter } from './adapters/index.js';

dotenv.config({ path: '../.env' });

const app = express();
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4000';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/providers', (_req, res) => {
  res.json(PROVIDERS);
});

// Clamp a number to a range, returning the default if invalid
function clamp(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

// Sanitize error messages to prevent API key leakage
function sanitizeError(error: unknown): string {
  const msg = String(error);
  // Strip anything that looks like an API key (sk-..., xai-..., AI..., etc.)
  return msg.replace(/\b(sk-[a-zA-Z0-9_-]{10,}|xai-[a-zA-Z0-9_-]{10,}|AI[a-zA-Z0-9_-]{20,}|key-[a-zA-Z0-9_-]{10,})\b/g, '[REDACTED]');
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let match: MatchManager | null = null;

  socket.on('startMatch', (config) => {
    // Validate and clamp settings to safe ranges
    if (!config?.players?.left || !config?.players?.right || !config?.settings) {
      socket.emit('error', 'Invalid match config');
      return;
    }
    config.settings.pointsToWin = clamp(config.settings.pointsToWin, 1, 21, 7);
    config.settings.timeLimitSeconds = clamp(config.settings.timeLimitSeconds, 30, 600, 180);
    config.settings.queryIntervalMs = clamp(config.settings.queryIntervalMs, 100, 2000, 300);
    config.settings.ballSpeedMultiplier = clamp(config.settings.ballSpeedMultiplier, 0.5, 3.0, 1.0);
    config.settings.trashTalkEnabled = Boolean(config.settings.trashTalkEnabled);

    if (match) match.stop();
    match = new MatchManager(socket, config);
    match.start();
  });

  socket.on('pauseMatch', () => match?.pause());
  socket.on('resumeMatch', () => match?.resume());
  socket.on('endMatch', () => {
    match?.stop();
    match = null;
  });

  socket.on('humanInput', (data) => {
    if (data.side !== 'left' && data.side !== 'right') return;
    if (!['up', 'down', 'stop'].includes(data.direction)) return;
    match?.handleHumanInput(data.side, data.direction);
  });

  socket.on('testConnection', async (data) => {
    try {
      const adapter = createAdapter(data.provider, data.model, data.apiKey);
      const result = await adapter.testConnection(data.apiKey);
      socket.emit('connectionTest', {
        provider: data.provider,
        success: result.success,
        error: result.error ? sanitizeError(result.error) : undefined,
      });
    } catch (error) {
      socket.emit('connectionTest', { provider: data.provider, success: false, error: sanitizeError(error) });
    }
  });

  socket.on('disconnect', () => {
    match?.stop();
    match = null;
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4001;
httpServer.listen(PORT, () => {
  console.log(`AI Paddle Battle server running on port ${PORT}`);
});

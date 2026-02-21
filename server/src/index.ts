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
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/providers', (_req, res) => {
  res.json(PROVIDERS);
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let match: MatchManager | null = null;

  socket.on('startMatch', (config) => {
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
    match?.handleHumanInput(data.side, data.direction);
  });

  socket.on('testConnection', async (data) => {
    try {
      const adapter = createAdapter(data.provider, data.model, data.apiKey);
      const result = await adapter.testConnection(data.apiKey);
      socket.emit('connectionTest', { provider: data.provider, ...result });
    } catch (error) {
      socket.emit('connectionTest', { provider: data.provider, success: false, error: String(error) });
    }
  });

  socket.on('disconnect', () => {
    match?.stop();
    match = null;
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`AI Paddle Battle server running on port ${PORT}`);
});

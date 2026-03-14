# AI Paddle Battle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based game where two LLMs play a paddle-and-ball game with real-time trash talk, supporting 11 providers and ~55 models, plus human vs AI mode and retro sound.

**Architecture:** npm workspaces monorepo — React+Vite client renders game state received via socket.io from a Node.js+Express+TypeScript server that runs the 60fps physics loop and orchestrates LLM calls through a unified adapter pattern. OpenAI-compatible base adapter covers 8 of 11 providers.

**Tech Stack:** TypeScript, React, Vite, Express, socket.io, vitest (server tests), Web Audio API (sound), HTML5 Canvas (rendering)

**Design doc:** `docs/plans/2026-02-20-ai-paddle-battle-design.md`

---

## Phase 1: Project Foundation

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `.gitignore`
- Create: `.env.example`
- Modify: `tsconfig.json` (root)

**Step 1: Create root package.json**

```json
{
  "name": "ai-paddle-battle",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently -n client,server -c cyan,magenta \"npm run dev -w client\" \"npm run dev -w server\"",
    "build": "npm run build -w client && npm run build -w server",
    "test": "npm run test -w server",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create server/package.json**

```json
{
  "name": "ai-paddle-battle-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "socket.io": "^4.8.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 3: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create client/package.json**

```json
{
  "name": "ai-paddle-battle-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "socket.io-client": "^4.8.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

**Step 5: Create client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

**Step 6: Create client/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
```

**Step 7: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Paddle Battle</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 8: Create root tsconfig.json**

```json
{
  "references": [
    { "path": "./client" },
    { "path": "./server" }
  ],
  "files": []
}
```

**Step 9: Create .gitignore**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

**Step 10: Create .env.example**

```bash
# Optional: Pre-configure API keys for self-hosted setups
# Keys entered in the UI will override these

# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=AI...
# XAI_API_KEY=xai-...
# MISTRAL_API_KEY=...
# DEEPSEEK_API_KEY=sk-...
# MOONSHOT_API_KEY=sk-...
# COHERE_API_KEY=...
# QWEN_API_KEY=sk-...
# OPENROUTER_API_KEY=sk-or-...
```

**Step 11: Install dependencies**

Run: `npm install`
Expected: All dependencies installed, node_modules created at root

**Step 12: Commit**

```bash
git add package.json server/package.json server/tsconfig.json client/package.json client/tsconfig.json client/vite.config.ts client/index.html tsconfig.json .gitignore .env.example
git commit -m "feat: scaffold monorepo with npm workspaces"
```

---

### Task 2: Shared Types

**Files:**
- Create: `server/src/types.ts`

**Step 1: Create the shared types file**

This defines ALL interfaces used across the project. All coordinates normalized 0.0–1.0.

```typescript
// ── Game State ──

export interface BallState {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface GameState {
  ball: BallState;
  paddles: {
    left: { y: number };
    right: { y: number };
  };
  score: {
    left: number;
    right: number;
  };
  timeRemainingSeconds: number;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  winner?: 'left' | 'right' | 'draw';
}

// ── LLM Communication ──

export type MoveDirection = 'UP' | 'DOWN' | 'STAY';

export interface MoveResponse {
  move: MoveDirection;
  raw?: string;
  error?: boolean;
}

export interface LLMGameState {
  ball: { x: number; y: number; dx: number; dy: number };
  your_paddle_y: number;
  opponent_paddle_y: number;
  score: { you: number; opponent: number };
  game_time_remaining_seconds: number;
}

export interface TrashTalkContext {
  yourScore: number;
  opponentScore: number;
  whoScored: 'you' | 'opponent';
  opponentLastMessage: string;
  modelName: string;
}

// ── LLM Adapter ──

export interface LLMAdapter {
  provider: string;
  model: string;
  getMove(gameState: LLMGameState): Promise<MoveResponse>;
  getTrashTalk(context: TrashTalkContext): Promise<string>;
  getTokensUsed(): { input: number; output: number };
  testConnection(apiKey: string): Promise<{ success: boolean; error?: string }>;
}

export interface TokenUsage {
  input: number;
  output: number;
}

// ── Provider & Model Registry ──

export interface ModelInfo {
  id: string;
  displayName: string;
}

export interface ProviderInfo {
  id: string;
  displayName: string;
  baseUrl: string;
  models: ModelInfo[];
  requiresApiKey: boolean;
  isOpenAICompatible: boolean;
}

// ── Match Configuration ──

export type PlayerType = 'ai' | 'human';

export interface PlayerConfig {
  type: PlayerType;
  name: string;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface MatchConfig {
  players: {
    left: PlayerConfig;
    right: PlayerConfig;
  };
  settings: {
    pointsToWin: number;
    timeLimitSeconds: number;
    queryIntervalMs: number;
    trashTalkEnabled: boolean;
    ballSpeedMultiplier: number;
  };
}

// ── Match Stats ──

export interface PlayerStats {
  tokensUsed: TokenUsage;
  estimatedCost: number;
  avgResponseTimeMs: number;
  fastestResponseMs: number;
  slowestResponseMs: number;
  invalidResponses: number;
  totalQueries: number;
}

export interface MatchStats {
  left: PlayerStats;
  right: PlayerStats;
  trashTalkLog: TrashTalkMessage[];
  durationSeconds: number;
}

export interface TrashTalkMessage {
  side: 'left' | 'right';
  modelName: string;
  message: string;
  timestamp: number;
}

// ── Socket Events ──

export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  trashTalk: (msg: TrashTalkMessage) => void;
  matchStart: () => void;
  matchEnd: (stats: MatchStats) => void;
  error: (msg: string) => void;
  connectionTest: (result: { provider: string; success: boolean; error?: string }) => void;
}

export interface ClientToServerEvents {
  startMatch: (config: MatchConfig) => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  endMatch: () => void;
  humanInput: (data: { side: 'left' | 'right'; direction: MoveDirection }) => void;
  testConnection: (data: { provider: string; model: string; apiKey: string }) => void;
}
```

**Step 2: Commit**

```bash
git add server/src/types.ts
git commit -m "feat: add shared TypeScript types for game state, adapters, and socket events"
```

---

### Task 3: Server Entry Point

**Files:**
- Create: `server/src/index.ts`

**Step 1: Create the Express + socket.io server**

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import type { ServerToClientEvents, ClientToServerEvents } from './types.js';

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

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Match events will be wired up in Task 12 (match-manager)
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`AI Paddle Battle server running on port ${PORT}`);
});
```

**Step 2: Verify server starts**

Run: `npm run dev -w server`
Expected: "AI Paddle Battle server running on port 3001"

**Step 3: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: add Express + socket.io server entry point"
```

---

## Phase 2: Game Engine (TDD)

### Task 4: Game Engine — Constants and Initialization

**Files:**
- Create: `server/src/game-engine.ts`
- Create: `server/src/__tests__/game-engine.test.ts`

**Step 1: Write failing tests for game initialization**

```typescript
import { describe, it, expect } from 'vitest';
import { GameEngine, GAME_CONSTANTS } from '../game-engine.js';

describe('GameEngine', () => {
  describe('constants', () => {
    it('uses normalized coordinate space 0-1', () => {
      expect(GAME_CONSTANTS.FIELD_MIN).toBe(0);
      expect(GAME_CONSTANTS.FIELD_MAX).toBe(1);
    });

    it('has paddle dimensions', () => {
      expect(GAME_CONSTANTS.PADDLE_HEIGHT).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.PADDLE_HEIGHT).toBeLessThan(0.3);
      expect(GAME_CONSTANTS.PADDLE_WIDTH).toBeGreaterThan(0);
    });

    it('has ball radius', () => {
      expect(GAME_CONSTANTS.BALL_RADIUS).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.BALL_RADIUS).toBeLessThan(0.05);
    });
  });

  describe('initialization', () => {
    it('creates a game with default state', () => {
      const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
      const state = engine.getState();

      expect(state.ball.x).toBe(0.5);
      expect(state.ball.y).toBe(0.5);
      expect(state.paddles.left.y).toBe(0.5);
      expect(state.paddles.right.y).toBe(0.5);
      expect(state.score.left).toBe(0);
      expect(state.score.right).toBe(0);
      expect(state.status).toBe('waiting');
    });

    it('resets ball to center with random direction', () => {
      const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
      engine.resetBall();
      const state = engine.getState();

      expect(state.ball.x).toBe(0.5);
      expect(state.ball.y).toBe(0.5);
      expect(state.ball.dx).not.toBe(0);
      expect(state.ball.dy).not.toBe(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd AI-Paddle-Battle && npm test -w server`
Expected: FAIL — module not found

**Step 3: Implement GameEngine class with constants and initialization**

```typescript
import type { GameState, BallState } from './types.js';

export const GAME_CONSTANTS = {
  FIELD_MIN: 0,
  FIELD_MAX: 1,
  PADDLE_HEIGHT: 0.15,
  PADDLE_WIDTH: 0.015,
  PADDLE_X_LEFT: 0.02,
  PADDLE_X_RIGHT: 0.98,
  BALL_RADIUS: 0.01,
  BALL_BASE_SPEED: 0.008,
  BALL_SPEED_INCREMENT: 0.0005,
  PADDLE_SPEED: 0.015,
  MAX_BALL_SPEED: 0.02,
} as const;

export interface EngineConfig {
  pointsToWin: number;
  timeLimitSeconds: number;
  ballSpeedMultiplier: number;
}

export class GameEngine {
  private state: GameState;
  private config: EngineConfig;
  private rallyHits: number = 0;
  private startTime: number = 0;

  constructor(config: EngineConfig) {
    this.config = config;
    this.state = {
      ball: { x: 0.5, y: 0.5, dx: 0, dy: 0 },
      paddles: {
        left: { y: 0.5 },
        right: { y: 0.5 },
      },
      score: { left: 0, right: 0 },
      timeRemainingSeconds: config.timeLimitSeconds,
      status: 'waiting',
    };
  }

  getState(): GameState {
    return { ...this.state, ball: { ...this.state.ball }, paddles: { left: { ...this.state.paddles.left }, right: { ...this.state.paddles.right } }, score: { ...this.state.score } };
  }

  resetBall(): void {
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6; // -30 to +30 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = GAME_CONSTANTS.BALL_BASE_SPEED * this.config.ballSpeedMultiplier;

    this.state.ball = {
      x: 0.5,
      y: 0.5,
      dx: Math.cos(angle) * speed * direction,
      dy: Math.sin(angle) * speed,
    };
    this.rallyHits = 0;
  }

  start(): void {
    this.state.status = 'playing';
    this.startTime = Date.now();
    this.resetBall();
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -w server`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add server/src/game-engine.ts server/src/__tests__/game-engine.test.ts
git commit -m "feat: add GameEngine with constants and initialization (TDD)"
```

---

### Task 5: Game Engine — Ball Physics and Wall Bouncing

**Files:**
- Modify: `server/src/game-engine.ts`
- Modify: `server/src/__tests__/game-engine.test.ts`

**Step 1: Write failing tests for ball movement and wall bouncing**

Add to the test file:

```typescript
describe('ball physics', () => {
  it('moves ball by dx/dy each tick', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    const before = engine.getState().ball;
    engine.tick();
    const after = engine.getState().ball;

    expect(after.x).toBeCloseTo(before.x + before.dx, 5);
    expect(after.y).toBeCloseTo(before.y + before.dy, 5);
  });

  it('bounces ball off top wall', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    // Force ball near top wall moving upward
    engine['state'].ball = { x: 0.5, y: 0.005, dx: 0.005, dy: -0.01 };
    engine.tick();
    const state = engine.getState();

    expect(state.ball.dy).toBeGreaterThan(0); // reversed
  });

  it('bounces ball off bottom wall', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine['state'].ball = { x: 0.5, y: 0.995, dx: 0.005, dy: 0.01 };
    engine.tick();
    const state = engine.getState();

    expect(state.ball.dy).toBeLessThan(0); // reversed
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w server`
Expected: FAIL — tick is not a function

**Step 3: Implement tick() with ball movement and wall bouncing**

Add to `GameEngine` class:

```typescript
tick(): void {
  if (this.state.status !== 'playing') return;

  this.updateTime();
  this.moveBall();
  this.checkWallCollisions();
  this.checkPaddleCollisions();
  this.checkScore();
  this.checkWinCondition();
}

private updateTime(): void {
  const elapsed = (Date.now() - this.startTime) / 1000;
  this.state.timeRemainingSeconds = Math.max(0, this.config.timeLimitSeconds - elapsed);
}

private moveBall(): void {
  this.state.ball.x += this.state.ball.dx;
  this.state.ball.y += this.state.ball.dy;
}

private checkWallCollisions(): void {
  const ball = this.state.ball;
  const r = GAME_CONSTANTS.BALL_RADIUS;

  if (ball.y - r <= GAME_CONSTANTS.FIELD_MIN) {
    ball.y = GAME_CONSTANTS.FIELD_MIN + r;
    ball.dy = Math.abs(ball.dy);
  } else if (ball.y + r >= GAME_CONSTANTS.FIELD_MAX) {
    ball.y = GAME_CONSTANTS.FIELD_MAX - r;
    ball.dy = -Math.abs(ball.dy);
  }
}

private checkPaddleCollisions(): void {
  // Implemented in Task 6
}

private checkScore(): void {
  // Implemented in Task 6
}

private checkWinCondition(): void {
  // Implemented in Task 6
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -w server`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add server/src/game-engine.ts server/src/__tests__/game-engine.test.ts
git commit -m "feat: add ball movement and wall bouncing physics (TDD)"
```

---

### Task 6: Game Engine — Paddle Collisions, Scoring, and Win Conditions

**Files:**
- Modify: `server/src/game-engine.ts`
- Modify: `server/src/__tests__/game-engine.test.ts`

**Step 1: Write failing tests**

Add to the test file:

```typescript
describe('paddle collisions', () => {
  it('bounces ball off left paddle', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    // Place ball at left paddle, moving left
    const paddleX = GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH;
    engine['state'].ball = { x: paddleX + 0.001, y: 0.5, dx: -0.008, dy: 0.002 };
    engine['state'].paddles.left.y = 0.5;
    engine.tick();
    const state = engine.getState();

    expect(state.ball.dx).toBeGreaterThan(0); // reversed direction
  });

  it('bounces ball off right paddle', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    const paddleX = GAME_CONSTANTS.PADDLE_X_RIGHT - GAME_CONSTANTS.PADDLE_WIDTH;
    engine['state'].ball = { x: paddleX - 0.001, y: 0.5, dx: 0.008, dy: 0.002 };
    engine['state'].paddles.right.y = 0.5;
    engine.tick();
    const state = engine.getState();

    expect(state.ball.dx).toBeLessThan(0); // reversed direction
  });

  it('misses paddle if ball is outside paddle range', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    // Ball at left edge but paddle is far away
    engine['state'].ball = { x: 0.01, y: 0.9, dx: -0.008, dy: 0 };
    engine['state'].paddles.left.y = 0.2;
    engine.tick();

    // Ball passed through — should score for right
    expect(engine.getState().score.right).toBe(1);
  });
});

describe('scoring', () => {
  it('scores for right player when ball passes left edge', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine['state'].ball = { x: 0.001, y: 0.5, dx: -0.008, dy: 0 };
    engine['state'].paddles.left.y = 0.1; // paddle nowhere near ball
    engine.tick();

    expect(engine.getState().score.right).toBe(1);
  });

  it('scores for left player when ball passes right edge', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine['state'].ball = { x: 0.999, y: 0.5, dx: 0.008, dy: 0 };
    engine['state'].paddles.right.y = 0.1; // paddle nowhere near ball
    engine.tick();

    expect(engine.getState().score.left).toBe(1);
  });
});

describe('win conditions', () => {
  it('finishes when a player reaches pointsToWin', () => {
    const engine = new GameEngine({ pointsToWin: 3, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine['state'].score.left = 2;
    engine['state'].ball = { x: 0.999, y: 0.5, dx: 0.008, dy: 0 };
    engine['state'].paddles.right.y = 0.1;
    engine.tick();

    const state = engine.getState();
    expect(state.score.left).toBe(3);
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('left');
  });

  it('finishes when time runs out', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 0, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine['state'].score.left = 3;
    engine['state'].score.right = 2;
    engine.tick();

    const state = engine.getState();
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('left');
  });
});

describe('paddle movement', () => {
  it('moves paddle toward target position', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine.setPaddleTarget('left', 0.8);
    engine.tick();
    const state = engine.getState();

    expect(state.paddles.left.y).toBeGreaterThan(0.5);
    expect(state.paddles.left.y).toBeLessThanOrEqual(0.8);
  });

  it('clamps paddle within field bounds', () => {
    const engine = new GameEngine({ pointsToWin: 7, timeLimitSeconds: 180, ballSpeedMultiplier: 1.0 });
    engine.start();
    engine.setPaddleTarget('left', 1.5);
    // Tick many times to let it reach
    for (let i = 0; i < 100; i++) engine.tick();
    const state = engine.getState();
    const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;

    expect(state.paddles.left.y).toBeLessThanOrEqual(1.0 - halfPaddle);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w server`
Expected: FAIL

**Step 3: Implement paddle collisions, scoring, win conditions, and paddle movement**

Fill in the stub methods and add `setPaddleTarget` and paddle target tracking:

Add to `GameEngine` class properties:

```typescript
private paddleTargets = { left: 0.5, right: 0.5 };
private lastScorer: 'left' | 'right' | null = null;
```

Add `setPaddleTarget` method:

```typescript
setPaddleTarget(side: 'left' | 'right', y: number): void {
  this.paddleTargets[side] = Math.max(0, Math.min(1, y));
}

getLastScorer(): 'left' | 'right' | null {
  return this.lastScorer;
}
```

Add to `tick()` — call `this.movePaddles()` before `this.moveBall()`:

```typescript
tick(): void {
  if (this.state.status !== 'playing') return;

  this.updateTime();
  this.movePaddles();
  this.moveBall();
  this.checkWallCollisions();
  this.checkPaddleCollisions();
  this.checkScore();
  this.checkWinCondition();
}
```

Implement the remaining methods:

```typescript
private movePaddles(): void {
  const speed = GAME_CONSTANTS.PADDLE_SPEED;
  const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;

  for (const side of ['left', 'right'] as const) {
    const current = this.state.paddles[side].y;
    const target = this.paddleTargets[side];
    const diff = target - current;

    if (Math.abs(diff) < speed) {
      this.state.paddles[side].y = target;
    } else {
      this.state.paddles[side].y += Math.sign(diff) * speed;
    }

    // Clamp within bounds
    this.state.paddles[side].y = Math.max(
      halfPaddle,
      Math.min(1 - halfPaddle, this.state.paddles[side].y)
    );
  }
}

private checkPaddleCollisions(): void {
  const ball = this.state.ball;
  const r = GAME_CONSTANTS.BALL_RADIUS;
  const pw = GAME_CONSTANTS.PADDLE_WIDTH;
  const ph = GAME_CONSTANTS.PADDLE_HEIGHT / 2;

  // Left paddle
  const leftPaddleRight = GAME_CONSTANTS.PADDLE_X_LEFT + pw;
  if (
    ball.dx < 0 &&
    ball.x - r <= leftPaddleRight &&
    ball.x + r >= GAME_CONSTANTS.PADDLE_X_LEFT &&
    ball.y >= this.state.paddles.left.y - ph &&
    ball.y <= this.state.paddles.left.y + ph
  ) {
    ball.x = leftPaddleRight + r;
    ball.dx = Math.abs(ball.dx);
    this.applyPaddleDeflection(ball, this.state.paddles.left.y);
    this.rallyHits++;
    this.accelerateBall();
  }

  // Right paddle
  const rightPaddleLeft = GAME_CONSTANTS.PADDLE_X_RIGHT - pw;
  if (
    ball.dx > 0 &&
    ball.x + r >= rightPaddleLeft &&
    ball.x - r <= GAME_CONSTANTS.PADDLE_X_RIGHT &&
    ball.y >= this.state.paddles.right.y - ph &&
    ball.y <= this.state.paddles.right.y + ph
  ) {
    ball.x = rightPaddleLeft - r;
    ball.dx = -Math.abs(ball.dx);
    this.applyPaddleDeflection(ball, this.state.paddles.right.y);
    this.rallyHits++;
    this.accelerateBall();
  }
}

private applyPaddleDeflection(ball: BallState, paddleY: number): void {
  const relativeHit = (ball.y - paddleY) / (GAME_CONSTANTS.PADDLE_HEIGHT / 2);
  ball.dy += relativeHit * 0.003;
}

private accelerateBall(): void {
  const speed = Math.sqrt(this.state.ball.dx ** 2 + this.state.ball.dy ** 2);
  const maxSpeed = GAME_CONSTANTS.MAX_BALL_SPEED * this.config.ballSpeedMultiplier;
  if (speed < maxSpeed) {
    const factor = 1 + GAME_CONSTANTS.BALL_SPEED_INCREMENT / speed;
    this.state.ball.dx *= factor;
    this.state.ball.dy *= factor;
  }
}

private checkScore(): void {
  const ball = this.state.ball;

  if (ball.x <= 0) {
    this.state.score.right++;
    this.lastScorer = 'right';
    this.resetBall();
  } else if (ball.x >= 1) {
    this.state.score.left++;
    this.lastScorer = 'left';
    this.resetBall();
  }
}

private checkWinCondition(): void {
  const { left, right } = this.state.score;
  const ptw = this.config.pointsToWin;

  if (left >= ptw) {
    this.state.status = 'finished';
    this.state.winner = 'left';
  } else if (right >= ptw) {
    this.state.status = 'finished';
    this.state.winner = 'right';
  } else if (this.state.timeRemainingSeconds <= 0) {
    this.state.status = 'finished';
    this.state.winner = left > right ? 'left' : right > left ? 'right' : 'draw';
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -w server`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add server/src/game-engine.ts server/src/__tests__/game-engine.test.ts
git commit -m "feat: add paddle collisions, scoring, win conditions, paddle movement (TDD)"
```

---

## Phase 3: LLM Adapters

### Task 7: Model Registry and Pricing

**Files:**
- Create: `server/src/models.ts`
- Create: `server/src/pricing.ts`

**Step 1: Create the model registry**

`server/src/models.ts` — central registry of all providers and models:

```typescript
import type { ProviderInfo } from './types.js';

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'gpt-5.2', displayName: 'GPT-5.2' },
      { id: 'gpt-5-mini', displayName: 'GPT-5 Mini' },
      { id: 'gpt-5-nano', displayName: 'GPT-5 Nano' },
      { id: 'gpt-4.1', displayName: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', displayName: 'GPT-4.1 Nano' },
      { id: 'o4-mini', displayName: 'o4-mini' },
    ],
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
    isOpenAICompatible: false,
    models: [
      { id: 'claude-opus-4-6', displayName: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5' },
    ],
  },
  {
    id: 'google',
    displayName: 'Google (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresApiKey: true,
    isOpenAICompatible: false,
    models: [
      { id: 'gemini-3.1-pro-preview', displayName: 'Gemini 3.1 Pro' },
      { id: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro' },
      { id: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash' },
      { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite' },
    ],
  },
  {
    id: 'xai',
    displayName: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'grok-4', displayName: 'Grok 4' },
      { id: 'grok-4-fast-reasoning', displayName: 'Grok 4 Fast (Reasoning)' },
      { id: 'grok-4-fast-non-reasoning', displayName: 'Grok 4 Fast (Instant)' },
      { id: 'grok-4-1-fast-reasoning', displayName: 'Grok 4.1 Fast (Reasoning)' },
      { id: 'grok-4-1-fast-non-reasoning', displayName: 'Grok 4.1 Fast (Instant)' },
      { id: 'grok-3-mini-fast-beta', displayName: 'Grok 3 Mini Fast' },
    ],
  },
  {
    id: 'mistral',
    displayName: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'mistral-large-2512', displayName: 'Mistral Large 3' },
      { id: 'mistral-medium-2508', displayName: 'Mistral Medium 3.1' },
      { id: 'mistral-small-2506', displayName: 'Mistral Small 3.2' },
      { id: 'magistral-medium-2506', displayName: 'Magistral Medium (reasoning)' },
      { id: 'magistral-small-2506', displayName: 'Magistral Small (reasoning)' },
      { id: 'codestral-2508', displayName: 'Codestral' },
      { id: 'ministral-8b-2512', displayName: 'Ministral 8B' },
      { id: 'ministral-3b-2512', displayName: 'Ministral 3B' },
    ],
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'deepseek-chat', displayName: 'DeepSeek V3.2' },
      { id: 'deepseek-reasoner', displayName: 'DeepSeek V3.2 Reasoner' },
    ],
  },
  {
    id: 'moonshot',
    displayName: 'Moonshot AI (Kimi)',
    baseUrl: 'https://api.moonshot.ai/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'kimi-k2.5', displayName: 'Kimi K2.5' },
      { id: 'kimi-k2-thinking', displayName: 'Kimi K2 Thinking' },
    ],
  },
  {
    id: 'cohere',
    displayName: 'Cohere',
    baseUrl: 'https://api.cohere.ai/compatibility/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'command-a-03-2025', displayName: 'Command A' },
      { id: 'command-r-plus-08-2024', displayName: 'Command R+' },
    ],
  },
  {
    id: 'qwen',
    displayName: 'Alibaba (Qwen)',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'qwen3-max', displayName: 'Qwen3 Max' },
      { id: 'qwen-plus', displayName: 'Qwen Plus' },
      { id: 'qwen-turbo', displayName: 'Qwen Turbo' },
      { id: 'qwq-plus', displayName: 'QwQ Plus (reasoning)' },
    ],
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    isOpenAICompatible: true,
    models: [
      { id: 'openai/gpt-4.1', displayName: 'GPT-4.1' },
      { id: 'anthropic/claude-sonnet-4.6', displayName: 'Claude Sonnet 4.6' },
      { id: 'google/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
      { id: 'mistralai/mistral-large-2512', displayName: 'Mistral Large 3' },
      { id: 'x-ai/grok-3-mini-fast-beta', displayName: 'Grok 3 Mini Fast' },
      { id: 'deepseek/deepseek-chat', displayName: 'DeepSeek V3.2' },
      { id: 'deepseek/deepseek-reasoner', displayName: 'DeepSeek V3.2 Reasoner' },
      { id: 'meta-llama/llama-4-maverick', displayName: 'Llama 4 Maverick' },
      { id: 'meta-llama/llama-4-scout', displayName: 'Llama 4 Scout' },
      { id: 'qwen/qwen3-235b-a22b', displayName: 'Qwen3 235B' },
      { id: 'cohere/command-a-03-2025', displayName: 'Command A' },
    ],
  },
  {
    id: 'ollama',
    displayName: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
    isOpenAICompatible: true,
    models: [
      { id: 'llama3.1', displayName: 'Llama 3.1 8B' },
      { id: 'llama4-maverick', displayName: 'Llama 4 Maverick' },
      { id: 'qwen3', displayName: 'Qwen3' },
      { id: 'deepseek-r1', displayName: 'DeepSeek R1' },
      { id: 'mistral', displayName: 'Mistral 7B' },
      { id: 'gemma3', displayName: 'Gemma 3' },
      { id: 'phi4', displayName: 'Phi-4' },
    ],
  },
];

export function getProvider(providerId: string): ProviderInfo | undefined {
  return PROVIDERS.find(p => p.id === providerId);
}
```

**Step 2: Create the pricing table**

`server/src/pricing.ts`:

```typescript
// Pricing per 1M tokens: { input: $, output: $ }
// Update these as providers change pricing
// Models without known pricing will show "N/A"

export const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-5.2': { input: 10.00, output: 30.00 },
  'gpt-5-mini': { input: 1.50, output: 6.00 },
  'gpt-5-nano': { input: 0.30, output: 1.20 },
  'gpt-4.1': { input: 2.00, output: 8.00 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },
  'o4-mini': { input: 1.10, output: 4.40 },

  // Anthropic
  'claude-opus-4-6': { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },

  // Google Gemini
  'gemini-3.1-pro-preview': { input: 2.50, output: 10.00 },
  'gemini-3-pro-preview': { input: 2.50, output: 10.00 },
  'gemini-3-flash-preview': { input: 0.15, output: 0.60 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },

  // xAI — pricing approximate
  'grok-4': { input: 6.00, output: 18.00 },
  'grok-4-fast-reasoning': { input: 3.00, output: 9.00 },
  'grok-4-fast-non-reasoning': { input: 3.00, output: 9.00 },
  'grok-4-1-fast-reasoning': { input: 3.00, output: 9.00 },
  'grok-4-1-fast-non-reasoning': { input: 3.00, output: 9.00 },
  'grok-3-mini-fast-beta': { input: 0.30, output: 0.50 },

  // Mistral
  'mistral-large-2512': { input: 2.00, output: 6.00 },
  'mistral-medium-2508': { input: 0.40, output: 2.00 },
  'mistral-small-2506': { input: 0.10, output: 0.30 },
  'magistral-medium-2506': { input: 2.00, output: 5.00 },
  'magistral-small-2506': { input: 0.50, output: 1.50 },
  'codestral-2508': { input: 0.30, output: 0.90 },
  'ministral-8b-2512': { input: 0.10, output: 0.10 },
  'ministral-3b-2512': { input: 0.04, output: 0.04 },

  // DeepSeek
  'deepseek-chat': { input: 0.27, output: 1.10 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },

  // Moonshot AI (Kimi)
  'kimi-k2.5': { input: 0.60, output: 2.40 },
  'kimi-k2-thinking': { input: 0.60, output: 2.40 },

  // Cohere
  'command-a-03-2025': { input: 2.50, output: 10.00 },
  'command-r-plus-08-2024': { input: 2.50, output: 10.00 },

  // Alibaba (Qwen)
  'qwen3-max': { input: 1.60, output: 6.40 },
  'qwen-plus': { input: 0.80, output: 2.00 },
  'qwen-turbo': { input: 0.30, output: 0.60 },
  'qwq-plus': { input: 0.80, output: 2.00 },

  // OpenRouter — uses underlying model pricing (approximate)
  'openai/gpt-4.1': { input: 2.00, output: 8.00 },
  'anthropic/claude-sonnet-4.6': { input: 3.00, output: 15.00 },
  'google/gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'mistralai/mistral-large-2512': { input: 2.00, output: 6.00 },
  'x-ai/grok-3-mini-fast-beta': { input: 0.30, output: 0.50 },
  'deepseek/deepseek-chat': { input: 0.27, output: 1.10 },
  'deepseek/deepseek-reasoner': { input: 0.55, output: 2.19 },
  'meta-llama/llama-4-maverick': { input: 0.50, output: 0.70 },
  'meta-llama/llama-4-scout': { input: 0.18, output: 0.35 },
  'qwen/qwen3-235b-a22b': { input: 0.80, output: 2.00 },
  'cohere/command-a-03-2025': { input: 2.50, output: 10.00 },

  // Ollama — free (local)
};

export function estimateCost(modelId: string, tokens: { input: number; output: number }): number | null {
  const pricing = PRICING[modelId];
  if (!pricing) return null;
  return (tokens.input / 1_000_000) * pricing.input + (tokens.output / 1_000_000) * pricing.output;
}
```

**Step 3: Commit**

```bash
git add server/src/models.ts server/src/pricing.ts
git commit -m "feat: add model registry (11 providers, ~55 models) and pricing table"
```

---

### Task 8: Prompt Builders

**Files:**
- Create: `server/src/prompts/move.ts`
- Create: `server/src/prompts/trash-talk.ts`

**Step 1: Create move prompt builder**

```typescript
import type { LLMGameState } from '../types.js';

const SYSTEM_PROMPT = `You are an AI playing a competitive paddle-and-ball game. You control a paddle that moves UP or DOWN.

Given the game state, respond with ONLY valid JSON: {"move": "UP"} or {"move": "DOWN"} or {"move": "STAY"}

Strategy tips:
- Move toward where the ball WILL be, not where it is now
- Consider the ball's direction (dx, dy) to predict its path
- Stay near center when the ball is moving away from you

Respond with ONLY the JSON object, nothing else.`;

export function buildMovePrompt(gameState: LLMGameState): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify(gameState),
  };
}
```

**Step 2: Create trash talk prompt builder**

```typescript
import type { TrashTalkContext } from '../types.js';

export function buildTrashTalkPrompt(context: TrashTalkContext): { system: string; user: string } {
  const system = `You are ${context.modelName}, an AI competing in a paddle-and-ball video game. Generate short, witty trash talk. Be competitive and funny. Keep it playful — no insults, profanity, or meanness. Respond with ONLY the trash talk message text, nothing else. Max 150 characters.`;

  const lines = [
    `Score: You ${context.yourScore} - ${context.opponentScore} Opponent`,
    `${context.whoScored === 'you' ? 'You' : 'Your opponent'} just scored.`,
  ];

  if (context.opponentLastMessage) {
    lines.push(`Opponent's last trash talk: "${context.opponentLastMessage}"`);
  }

  return {
    system,
    user: lines.join('\n'),
  };
}
```

**Step 3: Commit**

```bash
git add server/src/prompts/move.ts server/src/prompts/trash-talk.ts
git commit -m "feat: add move and trash talk prompt builders"
```

---

### Task 9: Base Adapter and OpenAI-Compatible Adapter

**Files:**
- Create: `server/src/adapters/base.ts`
- Create: `server/src/adapters/openai-compatible.ts`
- Create: `server/src/__tests__/adapters.test.ts`

**Step 1: Write failing tests for response parsing**

```typescript
import { describe, it, expect } from 'vitest';
import { parseMoveFomResponse } from '../adapters/base.js';

describe('parseMoveFomResponse', () => {
  it('parses valid JSON response', () => {
    expect(parseMoveFomResponse('{"move": "UP"}')).toBe('UP');
    expect(parseMoveFomResponse('{"move": "DOWN"}')).toBe('DOWN');
    expect(parseMoveFomResponse('{"move": "STAY"}')).toBe('STAY');
  });

  it('extracts move from text with extra content', () => {
    expect(parseMoveFomResponse('Sure! {"move": "UP"}')).toBe('UP');
    expect(parseMoveFomResponse('```json\n{"move": "DOWN"}\n```')).toBe('DOWN');
  });

  it('extracts bare keywords', () => {
    expect(parseMoveFomResponse('UP')).toBe('UP');
    expect(parseMoveFomResponse('I think DOWN')).toBe('DOWN');
  });

  it('returns STAY for unparseable responses', () => {
    expect(parseMoveFomResponse('')).toBe('STAY');
    expect(parseMoveFomResponse('I am not sure what to do')).toBe('STAY');
    expect(parseMoveFomResponse('{"invalid": true}')).toBe('STAY');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -w server`
Expected: FAIL — module not found

**Step 3: Implement base adapter with parsing logic**

`server/src/adapters/base.ts`:

```typescript
import type { LLMAdapter, LLMGameState, MoveResponse, MoveDirection, TrashTalkContext, TokenUsage } from '../types.js';
import { buildMovePrompt } from '../prompts/move.js';
import { buildTrashTalkPrompt } from '../prompts/trash-talk.js';

export function parseMoveFomResponse(raw: string): MoveDirection {
  // Try JSON parse first
  try {
    const json = JSON.parse(raw);
    if (json.move && ['UP', 'DOWN', 'STAY'].includes(json.move.toUpperCase())) {
      return json.move.toUpperCase() as MoveDirection;
    }
  } catch {
    // Try to extract JSON from text
    const jsonMatch = raw.match(/\{[^}]*"move"\s*:\s*"(UP|DOWN|STAY)"[^}]*\}/i);
    if (jsonMatch) {
      return jsonMatch[1].toUpperCase() as MoveDirection;
    }
  }

  // Try bare keyword extraction
  const upper = raw.toUpperCase();
  if (upper.includes('UP') && !upper.includes('DOWN')) return 'UP';
  if (upper.includes('DOWN') && !upper.includes('UP')) return 'DOWN';

  return 'STAY';
}

export function truncateTrashTalk(message: string): string {
  const cleaned = message.replace(/^["']|["']$/g, '').trim();
  return cleaned.length > 150 ? cleaned.slice(0, 147) + '...' : cleaned;
}

export abstract class BaseAdapter implements LLMAdapter {
  abstract provider: string;
  model: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected tokens: TokenUsage = { input: 0, output: 0 };
  protected timeoutMs = 2000;

  constructor(model: string, apiKey: string, baseUrl: string) {
    this.model = model;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }>;

  async getMove(gameState: LLMGameState): Promise<MoveResponse> {
    const { system, user } = buildMovePrompt(gameState);
    try {
      const response = await this.withTimeout(this.callLLM(system, user));
      if (response.usage) {
        this.tokens.input += response.usage.input;
        this.tokens.output += response.usage.output;
      }
      const move = parseMoveFomResponse(response.content);
      return { move, raw: response.content };
    } catch (error) {
      return { move: 'STAY', error: true, raw: String(error) };
    }
  }

  async getTrashTalk(context: TrashTalkContext): Promise<string> {
    const { system, user } = buildTrashTalkPrompt(context);
    try {
      const response = await this.withTimeout(this.callLLM(system, user));
      if (response.usage) {
        this.tokens.input += response.usage.input;
        this.tokens.output += response.usage.output;
      }
      return truncateTrashTalk(response.content);
    } catch {
      return '';
    }
  }

  getTokensUsed(): TokenUsage {
    return { ...this.tokens };
  }

  abstract testConnection(apiKey: string): Promise<{ success: boolean; error?: string }>;

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM request timed out')), this.timeoutMs)
      ),
    ]);
  }
}
```

**Step 4: Implement OpenAI-compatible adapter**

`server/src/adapters/openai-compatible.ts`:

```typescript
import { BaseAdapter } from './base.js';

export class OpenAICompatibleAdapter extends BaseAdapter {
  provider: string;

  constructor(provider: string, model: string, apiKey: string, baseUrl: string) {
    super(model, apiKey, baseUrl);
    this.provider = provider;
  }

  async callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 60,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${this.provider} API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage
      ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0 }
      : { input: Math.ceil(system.length + user.length) / 4, output: Math.ceil(content.length / 4) };

    return { content, usage };
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Say "ok"' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
```

**Step 5: Run tests to verify they pass**

Run: `npm test -w server`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add server/src/adapters/base.ts server/src/adapters/openai-compatible.ts server/src/__tests__/adapters.test.ts
git commit -m "feat: add base adapter with parsing/retry and OpenAI-compatible adapter (TDD)"
```

---

### Task 10: Anthropic and Google Adapters

**Files:**
- Create: `server/src/adapters/anthropic.ts`
- Create: `server/src/adapters/google.ts`

**Step 1: Implement Anthropic adapter** (Messages API format)

```typescript
import { BaseAdapter } from './base.js';

export class AnthropicAdapter extends BaseAdapter {
  provider = 'anthropic';

  constructor(model: string, apiKey: string) {
    super(model, apiKey, 'https://api.anthropic.com/v1');
  }

  async callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 60,
        temperature: 0.3,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';
    const usage = data.usage
      ? { input: data.usage.input_tokens ?? 0, output: data.usage.output_tokens ?? 0 }
      : undefined;

    return { content, usage };
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Say "ok"' }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
```

**Step 2: Implement Google Gemini adapter**

```typescript
import { BaseAdapter } from './base.js';

export class GoogleAdapter extends BaseAdapter {
  provider = 'google';

  constructor(model: string, apiKey: string) {
    super(model, apiKey, 'https://generativelanguage.googleapis.com/v1beta');
  }

  async callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            maxOutputTokens: 60,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data.usageMetadata
      ? { input: data.usageMetadata.promptTokenCount ?? 0, output: data.usageMetadata.candidatesTokenCount ?? 0 }
      : undefined;

    return { content, usage };
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Say "ok"' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
```

**Step 3: Commit**

```bash
git add server/src/adapters/anthropic.ts server/src/adapters/google.ts
git commit -m "feat: add Anthropic and Google Gemini custom adapters"
```

---

### Task 11: All OpenAI-Compatible Provider Adapters

**Files:**
- Create: `server/src/adapters/openai.ts`
- Create: `server/src/adapters/xai.ts`
- Create: `server/src/adapters/mistral.ts`
- Create: `server/src/adapters/deepseek.ts`
- Create: `server/src/adapters/moonshot.ts`
- Create: `server/src/adapters/cohere.ts`
- Create: `server/src/adapters/qwen.ts`
- Create: `server/src/adapters/openrouter.ts`
- Create: `server/src/adapters/ollama.ts`
- Create: `server/src/adapters/index.ts`

**Step 1: Create each provider adapter**

Each one is a thin wrapper around `OpenAICompatibleAdapter`. Example pattern — `server/src/adapters/openai.ts`:

```typescript
import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class OpenAIAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('openai', model, apiKey, 'https://api.openai.com/v1');
  }
}
```

Repeat this pattern for each provider, using the base URLs from the model registry:
- `xai.ts`: provider `'xai'`, baseUrl `'https://api.x.ai/v1'`
- `mistral.ts`: provider `'mistral'`, baseUrl `'https://api.mistral.ai/v1'`
- `deepseek.ts`: provider `'deepseek'`, baseUrl `'https://api.deepseek.com/v1'`
- `moonshot.ts`: provider `'moonshot'`, baseUrl `'https://api.moonshot.ai/v1'`
- `cohere.ts`: provider `'cohere'`, baseUrl `'https://api.cohere.ai/compatibility/v1'`
- `qwen.ts`: provider `'qwen'`, baseUrl `'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'`
- `openrouter.ts`: provider `'openrouter'`, baseUrl `'https://openrouter.ai/api/v1'`
- `ollama.ts`: provider `'ollama'`, baseUrl `'http://localhost:11434/v1'`, pass empty string for apiKey

**Step 2: Create adapter factory** — `server/src/adapters/index.ts`:

```typescript
import type { LLMAdapter } from '../types.js';
import { OpenAIAdapter } from './openai.js';
import { AnthropicAdapter } from './anthropic.js';
import { GoogleAdapter } from './google.js';
import { XAIAdapter } from './xai.js';
import { MistralAdapter } from './mistral.js';
import { DeepSeekAdapter } from './deepseek.js';
import { MoonshotAdapter } from './moonshot.js';
import { CohereAdapter } from './cohere.js';
import { QwenAdapter } from './qwen.js';
import { OpenRouterAdapter } from './openrouter.js';
import { OllamaAdapter } from './ollama.js';

export function createAdapter(provider: string, model: string, apiKey: string): LLMAdapter {
  switch (provider) {
    case 'openai': return new OpenAIAdapter(model, apiKey);
    case 'anthropic': return new AnthropicAdapter(model, apiKey);
    case 'google': return new GoogleAdapter(model, apiKey);
    case 'xai': return new XAIAdapter(model, apiKey);
    case 'mistral': return new MistralAdapter(model, apiKey);
    case 'deepseek': return new DeepSeekAdapter(model, apiKey);
    case 'moonshot': return new MoonshotAdapter(model, apiKey);
    case 'cohere': return new CohereAdapter(model, apiKey);
    case 'qwen': return new QwenAdapter(model, apiKey);
    case 'openrouter': return new OpenRouterAdapter(model, apiKey);
    case 'ollama': return new OllamaAdapter(model);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

**Step 3: Commit**

```bash
git add server/src/adapters/
git commit -m "feat: add all 11 provider adapters with factory function"
```

---

## Phase 4: Match Orchestration

### Task 12: Match Manager

**Files:**
- Create: `server/src/match-manager.ts`
- Modify: `server/src/index.ts` (wire up socket events)

**Step 1: Implement MatchManager**

`server/src/match-manager.ts`:

```typescript
import type { Socket } from 'socket.io';
import type {
  MatchConfig, GameState, LLMGameState, LLMAdapter,
  PlayerStats, MatchStats, TrashTalkMessage, MoveDirection,
  ServerToClientEvents, ClientToServerEvents,
} from './types.js';
import { GameEngine } from './game-engine.js';
import { createAdapter } from './adapters/index.js';
import { estimateCost } from './pricing.js';

export class MatchManager {
  private engine: GameEngine;
  private config: MatchConfig;
  private socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  private adapters: { left?: LLMAdapter; right?: LLMAdapter } = {};
  private gameLoopInterval?: ReturnType<typeof setInterval>;
  private queryInterval?: ReturnType<typeof setInterval>;
  private responseTimes: { left: number[]; right: number[] } = { left: [], right: [] };
  private invalidResponses: { left: number; right: number } = { left: 0, right: 0 };
  private totalQueries: { left: number; right: number } = { left: 0, right: 0 };
  private trashTalkLog: TrashTalkMessage[] = [];
  private lastTrashTalk: { left: string; right: string } = { left: '', right: '' };
  private matchStartTime: number = 0;

  constructor(socket: Socket<ClientToServerEvents, ServerToClientEvents>, config: MatchConfig) {
    this.socket = socket;
    this.config = config;
    this.engine = new GameEngine({
      pointsToWin: config.settings.pointsToWin,
      timeLimitSeconds: config.settings.timeLimitSeconds,
      ballSpeedMultiplier: config.settings.ballSpeedMultiplier,
    });

    // Create adapters for AI players
    for (const side of ['left', 'right'] as const) {
      const player = config.players[side];
      if (player.type === 'ai' && player.provider && player.model) {
        this.adapters[side] = createAdapter(player.provider, player.model, player.apiKey ?? '');
      }
    }
  }

  start(): void {
    this.matchStartTime = Date.now();
    this.engine.start();

    // 60fps game loop
    this.gameLoopInterval = setInterval(() => {
      this.engine.tick();
      const state = this.engine.getState();
      this.socket.emit('gameState', state);

      if (state.status === 'finished') {
        this.stop();
        this.socket.emit('matchEnd', this.getStats());
      }
    }, 1000 / 60);

    // LLM query loop
    this.queryInterval = setInterval(() => {
      this.queryLLMs();
    }, this.config.settings.queryIntervalMs);

    this.socket.emit('matchStart');
  }

  private async queryLLMs(): Promise<void> {
    const state = this.engine.getState();
    if (state.status !== 'playing') return;

    const prevScore = { left: state.score.left, right: state.score.right };

    const queries = (['left', 'right'] as const).map(async (side) => {
      if (this.config.players[side].type !== 'ai' || !this.adapters[side]) return;

      const llmState = this.buildLLMState(state, side);
      this.totalQueries[side]++;

      const startTime = Date.now();
      const response = await this.adapters[side]!.getMove(llmState);
      this.responseTimes[side].push(Date.now() - startTime);

      if (response.error) {
        this.invalidResponses[side]++;
      }

      this.applyMove(side, response.move);
    });

    await Promise.allSettled(queries);

    // Check if someone scored — trigger trash talk
    const newState = this.engine.getState();
    const scorer = this.engine.getLastScorer();
    if (scorer && this.config.settings.trashTalkEnabled &&
        (newState.score.left !== prevScore.left || newState.score.right !== prevScore.right)) {
      this.generateTrashTalk(scorer, newState);
    }
  }

  private buildLLMState(state: GameState, side: 'left' | 'right'): LLMGameState {
    const isLeft = side === 'left';
    return {
      ball: {
        x: isLeft ? state.ball.x : 1 - state.ball.x,
        y: state.ball.y,
        dx: isLeft ? state.ball.dx : -state.ball.dx,
        dy: state.ball.dy,
      },
      your_paddle_y: state.paddles[side].y,
      opponent_paddle_y: state.paddles[isLeft ? 'right' : 'left'].y,
      score: {
        you: state.score[side],
        opponent: state.score[isLeft ? 'right' : 'left'],
      },
      game_time_remaining_seconds: Math.round(state.timeRemainingSeconds),
    };
  }

  private applyMove(side: 'left' | 'right', move: MoveDirection): void {
    const current = this.engine.getState().paddles[side].y;
    const step = 0.08;
    switch (move) {
      case 'UP': this.engine.setPaddleTarget(side, current - step); break;
      case 'DOWN': this.engine.setPaddleTarget(side, current + step); break;
      case 'STAY': break;
    }
  }

  handleHumanInput(side: 'left' | 'right', direction: MoveDirection): void {
    if (this.config.players[side].type !== 'human') return;
    this.applyMove(side, direction);
  }

  private async generateTrashTalk(scorer: 'left' | 'right', state: GameState): Promise<void> {
    const talks = (['left', 'right'] as const).map(async (side) => {
      if (!this.adapters[side]) return;
      const opponent = side === 'left' ? 'right' : 'left';
      const message = await this.adapters[side]!.getTrashTalk({
        yourScore: state.score[side],
        opponentScore: state.score[opponent],
        whoScored: scorer === side ? 'you' : 'opponent',
        opponentLastMessage: this.lastTrashTalk[opponent],
        modelName: this.config.players[side].name,
      });

      if (message) {
        this.lastTrashTalk[side] = message;
        const msg: TrashTalkMessage = {
          side,
          modelName: this.config.players[side].name,
          message,
          timestamp: Date.now(),
        };
        this.trashTalkLog.push(msg);
        this.socket.emit('trashTalk', msg);
      }
    });

    await Promise.allSettled(talks);
  }

  pause(): void { this.engine.pause(); }
  resume(): void { this.engine.resume(); }

  stop(): void {
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    if (this.queryInterval) clearInterval(this.queryInterval);
  }

  private getStats(): MatchStats {
    const buildPlayerStats = (side: 'left' | 'right'): PlayerStats => {
      const tokens = this.adapters[side]?.getTokensUsed() ?? { input: 0, output: 0 };
      const times = this.responseTimes[side];
      const model = this.config.players[side].model ?? '';
      return {
        tokensUsed: tokens,
        estimatedCost: estimateCost(model, tokens) ?? 0,
        avgResponseTimeMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        fastestResponseMs: times.length ? Math.min(...times) : 0,
        slowestResponseMs: times.length ? Math.max(...times) : 0,
        invalidResponses: this.invalidResponses[side],
        totalQueries: this.totalQueries[side],
      };
    };

    return {
      left: buildPlayerStats('left'),
      right: buildPlayerStats('right'),
      trashTalkLog: this.trashTalkLog,
      durationSeconds: (Date.now() - this.matchStartTime) / 1000,
    };
  }
}
```

**Step 2: Wire up socket events in server/src/index.ts**

Update the socket connection handler to:

```typescript
import { MatchManager } from './match-manager.js';
import { PROVIDERS } from './models.js';
import { createAdapter } from './adapters/index.js';

// Inside io.on('connection', ...) handler:

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

// Add providers endpoint for client
app.get('/api/providers', (_req, res) => {
  res.json(PROVIDERS);
});
```

**Step 3: Verify server compiles and starts**

Run: `npm run dev -w server`
Expected: Server starts without errors

**Step 4: Commit**

```bash
git add server/src/match-manager.ts server/src/index.ts
git commit -m "feat: add match manager and wire up socket events"
```

---

## Phase 5: Client

### Task 13: Client Shell — App, Main, and Global Styles

**Files:**
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/styles/global.css`
- Create: `client/src/types.ts`

**Step 1: Create client types** (mirrors server types needed by client)

`client/src/types.ts` — Copy the type definitions from `server/src/types.ts` that the client needs (GameState, MatchConfig, MatchStats, TrashTalkMessage, ProviderInfo, ModelInfo, PlayerConfig, PlayerType, MoveDirection, ServerToClientEvents, ClientToServerEvents, PlayerStats, TokenUsage). This avoids a shared package dependency for now. (Alternatively, just re-export all types from the server types file — since both are in the same repo, a simple relative import via TypeScript path mapping or copy is fine.)

For simplicity, create `client/src/types.ts` as a copy of all the type interfaces/types from `server/src/types.ts`.

**Step 2: Create global styles**

`client/src/styles/global.css`:

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a2e;
  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --cyan: #00ffff;
  --magenta: #ff00ff;
  --cyan-dim: #00888a;
  --magenta-dim: #88008a;
  --green: #00ff88;
  --red: #ff4444;
  --yellow: #ffaa00;
  --border: #2a2a3e;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

button {
  cursor: pointer;
  font-family: var(--font-sans);
}

input, select {
  font-family: var(--font-mono);
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
```

**Step 3: Create main.tsx entry point**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Step 4: Create App.tsx with screen routing**

```tsx
import { useState } from 'react';
import type { MatchConfig, MatchStats, GameState, TrashTalkMessage } from './types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameCanvas';
import PostGameScreen from './components/PostGameScreen';
import { useGameSocket } from './hooks/useGameSocket';

type Screen = 'setup' | 'game' | 'postgame';

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  const {
    gameState,
    trashTalkLog,
    isConnected,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    sendHumanInput,
    testConnection,
  } = useGameSocket({
    onMatchEnd: (stats) => {
      setMatchStats(stats);
      setScreen('postgame');
    },
  });

  const handleStartMatch = (config: MatchConfig) => {
    setMatchConfig(config);
    startMatch(config);
    setScreen('game');
  };

  const handleEndMatch = () => {
    endMatch();
    setScreen('setup');
  };

  const handleRematch = () => {
    if (matchConfig) {
      startMatch(matchConfig);
      setScreen('game');
    }
  };

  return (
    <div>
      {screen === 'setup' && (
        <SetupScreen
          onStartMatch={handleStartMatch}
          isConnected={isConnected}
          testConnection={testConnection}
        />
      )}
      {screen === 'game' && gameState && (
        <GameScreen
          gameState={gameState}
          matchConfig={matchConfig!}
          trashTalkLog={trashTalkLog}
          onPause={pauseMatch}
          onResume={resumeMatch}
          onEndMatch={handleEndMatch}
          onHumanInput={sendHumanInput}
        />
      )}
      {screen === 'postgame' && matchStats && (
        <PostGameScreen
          stats={matchStats}
          gameState={gameState!}
          matchConfig={matchConfig!}
          onRematch={handleRematch}
          onNewMatch={() => setScreen('setup')}
        />
      )}
    </div>
  );
}
```

**Step 5: Verify client compiles** (will have import errors for components not yet created — that's OK, we'll create stubs)

Create minimal stub files so the client compiles. Each component can just return a `<div>` placeholder. The hook can return empty stubs. These will be fully implemented in subsequent tasks.

**Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: add client shell — App, global styles, types, screen routing"
```

---

### Task 14: useGameSocket Hook

**Files:**
- Create: `client/src/hooks/useGameSocket.ts`

**Step 1: Implement the socket.io hook**

```typescript
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  GameState, MatchConfig, MatchStats, TrashTalkMessage, MoveDirection,
  ServerToClientEvents, ClientToServerEvents,
} from '../types';

interface UseGameSocketOptions {
  onMatchEnd: (stats: MatchStats) => void;
}

export function useGameSocket({ onMatchEnd }: UseGameSocketOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [trashTalkLog, setTrashTalkLog] = useState<TrashTalkMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('gameState', (state) => setGameState(state));
    socket.on('trashTalk', (msg) => setTrashTalkLog((prev) => [...prev, msg]));
    socket.on('matchStart', () => setTrashTalkLog([]));
    socket.on('matchEnd', (stats) => onMatchEnd(stats));

    return () => { socket.disconnect(); };
  }, []);

  const startMatch = useCallback((config: MatchConfig) => {
    setTrashTalkLog([]);
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
      socketRef.current?.once('connectionTest', (result) => {
        if (result.provider === provider) {
          resolve({ success: result.success, error: result.error });
        }
      });
      // Timeout after 10 seconds
      setTimeout(() => resolve({ success: false, error: 'Connection test timed out' }), 10000);
    });
  }, []);

  return {
    gameState,
    trashTalkLog,
    isConnected,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    sendHumanInput,
    testConnection,
  };
}
```

**Step 2: Commit**

```bash
git add client/src/hooks/useGameSocket.ts
git commit -m "feat: add useGameSocket hook for real-time server communication"
```

---

### Task 15: Setup Screen

**Files:**
- Create: `client/src/components/SetupScreen.tsx`
- Create: `client/src/components/ApiKeyInput.tsx`
- Create: `client/src/styles/setup.css`

**Step 1: Implement SetupScreen**

This is the largest UI component. It should include:
- Title/logo (ASCII art style using monospace text or a styled heading)
- Two side-by-side player config panels
- Each panel: AI/Human toggle, provider dropdown, model dropdown, API key input, player name input
- Settings section: points to win, time limit, query interval slider, trash talk toggle, ball speed, CRT toggle
- START MATCH button (disabled if missing required API keys or no connection)
- Fetch providers from `/api/providers` on mount or use a bundled copy of the registry
- Store API keys in localStorage per provider
- All styling using CSS with neon cyan/magenta theme

The SetupScreen should manage local state for both players' configuration and game settings, then pass the complete `MatchConfig` to `onStartMatch` when the button is clicked.

Key behaviors:
- When provider changes, auto-select first model, load API key from localStorage
- When model changes, update player name to model's displayName
- "Test Connection" calls the `testConnection` prop and shows success/failure indicator
- Human players don't show provider/model/API key fields

CSS should use CSS modules or a plain `.css` import. Keep the retro arcade aesthetic.

**Step 2: Implement ApiKeyInput**

Reusable component with:
- Password input with show/hide toggle button
- "Test" button that triggers connection test
- Status indicator (idle, testing, success, failure)

**Step 3: Verify it renders**

Run: `npm run dev` (from root)
Expected: Both client and server start. Opening http://localhost:5173 shows the setup screen.

**Step 4: Commit**

```bash
git add client/src/components/SetupScreen.tsx client/src/components/ApiKeyInput.tsx client/src/styles/setup.css
git commit -m "feat: add setup screen with player config, settings, and API key management"
```

---

### Task 16: Game Canvas

**Files:**
- Create: `client/src/components/GameCanvas.tsx`  (rename from GameScreen — this is the full game view)
- Create: `client/src/styles/game.css`

**Step 1: Implement GameCanvas/GameScreen component**

This component receives `gameState` and renders the game. It includes:

**Canvas rendering (requestAnimationFrame loop):**
- Dark background with optional CRT scanline overlay
- Center dashed line
- Two paddles (cyan left, magenta right) — rectangles positioned by `gameState.paddles`
- Ball (white circle) at `gameState.ball.x/y`
- Score display at top center
- Player name labels on each side

**Canvas coordinate mapping:**
- Convert normalized 0-1 coordinates to pixel coordinates based on canvas size
- Responsive: canvas fills available space while maintaining aspect ratio (roughly 4:3 or 16:10)

**Trash talk speech bubbles:**
- Rendered as HTML overlays positioned relative to the canvas (not drawn on canvas)
- Typewriter animation effect: reveal text character by character over ~500ms
- Show the most recent message per side, fade out after 3-4 seconds

**Controls overlay (HTML, not canvas):**
- Pause/Resume button
- End Match button
- Side panel toggle button

**Keyboard input for human players:**
- Listen for W/S or ArrowUp/ArrowDown keydown/keyup events
- While key is held, continuously send humanInput events at ~60fps
- Clean up listeners on unmount

**CRT effect:**
- CSS-based scanline overlay on the canvas container
- Slight vignette effect at edges
- Toggle via a prop (setting from match config)

**Step 2: Commit**

```bash
git add client/src/components/GameCanvas.tsx client/src/styles/game.css
git commit -m "feat: add game canvas with paddle/ball rendering, keyboard input, and CRT effect"
```

---

### Task 17: Stats Panel and Trash Talk Log

**Files:**
- Create: `client/src/components/StatsPanel.tsx`
- Create: `client/src/components/TrashTalkLog.tsx`
- Create: `client/src/styles/stats.css`

**Step 1: Implement StatsPanel**

Collapsible side panel showing live stats during game:
- Per player (cyan/magenta themed):
  - Token usage (input / output)
  - Estimated cost ($0.0000 format)
  - Average response time (ms)
- Displayed in a table/grid layout with monospace font
- Updates in real-time from adapter token tracking (stats need to be emitted via socket — add a `stats` event or include in gameState)

Note: The current architecture tracks stats server-side in MatchManager. Add a periodic stats emission (every 1-2 seconds) via socket, or include token counts in the gameState emission. Simplest approach: add a `playerStats` field to the gameState emission or a separate `statsUpdate` socket event.

**Step 2: Implement TrashTalkLog**

Scrollable log of all trash talk messages:
- Each message shows model name, side color indicator, and message text
- Auto-scrolls to bottom on new message
- Styled with speech-bubble-like appearance per message

**Step 3: Commit**

```bash
git add client/src/components/StatsPanel.tsx client/src/components/TrashTalkLog.tsx client/src/styles/stats.css
git commit -m "feat: add stats panel and trash talk log sidebar components"
```

---

### Task 18: Post-Game Screen

**Files:**
- Create: `client/src/components/PostGameScreen.tsx`
- Create: `client/src/styles/postgame.css`

**Step 1: Implement PostGameScreen**

- Winner announcement header with player name and "WINS!" (or "DRAW!")
- Confetti animation: use canvas-based particles (simple: spawn ~100 particles with random velocities, colors matching cyan/magenta, apply gravity, render in a requestAnimationFrame loop, clean up after 3 seconds)
- Final score display (large, centered)
- Stats comparison table:
  - Two columns (left player, right player)
  - Rows: Total tokens (input+output), estimated cost, avg response time, fastest/slowest response, invalid responses
  - Monospace font, color-coded
- "Best Trash Talk" section: last 3-5 messages from the trash talk log
- Action buttons:
  - "Rematch" (same config)
  - "New Match" (back to setup)
  - "Share Results" — builds a formatted text summary and copies to clipboard using `navigator.clipboard.writeText()`

**Share format:**
```
🏓 AI Paddle Battle Results
{Player1Name} vs {Player2Name}
Score: {left} - {right}
Winner: {winnerName}

{Player1Name}: {tokens} tokens, ${cost}
{Player2Name}: {tokens} tokens, ${cost}

Play at: github.com/cscull/AI-Paddle-Battle
```

**Step 2: Commit**

```bash
git add client/src/components/PostGameScreen.tsx client/src/styles/postgame.css
git commit -m "feat: add post-game screen with stats, confetti, and share results"
```

---

### Task 19: Sound Manager

**Files:**
- Create: `client/src/audio/SoundManager.ts`

**Step 1: Implement SoundManager using Web Audio API**

```typescript
export class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted: boolean = false;

  get muted() { return this._muted; }

  private getContext(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this._muted = muted;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
    if (this._muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  paddleHit() { this.playTone(440, 0.08); }
  wallHit() { this.playTone(300, 0.06); }
  score() { this.playTone(660, 0.15, 'sine', 0.2); }
  gameStart() {
    this.playTone(440, 0.1);
    setTimeout(() => this.playTone(550, 0.1), 120);
    setTimeout(() => this.playTone(660, 0.2), 240);
  }
  gameEnd() {
    this.playTone(660, 0.15);
    setTimeout(() => this.playTone(550, 0.15), 150);
    setTimeout(() => this.playTone(440, 0.3), 300);
  }
}

export const soundManager = new SoundManager();
```

**Step 2: Integrate with GameCanvas**

In the GameCanvas component, detect state changes (score change, ball collision events) and call the appropriate sound methods. Score changes can be detected by comparing previous and current `gameState.score`. Ball collisions are harder — either:
- Add collision event flags to the game state emission (simplest: `lastEvent: 'paddleHit' | 'wallHit' | null` field on GameState)
- Or detect paddle proximity heuristically on the client side

Recommend adding a `lastEvent` field to GameState on the server side.

**Step 3: Commit**

```bash
git add client/src/audio/SoundManager.ts
git commit -m "feat: add retro sound effects using Web Audio API"
```

---

## Phase 6: Integration and Polish

### Task 20: End-to-End Integration and Bug Fixing

**Files:**
- Modify: various files as needed

**Step 1: Start the full app**

Run: `npm run dev` from root
Expected: Client at http://localhost:5173, server at http://localhost:3001

**Step 2: Test the complete flow**

1. Open browser to http://localhost:5173
2. Verify setup screen renders with all providers and models
3. Select two AI players (or use Ollama if available locally)
4. Enter API keys, test connections
5. Start a match
6. Verify: canvas renders, paddles move, ball bounces, score updates
7. Verify: trash talk appears (if enabled)
8. Verify: game ends correctly when score or time limit reached
9. Verify: post-game screen shows stats
10. Verify: rematch and new match buttons work
11. Test human vs AI mode with keyboard
12. Test sound effects (mute toggle)
13. Test pause/resume

**Step 3: Fix any issues found**

Debug and fix any integration issues. Common things to check:
- Socket connection timing (client may connect before server is ready)
- Canvas sizing/responsiveness
- Human input latency
- Score edge cases
- TypeScript compilation errors

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```

---

### Task 21: README and Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/adding-providers.md`

**Step 1: Write README.md**

Include:
- Project name and description
- Screenshot/GIF placeholder (`![AI Paddle Battle](docs/screenshots/gameplay.png)`)
- "Why This Exists" section
- Quick Start: `git clone`, `npm install`, `npm run dev`
- API key configuration (which providers, where to enter keys)
- Ollama setup for free local play
- Brief architecture overview
- Link to `docs/adding-providers.md`
- Token usage expectations (~500-2000 tokens per match for move queries, ~200-500 for trash talk per point)
- Contributing section
- MIT License badge

**Step 2: Write adding-providers.md**

Guide for contributors:
1. Add provider to `server/src/models.ts`
2. If OpenAI-compatible: create thin adapter extending `OpenAICompatibleAdapter`
3. If custom API: extend `BaseAdapter` and implement `callLLM` and `testConnection`
4. Add to factory in `server/src/adapters/index.ts`
5. Add pricing to `server/src/pricing.ts`
6. Add env var to `.env.example`

**Step 3: Commit**

```bash
git add README.md docs/adding-providers.md
git commit -m "docs: add README and provider contribution guide"
```

---

### Task 22: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md with project-specific guidance**

Now that the project has structure, update CLAUDE.md with:
- Build/dev/test commands
- Architecture overview
- Key file locations
- Project conventions

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with project architecture and commands"
```

---

## Dependency Graph

```
Task 1 (scaffolding)
├── Task 2 (types) → Task 3 (server entry)
│   ├── Task 4 (engine init) → Task 5 (ball physics) → Task 6 (collisions/scoring)
│   ├── Task 7 (models/pricing)
│   ├── Task 8 (prompts)
│   └── Task 9 (base adapter) → Task 10 (anthropic/google) → Task 11 (all providers)
│       └── Task 12 (match manager) ← depends on Tasks 6, 8, 11
│           └── Task 13 (client shell) → Task 14 (socket hook) → Task 15 (setup)
│               → Task 16 (game canvas) → Task 17 (stats/trash talk)
│               → Task 18 (post-game) → Task 19 (sound)
│                   └── Task 20 (integration testing)
│                       └── Task 21 (README) → Task 22 (CLAUDE.md)
```

## Estimated Scope

- ~22 tasks, roughly 15-20 files to create
- Server: ~8 source files + 11 adapter files + 2 test files
- Client: ~8 component files + 1 hook + 1 audio utility + 4 CSS files
- Docs: README, adding-providers guide, CLAUDE.md update

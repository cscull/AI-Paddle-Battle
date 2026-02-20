# AI Paddle Battle — Design Document

**Date:** 2026-02-20
**Status:** Approved

## Overview

Browser-based game where two LLMs play a paddle-and-ball game against each other in real time, with live trash talk between points. Supports human vs AI mode and retro sound effects.

**Important:** The game is called "AI Paddle Battle" — do NOT use the word "Pong" anywhere (trademarked by Atari).

## Architecture

**Monorepo with npm workspaces:**
- Root `package.json` with `"workspaces": ["client", "server"]`
- `client/` — React + TypeScript + Vite
- `server/` — Node.js + Express + TypeScript + socket.io
- `npm install` at root installs everything
- `npm run dev` starts both client and server concurrently (via `concurrently` dev dep at root)

**Communication:** socket.io WebSocket. Client connects to server; server pushes game state at ~60fps and handles all LLM orchestration. API keys transit via WebSocket at game start, held in memory only for match duration, never persisted server-side.

**Key principle:** All game logic and LLM calls happen server-side. The client is purely a renderer + UI.

## Game Engine & Physics

**Server-side game loop** at 60fps via `setInterval(1000/60)`:
- Ball movement with dx/dy velocity vectors, all coordinates normalized 0.0–1.0
- Wall bouncing (top/bottom), paddle collision detection (left/right)
- Ball speed increases slightly after each rally, resets on score
- First to 7 points or highest after 3 minutes (both configurable)

**LLM query cycle** (decoupled from render loop):
- Configurable interval (100ms–1000ms, default 300ms)
- Send compact JSON game state to both LLMs in parallel each tick
- Parse response (UP/DOWN/STAY), default to STAY on error
- Smooth paddle interpolation toward last commanded position (not instant teleport)
- Paddle speed capped

**Game state sent to LLMs:**
```json
{
  "ball": { "x": 0.5, "y": 0.3, "dx": 0.02, "dy": -0.01 },
  "your_paddle_y": 0.5,
  "opponent_paddle_y": 0.4,
  "score": { "you": 2, "opponent": 3 },
  "game_time_remaining_seconds": 45
}
```

**LLM response:** `{ "move": "UP" | "DOWN" | "STAY" }`

**Human player mode:**
- One side uses keyboard (W/S or Arrow Up/Down) instead of LLM
- Server accepts direct paddle position input from client via WebSocket
- Processed at game loop frame rate (no artificial delay)

## LLM Adapters & Providers

**Key architectural insight:** 8 of 11 providers use OpenAI-compatible APIs. A single `openai-compatible.ts` base adapter handles them all, configured with different base URLs. Only Anthropic and Google need truly custom adapters.

### Adapter Structure

```
server/adapters/
├── base.ts                  # Abstract base: retry, timeout, JSON parsing, token tracking
├── openai-compatible.ts     # Shared adapter for OpenAI-compatible APIs
├── openai.ts                # Extends openai-compatible (native OpenAI)
├── anthropic.ts             # Custom (Messages API)
├── google.ts                # Custom (Gemini API)
├── xai.ts                   # Extends openai-compatible
├── mistral.ts               # Extends openai-compatible
├── deepseek.ts              # Extends openai-compatible
├── moonshot.ts              # Extends openai-compatible
├── cohere.ts                # Extends openai-compatible
├── qwen.ts                  # Extends openai-compatible
├── openrouter.ts            # Extends openai-compatible
└── ollama.ts                # Extends openai-compatible
```

### LLMAdapter Interface

```typescript
interface LLMAdapter {
  provider: string;
  model: string;
  getMove(gameState: GameState): Promise<MoveResponse>;
  getTrashTalk(context: TrashTalkContext): Promise<string>;
  getTokensUsed(): { input: number; output: number };
}
```

### Providers & Models (11 providers, ~55 models)

**OpenAI** — api.openai.com/v1
- gpt-5.2, gpt-5-mini, gpt-5-nano, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o4-mini

**Anthropic** — api.anthropic.com/v1
- claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001

**Google Gemini** — generativelanguage.googleapis.com/v1beta
- gemini-3.1-pro-preview, gemini-3-pro-preview, gemini-3-flash-preview, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite

**xAI (Grok)** — api.x.ai/v1 (OpenAI-compatible)
- grok-4, grok-4-fast-reasoning, grok-4-fast-non-reasoning, grok-4-1-fast-reasoning, grok-4-1-fast-non-reasoning, grok-3-mini-fast-beta

**Mistral** — api.mistral.ai/v1
- mistral-large-2512, mistral-medium-2508, mistral-small-2506, magistral-medium-2506, magistral-small-2506, codestral-2508, ministral-8b-2512, ministral-3b-2512

**DeepSeek** — api.deepseek.com/v1 (OpenAI-compatible)
- deepseek-chat, deepseek-reasoner

**Moonshot AI (Kimi)** — api.moonshot.ai/v1 (OpenAI-compatible)
- kimi-k2.5, kimi-k2-thinking

**Cohere** — api.cohere.ai/compatibility/v1 (OpenAI-compatible)
- command-a-03-2025, command-r-plus-08-2024

**Alibaba (Qwen)** — dashscope-intl.aliyuncs.com/compatible-mode/v1 (OpenAI-compatible)
- qwen3-max, qwen-plus, qwen-turbo, qwq-plus

**OpenRouter** — openrouter.ai/api/v1
- openai/gpt-4.1, anthropic/claude-sonnet-4.6, google/gemini-2.5-flash, mistralai/mistral-large-2512, x-ai/grok-3-mini-fast-beta, deepseek/deepseek-chat, deepseek/deepseek-reasoner, meta-llama/llama-4-maverick, meta-llama/llama-4-scout, qwen/qwen3-235b-a22b, cohere/command-a-03-2025

**Ollama** — localhost:11434/v1 (OpenAI-compatible, no API key)
- llama3.1, llama4-maverick, qwen3, deepseek-r1, mistral, gemma3, phi4

### API Key Management
- Users enter keys in UI per-provider, stored in localStorage
- Keys sent to server via WebSocket at game start, held in memory for match duration only
- Server .env optionally pre-loads keys for self-hosted setups
- "Test Connection" button validates before game start

## UI Design

**Tech:** React + TypeScript + Vite. Minimal deps — socket.io-client for communication.

**Theme:** Dark (#0a0a0f range), neon cyan (#00ffff) Player 1, neon magenta (#ff00ff) Player 2. Monospace for stats, sans-serif for UI. Subtle CRT scanline overlay (toggle-able).

### Setup Screen
- Title/logo at top
- Two side-by-side player config panels (cyan left, magenta right)
  - Player type toggle: AI / Human
  - Provider dropdown → Model dropdown (filtered, display names)
  - API key input with show/hide + "Test Connection"
  - Editable player name (auto-fills with model name)
- Settings: points to win, time limit, query interval slider, trash talk toggle, ball speed, CRT toggle
- START MATCH button

### Game Screen
- Center: HTML5 Canvas — paddles, ball, center dashed line, score at top
- Player labels (model name + provider)
- Trash talk speech bubbles with typewriter animation
- Collapsible side panel: live token usage, cost, avg response time, trash talk log
- Pause/Resume, End Match buttons
- "Thinking..." indicator on paddle timeout

### Post-Game Screen
- Winner announcement with confetti (canvas-based particles, no heavy lib)
- Final score, stats table (tokens, cost, response times, invalid responses)
- Last 3–5 trash talk messages as highlights
- Rematch / New Match / Share Results buttons

### Sound Effects
- Retro beeps via Web Audio API (no audio files)
- Events: ball hit paddle, ball hit wall, score, game start, game end
- Mute toggle, default unmuted

## Trash Talk

- Generated between points — both LLMs queried in parallel after each score
- Max 150 characters per message
- Prompt includes: current score, who scored, opponent's last message, model personality
- Displayed as speech bubbles with typewriter effect + scrollable log in sidebar
- Toggle to disable (saves tokens)
- Content guardrails: witty and competitive, never mean or offensive

## Error Handling

- Invalid LLM response → regex extraction attempt → default STAY, increment error counter
- Timeout (>2s) → STAY, "thinking..." indicator, log
- Rate limiting → exponential backoff with jitter (200/400/800ms), STAY during backoff
- Network error → 1 retry, then STAY with visual indicator
- Invalid API key → caught at "Test Connection", blocks game start
- All errors visible in collapsible debug log panel

## Token Tracking & Cost

- Each adapter tracks input/output tokens from API response metadata
- Estimate via char_count/4 when provider doesn't return counts
- Pricing table in `server/pricing.ts` — per-1M-token costs per model, easy to update
- Ollama and unknown models show "N/A" for cost
- Live cost display during game, breakdown in post-game stats

## Match Orchestration (match-manager.ts)

- Creates both adapters at game start with provided keys
- Runs LLM query loop on configurable interval (decoupled from 60fps physics)
- Queries both LLMs in parallel each tick
- Triggers trash talk after each score (both in parallel)
- Tracks all stats: tokens, costs, response times, error counts
- Emits game state to client every physics frame via socket.io
- Cleans up adapter references and keys when match ends

## Project Structure

```
ai-paddle-battle/
├── package.json              # Root with workspaces
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── LICENSE
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.ts              # Express + socket.io entry
│   ├── game-engine.ts        # Physics, scoring, game loop
│   ├── match-manager.ts      # Orchestrates match between two LLMs
│   ├── adapters/
│   │   ├── base.ts
│   │   ├── openai-compatible.ts
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── google.ts
│   │   ├── xai.ts
│   │   ├── mistral.ts
│   │   ├── deepseek.ts
│   │   ├── moonshot.ts
│   │   ├── cohere.ts
│   │   ├── qwen.ts
│   │   ├── openrouter.ts
│   │   └── ollama.ts
│   ├── prompts/
│   │   ├── move.ts
│   │   └── trash-talk.ts
│   ├── models.ts             # Central model registry
│   ├── pricing.ts            # Token cost lookup
│   └── types.ts              # Shared TypeScript types
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── SetupScreen.tsx
│       │   ├── GameCanvas.tsx
│       │   ├── StatsPanel.tsx
│       │   ├── TrashTalkLog.tsx
│       │   ├── PostGameScreen.tsx
│       │   └── ApiKeyInput.tsx
│       ├── hooks/
│       │   └── useGameSocket.ts
│       ├── audio/
│       │   └── SoundManager.ts
│       ├── styles/
│       └── utils/
└── docs/
    ├── adding-providers.md
    └── plans/
```

## V1 Scope

**Included:**
- AI vs AI gameplay with all 11 providers / ~55 models
- Trash talk system
- Full UI (setup, game, post-game screens)
- Token tracking and cost estimation
- Human vs AI mode (keyboard control)
- Retro sound effects (Web Audio API)

**Deferred to later:**
- Match recording / replay
- Spectator mode
- Tournament mode

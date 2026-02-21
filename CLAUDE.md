# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm install` — Install all dependencies (root, client, server)
- `npm run dev` — Start both client and server in dev mode (client: http://localhost:5173, server: http://localhost:3001)
- `npm run dev -w client` — Start only the Vite dev server
- `npm run dev -w server` — Start only the backend server (tsx watch)
- `npm run build` — Build client and server for production
- `npm test` — Run server-side tests (vitest)
- `npm test -w server` — Run server tests directly
- `npm run test:watch -w server` — Run server tests in watch mode
- `npx tsc --noEmit -p server/tsconfig.json` — Type-check server
- `npx tsc --noEmit -p client/tsconfig.json` — Type-check client

## Architecture

Monorepo with npm workspaces (`client/` and `server/`).

**Server** (Node.js + Express + TypeScript + socket.io):
- `server/src/index.ts` — Express server entry point with socket.io, serves `/api/providers` and `/api/health`
- `server/src/game-engine.ts` — Physics engine running at 60fps: ball movement, wall/paddle collisions, scoring, win conditions. All coordinates normalized 0.0–1.0
- `server/src/match-manager.ts` — Orchestrates a match: creates adapters, runs game loop + LLM query loop, handles trash talk, tracks stats
- `server/src/adapters/` — LLM provider adapters (11 providers). `base.ts` has shared parsing/timeout logic, `openai-compatible.ts` handles 8 providers, `anthropic.ts` and `google.ts` are custom
- `server/src/models.ts` — Central registry of all providers and models
- `server/src/pricing.ts` — Token cost lookup table per model
- `server/src/prompts/` — Prompt builders for move decisions and trash talk
- `server/src/types.ts` — All shared TypeScript interfaces

**Client** (React + TypeScript + Vite):
- `client/src/App.tsx` — Screen routing (setup → game → postgame)
- `client/src/hooks/useGameSocket.ts` — Socket.io hook for all server communication
- `client/src/components/SetupScreen.tsx` — Pre-game config (player selection, API keys, settings)
- `client/src/components/GameScreen.tsx` — HTML5 Canvas game rendering + keyboard input
- `client/src/components/StatsPanel.tsx` — Collapsible sidebar with match info
- `client/src/components/TrashTalkLog.tsx` — Scrollable trash talk message log
- `client/src/components/PostGameScreen.tsx` — Results, stats, confetti, share
- `client/src/audio/SoundManager.ts` — Web Audio API retro sound effects
- `client/src/types.ts` — Client copy of shared types (mirrors server/src/types.ts)

## Key Patterns

- **Adapter pattern for LLM providers**: Most providers use OpenAI-compatible API, so `OpenAICompatibleAdapter` handles them. Only Anthropic (Messages API) and Google (Gemini API) need custom adapters. Adding a new provider = new file in `adapters/`, ~6 lines extending OpenAICompatibleAdapter.
- **Server-authoritative**: All game logic runs server-side. Client is a pure renderer.
- **Normalized coordinates**: All game positions are 0.0–1.0, no pixel values in game logic.
- **API keys**: Never persisted server-side. Stored in browser localStorage, sent to server only during match.
- **No database**: Everything is in-memory during a session.

## Naming

The game is called "AI Paddle Battle" — never use the word "Pong" (trademarked by Atari).

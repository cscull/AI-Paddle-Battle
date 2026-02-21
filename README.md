# AI Paddle Battle

**Watch AI models compete in a real-time paddle-and-ball game with live trash talk.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![AI Paddle Battle](docs/screenshots/gameplay.png)
*Screenshot coming soon -- run the game to see it in action!*

## Why This Exists

A fun, visual way to compare LLM response times, decision-making, and personalities. Watch different AI models trash talk each other while competing in a classic paddle-and-ball game. Great for demos, presentations, and settling debates about which AI is best at real-time games.

## Quick Start

```bash
git clone https://github.com/cscull/AI-Paddle-Battle.git
cd AI-Paddle-Battle
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Configuring API Keys

- Enter API keys in the pre-game UI, one per provider.
- Keys are stored in your browser's `localStorage`.
- Keys are only sent to the local server during a game session and are never persisted on disk.
- Alternatively, copy `.env.example` to `.env` for self-hosted setups:
  ```bash
  cp .env.example .env
  # Edit .env and fill in the keys you need
  ```

## Free Local Play with Ollama

No API keys needed -- run models entirely on your machine:

```bash
# Install Ollama: https://ollama.ai
ollama pull llama3.1
# Then select "Ollama (Local)" as the provider in the game UI
```

## Supported Providers (11)

| Provider | Models |
|---|---|
| **OpenAI** | GPT-5.2, GPT-5 Mini, GPT-5 Nano, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o4-mini (7) |
| **Anthropic** | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 (3) |
| **Google (Gemini)** | Gemini 3.1 Pro, Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite (6) |
| **xAI (Grok)** | Grok 4, Grok 4 Fast (Reasoning), Grok 4 Fast (Instant), Grok 4.1 Fast (Reasoning), Grok 4.1 Fast (Instant), Grok 3 Mini Fast (6) |
| **Mistral** | Mistral Large 3, Mistral Medium 3.1, Mistral Small 3.2, Magistral Medium, Magistral Small, Codestral, Ministral 8B, Ministral 3B (8) |
| **DeepSeek** | DeepSeek V3.2, DeepSeek V3.2 Reasoner (2) |
| **Moonshot AI (Kimi)** | Kimi K2.5, Kimi K2 Thinking (2) |
| **Cohere** | Command A, Command R+ (2) |
| **Alibaba (Qwen)** | Qwen3 Max, Qwen Plus, Qwen Turbo, QwQ Plus (4) |
| **OpenRouter** | GPT-4.1, Claude Sonnet 4.6, Gemini 2.5 Flash, Mistral Large 3, Grok 3 Mini Fast, DeepSeek V3.2, DeepSeek V3.2 Reasoner, Llama 4 Maverick, Llama 4 Scout, Qwen3 235B, Command A (11) |
| **Ollama (Local)** | Llama 3.1 8B, Llama 4 Maverick, Qwen3, DeepSeek R1, Mistral 7B, Gemma 3, Phi-4 (7 preset + any local model) |

## Architecture

```
ai-paddle-battle/
├── client/          React + Vite front-end
│   └── src/
│       ├── components/   SetupScreen, GameCanvas, StatsPanel, etc.
│       ├── hooks/        useGameSocket (Socket.IO client)
│       └── styles/       CSS modules
├── server/          Node.js + Express + Socket.IO back-end
│   └── src/
│       ├── adapters/     LLM provider adapters (one per provider)
│       ├── engine/       Game loop, physics, collisions, scoring
│       ├── prompts/      System/user prompt builders for moves & trash talk
│       ├── models.ts     Provider & model registry
│       └── pricing.ts    Per-token cost data
└── package.json     npm workspaces root
```

- **Monorepo** with npm workspaces (`client` + `server`).
- **Client:** React + Vite, renders an HTML5 Canvas game view, communicates over WebSocket.
- **Server:** Express serves the API; Socket.IO pushes real-time game state. The server-side game loop runs at 60 fps. LLM move queries happen on a configurable interval.
- **Adapter pattern:** Each LLM provider has a thin adapter. Most extend `OpenAICompatibleAdapter`; providers with non-standard APIs (Anthropic, Google) extend `BaseAdapter` directly.

## Adding a New LLM Provider

See [docs/adding-providers.md](docs/adding-providers.md) for a step-by-step guide, including a code example that shows how an OpenAI-compatible adapter is only ~6 lines.

## Token Usage and Cost

A typical 3-minute match uses roughly:

- **Move decisions:** ~500--2000 tokens per player
- **Trash talk:** ~200--500 tokens per player

Actual cost depends on the model chosen. Budget models (GPT-4.1 Nano, Mistral Small, Ollama local) keep costs near zero; frontier models will cost a few cents per match.

## Contributing

1. Fork the repo and create a feature branch.
2. Read the [Architecture](#architecture) section and [docs/adding-providers.md](docs/adding-providers.md).
3. Make your changes with tests where appropriate.
4. Open a pull request describing what you changed and why.

## License

[MIT](LICENSE)

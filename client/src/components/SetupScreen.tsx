import { useState, useCallback } from 'react';
import type { MatchConfig, PlayerConfig, PlayerType } from '../types';
import type { ProviderInfo } from '../types';
import ApiKeyInput from './ApiKeyInput';
import '../styles/setup.css';

// ── Hardcoded provider data (mirrors server/src/models.ts) ──

const PROVIDERS: ProviderInfo[] = [
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

// ── Helpers ──

function getStorageKey(provider: string): string {
  return `apb-apikey-${provider}`;
}

function loadApiKey(provider: string): string {
  try {
    return localStorage.getItem(getStorageKey(provider)) ?? '';
  } catch {
    return '';
  }
}

function saveApiKey(provider: string, key: string): void {
  try {
    if (key) {
      localStorage.setItem(getStorageKey(provider), key);
    } else {
      localStorage.removeItem(getStorageKey(provider));
    }
  } catch {
    // Ignore storage errors
  }
}

// ── Props ──

interface SetupScreenProps {
  onStartMatch: (config: MatchConfig) => void;
  isConnected: boolean;
  testConnection: (provider: string, model: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
}

// ── Player panel state ──

interface PlayerPanelState {
  type: PlayerType;
  provider: string;
  model: string;
  apiKey: string;
  name: string;
}

function makeDefaultPlayer(providerIndex: number): PlayerPanelState {
  const prov = PROVIDERS[providerIndex];
  const model = prov.models[0];
  return {
    type: 'ai',
    provider: prov.id,
    model: model.id,
    apiKey: loadApiKey(prov.id),
    name: model.displayName,
  };
}

// ── Component ──

export default function SetupScreen({ onStartMatch, isConnected, testConnection }: SetupScreenProps) {
  // Player states: left defaults to OpenAI, right defaults to Anthropic
  const [left, setLeft] = useState<PlayerPanelState>(() => makeDefaultPlayer(0));
  const [right, setRight] = useState<PlayerPanelState>(() => makeDefaultPlayer(1));

  // Settings
  const [pointsToWin, setPointsToWin] = useState(7);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(180);
  const [queryIntervalMs, setQueryIntervalMs] = useState(300);
  const [trashTalkEnabled, setTrashTalkEnabled] = useState(true);
  const [ballSpeedMultiplier, setBallSpeedMultiplier] = useState(1.0);

  // ── Validation ──

  const isPlayerReady = useCallback((p: PlayerPanelState): boolean => {
    if (p.type === 'human') return p.name.trim().length > 0;
    const prov = PROVIDERS.find((pr) => pr.id === p.provider);
    if (!prov) return false;
    if (prov.requiresApiKey && !p.apiKey.trim()) return false;
    return p.name.trim().length > 0;
  }, []);

  const canStart = isConnected && isPlayerReady(left) && isPlayerReady(right);

  // ── Handlers ──

  const handleStart = () => {
    if (!canStart) return;

    const toPlayerConfig = (p: PlayerPanelState): PlayerConfig => {
      if (p.type === 'human') {
        return { type: 'human', name: p.name.trim() };
      }
      return {
        type: 'ai',
        name: p.name.trim(),
        provider: p.provider,
        model: p.model,
        apiKey: p.apiKey,
      };
    };

    const config: MatchConfig = {
      players: {
        left: toPlayerConfig(left),
        right: toPlayerConfig(right),
      },
      settings: {
        pointsToWin,
        timeLimitSeconds,
        queryIntervalMs,
        trashTalkEnabled,
        ballSpeedMultiplier,
      },
    };

    onStartMatch(config);
  };

  // ── Player panel updater factory ──

  const makeUpdater = (setter: React.Dispatch<React.SetStateAction<PlayerPanelState>>) => ({
    setType: (type: PlayerType) =>
      setter((prev) => ({ ...prev, type, name: type === 'human' ? '' : prev.name })),
    setProvider: (providerId: string) =>
      setter((prev) => {
        const prov = PROVIDERS.find((p) => p.id === providerId);
        const firstModel = prov?.models[0];
        const apiKey = loadApiKey(providerId);
        return {
          ...prev,
          provider: providerId,
          model: firstModel?.id ?? '',
          apiKey,
          name: firstModel?.displayName ?? '',
        };
      }),
    setModel: (modelId: string) =>
      setter((prev) => {
        const prov = PROVIDERS.find((p) => p.id === prev.provider);
        const model = prov?.models.find((m) => m.id === modelId);
        return { ...prev, model: modelId, name: model?.displayName ?? prev.name };
      }),
    setApiKey: (apiKey: string) =>
      setter((prev) => {
        saveApiKey(prev.provider, apiKey);
        return { ...prev, apiKey };
      }),
    setName: (name: string) => setter((prev) => ({ ...prev, name })),
  });

  const leftUpdater = makeUpdater(setLeft);
  const rightUpdater = makeUpdater(setRight);

  return (
    <div className="setup-screen">
      <header className="setup-header">
        <h1 className="setup-title">AI PADDLE BATTLE</h1>
        <div className="setup-connection-status">
          <span className={`status-dot ${isConnected ? 'status-dot--connected' : 'status-dot--disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="setup-players">
        <PlayerPanel
          side="left"
          state={left}
          updater={leftUpdater}
          testConnection={testConnection}
        />
        <div className="setup-vs">VS</div>
        <PlayerPanel
          side="right"
          state={right}
          updater={rightUpdater}
          testConnection={testConnection}
        />
      </div>

      <SettingsSection
        pointsToWin={pointsToWin}
        setPointsToWin={setPointsToWin}
        timeLimitSeconds={timeLimitSeconds}
        setTimeLimitSeconds={setTimeLimitSeconds}
        queryIntervalMs={queryIntervalMs}
        setQueryIntervalMs={setQueryIntervalMs}
        trashTalkEnabled={trashTalkEnabled}
        setTrashTalkEnabled={setTrashTalkEnabled}
        ballSpeedMultiplier={ballSpeedMultiplier}
        setBallSpeedMultiplier={setBallSpeedMultiplier}
      />

      <div className="setup-actions">
        <button
          className="setup-start-btn"
          disabled={!canStart}
          onClick={handleStart}
        >
          START MATCH
        </button>
        {!isConnected && (
          <p className="setup-start-hint">Waiting for server connection...</p>
        )}
      </div>
    </div>
  );
}

// ── Player Panel ──

interface PlayerUpdater {
  setType: (type: PlayerType) => void;
  setProvider: (providerId: string) => void;
  setModel: (modelId: string) => void;
  setApiKey: (apiKey: string) => void;
  setName: (name: string) => void;
}

interface PlayerPanelProps {
  side: 'left' | 'right';
  state: PlayerPanelState;
  updater: PlayerUpdater;
  testConnection: SetupScreenProps['testConnection'];
}

function PlayerPanel({ side, state, updater, testConnection }: PlayerPanelProps) {
  const provider = PROVIDERS.find((p) => p.id === state.provider);
  const themeClass = side === 'left' ? 'panel--cyan' : 'panel--magenta';
  const label = side === 'left' ? 'Player 1 (Left)' : 'Player 2 (Right)';

  return (
    <div className={`setup-panel ${themeClass}`}>
      <h2 className="panel-label">{label}</h2>

      {/* Type toggle */}
      <div className="panel-type-toggle">
        <button
          className={`type-btn ${state.type === 'ai' ? 'type-btn--active' : ''}`}
          onClick={() => updater.setType('ai')}
        >
          AI
        </button>
        <button
          className={`type-btn ${state.type === 'human' ? 'type-btn--active' : ''}`}
          onClick={() => updater.setType('human')}
        >
          Human
        </button>
      </div>

      {state.type === 'ai' ? (
        <div className="panel-ai-config">
          {/* Provider */}
          <label className="panel-field">
            <span className="panel-field-label">Provider</span>
            <select
              value={state.provider}
              onChange={(e) => updater.setProvider(e.target.value)}
              className="panel-select"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName}</option>
              ))}
            </select>
          </label>

          {/* Model */}
          <label className="panel-field">
            <span className="panel-field-label">Model</span>
            <select
              value={state.model}
              onChange={(e) => updater.setModel(e.target.value)}
              className="panel-select"
            >
              {provider?.models.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </label>

          {/* API Key (only if provider requires it) */}
          {provider?.requiresApiKey && (
            <div className="panel-field">
              <span className="panel-field-label">API Key</span>
              <ApiKeyInput
                provider={state.provider}
                model={state.model}
                value={state.apiKey}
                onChange={updater.setApiKey}
                testConnection={testConnection}
              />
            </div>
          )}

          {/* Player name */}
          <label className="panel-field">
            <span className="panel-field-label">Display Name</span>
            <input
              type="text"
              value={state.name}
              onChange={(e) => updater.setName(e.target.value)}
              className="panel-input"
              placeholder="Player name..."
            />
          </label>
        </div>
      ) : (
        <div className="panel-human-config">
          <label className="panel-field">
            <span className="panel-field-label">Player Name</span>
            <input
              type="text"
              value={state.name}
              onChange={(e) => updater.setName(e.target.value)}
              className="panel-input"
              placeholder="Enter name..."
            />
          </label>
          <p className="panel-controls-hint">
            {side === 'left' ? 'Controls: W / S keys' : 'Controls: Arrow Up / Down keys'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Settings Section ──

interface SettingsSectionProps {
  pointsToWin: number;
  setPointsToWin: (v: number) => void;
  timeLimitSeconds: number;
  setTimeLimitSeconds: (v: number) => void;
  queryIntervalMs: number;
  setQueryIntervalMs: (v: number) => void;
  trashTalkEnabled: boolean;
  setTrashTalkEnabled: (v: boolean) => void;
  ballSpeedMultiplier: number;
  setBallSpeedMultiplier: (v: number) => void;
}

function SettingsSection({
  pointsToWin,
  setPointsToWin,
  timeLimitSeconds,
  setTimeLimitSeconds,
  queryIntervalMs,
  setQueryIntervalMs,
  trashTalkEnabled,
  setTrashTalkEnabled,
  ballSpeedMultiplier,
  setBallSpeedMultiplier,
}: SettingsSectionProps) {
  return (
    <div className="setup-settings">
      <h2 className="settings-title">Match Settings</h2>
      <div className="settings-grid">
        {/* Points to win */}
        <label className="setting-item">
          <span className="setting-label">Points to Win</span>
          <input
            type="number"
            value={pointsToWin}
            onChange={(e) => setPointsToWin(Math.max(1, Math.min(21, Number(e.target.value) || 1)))}
            min={1}
            max={21}
            className="setting-number"
          />
        </label>

        {/* Time limit */}
        <label className="setting-item">
          <span className="setting-label">Time Limit (seconds)</span>
          <input
            type="number"
            value={timeLimitSeconds}
            onChange={(e) => setTimeLimitSeconds(Math.max(30, Math.min(600, Number(e.target.value) || 30)))}
            min={30}
            max={600}
            className="setting-number"
          />
        </label>

        {/* Query interval */}
        <label className="setting-item">
          <span className="setting-label">LLM Query Interval</span>
          <div className="setting-range-row">
            <input
              type="range"
              value={queryIntervalMs}
              onChange={(e) => setQueryIntervalMs(Number(e.target.value))}
              min={100}
              max={1000}
              step={50}
              className="setting-range"
            />
            <span className="setting-range-value">{queryIntervalMs}ms</span>
          </div>
        </label>

        {/* Ball speed */}
        <label className="setting-item">
          <span className="setting-label">Ball Speed Multiplier</span>
          <div className="setting-range-row">
            <input
              type="range"
              value={ballSpeedMultiplier}
              onChange={(e) => setBallSpeedMultiplier(Number(e.target.value))}
              min={0.5}
              max={2.0}
              step={0.1}
              className="setting-range"
            />
            <span className="setting-range-value">{ballSpeedMultiplier.toFixed(1)}x</span>
          </div>
        </label>

        {/* Trash talk */}
        <label className="setting-item setting-item--checkbox">
          <input
            type="checkbox"
            checked={trashTalkEnabled}
            onChange={(e) => setTrashTalkEnabled(e.target.checked)}
            className="setting-checkbox"
          />
          <span className="setting-label">Trash Talk Enabled</span>
        </label>
      </div>
    </div>
  );
}

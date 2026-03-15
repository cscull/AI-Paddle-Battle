import { useState, useEffect, useCallback } from 'react';
import type { MatchConfig, PlayerConfig, PlayerType } from '../types';
import type { ProviderInfo } from '../types';
import ApiKeyInput from './ApiKeyInput';
import '../styles/setup.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';

// ── Helpers ──

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

function makeDefaultPlayer(providers: ProviderInfo[], providerIndex: number): PlayerPanelState {
  const prov = providers[providerIndex] ?? providers[0];
  const model = prov?.models[0];
  return {
    type: 'ai',
    provider: prov?.id ?? '',
    model: model?.id ?? '',
    apiKey: '',
    name: model?.displayName ?? '',
  };
}

// ── Component ──

export default function SetupScreen({ onStartMatch, isConnected, testConnection }: SetupScreenProps) {
  // Fetch providers from server (single source of truth)
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  const [left, setLeft] = useState<PlayerPanelState>({ type: 'ai', provider: '', model: '', apiKey: '', name: '' });
  const [right, setRight] = useState<PlayerPanelState>({ type: 'ai', provider: '', model: '', apiKey: '', name: '' });

  useEffect(() => {
    fetch(`${SERVER_URL}/api/providers`)
      .then((res) => res.json())
      .then((data: ProviderInfo[]) => {
        setProviders(data);
        setLeft(makeDefaultPlayer(data, 0));
        setRight(makeDefaultPlayer(data, 1));
      })
      .catch((err) => console.error('Failed to fetch providers:', err));
  }, []);

  // Settings
  const [pointsToWin, setPointsToWin] = useState(7);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(180);
  const [queryIntervalMs, setQueryIntervalMs] = useState(300);
  const [trashTalkEnabled, setTrashTalkEnabled] = useState(true);
  const [ballSpeedMultiplier, setBallSpeedMultiplier] = useState(1.0);

  // ── Validation ──

  const isPlayerReady = useCallback((p: PlayerPanelState): boolean => {
    if (p.type === 'human') return p.name.trim().length > 0;
    const prov = providers.find((pr) => pr.id === p.provider);
    if (!prov) return false;
    if (prov.requiresApiKey && !p.apiKey.trim()) return false;
    return p.name.trim().length > 0;
  }, [providers]);

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
        const prov = providers.find((p) => p.id === providerId);
        const firstModel = prov?.models[0];
        return {
          ...prev,
          provider: providerId,
          model: firstModel?.id ?? '',
          apiKey: '',
          name: firstModel?.displayName ?? '',
        };
      }),
    setModel: (modelId: string) =>
      setter((prev) => {
        const prov = providers.find((p) => p.id === prev.provider);
        const model = prov?.models.find((m) => m.id === modelId);
        return { ...prev, model: modelId, name: model?.displayName ?? prev.name };
      }),
    setApiKey: (apiKey: string) =>
      setter((prev) => ({ ...prev, apiKey })),
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
          providers={providers}
          testConnection={testConnection}
        />
        <div className="setup-vs">VS</div>
        <PlayerPanel
          side="right"
          state={right}
          updater={rightUpdater}
          providers={providers}
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
  providers: ProviderInfo[];
  testConnection: SetupScreenProps['testConnection'];
}

function PlayerPanel({ side, state, updater, providers, testConnection }: PlayerPanelProps) {
  const provider = providers.find((p) => p.id === state.provider);
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
              {providers.map((p) => (
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

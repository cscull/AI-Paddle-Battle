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

// ── Debug Logging ──

export interface DebugLogEntry {
  timestamp: number;
  side: 'left' | 'right';
  type: 'move' | 'trash_talk' | 'error';
  model: string;
  raw: string;
  parsed?: string;
  fallback?: boolean;
  responseTimeMs?: number;
}

// ── Socket Events ──

export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  trashTalk: (msg: TrashTalkMessage) => void;
  matchStart: () => void;
  matchEnd: (stats: MatchStats) => void;
  error: (msg: string) => void;
  connectionTest: (result: { provider: string; success: boolean; error?: string }) => void;
  debugLog: (entry: DebugLogEntry) => void;
}

export interface ClientToServerEvents {
  startMatch: (config: MatchConfig) => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  endMatch: () => void;
  humanInput: (data: { side: 'left' | 'right'; direction: MoveDirection }) => void;
  testConnection: (data: { provider: string; model: string; apiKey: string }) => void;
}

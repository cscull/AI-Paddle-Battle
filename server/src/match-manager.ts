import type { Socket } from 'socket.io';
import type {
  MatchConfig, GameState, LLMGameState, LLMAdapter,
  PlayerStats, MatchStats, TrashTalkMessage, MoveDirection, DebugLogEntry,
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
  private previousScore = { left: 0, right: 0 };

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

    const queries = (['left', 'right'] as const).map(async (side) => {
      if (this.config.players[side].type !== 'ai' || !this.adapters[side]) return;

      const llmState = this.buildLLMState(state, side);
      this.totalQueries[side]++;

      const startTime = Date.now();
      const response = await this.adapters[side]!.getMove(llmState);
      const responseTimeMs = Date.now() - startTime;
      this.responseTimes[side].push(responseTimeMs);

      if (response.error || response.fallback) {
        this.invalidResponses[side]++;
      }

      // Debug log to server console and client
      const model = this.config.players[side].model ?? 'unknown';
      const rawSnippet = (response.raw ?? '').slice(0, 200);
      const logEntry: DebugLogEntry = {
        timestamp: Date.now(),
        side,
        type: response.error ? 'error' : 'move',
        model,
        raw: rawSnippet,
        parsed: response.move,
        fallback: response.error || response.fallback || false,
        responseTimeMs,
      };

      if (response.error || response.fallback) {
        console.log(`[${side}] ${model} | ${response.parseMethod ?? 'error'} | "${rawSnippet}" → ${response.move} (${responseTimeMs}ms)`);
      }

      this.socket.emit('debugLog', logEntry);
      this.applyMove(side, response.move);
    });

    await Promise.allSettled(queries);

    // Check if someone scored — trigger trash talk
    const newState = this.engine.getState();
    const scorer = this.engine.getLastScorer();
    if (scorer && this.config.settings.trashTalkEnabled &&
        (newState.score.left !== this.previousScore.left || newState.score.right !== this.previousScore.right)) {
      this.previousScore = { left: newState.score.left, right: newState.score.right };
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
    const step = 0.15;
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

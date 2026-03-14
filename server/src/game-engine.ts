import type { GameState, BallState } from './types.js';

// ── Constants ──

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
  PADDLE_SPEED: 0.025,
  MAX_BALL_SPEED: 0.02,
} as const;

// ── Config ──

export interface EngineConfig {
  pointsToWin: number;
  timeLimitSeconds: number;
  ballSpeedMultiplier: number;
}

// ── Game Engine ──

export class GameEngine {
  private state: GameState;
  private config: EngineConfig;
  private paddleTargets: { left: number; right: number };
  private startTime: number | null = null;
  private lastScorer: 'left' | 'right' | null = null;
  private rallyHits: number = 0;

  constructor(config: EngineConfig) {
    this.config = config;
    this.paddleTargets = { left: 0.5, right: 0.5 };
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
    return JSON.parse(JSON.stringify(this.state));
  }

  resetBall(): void {
    // Random angle between -30 and +30 degrees (in radians)
    const angle = ((Math.random() * 60 - 30) * Math.PI) / 180;

    // Random direction: left or right
    const direction = Math.random() < 0.5 ? -1 : 1;

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

  setPaddleTarget(side: 'left' | 'right', y: number): void {
    this.paddleTargets[side] = Math.max(
      GAME_CONSTANTS.FIELD_MIN,
      Math.min(GAME_CONSTANTS.FIELD_MAX, y),
    );
  }

  getLastScorer(): 'left' | 'right' | null {
    return this.lastScorer;
  }

  tick(): void {
    if (this.state.status !== 'playing') {
      return;
    }

    // Update time remaining
    this.updateTime();

    // Move paddles toward targets
    this.movePaddles();

    // Move ball
    this.moveBall();

    // Check wall collisions (top/bottom)
    this.checkWallCollisions();

    // Check paddle collisions
    this.checkPaddleCollisions();

    // Check scoring (ball passed edges)
    this.checkScoring();

    // Check win conditions
    this.checkWinConditions();
  }

  // ── Private helpers ──

  private updateTime(): void {
    // Decrease time by 1/60th of a second (one tick at 60fps)
    this.state.timeRemainingSeconds -= 1 / 60;
    if (this.state.timeRemainingSeconds < 0) {
      this.state.timeRemainingSeconds = 0;
    }
  }

  private movePaddles(): void {
    const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;

    for (const side of ['left', 'right'] as const) {
      const current = this.state.paddles[side].y;
      const target = this.paddleTargets[side];
      const distance = target - current;

      if (Math.abs(distance) < GAME_CONSTANTS.PADDLE_SPEED) {
        this.state.paddles[side].y = target;
      } else {
        this.state.paddles[side].y +=
          Math.sign(distance) * GAME_CONSTANTS.PADDLE_SPEED;
      }

      // Clamp paddle within field bounds
      this.state.paddles[side].y = Math.max(
        GAME_CONSTANTS.FIELD_MIN + halfPaddle,
        Math.min(GAME_CONSTANTS.FIELD_MAX - halfPaddle, this.state.paddles[side].y),
      );
    }
  }

  private moveBall(): void {
    this.state.ball.x += this.state.ball.dx;
    this.state.ball.y += this.state.ball.dy;
  }

  private checkWallCollisions(): void {
    const ball = this.state.ball;
    const radius = GAME_CONSTANTS.BALL_RADIUS;

    // Top wall
    if (ball.y - radius <= GAME_CONSTANTS.FIELD_MIN) {
      ball.dy = Math.abs(ball.dy);
      ball.y = GAME_CONSTANTS.FIELD_MIN + radius;
    }

    // Bottom wall
    if (ball.y + radius >= GAME_CONSTANTS.FIELD_MAX) {
      ball.dy = -Math.abs(ball.dy);
      ball.y = GAME_CONSTANTS.FIELD_MAX - radius;
    }
  }

  private checkPaddleCollisions(): void {
    const ball = this.state.ball;
    const radius = GAME_CONSTANTS.BALL_RADIUS;
    const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;

    // Use crossing-based detection to prevent tunneling at high speeds.
    // Detect the tick when the ball's edge first crosses the paddle face.
    const leftFaceX = GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH;
    const rightFaceX = GAME_CONSTANTS.PADDLE_X_RIGHT - GAME_CONSTANTS.PADDLE_WIDTH;

    // Previous ball position (before moveBall applied dx this tick)
    const prevBallX = ball.x - ball.dx;

    // Left paddle: ball crossing face from right to left
    if (
      ball.dx < 0 &&
      ball.x - radius <= leftFaceX &&
      prevBallX - radius >= leftFaceX &&
      ball.y >= this.state.paddles.left.y - halfPaddle &&
      ball.y <= this.state.paddles.left.y + halfPaddle
    ) {
      this.handlePaddleHit('left');
    }

    // Right paddle: ball crossing face from left to right
    if (
      ball.dx > 0 &&
      ball.x + radius >= rightFaceX &&
      prevBallX + radius <= rightFaceX &&
      ball.y >= this.state.paddles.right.y - halfPaddle &&
      ball.y <= this.state.paddles.right.y + halfPaddle
    ) {
      this.handlePaddleHit('right');
    }
  }

  private handlePaddleHit(side: 'left' | 'right'): void {
    const ball = this.state.ball;
    const paddleY = this.state.paddles[side].y;
    const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;

    // Reverse horizontal direction
    ball.dx = -ball.dx;

    // Apply deflection based on where ball hit the paddle
    const offset = (ball.y - paddleY) / halfPaddle; // -1 to +1
    ball.dy += offset * 0.003;

    // Increment rally hits
    this.rallyHits++;

    // Accelerate ball
    this.accelerateBall();

    // Push ball out of paddle zone to prevent double-hit
    if (side === 'left') {
      ball.x = GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH + GAME_CONSTANTS.BALL_RADIUS;
    } else {
      ball.x = GAME_CONSTANTS.PADDLE_X_RIGHT - GAME_CONSTANTS.PADDLE_WIDTH - GAME_CONSTANTS.BALL_RADIUS;
    }
  }

  private accelerateBall(): void {
    const ball = this.state.ball;
    const maxSpeed = GAME_CONSTANTS.MAX_BALL_SPEED * this.config.ballSpeedMultiplier;

    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    const speedIncrease = 1 + GAME_CONSTANTS.BALL_SPEED_INCREMENT / currentSpeed;

    ball.dx *= speedIncrease;
    ball.dy *= speedIncrease;

    // Cap at max speed
    const newSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (newSpeed > maxSpeed) {
      const scale = maxSpeed / newSpeed;
      ball.dx *= scale;
      ball.dy *= scale;
    }
  }

  private checkScoring(): void {
    const ball = this.state.ball;

    // Ball passed left edge -> right player scores
    if (ball.x <= GAME_CONSTANTS.FIELD_MIN) {
      this.state.score.right++;
      this.lastScorer = 'right';
      this.resetBall();
    }

    // Ball passed right edge -> left player scores
    if (ball.x >= GAME_CONSTANTS.FIELD_MAX) {
      this.state.score.left++;
      this.lastScorer = 'left';
      this.resetBall();
    }
  }

  private checkWinConditions(): void {
    // Check points
    if (this.state.score.left >= this.config.pointsToWin) {
      this.state.status = 'finished';
      this.state.winner = 'left';
      return;
    }
    if (this.state.score.right >= this.config.pointsToWin) {
      this.state.status = 'finished';
      this.state.winner = 'right';
      return;
    }

    // Check time
    if (this.state.timeRemainingSeconds <= 0) {
      this.state.status = 'finished';
      if (this.state.score.left > this.state.score.right) {
        this.state.winner = 'left';
      } else if (this.state.score.right > this.state.score.left) {
        this.state.winner = 'right';
      } else {
        this.state.winner = 'draw';
      }
    }
  }
}

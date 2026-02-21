import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine, GAME_CONSTANTS, EngineConfig } from '../game-engine.js';

const defaultConfig: EngineConfig = {
  pointsToWin: 5,
  timeLimitSeconds: 120,
  ballSpeedMultiplier: 1,
};

function createEngine(overrides: Partial<EngineConfig> = {}): GameEngine {
  return new GameEngine({ ...defaultConfig, ...overrides });
}

// ── 1. Constants ──

describe('GAME_CONSTANTS', () => {
  it('should export all required constants with valid values', () => {
    expect(GAME_CONSTANTS.FIELD_MIN).toBe(0);
    expect(GAME_CONSTANTS.FIELD_MAX).toBe(1);
    expect(GAME_CONSTANTS.PADDLE_HEIGHT).toBe(0.15);
    expect(GAME_CONSTANTS.PADDLE_WIDTH).toBe(0.015);
    expect(GAME_CONSTANTS.PADDLE_X_LEFT).toBe(0.02);
    expect(GAME_CONSTANTS.PADDLE_X_RIGHT).toBe(0.98);
    expect(GAME_CONSTANTS.BALL_RADIUS).toBe(0.01);
    expect(GAME_CONSTANTS.BALL_BASE_SPEED).toBe(0.008);
    expect(GAME_CONSTANTS.BALL_SPEED_INCREMENT).toBe(0.0005);
    expect(GAME_CONSTANTS.PADDLE_SPEED).toBe(0.015);
    expect(GAME_CONSTANTS.MAX_BALL_SPEED).toBe(0.02);
  });
});

// ── 2. Initialization ──

describe('GameEngine initialization', () => {
  it('should create correct default state', () => {
    const engine = createEngine();
    const state = engine.getState();

    expect(state.ball.x).toBe(0.5);
    expect(state.ball.y).toBe(0.5);
    expect(state.ball.dx).toBe(0);
    expect(state.ball.dy).toBe(0);
    expect(state.paddles.left.y).toBe(0.5);
    expect(state.paddles.right.y).toBe(0.5);
    expect(state.score.left).toBe(0);
    expect(state.score.right).toBe(0);
    expect(state.status).toBe('waiting');
    expect(state.timeRemainingSeconds).toBe(120);
  });

  it('should return a deep copy of state (not a reference)', () => {
    const engine = createEngine();
    const state1 = engine.getState();
    state1.ball.x = 999;
    const state2 = engine.getState();
    expect(state2.ball.x).toBe(0.5);
  });
});

// ── 3. resetBall ──

describe('resetBall', () => {
  it('should put ball at center with nonzero velocity', () => {
    const engine = createEngine();
    engine.resetBall();
    const state = engine.getState();

    expect(state.ball.x).toBe(0.5);
    expect(state.ball.y).toBe(0.5);
    // velocity should be nonzero
    expect(state.ball.dx !== 0 || state.ball.dy !== 0).toBe(true);
    expect(state.ball.dx).not.toBe(0);
  });

  it('should produce a ball speed equal to base speed times multiplier', () => {
    const engine = createEngine({ ballSpeedMultiplier: 2 });
    engine.resetBall();
    const state = engine.getState();

    const speed = Math.sqrt(state.ball.dx ** 2 + state.ball.dy ** 2);
    const expectedSpeed = GAME_CONSTANTS.BALL_BASE_SPEED * 2;
    expect(speed).toBeCloseTo(expectedSpeed, 6);
  });
});

// ── 4. start / pause / resume ──

describe('start, pause, resume', () => {
  it('start should set status to playing and reset ball', () => {
    const engine = createEngine();
    engine.start();
    const state = engine.getState();

    expect(state.status).toBe('playing');
    expect(state.ball.dx).not.toBe(0);
  });

  it('pause should set status to paused when playing', () => {
    const engine = createEngine();
    engine.start();
    engine.pause();
    expect(engine.getState().status).toBe('paused');
  });

  it('pause should not change status when not playing', () => {
    const engine = createEngine();
    engine.pause();
    expect(engine.getState().status).toBe('waiting');
  });

  it('resume should set status to playing when paused', () => {
    const engine = createEngine();
    engine.start();
    engine.pause();
    engine.resume();
    expect(engine.getState().status).toBe('playing');
  });

  it('resume should not change status when not paused', () => {
    const engine = createEngine();
    engine.resume();
    expect(engine.getState().status).toBe('waiting');
  });
});

// ── 5. Ball movement ──

describe('ball movement', () => {
  it('should move ball by dx/dy each tick', () => {
    const engine = createEngine();
    engine.start();

    const stateBefore = engine.getState();
    const dx = stateBefore.ball.dx;
    const dy = stateBefore.ball.dy;
    const xBefore = stateBefore.ball.x;
    const yBefore = stateBefore.ball.y;

    engine.tick();

    const stateAfter = engine.getState();
    // Ball should have moved (approximately) by dx/dy
    // Note: time update happens first, but ball position should reflect movement
    expect(stateAfter.ball.x).toBeCloseTo(xBefore + dx, 6);
    expect(stateAfter.ball.y).toBeCloseTo(yBefore + dy, 6);
  });

  it('should not move ball when status is not playing', () => {
    const engine = createEngine();
    // Status is 'waiting', tick should do nothing
    engine.tick();
    const state = engine.getState();
    expect(state.ball.x).toBe(0.5);
    expect(state.ball.y).toBe(0.5);
  });
});

// ── 6 & 7. Wall collisions ──

describe('wall collisions', () => {
  it('should bounce off top wall (dy reverses to positive)', () => {
    const engine = createEngine();
    engine.start();

    // Manually position ball near top wall moving upward
    const state = engine.getState();
    // We need to access internal state via a workaround: set ball directly
    // Use start to get playing, then we'll manipulate via multiple ticks
    // Instead, let's use a helper approach: create engine, start it, then
    // set ball position by accessing internals.

    // We'll use Object.assign on the engine's state via a cast
    const engineAny = engine as any;
    engineAny.state.ball = {
      x: 0.5,
      y: GAME_CONSTANTS.BALL_RADIUS, // at top edge
      dx: 0.005,
      dy: -0.005, // moving up
    };

    engine.tick();

    const newState = engine.getState();
    expect(newState.ball.dy).toBeGreaterThan(0); // reversed to moving down
  });

  it('should bounce off bottom wall (dy reverses to negative)', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    engineAny.state.ball = {
      x: 0.5,
      y: GAME_CONSTANTS.FIELD_MAX - GAME_CONSTANTS.BALL_RADIUS, // at bottom edge
      dx: 0.005,
      dy: 0.005, // moving down
    };

    engine.tick();

    const newState = engine.getState();
    expect(newState.ball.dy).toBeLessThan(0); // reversed to moving up
  });
});

// ── 8 & 9. Paddle collisions ──

describe('paddle collisions', () => {
  it('should bounce off left paddle (dx reverses to positive)', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    // Position ball right at the left paddle, moving left
    engineAny.state.ball = {
      x: GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH + GAME_CONSTANTS.BALL_RADIUS,
      y: 0.5, // paddle is at 0.5
      dx: -0.008,
      dy: 0,
    };

    engine.tick();

    const newState = engine.getState();
    expect(newState.ball.dx).toBeGreaterThan(0); // reversed
  });

  it('should bounce off right paddle (dx reverses to negative)', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    // Position ball right at the right paddle, moving right
    engineAny.state.ball = {
      x: GAME_CONSTANTS.PADDLE_X_RIGHT - GAME_CONSTANTS.PADDLE_WIDTH - GAME_CONSTANTS.BALL_RADIUS,
      y: 0.5,
      dx: 0.008,
      dy: 0,
    };

    engine.tick();

    const newState = engine.getState();
    expect(newState.ball.dx).toBeLessThan(0); // reversed
  });

  it('should apply deflection based on hit point offset', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    // Hit the top edge of the left paddle
    engineAny.state.ball = {
      x: GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH + GAME_CONSTANTS.BALL_RADIUS,
      y: 0.5 + GAME_CONSTANTS.PADDLE_HEIGHT / 2 - 0.01, // near top edge of paddle
      dx: -0.008,
      dy: 0,
    };

    engine.tick();

    const newState = engine.getState();
    // dy should be adjusted (positive offset -> positive deflection)
    expect(newState.ball.dy).not.toBe(0);
  });

  it('should accelerate ball after paddle hit', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    engineAny.state.ball = {
      x: GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH + GAME_CONSTANTS.BALL_RADIUS,
      y: 0.5,
      dx: -0.008,
      dy: 0.001,
    };

    const speedBefore = Math.sqrt(0.008 ** 2 + 0.001 ** 2);

    engine.tick();

    const newState = engine.getState();
    const speedAfter = Math.sqrt(newState.ball.dx ** 2 + newState.ball.dy ** 2);
    expect(speedAfter).toBeGreaterThan(speedBefore);
  });
});

// ── 10 & 11. Scoring ──

describe('scoring', () => {
  it('should score for right player when ball passes left edge', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    // Position ball about to cross left edge
    engineAny.state.ball = {
      x: 0.001,
      y: 0.5,
      dx: -0.01,
      dy: 0,
    };

    engine.tick();

    const state = engine.getState();
    expect(state.score.right).toBe(1);
    expect(state.score.left).toBe(0);
    expect(engine.getLastScorer()).toBe('right');
  });

  it('should score for left player when ball passes right edge', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    // Position ball about to cross right edge
    engineAny.state.ball = {
      x: 0.999,
      y: 0.5,
      dx: 0.01,
      dy: 0,
    };

    engine.tick();

    const state = engine.getState();
    expect(state.score.left).toBe(1);
    expect(state.score.right).toBe(0);
    expect(engine.getLastScorer()).toBe('left');
  });

  it('should reset ball after scoring', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    engineAny.state.ball = {
      x: 0.001,
      y: 0.3,
      dx: -0.01,
      dy: 0.005,
    };

    engine.tick();

    const state = engine.getState();
    expect(state.ball.x).toBe(0.5);
    expect(state.ball.y).toBe(0.5);
  });

  it('should return null for getLastScorer when no one has scored', () => {
    const engine = createEngine();
    expect(engine.getLastScorer()).toBeNull();
  });
});

// ── 12. Win by points ──

describe('win by points', () => {
  it('should finish game when a player reaches pointsToWin', () => {
    const engine = createEngine({ pointsToWin: 2 });
    engine.start();

    const engineAny = engine as any;

    // Score twice for right player
    engineAny.state.ball = { x: 0.001, y: 0.5, dx: -0.01, dy: 0 };
    engine.tick();

    // After first score, status should still be playing
    expect(engine.getState().status).toBe('playing');

    // Score again
    engineAny.state.ball = { x: 0.001, y: 0.5, dx: -0.01, dy: 0 };
    engine.tick();

    const state = engine.getState();
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('right');
    expect(state.score.right).toBe(2);
  });

  it('should declare left as winner when left reaches pointsToWin', () => {
    const engine = createEngine({ pointsToWin: 1 });
    engine.start();

    const engineAny = engine as any;
    engineAny.state.ball = { x: 0.999, y: 0.5, dx: 0.01, dy: 0 };
    engine.tick();

    const state = engine.getState();
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('left');
  });
});

// ── 13. Win by time ──

describe('win by time expiration', () => {
  it('should finish when time runs out, winner is higher score', () => {
    const engine = createEngine({ timeLimitSeconds: 0.02, pointsToWin: 100 });
    engine.start();

    const engineAny = engine as any;
    // Give left player a lead
    engineAny.state.score = { left: 3, right: 1 };

    // Tick enough to exhaust time (0.02 seconds = ~1.2 ticks at 60fps)
    for (let i = 0; i < 5; i++) {
      engine.tick();
    }

    const state = engine.getState();
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('left');
  });

  it('should declare draw when time runs out and scores are tied', () => {
    const engine = createEngine({ timeLimitSeconds: 0.02, pointsToWin: 100 });
    engine.start();

    const engineAny = engine as any;
    engineAny.state.score = { left: 2, right: 2 };

    for (let i = 0; i < 5; i++) {
      engine.tick();
    }

    const state = engine.getState();
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('draw');
  });

  it('should declare right as winner when right has higher score at time expiry', () => {
    const engine = createEngine({ timeLimitSeconds: 0.02, pointsToWin: 100 });
    engine.start();

    const engineAny = engine as any;
    engineAny.state.score = { left: 1, right: 4 };

    for (let i = 0; i < 5; i++) {
      engine.tick();
    }

    const state = engine.getState();
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('right');
  });
});

// ── 14. Paddle movement ──

describe('paddle movement', () => {
  it('should move paddle toward target position', () => {
    const engine = createEngine();
    engine.start();

    // Set left paddle target to 0.8 (paddle starts at 0.5)
    engine.setPaddleTarget('left', 0.8);

    engine.tick();

    const state = engine.getState();
    // Paddle should have moved toward 0.8 by PADDLE_SPEED
    expect(state.paddles.left.y).toBeCloseTo(0.5 + GAME_CONSTANTS.PADDLE_SPEED, 6);
  });

  it('should snap to target when distance is less than PADDLE_SPEED', () => {
    const engine = createEngine();
    engine.start();

    const target = 0.5 + GAME_CONSTANTS.PADDLE_SPEED * 0.5; // less than one step away
    engine.setPaddleTarget('left', target);

    engine.tick();

    const state = engine.getState();
    expect(state.paddles.left.y).toBeCloseTo(target, 6);
  });

  it('should move paddle downward toward a lower target', () => {
    const engine = createEngine();
    engine.start();

    engine.setPaddleTarget('right', 0.2);

    engine.tick();

    const state = engine.getState();
    expect(state.paddles.right.y).toBeCloseTo(0.5 - GAME_CONSTANTS.PADDLE_SPEED, 6);
  });
});

// ── 15. Paddle clamping ──

describe('paddle clamping', () => {
  it('should clamp paddle within field bounds (top)', () => {
    const engine = createEngine();
    engine.start();

    engine.setPaddleTarget('left', 0); // try to go to very top

    // Tick many times to reach the target
    for (let i = 0; i < 100; i++) {
      engine.tick();
    }

    const state = engine.getState();
    const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;
    expect(state.paddles.left.y).toBeGreaterThanOrEqual(halfPaddle);
  });

  it('should clamp paddle within field bounds (bottom)', () => {
    const engine = createEngine();
    engine.start();

    engine.setPaddleTarget('right', 1); // try to go to very bottom

    for (let i = 0; i < 100; i++) {
      engine.tick();
    }

    const state = engine.getState();
    const halfPaddle = GAME_CONSTANTS.PADDLE_HEIGHT / 2;
    expect(state.paddles.right.y).toBeLessThanOrEqual(1 - halfPaddle);
  });

  it('should clamp setPaddleTarget input to 0-1 range', () => {
    const engine = createEngine();
    engine.setPaddleTarget('left', -5);
    engine.setPaddleTarget('right', 10);

    // Access internal targets to verify clamping
    const engineAny = engine as any;
    expect(engineAny.paddleTargets.left).toBe(0);
    expect(engineAny.paddleTargets.right).toBe(1);
  });
});

// ── Ball misses paddle ──

describe('ball misses paddle', () => {
  it('should score when ball passes paddle without hitting it', () => {
    const engine = createEngine();
    engine.start();

    const engineAny = engine as any;
    // Position ball past the left paddle zone but paddle is far away
    engineAny.state.paddles.left.y = 0.9; // paddle way at bottom
    engineAny.state.ball = {
      x: 0.001,
      y: 0.1, // ball at top, paddle at bottom - miss
      dx: -0.01,
      dy: 0,
    };

    engine.tick();

    const state = engine.getState();
    expect(state.score.right).toBe(1); // right scores because ball passed left edge
  });
});

// ── Ball speed capping ──

describe('ball speed cap', () => {
  it('should not exceed MAX_BALL_SPEED * ballSpeedMultiplier', () => {
    const engine = createEngine({ ballSpeedMultiplier: 1 });
    engine.start();

    const engineAny = engine as any;
    const maxSpeed = GAME_CONSTANTS.MAX_BALL_SPEED;

    // Set ball near max speed moving toward left paddle
    engineAny.state.ball = {
      x: GAME_CONSTANTS.PADDLE_X_LEFT + GAME_CONSTANTS.PADDLE_WIDTH + GAME_CONSTANTS.BALL_RADIUS,
      y: 0.5,
      dx: -maxSpeed,
      dy: 0.001,
    };

    engine.tick();

    const state = engine.getState();
    const speed = Math.sqrt(state.ball.dx ** 2 + state.ball.dy ** 2);
    expect(speed).toBeLessThanOrEqual(maxSpeed + 0.0001);
  });
});

// ── Tick does nothing when not playing ──

describe('tick when not playing', () => {
  it('should not update state when paused', () => {
    const engine = createEngine();
    engine.start();
    engine.pause();

    const stateBefore = engine.getState();
    engine.tick();
    const stateAfter = engine.getState();

    expect(stateAfter.ball.x).toBe(stateBefore.ball.x);
    expect(stateAfter.ball.y).toBe(stateBefore.ball.y);
    expect(stateAfter.timeRemainingSeconds).toBe(stateBefore.timeRemainingSeconds);
  });

  it('should not update state when finished', () => {
    const engine = createEngine({ pointsToWin: 1 });
    engine.start();

    const engineAny = engine as any;
    engineAny.state.ball = { x: 0.001, y: 0.5, dx: -0.01, dy: 0 };
    engine.tick(); // score -> finish

    const stateBefore = engine.getState();
    engine.tick(); // should do nothing
    const stateAfter = engine.getState();

    expect(stateAfter.status).toBe('finished');
    expect(stateAfter.timeRemainingSeconds).toBe(stateBefore.timeRemainingSeconds);
  });
});

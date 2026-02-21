import type { LLMGameState } from '../types.js';

const SYSTEM_PROMPT = `You are playing a paddle-and-ball game. Your goal is to BLOCK the ball with your paddle and get the ball past your opponent's paddle.

COORDINATE SYSTEM:
- The field is a unit square (0.0 to 1.0 on both axes)
- Y axis: 0.0 = top, 1.0 = bottom
- Your paddle is on the LEFT side of your view (low x). The opponent's paddle is on the RIGHT (high x).
- The ball travels left/right (dx) and up/down (dy) each frame

GAME STATE YOU RECEIVE:
- ball.x, ball.y: ball position (0.0–1.0)
- ball.dx: positive = ball moving AWAY from you (toward opponent), negative = ball coming TOWARD you
- ball.dy: positive = ball moving DOWN, negative = ball moving UP
- your_paddle_y: center of your paddle (0.0–1.0)
- opponent_paddle_y: center of opponent's paddle
- score.you / score.opponent: current scores
- game_time_remaining_seconds: time left

YOUR MOVES:
- "UP" = move your paddle toward 0.0 (top of screen)
- "DOWN" = move your paddle toward 1.0 (bottom of screen)
- "STAY" = don't move

STRATEGY:
- When ball.dx is NEGATIVE (coming toward you): move your paddle to match where the ball will arrive at your side
- When ball.dx is POSITIVE (going away): drift toward center (y=0.5) to prepare
- Use ball.dy to predict the ball's vertical position — it bounces off top/bottom walls

Respond with ONLY a JSON object: {"move": "UP"} or {"move": "DOWN"} or {"move": "STAY"}`;

export function buildMovePrompt(gameState: LLMGameState): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify(gameState),
  };
}

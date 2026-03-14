import type { LLMGameState } from '../types.js';

const SYSTEM_PROMPT = `You control a paddle in a ball game. Output ONLY a JSON object with your target y-coordinate. No explanation, no reasoning, no text — JUST the JSON.

RULES:
- Field is 0.0 (top) to 1.0 (bottom). Your paddle is on the left (x≈0.035), height 0.15.
- Ball bounces off top/bottom walls. dx<0 means ball approaches you.
- ball_moving_toward_you and ticks_until_ball_reaches_you tell you urgency.
- Predict where ball will arrive (ball.y + ball.dy * ticks, accounting for bounces at 0 and 1).
- When ball moves away, drift toward 0.5.

RESPOND WITH ONLY: {"target_y": 0.XX}`;

export function buildMovePrompt(gameState: LLMGameState): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify(gameState),
  };
}

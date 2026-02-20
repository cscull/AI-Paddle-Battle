import type { LLMGameState } from '../types.js';

const SYSTEM_PROMPT = `You are an AI playing a competitive paddle-and-ball game. You control a paddle that moves UP or DOWN.

Given the game state, respond with ONLY valid JSON: {"move": "UP"} or {"move": "DOWN"} or {"move": "STAY"}

Strategy tips:
- Move toward where the ball WILL be, not where it is now
- Consider the ball's direction (dx, dy) to predict its path
- Stay near center when the ball is moving away from you

Respond with ONLY the JSON object, nothing else.`;

export function buildMovePrompt(gameState: LLMGameState): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify(gameState),
  };
}

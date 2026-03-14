import type { LLMAdapter, LLMGameState, MoveResponse, MoveDirection, TrashTalkContext, TokenUsage } from '../types.js';
import { buildMovePrompt } from '../prompts/move.js';
import { buildTrashTalkPrompt } from '../prompts/trash-talk.js';

export interface ParseResult {
  move: MoveDirection;
  target_y?: number;
  method: 'json_target' | 'regex_target' | 'json' | 'regex_json' | 'keyword' | 'fallback';
}

function clampTarget(val: number): number | undefined {
  if (!isFinite(val)) return undefined;
  if (val < 0 || val > 1) return Math.max(0, Math.min(1, val));
  return val;
}

export function parseMoveFromResponse(raw: string): ParseResult {
  // 1. Try JSON parse
  try {
    const json = JSON.parse(raw);

    // New format: {"target_y": 0.65} — accept number or string-encoded number
    if (json.target_y !== undefined && json.target_y !== null) {
      const val = typeof json.target_y === 'number' ? json.target_y : parseFloat(String(json.target_y));
      const clamped = clampTarget(val);
      if (clamped !== undefined) {
        return { move: 'STAY', target_y: clamped, method: 'json_target' };
      }
    }

    // Legacy format: {"move": "UP"}
    if (json.move && typeof json.move === 'string' && ['UP', 'DOWN', 'STAY'].includes(json.move.toUpperCase())) {
      return { move: json.move.toUpperCase() as MoveDirection, method: 'json' };
    }
  } catch {
    // Not pure JSON — try regex extraction
  }

  // 2. Regex: target_y in JSON-like structure (handles quoted or unquoted values)
  const targetMatch = raw.match(/\{[^}]*"target_y"\s*:\s*"?([\d.]+)"?[^}]*\}/);
  if (targetMatch) {
    const clamped = clampTarget(parseFloat(targetMatch[1]));
    if (clamped !== undefined) {
      return { move: 'STAY', target_y: clamped, method: 'regex_target' };
    }
  }

  // 3. Regex: legacy move direction in JSON-like structure
  const jsonMatch = raw.match(/\{[^}]*"move"\s*:\s*"(UP|DOWN|STAY)"[^}]*\}/i);
  if (jsonMatch) {
    return { move: jsonMatch[1].toUpperCase() as MoveDirection, method: 'regex_json' };
  }

  // 4. Bare float (some models just output a number)
  const bareFloat = raw.trim().match(/^(0?\.\d+|1\.0{0,4}|0|1)$/);
  if (bareFloat) {
    const clamped = clampTarget(parseFloat(bareFloat[1]));
    if (clamped !== undefined) {
      return { move: 'STAY', target_y: clamped, method: 'regex_target' };
    }
  }

  // 5. Keyword extraction (legacy fallback)
  const upper = raw.toUpperCase();
  if (upper.includes('UP') && !upper.includes('DOWN')) return { move: 'UP', method: 'keyword' };
  if (upper.includes('DOWN') && !upper.includes('UP')) return { move: 'DOWN', method: 'keyword' };

  return { move: 'STAY', method: 'fallback' };
}

export function truncateTrashTalk(message: string): string {
  const cleaned = message.replace(/^["']|["']$/g, '').trim();
  return cleaned.length > 150 ? cleaned.slice(0, 147) + '...' : cleaned;
}

export abstract class BaseAdapter implements LLMAdapter {
  abstract provider: string;
  model: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected tokens: TokenUsage = { input: 0, output: 0 };
  protected timeoutMs = 10000;

  constructor(model: string, apiKey: string, baseUrl: string) {
    this.model = model;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }>;

  async getMove(gameState: LLMGameState): Promise<MoveResponse> {
    const { system, user } = buildMovePrompt(gameState);
    try {
      const response = await this.withTimeout(this.callLLM(system, user));
      if (response.usage) {
        this.tokens.input += response.usage.input;
        this.tokens.output += response.usage.output;
      }
      const { move, target_y, method } = parseMoveFromResponse(response.content);
      const fallback = method === 'fallback' || method === 'keyword';
      return { move, target_y, raw: response.content, parseMethod: method, fallback };
    } catch (error) {
      return { move: 'STAY', error: true, raw: String(error) };
    }
  }

  async getTrashTalk(context: TrashTalkContext): Promise<string> {
    const { system, user } = buildTrashTalkPrompt(context);
    try {
      const response = await this.withTimeout(this.callLLM(system, user));
      if (response.usage) {
        this.tokens.input += response.usage.input;
        this.tokens.output += response.usage.output;
      }
      return truncateTrashTalk(response.content);
    } catch {
      return '';
    }
  }

  getTokensUsed(): TokenUsage {
    return { ...this.tokens };
  }

  abstract testConnection(apiKey: string): Promise<{ success: boolean; error?: string }>;

  protected withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM request timed out')), this.timeoutMs)
      ),
    ]);
  }
}

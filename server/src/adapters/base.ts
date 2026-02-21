import type { LLMAdapter, LLMGameState, MoveResponse, MoveDirection, TrashTalkContext, TokenUsage } from '../types.js';
import { buildMovePrompt } from '../prompts/move.js';
import { buildTrashTalkPrompt } from '../prompts/trash-talk.js';

export interface ParseResult {
  move: MoveDirection;
  method: 'json' | 'regex_json' | 'keyword' | 'fallback';
}

export function parseMoveFromResponse(raw: string): ParseResult {
  // Try JSON parse first
  try {
    const json = JSON.parse(raw);
    if (json.move && ['UP', 'DOWN', 'STAY'].includes(json.move.toUpperCase())) {
      return { move: json.move.toUpperCase() as MoveDirection, method: 'json' };
    }
  } catch {
    // Try to extract JSON from text
    const jsonMatch = raw.match(/\{[^}]*"move"\s*:\s*"(UP|DOWN|STAY)"[^}]*\}/i);
    if (jsonMatch) {
      return { move: jsonMatch[1].toUpperCase() as MoveDirection, method: 'regex_json' };
    }
  }

  // Try bare keyword extraction
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
  protected timeoutMs = 2000;

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
      const { move, method } = parseMoveFromResponse(response.content);
      const fallback = method === 'fallback' || method === 'keyword';
      return { move, raw: response.content, parseMethod: method, fallback };
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

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM request timed out')), this.timeoutMs)
      ),
    ]);
  }
}

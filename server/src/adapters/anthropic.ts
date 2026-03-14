import { BaseAdapter, parseMoveFromResponse } from './base.js';
import { buildMovePrompt } from '../prompts/move.js';
import type { LLMGameState, MoveResponse } from '../types.js';

export class AnthropicAdapter extends BaseAdapter {
  provider = 'anthropic';

  constructor(model: string, apiKey: string) {
    super(model, apiKey, 'https://api.anthropic.com/v1');
  }

  async callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 150,
        temperature: 0.3,
        system,
        messages: [
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[anthropic/${this.model}] API ERROR ${response.status}:\n${text}`);
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';
    const usage = data.usage
      ? { input: data.usage.input_tokens ?? 0, output: data.usage.output_tokens ?? 0 }
      : undefined;

    return { content, usage };
  }

  // Override getMove to use assistant prefill for faster, more reliable responses
  async getMove(gameState: LLMGameState): Promise<MoveResponse> {
    const { system, user } = buildMovePrompt(gameState);
    try {
      const response = await this.withTimeout(this.callMoveWithPrefill(system, user));
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

  // Separate method for move calls with assistant prefill
  private async callMoveWithPrefill(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 20,
        temperature: 0.3,
        system,
        messages: [
          { role: 'user', content: user },
          { role: 'assistant', content: '{"target_y":' },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[anthropic/${this.model}] PREFILL API ERROR ${response.status}:\n${text}`);
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    // Prepend the prefill so the parser sees complete JSON
    const content = '{"target_y":' + (data.content?.[0]?.text ?? '');
    const usage = data.usage
      ? { input: data.usage.input_tokens ?? 0, output: data.usage.output_tokens ?? 0 }
      : undefined;

    return { content, usage };
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Say "ok"' }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

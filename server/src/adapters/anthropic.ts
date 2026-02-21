import { BaseAdapter } from './base.js';

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
        max_tokens: 60,
        temperature: 0.3,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';
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

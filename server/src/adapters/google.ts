import { BaseAdapter } from './base.js';

export class GoogleAdapter extends BaseAdapter {
  provider = 'google';

  constructor(model: string, apiKey: string) {
    super(model, apiKey, 'https://generativelanguage.googleapis.com/v1beta');
  }

  async callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            maxOutputTokens: 60,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data.usageMetadata
      ? { input: data.usageMetadata.promptTokenCount ?? 0, output: data.usageMetadata.candidatesTokenCount ?? 0 }
      : undefined;

    return { content, usage };
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Say "ok"' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );

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

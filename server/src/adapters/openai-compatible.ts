import { BaseAdapter } from './base.js';

export class OpenAICompatibleAdapter extends BaseAdapter {
  provider: string;
  private loggedFirstRequest = false;

  constructor(provider: string, model: string, apiKey: string, baseUrl: string) {
    super(model, apiKey, baseUrl);
    this.provider = provider;
  }

  // OpenAI requires max_completion_tokens for ALL models; other providers use max_tokens
  private tokenLimitParam(limit: number): Record<string, number> {
    return this.provider === 'openai'
      ? { max_completion_tokens: limit }
      : { max_tokens: limit };
  }

  // OpenAI GPT-5 series are reasoning models
  private isReasoningModel(): boolean {
    if (this.provider !== 'openai') return false;
    if (this.model.startsWith('gpt-5')) return true;
    return false;
  }

  async callLLM(system: string, user: string): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const reasoning = this.isReasoningModel();
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      // Reasoning models need more tokens (reasoning + output tokens share the budget)
      ...this.tokenLimitParam(reasoning ? 2048 : 150),
      // Reasoning models reject temperature; minimize reasoning for fast game moves
      ...(reasoning
        ? { reasoning_effort: 'low' }
        : { temperature: 0.3 }),
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      if (!this.loggedFirstRequest) {
        this.loggedFirstRequest = true;
        const { messages: _msgs, ...bodyWithoutMessages } = requestBody;
        console.error(`[${this.provider}/${this.model}] FIRST REQUEST PARAMS:`, JSON.stringify(bodyWithoutMessages));
      }
      console.error(`[${this.provider}/${this.model}] API ERROR ${response.status}:\n${text}`);
      throw new Error(`${this.provider} API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content ?? '';

    // Debug: log empty responses to diagnose reasoning model issues
    if (!content && message) {
      console.error(`[${this.provider}/${this.model}] EMPTY CONTENT — full message:`, JSON.stringify(message));
      console.error(`[${this.provider}/${this.model}] finish_reason:`, data.choices?.[0]?.finish_reason);
    }

    const usage = data.usage
      ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0 }
      : { input: Math.ceil((system.length + user.length) / 4), output: Math.ceil(content.length / 4) };

    return { content, usage };
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Say "ok"' }],
          ...this.tokenLimitParam(5),
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

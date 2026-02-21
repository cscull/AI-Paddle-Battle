import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class OpenRouterAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('openrouter', model, apiKey, 'https://openrouter.ai/api/v1');
  }
}

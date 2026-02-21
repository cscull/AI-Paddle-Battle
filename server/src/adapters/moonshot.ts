import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class MoonshotAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('moonshot', model, apiKey, 'https://api.moonshot.ai/v1');
  }
}

import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class OpenAIAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('openai', model, apiKey, 'https://api.openai.com/v1');
  }
}

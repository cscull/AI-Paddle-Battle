import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('deepseek', model, apiKey, 'https://api.deepseek.com/v1');
  }
}

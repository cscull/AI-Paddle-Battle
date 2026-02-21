import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class XAIAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('xai', model, apiKey, 'https://api.x.ai/v1');
  }
}

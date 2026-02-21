import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class MistralAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('mistral', model, apiKey, 'https://api.mistral.ai/v1');
  }
}

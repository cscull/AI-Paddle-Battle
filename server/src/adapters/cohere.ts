import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class CohereAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('cohere', model, apiKey, 'https://api.cohere.ai/compatibility/v1');
  }
}

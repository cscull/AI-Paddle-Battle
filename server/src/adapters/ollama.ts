import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class OllamaAdapter extends OpenAICompatibleAdapter {
  constructor(model: string) {
    super('ollama', model, '', 'http://localhost:11434/v1');
  }
}

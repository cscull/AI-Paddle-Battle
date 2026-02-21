import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class QwenAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('qwen', model, apiKey, 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1');
  }
}

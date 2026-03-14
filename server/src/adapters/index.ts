import type { LLMAdapter } from '../types.js';
import { OpenAIAdapter } from './openai.js';
import { AnthropicAdapter } from './anthropic.js';
import { GoogleAdapter } from './google.js';
import { XAIAdapter } from './xai.js';
import { MistralAdapter } from './mistral.js';
import { DeepSeekAdapter } from './deepseek.js';
import { MoonshotAdapter } from './moonshot.js';
import { CohereAdapter } from './cohere.js';
import { QwenAdapter } from './qwen.js';

export function createAdapter(provider: string, model: string, apiKey: string): LLMAdapter {
  switch (provider) {
    case 'openai': return new OpenAIAdapter(model, apiKey);
    case 'anthropic': return new AnthropicAdapter(model, apiKey);
    case 'google': return new GoogleAdapter(model, apiKey);
    case 'xai': return new XAIAdapter(model, apiKey);
    case 'mistral': return new MistralAdapter(model, apiKey);
    case 'deepseek': return new DeepSeekAdapter(model, apiKey);
    case 'moonshot': return new MoonshotAdapter(model, apiKey);
    case 'cohere': return new CohereAdapter(model, apiKey);
    case 'qwen': return new QwenAdapter(model, apiKey);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

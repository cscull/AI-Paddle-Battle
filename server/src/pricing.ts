// Pricing per 1M tokens: { input: $, output: $ }
// Update these as providers change pricing
// Models without known pricing will show "N/A"

export const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-5.2': { input: 10.00, output: 30.00 },
  'gpt-5-mini': { input: 1.50, output: 6.00 },
  'gpt-5-nano': { input: 0.30, output: 1.20 },
  'gpt-4.1': { input: 2.00, output: 8.00 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },
  'o4-mini': { input: 1.10, output: 4.40 },

  // Anthropic
  'claude-opus-4-6': { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },

  // Google Gemini
  'gemini-3.1-pro-preview': { input: 2.50, output: 10.00 },
  'gemini-3-pro-preview': { input: 2.50, output: 10.00 },
  'gemini-3-flash-preview': { input: 0.15, output: 0.60 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },

  // xAI
  'grok-4': { input: 6.00, output: 18.00 },
  'grok-4-fast-reasoning': { input: 3.00, output: 9.00 },
  'grok-4-fast-non-reasoning': { input: 3.00, output: 9.00 },
  'grok-4-1-fast-reasoning': { input: 3.00, output: 9.00 },
  'grok-4-1-fast-non-reasoning': { input: 3.00, output: 9.00 },
  'grok-3-mini-fast-beta': { input: 0.30, output: 0.50 },

  // Mistral
  'mistral-large-2512': { input: 2.00, output: 6.00 },
  'mistral-medium-2508': { input: 0.40, output: 2.00 },
  'mistral-small-2506': { input: 0.10, output: 0.30 },
  'magistral-medium-2506': { input: 2.00, output: 5.00 },
  'magistral-small-2506': { input: 0.50, output: 1.50 },
  'codestral-2508': { input: 0.30, output: 0.90 },
  'ministral-8b-2512': { input: 0.10, output: 0.10 },
  'ministral-3b-2512': { input: 0.04, output: 0.04 },

  // DeepSeek
  'deepseek-chat': { input: 0.27, output: 1.10 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },

  // Moonshot AI (Kimi)
  'kimi-k2.5': { input: 0.60, output: 2.40 },
  'kimi-k2-thinking': { input: 0.60, output: 2.40 },

  // Cohere
  'command-a-03-2025': { input: 2.50, output: 10.00 },
  'command-r-plus-08-2024': { input: 2.50, output: 10.00 },

  // Alibaba (Qwen)
  'qwen3-max': { input: 1.60, output: 6.40 },
  'qwen-plus': { input: 0.80, output: 2.00 },
  'qwen-turbo': { input: 0.30, output: 0.60 },
  'qwq-plus': { input: 0.80, output: 2.00 },

  // OpenRouter
  'openai/gpt-4.1': { input: 2.00, output: 8.00 },
  'anthropic/claude-sonnet-4.6': { input: 3.00, output: 15.00 },
  'google/gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'mistralai/mistral-large-2512': { input: 2.00, output: 6.00 },
  'x-ai/grok-3-mini-fast-beta': { input: 0.30, output: 0.50 },
  'deepseek/deepseek-chat': { input: 0.27, output: 1.10 },
  'deepseek/deepseek-reasoner': { input: 0.55, output: 2.19 },
  'meta-llama/llama-4-maverick': { input: 0.50, output: 0.70 },
  'meta-llama/llama-4-scout': { input: 0.18, output: 0.35 },
  'qwen/qwen3-235b-a22b': { input: 0.80, output: 2.00 },
  'cohere/command-a-03-2025': { input: 2.50, output: 10.00 },

  // Ollama — free (local)
};

export function estimateCost(modelId: string, tokens: { input: number; output: number }): number | null {
  const pricing = PRICING[modelId];
  if (!pricing) return null;
  return (tokens.input / 1_000_000) * pricing.input + (tokens.output / 1_000_000) * pricing.output;
}

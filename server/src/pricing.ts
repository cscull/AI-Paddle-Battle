// Pricing per 1M tokens: { input: $, output: $ }
// Update these as providers change pricing
// Models without known pricing will show "N/A"

export const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-5.4': { input: 2.50, output: 15.00 },
  'gpt-5.2': { input: 1.75, output: 14.00 },
  'gpt-5.1': { input: 1.25, output: 10.00 },
  'gpt-5': { input: 1.25, output: 10.00 },
  'gpt-5-mini': { input: 0.25, output: 2.00 },
  'gpt-5-nano': { input: 0.05, output: 0.40 },
  'gpt-4.1': { input: 2.00, output: 8.00 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },
  'o4-mini': { input: 1.10, output: 4.40 },
  'o3': { input: 2.00, output: 8.00 },

  // Anthropic
  'claude-opus-4-6': { input: 5.00, output: 25.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },

  // Google Gemini
  'gemini-3.1-pro-preview': { input: 2.00, output: 12.00 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-3.1-flash-lite-preview': { input: 0.25, output: 1.50 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },

  // xAI (pricing from docs.x.ai)
  'grok-4.20-beta-0309-non-reasoning': { input: 2.00, output: 6.00 },
  'grok-4.20-beta-0309-reasoning': { input: 2.00, output: 6.00 },
  'grok-4-1-fast-non-reasoning': { input: 0.20, output: 0.50 },
  'grok-4-1-fast-reasoning': { input: 0.20, output: 0.50 },
  'grok-code-fast-1': { input: 0.20, output: 1.50 },
  'grok-4-fast-reasoning': { input: 0.20, output: 0.50 },
  'grok-4-fast-non-reasoning': { input: 0.20, output: 0.50 },
  'grok-4-0709': { input: 3.00, output: 15.00 },
  'grok-3': { input: 3.00, output: 15.00 },
  'grok-3-mini': { input: 0.30, output: 0.50 },

  // Mistral
  'mistral-large-latest': { input: 0.50, output: 1.50 },
  'mistral-medium-latest': { input: 0.40, output: 2.00 },
  'mistral-small-latest': { input: 0.10, output: 0.30 },
  'magistral-medium-latest': { input: 2.00, output: 5.00 },
  'magistral-small-latest': { input: 0.50, output: 1.50 },
  'codestral-latest': { input: 0.30, output: 0.90 },

  // DeepSeek
  'deepseek-chat': { input: 0.28, output: 0.42 },
  'deepseek-reasoner': { input: 0.28, output: 0.42 },

  // Moonshot AI (Kimi)
  'kimi-k2.5': { input: 0.60, output: 2.40 },

  // Cohere
  'command-a-03-2025': { input: 2.50, output: 10.00 },
  'command-a-reasoning-08-2025': { input: 2.50, output: 10.00 },
  'command-r-plus-08-2024': { input: 2.50, output: 10.00 },

  // Alibaba (Qwen)
  'qwen3-max': { input: 1.60, output: 6.40 },
  'qwen3.5-plus': { input: 0.80, output: 2.00 },
  'qwen3.5-flash': { input: 0.10, output: 0.40 },
  'qwen-flash': { input: 0.30, output: 0.60 },
  'qwq-plus': { input: 0.80, output: 2.00 },

};

export function estimateCost(modelId: string, tokens: { input: number; output: number }): number | null {
  const pricing = PRICING[modelId];
  if (!pricing) return null;
  return (tokens.input / 1_000_000) * pricing.input + (tokens.output / 1_000_000) * pricing.output;
}

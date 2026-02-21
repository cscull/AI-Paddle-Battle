# Adding a New LLM Provider

This guide walks you through adding a new LLM provider to AI Paddle Battle. Most providers that use an OpenAI-compatible chat completions API can be added in under 10 minutes.

## Overview

There are six places you need to touch:

1. **`server/src/models.ts`** -- register the provider and its models
2. **`server/src/adapters/`** -- create an adapter class
3. **`server/src/adapters/index.ts`** -- wire the adapter into the factory
4. **`server/src/pricing.ts`** -- add per-token pricing data
5. **`.env.example`** -- document the API key environment variable
6. **`client/src/components/SetupScreen.tsx`** -- make the provider selectable in the UI

## Step 1: Register the Provider

Open `server/src/models.ts` and add a new entry to the `PROVIDERS` array:

```ts
{
  id: 'myprovider',
  displayName: 'My Provider',
  baseUrl: 'https://api.myprovider.com/v1',
  requiresApiKey: true,
  isOpenAICompatible: true,   // set to false if it uses a custom API format
  models: [
    { id: 'my-model-large', displayName: 'My Model Large' },
    { id: 'my-model-small', displayName: 'My Model Small' },
  ],
},
```

## Step 2: Create the Adapter

### Option A: OpenAI-Compatible Provider (Most Common)

If the provider supports the standard `/v1/chat/completions` endpoint with Bearer token auth, create a thin wrapper. This is the entire file:

```ts
// server/src/adapters/myprovider.ts
import { OpenAICompatibleAdapter } from './openai-compatible.js';

export class MyProviderAdapter extends OpenAICompatibleAdapter {
  constructor(model: string, apiKey: string) {
    super('myprovider', model, apiKey, 'https://api.myprovider.com/v1');
  }
}
```

That is it -- six lines. The `OpenAICompatibleAdapter` base class handles `callLLM()`, `testConnection()`, request formatting, response parsing, and token usage tracking.

For a real example, see `server/src/adapters/deepseek.ts`.

### Option B: Custom API Format

If the provider has a non-standard API (like Anthropic or Google), extend `BaseAdapter` directly and implement two methods:

```ts
// server/src/adapters/myprovider.ts
import { BaseAdapter } from './base.js';

export class MyProviderAdapter extends BaseAdapter {
  provider = 'myprovider';

  constructor(model: string, apiKey: string) {
    super(model, apiKey, 'https://api.myprovider.com/v1');
  }

  async callLLM(
    system: string,
    user: string
  ): Promise<{ content: string; usage?: { input: number; output: number } }> {
    // Make the API call using fetch()
    // Parse the response and return { content, usage }
  }

  async testConnection(
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    // Send a minimal request to verify the key works
    // Return { success: true } or { success: false, error: '...' }
  }
}
```

For real examples, see `server/src/adapters/anthropic.ts` or `server/src/adapters/google.ts`.

## Step 3: Wire Into the Factory

Open `server/src/adapters/index.ts` and:

1. Import your adapter:
   ```ts
   import { MyProviderAdapter } from './myprovider.js';
   ```

2. Add a case to the `createAdapter` switch statement:
   ```ts
   case 'myprovider': return new MyProviderAdapter(model, apiKey);
   ```

## Step 4: Add Pricing Data

Open `server/src/pricing.ts` and add cost-per-token entries for each model so the stats panel can estimate match cost.

## Step 5: Update .env.example

Add the environment variable to `.env.example`:

```
MYPROVIDER_API_KEY=
```

## Step 6: Update the Client

The provider list in the client is currently hardcoded in `client/src/components/SetupScreen.tsx`. Add your new provider there so it appears in the setup dropdown.

Alternatively, if fetching from the server's `/api/providers` endpoint is available, the client will pick it up automatically.

## Testing Your Adapter

1. Start the dev server: `npm run dev`
2. Select your provider in the game UI and enter an API key.
3. Start a match and verify:
   - The paddle moves (LLM move calls are working).
   - Trash talk appears (LLM trash talk calls are working).
   - Token counts show up in the stats panel.
   - The "Test Connection" button in the setup screen works.

## Tips

- Keep `max_tokens` low (the base adapter uses 60) to minimize latency.
- The game loop has a 2-second timeout per LLM call. If a provider is consistently slow, you may need to increase `this.timeoutMs` in your adapter constructor.
- If the provider requires custom headers beyond `Authorization: Bearer`, override `callLLM()` even for OpenAI-compatible providers.

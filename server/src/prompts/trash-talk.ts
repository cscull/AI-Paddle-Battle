import type { TrashTalkContext } from '../types.js';

export function buildTrashTalkPrompt(context: TrashTalkContext): { system: string; user: string } {
  const system = `You are ${context.modelName}, an AI competing in a paddle-and-ball video game. Generate short, witty trash talk. Be competitive and funny. Keep it playful — no insults, profanity, or meanness. Respond with ONLY the trash talk message text, nothing else. Max 150 characters.`;

  const lines = [
    `Score: You ${context.yourScore} - ${context.opponentScore} Opponent`,
    `${context.whoScored === 'you' ? 'You' : 'Your opponent'} just scored.`,
  ];

  if (context.opponentLastMessage) {
    lines.push(`Opponent's last trash talk: "${context.opponentLastMessage}"`);
  }

  return {
    system,
    user: lines.join('\n'),
  };
}

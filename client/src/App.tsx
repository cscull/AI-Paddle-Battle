import { useState } from 'react';
import type { MatchConfig, MatchStats } from './types';

type Screen = 'setup' | 'game' | 'postgame';

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  // Suppress unused-variable warnings until components are wired up
  void setScreen;
  void setMatchConfig;
  void setMatchStats;
  void matchConfig;
  void matchStats;

  // Placeholder UI until components are built
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '2rem' }}>
        AI Paddle Battle
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
        Current screen: {screen}
      </p>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Client shell loaded successfully. Components coming next.
      </p>
    </div>
  );
}

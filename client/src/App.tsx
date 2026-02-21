import { useState } from 'react';
import type { MatchConfig, MatchStats } from './types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import StatsPanel from './components/StatsPanel';
import PostGameScreen from './components/PostGameScreen';
import { useGameSocket } from './hooks/useGameSocket';

type Screen = 'setup' | 'game' | 'postgame';

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);

  const {
    gameState,
    trashTalkLog,
    debugLog,
    isConnected,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    sendHumanInput,
    testConnection,
  } = useGameSocket({
    onMatchEnd: (stats) => {
      setMatchStats(stats);
      setScreen('postgame');
    },
  });

  const handleStartMatch = (config: MatchConfig) => {
    setMatchConfig(config);
    startMatch(config);
    setScreen('game');
  };

  const handleEndMatch = () => {
    endMatch();
    setScreen('setup');
  };

  const handleRematch = () => {
    if (matchConfig) {
      startMatch(matchConfig);
      setScreen('game');
    }
  };

  return (
    <div>
      {screen === 'setup' && (
        <SetupScreen
          onStartMatch={handleStartMatch}
          isConnected={isConnected}
          testConnection={testConnection}
        />
      )}
      {screen === 'game' && gameState && matchConfig && (
        <>
          <GameScreen
            gameState={gameState}
            matchConfig={matchConfig}
            trashTalkLog={trashTalkLog}
            onPause={pauseMatch}
            onResume={resumeMatch}
            onEndMatch={handleEndMatch}
            onHumanInput={sendHumanInput}
          />
          <StatsPanel
            matchConfig={matchConfig}
            isOpen={statsPanelOpen}
            onToggle={() => setStatsPanelOpen(!statsPanelOpen)}
            trashTalkMessages={trashTalkLog}
            debugLog={debugLog}
          />
        </>
      )}
      {screen === 'postgame' && matchStats && gameState && matchConfig && (
        <PostGameScreen
          stats={matchStats}
          gameState={gameState}
          matchConfig={matchConfig}
          onRematch={handleRematch}
          onNewMatch={() => setScreen('setup')}
        />
      )}
    </div>
  );
}

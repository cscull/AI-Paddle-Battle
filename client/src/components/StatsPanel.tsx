import type { MatchConfig, TrashTalkMessage } from '../types';
import TrashTalkLog from './TrashTalkLog';
import '../styles/stats.css';

interface StatsPanelProps {
  matchConfig: MatchConfig;
  isOpen: boolean;
  onToggle: () => void;
  trashTalkMessages?: TrashTalkMessage[];
}

export default function StatsPanel({ matchConfig, isOpen, onToggle, trashTalkMessages = [] }: StatsPanelProps) {
  const leftPlayer = matchConfig.players.left;
  const rightPlayer = matchConfig.players.right;

  return (
    <div className={`stats-panel ${isOpen ? 'stats-panel--open' : ''}`}>
      {/* Toggle tab visible on the left edge */}
      <button className="stats-panel-toggle" onClick={onToggle} title={isOpen ? 'Close panel' : 'Open stats'}>
        {isOpen ? 'CLOSE' : 'STATS'}
      </button>

      {/* Panel header */}
      <div className="stats-panel-header">
        <span className="stats-panel-title">Match Info</span>
        <button className="stats-panel-close" onClick={onToggle} title="Close panel">
          ×
        </button>
      </div>

      {/* Panel content */}
      <div className="stats-panel-content">
        {/* Player 1 - Left (Cyan) */}
        <div className="stats-player-section stats-player-section--left">
          <div className="stats-player-name">{leftPlayer.name || 'Player 1'}</div>
          {leftPlayer.type === 'ai' ? (
            <div className="stats-player-detail">
              <span>{leftPlayer.provider}</span> / <span>{leftPlayer.model}</span>
            </div>
          ) : (
            <div className="stats-player-detail">Human Player</div>
          )}
        </div>

        {/* Player 2 - Right (Magenta) */}
        <div className="stats-player-section stats-player-section--right">
          <div className="stats-player-name">{rightPlayer.name || 'Player 2'}</div>
          {rightPlayer.type === 'ai' ? (
            <div className="stats-player-detail">
              <span>{rightPlayer.provider}</span> / <span>{rightPlayer.model}</span>
            </div>
          ) : (
            <div className="stats-player-detail">Human Player</div>
          )}
        </div>

        {/* Note about detailed stats */}
        <div className="stats-note">
          Detailed performance stats (tokens, response times, costs) will appear after the match ends.
        </div>

        {/* Trash talk section */}
        {matchConfig.settings.trashTalkEnabled && (
          <>
            <div className="stats-trash-talk-header">Trash Talk</div>
            <TrashTalkLog messages={trashTalkMessages} />
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MatchStats, GameState, MatchConfig, PlayerStats, TrashTalkMessage } from '../types';
import '../styles/postgame.css';

// ── Props ──

interface PostGameScreenProps {
  stats: MatchStats;
  gameState: GameState;
  matchConfig: MatchConfig;
  onRematch: () => void;
  onNewMatch: () => void;
}

// ── Helpers ──

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function formatMs(ms: number): string {
  return `${Math.round(ms)}ms`;
}

// ── Confetti ──

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const CONFETTI_COLORS = [
  '#00ffff', // cyan
  '#ff00ff', // magenta
  '#00ffff88',
  '#ff00ff88',
  '#00dddd',
  '#dd00dd',
  '#88ffff',
  '#ff88ff',
];

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn particles
    const particles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.3 - canvas.height * 0.1,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 1,
        size: Math.random() * 6 + 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    const startTime = performance.now();
    const duration = 3000; // 3 seconds
    let animId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Apply gravity
        p.vy += 0.1;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out in last 30%
        if (progress > 0.7) {
          p.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}

// ── Component ──

export default function PostGameScreen({
  stats,
  gameState,
  matchConfig,
  onRematch,
  onNewMatch,
}: PostGameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useConfetti(canvasRef);

  const leftName = matchConfig.players.left.name || 'Player 1';
  const rightName = matchConfig.players.right.name || 'Player 2';
  const leftScore = gameState.score.left;
  const rightScore = gameState.score.right;
  const winner = gameState.winner;

  const isLeftHuman = matchConfig.players.left.type === 'human';
  const isRightHuman = matchConfig.players.right.type === 'human';

  // Winner announcement text
  let winnerText: string;
  let winnerClass: string;
  if (winner === 'left') {
    winnerText = `${leftName} WINS!`;
    winnerClass = 'postgame-winner-text--left';
  } else if (winner === 'right') {
    winnerText = `${rightName} WINS!`;
    winnerClass = 'postgame-winner-text--right';
  } else {
    winnerText = "IT'S A DRAW!";
    winnerClass = 'postgame-winner-text--draw';
  }

  // Stat formatter for a given player side
  const formatStat = (
    playerStats: PlayerStats,
    isHuman: boolean,
    formatter: (ps: PlayerStats) => string
  ): string => {
    if (isHuman) return 'N/A';
    return formatter(playerStats);
  };

  // Stats rows
  const statRows: { label: string; format: (ps: PlayerStats) => string }[] = [
    {
      label: 'Total Tokens',
      format: (ps) => formatNumber(ps.tokensUsed.input + ps.tokensUsed.output),
    },
    {
      label: 'Estimated Cost',
      format: (ps) => formatCost(ps.estimatedCost),
    },
    {
      label: 'Avg Response Time',
      format: (ps) => formatMs(ps.avgResponseTimeMs),
    },
    {
      label: 'Fastest Response',
      format: (ps) => formatMs(ps.fastestResponseMs),
    },
    {
      label: 'Slowest Response',
      format: (ps) => formatMs(ps.slowestResponseMs),
    },
    {
      label: 'Invalid Responses',
      format: (ps) => formatNumber(ps.invalidResponses),
    },
    {
      label: 'Total Queries',
      format: (ps) => formatNumber(ps.totalQueries),
    },
  ];

  // Trash talk: last 3-5 messages (take last 5 if available)
  const trashTalkMessages: TrashTalkMessage[] = stats.trashTalkLog.slice(-5);

  // Share results
  const handleShare = useCallback(() => {
    const leftTokens = formatNumber(stats.left.tokensUsed.input + stats.left.tokensUsed.output);
    const rightTokens = formatNumber(stats.right.tokensUsed.input + stats.right.tokensUsed.output);
    const leftCost = formatCost(stats.left.estimatedCost);
    const rightCost = formatCost(stats.right.estimatedCost);

    let winnerName: string;
    if (winner === 'left') winnerName = leftName;
    else if (winner === 'right') winnerName = rightName;
    else winnerName = 'Draw';

    const text = [
      'AI Paddle Battle Results',
      `${leftName} vs ${rightName}`,
      `Score: ${leftScore} - ${rightScore}`,
      `Winner: ${winnerName}`,
      '',
      `${leftName}: ${leftTokens} tokens, ${leftCost}`,
      `${rightName}: ${rightTokens} tokens, ${rightCost}`,
      '',
      'Play at: github.com/cscull/AI-Paddle-Battle',
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [stats, winner, leftName, rightName, leftScore, rightScore]);

  return (
    <div className="postgame-screen">
      {/* Confetti canvas */}
      <canvas ref={canvasRef} className="postgame-confetti" />

      {/* Winner Announcement */}
      <div className="postgame-winner">
        <h1 className={`postgame-winner-text ${winnerClass}`}>{winnerText}</h1>
      </div>

      {/* Final Score */}
      <div className="postgame-score">
        <div className="postgame-score-numbers">
          <span className="postgame-score-left">{leftScore}</span>
          <span className="postgame-score-separator">&mdash;</span>
          <span className="postgame-score-right">{rightScore}</span>
        </div>
        <div className="postgame-score-names">
          <span className="postgame-score-name--left">{leftName}</span>
          <span className="postgame-score-name--right">{rightName}</span>
        </div>
      </div>

      {/* Stats Comparison Table */}
      <div className="postgame-stats">
        <h2 className="postgame-stats-title">Performance Stats</h2>
        <table className="postgame-stats-table">
          <thead>
            <tr>
              <th>Stat</th>
              <th>{leftName}</th>
              <th>{rightName}</th>
            </tr>
          </thead>
          <tbody>
            {statRows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{formatStat(stats.left, isLeftHuman, row.format)}</td>
                <td>{formatStat(stats.right, isRightHuman, row.format)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Best Trash Talk */}
      {trashTalkMessages.length > 0 && (
        <div className="postgame-trashtalk">
          <h2 className="postgame-trashtalk-title">Best Trash Talk</h2>
          <div className="postgame-trashtalk-list">
            {trashTalkMessages.map((msg, index) => (
              <div key={index} className="postgame-trashtalk-item">
                <div className="postgame-trashtalk-header">
                  <span className={`postgame-trashtalk-dot postgame-trashtalk-dot--${msg.side}`} />
                  <span className={`postgame-trashtalk-model postgame-trashtalk-model--${msg.side}`}>
                    {msg.modelName}
                  </span>
                </div>
                <div className="postgame-trashtalk-text">{msg.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="postgame-actions">
        <button className="postgame-btn postgame-btn--rematch" onClick={onRematch}>
          REMATCH
        </button>
        <button className="postgame-btn postgame-btn--new-match" onClick={onNewMatch}>
          NEW MATCH
        </button>
        <button
          className={`postgame-btn ${copied ? 'postgame-btn--copied' : 'postgame-btn--share'}`}
          onClick={handleShare}
        >
          {copied ? 'COPIED!' : 'SHARE RESULTS'}
        </button>
      </div>
    </div>
  );
}

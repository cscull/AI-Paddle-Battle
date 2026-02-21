import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameState, MatchConfig, TrashTalkMessage, MoveDirection } from '../types';
import { soundManager } from '../audio/SoundManager';
import '../styles/game.css';

// ── Constants (normalized 0-1) ──

const PADDLE_HEIGHT = 0.15;
const PADDLE_WIDTH = 0.015;
const PADDLE_X_LEFT = 0.02;
const PADDLE_X_RIGHT = 0.98;
const BALL_RADIUS = 0.01;
const ASPECT_RATIO = 16 / 10;

// ── Props ──

interface GameScreenProps {
  gameState: GameState;
  matchConfig: MatchConfig;
  trashTalkLog: TrashTalkMessage[];
  onPause: () => void;
  onResume: () => void;
  onEndMatch: () => void;
  onHumanInput: (side: 'left' | 'right', direction: MoveDirection) => void;
}

// ── Trash-talk bubble with typewriter effect ──

interface BubbleState {
  message: TrashTalkMessage;
  displayedLength: number;
  fadeStartTime: number | null;
}

function useTrashTalkBubbles(trashTalkLog: TrashTalkMessage[]) {
  const [leftBubble, setLeftBubble] = useState<BubbleState | null>(null);
  const [rightBubble, setRightBubble] = useState<BubbleState | null>(null);
  const leftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leftFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedCountRef = useRef(0);

  useEffect(() => {
    // Process only new messages
    const newMessages = trashTalkLog.slice(processedCountRef.current);
    processedCountRef.current = trashTalkLog.length;

    for (const msg of newMessages) {
      const side = msg.side;
      const setter = side === 'left' ? setLeftBubble : setRightBubble;
      const timerRef = side === 'left' ? leftTimerRef : rightTimerRef;
      const fadeRef = side === 'left' ? leftFadeRef : rightFadeRef;

      // Clear previous timers for this side
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);

      // Start new bubble with typewriter
      setter({ message: msg, displayedLength: 0, fadeStartTime: null });

      const interval = setInterval(() => {
        setter((prev) => {
          if (!prev) return null;
          const nextLen = prev.displayedLength + 1;
          if (nextLen >= prev.message.message.length) {
            clearInterval(interval);
            return { ...prev, displayedLength: prev.message.message.length };
          }
          return { ...prev, displayedLength: nextLen };
        });
      }, 20);
      timerRef.current = interval;

      // Fade out after 4 seconds
      const fadeTimeout = setTimeout(() => {
        setter((prev) => prev ? { ...prev, fadeStartTime: Date.now() } : null);
        const removeTimeout = setTimeout(() => {
          setter(null);
        }, 500);
        // Store the remove timeout so it can be cleaned up
        void removeTimeout;
      }, 4000);
      fadeRef.current = fadeTimeout;
    }
  }, [trashTalkLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leftTimerRef.current) clearInterval(leftTimerRef.current);
      if (rightTimerRef.current) clearInterval(rightTimerRef.current);
      if (leftFadeRef.current) clearTimeout(leftFadeRef.current);
      if (rightFadeRef.current) clearTimeout(rightFadeRef.current);
    };
  }, []);

  return { leftBubble, rightBubble };
}

// ── Canvas rendering ──

function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameState: GameState,
  leftName: string,
  rightName: string,
) {
  const w = canvas.width;
  const h = canvas.height;

  // Clear with dark background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  // Center dashed line
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.restore();

  // Left paddle (cyan)
  const lx = PADDLE_X_LEFT * w;
  const ly = gameState.paddles.left.y * h;
  const pw = PADDLE_WIDTH * w;
  const ph = PADDLE_HEIGHT * h;
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 8;
  ctx.fillRect(lx, ly, pw, ph);
  ctx.shadowBlur = 0;

  // Right paddle (magenta)
  const rx = (PADDLE_X_RIGHT - PADDLE_WIDTH) * w;
  const ry = gameState.paddles.right.y * h;
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 8;
  ctx.fillRect(rx, ry, pw, ph);
  ctx.shadowBlur = 0;

  // Ball (white)
  const bx = gameState.ball.x * w;
  const by = gameState.ball.y * h;
  const br = BALL_RADIUS * Math.min(w, h);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Score text
  const scoreText = `${gameState.score.left}  -  ${gameState.score.right}`;
  ctx.font = `bold ${Math.max(24, h * 0.07)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(scoreText, w / 2, h * 0.03);

  // Player names
  ctx.font = `${Math.max(12, h * 0.028)}px monospace`;
  ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
  ctx.textAlign = 'left';
  ctx.fillText(leftName, w * 0.04, h * 0.03);

  ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
  ctx.textAlign = 'right';
  ctx.fillText(rightName, w * 0.96, h * 0.03);

  // Time remaining
  const mins = Math.floor(gameState.timeRemainingSeconds / 60);
  const secs = Math.floor(gameState.timeRemainingSeconds % 60);
  const timeText = `${mins}:${secs.toString().padStart(2, '0')}`;
  ctx.font = `${Math.max(11, h * 0.025)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(timeText, w / 2, h * 0.03 + Math.max(28, h * 0.08));
}

// ── Component ──

export default function GameScreen({
  gameState,
  matchConfig,
  trashTalkLog,
  onPause,
  onResume,
  onEndMatch,
  onHumanInput,
}: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const prevStateRef = useRef<GameState | null>(null);
  const [canvasDims, setCanvasDims] = useState({ width: 800, height: 500 });
  const [muted, setMuted] = useState(soundManager.muted);

  const leftName = matchConfig.players.left.name;
  const rightName = matchConfig.players.right.name;
  const isLeftHuman = matchConfig.players.left.type === 'human';
  const isRightHuman = matchConfig.players.right.type === 'human';
  const isPaused = gameState.status === 'paused';

  const { leftBubble, rightBubble } = useTrashTalkBubbles(trashTalkLog);

  // ── Canvas sizing ──

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const maxW = rect.width - 16; // small padding
    const maxH = rect.height - 16;

    let cw = maxW;
    let ch = cw / ASPECT_RATIO;
    if (ch > maxH) {
      ch = maxH;
      cw = ch * ASPECT_RATIO;
    }
    cw = Math.floor(Math.max(cw, 320));
    ch = Math.floor(Math.max(ch, 200));

    setCanvasDims({ width: cw, height: ch });
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // ── Canvas render loop ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      renderFrame(ctx, canvas, gameState, leftName, rightName);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    animFrameRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, canvasDims, leftName, rightName]);

  // ── Sound events ──

  useEffect(() => {
    soundManager.gameStart();
  }, []);

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev) {
      // Detect score change
      if (
        prev.score.left !== gameState.score.left ||
        prev.score.right !== gameState.score.right
      ) {
        soundManager.score();
      }

      // Detect ball dx sign change (paddle hit approximation)
      if (prev.ball.dx !== 0 && gameState.ball.dx !== 0) {
        const prevSign = Math.sign(prev.ball.dx);
        const currSign = Math.sign(gameState.ball.dx);
        if (prevSign !== currSign) {
          soundManager.paddleHit();
        }
      }

      // Detect ball dy sign change (wall hit approximation)
      if (prev.ball.dy !== 0 && gameState.ball.dy !== 0) {
        const prevSignY = Math.sign(prev.ball.dy);
        const currSignY = Math.sign(gameState.ball.dy);
        if (prevSignY !== currSignY) {
          soundManager.wallHit();
        }
      }
    }
    prevStateRef.current = gameState;
  }, [gameState]);

  // ── Keyboard input for human players ──

  useEffect(() => {
    if (!isLeftHuman && !isRightHuman) return;

    const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

    const startInput = (side: 'left' | 'right', direction: MoveDirection, key: string) => {
      if (activeIntervals.has(key)) return;
      onHumanInput(side, direction);
      const interval = setInterval(() => {
        onHumanInput(side, direction);
      }, 50);
      activeIntervals.set(key, interval);
    };

    const stopInput = (side: 'left' | 'right', key: string) => {
      const interval = activeIntervals.get(key);
      if (interval) {
        clearInterval(interval);
        activeIntervals.delete(key);
      }
      onHumanInput(side, 'STAY');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (isLeftHuman) {
        if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          startInput('left', 'UP', 'left-up');
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          startInput('left', 'DOWN', 'left-down');
          return;
        }
      }

      if (isRightHuman) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          startInput('right', 'UP', 'right-up');
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          startInput('right', 'DOWN', 'right-down');
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isLeftHuman) {
        if (e.key === 'w' || e.key === 'W') {
          stopInput('left', 'left-up');
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          stopInput('left', 'left-down');
          return;
        }
      }

      if (isRightHuman) {
        if (e.key === 'ArrowUp') {
          stopInput('right', 'right-up');
          return;
        }
        if (e.key === 'ArrowDown') {
          stopInput('right', 'right-down');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clear all active intervals
      for (const interval of activeIntervals.values()) {
        clearInterval(interval);
      }
      activeIntervals.clear();
    };
  }, [isLeftHuman, isRightHuman, onHumanInput]);

  // ── Mute toggle ──

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    soundManager.setMuted(next);
  }, [muted]);

  return (
    <div className="game-screen">
      {/* Top controls bar */}
      <div className="game-controls">
        <div className="game-controls-left">
          {isPaused ? (
            <button className="game-btn game-btn--resume" onClick={onResume}>
              Resume
            </button>
          ) : (
            <button className="game-btn game-btn--pause" onClick={onPause}>
              Pause
            </button>
          )}
          <button className="game-btn game-btn--end" onClick={onEndMatch}>
            End Match
          </button>
        </div>

        <div className="game-controls-center">
          {leftName} vs {rightName}
        </div>

        <div className="game-controls-right">
          <button className="game-btn game-btn--mute" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? 'M' : 'S'}
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="game-canvas-container" ref={containerRef}>
        <div className="game-canvas-wrapper" style={{ width: canvasDims.width, height: canvasDims.height }}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={canvasDims.width}
            height={canvasDims.height}
          />

          {/* CRT scanline overlay */}
          <div className="game-crt-overlay" />

          {/* Trash talk bubbles */}
          <div className="game-trash-talk">
            {leftBubble && (
              <div
                className={`trash-talk-bubble trash-talk-bubble--left${leftBubble.fadeStartTime ? ' trash-talk-bubble--fading' : ''}`}
              >
                {leftBubble.message.message.slice(0, leftBubble.displayedLength)}
                {leftBubble.displayedLength < leftBubble.message.message.length && (
                  <span style={{ opacity: 0.5 }}>|</span>
                )}
              </div>
            )}
            {rightBubble && (
              <div
                className={`trash-talk-bubble trash-talk-bubble--right${rightBubble.fadeStartTime ? ' trash-talk-bubble--fading' : ''}`}
              >
                {rightBubble.message.message.slice(0, rightBubble.displayedLength)}
                {rightBubble.displayedLength < rightBubble.message.message.length && (
                  <span style={{ opacity: 0.5 }}>|</span>
                )}
              </div>
            )}
          </div>

          {/* Paused overlay */}
          {isPaused && (
            <div className="game-paused-overlay">
              <div className="game-paused-text">PAUSED</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

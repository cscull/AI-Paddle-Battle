import { useEffect, useRef } from 'react';
import type { TrashTalkMessage } from '../types';

interface TrashTalkLogProps {
  messages: TrashTalkMessage[];
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  // Fallback: show time
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TrashTalkLog({ messages }: TrashTalkLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="trash-talk-log" ref={containerRef}>
        <div className="trash-talk-empty">No trash talk yet...</div>
      </div>
    );
  }

  return (
    <div className="trash-talk-log" ref={containerRef}>
      {messages.map((msg, index) => (
        <div key={index} className={`trash-talk-msg trash-talk-msg--${msg.side}`}>
          <div className="trash-talk-msg-header">
            <span className="trash-talk-msg-dot" />
            <span className="trash-talk-msg-model">{msg.modelName}</span>
            <span className="trash-talk-msg-time">{formatRelativeTime(msg.timestamp)}</span>
          </div>
          <div className="trash-talk-msg-bubble">{msg.message}</div>
        </div>
      ))}
    </div>
  );
}

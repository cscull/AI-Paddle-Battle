import { describe, it, expect } from 'vitest';
import { parseMoveFromResponse, truncateTrashTalk } from '../adapters/base.js';

describe('parseMoveFromResponse', () => {
  it('parses valid JSON response', () => {
    expect(parseMoveFromResponse('{"move": "UP"}')).toEqual({ move: 'UP', method: 'json' });
    expect(parseMoveFromResponse('{"move": "DOWN"}')).toEqual({ move: 'DOWN', method: 'json' });
    expect(parseMoveFromResponse('{"move": "STAY"}')).toEqual({ move: 'STAY', method: 'json' });
  });

  it('extracts move from text with extra content', () => {
    expect(parseMoveFromResponse('Sure! {"move": "UP"}')).toEqual({ move: 'UP', method: 'regex_json' });
    expect(parseMoveFromResponse('```json\n{"move": "DOWN"}\n```')).toEqual({ move: 'DOWN', method: 'regex_json' });
  });

  it('extracts bare keywords', () => {
    expect(parseMoveFromResponse('UP')).toEqual({ move: 'UP', method: 'keyword' });
    expect(parseMoveFromResponse('I think DOWN')).toEqual({ move: 'DOWN', method: 'keyword' });
  });

  it('returns STAY for unparseable responses', () => {
    expect(parseMoveFromResponse('')).toEqual({ move: 'STAY', method: 'fallback' });
    expect(parseMoveFromResponse('I am not sure what to do')).toEqual({ move: 'STAY', method: 'fallback' });
    expect(parseMoveFromResponse('{"invalid": true}')).toEqual({ move: 'STAY', method: 'fallback' });
  });
});

describe('truncateTrashTalk', () => {
  it('returns short messages as-is', () => {
    expect(truncateTrashTalk('Nice shot!')).toBe('Nice shot!');
  });

  it('strips surrounding quotes', () => {
    expect(truncateTrashTalk('"Nice shot!"')).toBe('Nice shot!');
    expect(truncateTrashTalk("'Nice shot!'")).toBe('Nice shot!');
  });

  it('truncates messages over 150 characters', () => {
    const long = 'a'.repeat(200);
    const result = truncateTrashTalk(long);
    expect(result.length).toBe(150);
    expect(result.endsWith('...')).toBe(true);
  });
});

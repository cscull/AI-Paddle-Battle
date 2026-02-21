import { describe, it, expect } from 'vitest';
import { parseMoveFromResponse, truncateTrashTalk } from '../adapters/base.js';

describe('parseMoveFromResponse', () => {
  it('parses valid JSON response', () => {
    expect(parseMoveFromResponse('{"move": "UP"}')).toBe('UP');
    expect(parseMoveFromResponse('{"move": "DOWN"}')).toBe('DOWN');
    expect(parseMoveFromResponse('{"move": "STAY"}')).toBe('STAY');
  });

  it('extracts move from text with extra content', () => {
    expect(parseMoveFromResponse('Sure! {"move": "UP"}')).toBe('UP');
    expect(parseMoveFromResponse('```json\n{"move": "DOWN"}\n```')).toBe('DOWN');
  });

  it('extracts bare keywords', () => {
    expect(parseMoveFromResponse('UP')).toBe('UP');
    expect(parseMoveFromResponse('I think DOWN')).toBe('DOWN');
  });

  it('returns STAY for unparseable responses', () => {
    expect(parseMoveFromResponse('')).toBe('STAY');
    expect(parseMoveFromResponse('I am not sure what to do')).toBe('STAY');
    expect(parseMoveFromResponse('{"invalid": true}')).toBe('STAY');
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

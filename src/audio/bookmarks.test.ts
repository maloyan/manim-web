/**
 * Tests for the transcript bookmark parser. Pure, no DOM, runs in Node.
 */
import { describe, it, expect } from 'vitest';
import { parseBookmarks } from './bookmarks';

describe('parseBookmarks', () => {
  it('removes a marker and records its position in the clean text', () => {
    const result = parseBookmarks('ab <bookmark mark="m"/> cd');
    expect(result.text).toBe('ab  cd');
    expect(result.bookmarks).toEqual([{ mark: 'm', charIndex: 3 }]);
  });

  it('supports single quotes and several markers in order', () => {
    const result = parseBookmarks("<bookmark mark='a'/>X<bookmark mark='b'/>");
    expect(result.text).toBe('X');
    expect(result.bookmarks).toEqual([
      { mark: 'a', charIndex: 0 },
      { mark: 'b', charIndex: 1 },
    ]);
  });

  it('tolerates extra whitespace and a plain closing bracket', () => {
    const result = parseBookmarks('start <bookmark   mark = "x" > end');
    expect(result.text).toBe('start  end');
    expect(result.bookmarks).toEqual([{ mark: 'x', charIndex: 6 }]);
  });

  it('returns the input unchanged when there are no markers', () => {
    const result = parseBookmarks('plain narration text');
    expect(result.text).toBe('plain narration text');
    expect(result.bookmarks).toEqual([]);
  });
});

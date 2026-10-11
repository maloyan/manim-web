// @vitest-environment happy-dom
/**
 * Tests for Text per-substring styling (t2c / t2w / t2s) and the underlying
 * layout model in textStyleRuns.ts.
 *
 * Per the task, these test the layout MODEL (which run carries which style),
 * not the rasterized pixels. A mock 2D context lets the canvas render path run
 * so size bookkeeping can also be checked.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Text } from './Text';
import { buildStyledTextLines, runFontString, type TextStyleRun } from './textStyleRuns';

function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'left',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((t: string) => ({ width: t.length * 10 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') return createMockCtx();
    return null;
  });
});

describe('buildStyledTextLines (layout model)', () => {
  it('returns one plain null-styled run when no maps apply', () => {
    const lines = buildStyledTextLines('hello', {});
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual([{ text: 'hello', color: null, fontWeight: null, fontStyle: null }]);
  });

  it('colors the matched substring and leaves the rest null (t2c)', () => {
    const lines = buildStyledTextLines('hello world', { t2c: { world: '#ff0000' } });
    const runs = lines[0];
    expect(runs).toEqual([
      { text: 'hello ', color: null, fontWeight: null, fontStyle: null },
      { text: 'world', color: '#ff0000', fontWeight: null, fontStyle: null },
    ]);
  });

  it('colors every occurrence of a substring', () => {
    const lines = buildStyledTextLines('a b a', { t2c: { a: '#00ff00' } });
    const runs = lines[0];
    expect(runs.map((r) => ({ text: r.text, color: r.color }))).toEqual([
      { text: 'a', color: '#00ff00' },
      { text: ' b ', color: null },
      { text: 'a', color: '#00ff00' },
    ]);
  });

  it('records weight and style per run (t2w / t2s)', () => {
    const lines = buildStyledTextLines('bold slant', {
      t2w: { bold: 'bold' },
      t2s: { slant: 'italic' },
    });
    const runs = lines[0];
    expect(runs).toEqual([
      { text: 'bold', color: null, fontWeight: 'bold', fontStyle: null },
      { text: ' ', color: null, fontWeight: null, fontStyle: null },
      { text: 'slant', color: null, fontWeight: null, fontStyle: 'italic' },
    ]);
  });

  it('combines overlapping color and weight on the same characters', () => {
    const lines = buildStyledTextLines('key', { t2c: { key: '#111111' }, t2w: { key: 700 } });
    expect(lines[0]).toEqual([{ text: 'key', color: '#111111', fontWeight: 700, fontStyle: null }]);
  });

  it('lets a later map key override an earlier one where they overlap', () => {
    const lines = buildStyledTextLines('abc', { t2c: { a: '#aaaaaa', abc: '#bbbbbb' } });
    expect(lines[0]).toEqual([
      { text: 'abc', color: '#bbbbbb', fontWeight: null, fontStyle: null },
    ]);
  });

  it('splits on newlines into separate lines of runs', () => {
    const lines = buildStyledTextLines('a\nb', { t2c: { a: '#ff0000' } });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual([{ text: 'a', color: '#ff0000', fontWeight: null, fontStyle: null }]);
    expect(lines[1]).toEqual([{ text: 'b', color: null, fontWeight: null, fontStyle: null }]);
  });

  it('yields an empty run list for an empty line', () => {
    const lines = buildStyledTextLines('', { t2c: { a: '#ff0000' } });
    expect(lines).toEqual([[]]);
  });
});

describe('runFontString', () => {
  const base = { fontStyle: 'normal', fontWeight: 'normal', sizePt: 96, fontFamily: 'serif' };

  it('uses base fields when the run has none', () => {
    const run: TextStyleRun = { text: 'x', color: null, fontWeight: null, fontStyle: null };
    expect(runFontString(run, base)).toBe('normal normal 96pt serif');
  });

  it('applies the run weight and style over the base', () => {
    const run: TextStyleRun = { text: 'x', color: null, fontWeight: 700, fontStyle: 'italic' };
    expect(runFontString(run, base)).toBe('italic 700 96pt serif');
  });
});

describe('Text with t2c / t2w / t2s', () => {
  it('exposes the style model via getStyledTextLines', () => {
    const t = new Text({ text: 'red green', t2c: { green: '#00ff00' } });
    const runs = t.getStyledTextLines()[0];
    expect(runs).toEqual([
      { text: 'red ', color: null, fontWeight: null, fontStyle: null },
      { text: 'green', color: '#00ff00', fontWeight: null, fontStyle: null },
    ]);
  });

  it('renders through the styled path and keeps a positive size', () => {
    const t = new Text({ text: 'hello world', t2c: { world: '#ff0000' } });
    expect(t.getWidth()).toBeGreaterThan(0);
    expect(t.getHeight()).toBeGreaterThan(0);
  });

  it('matches plain-Text size when runs do not change glyph widths', () => {
    const plain = new Text({ text: 'hello world' });
    const styled = new Text({ text: 'hello world', t2c: { world: '#ff0000' } });
    // The mock measureText is font-independent, so coloring must not change size.
    expect(styled.getWidth()).toBeCloseTo(plain.getWidth(), 6);
    expect(styled.getHeight()).toBeCloseTo(plain.getHeight(), 6);
  });

  it('does not use the styled path when no maps are given', () => {
    const t = new Text({ text: 'plain' });
    expect(t.getStyledTextLines()[0]).toEqual([
      { text: 'plain', color: null, fontWeight: null, fontStyle: null },
    ]);
    expect(t.getWidth()).toBeGreaterThan(0);
  });

  it('carries the style maps onto a copy', () => {
    const t = new Text({ text: 'copy me', t2c: { me: '#0000ff' } });
    const c = t.copy();
    expect(c.getStyledTextLines()[0]).toEqual([
      { text: 'copy ', color: null, fontWeight: null, fontStyle: null },
      { text: 'me', color: '#0000ff', fontWeight: null, fontStyle: null },
    ]);
  });
});

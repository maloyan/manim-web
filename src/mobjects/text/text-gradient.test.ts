// @vitest-environment happy-dom
/**
 * Tests for the linear color gradient fill of Text
 * (Manim CE `Text(..., gradient=(A, B, ...))`).
 *
 * Per the task, these test the pure stop-builder and the layout MODEL state
 * (whether the gradient render path is taken and which paint each run gets),
 * not the rasterized pixels. The canvas 2D context is mocked, including a
 * `createLinearGradient` that returns a sentinel so run paints can be checked.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Text } from './Text';
import { buildGradientStops, gradientIsActive } from './textStyleRuns';

/** A sentinel CanvasGradient that records its color stops. */
interface MockGradient {
  __isGradient: true;
  stops: Array<{ offset: number; color: string }>;
  addColorStop: (offset: number, color: string) => void;
}

interface MockCtx {
  ctx: CanvasRenderingContext2D;
  /** The fillStyle value at each fillText call, in order. */
  fills: Array<string | MockGradient>;
  gradients: MockGradient[];
}

function createMockCtx(): MockCtx {
  const fills: Array<string | MockGradient> = [];
  const gradients: MockGradient[] = [];

  const ctx = {
    font: '',
    textBaseline: 'top' as CanvasTextBaseline,
    textAlign: 'left' as CanvasTextAlign,
    fillStyle: '' as string | MockGradient,
    strokeStyle: '' as string | MockGradient,
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((t: string) => ({ width: t.length * 10 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => {
      const grad: MockGradient = {
        __isGradient: true,
        stops: [],
        addColorStop(offset: number, color: string) {
          this.stops.push({ offset, color });
        },
      };
      gradients.push(grad);
      return grad;
    }),
  };
  // Record the fillStyle in force at each fillText so run paints can be asserted.
  ctx.fillText = vi.fn(() => {
    fills.push(ctx.fillStyle);
  });

  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills, gradients };
}

let lastMock: MockCtx;

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      lastMock = createMockCtx();
      return lastMock.ctx;
    }
    return null;
  });
});

describe('buildGradientStops (pure stop math)', () => {
  it('maps two colors to offsets 0 and 1', () => {
    expect(buildGradientStops(['#ff0000', '#0000ff'])).toEqual([
      { offset: 0, color: '#ff0000' },
      { offset: 1, color: '#0000ff' },
    ]);
  });

  it('maps three colors to offsets 0, 0.5 and 1', () => {
    expect(buildGradientStops(['#ff0000', '#00ff00', '#0000ff'])).toEqual([
      { offset: 0, color: '#ff0000' },
      { offset: 0.5, color: '#00ff00' },
      { offset: 1, color: '#0000ff' },
    ]);
  });

  it('spaces n colors evenly and preserves their order', () => {
    const colors = ['#000000', '#111111', '#222222', '#333333', '#444444'];
    const stops = buildGradientStops(colors);
    expect(stops.map((s) => s.offset)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(stops.map((s) => s.color)).toEqual(colors);
  });

  it('handles a single color as a degenerate one-stop gradient', () => {
    expect(buildGradientStops(['#abcdef'])).toEqual([{ offset: 0, color: '#abcdef' }]);
  });

  it('returns no stops for an empty color list', () => {
    expect(buildGradientStops([])).toEqual([]);
  });
});

describe('gradientIsActive', () => {
  it('is false for null, undefined, empty and single-color', () => {
    expect(gradientIsActive(null)).toBe(false);
    expect(gradientIsActive(undefined)).toBe(false);
    expect(gradientIsActive([])).toBe(false);
    expect(gradientIsActive(['#ff0000'])).toBe(false);
  });

  it('is true for two or more colors', () => {
    expect(gradientIsActive(['#ff0000', '#0000ff'])).toBe(true);
    expect(gradientIsActive(['#a', '#b', '#c'])).toBe(true);
  });
});

describe('Text with gradient', () => {
  it('records the gradient colors on the model', () => {
    const t = new Text({ text: 'hello', gradient: ['#ff0000', '#0000ff'] });
    expect(t.getGradient()).toEqual(['#ff0000', '#0000ff']);
  });

  it('returns a copy of the gradient, not the internal array', () => {
    const colors = ['#ff0000', '#0000ff'];
    const t = new Text({ text: 'hi', gradient: colors });
    const got = t.getGradient();
    expect(got).not.toBe(colors);
    got?.push('#00ff00');
    expect(t.getGradient()).toEqual(['#ff0000', '#0000ff']);
  });

  it('takes the styled render path and builds a canvas gradient with the stops', () => {
    new Text({ text: 'hi', gradient: ['#ff0000', '#0000ff'] });
    expect(lastMock.ctx.createLinearGradient).toHaveBeenCalledTimes(1);
    expect(lastMock.gradients).toHaveLength(1);
    expect(lastMock.gradients[0].stops).toEqual([
      { offset: 0, color: '#ff0000' },
      { offset: 1, color: '#0000ff' },
    ]);
  });

  it('fills every glyph run with the gradient when no t2c color applies', () => {
    new Text({ text: 'hi', gradient: ['#ff0000', '#0000ff'] });
    expect(lastMock.fills.length).toBeGreaterThan(0);
    for (const fill of lastMock.fills) {
      expect(fill).toBe(lastMock.gradients[0]);
    }
  });

  it('keeps a positive rendered size', () => {
    const t = new Text({ text: 'gradient text', gradient: ['#ff0000', '#0000ff'] });
    expect(t.getWidth()).toBeGreaterThan(0);
    expect(t.getHeight()).toBeGreaterThan(0);
  });

  it('carries the gradient onto a copy', () => {
    const t = new Text({ text: 'copy me', gradient: ['#ff0000', '#0000ff'] });
    expect(t.copy().getGradient()).toEqual(['#ff0000', '#0000ff']);
  });

  it('matches plain-Text size (coloring does not change glyph widths)', () => {
    const plain = new Text({ text: 'hello world' });
    const grad = new Text({ text: 'hello world', gradient: ['#ff0000', '#0000ff'] });
    expect(grad.getWidth()).toBeCloseTo(plain.getWidth(), 6);
    expect(grad.getHeight()).toBeCloseTo(plain.getHeight(), 6);
  });
});

describe('gradient composes with t2c', () => {
  it('keeps an explicit t2c color and gives the gradient to the rest', () => {
    // 'red ' has no t2c (so gradient) and 'keep' is pinned to a flat color.
    new Text({
      text: 'red keep',
      gradient: ['#ff0000', '#0000ff'],
      t2c: { keep: '#00ff00' },
    });
    // Runs draw left to right: the 'red ' run paints with the gradient object,
    // the 'keep' run paints with its flat t2c color string.
    const gradient = lastMock.gradients[0];
    expect(lastMock.fills).toContain(gradient);
    expect(lastMock.fills).toContain('#00ff00');
    // The last drawn run ('keep') keeps its explicit color, not the gradient.
    expect(lastMock.fills[lastMock.fills.length - 1]).toBe('#00ff00');
  });
});

describe('plain Text is unchanged (no gradient)', () => {
  it('reports no gradient and never builds a canvas gradient', () => {
    const t = new Text({ text: 'plain' });
    expect(t.getGradient()).toBeNull();
    expect(lastMock.ctx.createLinearGradient).not.toHaveBeenCalled();
  });

  it('fills with the flat color string, not a gradient', () => {
    new Text({ text: 'plain', color: '#123456' });
    expect(lastMock.fills.length).toBeGreaterThan(0);
    for (const fill of lastMock.fills) {
      expect(fill).toBe('#123456');
    }
  });

  it('ignores a single-color gradient (needs 2+) and stays on the flat path', () => {
    const t = new Text({ text: 'one', color: '#123456', gradient: ['#abcdef'] });
    // The model still records what was passed, but the render stays flat.
    expect(t.getGradient()).toEqual(['#abcdef']);
    expect(lastMock.ctx.createLinearGradient).not.toHaveBeenCalled();
    for (const fill of lastMock.fills) {
      expect(fill).toBe('#123456');
    }
  });
});

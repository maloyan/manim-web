/**
 * Tests for disjoint-contour handling in GlyphVMobject (issue #716).
 *
 * A glyph such as 'i' (stem + dot) or 'b' (stem + bowl counter) has MULTIPLE
 * disjoint contours. Each contour must become its own stroked subpath. If the
 * contours are strung into one point list and bridged with a connecting cubic,
 * the renderer draws a visible straight line between the pieces (the stray
 * lines reported in the TextOnPath example).
 *
 * These tests use a hand-built opentype-style glyph stub (two distant
 * rectangular contours), so they run without loading a font.
 */

import { describe, it, expect } from 'vitest';
import type { Font, Glyph } from 'opentype.js';
import { GlyphVMobject } from './GlyphVMobject';

/** A single opentype-style path command. */
interface PathCommand {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

/**
 * Build a glyph stub whose outline is two disjoint rectangular contours:
 * a small "stem" near the origin and a small "dot" far above it. The vertical
 * gap between them is much larger than any single contour edge, so a bridging
 * segment between the two pieces is unmistakable.
 */
function twoContourGlyphStub(): Glyph {
  // Contour A ("stem"): a 5 x 50 bar. Max edge = 50 units.
  // Contour B ("dot"): a 5 x 5 square, 200 units above the stem.
  const commands: PathCommand[] = [
    { type: 'M', x: 0, y: 0 },
    { type: 'L', x: 5, y: 0 },
    { type: 'L', x: 5, y: 50 },
    { type: 'L', x: 0, y: 50 },
    { type: 'Z' },
    { type: 'M', x: 0, y: 200 },
    { type: 'L', x: 5, y: 200 },
    { type: 'L', x: 5, y: 205 },
    { type: 'L', x: 0, y: 205 },
    { type: 'Z' },
  ];
  const stub = {
    index: 42,
    advanceWidth: 10,
    getPath: () => ({ commands }),
  };
  return stub as unknown as Glyph;
}

describe('GlyphVMobject disjoint contours (#716)', () => {
  const PIXEL_TO_WORLD = 1 / 100;

  it('emits one subpath per contour with no bridging line between them', () => {
    const glyph = new GlyphVMobject({
      glyph: twoContourGlyphStub(),
      font: null as unknown as Font,
      fontSize: 48,
      strokeWidth: 2,
    });

    const points = glyph.getPoints();
    expect(points.length).toBeGreaterThan(0);

    // Each disjoint contour must be its own subpath, not one strung path.
    const lengths = glyph.getEffectiveSubpathLengths();
    expect(lengths).toBeDefined();
    expect(lengths!.length).toBe(2);
    // The subpath lengths must tile the full point list exactly.
    expect(lengths!.reduce((a, b) => a + b, 0)).toBe(points.length);

    // Within a contour, every edge is at most 50 units (0.5 world), split into
    // thirds by the line->cubic conversion, so consecutive control points never
    // step more than ~0.5 world. The gap between the two contours is 200 units
    // (2.0 world): a bridging segment would show up as a step far above that.
    const maxContourStep = 50 * PIXEL_TO_WORLD + 1e-6;

    const subpathLengths = lengths ?? [points.length];
    let offset = 0;
    for (const len of subpathLengths) {
      for (let i = offset + 1; i < offset + len; i++) {
        const a = points[i - 1];
        const b = points[i];
        const step = Math.hypot(b[0] - a[0], b[1] - a[1]);
        expect(step).toBeLessThan(maxContourStep);
      }
      offset += len;
    }
  });

  it('keeps a single-contour glyph as one subpath', () => {
    const singleContour: PathCommand[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'L', x: 0, y: 10 },
      { type: 'Z' },
    ];
    const stub = {
      index: 7,
      advanceWidth: 12,
      getPath: () => ({ commands: singleContour }),
    } as unknown as Glyph;

    const glyph = new GlyphVMobject({ glyph: stub, font: null as unknown as Font, fontSize: 48 });

    const lengths = glyph.getEffectiveSubpathLengths();
    expect(lengths).toBeDefined();
    expect(lengths!.length).toBe(1);
    expect(lengths!.reduce((a, b) => a + b, 0)).toBe(glyph.getPoints().length);
  });
});

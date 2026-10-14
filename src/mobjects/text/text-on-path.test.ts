/**
 * Tests for text-on-a-path layout: the pure layout math and the TextOnPath
 * VGroup. The layout tests use synthetic point chains and stub glyphs, so they
 * run without loading any font.
 */

import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { Circle } from '../geometry/Circle';
import { TextOnPath } from './TextOnPath';
import {
  computeGlyphPlacements,
  sampledPathFromFunction,
  sampledPathFromPoints,
  visibleGlyphChars,
  alignmentToOffset,
  type GlyphLayoutEntry,
} from './textOnPathLayout';

/** A horizontal straight-line point chain from (x0,0) to (x1,0). */
function horizontalLine(x0: number, x1: number): number[][] {
  const dx = x1 - x0;
  return [
    [x0, 0, 0],
    [x0 + dx / 3, 0, 0],
    [x0 + (2 * dx) / 3, 0, 0],
    [x1, 0, 0],
  ];
}

/** A stub glyph: a small square VMobject of the given world width. */
function makeGlyph(width = 0.3): VMobject {
  const h = width / 2;
  const v = new VMobject();
  v.setPoints3D([
    [-h, -h, 0],
    [h, -h, 0],
    [h, h, 0],
    [-h, h, 0],
  ]);
  return v;
}

/** Shortest signed difference between two angles, in (-pi, pi]. */
function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

describe('textOnPathLayout - pure math', () => {
  describe('straight horizontal line', () => {
    it('advances glyphs in +x with no rotation', () => {
      const path = sampledPathFromPoints(horizontalLine(-2, 2));
      const glyphs: GlyphLayoutEntry[] = [{ width: 0.5 }, { width: 0.5 }, { width: 0.5 }];
      const placements = computeGlyphPlacements(glyphs, path);

      expect(placements).toHaveLength(3);
      for (let i = 1; i < placements.length; i++) {
        expect(placements[i].center[0]).toBeGreaterThan(placements[i - 1].center[0]);
      }
      for (const p of placements) {
        expect(Math.abs(p.angle)).toBeLessThan(1e-6);
        expect(Math.abs(p.center[1])).toBeLessThan(1e-9);
      }
    });

    it('glyph centers sit at pen + width/2', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 10));
      const placements = computeGlyphPlacements([{ width: 2 }, { width: 2 }], path);
      // First center at 0 + 2/2 = 1, second at 2 + 2/2 = 3.
      expect(placements[0].center[0]).toBeCloseTo(1, 5);
      expect(placements[1].center[0]).toBeCloseTo(3, 5);
    });
  });

  describe('circle / arc', () => {
    it('places successive glyphs at increasing angle, matching the tangent', () => {
      const circle = new Circle({ radius: 1 });
      const path = sampledPathFromPoints(circle.getPoints());
      const glyphs: GlyphLayoutEntry[] = Array.from({ length: 4 }, () => ({ width: 0.3 }));
      const placements = computeGlyphPlacements(glyphs, path);

      // Angles strictly increase along the (counter-clockwise) arc.
      for (let i = 1; i < placements.length; i++) {
        expect(placements[i].angle).toBeGreaterThan(placements[i - 1].angle);
      }

      // Each glyph's rotation matches the circle tangent: for a point at polar
      // angle phi on a CCW circle, the tangent angle is phi + pi/2.
      for (const p of placements) {
        const phi = Math.atan2(p.center[1], p.center[0]);
        expect(Math.abs(angleDelta(p.angle, phi + Math.PI / 2))).toBeLessThan(0.1);
      }
    });

    it('keeps glyph centers on the unit circle (radius preserved)', () => {
      const circle = new Circle({ radius: 1 });
      const path = sampledPathFromPoints(circle.getPoints());
      const placements = computeGlyphPlacements([{ width: 0.3 }, { width: 0.3 }], path);
      for (const p of placements) {
        const r = Math.hypot(p.center[0], p.center[1]);
        expect(r).toBeCloseTo(1, 1);
      }
    });
  });

  describe('startOffset', () => {
    it('shifts the whole run along the path', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 10));
      const base = computeGlyphPlacements([{ width: 1 }, { width: 1 }], path);
      const shifted = computeGlyphPlacements([{ width: 1 }, { width: 1 }], path, {
        startOffset: 3,
      });
      for (let i = 0; i < base.length; i++) {
        expect(shifted[i].center[0] - base[i].center[0]).toBeCloseTo(3, 5);
      }
    });
  });

  describe('tracking', () => {
    it('adds spacing between glyphs', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 10));
      const tight = computeGlyphPlacements([{ width: 1 }, { width: 1 }], path);
      const loose = computeGlyphPlacements([{ width: 1 }, { width: 1 }], path, { tracking: 1 });
      // Second glyph is pushed further out by the tracking amount.
      expect(loose[1].center[0] - tight[1].center[0]).toBeCloseTo(1, 5);
    });
  });

  describe('rotateWithTangent', () => {
    it('emits zero angle when disabled', () => {
      const circle = new Circle({ radius: 1 });
      const path = sampledPathFromPoints(circle.getPoints());
      const placements = computeGlyphPlacements([{ width: 0.3 }, { width: 0.3 }], path, {
        rotateWithTangent: false,
      });
      for (const p of placements) {
        expect(p.angle).toBe(0);
      }
    });
  });

  describe('overflow', () => {
    it('marks a glyph that runs past the end and clamps by default', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 2));
      const placements = computeGlyphPlacements([{ width: 1 }, { width: 1 }, { width: 1 }], path);
      // Third glyph center at 2.5 > total length 2 -> overflow, clamped to end.
      expect(placements[2].overflow).toBe(true);
      expect(placements[2].center[0]).toBeCloseTo(2, 5);
    });

    it('wraps around the path when overflow is wrap', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 2));
      const placements = computeGlyphPlacements([{ width: 1 }, { width: 1 }, { width: 1 }], path, {
        overflow: 'wrap',
      });
      // Third glyph center at 2.5 wraps to 0.5 along the path.
      expect(placements[2].overflow).toBe(true);
      expect(placements[2].center[0]).toBeCloseTo(0.5, 5);
    });
  });

  describe('alignment', () => {
    it('offsets glyphs perpendicular to the curve', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 10));
      const placements = computeGlyphPlacements([{ width: 1 }], path, { alignmentOffset: 0.5 });
      // On a +x line the perpendicular is +y.
      expect(placements[0].center[1]).toBeCloseTo(0.5, 5);
    });

    it('maps alignment modes to offsets', () => {
      expect(alignmentToOffset('center', 1)).toBe(0);
      expect(alignmentToOffset('baseline', 1)).toBeCloseTo(0.5, 5);
      expect(alignmentToOffset('top', 1)).toBeCloseTo(-0.5, 5);
    });
  });

  describe('empty and degenerate inputs', () => {
    it('returns no placements for an empty glyph list', () => {
      const path = sampledPathFromPoints(horizontalLine(0, 1));
      expect(computeGlyphPlacements([], path)).toEqual([]);
    });

    it('does not throw on an empty point chain', () => {
      const path = sampledPathFromPoints([]);
      expect(path.totalLength).toBe(0);
      expect(() => computeGlyphPlacements([{ width: 1 }], path)).not.toThrow();
    });
  });

  describe('function path', () => {
    it('lays glyphs along a parametric curve', () => {
      const path = sampledPathFromFunction((t) => [t * 4, 0, 0]);
      expect(path.totalLength).toBeCloseTo(4, 3);
      const placements = computeGlyphPlacements([{ width: 1 }, { width: 1 }], path);
      expect(placements[1].center[0]).toBeGreaterThan(placements[0].center[0]);
      expect(Math.abs(placements[0].angle)).toBeLessThan(1e-6);
    });
  });
});

describe('visibleGlyphChars', () => {
  it('returns visible characters, excluding whitespace', () => {
    expect(visibleGlyphChars('abc')).toEqual(['a', 'b', 'c']);
    expect(visibleGlyphChars('a b c')).toEqual(['a', 'b', 'c']);
    expect(visibleGlyphChars('hello world')).toHaveLength(10);
  });

  it('returns an empty array for an empty or whitespace-only string', () => {
    expect(visibleGlyphChars('')).toEqual([]);
    expect(visibleGlyphChars('   ')).toEqual([]);
  });
});

describe('TextOnPath (synchronous glyph mode)', () => {
  it('lays out one child per glyph along a line', () => {
    const glyphs = [makeGlyph(), makeGlyph(), makeGlyph()];
    const t = new TextOnPath({
      glyphs: glyphs.map((mobject) => ({ mobject, width: 0.3 })),
      path: horizontalLine(-2, 2),
    });
    expect(t.children).toHaveLength(3);
    // Children advance in +x.
    const xs = t.children.map((c) => c.getCenter()[0]);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
  });

  it('defaults glyph width to the mobject width', () => {
    const first = makeGlyph(0.4);
    const measuredWidth = first.getWidth();
    const t = new TextOnPath({
      glyphs: [{ mobject: first }, { mobject: makeGlyph(0.4) }],
      path: horizontalLine(0, 10),
    });
    expect(t.children).toHaveLength(2);
    const dx = t.children[1].getCenter()[0] - t.children[0].getCenter()[0];
    // With no explicit width, spacing equals the measured advance width.
    expect(dx).toBeCloseTo(measuredWidth, 4);
  });

  it('rotates glyphs along a circle', () => {
    const circle = new Circle({ radius: 1 });
    const glyphs = Array.from({ length: 4 }, () => makeGlyph(0.3));
    const t = new TextOnPath({
      glyphs: glyphs.map((mobject) => ({ mobject, width: 0.3 })),
      path: circle,
    });
    const angles = t.children.map((c) => c.rotation.z);
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]).toBeGreaterThan(angles[i - 1]);
    }
  });

  it('is an empty group for an empty glyph list', () => {
    const t = new TextOnPath({ glyphs: [], path: horizontalLine(0, 1) });
    expect(t.children).toHaveLength(0);
  });

  it('lands the given anchor on the path, not the bounding-box center', () => {
    // A square whose bounding-box center sits at local (1, 0.5), far from its
    // anchor at the origin. The anchor must land on the path; the box rides the
    // offset. This models a glyph ('i') whose ink box differs from its advance
    // box: without the anchor it would be misplaced along and across the path.
    const glyph = new VMobject();
    glyph.setPoints3D([
      [0.5, 0, 0],
      [1.5, 0, 0],
      [1.5, 1, 0],
      [0.5, 1, 0],
    ]);
    const t = new TextOnPath({
      glyphs: [{ mobject: glyph, width: 2, anchor: [0, 0, 0] }],
      path: horizontalLine(0, 10),
    });
    // Single glyph of width 2 -> anchor target is at x = width/2 = 1.
    // The box center is offset (1, 0.5) from the anchor, so it ends at (2, 0.5).
    const center = t.children[0].getCenter();
    expect(center[0]).toBeCloseTo(2, 5);
    expect(center[1]).toBeCloseTo(0.5, 5);
  });

  it('keeps bounding-box placement when no anchor is given', () => {
    const glyph = new VMobject();
    glyph.setPoints3D([
      [0.5, 0, 0],
      [1.5, 0, 0],
      [1.5, 1, 0],
      [0.5, 1, 0],
    ]);
    const t = new TextOnPath({
      glyphs: [{ mobject: glyph, width: 2 }],
      path: horizontalLine(0, 10),
    });
    // No anchor: the bounding-box center lands on the path point (x = 1, y = 0).
    const center = t.children[0].getCenter();
    expect(center[0]).toBeCloseTo(1, 5);
    expect(center[1]).toBeCloseTo(0, 5);
  });

  it('shifts the run by startOffset', () => {
    const base = new TextOnPath({
      glyphs: [{ mobject: makeGlyph(0.3), width: 0.3 }],
      path: horizontalLine(0, 10),
    });
    const shifted = new TextOnPath({
      glyphs: [{ mobject: makeGlyph(0.3), width: 0.3 }],
      path: horizontalLine(0, 10),
      startOffset: 2,
    });
    const dx = shifted.children[0].getCenter()[0] - base.children[0].getCenter()[0];
    expect(dx).toBeCloseTo(2, 5);
  });
});

describe('TextOnPath (empty string font mode)', () => {
  it('is an empty group and resolves without throwing', async () => {
    const t = new TextOnPath({
      text: '',
      fontUrl: 'http://example.com/font.otf',
      path: horizontalLine(0, 1),
    });
    await expect(t.waitForReady()).resolves.toBeUndefined();
    expect(t.children).toHaveLength(0);
  });
});

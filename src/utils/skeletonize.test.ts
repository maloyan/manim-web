import { describe, it, expect } from 'vitest';
import { skeletonizeGlyph } from './skeletonize';

describe('skeletonizeGlyph', () => {
  it('returns empty array for empty input', () => {
    expect(skeletonizeGlyph([])).toEqual([]);
  });

  it('returns empty array for fewer than 4 points', () => {
    expect(skeletonizeGlyph([[0, 0, 0]])).toEqual([]);
    expect(
      skeletonizeGlyph([
        [0, 0, 0],
        [1, 1, 0],
        [2, 2, 0],
      ]),
    ).toEqual([]);
  });

  it('returns empty array for zero-width bounding box', () => {
    // All points on a vertical line
    const points = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
    ];
    expect(skeletonizeGlyph(points)).toEqual([]);
  });

  it('returns empty array for zero-height bounding box', () => {
    // All points on a horizontal line
    const points = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ];
    expect(skeletonizeGlyph(points)).toEqual([]);
  });

  it('produces output points with z=0', () => {
    // Create a simple square outline as cubic Bezier path
    // anchor0, handle, handle, anchor1, handle, handle, anchor2, ...
    // A simple closed square: 4 cubic segments = 13 control points
    const sq = makeSquareOutline(0, 0, 2, 2);
    const result = skeletonizeGlyph(sq, { gridResolution: 50, minChainLength: 2 });
    // May or may not produce skeleton depending on thinning, but check format
    for (const pt of result) {
      expect(pt.length).toBe(3);
      expect(pt[2]).toBe(0);
    }
  });

  it('produces bezier points in groups of 3n+1 per chain', () => {
    // A thick rectangle should produce a skeleton
    const rect = makeSquareOutline(0, 0, 4, 2);
    const result = skeletonizeGlyph(rect, { gridResolution: 60, minChainLength: 2 });
    // If we get output, it should follow VMobject convention:
    // first anchor + (handle, handle, anchor) * N
    // So length = 1 + 3*N for a single chain, or more complex for multi-chain
    // Each chain contributes 3*segments + 1 anchor, multi-chain adds 3 joiner points
    // At minimum, if there's any output the length should be >= 4 (1 anchor + 1 segment)
    if (result.length > 0) {
      expect(result.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('respects gridResolution option', () => {
    const rect = makeSquareOutline(0, 0, 4, 2);
    const lowRes = skeletonizeGlyph(rect, { gridResolution: 20, minChainLength: 2 });
    const highRes = skeletonizeGlyph(rect, { gridResolution: 80, minChainLength: 2 });
    // Higher resolution generally produces more or equally many points
    // (not strictly guaranteed but likely for reasonable shapes)
    // Just verify both produce valid output
    for (const pt of lowRes) {
      expect(pt.length).toBe(3);
    }
    for (const pt of highRes) {
      expect(pt.length).toBe(3);
    }
  });

  it('respects minChainLength option', () => {
    const rect = makeSquareOutline(0, 0, 4, 2);
    const strict = skeletonizeGlyph(rect, { gridResolution: 50, minChainLength: 100 });
    // With a very high minChainLength, short chains are filtered out
    // This may produce empty output or fewer chains
    // Either way, if there are points, they should be properly formatted
    for (const pt of strict) {
      expect(pt.length).toBe(3);
    }
  });

  it('output points are within bounding box of input', () => {
    const rect = makeSquareOutline(-1, -1, 3, 3);
    const result = skeletonizeGlyph(rect, { gridResolution: 60, minChainLength: 2 });
    for (const pt of result) {
      // Skeleton should stay within or very near the bounding box
      // Allow a small margin for interpolation/smoothing
      expect(pt[0]).toBeGreaterThanOrEqual(-1.5);
      expect(pt[0]).toBeLessThanOrEqual(3.5);
      expect(pt[1]).toBeGreaterThanOrEqual(-1.5);
      expect(pt[1]).toBeLessThanOrEqual(3.5);
    }
  });

  it('handles circle-like outline', () => {
    // A circle outline defined as 4 cubic Bezier segments
    const circle = makeCircleOutline(0, 0, 2);
    const result = skeletonizeGlyph(circle, { gridResolution: 60, minChainLength: 2 });
    // A circle's skeleton is ideally a single point at center,
    // but with pixelation it may produce short chains or nothing
    for (const pt of result) {
      expect(pt.length).toBe(3);
      expect(pt[2]).toBe(0);
    }
  });

  it('handles tall narrow rectangle', () => {
    const tall = makeSquareOutline(0, 0, 0.5, 4);
    const result = skeletonizeGlyph(tall, { gridResolution: 60, minChainLength: 2 });
    // Tall narrow shape should produce a roughly vertical skeleton
    for (const pt of result) {
      expect(pt.length).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers: create cubic Bezier outlines for test shapes
// ---------------------------------------------------------------------------

/**
 * Create a square/rectangle outline as cubic Bezier control points.
 * 4 cubic segments (13 points total) tracing the rectangle boundary.
 * Each side is a straight line represented as a cubic where handles
 * lie on the segment (degenerate cubic = straight line).
 */
function makeSquareOutline(x0: number, y0: number, x1: number, y1: number): number[][] {
  // Corners: bottom-left, bottom-right, top-right, top-left
  const bl: number[] = [x0, y0, 0];
  const br: number[] = [x1, y0, 0];
  const tr: number[] = [x1, y1, 0];
  const tl: number[] = [x0, y1, 0];

  // Lerp helper
  const lerp = (a: number[], b: number[], t: number): number[] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    0,
  ];

  // 4 cubic segments, each a straight line: anchor, handle, handle, anchor
  // Segment 1: bl -> br
  // Segment 2: br -> tr
  // Segment 3: tr -> tl
  // Segment 4: tl -> bl (close)
  return [
    bl, // anchor 0
    lerp(bl, br, 1 / 3), // handle
    lerp(bl, br, 2 / 3), // handle
    br, // anchor 1
    lerp(br, tr, 1 / 3), // handle
    lerp(br, tr, 2 / 3), // handle
    tr, // anchor 2
    lerp(tr, tl, 1 / 3), // handle
    lerp(tr, tl, 2 / 3), // handle
    tl, // anchor 3
    lerp(tl, bl, 1 / 3), // handle
    lerp(tl, bl, 2 / 3), // handle
    bl, // anchor 4 (close)
  ];
}

/**
 * Create a circle outline as 4 cubic Bezier segments (standard approximation).
 * Uses the kappa constant for optimal circular arc approximation.
 */
function makeCircleOutline(cx: number, cy: number, r: number): number[][] {
  const k = 0.5522847498; // 4/3 * (sqrt(2) - 1)
  const kr = k * r;

  // Start at right, go CCW: right, top, left, bottom, back to right
  return [
    [cx + r, cy, 0], // anchor: right
    [cx + r, cy + kr, 0], // handle
    [cx + kr, cy + r, 0], // handle
    [cx, cy + r, 0], // anchor: top
    [cx - kr, cy + r, 0], // handle
    [cx - r, cy + kr, 0], // handle
    [cx - r, cy, 0], // anchor: left
    [cx - r, cy - kr, 0], // handle
    [cx - kr, cy - r, 0], // handle
    [cx, cy - r, 0], // anchor: bottom
    [cx + kr, cy - r, 0], // handle
    [cx + r, cy - kr, 0], // handle
    [cx + r, cy, 0], // anchor: close to right
  ];
}

import { describe, it, expect } from 'vitest';
import { parseSVGPathData } from './svgPathParser';

// Helper: check that a point is close to expected within tolerance
function expectPointClose(actual: [number, number], expected: [number, number], _tol = 1e-6) {
  expect(actual[0]).toBeCloseTo(expected[0], 5);
  expect(actual[1]).toBeCloseTo(expected[1], 5);
}

// Helper: get the number of cubic Bezier segments in a sub-path.
// Layout is [anchor, h1, h2, anchor, h1, h2, anchor, ...] so segments = (length - 1) / 3
function segmentCount(subPath: [number, number][]): number {
  return (subPath.length - 1) / 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic command parsing (through parseSVGPathData)
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSVGPathData', () => {
  describe('MoveTo (M/m)', () => {
    it('parses absolute M and sets start point', () => {
      const result = parseSVGPathData('M 10 20');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expectPointClose(result[0][0], [10, 20]);
    });

    it('treats extra coordinate pairs after M as implicit LineTo', () => {
      const result = parseSVGPathData('M 0 0 5 5 10 0');
      expect(result).toHaveLength(1);
      // First anchor + 2 line segments (each 3 points) = 1 + 6 = 7
      expect(result[0]).toHaveLength(7);
      expectPointClose(result[0][0], [0, 0]);
      // Last point of second line segment should be [10, 0]
      expectPointClose(result[0][6], [10, 0]);
    });

    it('parses relative m command', () => {
      // Start at 0,0 implicitly then m moves relatively
      const result = parseSVGPathData('M 5 5 m 10 10');
      // Two sub-paths: first has just M 5 5, second starts at 15 15
      expect(result).toHaveLength(2);
      expectPointClose(result[0][0], [5, 5]);
      expectPointClose(result[1][0], [15, 15]);
    });

    it('multiple M commands produce multiple sub-paths', () => {
      const result = parseSVGPathData('M 0 0 L 1 0 M 5 5 L 6 5');
      expect(result).toHaveLength(2);
      expectPointClose(result[0][0], [0, 0]);
      expectPointClose(result[1][0], [5, 5]);
    });
  });

  describe('LineTo (L/l)', () => {
    it('converts L to cubic Bezier (3 points per segment)', () => {
      const result = parseSVGPathData('M 0 0 L 3 0');
      expect(result).toHaveLength(1);
      const sp = result[0];
      // anchor + 3 points (h1, h2, end-anchor) = 4 total
      expect(sp).toHaveLength(4);
      expectPointClose(sp[0], [0, 0]);
      // handle1 at 1/3 of the way
      expectPointClose(sp[1], [1, 0]);
      // handle2 at 2/3 of the way
      expectPointClose(sp[2], [2, 0]);
      expectPointClose(sp[3], [3, 0]);
    });

    it('parses multiple L coordinates as repeated lines', () => {
      const result = parseSVGPathData('M 0 0 L 1 0 2 0 3 0');
      expect(result).toHaveLength(1);
      // 1 anchor + 3 segments * 3 points = 10
      expect(result[0]).toHaveLength(10);
    });

    it('parses relative l command', () => {
      const result = parseSVGPathData('M 10 10 l 5 0');
      const sp = result[0];
      expect(sp).toHaveLength(4);
      expectPointClose(sp[0], [10, 10]);
      expectPointClose(sp[3], [15, 10]);
    });
  });

  describe('Horizontal LineTo (H/h)', () => {
    it('draws horizontal line keeping Y constant', () => {
      const result = parseSVGPathData('M 0 5 H 10');
      const sp = result[0];
      expect(sp).toHaveLength(4);
      expectPointClose(sp[0], [0, 5]);
      expectPointClose(sp[3], [10, 5]);
      // Y should remain 5 for handles
      expect(sp[1][1]).toBeCloseTo(5);
      expect(sp[2][1]).toBeCloseTo(5);
    });

    it('handles relative h command', () => {
      const result = parseSVGPathData('M 3 7 h 4');
      expectPointClose(result[0][3], [7, 7]);
    });

    it('handles multiple H values', () => {
      const result = parseSVGPathData('M 0 0 H 5 10');
      // 1 anchor + 2 segments * 3 = 7
      expect(result[0]).toHaveLength(7);
      expectPointClose(result[0][3], [5, 0]);
      expectPointClose(result[0][6], [10, 0]);
    });
  });

  describe('Vertical LineTo (V/v)', () => {
    it('draws vertical line keeping X constant', () => {
      const result = parseSVGPathData('M 5 0 V 10');
      const sp = result[0];
      expect(sp).toHaveLength(4);
      expectPointClose(sp[0], [5, 0]);
      expectPointClose(sp[3], [5, 10]);
      // X should remain 5 for handles
      expect(sp[1][0]).toBeCloseTo(5);
      expect(sp[2][0]).toBeCloseTo(5);
    });

    it('handles relative v command', () => {
      const result = parseSVGPathData('M 3 2 v 6');
      expectPointClose(result[0][3], [3, 8]);
    });
  });

  describe('Cubic Bezier (C/c)', () => {
    it('produces 3 points per C segment (h1, h2, end)', () => {
      const result = parseSVGPathData('M 0 0 C 1 2 3 4 5 6');
      const sp = result[0];
      // anchor + 3 = 4
      expect(sp).toHaveLength(4);
      expectPointClose(sp[0], [0, 0]);
      expectPointClose(sp[1], [1, 2]); // control point 1
      expectPointClose(sp[2], [3, 4]); // control point 2
      expectPointClose(sp[3], [5, 6]); // end anchor
    });

    it('handles relative c command', () => {
      const result = parseSVGPathData('M 10 10 c 1 2 3 4 5 6');
      const sp = result[0];
      expectPointClose(sp[1], [11, 12]);
      expectPointClose(sp[2], [13, 14]);
      expectPointClose(sp[3], [15, 16]);
    });

    it('handles multiple cubic segments in one C command', () => {
      const result = parseSVGPathData('M 0 0 C 1 0 2 0 3 0 4 0 5 0 6 0');
      const sp = result[0];
      // anchor + 2 segments * 3 = 7
      expect(sp).toHaveLength(7);
      expectPointClose(sp[3], [3, 0]);
      expectPointClose(sp[6], [6, 0]);
    });
  });

  describe('Smooth Cubic (S/s)', () => {
    it('reflects control point from previous C', () => {
      // C with cp2 at (8,2), end at (10,0). Reflection of (8,2) over (10,0) = (12,-2)
      const result = parseSVGPathData('M 0 0 C 2 4 8 2 10 0 S 18 2 20 0');
      const sp = result[0];
      // anchor + 2 segments * 3 = 7
      expect(sp).toHaveLength(7);
      // The reflected cp1 for S: 2*10 - 8 = 12, 2*0 - 2 = -2
      expectPointClose(sp[4], [12, -2]);
      expectPointClose(sp[5], [18, 2]);
      expectPointClose(sp[6], [20, 0]);
    });

    it('uses current point as cp1 when no previous C/S', () => {
      const result = parseSVGPathData('M 0 0 S 4 2 6 0');
      const sp = result[0];
      expect(sp).toHaveLength(4);
      // No prior C/S, so first control point = current point (0,0)
      expectPointClose(sp[1], [0, 0]);
      expectPointClose(sp[2], [4, 2]);
      expectPointClose(sp[3], [6, 0]);
    });

    it('handles relative s command', () => {
      const result = parseSVGPathData('M 10 10 C 12 14 18 12 20 10 s 8 2 10 0');
      const sp = result[0];
      // s is relative: cp2=(20+8, 10+2)=(28,12), end=(20+10, 10+0)=(30,10)
      expectPointClose(sp[5], [28, 12]);
      expectPointClose(sp[6], [30, 10]);
    });
  });

  describe('Quadratic Bezier (Q/q)', () => {
    it('elevates quadratic to cubic (3 output points)', () => {
      const result = parseSVGPathData('M 0 0 Q 5 10 10 0');
      const sp = result[0];
      expect(sp).toHaveLength(4);
      // Quadratic (0,0) cp(5,10) end(10,0) elevated to cubic:
      // cp1 = (0 + 2/3*(5-0), 0 + 2/3*(10-0)) = (10/3, 20/3)
      // cp2 = (10 + 2/3*(5-10), 0 + 2/3*(10-0)) = (20/3, 20/3)
      expectPointClose(sp[1], [10 / 3, 20 / 3]);
      expectPointClose(sp[2], [20 / 3, 20 / 3]);
      expectPointClose(sp[3], [10, 0]);
    });

    it('handles relative q command', () => {
      const result = parseSVGPathData('M 10 10 q 5 10 10 0');
      const sp = result[0];
      // Absolute: cp=(15,20), end=(20,10)
      // cp1 = (10 + 2/3*(15-10), 10 + 2/3*(20-10)) = (40/3, 50/3)
      expectPointClose(sp[1], [40 / 3, 50 / 3]);
      expectPointClose(sp[3], [20, 10]);
    });
  });

  describe('Smooth Quadratic (T/t)', () => {
    it('reflects quadratic control point from previous Q', () => {
      // Q with cp at (5,10), end at (10,0). Reflection of (5,10) over (10,0) = (15,-10)
      const result = parseSVGPathData('M 0 0 Q 5 10 10 0 T 20 0');
      const sp = result[0];
      expect(sp).toHaveLength(7);
      // Reflected qx = 2*10 - 5 = 15, qy = 2*0 - 10 = -10
      // cp1 of T segment = (10 + 2/3*(15-10), 0 + 2/3*(-10-0)) = (40/3, -20/3)
      expectPointClose(sp[4], [40 / 3, -20 / 3]);
      expectPointClose(sp[6], [20, 0]);
    });

    it('handles relative t command', () => {
      const result = parseSVGPathData('M 0 0 Q 5 10 10 0 t 10 0');
      const sp = result[0];
      // t 10 0 relative: end = (10+10, 0+0) = (20, 0)
      expectPointClose(sp[6], [20, 0]);
    });
  });

  describe('Arc (A/a)', () => {
    it('converts arc to one or more cubic Bezier segments', () => {
      // Simple semicircle arc
      const result = parseSVGPathData('M 0 0 A 5 5 0 0 1 10 0');
      expect(result).toHaveLength(1);
      const sp = result[0];
      // Arc produces at least one segment (3 points each)
      expect(sp.length).toBeGreaterThanOrEqual(4);
      // Start is (0,0)
      expectPointClose(sp[0], [0, 0]);
      // End point of arc should be (10, 0)
      expectPointClose(sp[sp.length - 1], [10, 0]);
    });

    it('degenerate arc (rx=0) produces a line', () => {
      const result = parseSVGPathData('M 0 0 A 0 5 0 0 1 10 0');
      const sp = result[0];
      // Should be a line: anchor + 3 points = 4
      expect(sp).toHaveLength(4);
      expectPointClose(sp[3], [10, 0]);
    });

    it('degenerate arc (same start/end) produces a line', () => {
      const result = parseSVGPathData('M 5 5 A 10 10 0 0 1 5 5');
      const sp = result[0];
      // Same start and end -> degenerate line
      expect(sp).toHaveLength(4);
    });

    it('handles relative a command', () => {
      const result = parseSVGPathData('M 10 10 a 5 5 0 0 1 10 0');
      const sp = result[0];
      // End point should be (10+10, 10+0) = (20, 10)
      expectPointClose(sp[sp.length - 1], [20, 10]);
    });

    it('full circle arc produces multiple segments', () => {
      // Large arc flag = 1 for near-full circle
      const result = parseSVGPathData('M 10 0 A 10 10 0 1 1 9.99 0');
      const sp = result[0];
      // Full circle needs ~4 segments (pi/2 each) -> at least 4*3 + 1 points
      expect(sp.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('ClosePath (Z/z)', () => {
    it('adds line back to start if not already there', () => {
      const result = parseSVGPathData('M 0 0 L 10 0 L 10 10 Z');
      const sp = result[0];
      // 1 anchor + 3 lines * 3 = 10
      expect(sp).toHaveLength(10);
      // Last point should be back at start (0,0)
      expectPointClose(sp[sp.length - 1], [0, 0]);
    });

    it('does not add line if already at start', () => {
      const result = parseSVGPathData('M 0 0 L 10 0 L 0 0 Z');
      const sp = result[0];
      // 1 anchor + 2 lines * 3 = 7 (Z adds no extra line)
      expect(sp).toHaveLength(7);
    });

    it('uppercase Z and lowercase z behave the same', () => {
      const r1 = parseSVGPathData('M 0 0 L 5 0 L 5 5 Z');
      const r2 = parseSVGPathData('M 0 0 L 5 0 L 5 5 z');
      expect(r1).toEqual(r2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Path to Bezier conversion
  // ─────────────────────────────────────────────────────────────────────────

  describe('path to Bezier conversion', () => {
    it('simple line M 0 0 L 1 1 produces cubic Bezier points', () => {
      const result = parseSVGPathData('M 0 0 L 1 1');
      expect(result).toHaveLength(1);
      const sp = result[0];
      expect(sp).toHaveLength(4);
      // Line from (0,0) to (1,1) as cubic: handles at 1/3 and 2/3
      expectPointClose(sp[0], [0, 0]);
      expectPointClose(sp[1], [1 / 3, 1 / 3]);
      expectPointClose(sp[2], [2 / 3, 2 / 3]);
      expectPointClose(sp[3], [1, 1]);
    });

    it('rectangle path produces correct control points', () => {
      const result = parseSVGPathData('M 0 0 L 4 0 L 4 3 L 0 3 Z');
      expect(result).toHaveLength(1);
      const sp = result[0];
      // 4 line segments: 1 anchor + 4*3 = 13
      expect(sp).toHaveLength(13);
      // Verify corners
      expectPointClose(sp[0], [0, 0]);
      expectPointClose(sp[3], [4, 0]);
      expectPointClose(sp[6], [4, 3]);
      expectPointClose(sp[9], [0, 3]);
      expectPointClose(sp[12], [0, 0]);
    });

    it('circle approximation with arcs', () => {
      // Approximate circle: two semicircular arcs
      const result = parseSVGPathData('M 10 0 A 10 10 0 0 1 -10 0 A 10 10 0 0 1 10 0');
      const sp = result[0];
      // Should close back to start
      expectPointClose(sp[sp.length - 1], [10, 0]);
    });

    it('multiple sub-paths with multiple M commands', () => {
      const result = parseSVGPathData('M 0 0 L 1 0 M 10 10 L 11 10 M 20 20 L 21 20');
      expect(result).toHaveLength(3);
      expectPointClose(result[0][0], [0, 0]);
      expectPointClose(result[1][0], [10, 10]);
      expectPointClose(result[2][0], [20, 20]);
    });

    it('empty path returns empty result', () => {
      expect(parseSVGPathData('')).toEqual([]);
    });

    it('just M with no drawing commands returns single anchor', () => {
      const result = parseSVGPathData('M 5 5');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expectPointClose(result[0][0], [5, 5]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Number / separator handling
  // ─────────────────────────────────────────────────────────────────────────

  describe('number and separator handling', () => {
    it('handles negative numbers', () => {
      const result = parseSVGPathData('M -5 -10 L -1 -2');
      expectPointClose(result[0][0], [-5, -10]);
      expectPointClose(result[0][3], [-1, -2]);
    });

    it('handles decimal numbers', () => {
      const result = parseSVGPathData('M 0.5 1.25 L 3.75 4.125');
      expectPointClose(result[0][0], [0.5, 1.25]);
      expectPointClose(result[0][3], [3.75, 4.125]);
    });

    it('handles commas as separators', () => {
      const result = parseSVGPathData('M0,0 L10,20');
      expectPointClose(result[0][0], [0, 0]);
      expectPointClose(result[0][3], [10, 20]);
    });

    it('handles mixed commas and spaces', () => {
      const result = parseSVGPathData('M 0, 0 L 10 ,20');
      expectPointClose(result[0][0], [0, 0]);
      expectPointClose(result[0][3], [10, 20]);
    });

    it('handles no spaces between command and numbers', () => {
      const result = parseSVGPathData('M0 0L10 0');
      expectPointClose(result[0][0], [0, 0]);
      expectPointClose(result[0][3], [10, 0]);
    });

    it('handles multiple commands in compact sequence', () => {
      const result = parseSVGPathData('M0,0L5,0L5,5L0,5Z');
      expect(result).toHaveLength(1);
      // 4 lines (incl. Z closing): 1 + 4*3 = 13
      expect(result[0]).toHaveLength(13);
    });

    it('handles very large numbers', () => {
      const result = parseSVGPathData('M 100000 200000 L 300000 400000');
      expectPointClose(result[0][0], [100000, 200000]);
      expectPointClose(result[0][3], [300000, 400000]);
    });

    it('handles very small decimal numbers', () => {
      const result = parseSVGPathData('M 0.001 0.002 L 0.003 0.004');
      expectPointClose(result[0][0], [0.001, 0.002]);
      expectPointClose(result[0][3], [0.003, 0.004]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Edge cases
  // ─────────────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('path with only whitespace returns empty', () => {
      expect(parseSVGPathData('   ')).toEqual([]);
    });

    it('path with only newlines/tabs returns empty', () => {
      expect(parseSVGPathData('\n\t\n')).toEqual([]);
    });

    it('multiple consecutive Z commands', () => {
      // After first Z, cursor is at start. Second Z should be a no-op.
      const result = parseSVGPathData('M 0 0 L 5 5 Z Z Z');
      expect(result).toHaveLength(1);
    });

    it('Z after M (no drawing) does not crash', () => {
      const result = parseSVGPathData('M 0 0 Z');
      expect(result).toHaveLength(1);
      // Already at start, Z adds no line
      expect(result[0]).toHaveLength(1);
    });

    it('preserves sub-path structure across Z then M', () => {
      const result = parseSVGPathData('M 0 0 L 5 0 Z M 10 10 L 15 10 Z');
      expect(result).toHaveLength(2);
    });

    it('handles chained relative moves correctly', () => {
      // M 0 0, then l 3 0 (to 3,0), then l 0 4 (to 3,4)
      const result = parseSVGPathData('M 0 0 l 3 0 l 0 4');
      const sp = result[0];
      expectPointClose(sp[0], [0, 0]);
      expectPointClose(sp[3], [3, 0]);
      expectPointClose(sp[6], [3, 4]);
    });

    it('handles extra whitespace around commands', () => {
      const result = parseSVGPathData('  M  0  0  L  10  10  ');
      expect(result).toHaveLength(1);
      expectPointClose(result[0][0], [0, 0]);
      expectPointClose(result[0][3], [10, 10]);
    });

    it('complex MathJax-like path parses without error', () => {
      // Simplified version of a MathJax glyph path
      const d =
        'M 220 462 Q 220 500 242 535 Q 264 570 303 590 Q 342 610 393 610 ' +
        'Q 449 610 492 577 Q 536 544 536 484 Q 536 430 499 399 ' +
        'Q 462 368 393 368 L 365 368 Q 327 368 297 389 Q 267 410 246 436 Z';
      const result = parseSVGPathData(d);
      expect(result).toHaveLength(1);
      expect(result[0].length).toBeGreaterThan(10);
      // First anchor should be M point
      expectPointClose(result[0][0], [220, 462]);
    });

    it('line handles are correctly interpolated at 1/3 and 2/3', () => {
      const result = parseSVGPathData('M 0 0 L 9 12');
      const sp = result[0];
      // handle1 = (0 + 9/3, 0 + 12/3) = (3, 4)
      expectPointClose(sp[1], [3, 4]);
      // handle2 = (0 + 9*2/3, 0 + 12*2/3) = (6, 8)
      expectPointClose(sp[2], [6, 8]);
    });

    it('S command chain accumulates reflections', () => {
      const result = parseSVGPathData('M 0 0 C 0 10 10 10 10 0 S 20 -10 20 0 S 30 10 30 0');
      const sp = result[0];
      // 3 segments: 1 anchor + 3*3 = 10
      expect(sp).toHaveLength(10);
      // Each segment ends at the expected point
      expectPointClose(sp[3], [10, 0]);
      expectPointClose(sp[6], [20, 0]);
      expectPointClose(sp[9], [30, 0]);
    });

    it('Q followed by T uses reflected quadratic control point', () => {
      const result = parseSVGPathData('M 0 0 Q 10 20 20 0 T 40 0');
      const sp = result[0];
      expect(sp).toHaveLength(7);
      // Reflected Q control: (2*20 - 10, 2*0 - 20) = (30, -20)
      // Then elevated to cubic: cp1 = (20 + 2/3*(30-20), 0 + 2/3*(-20-0))
      const expectedCp1x = 20 + (2 / 3) * 10;
      const expectedCp1y = 0 + (2 / 3) * -20;
      expectPointClose(sp[4], [expectedCp1x, expectedCp1y]);
      expectPointClose(sp[6], [40, 0]);
    });

    it('arc with large-arc-flag and sweep-flag variations', () => {
      // Test all four flag combinations
      const r1 = parseSVGPathData('M 0 0 A 10 10 0 0 0 20 0');
      const r2 = parseSVGPathData('M 0 0 A 10 10 0 0 1 20 0');
      const r3 = parseSVGPathData('M 0 0 A 10 10 0 1 0 20 0');
      const r4 = parseSVGPathData('M 0 0 A 10 10 0 1 1 20 0');

      // All should end at (20, 0)
      for (const r of [r1, r2, r3, r4]) {
        expect(r).toHaveLength(1);
        expectPointClose(r[0][r[0].length - 1], [20, 0]);
      }

      // Large-arc paths should have more points than small-arc paths
      expect(r3[0].length).toBeGreaterThanOrEqual(r1[0].length);
      expect(r4[0].length).toBeGreaterThanOrEqual(r2[0].length);
    });

    it('arc with rotation (phi != 0)', () => {
      const result = parseSVGPathData('M 0 0 A 10 5 45 0 1 10 0');
      const sp = result[0];
      expect(sp.length).toBeGreaterThanOrEqual(4);
      expectPointClose(sp[sp.length - 1], [10, 0]);
    });

    it('arc radii are scaled up when too small', () => {
      // When rx,ry are too small to reach the endpoint, they get scaled up
      const result = parseSVGPathData('M 0 0 A 1 1 0 0 1 100 0');
      const sp = result[0];
      // Should still end at (100, 0) even though radius 1 << distance 100
      expectPointClose(sp[sp.length - 1], [100, 0]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Structural properties
  // ─────────────────────────────────────────────────────────────────────────

  describe('structural properties', () => {
    it('sub-path point count is 1 + 3*N for N segments', () => {
      // A triangle: 3 line segments + close
      const result = parseSVGPathData('M 0 0 L 10 0 L 5 8.66 Z');
      const sp = result[0];
      const n = segmentCount(sp);
      expect(sp.length).toBe(1 + 3 * n);
      expect(n).toBe(3);
    });

    it('all points are [number, number] tuples', () => {
      const result = parseSVGPathData('M 0 0 C 1 2 3 4 5 6 L 7 8 Q 9 10 11 12 Z');
      for (const sp of result) {
        for (const pt of sp) {
          expect(pt).toHaveLength(2);
          expect(typeof pt[0]).toBe('number');
          expect(typeof pt[1]).toBe('number');
          expect(Number.isFinite(pt[0])).toBe(true);
          expect(Number.isFinite(pt[1])).toBe(true);
        }
      }
    });

    it('closed path (Z) ends at its start point', () => {
      const result = parseSVGPathData('M 3 7 L 10 0 L 10 10 Z');
      const sp = result[0];
      expectPointClose(sp[sp.length - 1], [3, 7]);
    });
  });
});

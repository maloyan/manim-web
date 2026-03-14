import { describe, it, expect } from 'vitest';
import { polylabel } from './polylabel';

describe('polylabel', () => {
  describe('simple square', () => {
    it('finds center of a unit square', () => {
      const square = [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ];
      const result = polylabel(square, 0.01);
      expect(result.point[0]).toBeCloseTo(0.5, 1);
      expect(result.point[1]).toBeCloseTo(0.5, 1);
      expect(result.distance).toBeCloseTo(0.5, 1);
    });

    it('finds center of a larger square', () => {
      const square = [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
      ];
      const result = polylabel(square, 0.01);
      expect(result.point[0]).toBeCloseTo(2, 1);
      expect(result.point[1]).toBeCloseTo(2, 1);
      expect(result.distance).toBeCloseTo(2, 1);
    });
  });

  describe('triangle', () => {
    it('finds pole of equilateral triangle', () => {
      const triangle = [
        [
          [0, 0],
          [4, 0],
          [2, 3.464],
          [0, 0],
        ],
      ];
      const result = polylabel(triangle, 0.01);
      // Incircle center of equilateral triangle is at centroid
      expect(result.point[0]).toBeCloseTo(2, 0);
      expect(result.point[1]).toBeCloseTo(1.155, 0);
      expect(result.distance).toBeGreaterThan(0);
    });

    it('finds pole of right triangle', () => {
      const triangle = [
        [
          [0, 0],
          [3, 0],
          [0, 4],
          [0, 0],
        ],
      ];
      const result = polylabel(triangle, 0.01);
      // The pole should be inside the triangle
      expect(result.distance).toBeGreaterThan(0);
      // Check it's within bounds
      expect(result.point[0]).toBeGreaterThanOrEqual(0);
      expect(result.point[1]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('polygon with hole', () => {
    it('finds pole away from hole', () => {
      // Outer ring: large square
      // Inner ring (hole): small square in the center
      const rings = [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
        // Hole in center
        [
          [4, 4],
          [6, 4],
          [6, 6],
          [4, 6],
          [4, 4],
        ],
      ];
      const result = polylabel(rings, 0.1);
      // The pole should be away from the hole
      expect(result.distance).toBeGreaterThan(0);
      // Should not be inside the hole
      const px = result.point[0];
      const py = result.point[1];
      const insideHole = px > 4 && px < 6 && py > 4 && py < 6;
      expect(insideHole).toBe(false);
    });
  });

  describe('precision parameter', () => {
    it('returns result with lower precision', () => {
      const square = [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ];
      const lowPrec = polylabel(square, 1.0);
      const highPrec = polylabel(square, 0.001);
      // Both should find roughly the center
      expect(lowPrec.point[0]).toBeCloseTo(1, 0);
      expect(lowPrec.point[1]).toBeCloseTo(1, 0);
      expect(highPrec.point[0]).toBeCloseTo(1, 2);
      expect(highPrec.point[1]).toBeCloseTo(1, 2);
    });
  });

  describe('degenerate cases', () => {
    it('handles zero-area polygon', () => {
      const line = [
        [
          [0, 0],
          [1, 0],
          [0, 0],
        ],
      ];
      const result = polylabel(line);
      // Should return something without crashing
      expect(result.point).toBeDefined();
    });
  });
});

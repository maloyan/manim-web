import { describe, it, expect } from 'vitest';
import { ArcPolygonFromArcs } from './ArcPolygon';
import { Arc } from './Arc';

/**
 * Tests for ArcPolygonFromArcs: three connecting arcs must stitch into one
 * closed continuous path whose sampled points lie on the component arcs.
 * Geometry invariants are asserted, not pixels.
 *
 * The three arcs are 120-degree thirds of the unit circle, so each arc's last
 * point is exactly the next arc's first point: they connect, and the stitched
 * path is the full circle.
 */
const RADIUS = 1.5;
const THIRD = (2 * Math.PI) / 3;

function triangleArcs(): [Arc, Arc, Arc] {
  return [
    new Arc({ radius: RADIUS, startAngle: 0, angle: THIRD }),
    new Arc({ radius: RADIUS, startAngle: THIRD, angle: THIRD }),
    new Arc({ radius: RADIUS, startAngle: 2 * THIRD, angle: THIRD }),
  ];
}

function dist(p: number[], q: number[]): number {
  const dx = p[0] - q[0];
  const dy = p[1] - q[1];
  const dz = (p[2] ?? 0) - (q[2] ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Dense sampling of an arc's own curve. */
function arcSamples(arc: Arc, steps = 240): number[][] {
  const pts: number[][] = [];
  for (let i = 0; i <= steps; i++) pts.push(arc.getPointFromProportion(i / steps));
  return pts;
}

describe('ArcPolygonFromArcs', () => {
  it('throws with no arcs', () => {
    expect(() => new ArcPolygonFromArcs()).toThrow();
  });

  it('exposes its component arcs', () => {
    const arcs = triangleArcs();
    const poly = new ArcPolygonFromArcs(...arcs);
    expect(poly.arcs).toHaveLength(3);
  });

  it('builds a single closed path', () => {
    const poly = new ArcPolygonFromArcs(...triangleArcs());
    const pts = poly.getLocalPoints();
    expect(pts.length).toBeGreaterThan(0);
    // 3k+1 shared-anchor invariant.
    expect((pts.length - 1) % 3).toBe(0);
    // First point equals last point: the path is closed.
    const first = pts[0];
    const last = pts[pts.length - 1];
    expect(dist(first, last)).toBeLessThan(1e-6);
  });

  it('every sampled point lies on one of the component arcs', () => {
    const arcs = triangleArcs();
    const poly = new ArcPolygonFromArcs(...arcs);
    const arcPointSets = arcs.map((arc) => arcSamples(arc));

    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const p = poly.getPointFromProportion(i / steps);
      let best = Infinity;
      for (const set of arcPointSets) {
        for (const q of set) {
          const d = dist(p, q);
          if (d < best) best = d;
        }
      }
      expect(best).toBeLessThan(0.05);
    }
  });

  it('copy() preserves the stitched geometry', () => {
    const poly = new ArcPolygonFromArcs(...triangleArcs());
    const clone = poly.copy();
    expect(clone.getLocalPoints()).toEqual(poly.getLocalPoints());
  });
});

import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
import { getNumCurvesFromPoints } from './VMobjectCurves';
import { appendPointsToPointList, insertNCurvesToPointList } from './VMobjectCurveMath';
import { evalCubicBezier } from '../utils/math';

/**
 * Tests for the VMobject point-builder primitives: appendPoints,
 * insertNCurves and the pure insertNCurvesToPointList. Geometry invariants
 * are asserted (curve count, preserved points, sampled shape), not pixels.
 */

/** One straight cubic (shared-anchor, four points) from start to end. */
function straightCubic(start: number[], end: number[]): number[][] {
  const d = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  return [
    [start[0], start[1], start[2]],
    [start[0] + d[0] / 3, start[1] + d[1] / 3, start[2] + d[2] / 3],
    [start[0] + (2 * d[0]) / 3, start[1] + (2 * d[1]) / 3, start[2] + (2 * d[2]) / 3],
    [end[0], end[1], end[2]],
  ];
}

/** A curved chain of `n` cubics (a smoothed zig-zag through n+1 anchors). */
function makeCurvedChain(): VMobject {
  const vm = new VMobject();
  vm.setPointsAsCorners([
    [-2, 0, 0],
    [-1, 1, 0],
    [0, -1, 0],
    [1, 1, 0],
    [2, 0, 0],
  ]);
  vm.makeSmooth();
  return vm;
}

/** Dense polyline of the chain, sampling each cubic at uniform parameter. */
function denseCurveSamples(points: number[][], perCurve = 40): number[][] {
  const numCurves = getNumCurvesFromPoints(points);
  const out: number[][] = [];
  for (let c = 0; c < numCurves; c++) {
    const i = c * 3;
    for (let s = 0; s <= perCurve; s++) {
      out.push(
        evalCubicBezier(points[i], points[i + 1], points[i + 2], points[i + 3], s / perCurve),
      );
    }
  }
  return out;
}

function dist(p: number[], q: number[]): number {
  const dx = p[0] - q[0];
  const dy = p[1] - q[1];
  const dz = (p[2] ?? 0) - (q[2] ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Max nearest-neighbour distance from each point of `a` to the set `b`. */
function directedHausdorff(a: number[][], b: number[][]): number {
  let worst = 0;
  for (const p of a) {
    let best = Infinity;
    for (const q of b) best = Math.min(best, dist(p, q));
    worst = Math.max(worst, best);
  }
  return worst;
}

describe('VMobject.appendPoints', () => {
  it('appends to an empty VMobject verbatim', () => {
    const vm = new VMobject();
    const chunk = straightCubic([0, 0, 0], [1, 0, 0]);
    vm.appendPoints(chunk);
    expect(vm.numPoints).toBe(4);
    expect(vm.getLocalPoints()).toEqual(chunk);
  });

  it('drops the shared join anchor and preserves existing points', () => {
    const vm = new VMobject();
    const first = straightCubic([0, 0, 0], [1, 0, 0]);
    vm.appendPoints(first);
    const second = straightCubic([1, 0, 0], [2, 0, 0]);
    vm.appendPoints(second);

    // 4 + 4 - 1 = 7 points, i.e. two shared-anchor cubics.
    expect(vm.numPoints).toBe(7);
    expect(getNumCurvesFromPoints(vm.getLocalPoints())).toBe(2);
    // The first chunk is preserved exactly as the head of the chain.
    expect(vm.getLocalPoints().slice(0, 4)).toEqual(first);
    // The second chunk continues from its second point onward.
    expect(vm.getLocalPoints().slice(4)).toEqual(second.slice(1));
  });

  it('pure appendPointsToPointList matches the method and mutates nothing', () => {
    const existing = straightCubic([0, 0, 0], [1, 0, 0]);
    const addition = straightCubic([1, 0, 0], [2, 0, 0]);
    const existingCopy = existing.map((p) => [...p]);
    const joined = appendPointsToPointList(existing, addition);
    expect(joined).toHaveLength(7);
    expect(existing).toEqual(existingCopy); // not mutated
  });
});

describe('VMobject.insertNCurves', () => {
  it('increases the curve count by exactly n', () => {
    const vm = makeCurvedChain();
    const before = getNumCurvesFromPoints(vm.getLocalPoints());
    vm.insertNCurves(3);
    const after = getNumCurvesFromPoints(vm.getLocalPoints());
    expect(after).toBe(before + 3);
    expect(vm.numPoints).toBe(3 * after + 1);
  });

  it('preserves every original anchor exactly', () => {
    const originalPts = makeCurvedChain().getLocalPoints();
    const inserted = makeCurvedChain();
    inserted.insertNCurves(5);
    const newPts = inserted.getLocalPoints();

    const originalCurves = getNumCurvesFromPoints(originalPts);
    for (let c = 0; c <= originalCurves; c++) {
      const anchor = originalPts[c * 3];
      const nearest = Math.min(...newPts.map((p) => dist(anchor, p)));
      expect(nearest).toBeLessThan(1e-9);
    }
  });

  it('does not change the traced curve shape', () => {
    // Dense sampling in both directions: the subdivided chain and the original
    // trace the same curve, so the two point clouds coincide to the sample
    // spacing (both sampled densely at uniform curve parameter).
    const before = denseCurveSamples(makeCurvedChain().getLocalPoints(), 200);

    const inserted = makeCurvedChain();
    inserted.insertNCurves(5);
    const after = denseCurveSamples(inserted.getLocalPoints(), 200);

    expect(directedHausdorff(after, before)).toBeLessThan(0.02);
    expect(directedHausdorff(before, after)).toBeLessThan(0.02);
  });

  it('pure insertNCurvesToPointList adds n curves without mutating input', () => {
    const pts = makeCurvedChain().getLocalPoints();
    const ptsCopy = pts.map((p) => [...p]);
    const base = getNumCurvesFromPoints(pts);
    const out = insertNCurvesToPointList(4, pts);
    expect(getNumCurvesFromPoints(out)).toBe(base + 4);
    expect(pts).toEqual(ptsCopy); // not mutated
  });

  it('is a no-op for n <= 0', () => {
    const pts = makeCurvedChain().getLocalPoints();
    expect(insertNCurvesToPointList(0, pts)).toEqual(pts);
  });
});

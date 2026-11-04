/**
 * alignPoints must keep the point order of open curves (#904). Reversal by
 * winding and cyclic rotation only make sense for closed paths; on an open
 * graph they move the endpoints into the middle of the curve.
 */
import { describe, it, expect } from 'vitest';
import { Axes } from '../mobjects/graphing/Axes';
import { Transform } from '../animation/transform/Transform';
import { VMobject } from './VMobject';

describe('alignPoints on open curves (#904)', () => {
  // MIGRATION: example for the property
  //   ∀ open curves a, b: after Transform(a, b) runs to alpha = 1,
  //   a's first and last points equal b's first and last points.
  // Replace with a property test once the suite lands.
  it('Transform between two graphs keeps the endpoints in place', () => {
    const axes = new Axes({
      xRange: [-7.2, 7.2, 1],
      yRange: [-4, 4, 1],
      xLength: 14.2222222,
      yLength: 8,
    });
    const plot = (f: (x: number) => number) =>
      axes.plot(f, { xRange: [-7.2, 7.2], numSamples: 400 });
    const g = plot(() => 1);
    const target = plot((x) => 1 + x);
    const want = target.getPoints();

    const tr = new Transform(g, target);
    tr.begin();
    tr.interpolate(1);
    const got = g.getPoints();

    for (let k = 0; k < 3; k++) {
      expect(got[0][k]).toBeCloseTo(want[0][k], 4);
      expect(got[got.length - 1][k]).toBeCloseTo(want[want.length - 1][k], 4);
    }
  });

  // MIGRATION: example for the property
  //   ∀ open paths a, b of different lengths: a.alignPoints(b) leaves
  //   b's first point first and its last point last.
  it('alignPoints does not reverse or rotate an open target', () => {
    // An arch and a dip: open paths with opposite signed areas and different lengths.
    const a = new VMobject();
    a.setPoints([
      [0, 0, 0],
      [1, 1, 0],
      [2, 1, 0],
      [3, 0, 0],
    ]);
    const b = new VMobject();
    b.setPoints([
      [0, 0, 0],
      [1, -1, 0],
      [2, -1, 0],
      [3, -1.5, 0],
      [4, -1, 0],
      [5, -1, 0],
      [6, 0, 0],
    ]);
    a.alignPoints(b);
    const pts = b.getPoints();
    expect(pts[0]).toEqual([0, 0, 0]);
    expect(pts[pts.length - 1]).toEqual([6, 0, 0]);
  });
});

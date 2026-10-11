import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { anchorsFromPoints } from './VMobjectCurveMath';

function corners(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPointsAsCorners(pts);
  return v;
}

describe('VMobject.makeJagged', () => {
  it('replaces handles with the 1/3 and 2/3 anchor lerps', () => {
    // Start from a curvy path, then flatten its handles.
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [0, 2, 0], // curvy handle
      [2, 2, 0], // curvy handle
      [2, 0, 0],
    ]);
    v.makeJagged();
    const pts = v.getLocalPoints();
    const a0 = pts[0];
    const a1 = pts[3];
    expect(pts[1][0]).toBeCloseTo(a0[0] + (a1[0] - a0[0]) / 3, 10);
    expect(pts[1][1]).toBeCloseTo(a0[1] + (a1[1] - a0[1]) / 3, 10);
    expect(pts[2][0]).toBeCloseTo(a0[0] + (2 * (a1[0] - a0[0])) / 3, 10);
    expect(pts[2][1]).toBeCloseTo(a0[1] + (2 * (a1[1] - a0[1])) / 3, 10);
  });

  it('preserves anchors and returns this', () => {
    const v = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    const anchorsBefore = anchorsFromPoints(v.getLocalPoints());
    const result = v.makeJagged();
    expect(result).toBe(v);
    const anchorsAfter = anchorsFromPoints(v.getLocalPoints());
    expect(anchorsAfter).toEqual(anchorsBefore);
  });
});

describe('VMobject.makeSmooth', () => {
  it('keeps anchor positions fixed', () => {
    const v = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    const anchorsBefore = anchorsFromPoints(v.getLocalPoints());
    v.makeSmooth();
    const anchorsAfter = anchorsFromPoints(v.getLocalPoints());
    for (let i = 0; i < anchorsBefore.length; i++) {
      expect(anchorsAfter[i][0]).toBeCloseTo(anchorsBefore[i][0], 10);
      expect(anchorsAfter[i][1]).toBeCloseTo(anchorsBefore[i][1], 10);
    }
  });

  it('makes tangents continuous at interior anchors (reflection property)', () => {
    const v = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
      [3, 1, 0],
    ]);
    v.makeSmooth();
    const pts = v.getLocalPoints();
    // For each interior anchor at index 3k, the incoming second handle (3k-1)
    // and outgoing first handle (3k+1) reflect through the anchor.
    const numCurves = (pts.length - 1) / 3;
    for (let k = 1; k < numCurves; k++) {
      const anchor = pts[3 * k];
      const inHandle = pts[3 * k - 1];
      const outHandle = pts[3 * k + 1];
      expect(inHandle[0] + outHandle[0]).toBeCloseTo(2 * anchor[0], 8);
      expect(inHandle[1] + outHandle[1]).toBeCloseTo(2 * anchor[1], 8);
    }
  });

  it('returns this for chaining', () => {
    const v = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    expect(v.makeSmooth()).toBe(v);
  });

  it('applies to every child of a VGroup', () => {
    const child = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
      [3, 1, 0],
    ]);
    const group = new VGroup(child);
    group.makeSmooth();
    const pts = child.getLocalPoints();
    const anchor = pts[3];
    const inHandle = pts[2];
    const outHandle = pts[4];
    expect(inHandle[0] + outHandle[0]).toBeCloseTo(2 * anchor[0], 8);
    expect(inHandle[1] + outHandle[1]).toBeCloseTo(2 * anchor[1], 8);
  });
});

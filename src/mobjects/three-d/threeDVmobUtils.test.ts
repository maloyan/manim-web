/**
 * Tests for the get_3d_vmob_* helpers, ported from Manim CE
 * `manim/mobject/three_d/three_d_utils.py`.
 *
 * The reference mobject is a unit square in the XY plane, built as a
 * shared-anchor cubic Bezier chain (4 cubics, one per edge -> 13 points,
 * anchors at indices 0, 3, 6, 9, 12). Its surface normal is the plane normal
 * (+Z), and its corners are the anchors the helpers index into.
 */
import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import {
  get3dVmobGradientStartAndEndPoints,
  get3dVmobStartCornerIndex,
  get3dVmobEndCornerIndex,
  get3dVmobStartCorner,
  get3dVmobEndCorner,
  get3dVmobUnitNormal,
  get3dVmobStartCornerUnitNormal,
  get3dVmobEndCornerUnitNormal,
} from './threeDVmobUtils';

/** A unit square in the XY plane as a 13-point shared-anchor cubic chain. */
function unitSquare(): VMobject {
  const vmob = new VMobject();
  vmob.setPoints3D([
    [0, 0, 0], // 0: corner A
    [1 / 3, 0, 0],
    [2 / 3, 0, 0],
    [1, 0, 0], // 3: corner B
    [1, 1 / 3, 0],
    [1, 2 / 3, 0],
    [1, 1, 0], // 6: corner C
    [2 / 3, 1, 0],
    [1 / 3, 1, 0],
    [0, 1, 0], // 9: corner D
    [0, 2 / 3, 0],
    [0, 1 / 3, 0],
    [0, 0, 0], // 12: back to corner A
  ]);
  return vmob;
}

/** A single straight cubic (4 points, 2 anchors): a degenerate 3D path. */
function singleCubic(): VMobject {
  const vmob = new VMobject();
  vmob.setPoints3D([
    [0, 0, 0],
    [1 / 3, 0, 0],
    [2 / 3, 0, 0],
    [1, 0, 0],
  ]);
  return vmob;
}

describe('get_3d_vmob_* helpers (parity)', () => {
  it('start corner index is always 0', () => {
    expect(get3dVmobStartCornerIndex(unitSquare())).toBe(0);
  });

  it('end corner index is ((n - 1) // 6) * 3', () => {
    // 13 points -> floor(12 / 6) * 3 = 6 (the diagonally opposite corner).
    expect(get3dVmobEndCornerIndex(unitSquare())).toBe(6);
  });

  it('end corner index uses Python floor division on an empty mobject', () => {
    // floor((0 - 1) / 6) * 3 = -3, matching CE.
    expect(get3dVmobEndCornerIndex(new VMobject())).toBe(-3);
  });

  it('start corner is the first anchor', () => {
    expect(get3dVmobStartCorner(unitSquare())).toEqual([0, 0, 0]);
  });

  it('end corner is the opposite anchor', () => {
    expect(get3dVmobEndCorner(unitSquare())).toEqual([1, 1, 0]);
  });

  it('returns the origin as the corner of an empty mobject', () => {
    expect(get3dVmobStartCorner(new VMobject())).toEqual([0, 0, 0]);
    expect(get3dVmobEndCorner(new VMobject())).toEqual([0, 0, 0]);
  });

  it('gradient start and end points are the start and end corners', () => {
    expect(get3dVmobGradientStartAndEndPoints(unitSquare())).toEqual([
      [0, 0, 0],
      [1, 1, 0],
    ]);
  });

  it('unit normal of a point on the square is the plane normal (+Z)', () => {
    const n = get3dVmobUnitNormal(unitSquare(), 0);
    expect(n[0]).toBeCloseTo(0);
    expect(n[1]).toBeCloseTo(0);
    expect(n[2]).toBeCloseTo(1);
  });

  it('start corner unit normal is +Z', () => {
    const n = get3dVmobStartCornerUnitNormal(unitSquare());
    expect(n[0]).toBeCloseTo(0);
    expect(n[1]).toBeCloseTo(0);
    expect(n[2]).toBeCloseTo(1);
  });

  it('end corner unit normal is +Z', () => {
    const n = get3dVmobEndCornerUnitNormal(unitSquare());
    expect(n[0]).toBeCloseTo(0);
    expect(n[1]).toBeCloseTo(0);
    expect(n[2]).toBeCloseTo(1);
  });

  it('returns UP for a path with two or fewer anchors', () => {
    expect(get3dVmobUnitNormal(singleCubic(), 0)).toEqual([0, 1, 0]);
  });
});

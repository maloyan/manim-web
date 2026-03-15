import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import {
  ApplyPointwiseFunctionToCenter,
  applyPointwiseFunctionToCenter,
} from './ApplyPointwiseFunctionToCenter';

// Helpers
function vm(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPoints(pts);
  return v;
}

function vgroup(...children: VMobject[]): VMobject {
  const p = new VMobject();
  for (const c of children) p.add(c);
  return p;
}

describe('ApplyPointwiseFunctionToCenter', () => {
  it('stores func reference', () => {
    const fn = (p: number[]) => [p[0] * 2, p[1] * 2, p[2]];
    const v = vm([[0, 0, 0]]);
    const anim = new ApplyPointwiseFunctionToCenter(v, fn);
    expect(anim.func).toBe(fn);
  });

  it('begin() captures snapshots', () => {
    const v = vm([
      [1, 2, 0],
      [3, 4, 0],
    ]);
    const anim = new ApplyPointwiseFunctionToCenter(v, (p) => [p[0] * 2, p[1] * 2, p[2]]);
    anim.begin();
    // After begin, interpolating should work without errors
    anim.interpolate(0);
    const pts = v.getPoints();
    // At alpha=0 points should be unchanged
    expect(pts[0][0]).toBeCloseTo(1, 5);
    expect(pts[0][1]).toBeCloseTo(2, 5);
    expect(pts[1][0]).toBeCloseTo(3, 5);
    expect(pts[1][1]).toBeCloseTo(4, 5);
  });

  it('interpolate() lerps between start and target at alpha 0/0.5/1', () => {
    // A single point at [4, 0, 0] -- center is [4, 0, 0]
    // Center-relative: [0, 0, 0] -> func -> [10, 10, 0] -> shift back -> [14, 10, 0]
    const v = vm([[4, 0, 0]]);
    const anim = new ApplyPointwiseFunctionToCenter(v, (p) => [p[0] + 10, p[1] + 10, p[2]]);
    anim.begin();

    anim.interpolate(0);
    expect(v.getPoints()[0][0]).toBeCloseTo(4, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(0, 5);

    anim.interpolate(0.5);
    // Midpoint between [4,0,0] and [14,10,0]
    expect(v.getPoints()[0][0]).toBeCloseTo(9, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(5, 5);

    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(14, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(10, 5);
  });

  it('finish() sets final target points', () => {
    const v = vm([[2, 0, 0]]);
    const anim = new ApplyPointwiseFunctionToCenter(v, (p) => [-p[0], -p[1], p[2]]);
    anim.begin();
    anim.finish();
    // Center is [2,0,0]. Center-relative: [0,0,0] -> negated: [0,0,0] -> shift back: [2,0,0]
    // Identity function is applied at center, so point stays at [2,0,0]
    expect(v.getPoints()[0][0]).toBeCloseTo(2, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(0, 5);
  });

  it('applies function relative to center (key difference from ApplyPointwiseFunction)', () => {
    // Two points forming a shape centered at [3, 3, 0]:
    // Point [2, 2, 0] -> center-relative [-1, -1, 0]
    // Point [4, 4, 0] -> center-relative [1, 1, 0]
    // Scale by 2: [-2, -2, 0], [2, 2, 0]
    // Shift back: [1, 1, 0], [5, 5, 0]
    const v = vm([
      [2, 2, 0],
      [4, 4, 0],
    ]);
    const scaleFn = (p: number[]) => [p[0] * 2, p[1] * 2, p[2]];
    const anim = new ApplyPointwiseFunctionToCenter(v, scaleFn);
    anim.begin();
    anim.interpolate(1);

    const pts = v.getPoints();
    expect(pts[0][0]).toBeCloseTo(1, 5);
    expect(pts[0][1]).toBeCloseTo(1, 5);
    expect(pts[1][0]).toBeCloseTo(5, 5);
    expect(pts[1][1]).toBeCloseTo(5, 5);
  });

  it('skips VMobjects with zero points', () => {
    const v = new VMobject();
    const anim = new ApplyPointwiseFunctionToCenter(v, (p) => [p[0] + 1, p[1], p[2]]);
    anim.begin();
    anim.interpolate(0.5);
    expect(v.getPoints().length).toBe(0);
  });

  it('works with groups/families -- each child uses its own center', () => {
    // c1 centered at [0, 0, 0], c2 centered at [10, 10, 0]
    const c1 = vm([[0, 0, 0]]);
    const c2 = vm([[10, 10, 0]]);
    const group = vgroup(c1, c2);

    // Scale by 3 relative to each child's own center
    const anim = new ApplyPointwiseFunctionToCenter(group, (p) => [p[0] * 3, p[1] * 3, p[2]]);
    anim.begin();
    anim.interpolate(1);

    // c1 at origin: center-relative [0,0,0] * 3 = [0,0,0] + center = [0,0,0]
    expect(c1.getPoints()[0][0]).toBeCloseTo(0, 5);
    expect(c1.getPoints()[0][1]).toBeCloseTo(0, 5);
    // c2 at [10,10,0]: center-relative [0,0,0] * 3 = [0,0,0] + center = [10,10,0]
    expect(c2.getPoints()[0][0]).toBeCloseTo(10, 5);
    expect(c2.getPoints()[0][1]).toBeCloseTo(10, 5);
  });

  it('works with multi-point shapes in a group', () => {
    // Shape 1: centered at [1, 0, 0], points at [0,0,0] and [2,0,0]
    const c1 = vm([
      [0, 0, 0],
      [2, 0, 0],
    ]);
    // Shape 2: centered at [5, 0, 0], points at [4,0,0] and [6,0,0]
    const c2 = vm([
      [4, 0, 0],
      [6, 0, 0],
    ]);
    const group = vgroup(c1, c2);

    // Scale by 2 relative to each shape's center
    const anim = new ApplyPointwiseFunctionToCenter(group, (p) => [p[0] * 2, p[1] * 2, p[2]]);
    anim.begin();
    anim.interpolate(1);

    // c1 center at [1,0,0]: [-1,0,0]*2=[-2,0,0]+[1,0,0]=[-1,0,0], [1,0,0]*2=[2,0,0]+[1,0,0]=[3,0,0]
    expect(c1.getPoints()[0][0]).toBeCloseTo(-1, 5);
    expect(c1.getPoints()[1][0]).toBeCloseTo(3, 5);

    // c2 center at [5,0,0]: [-1,0,0]*2=[-2,0,0]+[5,0,0]=[3,0,0], [1,0,0]*2=[2,0,0]+[5,0,0]=[7,0,0]
    expect(c2.getPoints()[0][0]).toBeCloseTo(3, 5);
    expect(c2.getPoints()[1][0]).toBeCloseTo(7, 5);
  });

  it('factory creates ApplyPointwiseFunctionToCenter', () => {
    const fn = (p: number[]) => p;
    const v = vm([[0, 0, 0]]);
    expect(applyPointwiseFunctionToCenter(v, fn)).toBeInstanceOf(ApplyPointwiseFunctionToCenter);
  });

  it('factory passes options through', () => {
    const fn = (p: number[]) => p;
    const v = vm([[0, 0, 0]]);
    const anim = applyPointwiseFunctionToCenter(v, fn, { duration: 5 });
    expect(anim).toBeInstanceOf(ApplyPointwiseFunctionToCenter);
    expect(anim.duration).toBe(5);
  });
});

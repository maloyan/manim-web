import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VMobject } from '../core/VMobject';
import { Circle } from '../mobjects/geometry/Circle';
import {
  ApplyFunction,
  applyFunction,
  ApplyMethod,
  applyMethod,
  ApplyMatrix,
  applyMatrix,
  FadeTransform,
  fadeTransform,
  FadeTransformPieces,
  fadeTransformPieces,
  ClockwiseTransform,
  clockwiseTransform,
  CounterclockwiseTransform,
  counterclockwiseTransform,
  TransformFromCopy,
  transformFromCopy,
  Swap,
  swap,
  CyclicReplace,
  cyclicReplace,
  ScaleInPlace,
  scaleInPlace,
  ShrinkToCenter,
  shrinkToCenter,
  Restore,
  restore,
  MobjectWithSavedState,
  FadeToColor,
  fadeToColor,
  TransformAnimations,
  transformAnimations,
} from './transform/TransformExtensions';
import {
  TransformMatchingShapes,
  transformMatchingShapes,
  TransformMatchingTex,
  transformMatchingTex,
} from './transform/TransformMatching';
import { ApplyPointwiseFunction, applyPointwiseFunction } from './transform/ApplyPointwiseFunction';
import { hungarian, hungarianFromSimilarity } from '../utils/hungarian';

// Helpers
function vm(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPoints(pts);
  return v;
}
function sq(): VMobject {
  return vm([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ]);
}
function vgroup(...children: VMobject[]): VMobject {
  const p = new VMobject();
  for (const c of children) p.add(c);
  return p;
}

// ── Hungarian algorithm ────────────────────────────────────────────────────

describe('Hungarian algorithm', () => {
  it('empty matrix returns empty', () => {
    const r = hungarian([]);
    expect(r.assignments).toEqual([]);
    expect(r.totalCost).toBe(0);
  });

  it('zero-column matrix leaves rows unassigned', () => {
    const r = hungarian([[], []]);
    expect(r.assignments).toEqual([-1, -1]);
  });

  it('solves 3x3 cost matrix optimally', () => {
    const r = hungarian([
      [10, 5, 13],
      [3, 7, 15],
      [8, 12, 11],
    ]);
    expect(r.totalCost).toBe(19);
    expect(r.assignments).toEqual([1, 0, 2]);
  });

  it('handles more rows than cols', () => {
    const r = hungarian([
      [1, 4],
      [2, 3],
      [5, 6],
    ]);
    expect(r.assignments.filter((a) => a >= 0).length).toBe(2);
    expect(r.totalCost).toBeLessThanOrEqual(4);
  });

  it('handles more cols than rows', () => {
    const r = hungarian([
      [1, 9, 2],
      [4, 3, 8],
    ]);
    expect(r.assignments.length).toBe(2);
    expect(r.totalCost).toBeLessThanOrEqual(4);
  });
});

describe('hungarianFromSimilarity', () => {
  it('empty matrix returns empty', () => {
    expect(hungarianFromSimilarity([]).assignments).toEqual([]);
  });

  it('matches highest similarity pairs', () => {
    const r = hungarianFromSimilarity([
      [0.9, 0.1],
      [0.2, 0.8],
    ]);
    expect(r.assignments).toEqual([0, 1]);
  });

  it('filters below threshold', () => {
    const r = hungarianFromSimilarity(
      [
        [0.3, 0.1],
        [0.1, 0.2],
      ],
      0.5,
    );
    expect(r.assignments).toEqual([-1, -1]);
  });

  it('keeps matches at threshold, rejects below', () => {
    const r = hungarianFromSimilarity(
      [
        [0.5, 0.1],
        [0.1, 0.9],
      ],
      0.5,
    );
    expect(r.assignments).toEqual([0, 1]);
  });

  it('mixed above/below threshold', () => {
    const r = hungarianFromSimilarity(
      [
        [0.9, 0.1],
        [0.1, 0.3],
      ],
      0.5,
    );
    expect(r.assignments[0]).toBe(0);
    expect(r.assignments[1]).toBe(-1);
  });
});

// ── ApplyFunction ──────────────────────────────────────────────────────────

describe('ApplyFunction', () => {
  it('stores func, mobject, and default duration', () => {
    const fn = (p: number[]) => [p[0] * 2, p[1] * 2, p[2]];
    const anim = new ApplyFunction(sq(), { func: fn });
    expect(anim.func).toBe(fn);
    expect(anim.duration).toBe(1);
  });

  it('alpha 0/0.5/1 interpolation', () => {
    const v = vm([
      [0, 0, 0],
      [2, 0, 0],
    ]);
    const anim = new ApplyFunction(v, { func: (p) => [p[0] + 4, p[1] + 4, p[2]] });
    anim.begin();
    anim.interpolate(0);
    expect(v.getPoints()[0][0]).toBeCloseTo(0, 5);
    anim.interpolate(0.5);
    expect(v.getPoints()[0][0]).toBeCloseTo(2, 5);
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(4, 5);
    expect(v.getPoints()[1][0]).toBeCloseTo(6, 5);
  });

  it('finish sets final points', () => {
    const v = vm([[0, 0, 0]]);
    const anim = new ApplyFunction(v, { func: (p) => [p[0] + 10, p[1] + 20, p[2]] });
    anim.begin();
    anim.finish();
    expect(v.getPoints()[0][0]).toBeCloseTo(10, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(20, 5);
  });

  it('rotation function', () => {
    const v = vm([[1, 0, 0]]);
    const anim = new ApplyFunction(v, { func: (p) => [-p[1], p[0], p[2]] });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(0, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(1, 5);
  });

  it('factory creates ApplyFunction', () => {
    const fn = (p: number[]) => p;
    expect(applyFunction(sq(), fn)).toBeInstanceOf(ApplyFunction);
  });
});

// ── ApplyMatrix ────────────────────────────────────────────────────────────

describe('ApplyMatrix', () => {
  it('3x3 identity is no-op', () => {
    const v = vm([[3, 4, 0]]);
    const anim = new ApplyMatrix(v, {
      matrix: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(3, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(4, 5);
  });

  it('3x3 scaling', () => {
    const v = vm([[1, 2, 0]]);
    const anim = new ApplyMatrix(v, {
      matrix: [
        [2, 0, 0],
        [0, 2, 0],
        [0, 0, 1],
      ],
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(2, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(4, 5);
  });

  it('3x3 rotation 90deg', () => {
    const v = vm([[1, 0, 0]]);
    const anim = new ApplyMatrix(v, {
      matrix: [
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
      ],
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(0, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(1, 5);
  });

  it('aboutPoint shifts the pivot', () => {
    const v = vm([[2, 0, 0]]);
    const anim = new ApplyMatrix(v, {
      matrix: [
        [2, 0, 0],
        [0, 2, 0],
        [0, 0, 1],
      ],
      aboutPoint: [1, 0, 0],
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(3, 5);
  });

  it('4x4 homogeneous matrix', () => {
    const v = vm([[1, 0, 0]]);
    const anim = new ApplyMatrix(v, {
      matrix: [
        [3, 0, 0, 0],
        [0, 3, 0, 0],
        [0, 0, 3, 0],
        [0, 0, 0, 1],
      ],
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(3, 5);
  });

  it('invalid matrix size returns original', () => {
    const v = vm([[5, 6, 0]]);
    const anim = new ApplyMatrix(v, { matrix: [[1, 2]] });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(5, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(6, 5);
  });

  it('factory creates ApplyMatrix', () => {
    expect(
      applyMatrix(sq(), [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]),
    ).toBeInstanceOf(ApplyMatrix);
  });
});

// ── FadeTransform ──────────────────────────────────────────────────────────

describe('FadeTransform', () => {
  it('stores defaults', () => {
    const anim = new FadeTransform(sq(), sq());
    expect(anim.stretchFactor).toBe(2);
    expect(anim.duration).toBe(1);
  });

  it('opacity V-curve: fades out then in', () => {
    const s = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    s.opacity = 1;
    const t = vm([
      [2, 0, 0],
      [3, 0, 0],
      [3, 1, 0],
      [2, 1, 0],
    ]);
    t.opacity = 1;
    const anim = new FadeTransform(s, t);
    anim.begin();
    anim.interpolate(0);
    expect(s.opacity).toBeCloseTo(1, 3);
    anim.interpolate(0.25);
    expect(s.opacity).toBeCloseTo(0.5, 3);
    anim.interpolate(0.5);
    expect(s.opacity).toBeCloseTo(0, 3);
    anim.interpolate(0.75);
    expect(s.opacity).toBeCloseTo(0.5, 3);
    anim.interpolate(1);
    expect(s.opacity).toBeCloseTo(1, 3);
  });

  it('finish sets target opacity', () => {
    const s = vm([[0, 0, 0]]);
    s.opacity = 0.8;
    const t = vm([[1, 0, 0]]);
    t.opacity = 0.6;
    const anim = new FadeTransform(s, t);
    anim.begin();
    anim.finish();
    expect(s.opacity).toBeCloseTo(0.6, 5);
  });

  it('factory creates FadeTransform', () => {
    expect(fadeTransform(sq(), sq())).toBeInstanceOf(FadeTransform);
  });
});

// ── ClockwiseTransform ─────────────────────────────────────────────────────

describe('ClockwiseTransform', () => {
  it('default angle is PI', () => {
    const anim = new ClockwiseTransform(sq(), sq());
    expect(anim.angle).toBeCloseTo(Math.PI, 5);
  });

  it('accepts custom angle', () => {
    const anim = new ClockwiseTransform(sq(), sq(), { angle: Math.PI / 4 });
    expect(anim.angle).toBeCloseTo(Math.PI / 4, 5);
  });

  it('interpolates points with rotation blend', () => {
    const s = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const t = vm([
      [4, 0, 0],
      [5, 0, 0],
      [5, 1, 0],
      [4, 1, 0],
    ]);
    const anim = new ClockwiseTransform(s, t);
    anim.begin();
    anim.interpolate(0.5);
    expect(s.getPoints().length).toBe(4);
  });

  it('finish sets target opacity', () => {
    const s = vm([[0, 0, 0]]);
    s.opacity = 0.5;
    const t = vm([[4, 0, 0]]);
    t.opacity = 0.9;
    const anim = new ClockwiseTransform(s, t);
    anim.begin();
    anim.finish();
    expect(s.opacity).toBeCloseTo(0.9, 5);
  });

  it('factory creates ClockwiseTransform', () => {
    const anim = clockwiseTransform(sq(), sq(), { angle: 1.5 });
    expect(anim).toBeInstanceOf(ClockwiseTransform);
    expect(anim.angle).toBeCloseTo(1.5, 5);
  });
});

// ── CounterclockwiseTransform ──────────────────────────────────────────────

describe('CounterclockwiseTransform', () => {
  it('default angle is PI', () => {
    expect(new CounterclockwiseTransform(sq(), sq()).angle).toBeCloseTo(Math.PI, 5);
  });

  it('interpolates without error', () => {
    const s = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const t = vm([
      [4, 0, 0],
      [5, 0, 0],
      [5, 1, 0],
      [4, 1, 0],
    ]);
    const anim = new CounterclockwiseTransform(s, t);
    anim.begin();
    anim.interpolate(0.5);
    expect(s.getPoints().length).toBe(4);
  });

  it('finish sets target opacity', () => {
    const s = vm([[0, 0, 0]]);
    s.opacity = 1;
    const t = vm([[5, 5, 0]]);
    t.opacity = 0.3;
    const anim = new CounterclockwiseTransform(s, t);
    anim.begin();
    anim.finish();
    expect(s.opacity).toBeCloseTo(0.3, 5);
  });

  it('factory creates CounterclockwiseTransform', () => {
    expect(counterclockwiseTransform(sq(), sq())).toBeInstanceOf(CounterclockwiseTransform);
  });
});

// ── TransformFromCopy ──────────────────────────────────────────────────────

describe('TransformFromCopy', () => {
  it('animates a copy, not the original', () => {
    const src = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const anim = new TransformFromCopy(
      src,
      vm([
        [5, 5, 0],
        [6, 5, 0],
      ]),
    );
    expect(anim.originalSource).toBe(src);
    expect(anim.mobject).not.toBe(src);
  });

  it('original source unchanged after interpolation', () => {
    const src = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const orig = src.getPoints().map((p) => [...p]);
    const anim = new TransformFromCopy(
      src,
      vm([
        [5, 5, 0],
        [6, 5, 0],
      ]),
    );
    anim.begin();
    anim.interpolate(0.5);
    expect(src.getPoints()[0][0]).toBeCloseTo(orig[0][0], 5);
  });

  it('factory creates TransformFromCopy', () => {
    const src = sq();
    const anim = transformFromCopy(src, sq());
    expect(anim).toBeInstanceOf(TransformFromCopy);
    expect(anim.originalSource).toBe(src);
  });
});

// ── ApplyPointwiseFunction ─────────────────────────────────────────────────

describe('ApplyPointwiseFunction', () => {
  it('stores func reference', () => {
    const fn = (p: number[]) => [p[0] * 2, p[1] * 2, p[2]];
    const anim = new ApplyPointwiseFunction(sq(), fn);
    expect(anim.func).toBe(fn);
  });

  it('translation at alpha 0/0.5/1', () => {
    const v = vm([
      [1, 2, 0],
      [3, 4, 0],
    ]);
    const anim = new ApplyPointwiseFunction(v, (p) => [p[0] + 10, p[1] + 20, p[2]]);
    anim.begin();
    anim.interpolate(0);
    expect(v.getPoints()[0][0]).toBeCloseTo(1, 5);
    anim.interpolate(0.5);
    expect(v.getPoints()[0][0]).toBeCloseTo(6, 5);
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(11, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(22, 5);
  });

  it('finish sets target points', () => {
    const v = vm([[2, 0, 0]]);
    const anim = new ApplyPointwiseFunction(v, (p) => [-p[0], -p[1], p[2]]);
    anim.begin();
    anim.finish();
    expect(v.getPoints()[0][0]).toBeCloseTo(-2, 5);
  });

  it('skips VMobjects with zero points', () => {
    const v = new VMobject();
    const anim = new ApplyPointwiseFunction(v, (p) => [p[0] + 1, p[1], p[2]]);
    anim.begin();
    anim.interpolate(0.5);
    expect(v.getPoints().length).toBe(0);
  });

  it('applies to children in a group', () => {
    const c1 = vm([[0, 0, 0]]),
      c2 = vm([[1, 1, 0]]);
    const anim = new ApplyPointwiseFunction(vgroup(c1, c2), (p) => [p[0] + 5, p[1] + 5, p[2]]);
    anim.begin();
    anim.interpolate(1);
    expect(c1.getPoints()[0][0]).toBeCloseTo(5, 5);
    expect(c2.getPoints()[0][0]).toBeCloseTo(6, 5);
  });

  it('scaling function on 3D point', () => {
    const v = vm([[2, 3, 1]]);
    const anim = new ApplyPointwiseFunction(v, (p) => [p[0] * 3, p[1] * 3, p[2] * 3]);
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(6, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(9, 5);
    expect(v.getPoints()[0][2]).toBeCloseTo(3, 5);
  });

  it('factory creates ApplyPointwiseFunction', () => {
    const fn = (p: number[]) => p;
    expect(applyPointwiseFunction(sq(), fn)).toBeInstanceOf(ApplyPointwiseFunction);
  });
});

// ── TransformMatchingShapes ────────────────────────────────────────────────

describe('TransformMatchingShapes', () => {
  it('default options', () => {
    const anim = new TransformMatchingShapes(sq(), sq());
    expect(anim.matchThreshold).toBe(0.5);
    expect(anim.fadeRatio).toBeCloseTo(0.25, 5);
    expect(anim.keyFunc).toBeUndefined();
  });

  it('custom matchThreshold', () => {
    expect(new TransformMatchingShapes(sq(), sq(), { matchThreshold: 0.8 }).matchThreshold).toBe(
      0.8,
    );
  });

  it('clamps fadeRatio to [0, 0.5]', () => {
    expect(new TransformMatchingShapes(sq(), sq(), { fadeRatio: -0.1 }).fadeRatio).toBe(0);
    expect(new TransformMatchingShapes(sq(), sq(), { fadeRatio: 0.8 }).fadeRatio).toBe(0.5);
    expect(new TransformMatchingShapes(sq(), sq(), { fadeRatio: 0.3 }).fadeRatio).toBeCloseTo(
      0.3,
      5,
    );
  });

  it('single VMobject transforms without error', () => {
    const s = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const t = vm([
      [2, 0, 0],
      [3, 0, 0],
      [3, 1, 0],
      [2, 1, 0],
    ]);
    const anim = new TransformMatchingShapes(s, t);
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('keyFunc is called during matching', () => {
    let called = 0;
    const keyFn = (v: VMobject) => {
      called++;
      const p = v.getPoints();
      return p.length > 0 ? `y=${p[0][1]}` : '';
    };
    const src = vgroup(
      vm([
        [0, 0, 0],
        [1, 0, 0],
      ]),
      vm([
        [0, 1, 0],
        [1, 1, 0],
      ]),
    );
    const tgt = vgroup(
      vm([
        [5, 0, 0],
        [6, 0, 0],
      ]),
      vm([
        [5, 1, 0],
        [6, 1, 0],
      ]),
    );
    const anim = new TransformMatchingShapes(src, tgt, { keyFunc: keyFn });
    anim.begin();
    expect(called).toBeGreaterThan(0);
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('runs 0-1 sweep without error', () => {
    const s = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const t = vm([
      [2, 2, 0],
      [3, 2, 0],
      [3, 3, 0],
      [2, 3, 0],
    ]);
    const anim = new TransformMatchingShapes(s, t);
    anim.begin();
    for (let a = 0; a <= 1; a += 0.2) anim.interpolate(a);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('factory creates TransformMatchingShapes', () => {
    const anim = transformMatchingShapes(sq(), sq(), { matchThreshold: 0.7 });
    expect(anim).toBeInstanceOf(TransformMatchingShapes);
    expect(anim.matchThreshold).toBe(0.7);
  });
});

// ── TransformMatchingTex ───────────────────────────────────────────────────

describe('TransformMatchingTex', () => {
  it('default options', () => {
    const anim = new TransformMatchingTex(sq(), sq());
    expect(anim.fadeRatio).toBeCloseTo(0.25, 5);
    expect(anim.transformMismatches).toBe(false);
    expect(typeof anim.keyFunc).toBe('function');
  });

  it('accepts custom keyFunc and transformMismatches', () => {
    const k = () => 'x';
    const anim = new TransformMatchingTex(sq(), sq(), { keyFunc: k, transformMismatches: true });
    expect(anim.keyFunc).toBe(k);
    expect(anim.transformMismatches).toBe(true);
  });

  it('clamps fadeRatio', () => {
    expect(new TransformMatchingTex(sq(), sq(), { fadeRatio: -0.5 }).fadeRatio).toBe(0);
    expect(new TransformMatchingTex(sq(), sq(), { fadeRatio: 0.9 }).fadeRatio).toBe(0.5);
  });

  it('children with same key get matched', () => {
    const keyFn = (v: VMobject) => {
      const p = v.getPoints();
      return p.length > 0 ? `${p[0][1].toFixed(0)}` : '';
    };
    const src = vgroup(
      vm([
        [0, 0, 0],
        [1, 0, 0],
      ]),
      vm([
        [0, 2, 0],
        [1, 2, 0],
      ]),
    );
    const tgt = vgroup(
      vm([
        [5, 0, 0],
        [6, 0, 0],
      ]),
      vm([
        [5, 2, 0],
        [6, 2, 0],
      ]),
    );
    const anim = new TransformMatchingTex(src, tgt, { keyFunc: keyFn });
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('transformMismatches pairs unmatched via Hungarian', () => {
    const keyFn = (v: VMobject) => {
      const p = v.getPoints();
      return `u_${p[0]?.[0]}_${p[0]?.[1]}`;
    };
    const src = vgroup(
      vm([
        [0, 0, 0],
        [1, 0, 0],
      ]),
      vm([
        [0, 5, 0],
        [1, 5, 0],
      ]),
    );
    const tgt = vgroup(
      vm([
        [10, 0, 0],
        [11, 0, 0],
      ]),
      vm([
        [10, 10, 0],
        [11, 10, 0],
      ]),
    );
    const anim = new TransformMatchingTex(src, tgt, { keyFunc: keyFn, transformMismatches: true });
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('unmatched source fades out', () => {
    const c1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    c1.opacity = 1;
    const keyFn = (v: VMobject) => `k_${v.getPoints()[0]?.[0]}`;
    const anim = new TransformMatchingTex(
      vgroup(c1),
      vgroup(
        vm([
          [10, 10, 0],
          [11, 10, 0],
        ]),
      ),
      { keyFunc: keyFn },
    );
    anim.begin();
    anim.interpolate(0.5);
    expect(c1.opacity).toBeLessThan(1);
  });

  it('factory creates TransformMatchingTex', () => {
    const anim = transformMatchingTex(sq(), sq(), { transformMismatches: true });
    expect(anim).toBeInstanceOf(TransformMatchingTex);
    expect(anim.transformMismatches).toBe(true);
  });
});

// ── ApplyMethod ────────────────────────────────────────────────────────────

describe('ApplyMethod', () => {
  it('creates a target by copying and calling the method', () => {
    const c = new Circle({ radius: 1 });
    c.position.set(0, 0, 0);
    const anim = new ApplyMethod(c, { methodName: 'shift', args: [[3, 0, 0]] });
    expect(anim.methodName).toBe('shift');
    expect(anim.args).toEqual([[3, 0, 0]]);
  });

  it('transforms toward target after calling method on copy', () => {
    const c = new Circle({ radius: 1, color: '#ff0000' });
    c.opacity = 1;
    c.position.set(0, 0, 0);
    const anim = new ApplyMethod(c, { methodName: 'setColor', args: ['#0000ff'] });
    anim.begin();
    anim.finish();
    // After finish, color should match the target (which had setColor called)
    expect(c.color.toLowerCase()).toBe('#0000ff');
  });

  it('handles non-existent method gracefully', () => {
    const c = new Circle({ radius: 1 });
    // Non-existent method should just create a copy without calling anything
    const anim = new ApplyMethod(c, { methodName: 'nonExistentMethod' });
    expect(anim.methodName).toBe('nonExistentMethod');
    expect(anim.args).toEqual([]);
  });

  it('defaults args to empty array', () => {
    const c = new Circle({ radius: 1 });
    const anim = new ApplyMethod(c, { methodName: 'setColor' });
    expect(anim.args).toEqual([]);
  });

  it('factory creates ApplyMethod', () => {
    const c = new Circle({ radius: 1 });
    const anim = applyMethod(c, 'setColor', ['#ff0000'], { duration: 2 });
    expect(anim).toBeInstanceOf(ApplyMethod);
    expect(anim.methodName).toBe('setColor');
    expect(anim.duration).toBeCloseTo(2, 5);
  });
});

// ── FadeTransformPieces ────────────────────────────────────────────────────

describe('FadeTransformPieces', () => {
  it('stores target and defaults', () => {
    const s = sq();
    const t = sq();
    const anim = new FadeTransformPieces(s, t);
    expect(anim.target).toBe(t);
    expect(anim.duration).toBe(1);
  });

  it('handles single piece (no submobjects) with fade V-curve', () => {
    const s = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    s.opacity = 1;
    const t = vm([
      [2, 0, 0],
      [3, 0, 0],
      [3, 1, 0],
      [2, 1, 0],
    ]);
    t.opacity = 0.8;

    const anim = new FadeTransformPieces(s, t);
    anim.begin();

    // First half: fading out
    anim.interpolate(0);
    expect(s.opacity).toBeCloseTo(1, 3);
    anim.interpolate(0.25);
    expect(s.opacity).toBeCloseTo(0.5, 3);
    anim.interpolate(0.5);
    expect(s.opacity).toBeCloseTo(0, 3);

    // Second half: fading in toward target opacity
    anim.interpolate(0.75);
    expect(s.opacity).toBeCloseTo(0.4, 3); // 0.8 * (2*0.75 - 1) = 0.8*0.5
    anim.interpolate(1);
    expect(s.opacity).toBeCloseTo(0.8, 3);
  });

  it('handles submobjects (pieces) independently', () => {
    const c1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    c1.opacity = 1;
    const c2 = vm([
      [0, 1, 0],
      [1, 1, 0],
    ]);
    c2.opacity = 1;
    const src = vgroup(c1, c2);

    const t1 = vm([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    t1.opacity = 0.6;
    const t2 = vm([
      [2, 1, 0],
      [3, 1, 0],
    ]);
    t2.opacity = 0.4;
    const tgt = vgroup(t1, t2);

    const anim = new FadeTransformPieces(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    // At alpha 0.5 both children should have near-zero opacity (mid-fade)
    expect(c1.opacity).toBeCloseTo(0, 3);
    expect(c2.opacity).toBeCloseTo(0, 3);

    anim.interpolate(1);
    expect(c1.opacity).toBeCloseTo(0.6, 3);
    expect(c2.opacity).toBeCloseTo(0.4, 3);
  });

  it('finish sets final target points and opacity for submobjects', () => {
    const c1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    c1.opacity = 1;
    const src = vgroup(c1);

    const t1 = vm([
      [5, 5, 0],
      [6, 5, 0],
    ]);
    t1.opacity = 0.3;
    const tgt = vgroup(t1);

    const anim = new FadeTransformPieces(src, tgt);
    anim.begin();
    anim.finish();
    expect(c1.opacity).toBeCloseTo(0.3, 5);
    expect(anim.isFinished()).toBe(true);
  });

  it('finish sets final state for single-piece (no submobjects)', () => {
    const s = vm([[0, 0, 0]]);
    s.opacity = 1;
    const t = vm([[5, 5, 0]]);
    t.opacity = 0.5;

    const anim = new FadeTransformPieces(s, t);
    anim.begin();
    anim.finish();
    expect(s.opacity).toBeCloseTo(0.5, 5);
    expect(anim.isFinished()).toBe(true);
  });

  it('handles more source children than target children', () => {
    const c1 = vm([[0, 0, 0]]);
    const c2 = vm([[1, 1, 0]]);
    const c3 = vm([[2, 2, 0]]);
    const src = vgroup(c1, c2, c3);

    const t1 = vm([[5, 0, 0]]);
    const tgt = vgroup(t1);

    const anim = new FadeTransformPieces(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('handles more target children than source children', () => {
    const c1 = vm([[0, 0, 0]]);
    const src = vgroup(c1);

    const t1 = vm([[5, 0, 0]]);
    const t2 = vm([[6, 0, 0]]);
    const t3 = vm([[7, 0, 0]]);
    const tgt = vgroup(t1, t2, t3);

    const anim = new FadeTransformPieces(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('factory creates FadeTransformPieces', () => {
    const anim = fadeTransformPieces(sq(), sq());
    expect(anim).toBeInstanceOf(FadeTransformPieces);
  });
});

// ── Swap ───────────────────────────────────────────────────────────────────

describe('Swap', () => {
  it('stores defaults', () => {
    const m1 = sq();
    const m2 = sq();
    const anim = new Swap(m1, m2);
    expect(anim.mobject).toBe(m1);
    expect(anim.mobject2).toBe(m2);
    expect(anim.pathArc).toBeCloseTo(Math.PI / 2, 5);
    expect(anim.duration).toBe(1);
  });

  it('accepts custom pathArc', () => {
    const anim = new Swap(sq(), sq(), { pathArc: Math.PI });
    expect(anim.pathArc).toBeCloseTo(Math.PI, 5);
  });

  it('swaps positions after finish', () => {
    const m1 = sq();
    m1.position.set(0, 0, 0);
    const m2 = sq();
    m2.position.set(5, 3, 0);

    const anim = new Swap(m1, m2);
    anim.begin();
    anim.finish();

    expect(m1.position.x).toBeCloseTo(5, 5);
    expect(m1.position.y).toBeCloseTo(3, 5);
    expect(m2.position.x).toBeCloseTo(0, 5);
    expect(m2.position.y).toBeCloseTo(0, 5);
  });

  it('positions interpolate halfway at alpha 0.5', () => {
    const m1 = sq();
    m1.position.set(0, 0, 0);
    const m2 = sq();
    m2.position.set(10, 0, 0);

    const anim = new Swap(m1, m2);
    anim.begin();
    anim.interpolate(0.5);

    // x positions should be halfway (5) with arc offsets on y
    expect(m1.position.x).toBeCloseTo(5, 3);
    expect(m2.position.x).toBeCloseTo(5, 3);
    // y positions should have arc offset (sin(0.5*PI) * pathArc * 0.5)
    const arcOffset = Math.sin(0.5 * Math.PI) * (Math.PI / 2);
    expect(m1.position.y).toBeCloseTo(arcOffset * 0.5, 3);
    expect(m2.position.y).toBeCloseTo(-arcOffset * 0.5, 3);
  });

  it('at alpha 0 positions are at start', () => {
    const m1 = sq();
    m1.position.set(0, 0, 0);
    const m2 = sq();
    m2.position.set(8, 0, 0);

    const anim = new Swap(m1, m2);
    anim.begin();
    anim.interpolate(0);

    expect(m1.position.x).toBeCloseTo(0, 5);
    expect(m2.position.x).toBeCloseTo(8, 5);
  });

  it('factory creates Swap', () => {
    const anim = swap(sq(), sq(), { pathArc: 1 });
    expect(anim).toBeInstanceOf(Swap);
    expect(anim.pathArc).toBeCloseTo(1, 5);
  });
});

// ── CyclicReplace ──────────────────────────────────────────────────────────

describe('CyclicReplace', () => {
  it('requires at least 2 mobjects', () => {
    expect(() => new CyclicReplace([sq()])).toThrow('at least 2 mobjects');
  });

  it('stores defaults', () => {
    const m1 = sq();
    const m2 = sq();
    const anim = new CyclicReplace([m1, m2]);
    expect(anim.mobjects).toEqual([m1, m2]);
    expect(anim.pathArc).toBeCloseTo(Math.PI / 2, 5);
    expect(anim.duration).toBe(1);
  });

  it('accepts custom pathArc', () => {
    const anim = new CyclicReplace([sq(), sq()], { pathArc: 2 });
    expect(anim.pathArc).toBeCloseTo(2, 5);
  });

  it('cycles positions for 2 mobjects (equivalent to swap)', () => {
    const m1 = sq();
    m1.position.set(0, 0, 0);
    const m2 = sq();
    m2.position.set(4, 0, 0);

    const anim = new CyclicReplace([m1, m2]);
    anim.begin();
    anim.finish();

    // After cycle: m1 goes to m2's position, m2 goes to m1's position
    expect(m1.position.x).toBeCloseTo(4, 5);
    expect(m2.position.x).toBeCloseTo(0, 5);
  });

  it('cycles positions for 3 mobjects', () => {
    const m1 = sq();
    m1.position.set(0, 0, 0);
    const m2 = sq();
    m2.position.set(3, 0, 0);
    const m3 = sq();
    m3.position.set(6, 0, 0);

    const anim = new CyclicReplace([m1, m2, m3]);
    anim.begin();
    anim.finish();

    // After cycle: m1->m2 pos, m2->m3 pos, m3->m1 pos
    expect(m1.position.x).toBeCloseTo(3, 5);
    expect(m2.position.x).toBeCloseTo(6, 5);
    expect(m3.position.x).toBeCloseTo(0, 5);
  });

  it('interpolates with arc offsets at alpha 0.5', () => {
    const m1 = sq();
    m1.position.set(0, 0, 0);
    const m2 = sq();
    m2.position.set(10, 0, 0);

    const anim = new CyclicReplace([m1, m2]);
    anim.begin();
    anim.interpolate(0.5);

    // x positions should be halfway
    expect(m1.position.x).toBeCloseTo(5, 3);
    expect(m2.position.x).toBeCloseTo(5, 3);
  });

  it('factory creates CyclicReplace', () => {
    const anim = cyclicReplace([sq(), sq(), sq()], { duration: 3 });
    expect(anim).toBeInstanceOf(CyclicReplace);
    expect(anim.duration).toBeCloseTo(3, 5);
  });
});

// ── ScaleInPlace ───────────────────────────────────────────────────────────

describe('ScaleInPlace', () => {
  it('stores scale factor', () => {
    const m = sq();
    const anim = new ScaleInPlace(m, { scaleFactor: 2 });
    expect(anim.scaleFactor).toBe(2);
    expect(anim.duration).toBe(1);
  });

  it('scales from initial to target scale', () => {
    const m = sq();
    m.scaleVector.set(1, 1, 1);

    const anim = new ScaleInPlace(m, { scaleFactor: 3 });
    anim.begin();
    anim.interpolate(0);
    expect(m.scaleVector.x).toBeCloseTo(1, 3);

    anim.interpolate(0.5);
    expect(m.scaleVector.x).toBeCloseTo(2, 3);

    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(3, 3);
  });

  it('finish sets final scale', () => {
    const m = sq();
    m.scaleVector.set(1, 1, 1);

    const anim = new ScaleInPlace(m, { scaleFactor: 2 });
    anim.begin();
    anim.finish();

    expect(m.scaleVector.x).toBeCloseTo(2, 5);
    expect(m.scaleVector.y).toBeCloseTo(2, 5);
    expect(m.scaleVector.z).toBeCloseTo(2, 5);
    expect(anim.isFinished()).toBe(true);
  });

  it('works with scale factor less than 1', () => {
    const m = sq();
    m.scaleVector.set(4, 4, 4);

    const anim = new ScaleInPlace(m, { scaleFactor: 0.5 });
    anim.begin();
    anim.finish();

    expect(m.scaleVector.x).toBeCloseTo(2, 5);
    expect(m.scaleVector.y).toBeCloseTo(2, 5);
  });

  it('factory creates ScaleInPlace', () => {
    const anim = scaleInPlace(sq(), 2.5, { duration: 0.5 });
    expect(anim).toBeInstanceOf(ScaleInPlace);
    expect(anim.scaleFactor).toBe(2.5);
    expect(anim.duration).toBeCloseTo(0.5, 5);
  });
});

// ── ShrinkToCenter ─────────────────────────────────────────────────────────

describe('ShrinkToCenter', () => {
  it('defaults to 1s duration', () => {
    const anim = new ShrinkToCenter(sq());
    expect(anim.duration).toBe(1);
  });

  it('scale shrinks to zero over animation', () => {
    const m = sq();
    m.scaleVector.set(2, 2, 2);

    const anim = new ShrinkToCenter(m);
    anim.begin();

    anim.interpolate(0);
    expect(m.scaleVector.x).toBeCloseTo(2, 3);

    anim.interpolate(0.5);
    expect(m.scaleVector.x).toBeCloseTo(1, 3);

    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(0, 3);
  });

  it('finish sets scale to zero', () => {
    const m = sq();
    m.scaleVector.set(3, 3, 3);

    const anim = new ShrinkToCenter(m);
    anim.begin();
    anim.finish();

    expect(m.scaleVector.x).toBeCloseTo(0, 5);
    expect(m.scaleVector.y).toBeCloseTo(0, 5);
    expect(m.scaleVector.z).toBeCloseTo(0, 5);
    expect(anim.isFinished()).toBe(true);
  });

  it('factory creates ShrinkToCenter', () => {
    const anim = shrinkToCenter(sq(), { duration: 0.3 });
    expect(anim).toBeInstanceOf(ShrinkToCenter);
    expect(anim.duration).toBeCloseTo(0.3, 5);
  });
});

// ── Restore ────────────────────────────────────────────────────────────────

describe('Restore', () => {
  it('throws if savedState is null', () => {
    const c = new Circle({ radius: 1 });
    expect(() => {
      new Restore(c as unknown as MobjectWithSavedState);
    }).toThrow('Restore requires mobject.savedState to be set');
  });

  it('works when savedState is set via saveState()', () => {
    const c = new Circle({ radius: 1, color: '#ff0000' });
    c.opacity = 1;
    c.saveState();

    // Modify the circle
    c.opacity = 0.2;
    c.color = '#0000ff';
    c.position.set(5, 5, 0);

    const anim = new Restore(c as unknown as MobjectWithSavedState);
    anim.begin();
    anim.interpolate(0.5);
    // Opacity should be between 0.2 and 1
    expect(c.opacity).toBeGreaterThan(0.2);
    expect(c.opacity).toBeLessThan(1);

    anim.finish();
    // After restore, should be back to saved state
    expect(c.opacity).toBeCloseTo(1, 3);
    expect(anim.isFinished()).toBe(true);
  });

  it('factory creates Restore', () => {
    const c = new Circle({ radius: 1 });
    c.saveState();
    const anim = restore(c as unknown as MobjectWithSavedState);
    expect(anim).toBeInstanceOf(Restore);
  });

  it('factory throws without savedState', () => {
    const c = new Circle({ radius: 1 });
    expect(() => {
      restore(c as unknown as MobjectWithSavedState);
    }).toThrow('Restore requires mobject.savedState to be set');
  });
});

// ── FadeToColor ────────────────────────────────────────────────────────────

describe('FadeToColor', () => {
  it('stores target color', () => {
    const m = sq();
    const anim = new FadeToColor(m, { color: '#00ff00' });
    expect(anim.targetColor).toBe('#00ff00');
    expect(anim.duration).toBe(1);
  });

  it('interpolates color from source to target', () => {
    const m = sq();
    m.color = '#ff0000';

    const anim = new FadeToColor(m, { color: '#0000ff' });
    anim.begin();

    anim.interpolate(0);
    expect(new THREE.Color(m.color).r).toBeCloseTo(1.0, 2);

    anim.interpolate(1);
    expect(new THREE.Color(m.color).b).toBeCloseTo(1.0, 2);

    anim.interpolate(0.5);
    const mid = new THREE.Color(m.color);
    expect(mid.r).toBeCloseTo(0.5, 1);
    expect(mid.b).toBeCloseTo(0.5, 1);
  });

  it('finish sets exact target color', () => {
    const m = sq();
    m.color = '#ff0000';

    const anim = new FadeToColor(m, { color: '#00ff00' });
    anim.begin();
    anim.finish();

    expect(m.color).toBe('#00ff00');
    expect(anim.isFinished()).toBe(true);
  });

  it('factory creates FadeToColor', () => {
    const anim = fadeToColor(sq(), '#ff00ff', { duration: 2 });
    expect(anim).toBeInstanceOf(FadeToColor);
    expect(anim.targetColor).toBe('#ff00ff');
    expect(anim.duration).toBeCloseTo(2, 5);
  });
});

// ── TransformAnimations ────────────────────────────────────────────────────

describe('TransformAnimations', () => {
  it('stores both animations', () => {
    const v1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const v2 = vm([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const anim1 = new ApplyFunction(v1, { func: (p) => [p[0] + 1, p[1], p[2]] });
    const anim2 = new ApplyFunction(v2, { func: (p) => [p[0] + 2, p[1], p[2]] });
    const meta = new TransformAnimations(anim1, anim2);
    expect(meta.animation1).toBe(anim1);
    expect(meta.animation2).toBe(anim2);
    expect(meta.duration).toBe(1);
  });

  it('accepts custom transformRateFunc', () => {
    const v1 = vm([[0, 0, 0]]);
    const v2 = vm([[1, 0, 0]]);
    const anim1 = new ApplyFunction(v1, { func: (p) => [p[0] + 1, p[1], p[2]] });
    const anim2 = new ApplyFunction(v2, { func: (p) => [p[0] + 2, p[1], p[2]] });
    const customRate = (t: number) => t * t;
    const meta = new TransformAnimations(anim1, anim2, { transformRateFunc: customRate });
    expect(meta.transformRateFunc).toBe(customRate);
  });

  it('begin/interpolate/finish runs without error', () => {
    const v1 = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const v2 = vm([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const anim1 = new ApplyFunction(v1, { func: (p) => [p[0] + 2, p[1], p[2]] });
    const anim2 = new ApplyFunction(v2, { func: (p) => [p[0], p[1] + 2, p[2]] });
    const meta = new TransformAnimations(anim1, anim2);
    meta.begin();
    meta.interpolate(0);
    meta.interpolate(0.5);
    meta.interpolate(1);
    meta.finish();
    expect(meta.isFinished()).toBe(true);
  });

  it('factory creates TransformAnimations', () => {
    const v1 = vm([[0, 0, 0]]);
    const v2 = vm([[1, 0, 0]]);
    const anim1 = new ApplyFunction(v1, { func: (p) => [p[0] + 1, p[1], p[2]] });
    const anim2 = new ApplyFunction(v2, { func: (p) => [p[0] + 2, p[1], p[2]] });
    const meta = transformAnimations(anim1, anim2, { duration: 2 });
    expect(meta).toBeInstanceOf(TransformAnimations);
    expect(meta.duration).toBeCloseTo(2, 5);
  });
});

// ── TransformMatchingShapes extra coverage ──────────────────────────────────

describe('TransformMatchingShapes - fade-in with parent', () => {
  it('adds fade-in copies to parent when source has a parent', () => {
    // Source has 1 child, target has 2 children -> 1 unmatched target fades in
    const parentGroup = new VMobject();
    const srcChild = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const src = vgroup(srcChild);
    parentGroup.add(src);

    const tgtChild1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const tgtChild2 = vm([
      [5, 5, 0],
      [6, 5, 0],
    ]);
    tgtChild2.opacity = 0.8;
    const tgt = vgroup(tgtChild1, tgtChild2);

    const anim = new TransformMatchingShapes(src, tgt);
    anim.begin();
    // parentGroup should now have extra child for fade-in
    expect(parentGroup.children.length).toBeGreaterThan(1);
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('handles unmatched source fading out', () => {
    // Source has 2 children, target has 1 -> 1 source fades out
    const srcChild1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    srcChild1.opacity = 1;
    const srcChild2 = vm([
      [5, 5, 0],
      [6, 5, 0],
    ]);
    srcChild2.opacity = 1;
    const src = vgroup(srcChild1, srcChild2);
    const tgtChild = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const tgt = vgroup(tgtChild);

    const anim = new TransformMatchingShapes(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    // One source should be fading out
    const minOpacity = Math.min(srcChild1.opacity, srcChild2.opacity);
    expect(minOpacity).toBeLessThan(1);
    anim.finish();
  });
});

// ── TransformMatchingTex extra coverage ─────────────────────────────────────

describe('TransformMatchingTex - mismatch cross-fade', () => {
  it('cross-fades mismatched pairs at alpha < 0.5 and >= 0.5', () => {
    const keyFn = (v: VMobject) => `unique_${v.getPoints()[0]?.[0]}_${v.getPoints()[0]?.[1]}`;
    const srcChild = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    srcChild.opacity = 1;
    const tgtChild = vm([
      [10, 10, 0],
      [11, 10, 0],
    ]);
    tgtChild.opacity = 0.8;

    const src = vgroup(srcChild);
    const tgt = vgroup(tgtChild);

    const anim = new TransformMatchingTex(src, tgt, {
      keyFunc: keyFn,
      transformMismatches: true,
    });
    anim.begin();

    // At alpha 0.25 (< 0.5): fading out
    anim.interpolate(0.25);
    expect(srcChild.opacity).toBeGreaterThan(0);
    expect(srcChild.opacity).toBeLessThan(1);

    // At alpha 0.75 (> 0.5): fading in
    anim.interpolate(0.75);
    expect(srcChild.opacity).toBeGreaterThan(0);

    anim.finish();
  });

  it('handles nested VGroups in _getTexParts', () => {
    // Create nested structure: parent -> group -> children
    const leaf1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const leaf2 = vm([
      [0, 1, 0],
      [1, 1, 0],
    ]);
    const innerGroup = vgroup(leaf1, leaf2);
    const src = vgroup(innerGroup);

    const tLeaf1 = vm([
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const tLeaf2 = vm([
      [5, 1, 0],
      [6, 1, 0],
    ]);
    const tInnerGroup = vgroup(tLeaf1, tLeaf2);
    const tgt = vgroup(tInnerGroup);

    const anim = new TransformMatchingTex(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });

  it('finish finalizes mismatched pairs', () => {
    const keyFn = (v: VMobject) => `u_${v.getPoints()[0]?.[0]}`;
    const srcChild = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    srcChild.opacity = 1;
    const tgtChild = vm([
      [10, 0, 0],
      [11, 0, 0],
    ]);
    tgtChild.opacity = 0.6;
    tgtChild.color = '#ff0000';

    const anim = new TransformMatchingTex(vgroup(srcChild), vgroup(tgtChild), {
      keyFunc: keyFn,
      transformMismatches: true,
    });
    anim.begin();
    anim.finish();
    expect(srcChild.opacity).toBeCloseTo(0.6, 5);
    expect(srcChild.color).toBe('#ff0000');
  });
});

// ── TransformMatchingTex asymmetric unmatched coverage ──────────────────────

describe('TransformMatchingTex - asymmetric transformMismatches', () => {
  it('fades out extra unmatched sources when sources > targets (lines 572-573)', () => {
    // 3 unique source children, 1 unique target child
    // All different keys -> 0 matched by key
    // transformMismatches: Hungarian pairs 1 source with 1 target, leaving 2 sources unpaired
    const s1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    s1.opacity = 1;
    const s2 = vm([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    s2.opacity = 1;
    const s3 = vm([
      [4, 0, 0],
      [5, 0, 0],
    ]);
    s3.opacity = 1;
    const t1 = vm([
      [10, 10, 0],
      [11, 10, 0],
    ]);
    t1.opacity = 1;

    const keyFn = (v: VMobject) => {
      const p = v.getPoints();
      return `k_${p[0]?.[0]}_${p[0]?.[1]}`;
    };

    const src = vgroup(s1, s2, s3);
    const tgt = vgroup(t1);

    const anim = new TransformMatchingTex(src, tgt, {
      keyFunc: keyFn,
      transformMismatches: true,
    });
    anim.begin();
    anim.interpolate(0.5);

    // At least 2 sources should be fading (opacity < 1)
    const fading = [s1, s2, s3].filter((s) => s.opacity < 1);
    expect(fading.length).toBeGreaterThanOrEqual(2);

    anim.finish();
  });

  it('fades in extra unmatched targets when targets > sources (lines 585, 655)', () => {
    // 1 unique source child, 3 unique target children
    // All different keys -> 0 matched by key
    // transformMismatches: Hungarian pairs 1 source with closest target, 2 targets fade in
    const s1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    s1.opacity = 1;
    const t1 = vm([
      [10, 0, 0],
      [11, 0, 0],
    ]);
    t1.opacity = 0.9;
    const t2 = vm([
      [20, 0, 0],
      [21, 0, 0],
    ]);
    t2.opacity = 0.8;
    const t3 = vm([
      [30, 0, 0],
      [31, 0, 0],
    ]);
    t3.opacity = 0.7;

    const keyFn = (v: VMobject) => {
      const p = v.getPoints();
      return `k_${p[0]?.[0]}_${p[0]?.[1]}`;
    };

    // Add parent so _addFadeInPart hits line 655 (parent.add)
    const parentGroup = new VMobject();
    const src = vgroup(s1);
    parentGroup.add(src);

    const tgt = vgroup(t1, t2, t3);

    const anim = new TransformMatchingTex(src, tgt, {
      keyFunc: keyFn,
      transformMismatches: true,
    });
    anim.begin();

    // parentGroup should have fade-in copies added
    expect(parentGroup.children.length).toBeGreaterThan(1);

    anim.interpolate(0.5);
    anim.finish();
  });
});

describe('TransformMatchingTex - finish with fade parts (lines 729, 733)', () => {
  it('finish() sets fadeOutParts to 0 and fadeInParts to target opacity', () => {
    // Source has 2 children, target has 2 children, all unique keys -> no key matches
    // transformMismatches: false -> all sources fadeOut, all targets fadeIn
    const s1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    s1.opacity = 1;
    const s2 = vm([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    s2.opacity = 0.9;
    const t1 = vm([
      [10, 10, 0],
      [11, 10, 0],
    ]);
    t1.opacity = 0.8;
    const t2 = vm([
      [20, 20, 0],
      [21, 20, 0],
    ]);
    t2.opacity = 0.7;

    const keyFn = (v: VMobject) => {
      const p = v.getPoints();
      return `unique_${p[0]?.[0]}_${p[0]?.[1]}_${p[1]?.[0]}`;
    };

    const parentGroup = new VMobject();
    const src = vgroup(s1, s2);
    parentGroup.add(src);
    const tgt = vgroup(t1, t2);

    const anim = new TransformMatchingTex(src, tgt, {
      keyFunc: keyFn,
      transformMismatches: false,
    });
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();

    // Sources should be faded out to 0
    expect(s1.opacity).toBe(0);
    expect(s2.opacity).toBe(0);
  });
});

describe('TransformMatchingTex - defaultTexKey with getLatex (line 393)', () => {
  it('uses getLatex() when available on vmobject', () => {
    const s1 = vm([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    (s1 as unknown as { getLatex: () => string }).getLatex = () => 'x^2';
    const s2 = vm([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    (s2 as unknown as { getLatex: () => string }).getLatex = () => 'y^2';

    const t1 = vm([
      [10, 0, 0],
      [11, 0, 0],
    ]);
    (t1 as unknown as { getLatex: () => string }).getLatex = () => 'x^2';
    const t2 = vm([
      [20, 0, 0],
      [21, 0, 0],
    ]);
    (t2 as unknown as { getLatex: () => string }).getLatex = () => 'z^2';

    const src = vgroup(s1, s2);
    const tgt = vgroup(t1, t2);

    // Use default key function (no keyFunc override) which calls defaultTexKey
    const anim = new TransformMatchingTex(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });
});

describe('TransformMatchingTex - empty VMobject getBoundingBox (lines 22-23)', () => {
  it('handles VMobject with no points via getBoundingBox fallback', () => {
    // Create children with no points - defaultTexKey calls getBoundingBox which hits the empty branch
    const s1 = new VMobject(); // no points set
    const t1 = new VMobject(); // no points set

    const src = vgroup(s1);
    const tgt = vgroup(t1);

    // defaultTexKey will call getBoundingBox on empty VMobjects
    const anim = new TransformMatchingTex(src, tgt);
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(anim.isFinished()).toBe(true);
  });
});

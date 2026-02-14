import { describe, it, expect } from 'vitest';
import { VMobject } from '../core/VMobject';
import {
  ApplyFunction,
  applyFunction,
  ApplyMatrix,
  applyMatrix,
  FadeTransform,
  fadeTransform,
  ClockwiseTransform,
  clockwiseTransform,
  CounterclockwiseTransform,
  counterclockwiseTransform,
  TransformFromCopy,
  transformFromCopy,
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

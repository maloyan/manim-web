import { describe, it, expect } from 'vitest';
import {
  bezier,
  partialBezierPoints,
  splitBezier,
  subdivideBezier,
  bezierRemap,
  interpolate,
  integerInterpolate,
  mid,
  inverseInterpolate,
  matchInterpolate,
  isClosed,
  getSmoothCubicBezierHandlePoints,
  proportionsAlongBezierCurveForPoint,
  pointLiesOnBezier,
} from './bezier';

describe('interpolate', () => {
  it('interpolates scalars', () => {
    expect(interpolate(0, 10, 0.5)).toBe(5);
    expect(interpolate(0, 10, 0)).toBe(0);
    expect(interpolate(0, 10, 1)).toBe(10);
  });

  it('interpolates points component-wise', () => {
    expect(interpolate([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
  });
});

describe('inverseInterpolate', () => {
  it('inverts scalar interpolation', () => {
    expect(inverseInterpolate(0, 10, 5)).toBe(0.5);
    expect(inverseInterpolate(2, 6, 4)).toBe(0.5);
  });

  it('inverts point interpolation component-wise', () => {
    expect(inverseInterpolate([1, 2, 1], [7, 8, 11], [4, 5, 5])).toEqual([0.5, 0.5, 0.4]);
  });
});

describe('mid', () => {
  it('returns the scalar midpoint', () => {
    expect(mid(0, 10)).toBe(5);
  });

  it('returns the point midpoint', () => {
    expect(mid([0, 0, 0], [2, 4, 6])).toEqual([1, 2, 3]);
  });
});

describe('matchInterpolate', () => {
  it('maps a value between ranges', () => {
    expect(matchInterpolate(0, 100, 10, 20, 15)).toBe(50);
  });

  it('maps a point between ranges component-wise', () => {
    expect(matchInterpolate(0, 100, 0, 10, [0, 5, 10])).toEqual([0, 50, 100]);
  });
});

describe('integerInterpolate', () => {
  it('returns the integer and residue', () => {
    const [value, residue] = integerInterpolate(0, 10, 0.46);
    expect(value).toBe(4);
    expect(residue).toBeCloseTo(0.6, 10);
  });

  it('clamps at the boundaries', () => {
    expect(integerInterpolate(0, 10, 0)).toEqual([0, 0]);
    expect(integerInterpolate(0, 10, 1)).toEqual([9, 1]);
  });
});

describe('bezier', () => {
  it('evaluates a linear scalar Bézier', () => {
    const b = bezier([0, 1]);
    expect(b(0)).toBe(0);
    expect(b(0.5)).toBe(0.5);
    expect(b(1)).toBe(1);
  });

  it('returns the endpoints of a cubic Bézier at t=0 and t=1', () => {
    const controls = [
      [0, 0, 0],
      [1, 2, 0],
      [2, -1, 0],
      [3, 0, 0],
    ];
    const b = bezier(controls);
    expect(b(0)).toEqual([0, 0, 0]);
    expect(b(1)).toEqual([3, 0, 0]);
  });

  it('matches the cubic Bernstein form at t=0.5', () => {
    const p0 = [0, 0, 0];
    const p1 = [1, 2, 0];
    const p2 = [2, -1, 0];
    const p3 = [3, 0, 0];
    const b = bezier([p0, p1, p2, p3]);
    const t = 0.5;
    const mt = 1 - t;
    const expected = [0, 1, 2].map(
      (d) =>
        mt * mt * mt * p0[d] + 3 * mt * mt * t * p1[d] + 3 * mt * t * t * p2[d] + t * t * t * p3[d],
    );
    const got = b(t);
    for (let d = 0; d < 3; d++) expect(got[d]).toBeCloseTo(expected[d], 12);
  });
});

describe('partialBezierPoints', () => {
  it('returns the same curve over the full interval [0, 1]', () => {
    const controls = [
      [0, 0, 0],
      [1, 2, 0],
      [2, -1, 0],
      [3, 0, 0],
    ];
    const got = partialBezierPoints(controls, 0, 1);
    for (let i = 0; i < controls.length; i++) {
      for (let d = 0; d < 3; d++) expect(got[i][d]).toBeCloseTo(controls[i][d], 12);
    }
  });

  it('matches direct evaluation of the sub-curve', () => {
    const controls = [
      [0, 0, 0],
      [1, 2, 0],
      [2, -1, 0],
      [3, 0, 0],
    ];
    const a = 0.25;
    const b = 0.75;
    const partial = bezier(partialBezierPoints(controls, a, b));
    const full = bezier(controls);
    for (const u of [0, 0.5, 1]) {
      const got = partial(u);
      const expected = full(a + (b - a) * u);
      for (let d = 0; d < 3; d++) expect(got[d]).toBeCloseTo(expected[d], 10);
    }
  });
});

describe('splitBezier', () => {
  it('splits a cubic into halves that recombine', () => {
    const controls = [
      [0, 0, 0],
      [1, 2, 0],
      [2, -1, 0],
      [3, 0, 0],
    ];
    const t = 0.5;
    const halves = splitBezier(controls, t);
    const h0 = halves.slice(0, 4);
    const h1 = halves.slice(4, 8);
    const full = bezier(controls);
    const splitPoint = full(t);

    // The shared point: end of first half === start of second half === curve(t).
    for (let d = 0; d < 3; d++) {
      expect(h0[3][d]).toBeCloseTo(splitPoint[d], 12);
      expect(h1[0][d]).toBeCloseTo(splitPoint[d], 12);
    }
    // Endpoints are preserved.
    expect(h0[0]).toEqual(controls[0]);
    expect(h1[3]).toEqual(controls[3]);

    // Re-evaluating the halves reproduces the original curve.
    const first = bezier(h0);
    const second = bezier(h1);
    for (const u of [0, 0.3, 0.7, 1]) {
      const a = first(u);
      const ea = full(t * u);
      const b = second(u);
      const eb = full(t + (1 - t) * u);
      for (let d = 0; d < 3; d++) {
        expect(a[d]).toBeCloseTo(ea[d], 10);
        expect(b[d]).toBeCloseTo(eb[d], 10);
      }
    }
  });
});

describe('subdivideBezier', () => {
  it('returns the curve unchanged for a single division', () => {
    const controls = [
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
      [3, 1, 0],
    ];
    expect(subdivideBezier(controls, 1)).toEqual(controls);
  });

  it('subdivides into pieces that cover the curve', () => {
    const controls = [
      [0, 0, 0],
      [1, 2, 0],
      [2, -1, 0],
      [3, 0, 0],
    ];
    const n = 3;
    const sub = subdivideBezier(controls, n);
    expect(sub.length).toBe(n * 4);
    const full = bezier(controls);
    for (let piece = 0; piece < n; piece++) {
      const seg = bezier(sub.slice(piece * 4, piece * 4 + 4));
      for (const u of [0, 0.5, 1]) {
        const got = seg(u);
        const expected = full((piece + u) / n);
        for (let d = 0; d < 3; d++) expect(got[d]).toBeCloseTo(expected[d], 10);
      }
    }
  });
});

describe('bezierRemap', () => {
  it('increases the number of curves while preserving shape', () => {
    const curves = [
      [
        [0, 0, 0],
        [1, 1, 0],
        [2, -1, 0],
        [3, 0, 0],
      ],
      [
        [3, 0, 0],
        [4, 1, 0],
        [5, -1, 0],
        [6, 0, 0],
      ],
    ];
    const remapped = bezierRemap(curves, 4);
    expect(remapped.length).toBe(4);
    for (const curve of remapped) expect(curve.length).toBe(4);
    // First remapped curve starts at the global start.
    expect(remapped[0][0]).toEqual([0, 0, 0]);
    // Last remapped curve ends at the global end.
    expect(remapped[3][3]).toEqual([6, 0, 0]);
  });
});

describe('isClosed', () => {
  it('detects a closed spline', () => {
    expect(
      isClosed([
        [0, 0, 0],
        [1, 2, 3],
        [3, 2, 1],
        [0, 0, 0],
      ]),
    ).toBe(true);
  });

  it('treats a tiny gap as closed and a larger one as open', () => {
    expect(
      isClosed([
        [0, 0, 0],
        [1, 2, 3],
        [1e-10, 1e-10, 1e-10],
      ]),
    ).toBe(true);
    expect(
      isClosed([
        [0, 0, 0],
        [1, 2, 3],
        [1e-2, 1e-2, 1e-2],
      ]),
    ).toBe(false);
  });
});

describe('getSmoothCubicBezierHandlePoints', () => {
  it('returns one handle pair per segment', () => {
    const anchors = [
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
      [3, 1, 0],
    ];
    const { h1, h2 } = getSmoothCubicBezierHandlePoints(anchors);
    expect(h1.length).toBe(anchors.length - 1);
    expect(h2.length).toBe(anchors.length - 1);
  });
});

describe('proportionsAlongBezierCurveForPoint', () => {
  it('finds the parameter of a point on a linear Bézier', () => {
    const roots = proportionsAlongBezierCurveForPoint(
      [1, 0, 0],
      [
        [0, 0, 0],
        [2, 0, 0],
      ],
    );
    expect(roots.length).toBe(1);
    expect(roots[0]).toBeCloseTo(0.5, 6);
  });

  it('returns no parameter for a point off the curve', () => {
    const roots = proportionsAlongBezierCurveForPoint(
      [1, 5, 0],
      [
        [0, 0, 0],
        [2, 0, 0],
      ],
    );
    expect(roots.length).toBe(0);
  });

  it('throws when shapes differ', () => {
    expect(() =>
      proportionsAlongBezierCurveForPoint(
        [1, 0],
        [
          [0, 0, 0],
          [2, 0, 0],
        ],
      ),
    ).toThrow();
  });
});

describe('pointLiesOnBezier', () => {
  const line: number[][] = [
    [0, 0, 0],
    [2, 0, 0],
  ];

  it('is true for a point on the curve', () => {
    expect(pointLiesOnBezier([1, 0, 0], line)).toBe(true);
  });

  it('is false for a point off the curve', () => {
    expect(pointLiesOnBezier([1, 5, 0], line)).toBe(false);
  });

  it('throws when shapes differ', () => {
    expect(() => pointLiesOnBezier([1, 0], line)).toThrow();
  });
});

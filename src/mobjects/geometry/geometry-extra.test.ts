import { describe, it, expect } from 'vitest';
import { Arrow, DoubleArrow, Vector } from './Arrow';
import { DashedLine } from './DashedLine';
import { DashedVMobject } from './DashedVMobject';
import { ArcBetweenPoints } from './ArcBetweenPoints';
import { CubicBezier } from './CubicBezier';
import { Circle } from './Circle';
import { BLUE } from '../../constants';

// ---------------------------------------------------------------------------
// Arrow
// ---------------------------------------------------------------------------
describe('Arrow', () => {
  it('constructs with default options', () => {
    const a = new Arrow();
    expect(a.getStart()).toEqual([0, 0, 0]);
    expect(a.getEnd()).toEqual([1, 0, 0]);
    expect(a.getTipLength()).toBe(0.25);
    expect(a.getTipWidth()).toBe(0.15);
  });

  it('constructs with custom start/end', () => {
    const a = new Arrow({ start: [1, 2, 0], end: [4, 6, 0] });
    expect(a.getStart()).toEqual([1, 2, 0]);
    expect(a.getEnd()).toEqual([4, 6, 0]);
  });

  it('getLength returns Euclidean distance', () => {
    const a = new Arrow({ start: [0, 0, 0], end: [3, 4, 0] });
    expect(a.getLength()).toBeCloseTo(5, 10);
  });

  it('getDirection returns normalized direction', () => {
    const a = new Arrow({ start: [0, 0, 0], end: [3, 4, 0] });
    const dir = a.getDirection();
    expect(dir[0]).toBeCloseTo(3 / 5, 10);
    expect(dir[1]).toBeCloseTo(4 / 5, 10);
    expect(dir[2]).toBeCloseTo(0, 10);
  });

  it('getDirection returns [1,0,0] for zero-length arrow', () => {
    const a = new Arrow({ start: [1, 1, 0], end: [1, 1, 0] });
    expect(a.getDirection()).toEqual([1, 0, 0]);
  });

  it('getAngle returns correct XY plane angle', () => {
    const a = new Arrow({ start: [0, 0, 0], end: [0, 1, 0] });
    expect(a.getAngle()).toBeCloseTo(Math.PI / 2, 10);
  });

  it('setStart updates start and returns this', () => {
    const a = new Arrow();
    const ret = a.setStart([5, 5, 0]);
    expect(ret).toBe(a);
    expect(a.getStart()).toEqual([5, 5, 0]);
  });

  it('setEnd updates end', () => {
    const a = new Arrow();
    a.setEnd([10, 0, 0]);
    expect(a.getEnd()).toEqual([10, 0, 0]);
    expect(a.getLength()).toBeCloseTo(10, 10);
  });

  it('setTipLength / setTipWidth update tip dimensions', () => {
    const a = new Arrow();
    a.setTipLength(0.5);
    a.setTipWidth(0.3);
    expect(a.getTipLength()).toBe(0.5);
    expect(a.getTipWidth()).toBe(0.3);
  });

  it('returns defensive copies (no aliasing)', () => {
    const a = new Arrow({ start: [1, 2, 3], end: [4, 5, 6] });
    const s = a.getStart();
    s[0] = 999;
    expect(a.getStart()[0]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// DoubleArrow
// ---------------------------------------------------------------------------
describe('DoubleArrow', () => {
  it('constructs with default options', () => {
    const da = new DoubleArrow();
    expect(da.getStart()).toEqual([0, 0, 0]);
    expect(da.getEnd()).toEqual([1, 0, 0]);
  });

  it('getLength is correct', () => {
    const da = new DoubleArrow({ start: [0, 0, 0], end: [0, 5, 0] });
    expect(da.getLength()).toBeCloseTo(5, 10);
  });

  it('setStart / setEnd update endpoints', () => {
    const da = new DoubleArrow();
    da.setStart([-1, -1, 0]);
    da.setEnd([1, 1, 0]);
    expect(da.getStart()).toEqual([-1, -1, 0]);
    expect(da.getEnd()).toEqual([1, 1, 0]);
  });
});

// ---------------------------------------------------------------------------
// Vector
// ---------------------------------------------------------------------------
describe('Vector', () => {
  it('always starts from origin', () => {
    const v = new Vector({ direction: [3, 4, 0] });
    expect(v.getStart()).toEqual([0, 0, 0]);
    expect(v.getEnd()).toEqual([3, 4, 0]);
  });

  it('uses end if direction not provided', () => {
    const v = new Vector({ end: [2, 0, 0] });
    expect(v.getEnd()).toEqual([2, 0, 0]);
  });

  it('defaults to [1,0,0]', () => {
    const v = new Vector();
    expect(v.getEnd()).toEqual([1, 0, 0]);
  });

  it('is an Arrow', () => {
    expect(new Vector()).toBeInstanceOf(Arrow);
  });
});

// ---------------------------------------------------------------------------
// DashedLine
// ---------------------------------------------------------------------------
describe('DashedLine', () => {
  it('constructs with default options', () => {
    const dl = new DashedLine();
    expect(dl.getStart()).toEqual([0, 0, 0]);
    expect(dl.getEnd()).toEqual([1, 0, 0]);
    expect(dl.getDashLength()).toBe(0.1);
    expect(dl.getDashRatio()).toBe(0.5);
    expect(dl.color).toBe(BLUE);
  });

  it('produces dashes for a line of length 1 with default options', () => {
    const dl = new DashedLine();
    // total length=1, dashLength=0.1, dashRatio=0.5
    // dash=0.05, gap=0.05, cycle=0.1 => 10 full cycles
    // The loop starts at 0 and adds a dash whenever currentPos < totalLength,
    // which includes one extra partial-cycle at position 1.0.
    const dashes = dl.getDashes();
    expect(dashes.length).toBe(11);
  });

  it('getLength returns line length', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [3, 4, 0] });
    expect(dl.getLength()).toBeCloseTo(5, 10);
  });

  it('setStart / setEnd update endpoints', () => {
    const dl = new DashedLine();
    dl.setStart([-2, 0, 0]);
    expect(dl.getStart()).toEqual([-2, 0, 0]);
    dl.setEnd([2, 0, 0]);
    expect(dl.getEnd()).toEqual([2, 0, 0]);
    expect(dl.getLength()).toBeCloseTo(4, 10);
  });

  it('setDashLength / setDashRatio update and regenerate', () => {
    const dl = new DashedLine();
    dl.setDashLength(0.2);
    expect(dl.getDashLength()).toBe(0.2);
    dl.setDashRatio(0.8);
    expect(dl.getDashRatio()).toBe(0.8);
  });

  it('clamps dashRatio to [0, 1]', () => {
    const dl = new DashedLine({ dashRatio: 2 });
    expect(dl.getDashRatio()).toBe(1);
    const dl2 = new DashedLine({ dashRatio: -1 });
    expect(dl2.getDashRatio()).toBe(0);
  });

  it('handles degenerate (zero-length) line', () => {
    const dl = new DashedLine({ start: [1, 1, 0], end: [1, 1, 0] });
    expect(dl.getDashes().length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DashedVMobject
// ---------------------------------------------------------------------------
describe('DashedVMobject', () => {
  it('constructs with a circle source', () => {
    const circle = new Circle({ radius: 1 });
    const dashed = new DashedVMobject({ vmobject: circle });
    expect(dashed.getNumDashes()).toBe(15);
    expect(dashed.getDashRatio()).toBe(0.5);
    expect(dashed.getSourceVMobject()).toBe(circle);
  });

  it('creates dashes from a circle', () => {
    const circle = new Circle({ radius: 1 });
    const dashed = new DashedVMobject({ vmobject: circle });
    const dashes = dashed.getDashes();
    // Should have up to numDashes dashes
    expect(dashes.length).toBeGreaterThan(0);
    expect(dashes.length).toBeLessThanOrEqual(15);
  });

  it('setNumDashes updates and regenerates', () => {
    const circle = new Circle({ radius: 1 });
    const dashed = new DashedVMobject({ vmobject: circle });
    dashed.setNumDashes(5);
    expect(dashed.getNumDashes()).toBe(5);
  });

  it('setDashRatio clamps to [0, 1]', () => {
    const circle = new Circle({ radius: 1 });
    const dashed = new DashedVMobject({ vmobject: circle });
    dashed.setDashRatio(2);
    expect(dashed.getDashRatio()).toBe(1);
    dashed.setDashRatio(-0.5);
    expect(dashed.getDashRatio()).toBe(0);
  });

  it('numDashes floors to at least 1', () => {
    const circle = new Circle({ radius: 1 });
    const dashed = new DashedVMobject({ vmobject: circle, numDashes: 0.5 });
    expect(dashed.getNumDashes()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// ArcBetweenPoints
// ---------------------------------------------------------------------------
describe('ArcBetweenPoints', () => {
  it('constructs with start, end, and default angle', () => {
    const abp = new ArcBetweenPoints({
      start: [-1, 0, 0],
      end: [1, 0, 0],
    });
    expect(abp.getStartPoint()).toEqual([-1, 0, 0]);
    expect(abp.getEndPoint()).toEqual([1, 0, 0]);
  });

  it('semicircle endpoints are correct', () => {
    const abp = new ArcBetweenPoints({
      start: [0, 0, 0],
      end: [2, 0, 0],
      angle: Math.PI,
    });
    const s = abp.getStartPoint();
    const e = abp.getEndPoint();
    expect(s[0]).toBeCloseTo(0, 5);
    expect(s[1]).toBeCloseTo(0, 5);
    expect(e[0]).toBeCloseTo(2, 5);
    expect(e[1]).toBeCloseTo(0, 5);
  });

  it('defaults to PI/2 angle', () => {
    const abp = new ArcBetweenPoints({
      start: [-1, 0, 0],
      end: [1, 0, 0],
    });
    // The arc angle is PI/2 by default
    expect(abp.getAngle()).toBeCloseTo(Math.PI / 2, 10);
  });

  it('has correct color defaults', () => {
    const abp = new ArcBetweenPoints({
      start: [0, 0, 0],
      end: [1, 0, 0],
    });
    expect(abp.color).toBe(BLUE);
  });
});

// ---------------------------------------------------------------------------
// CubicBezier
// ---------------------------------------------------------------------------
describe('CubicBezier', () => {
  const pts: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] = [
    [0, 0, 0],
    [1, 1, 0],
    [2, -1, 0],
    [3, 0, 0],
  ];

  it('constructs and stores control points', () => {
    const cb = new CubicBezier({ points: pts });
    const cp = cb.getControlPoints();
    expect(cp[0]).toEqual([0, 0, 0]);
    expect(cp[3]).toEqual([3, 0, 0]);
  });

  it('getStart / getEnd return first and last control points', () => {
    const cb = new CubicBezier({ points: pts });
    expect(cb.getStart()).toEqual([0, 0, 0]);
    expect(cb.getEnd()).toEqual([3, 0, 0]);
  });

  it('pointAtT(0) returns start, pointAtT(1) returns end', () => {
    const cb = new CubicBezier({ points: pts });
    const start = cb.pointAtT(0);
    const end = cb.pointAtT(1);
    expect(start[0]).toBeCloseTo(0, 10);
    expect(start[1]).toBeCloseTo(0, 10);
    expect(end[0]).toBeCloseTo(3, 10);
    expect(end[1]).toBeCloseTo(0, 10);
  });

  it('pointAtT(0.5) is the midpoint of the Bezier', () => {
    // For a straight line Bezier: [0,0,0],[1,0,0],[2,0,0],[3,0,0]
    const straight = new CubicBezier({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ],
    });
    const mid = straight.pointAtT(0.5);
    expect(mid[0]).toBeCloseTo(1.5, 10);
    expect(mid[1]).toBeCloseTo(0, 10);
  });

  it('tangentAtT returns tangent vector', () => {
    // Straight line: tangent should be constant [3, 0, 0] direction
    const straight = new CubicBezier({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ],
    });
    const t = straight.tangentAtT(0);
    expect(t[0]).toBeCloseTo(3, 10);
    expect(t[1]).toBeCloseTo(0, 10);
  });

  it('normalizedTangentAtT returns unit vector', () => {
    const cb = new CubicBezier({ points: pts });
    const nt = cb.normalizedTangentAtT(0.5);
    const len = Math.sqrt(nt[0] ** 2 + nt[1] ** 2 + nt[2] ** 2);
    expect(len).toBeCloseTo(1, 10);
  });

  it('normalAtT is perpendicular to tangent', () => {
    const cb = new CubicBezier({ points: pts });
    const tangent = cb.normalizedTangentAtT(0.5);
    const normal = cb.normalAtT(0.5);
    const dot = tangent[0] * normal[0] + tangent[1] * normal[1];
    expect(dot).toBeCloseTo(0, 10);
  });

  it('curvatureAtT returns zero for a straight line', () => {
    const straight = new CubicBezier({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ],
    });
    expect(straight.curvatureAtT(0.5)).toBeCloseTo(0, 10);
  });

  it('getApproximateLength for straight line equals 3', () => {
    const straight = new CubicBezier({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ],
    });
    expect(straight.getApproximateLength()).toBeCloseTo(3, 5);
  });

  it('splitAtT produces two curves that meet at the split point', () => {
    const cb = new CubicBezier({ points: pts });
    const [left, right] = cb.splitAtT(0.5);
    const leftEnd = left.getEnd();
    const rightStart = right.getStart();
    expect(leftEnd[0]).toBeCloseTo(rightStart[0], 10);
    expect(leftEnd[1]).toBeCloseTo(rightStart[1], 10);
    expect(leftEnd[2]).toBeCloseTo(rightStart[2], 10);
  });

  it('splitAtT(0.5) split point equals pointAtT(0.5)', () => {
    const cb = new CubicBezier({ points: pts });
    const splitPoint = cb.pointAtT(0.5);
    const [left] = cb.splitAtT(0.5);
    const leftEnd = left.getEnd();
    expect(leftEnd[0]).toBeCloseTo(splitPoint[0], 10);
    expect(leftEnd[1]).toBeCloseTo(splitPoint[1], 10);
  });

  it('setControlPoints updates points', () => {
    const cb = new CubicBezier({ points: pts });
    const newPts: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ] = [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ];
    cb.setControlPoints(newPts);
    expect(cb.getControlPoints()[1]).toEqual([0, 1, 0]);
  });

  it('setControlPoint updates single point', () => {
    const cb = new CubicBezier({ points: pts });
    cb.setControlPoint(2, [5, 5, 0]);
    expect(cb.getControlPoint(2)).toEqual([5, 5, 0]);
  });

  it('defaults to BLUE color', () => {
    const cb = new CubicBezier({ points: pts });
    expect(cb.color).toBe(BLUE);
  });

  it('returns defensive copies of control points', () => {
    const cb = new CubicBezier({ points: pts });
    const cp = cb.getControlPoints();
    cp[0][0] = 999;
    expect(cb.getControlPoints()[0][0]).toBe(0);
  });
});

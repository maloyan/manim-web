import { describe, it, expect } from 'vitest';
import { Arrow, DoubleArrow, Vector } from './Arrow';
import { DashedLine } from './DashedLine';
import { DashedVMobject } from './DashedVMobject';
import { ArcBetweenPoints } from './ArcBetweenPoints';
import { CubicBezier } from './CubicBezier';
import { Circle } from './Circle';
import { Dot, SmallDot, LargeDot } from './Dot';
import { Line } from './Line';
import { BLUE, WHITE } from '../../constants';

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

// ---------------------------------------------------------------------------
// Dot - coverage for getPoint, setPoint, _createCopy
// ---------------------------------------------------------------------------
describe('Dot', () => {
  it('constructs with default options', () => {
    const d = new Dot();
    expect(d.getPoint()).toEqual([0, 0, 0]);
    expect(d.getRadius()).toBe(0.08);
    expect(d.color).toBe(WHITE);
    expect(d.fillOpacity).toBe(1);
    expect(d.strokeWidth).toBe(0);
  });

  it('constructs with custom point and color', () => {
    const d = new Dot({ point: [3, 4, 0], color: '#ff0000', radius: 0.2 });
    expect(d.getPoint()).toEqual([3, 4, 0]);
    expect(d.color).toBe('#ff0000');
    expect(d.getRadius()).toBe(0.2);
  });

  it('getPoint returns a defensive copy', () => {
    const d = new Dot({ point: [1, 2, 3] });
    const p = d.getPoint();
    p[0] = 999;
    expect(d.getPoint()[0]).toBe(1);
  });

  it('setPoint updates position (alias for moveTo)', () => {
    const d = new Dot();
    const ret = d.setPoint([5, 6, 7]);
    expect(ret).toBe(d);
    expect(d.getPoint()).toEqual([5, 6, 7]);
  });

  it('moveTo updates position', () => {
    const d = new Dot({ point: [0, 0, 0] });
    d.moveTo([10, 20, 30]);
    expect(d.getPoint()).toEqual([10, 20, 30]);
  });

  it('shift updates the point position', () => {
    const d = new Dot({ point: [1, 1, 1] });
    d.shift([2, 3, 4]);
    expect(d.getPoint()).toEqual([3, 4, 5]);
  });

  it('copy creates an independent clone with same properties', () => {
    const d = new Dot({ point: [1, 2, 0], color: '#00ff00', radius: 0.15, fillOpacity: 0.8 });
    const c = d.copy() as Dot;
    expect(c).toBeInstanceOf(Dot);
    expect(c.getPoint()).toEqual([1, 2, 0]);
    expect(c.color).toBe('#00ff00');
    expect(c.getRadius()).toBe(0.15);
    expect(c.fillOpacity).toBe(0.8);
    // Mutating the copy does not affect original
    c.setPoint([99, 99, 99]);
    expect(d.getPoint()).toEqual([1, 2, 0]);
  });

  it('handles nested array point (Python-style)', () => {
    // This tests the Array.isArray(rawPoint[0]) branch
    const d = new Dot({
      point: [[5, 6, 7] as unknown as number] as unknown as [number, number, number],
    });
    expect(d.getPoint()).toEqual([5, 6, 7]);
  });
});

// ---------------------------------------------------------------------------
// SmallDot - coverage for construction and _createCopy
// ---------------------------------------------------------------------------
describe('SmallDot', () => {
  it('constructs with radius 0.04', () => {
    const sd = new SmallDot();
    expect(sd.getRadius()).toBe(0.04);
    expect(sd).toBeInstanceOf(Dot);
  });

  it('constructs with custom point and color', () => {
    const sd = new SmallDot({ point: [1, 0, 0], color: '#0000ff' });
    expect(sd.getPoint()).toEqual([1, 0, 0]);
    expect(sd.color).toBe('#0000ff');
    expect(sd.getRadius()).toBe(0.04);
  });

  it('copy creates a SmallDot with same properties', () => {
    const sd = new SmallDot({ point: [2, 3, 0], color: '#ff00ff', fillOpacity: 0.5 });
    const c = sd.copy() as SmallDot;
    expect(c).toBeInstanceOf(SmallDot);
    expect(c.getPoint()).toEqual([2, 3, 0]);
    expect(c.color).toBe('#ff00ff');
    expect(c.fillOpacity).toBe(0.5);
    expect(c.getRadius()).toBe(0.04);
  });
});

// ---------------------------------------------------------------------------
// LargeDot - coverage for construction and _createCopy
// ---------------------------------------------------------------------------
describe('LargeDot', () => {
  it('constructs with radius 0.16', () => {
    const ld = new LargeDot();
    expect(ld.getRadius()).toBe(0.16);
    expect(ld).toBeInstanceOf(Dot);
  });

  it('constructs with custom point and color', () => {
    const ld = new LargeDot({ point: [0, 1, 0], color: '#00ffff' });
    expect(ld.getPoint()).toEqual([0, 1, 0]);
    expect(ld.color).toBe('#00ffff');
    expect(ld.getRadius()).toBe(0.16);
  });

  it('copy creates a LargeDot with same properties', () => {
    const ld = new LargeDot({
      point: [4, 5, 0],
      color: '#ffff00',
      fillOpacity: 0.9,
      strokeWidth: 2,
    });
    const c = ld.copy() as LargeDot;
    expect(c).toBeInstanceOf(LargeDot);
    expect(c.getPoint()).toEqual([4, 5, 0]);
    expect(c.color).toBe('#ffff00');
    expect(c.fillOpacity).toBe(0.9);
    expect(c.strokeWidth).toBe(2);
    expect(c.getRadius()).toBe(0.16);
  });
});

// ---------------------------------------------------------------------------
// Line - coverage for constructor, getters, setters, and _createCopy
// ---------------------------------------------------------------------------
describe('Line', () => {
  it('constructs with default options', () => {
    const l = new Line();
    expect(l.getStart()).toEqual([0, 0, 0]);
    expect(l.getEnd()).toEqual([1, 0, 0]);
    expect(l.color).toBe(WHITE);
    expect(l.strokeWidth).toBe(3);
    expect(l.fillOpacity).toBe(0);
  });

  it('constructs with custom start and end', () => {
    const l = new Line({ start: [-1, -1, 0], end: [2, 3, 0] });
    expect(l.getStart()).toEqual([-1, -1, 0]);
    expect(l.getEnd()).toEqual([2, 3, 0]);
  });

  it('constructs with custom color and strokeWidth', () => {
    const l = new Line({ color: '#ff0000', strokeWidth: 8 });
    expect(l.color).toBe('#ff0000');
    expect(l.strokeWidth).toBe(8);
  });

  it('getLength returns Euclidean distance', () => {
    const l = new Line({ start: [0, 0, 0], end: [3, 4, 0] });
    expect(l.getLength()).toBeCloseTo(5, 10);
  });

  it('getLength returns 0 for zero-length line', () => {
    const l = new Line({ start: [1, 1, 0], end: [1, 1, 0] });
    expect(l.getLength()).toBeCloseTo(0, 10);
  });

  it('getLength works with 3D diagonal', () => {
    const l = new Line({ start: [0, 0, 0], end: [1, 1, 1] });
    expect(l.getLength()).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('getMidpoint returns the center of the line', () => {
    const l = new Line({ start: [0, 0, 0], end: [4, 6, 2] });
    expect(l.getMidpoint()).toEqual([2, 3, 1]);
  });

  it('getMidpoint returns start/end for zero-length line', () => {
    const l = new Line({ start: [5, 5, 5], end: [5, 5, 5] });
    expect(l.getMidpoint()).toEqual([5, 5, 5]);
  });

  it('getDirection returns normalized direction', () => {
    const l = new Line({ start: [0, 0, 0], end: [3, 4, 0] });
    const dir = l.getDirection();
    expect(dir[0]).toBeCloseTo(0.6, 10);
    expect(dir[1]).toBeCloseTo(0.8, 10);
    expect(dir[2]).toBeCloseTo(0, 10);
  });

  it('getDirection returns [1,0,0] for zero-length line', () => {
    const l = new Line({ start: [1, 1, 0], end: [1, 1, 0] });
    expect(l.getDirection()).toEqual([1, 0, 0]);
  });

  it('getAngle returns correct XY plane angle', () => {
    // Horizontal right
    const l1 = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    expect(l1.getAngle()).toBeCloseTo(0, 10);

    // Vertical up
    const l2 = new Line({ start: [0, 0, 0], end: [0, 1, 0] });
    expect(l2.getAngle()).toBeCloseTo(Math.PI / 2, 10);

    // 45 degrees
    const l3 = new Line({ start: [0, 0, 0], end: [1, 1, 0] });
    expect(l3.getAngle()).toBeCloseTo(Math.PI / 4, 10);

    // Horizontal left
    const l4 = new Line({ start: [0, 0, 0], end: [-1, 0, 0] });
    expect(l4.getAngle()).toBeCloseTo(Math.PI, 10);
  });

  it('setStart updates start and regenerates points', () => {
    const l = new Line();
    const ret = l.setStart([5, 5, 0]);
    expect(ret).toBe(l);
    expect(l.getStart()).toEqual([5, 5, 0]);
  });

  it('setEnd updates end and regenerates points', () => {
    const l = new Line();
    const ret = l.setEnd([10, 0, 0]);
    expect(ret).toBe(l);
    expect(l.getEnd()).toEqual([10, 0, 0]);
    expect(l.getLength()).toBeCloseTo(10, 10);
  });

  it('pointAlongPath returns correct interpolated points', () => {
    const l = new Line({ start: [0, 0, 0], end: [10, 0, 0] });
    const p0 = l.pointAlongPath(0);
    expect(p0).toEqual([0, 0, 0]);
    const p1 = l.pointAlongPath(1);
    expect(p1).toEqual([10, 0, 0]);
    const pHalf = l.pointAlongPath(0.5);
    expect(pHalf).toEqual([5, 0, 0]);
    const pQuarter = l.pointAlongPath(0.25);
    expect(pQuarter).toEqual([2.5, 0, 0]);
  });

  it('pointAlongPath works with diagonal line', () => {
    const l = new Line({ start: [0, 0, 0], end: [4, 6, 2] });
    const mid = l.pointAlongPath(0.5);
    expect(mid[0]).toBeCloseTo(2, 10);
    expect(mid[1]).toBeCloseTo(3, 10);
    expect(mid[2]).toBeCloseTo(1, 10);
  });

  it('copy creates an independent clone', () => {
    const l = new Line({ start: [1, 2, 0], end: [3, 4, 0], color: '#abcdef', strokeWidth: 5 });
    const c = l.copy() as Line;
    expect(c).toBeInstanceOf(Line);
    expect(c.getStart()).toEqual([1, 2, 0]);
    expect(c.getEnd()).toEqual([3, 4, 0]);
    expect(c.color).toBe('#abcdef');
    expect(c.strokeWidth).toBe(5);
    // Mutating the copy does not affect original
    c.setStart([99, 99, 0]);
    expect(l.getStart()).toEqual([1, 2, 0]);
  });

  it('getStart/getEnd return from _points3D when available', () => {
    // After construction, _points3D should have 4 points
    const l = new Line({ start: [1, 2, 0], end: [3, 4, 0] });
    // getStart should read from _points3D[0]
    const s = l.getStart();
    expect(s[0]).toBeCloseTo(1, 5);
    expect(s[1]).toBeCloseTo(2, 5);
    // getEnd should read from _points3D[last]
    const e = l.getEnd();
    expect(e[0]).toBeCloseTo(3, 5);
    expect(e[1]).toBeCloseTo(4, 5);
  });

  it('getStart/getEnd fall back to stored values when points are cleared', () => {
    const l = new Line({ start: [1, 2, 0], end: [3, 4, 0] });
    // Clear internal points to trigger fallback branch
    l.clearPoints();
    expect(l.getStart()).toEqual([1, 2, 0]);
    expect(l.getEnd()).toEqual([3, 4, 0]);
  });
});

// ---------------------------------------------------------------------------
// DashedLine - coverage for setColor, setStrokeWidth, setOpacity, _createCopy
// ---------------------------------------------------------------------------
describe('DashedLine - propagation and copy', () => {
  it('setColor propagates to all dash children', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [2, 0, 0] });
    const dashes = dl.getDashes();
    expect(dashes.length).toBeGreaterThan(0);

    dl.setColor('#ff0000');
    expect(dl.color).toBe('#ff0000');
    for (const dash of dl.getDashes()) {
      expect(dash.color).toBe('#ff0000');
    }
  });

  it('setStrokeWidth propagates to all dash children', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [2, 0, 0] });
    dl.setStrokeWidth(10);
    expect(dl.strokeWidth).toBe(10);
    for (const dash of dl.getDashes()) {
      expect(dash.strokeWidth).toBe(10);
    }
  });

  it('setOpacity propagates to all dash children', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [2, 0, 0] });
    dl.setOpacity(0.3);
    expect(dl.opacity).toBeCloseTo(0.3, 10);
    for (const dash of dl.getDashes()) {
      expect(dash.opacity).toBeCloseTo(0.3, 10);
    }
  });

  it('setColor returns this for chaining', () => {
    const dl = new DashedLine();
    const ret = dl.setColor('#00ff00');
    expect(ret).toBe(dl);
  });

  it('setStrokeWidth returns this for chaining', () => {
    const dl = new DashedLine();
    const ret = dl.setStrokeWidth(5);
    expect(ret).toBe(dl);
  });

  it('setOpacity returns this for chaining', () => {
    const dl = new DashedLine();
    const ret = dl.setOpacity(0.5);
    expect(ret).toBe(dl);
  });

  it('copy creates an independent clone with same properties', () => {
    const dl = new DashedLine({
      start: [1, 0, 0],
      end: [5, 0, 0],
      dashLength: 0.2,
      dashRatio: 0.7,
      color: '#123456',
      strokeWidth: 6,
    });
    const c = dl.copy() as DashedLine;
    expect(c).toBeInstanceOf(DashedLine);
    expect(c.getStart()).toEqual([1, 0, 0]);
    expect(c.getEnd()).toEqual([5, 0, 0]);
    expect(c.getDashLength()).toBe(0.2);
    expect(c.getDashRatio()).toBe(0.7);
    expect(c.color).toBe('#123456');
    expect(c.strokeWidth).toBe(6);
    // Mutating the copy does not affect original
    c.setStart([99, 0, 0]);
    expect(dl.getStart()).toEqual([1, 0, 0]);
  });

  it('copy produces dashes in the clone', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [3, 0, 0] });
    const c = dl.copy() as DashedLine;
    expect(c.getDashes().length).toBeGreaterThan(0);
  });
});

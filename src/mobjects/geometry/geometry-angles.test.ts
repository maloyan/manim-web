import { describe, it, expect } from 'vitest';
import { Angle, RightAngle, Elbow, TangentLine } from './AngleShapes';
import { Line } from './Line';
import { Circle } from './Circle';
import { VMobject } from '../../core/VMobject';
import { WHITE, BLUE } from '../../constants';

// ---------------------------------------------------------------------------
// Angle
// ---------------------------------------------------------------------------
const PTS_90: [[number, number, number], [number, number, number], [number, number, number]] = [
  [1, 0, 0],
  [0, 0, 0],
  [0, 1, 0],
];
const PTS_90_REV: typeof PTS_90 = [
  [0, 1, 0],
  [0, 0, 0],
  [1, 0, 0],
];

describe('Angle', () => {
  it('constructs from three points', () => {
    const a = new Angle({
      points: [
        [2, 0, 0],
        [0, 0, 0],
        [0, 2, 0],
      ],
    });
    expect(a).toBeDefined();
    expect(a.getPoints().length).toBeGreaterThan(0);
  });

  it('constructs from two lines', () => {
    const l1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const l2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
    const a = new Angle({ line1: l1, line2: l2 });
    expect(a.getPoints().length).toBeGreaterThan(0);
  });

  it('default radius is 0.5 and color is WHITE', () => {
    const a = new Angle({ points: PTS_90 });
    expect(a.getRadius()).toBe(0.5);
    expect(a.color).toBe(WHITE);
  });

  it('custom radius is applied', () => {
    const a = new Angle({ points: PTS_90 }, { radius: 1.5 });
    expect(a.getRadius()).toBe(1.5);
  });

  it('getVertex returns the middle point', () => {
    const a = new Angle({
      points: [
        [3, 0, 0],
        [1, 1, 0],
        [0, 3, 0],
      ],
    });
    expect(a.getVertex()).toEqual([1, 1, 0]);
  });

  it('getAngleValue / getAngleValueDegrees for 90 degrees', () => {
    const a = new Angle({ points: PTS_90 });
    expect(a.getAngleValue()).toBeCloseTo(Math.PI / 2, 5);
    expect(a.getAngleValueDegrees()).toBeCloseTo(90, 3);
  });

  it('setRadius regenerates points', () => {
    const a = new Angle({ points: PTS_90 });
    const n = a.getPoints().length;
    a.setRadius(2);
    expect(a.getRadius()).toBe(2);
    expect(a.getPoints().length).toBe(n);
  });

  it('getLabel returns null when showValue is false', () => {
    expect(new Angle({ points: PTS_90 }).getLabel()).toBeNull();
  });

  it('getLabel returns value string when showValue is true (radians)', () => {
    const label = new Angle({ points: PTS_90 }, { showValue: true }).getLabel();
    expect(label).toContain('1.57');
  });

  it('getLabel returns value with degree symbol when unit is degrees', () => {
    const label = new Angle({ points: PTS_90 }, { showValue: true, unit: 'degrees' }).getLabel()!;
    expect(label).toContain('90');
    expect(label).toContain('\u00B0');
  });

  it('setLabel sets a custom label', () => {
    const a = new Angle({ points: PTS_90 });
    a.setLabel('alpha');
    expect(a.getLabel()).toBe('alpha');
  });

  it('pointFromProportion returns start/end of arc', () => {
    const a = new Angle({ points: PTS_90 }, { radius: 1 });
    const start = a.pointFromProportion(0);
    expect(start[0]).toBeCloseTo(1, 3);
    expect(start[1]).toBeCloseTo(0, 3);
    const end = a.pointFromProportion(1);
    expect(end[0]).toBeCloseTo(0, 3);
    expect(end[1]).toBeCloseTo(1, 3);
  });

  it('getArcMidpoint returns midpoint of the arc', () => {
    const mid = new Angle({ points: PTS_90 }, { radius: 1 }).getArcMidpoint();
    const expected = Math.SQRT2 / 2;
    expect(mid[0]).toBeCloseTo(expected, 3);
    expect(mid[1]).toBeCloseTo(expected, 3);
  });

  it('otherAngle gives the reflex angle', () => {
    const a = new Angle({ points: PTS_90 }, { otherAngle: true });
    expect(a.getAngleValue()).toBeCloseTo((3 * Math.PI) / 2, 3);
  });

  it('normalizes negative deltaAngle to CCW', () => {
    const a = new Angle({ points: PTS_90_REV });
    expect(a.getAngleValue()).toBeCloseTo((3 * Math.PI) / 2, 3);
  });

  it('line vertex detection: d2 min (line1Start near line2End)', () => {
    const l1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const l2 = new Line({ start: [0, 2, 0], end: [0, 0, 0] });
    const a = new Angle({ line1: l1, line2: l2 });
    expect(a.getVertex()).toEqual([0, 0, 0]);
  });

  it('line vertex detection: d3 min (line1End near line2Start)', () => {
    const l1 = new Line({ start: [2, 0, 0], end: [0, 0, 0] });
    const l2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
    expect(new Angle({ line1: l1, line2: l2 }).getVertex()).toEqual([0, 0, 0]);
  });

  it('line vertex detection: d4 min (line1End near line2End)', () => {
    const l1 = new Line({ start: [2, 0, 0], end: [0, 0, 0] });
    const l2 = new Line({ start: [0, 2, 0], end: [0, 0, 0] });
    expect(new Angle({ line1: l1, line2: l2 }).getVertex()).toEqual([0, 0, 0]);
  });

  it('quadrant 1: negative delta flips, positive passes through', () => {
    const neg = new Angle({ points: PTS_90_REV }, { quadrant: 1 });
    expect(neg.getAngleValue()).toBeGreaterThan(0);
    const pos = new Angle({ points: PTS_90 }, { quadrant: 1 });
    expect(pos.getAngleValue()).toBeCloseTo(Math.PI / 2, 3);
  });

  it('quadrant 2: positive adjusts, negative passes through', () => {
    expect(new Angle({ points: PTS_90 }, { quadrant: 2 }).getPoints().length).toBeGreaterThan(0);
    expect(new Angle({ points: PTS_90_REV }, { quadrant: 2 }).getPoints().length).toBeGreaterThan(
      0,
    );
  });

  it('quadrant 3: positive adjusts, negative passes through', () => {
    expect(new Angle({ points: PTS_90 }, { quadrant: 3 }).getPoints().length).toBeGreaterThan(0);
    expect(new Angle({ points: PTS_90_REV }, { quadrant: 3 }).getPoints().length).toBeGreaterThan(
      0,
    );
  });

  it('quadrant 4: negative adjusts, positive passes through', () => {
    expect(new Angle({ points: PTS_90_REV }, { quadrant: 4 }).getPoints().length).toBeGreaterThan(
      0,
    );
    expect(new Angle({ points: PTS_90 }, { quadrant: 4 }).getPoints().length).toBeGreaterThan(0);
  });

  it('_createCopy produces an equivalent Angle', () => {
    const a = new Angle({ points: PTS_90 }, { radius: 0.8 });
    const copy = a.copy();
    expect(copy.getRadius()).toBe(0.8);
    expect(copy.getPoints().length).toBe(a.getPoints().length);
  });
});

// ---------------------------------------------------------------------------
// RightAngle
// ---------------------------------------------------------------------------
describe('RightAngle', () => {
  it('constructs from three points', () => {
    const ra = new RightAngle({ points: PTS_90 });
    expect(ra).toBeDefined();
    expect(ra.getPoints().length).toBeGreaterThan(0);
  });

  it('constructs from two lines', () => {
    const l1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const l2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
    expect(new RightAngle({ line1: l1, line2: l2 }).getPoints().length).toBeGreaterThan(0);
  });

  it('default size is 0.3 and color is BLUE', () => {
    const ra = new RightAngle({ points: PTS_90 });
    expect(ra.getSize()).toBe(0.3);
    expect(ra.color).toBe(BLUE);
  });

  it('custom size is applied', () => {
    expect(new RightAngle({ points: PTS_90 }, { size: 0.6 }).getSize()).toBe(0.6);
  });

  it('getVertex returns the vertex point', () => {
    expect(new RightAngle({ points: PTS_90 }).getVertex()).toEqual([0, 0, 0]);
  });

  it('setSize regenerates points', () => {
    const ra = new RightAngle({ points: PTS_90 });
    ra.setSize(0.5);
    expect(ra.getSize()).toBe(0.5);
    expect(ra.getPoints().length).toBeGreaterThan(0);
  });

  it('has 7 points (two line segments as cubic beziers)', () => {
    expect(new RightAngle({ points: PTS_90 }).getPoints().length).toBe(7);
  });

  it('copy creates equivalent right angle', () => {
    const copy = new RightAngle({ points: PTS_90 }, { size: 0.4 }).copy();
    expect(copy.getSize()).toBe(0.4);
  });

  it('line vertex detection: d2 min', () => {
    const l1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const l2 = new Line({ start: [0, 2, 0], end: [0, 0, 0] });
    expect(new RightAngle({ line1: l1, line2: l2 }).getVertex()).toEqual([0, 0, 0]);
  });

  it('line vertex detection: d3 min', () => {
    const l1 = new Line({ start: [2, 0, 0], end: [0, 0, 0] });
    const l2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
    expect(new RightAngle({ line1: l1, line2: l2 }).getVertex()).toEqual([0, 0, 0]);
  });

  it('line vertex detection: d4 min', () => {
    const l1 = new Line({ start: [2, 0, 0], end: [0, 0, 0] });
    const l2 = new Line({ start: [0, 2, 0], end: [0, 0, 0] });
    expect(new RightAngle({ line1: l1, line2: l2 }).getVertex()).toEqual([0, 0, 0]);
  });
});

// ---------------------------------------------------------------------------
// Elbow
// ---------------------------------------------------------------------------
describe('Elbow', () => {
  it('constructs with defaults', () => {
    const e = new Elbow();
    expect(e).toBeDefined();
    expect(e.getPoints().length).toBeGreaterThan(0);
  });

  it('default width, height, angle, and color', () => {
    const e = new Elbow();
    expect(e.getWidth()).toBe(1);
    expect(e.getHeight()).toBe(1);
    expect(e.getAngle()).toBe(0);
    expect(e.color).toBe(BLUE);
  });

  it('custom width/height/angle are applied', () => {
    const e = new Elbow({ width: 3, height: 2, angle: Math.PI / 4 });
    expect(e.getWidth()).toBe(3);
    expect(e.getHeight()).toBe(2);
    expect(e.getAngle()).toBeCloseTo(Math.PI / 4, 10);
  });

  it('setWidth / setHeight / setAngle regenerate points', () => {
    const e = new Elbow();
    e.setWidth(5);
    expect(e.getWidth()).toBe(5);
    expect(e.getPoints().length).toBeGreaterThan(0);
    e.setHeight(4);
    expect(e.getHeight()).toBe(4);
    e.setAngle(Math.PI / 3);
    expect(e.getAngle()).toBeCloseTo(Math.PI / 3, 10);
  });

  it('getCornerPosition / setCornerPosition', () => {
    const e = new Elbow();
    expect(e.getCornerPosition()).toEqual([0, 0, 0]);
    e.setCornerPosition([1, 2, 3]);
    expect(e.getCornerPosition()).toEqual([1, 2, 3]);
  });

  it('has 7 points (two line segments)', () => {
    expect(new Elbow().getPoints().length).toBe(7);
  });

  it('copy creates equivalent elbow', () => {
    const copy = new Elbow({ width: 2, height: 3, angle: 1 }).copy();
    expect(copy.getWidth()).toBe(2);
    expect(copy.getHeight()).toBe(3);
    expect(copy.getAngle()).toBeCloseTo(1, 10);
  });
});

// ---------------------------------------------------------------------------
// TangentLine
// ---------------------------------------------------------------------------
describe('TangentLine', () => {
  it('constructs on a circle', () => {
    const t = new TangentLine(new Circle({ radius: 2 }));
    expect(t).toBeDefined();
    expect(t.getPoints().length).toBeGreaterThan(0);
  });

  it('default t is 0.5, default length is 2', () => {
    const t = new TangentLine(new Circle());
    expect(t.getT()).toBe(0.5);
    expect(t.getLength()).toBe(2);
  });

  it('custom t and length are applied', () => {
    const t = new TangentLine(new Circle(), { t: 0.25, length: 4 });
    expect(t.getT()).toBe(0.25);
    expect(t.getLength()).toBe(4);
  });

  it('getTangentPoint is on the curve', () => {
    const pt = new TangentLine(new Circle({ radius: 2 }), { t: 0 }).getTangentPoint();
    expect(Math.sqrt(pt[0] ** 2 + pt[1] ** 2)).toBeCloseTo(2, 0);
  });

  it('tangent direction is a unit vector', () => {
    const dir = new TangentLine(new Circle()).getTangentDirection();
    expect(Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2)).toBeCloseTo(1, 5);
  });

  it('getStart and getEnd are length apart', () => {
    const t = new TangentLine(new Circle(), { length: 3 });
    const s = t.getStart();
    const e = t.getEnd();
    expect(Math.sqrt((e[0] - s[0]) ** 2 + (e[1] - s[1]) ** 2 + (e[2] - s[2]) ** 2)).toBeCloseTo(
      3,
      3,
    );
  });

  it('setT / setLength regenerate tangent', () => {
    const t = new TangentLine(new Circle());
    t.setT(0.75);
    expect(t.getT()).toBe(0.75);
    t.setLength(5);
    expect(t.getLength()).toBe(5);
  });

  it('t is clamped to [0, 1]', () => {
    expect(new TangentLine(new Circle(), { t: -0.5 }).getT()).toBe(0);
    expect(new TangentLine(new Circle(), { t: 1.5 }).getT()).toBe(1);
  });

  it('has 4 points (single cubic bezier segment)', () => {
    expect(new TangentLine(new Circle()).getPoints().length).toBe(4);
  });

  it('copy creates equivalent tangent line', () => {
    const copy = new TangentLine(new Circle(), { t: 0.3, length: 5 }).copy();
    expect(copy.getT()).toBe(0.3);
    expect(copy.getLength()).toBe(5);
  });

  it('update() regenerates points from current curve', () => {
    const t = new TangentLine(new Circle());
    const ptBefore = t.getTangentPoint();
    t.update();
    expect(t.getTangentPoint()).toEqual(ptBefore);
  });

  it('handles VMobject with fewer than 2 points (fallback)', () => {
    const t = new TangentLine(new VMobject());
    expect(t.getTangentPoint()).toEqual([0, 0, 0]);
    expect(t.getTangentDirection()).toEqual([1, 0, 0]);
    expect(t.getPoints().length).toBe(4);
  });

  it('handles VMobject with 2-3 points (linear interpolation)', () => {
    const vm = new VMobject();
    vm.setPoints3D([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    const t = new TangentLine(vm, { t: 0.5 });
    expect(t.getPoints().length).toBe(4);
    expect(t.getTangentPoint()[0]).toBeCloseTo(1, 1);
  });

  it('handles VMobject with 2-3 points at t=1 (end boundary)', () => {
    const vm = new VMobject();
    vm.setPoints3D([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    expect(new TangentLine(vm, { t: 1 }).getTangentPoint()[0]).toBeCloseTo(2, 1);
  });

  it('falls back to default direction when derivative is zero', () => {
    const vm = new VMobject();
    vm.setPoints3D([
      [1, 1, 0],
      [1, 1, 0],
      [1, 1, 0],
      [1, 1, 0],
    ]);
    expect(new TangentLine(vm, { t: 0.5 }).getTangentDirection()).toEqual([1, 0, 0]);
  });
});

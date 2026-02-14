import { describe, it, expect } from 'vitest';
import { Angle, RightAngle, Elbow, TangentLine } from './AngleShapes';
import { Line } from './Line';
import { Circle } from './Circle';
import { WHITE, BLUE } from '../../constants';

// ---------------------------------------------------------------------------
// AngleShapes
// ---------------------------------------------------------------------------

describe('Angle', () => {
  it('constructs from three points without throwing', () => {
    const angle = new Angle({
      points: [
        [2, 0, 0],
        [0, 0, 0],
        [0, 2, 0],
      ],
    });
    expect(angle).toBeDefined();
    expect(angle.getPoints().length).toBeGreaterThan(0);
  });

  it('constructs from two lines', () => {
    const l1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const l2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
    const angle = new Angle({ line1: l1, line2: l2 });
    expect(angle.getPoints().length).toBeGreaterThan(0);
  });

  it('default radius is 0.5', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(angle.getRadius()).toBe(0.5);
  });

  it('custom radius is applied', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { radius: 1.5 },
    );
    expect(angle.getRadius()).toBe(1.5);
  });

  it('default color is WHITE', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(angle.color).toBe(WHITE);
  });

  it('getVertex returns the middle point', () => {
    const angle = new Angle({
      points: [
        [3, 0, 0],
        [1, 1, 0],
        [0, 3, 0],
      ],
    });
    expect(angle.getVertex()).toEqual([1, 1, 0]);
  });

  it('getAngleValue returns 90 degrees for perpendicular lines', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(angle.getAngleValue()).toBeCloseTo(Math.PI / 2, 5);
  });

  it('getAngleValueDegrees returns 90 for perpendicular lines', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(angle.getAngleValueDegrees()).toBeCloseTo(90, 3);
  });

  it('setRadius regenerates points', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    const ptsBefore = angle.getPoints().length;
    angle.setRadius(2);
    expect(angle.getRadius()).toBe(2);
    expect(angle.getPoints().length).toBe(ptsBefore);
  });

  it('getLabel returns null when showValue is false', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(angle.getLabel()).toBeNull();
  });

  it('getLabel returns value string when showValue is true (radians)', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { showValue: true },
    );
    const label = angle.getLabel();
    expect(label).not.toBeNull();
    expect(label).toContain('1.57');
  });

  it('getLabel returns value with degree symbol when unit is degrees', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { showValue: true, unit: 'degrees' },
    );
    const label = angle.getLabel()!;
    expect(label).toContain('90');
    expect(label).toContain('\u00B0');
  });

  it('setLabel sets a custom label', () => {
    const angle = new Angle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    angle.setLabel('alpha');
    expect(angle.getLabel()).toBe('alpha');
  });

  it('pointFromProportion returns start/end of arc', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { radius: 1 },
    );
    const start = angle.pointFromProportion(0);
    expect(start[0]).toBeCloseTo(1, 3);
    expect(start[1]).toBeCloseTo(0, 3);

    const end = angle.pointFromProportion(1);
    expect(end[0]).toBeCloseTo(0, 3);
    expect(end[1]).toBeCloseTo(1, 3);
  });

  it('getArcMidpoint returns midpoint of the arc', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { radius: 1 },
    );
    const mid = angle.getArcMidpoint();
    const expected = Math.SQRT2 / 2;
    expect(mid[0]).toBeCloseTo(expected, 3);
    expect(mid[1]).toBeCloseTo(expected, 3);
  });

  it('otherAngle gives the reflex angle', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { otherAngle: true },
    );
    expect(angle.getAngleValue()).toBeCloseTo((3 * Math.PI) / 2, 3);
  });

  it('quadrant parameter adjusts angle direction', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { quadrant: 2 },
    );
    expect(angle.getAngleValue()).toBeGreaterThan(0);
    expect(angle.getPoints().length).toBeGreaterThan(0);
  });

  it('_createCopy produces an equivalent Angle', () => {
    const angle = new Angle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { radius: 0.8 },
    );
    const copy = angle.copy();
    expect(copy.getRadius()).toBe(0.8);
    expect(copy.getPoints().length).toBe(angle.getPoints().length);
  });
});

describe('RightAngle', () => {
  it('constructs from three points', () => {
    const ra = new RightAngle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(ra).toBeDefined();
    expect(ra.getPoints().length).toBeGreaterThan(0);
  });

  it('constructs from two lines', () => {
    const l1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const l2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
    const ra = new RightAngle({ line1: l1, line2: l2 });
    expect(ra.getPoints().length).toBeGreaterThan(0);
  });

  it('default size is 0.3', () => {
    const ra = new RightAngle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(ra.getSize()).toBe(0.3);
  });

  it('custom size is applied', () => {
    const ra = new RightAngle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { size: 0.6 },
    );
    expect(ra.getSize()).toBe(0.6);
  });

  it('default color is BLUE', () => {
    const ra = new RightAngle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(ra.color).toBe(BLUE);
  });

  it('getVertex returns the vertex point', () => {
    const ra = new RightAngle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(ra.getVertex()).toEqual([0, 0, 0]);
  });

  it('setSize regenerates points', () => {
    const ra = new RightAngle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    ra.setSize(0.5);
    expect(ra.getSize()).toBe(0.5);
    expect(ra.getPoints().length).toBeGreaterThan(0);
  });

  it('has 7 points (two line segments as cubic beziers)', () => {
    const ra = new RightAngle({
      points: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
    });
    // anchor + 3 control + 3 control = 7
    expect(ra.getPoints().length).toBe(7);
  });

  it('copy creates equivalent right angle', () => {
    const ra = new RightAngle(
      {
        points: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      },
      { size: 0.4 },
    );
    const copy = ra.copy();
    expect(copy.getSize()).toBe(0.4);
  });
});

describe('Elbow', () => {
  it('constructs with defaults', () => {
    const elbow = new Elbow();
    expect(elbow).toBeDefined();
    expect(elbow.getPoints().length).toBeGreaterThan(0);
  });

  it('default width and height are 1', () => {
    const elbow = new Elbow();
    expect(elbow.getWidth()).toBe(1);
    expect(elbow.getHeight()).toBe(1);
  });

  it('default angle is 0', () => {
    const elbow = new Elbow();
    expect(elbow.getAngle()).toBe(0);
  });

  it('default color is BLUE', () => {
    const elbow = new Elbow();
    expect(elbow.color).toBe(BLUE);
  });

  it('custom width/height/angle are applied', () => {
    const elbow = new Elbow({ width: 3, height: 2, angle: Math.PI / 4 });
    expect(elbow.getWidth()).toBe(3);
    expect(elbow.getHeight()).toBe(2);
    expect(elbow.getAngle()).toBeCloseTo(Math.PI / 4, 10);
  });

  it('setWidth regenerates points', () => {
    const elbow = new Elbow();
    elbow.setWidth(5);
    expect(elbow.getWidth()).toBe(5);
    expect(elbow.getPoints().length).toBeGreaterThan(0);
  });

  it('setHeight regenerates points', () => {
    const elbow = new Elbow();
    elbow.setHeight(4);
    expect(elbow.getHeight()).toBe(4);
  });

  it('setAngle regenerates points', () => {
    const elbow = new Elbow();
    elbow.setAngle(Math.PI / 3);
    expect(elbow.getAngle()).toBeCloseTo(Math.PI / 3, 10);
  });

  it('getCornerPosition defaults to origin', () => {
    const elbow = new Elbow();
    expect(elbow.getCornerPosition()).toEqual([0, 0, 0]);
  });

  it('setCornerPosition updates position', () => {
    const elbow = new Elbow();
    elbow.setCornerPosition([1, 2, 3]);
    expect(elbow.getCornerPosition()).toEqual([1, 2, 3]);
  });

  it('has 7 points (two line segments)', () => {
    const elbow = new Elbow();
    expect(elbow.getPoints().length).toBe(7);
  });

  it('copy creates equivalent elbow', () => {
    const elbow = new Elbow({ width: 2, height: 3, angle: 1 });
    const copy = elbow.copy();
    expect(copy.getWidth()).toBe(2);
    expect(copy.getHeight()).toBe(3);
    expect(copy.getAngle()).toBeCloseTo(1, 10);
  });
});

describe('TangentLine', () => {
  it('constructs on a circle', () => {
    const circle = new Circle({ radius: 2 });
    const tangent = new TangentLine(circle);
    expect(tangent).toBeDefined();
    expect(tangent.getPoints().length).toBeGreaterThan(0);
  });

  it('default t is 0.5', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle);
    expect(tangent.getT()).toBe(0.5);
  });

  it('default length is 2', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle);
    expect(tangent.getLength()).toBe(2);
  });

  it('custom t and length are applied', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle, { t: 0.25, length: 4 });
    expect(tangent.getT()).toBe(0.25);
    expect(tangent.getLength()).toBe(4);
  });

  it('getTangentPoint is on the curve', () => {
    const circle = new Circle({ radius: 2 });
    const tangent = new TangentLine(circle, { t: 0 });
    const pt = tangent.getTangentPoint();
    const dist = Math.sqrt(pt[0] ** 2 + pt[1] ** 2);
    expect(dist).toBeCloseTo(2, 0);
  });

  it('tangent direction is a unit vector', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle);
    const dir = tangent.getTangentDirection();
    const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    expect(len).toBeCloseTo(1, 5);
  });

  it('getStart and getEnd are length apart', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle, { length: 3 });
    const s = tangent.getStart();
    const e = tangent.getEnd();
    const dist = Math.sqrt((e[0] - s[0]) ** 2 + (e[1] - s[1]) ** 2 + (e[2] - s[2]) ** 2);
    expect(dist).toBeCloseTo(3, 3);
  });

  it('setT regenerates tangent', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle);
    tangent.setT(0.75);
    expect(tangent.getT()).toBe(0.75);
  });

  it('setLength regenerates tangent', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle);
    tangent.setLength(5);
    expect(tangent.getLength()).toBe(5);
  });

  it('t is clamped to [0, 1]', () => {
    const circle = new Circle();
    const t1 = new TangentLine(circle, { t: -0.5 });
    expect(t1.getT()).toBe(0);
    const t2 = new TangentLine(circle, { t: 1.5 });
    expect(t2.getT()).toBe(1);
  });

  it('has 4 points (single cubic bezier segment)', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle);
    expect(tangent.getPoints().length).toBe(4);
  });

  it('copy creates equivalent tangent line', () => {
    const circle = new Circle();
    const tangent = new TangentLine(circle, { t: 0.3, length: 5 });
    const copy = tangent.copy();
    expect(copy.getT()).toBe(0.3);
    expect(copy.getLength()).toBe(5);
  });
});

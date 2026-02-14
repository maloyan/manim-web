import { describe, it, expect } from 'vitest';
import { Circle } from './Circle';
import { Arc } from './Arc';
import { Rectangle, Square } from './Rectangle';
import { BLUE } from '../../constants';

describe('Circle', () => {
  it('constructs with default options', () => {
    const c = new Circle();
    expect(c.getRadius()).toBe(1);
    expect(c.getCircleCenter()).toEqual([0, 0, 0]);
    expect(c.color).toBe(BLUE);
    expect(c.fillOpacity).toBe(0);
  });

  it('constructs with custom radius and center', () => {
    const c = new Circle({ radius: 3, center: [1, 2, 0] });
    expect(c.getRadius()).toBe(3);
    expect(c.getCircleCenter()).toEqual([1, 2, 0]);
  });

  it('getCircumference returns 2*PI*r', () => {
    expect(new Circle({ radius: 1 }).getCircumference()).toBeCloseTo(2 * Math.PI, 10);
    expect(new Circle({ radius: 5 }).getCircumference()).toBeCloseTo(10 * Math.PI, 10);
  });

  it('getArea returns PI*r^2', () => {
    expect(new Circle({ radius: 1 }).getArea()).toBeCloseTo(Math.PI, 10);
    expect(new Circle({ radius: 3 }).getArea()).toBeCloseTo(9 * Math.PI, 10);
  });

  it('pointAtAngle returns correct positions', () => {
    const c = new Circle({ radius: 2 });
    const right = c.pointAtAngle(0);
    expect(right[0]).toBeCloseTo(2, 10);
    expect(right[1]).toBeCloseTo(0, 10);

    const top = c.pointAtAngle(Math.PI / 2);
    expect(top[0]).toBeCloseTo(0, 10);
    expect(top[1]).toBeCloseTo(2, 10);
  });

  it('pointAtAngle respects center offset', () => {
    const c = new Circle({ radius: 1, center: [5, 5, 0] });
    const pt = c.pointAtAngle(0);
    expect(pt[0]).toBeCloseTo(6, 10);
    expect(pt[1]).toBeCloseTo(5, 10);
  });

  it('setRadius updates radius and regenerates points', () => {
    const c = new Circle({ radius: 1 });
    c.setRadius(5);
    expect(c.getRadius()).toBe(5);
    expect(c.getCircumference()).toBeCloseTo(10 * Math.PI, 10);
  });

  it('setCircleCenter updates center', () => {
    const c = new Circle();
    c.setCircleCenter([3, 4, 0]);
    expect(c.getCircleCenter()).toEqual([3, 4, 0]);
  });

  it('scale multiplies radius', () => {
    const c = new Circle({ radius: 2 });
    c.scale(3);
    expect(c.getRadius()).toBe(6);
  });

  it('shift updates center', () => {
    const c = new Circle({ center: [0, 0, 0] });
    c.shift([1, 2, 0]);
    expect(c.getCircleCenter()).toEqual([1, 2, 0]);
  });

  it('generates Bezier points (13 points for 4 cubic segments)', () => {
    const c = new Circle();
    // 4 cubic segments: first has 4 points, next 3 have 3 each = 4 + 3*3 = 13
    expect(c.numPoints).toBe(13);
  });

  it('all anchor points lie on the circle', () => {
    const c = new Circle({ radius: 2 });
    const pts = c.points; // Point[] = {x, y}
    // Anchor points (every 3rd point starting from 0) should be on the circle
    for (let i = 0; i < pts.length; i += 3) {
      const dist = Math.sqrt(pts[i].x ** 2 + pts[i].y ** 2);
      expect(dist).toBeCloseTo(2, 5);
    }
  });
});

describe('Arc', () => {
  it('constructs with default options (quarter circle)', () => {
    const a = new Arc();
    expect(a.getRadius()).toBe(1);
    expect(a.getStartAngle()).toBe(0);
    expect(a.getAngle()).toBe(Math.PI / 2);
    expect(a.getArcCenter()).toEqual([0, 0, 0]);
  });

  it('getStartPoint returns point at start angle', () => {
    const a = new Arc({ radius: 2, startAngle: 0 });
    const start = a.getStartPoint();
    expect(start[0]).toBeCloseTo(2, 10);
    expect(start[1]).toBeCloseTo(0, 10);
  });

  it('getEndPoint returns point at end angle', () => {
    const a = new Arc({ radius: 1, startAngle: 0, angle: Math.PI / 2 });
    const end = a.getEndPoint();
    expect(end[0]).toBeCloseTo(0, 10);
    expect(end[1]).toBeCloseTo(1, 10);
  });

  it('getArcLength returns |r * angle|', () => {
    expect(new Arc({ radius: 2, angle: Math.PI }).getArcLength()).toBeCloseTo(2 * Math.PI, 10);
    expect(new Arc({ radius: 1, angle: Math.PI / 2 }).getArcLength()).toBeCloseTo(Math.PI / 2, 10);
  });

  it('pointFromProportion interpolates along the arc', () => {
    const a = new Arc({ radius: 1, startAngle: 0, angle: Math.PI });
    const mid = a.pointFromProportion(0.5);
    // Midpoint of semicircle starting at (1,0): should be (0, 1, 0)
    expect(mid[0]).toBeCloseTo(0, 10);
    expect(mid[1]).toBeCloseTo(1, 10);
  });

  it('setAngle updates the arc span', () => {
    const a = new Arc();
    a.setAngle(Math.PI);
    expect(a.getAngle()).toBe(Math.PI);
    expect(a.getArcLength()).toBeCloseTo(Math.PI, 10);
  });

  it('setRadius updates arc radius', () => {
    const a = new Arc();
    a.setRadius(5);
    expect(a.getRadius()).toBe(5);
  });

  it('semicircle start/end are at correct positions', () => {
    const a = new Arc({ radius: 1, startAngle: 0, angle: Math.PI });
    const start = a.getStartPoint();
    const end = a.getEndPoint();
    expect(start[0]).toBeCloseTo(1, 10);
    expect(start[1]).toBeCloseTo(0, 10);
    expect(end[0]).toBeCloseTo(-1, 10);
    expect(end[1]).toBeCloseTo(0, 5);
  });
});

describe('Rectangle', () => {
  it('constructs with default options (2x1)', () => {
    const r = new Rectangle();
    expect(r.getWidth()).toBe(2);
    expect(r.getHeight()).toBe(1);
    expect(r.getRectCenter()).toEqual([0, 0, 0]);
  });

  it('constructs with custom dimensions', () => {
    const r = new Rectangle({ width: 5, height: 3, center: [1, 2, 0] });
    expect(r.getWidth()).toBe(5);
    expect(r.getHeight()).toBe(3);
    expect(r.getRectCenter()).toEqual([1, 2, 0]);
  });

  it('getArea returns width * height', () => {
    expect(new Rectangle({ width: 3, height: 4 }).getArea()).toBe(12);
    expect(new Rectangle().getArea()).toBe(2);
  });

  it('getPerimeter returns 2*(width + height)', () => {
    expect(new Rectangle({ width: 3, height: 4 }).getPerimeter()).toBe(14);
    expect(new Rectangle().getPerimeter()).toBe(6);
  });

  it('getCorner returns correct positions', () => {
    const r = new Rectangle({ width: 4, height: 2 });
    expect(r.getCorner('topLeft')).toEqual([-2, 1, 0]);
    expect(r.getCorner('topRight')).toEqual([2, 1, 0]);
    expect(r.getCorner('bottomRight')).toEqual([2, -1, 0]);
    expect(r.getCorner('bottomLeft')).toEqual([-2, -1, 0]);
  });

  it('getCorner respects center offset', () => {
    const r = new Rectangle({ width: 2, height: 2, center: [5, 5, 0] });
    expect(r.getCorner('topRight')).toEqual([6, 6, 0]);
    expect(r.getCorner('bottomLeft')).toEqual([4, 4, 0]);
  });

  it('getTop/getBottom/getLeft/getRight return edge centers', () => {
    const r = new Rectangle({ width: 6, height: 4 });
    expect(r.getTop()).toEqual([0, 2, 0]);
    expect(r.getBottom()).toEqual([0, -2, 0]);
    expect(r.getLeft()).toEqual([-3, 0, 0]);
    expect(r.getRight()).toEqual([3, 0, 0]);
  });

  it('setWidth/setHeight update dimensions', () => {
    const r = new Rectangle();
    r.setWidth(10);
    r.setHeight(5);
    expect(r.getWidth()).toBe(10);
    expect(r.getHeight()).toBe(5);
    expect(r.getArea()).toBe(50);
  });

  it('setRectCenter updates center', () => {
    const r = new Rectangle();
    r.setRectCenter([3, 4, 0]);
    expect(r.getRectCenter()).toEqual([3, 4, 0]);
  });

  it('generates Bezier points (4 segments = 13 points)', () => {
    const r = new Rectangle();
    expect(r.numPoints).toBe(13);
  });
});

describe('Square', () => {
  it('constructs with default side length (2)', () => {
    const s = new Square();
    expect(s.getWidth()).toBe(2);
    expect(s.getHeight()).toBe(2);
    expect(s.getSideLength()).toBe(2);
  });

  it('constructs with custom side length', () => {
    const s = new Square({ sideLength: 5 });
    expect(s.getSideLength()).toBe(5);
    expect(s.getWidth()).toBe(5);
    expect(s.getHeight()).toBe(5);
  });

  it('getArea returns side^2', () => {
    expect(new Square({ sideLength: 3 }).getArea()).toBe(9);
  });

  it('getPerimeter returns 4*side', () => {
    expect(new Square({ sideLength: 3 }).getPerimeter()).toBe(12);
  });

  it('setSideLength updates both width and height', () => {
    const s = new Square();
    s.setSideLength(7);
    expect(s.getWidth()).toBe(7);
    expect(s.getHeight()).toBe(7);
  });

  it('is a Rectangle', () => {
    const s = new Square();
    expect(s).toBeInstanceOf(Rectangle);
  });
});

// ---------------------------------------------------------------------------
// Arc – uncovered branches
// ---------------------------------------------------------------------------
describe('Arc – uncovered branches', () => {
  it('setStartAngle updates start angle and regenerates', () => {
    const a = new Arc({ radius: 1, startAngle: 0, angle: Math.PI / 2 });
    a.setStartAngle(Math.PI / 2);
    expect(a.getStartAngle()).toBe(Math.PI / 2);
    const start = a.getStartPoint();
    expect(start[0]).toBeCloseTo(0, 10);
    expect(start[1]).toBeCloseTo(1, 10);
  });

  it('setArcCenter updates center and regenerates', () => {
    const a = new Arc({ radius: 1 });
    a.setArcCenter([3, 4, 0]);
    expect(a.getArcCenter()).toEqual([3, 4, 0]);
    const start = a.getStartPoint();
    expect(start[0]).toBeCloseTo(4, 10);
    expect(start[1]).toBeCloseTo(4, 10);
  });

  it('_createCopy returns independent copy', () => {
    const a = new Arc({
      radius: 3,
      startAngle: Math.PI / 4,
      angle: Math.PI,
      color: '#ff0000',
      strokeWidth: 5,
      numComponents: 12,
      center: [1, 2, 0],
    });
    const copy = a.copy() as Arc;
    expect(copy).not.toBe(a);
    expect(copy.getRadius()).toBe(3);
    expect(copy.getStartAngle()).toBe(Math.PI / 4);
    expect(copy.getAngle()).toBe(Math.PI);
    expect(copy.color).toBe('#ff0000');
    expect(copy.strokeWidth).toBe(5);
    expect(copy.getArcCenter()).toEqual([1, 2, 0]);
  });

  it('negative angle creates clockwise arc', () => {
    const a = new Arc({ radius: 1, startAngle: 0, angle: -Math.PI / 2 });
    expect(a.getArcLength()).toBeCloseTo(Math.PI / 2, 10);
    const end = a.getEndPoint();
    expect(end[0]).toBeCloseTo(0, 10);
    expect(end[1]).toBeCloseTo(-1, 10);
  });

  it('full circle arc generates points', () => {
    const a = new Arc({ radius: 1, angle: Math.PI * 2 });
    expect(a.numPoints).toBeGreaterThan(0);
    expect(a.getArcLength()).toBeCloseTo(2 * Math.PI, 10);
  });

  it('custom center offsets start and end points', () => {
    const a = new Arc({ radius: 1, center: [5, 5, 0], startAngle: 0, angle: Math.PI / 2 });
    const start = a.getStartPoint();
    const end = a.getEndPoint();
    expect(start[0]).toBeCloseTo(6, 10);
    expect(start[1]).toBeCloseTo(5, 10);
    expect(end[0]).toBeCloseTo(5, 10);
    expect(end[1]).toBeCloseTo(6, 10);
  });

  it('pointFromProportion at 0 and 1 match start/end', () => {
    const a = new Arc({
      radius: 2,
      startAngle: Math.PI / 6,
      angle: Math.PI / 3,
      center: [1, 1, 0],
    });
    const start = a.getStartPoint();
    const prop0 = a.pointFromProportion(0);
    expect(prop0[0]).toBeCloseTo(start[0], 10);
    expect(prop0[1]).toBeCloseTo(start[1], 10);
    const end = a.getEndPoint();
    const prop1 = a.pointFromProportion(1);
    expect(prop1[0]).toBeCloseTo(end[0], 10);
    expect(prop1[1]).toBeCloseTo(end[1], 10);
  });

  it('custom numComponents changes Bezier resolution', () => {
    const a4 = new Arc({ angle: Math.PI * 2, numComponents: 4 });
    const a16 = new Arc({ angle: Math.PI * 2, numComponents: 16 });
    expect(a16.numPoints).toBeGreaterThan(a4.numPoints);
  });

  it('setStartAngle is chainable', () => {
    const a = new Arc();
    const result = a.setStartAngle(Math.PI);
    expect(result).toBe(a);
  });

  it('setArcCenter is chainable', () => {
    const a = new Arc();
    const result = a.setArcCenter([1, 1, 0]);
    expect(result).toBe(a);
  });
});

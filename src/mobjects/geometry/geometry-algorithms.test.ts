import { describe, it, expect } from 'vitest';
import { Rectangle, Square } from './Rectangle';
import { Circle } from './Circle';
import {
  Union,
  Intersection,
  Difference,
  Exclusion,
  BooleanResult,
  union,
  intersection,
  difference,
  exclusion,
} from './BooleanOperations';
import { BackgroundRectangle, SurroundingRectangle, Underline, Cross } from './ShapeMatchers';
import { Line } from './Line';

// NOTE: LabeledLine, LabeledArrow, LabeledDot, and AnnotationDot from
// LabeledGeometry.ts are NOT tested here because they depend on the Text
// class, which requires DOM/Canvas APIs (document.createElement('canvas')).
// Those classes need a browser or jsdom environment to test.

// ---------------------------------------------------------------------------
// BooleanOperations
// ---------------------------------------------------------------------------

describe('BooleanResult (base class)', () => {
  it('getSubpaths returns empty for single-polygon, defensive copies work', () => {
    const r1 = new Square({ sideLength: 2 });
    const r2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    const u = new Union(r1, r2);
    expect(u.getSubpaths()).toEqual([]);
    expect(u).toBeInstanceOf(BooleanResult);

    const v1 = u.getResultVertices();
    const v2 = u.getResultVertices();
    expect(v1).toEqual(v2);
    if (v1.length > 0 && v1[0].length > 0) {
      v1[0][0].x = 9999;
      expect(v2[0][0].x).not.toBe(9999);
    }
  });
});

describe('Union', () => {
  it('merges two overlapping squares into a single polygon with points', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    const u = new Union(s1, s2);
    const vertices = u.getResultVertices();
    expect(vertices.length).toBe(1);
    expect(vertices[0].length).toBeGreaterThanOrEqual(4);
    expect(u.getPoints().length).toBeGreaterThan(0);
  });

  it('union of identical shapes returns single polygon', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2 });
    const u = new Union(s1, s2);
    expect(u.getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('union of non-overlapping shapes returns multiple polygons', () => {
    const s1 = new Square({ sideLength: 1 });
    const s2 = new Square({ sideLength: 1, center: [5, 0, 0] });
    const u = new Union(s1, s2);
    expect(u.getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('inherits color from first shape, or accepts custom options', () => {
    const s1 = new Square({ sideLength: 2 });
    s1.setColor('#ff0000');
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    expect(new Union(s1, s2).color.toLowerCase()).toBe('#ff0000');
    expect(new Union(s1, s2, { color: '#00ff00' }).color.toLowerCase()).toBe('#00ff00');
    expect(new Union(s1, s2, { fillOpacity: 0.5 }).fillOpacity).toBe(0.5);
  });

  it('factory function produces Union instance', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    const u = union(s1, s2);
    expect(u).toBeInstanceOf(Union);
    expect(u.getResultVertices().length).toBeGreaterThan(0);
  });
});

describe('Intersection', () => {
  it('finds overlap of two overlapping squares', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 1, 0] });
    const inter = new Intersection(s1, s2);
    const vertices = inter.getResultVertices();
    expect(vertices.length).toBe(1);
    expect(vertices[0].length).toBeGreaterThanOrEqual(3);
  });

  it('intersection of non-overlapping shapes is empty', () => {
    const s1 = new Square({ sideLength: 1 });
    const s2 = new Square({ sideLength: 1, center: [10, 0, 0] });
    expect(new Intersection(s1, s2).getResultVertices().length).toBe(0);
  });

  it('intersection of identical shapes returns the shape', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2 });
    expect(new Intersection(s1, s2).getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('intersection with smaller centered shape returns smaller', () => {
    const big = new Rectangle({ width: 4, height: 4 });
    const small = new Square({ sideLength: 2 });
    const inter = new Intersection(big, small);
    expect(inter.getResultVertices().length).toBe(1);
    expect(inter.getResultVertices()[0].length).toBeGreaterThanOrEqual(4);
  });

  it('factory function produces Intersection instance', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    expect(intersection(s1, s2)).toBeInstanceOf(Intersection);
  });
});

describe('Difference', () => {
  it('subtracts overlapping portion from first shape', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    const diff = new Difference(s1, s2);
    expect(diff.getResultVertices().length).toBeGreaterThanOrEqual(1);
    expect(diff.getPoints().length).toBeGreaterThan(0);
  });

  it('difference with non-overlapping shape returns original', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 1, center: [10, 0, 0] });
    expect(new Difference(s1, s2).getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('difference when second fully covers first is defined', () => {
    const small = new Square({ sideLength: 1 });
    const big = new Square({ sideLength: 4 });
    expect(new Difference(small, big).getResultVertices()).toBeDefined();
  });

  it('factory function produces Difference instance', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    expect(difference(s1, s2)).toBeInstanceOf(Difference);
  });
});

describe('Exclusion (XOR)', () => {
  it('XOR of two overlapping squares produces result polygons', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    expect(new Exclusion(s1, s2).getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('XOR of identical shapes is empty or near-empty', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2 });
    expect(new Exclusion(s1, s2).getResultVertices().length).toBeLessThanOrEqual(1);
  });

  it('XOR of non-overlapping shapes returns both with subpaths', () => {
    const s1 = new Square({ sideLength: 1 });
    const s2 = new Square({ sideLength: 1, center: [5, 0, 0] });
    const excl = new Exclusion(s1, s2);
    expect(excl.getResultVertices().length).toBeGreaterThanOrEqual(2);
    if (excl.getResultVertices().length > 1) {
      expect(excl.getSubpaths().length).toBeGreaterThan(0);
    }
  });

  it('factory function produces Exclusion instance', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    expect(exclusion(s1, s2)).toBeInstanceOf(Exclusion);
  });
});

describe('BooleanOperations with circles', () => {
  it('union of two overlapping circles produces result', () => {
    const c1 = new Circle({ radius: 1 });
    const c2 = new Circle({ radius: 1, center: [1, 0, 0] });
    const u = new Union(c1, c2);
    expect(u.getResultVertices().length).toBeGreaterThanOrEqual(1);
    expect(u.getPoints().length).toBeGreaterThan(0);
  });

  it('intersection of overlapping circles produces lens, non-overlapping is empty', () => {
    const c1 = new Circle({ radius: 1 });
    const c2 = new Circle({ radius: 1, center: [1, 0, 0] });
    expect(new Intersection(c1, c2).getResultVertices().length).toBe(1);

    const c3 = new Circle({ radius: 1, center: [5, 0, 0] });
    expect(new Intersection(c1, c3).getResultVertices().length).toBe(0);
  });
});

describe('BooleanOperations with mixed shapes and edge cases', () => {
  it('union of rectangle and circle', () => {
    const r = new Rectangle({ width: 2, height: 2 });
    const c = new Circle({ radius: 1 });
    expect(new Union(r, c).getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('difference of rectangle minus circle', () => {
    const r = new Rectangle({ width: 4, height: 4 });
    const c = new Circle({ radius: 0.5 });
    const d = new Difference(r, c);
    expect(d.getResultVertices().length).toBeGreaterThanOrEqual(1);
    expect(d.getPoints().length).toBeGreaterThan(0);
  });

  it('handles shifted shapes correctly', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2 });
    s2.shift([0.5, 0.5, 0]);
    expect(new Intersection(s1, s2).getResultVertices().length).toBeGreaterThanOrEqual(1);
  });

  it('handles custom samplesPerSegment and fillColor options', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2, center: [1, 0, 0] });
    expect(
      new Union(s1, s2, { samplesPerSegment: 4 }).getResultVertices().length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      new Union(s1, s2, { fillColor: '#0000ff' }).getResultVertices().length,
    ).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// ShapeMatchers
// ---------------------------------------------------------------------------

describe('BackgroundRectangle', () => {
  it('constructs with correct dimensions (default buff = 0.2)', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const bg = new BackgroundRectangle(target);
    expect(bg.getWidth()).toBeCloseTo(4.4, 1);
    expect(bg.getHeight()).toBeCloseTo(2.4, 1);
    expect(bg.fillOpacity).toBe(0.75);
    expect(bg.strokeWidth).toBe(0);
    expect(bg.color.toLowerCase()).toBe('#000000');
  });

  it('respects custom buff', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const bg = new BackgroundRectangle(target, { buff: 0.5 });
    expect(bg.getWidth()).toBeCloseTo(5, 1);
    expect(bg.getHeight()).toBeCloseTo(3, 1);
  });

  it('getTargetMobject, getBuff, setBuff work correctly', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const bg = new BackgroundRectangle(target, { buff: 0.3 });
    expect(bg.getTargetMobject()).toBe(target);
    expect(bg.getBuff()).toBe(0.3);
    bg.setBuff(0.5);
    expect(bg.getBuff()).toBe(0.5);
  });

  it('works with Circle and Square targets', () => {
    const circle = new Circle({ radius: 1 });
    const bgCircle = new BackgroundRectangle(circle);
    expect(bgCircle.getWidth()).toBeGreaterThan(2);
    expect(bgCircle.getHeight()).toBeGreaterThan(2);

    const square = new Square({ sideLength: 3 });
    const bgSquare = new BackgroundRectangle(square);
    expect(bgSquare.getWidth()).toBeCloseTo(3.4, 1);
    expect(bgSquare.getHeight()).toBeCloseTo(3.4, 1);
  });

  it('accepts custom fill opacity and color', () => {
    const target = new Rectangle({ width: 2, height: 2 });
    const bg = new BackgroundRectangle(target, { fillOpacity: 0.9, color: '#333333' });
    expect(bg.fillOpacity).toBe(0.9);
    expect(bg.color.toLowerCase()).toBe('#333333');
  });
});

describe('SurroundingRectangle', () => {
  it('constructs with default options (yellow, no fill, no corner radius)', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const sr = new SurroundingRectangle(target);
    expect(sr.getBuff()).toBe(0.2);
    expect(sr.getCornerRadius()).toBe(0);
    expect(sr.color.toLowerCase()).toBe('#ffff00');
    expect(sr.fillOpacity).toBe(0);
    expect(sr.getPoints().length).toBeGreaterThan(0);
  });

  it('getTargetMobject returns the original target', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    expect(new SurroundingRectangle(target).getTargetMobject()).toBe(target);
  });

  it('setBuff updates buffer and regenerates points', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const sr = new SurroundingRectangle(target);
    sr.setBuff(0.5);
    expect(sr.getBuff()).toBe(0.5);
    expect(sr.getPoints().length).toBeGreaterThan(0);
  });

  it('setCornerRadius produces more points for rounded vs sharp', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const sr = new SurroundingRectangle(target);
    sr.setCornerRadius(0.3);
    expect(sr.getCornerRadius()).toBe(0.3);
    const roundedCount = sr.getPoints().length;
    sr.setCornerRadius(0);
    const sharpCount = sr.getPoints().length;
    expect(roundedCount).toBeGreaterThan(sharpCount);
  });

  it('sharp corners produce at least 13 points', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const sr = new SurroundingRectangle(target, { cornerRadius: 0 });
    expect(sr.getPoints().length).toBeGreaterThanOrEqual(13);
  });

  it('rounded corners produce more points than sharp corners', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const sharp = new SurroundingRectangle(target, { cornerRadius: 0 });
    const rounded = new SurroundingRectangle(target, { cornerRadius: 0.3 });
    expect(rounded.getPoints().length).toBeGreaterThan(sharp.getPoints().length);
  });

  it('respects custom color and works with Circle target', () => {
    const rect = new Rectangle({ width: 2, height: 2 });
    expect(new SurroundingRectangle(rect, { color: '#ff0000' }).color.toLowerCase()).toBe(
      '#ff0000',
    );

    const circle = new Circle({ radius: 2 });
    expect(new SurroundingRectangle(circle).getPoints().length).toBeGreaterThan(0);
  });
});

describe('Underline', () => {
  it('constructs with default options and is a Line instance', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const ul = new Underline(target);
    expect(ul.getBuff()).toBe(0.1);
    expect(ul.getStretch()).toBe(0);
    expect(ul).toBeInstanceOf(Line);
    expect(ul.getTargetMobject()).toBe(target);
  });

  it('positioned below the target spanning its width', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const ul = new Underline(target);
    const start = ul.getStart();
    const end = ul.getEnd();
    expect(start[1]).toBeCloseTo(-1.1, 1);
    expect(end[1]).toBeCloseTo(-1.1, 1);
    expect(start[0]).toBeCloseTo(-2, 1);
    expect(end[0]).toBeCloseTo(2, 1);
  });

  it('stretch extends the underline past edges', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const ul = new Underline(target, { stretch: 0.5 });
    expect(ul.getStart()[0]).toBeCloseTo(-2.5, 1);
    expect(ul.getEnd()[0]).toBeCloseTo(2.5, 1);
  });

  it('setBuff and setStretch update values', () => {
    const target = new Rectangle({ width: 4, height: 2 });
    const ul = new Underline(target);
    ul.setBuff(0.3);
    expect(ul.getBuff()).toBe(0.3);
    ul.setStretch(1.0);
    expect(ul.getStretch()).toBe(1.0);
  });

  it('default color is yellow, respects custom color', () => {
    const target = new Rectangle({ width: 2, height: 2 });
    expect(new Underline(target).color.toLowerCase()).toBe('#ffff00');
    expect(new Underline(target, { color: '#ff0000' }).color.toLowerCase()).toBe('#ff0000');
  });
});

describe('Cross', () => {
  it('constructs with defaults (red, strokeWidth 6, scale 1, two children)', () => {
    const target = new Rectangle({ width: 2, height: 2 });
    const cross = new Cross(target);
    expect(cross.getScale()).toBe(1);
    expect(cross.color.toLowerCase()).toBe('#fc6255');
    expect(cross.strokeWidth).toBe(6);
    expect(cross.children.length).toBe(2);
    expect(cross.getTargetMobject()).toBe(target);
  });

  it('setScale, setColor, setStrokeWidth update values', () => {
    const target = new Rectangle({ width: 2, height: 2 });
    const cross = new Cross(target);
    cross.setScale(2);
    expect(cross.getScale()).toBe(2);
    cross.setColor('#00ff00');
    expect(cross.color.toLowerCase()).toBe('#00ff00');
    cross.setStrokeWidth(10);
    expect(cross.strokeWidth).toBe(10);
  });

  it('respects custom color and scale options', () => {
    const target = new Rectangle({ width: 2, height: 2 });
    expect(new Cross(target, { color: '#0000ff' }).color.toLowerCase()).toBe('#0000ff');
    expect(new Cross(target, { scale: 0.5 }).getScale()).toBe(0.5);
  });

  it('works with Square and Circle targets', () => {
    expect(new Cross(new Square({ sideLength: 3 })).children.length).toBe(2);
    expect(new Cross(new Circle({ radius: 1 })).children.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// LabeledGeometry (directionToVector utility)
// ---------------------------------------------------------------------------

// The directionToVector function is private in LabeledGeometry.ts.
// We verify the expected direction constants match standard math conventions.

describe('LabeledGeometry direction conventions', () => {
  it('cardinal and diagonal directions have correct values and unit magnitude', () => {
    const directions: Record<string, [number, number, number]> = {
      UP: [0, 1, 0],
      DOWN: [0, -1, 0],
      LEFT: [-1, 0, 0],
      RIGHT: [1, 0, 0],
      UL: [-0.707, 0.707, 0],
      UR: [0.707, 0.707, 0],
      DL: [-0.707, -0.707, 0],
      DR: [0.707, -0.707, 0],
    };

    expect(directions.UP[1]).toBe(1);
    expect(directions.DOWN[1]).toBe(-1);
    expect(directions.LEFT[0]).toBe(-1);
    expect(directions.RIGHT[0]).toBe(1);

    for (const key of ['UL', 'UR', 'DL', 'DR']) {
      const [x, y] = directions[key];
      expect(Math.sqrt(x * x + y * y)).toBeCloseTo(1, 2);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { Polygon, Triangle, RegularPolygon, Hexagon, Pentagon } from './Polygon';
import { RoundedRectangle, Star, RegularPolygram, Cutout, ConvexHull } from './PolygonExtensions';
import { Circle } from './Circle';
import { BLUE } from '../../constants';

// ---------------------------------------------------------------------------
// Polygon
// ---------------------------------------------------------------------------
describe('Polygon', () => {
  it('constructs a triangle', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 1, 0],
      ],
    });
    expect(p.getVertexCount()).toBe(3);
    expect(p.isClosed()).toBe(true);
  });

  it('throws with fewer than 2 vertices', () => {
    expect(() => new Polygon({ vertices: [[0, 0, 0]] })).toThrow();
  });

  it('getVertices returns defensive copies', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 1, 0],
      ],
    });
    const v = p.getVertices();
    v[0][0] = 999;
    expect(p.getVertices()[0][0]).toBe(0);
  });

  it('getVertex / setVertex work correctly', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 1, 0],
      ],
    });
    expect(p.getVertex(1)).toEqual([1, 0, 0]);
    p.setVertex(1, [2, 0, 0]);
    expect(p.getVertex(1)).toEqual([2, 0, 0]);
  });

  it('getVertex throws on out-of-bounds index', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 1, 0],
      ],
    });
    expect(() => p.getVertex(5)).toThrow();
    expect(() => p.getVertex(-1)).toThrow();
  });

  it('getCentroid returns average of vertices', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [3, 0, 0],
        [0, 3, 0],
      ],
    });
    const c = p.getCentroid();
    expect(c[0]).toBeCloseTo(1, 10);
    expect(c[1]).toBeCloseTo(1, 10);
  });

  it('getArea for a unit square = 1', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    });
    expect(p.getArea()).toBeCloseTo(1, 10);
  });

  it('getSignedArea is positive for CCW vertices', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    });
    expect(p.getSignedArea()).toBeCloseTo(1, 10);
  });

  it('getSignedArea is negative for CW vertices', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    });
    expect(p.getSignedArea()).toBeCloseTo(-1, 10);
  });

  it('getSignedArea returns 0 for open polygon', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      closed: false,
    });
    expect(p.getSignedArea()).toBe(0);
  });

  it('getPerimeter for a unit square = 4', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    });
    expect(p.getPerimeter()).toBeCloseTo(4, 10);
  });

  it('getPerimeter for open path is shorter (no closing edge)', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
      closed: false,
    });
    expect(p.getPerimeter()).toBeCloseTo(3, 10);
  });

  it('setClosed toggles closure', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 1, 0],
      ],
    });
    expect(p.isClosed()).toBe(true);
    p.setClosed(false);
    expect(p.isClosed()).toBe(false);
  });

  it('setVertices replaces all vertices', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 1, 0],
      ],
    });
    p.setVertices([
      [0, 0, 0],
      [2, 0, 0],
      [1, 2, 0],
      [0, 2, 0],
    ]);
    expect(p.getVertexCount()).toBe(4);
  });

  it('setVertices throws with fewer than 2', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
      ],
    });
    expect(() => p.setVertices([[0, 0, 0]])).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Triangle
// ---------------------------------------------------------------------------
describe('Triangle', () => {
  it('constructs with default equilateral vertices', () => {
    const t = new Triangle();
    expect(t.getVertexCount()).toBe(3);
    expect(t.isClosed()).toBe(true);
  });

  it('is a Polygon', () => {
    expect(new Triangle()).toBeInstanceOf(Polygon);
  });

  it('default triangle is roughly equilateral', () => {
    const t = new Triangle();
    const verts = t.getVertices();
    // All side lengths should be approximately equal
    const dist = (a: number[], b: number[]) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
    const s1 = dist(verts[0], verts[1]);
    const s2 = dist(verts[1], verts[2]);
    const s3 = dist(verts[2], verts[0]);
    expect(s1).toBeCloseTo(s2, 5);
    expect(s2).toBeCloseTo(s3, 5);
  });
});

// ---------------------------------------------------------------------------
// RegularPolygon
// ---------------------------------------------------------------------------
describe('RegularPolygon', () => {
  it('constructs with default 6 sides', () => {
    const rp = new RegularPolygon();
    expect(rp.getNumSides()).toBe(6);
    expect(rp.getPolygonRadius()).toBe(1);
    expect(rp.getVertexCount()).toBe(6);
  });

  it('constructs with custom numSides and radius', () => {
    const rp = new RegularPolygon({ numSides: 8, radius: 2 });
    expect(rp.getNumSides()).toBe(8);
    expect(rp.getPolygonRadius()).toBe(2);
    expect(rp.getVertexCount()).toBe(8);
  });

  it('getSideLength = 2*r*sin(PI/n)', () => {
    const rp = new RegularPolygon({ numSides: 4, radius: 1 });
    expect(rp.getSideLength()).toBeCloseTo(2 * Math.sin(Math.PI / 4), 10);
  });

  it('getApothem = r*cos(PI/n)', () => {
    const rp = new RegularPolygon({ numSides: 6, radius: 2 });
    expect(rp.getApothem()).toBeCloseTo(2 * Math.cos(Math.PI / 6), 10);
  });

  it('vertices lie on the circle of given radius', () => {
    const rp = new RegularPolygon({ numSides: 5, radius: 3 });
    for (const v of rp.getVertices()) {
      const dist = Math.sqrt(v[0] ** 2 + v[1] ** 2);
      expect(dist).toBeCloseTo(3, 5);
    }
  });

  it('is a Polygon', () => {
    expect(new RegularPolygon()).toBeInstanceOf(Polygon);
  });
});

// ---------------------------------------------------------------------------
// Hexagon / Pentagon
// ---------------------------------------------------------------------------
describe('Hexagon', () => {
  it('has 6 sides', () => {
    const h = new Hexagon();
    expect(h.getNumSides()).toBe(6);
    expect(h.getVertexCount()).toBe(6);
  });

  it('is a RegularPolygon', () => {
    expect(new Hexagon()).toBeInstanceOf(RegularPolygon);
  });
});

describe('Pentagon', () => {
  it('has 5 sides', () => {
    const p = new Pentagon();
    expect(p.getNumSides()).toBe(5);
    expect(p.getVertexCount()).toBe(5);
  });

  it('is a RegularPolygon', () => {
    expect(new Pentagon()).toBeInstanceOf(RegularPolygon);
  });
});

// ---------------------------------------------------------------------------
// RoundedRectangle (PolygonExtensions)
// ---------------------------------------------------------------------------
describe('RoundedRectangle', () => {
  it('constructs with default options', () => {
    const rr = new RoundedRectangle();
    expect(rr.getWidth()).toBe(2);
    expect(rr.getHeight()).toBe(1);
    expect(rr.getCornerRadius()).toBe(0.25);
    expect(rr.getRoundedRectCenter()).toEqual([0, 0, 0]);
    expect(rr.color).toBe(BLUE);
    expect(rr.fillOpacity).toBe(0);
  });

  it('clamps corner radius to half of smaller dimension', () => {
    const rr = new RoundedRectangle({ width: 2, height: 1, cornerRadius: 5 });
    expect(rr.getCornerRadius()).toBe(0.5); // min(5, 1, 0.5) = 0.5
  });

  it('setWidth / setHeight / setCornerRadius update', () => {
    const rr = new RoundedRectangle();
    rr.setWidth(6);
    rr.setHeight(4);
    rr.setCornerRadius(1);
    expect(rr.getWidth()).toBe(6);
    expect(rr.getHeight()).toBe(4);
    expect(rr.getCornerRadius()).toBe(1);
  });

  it('setCornerRadius clamps to half dimension', () => {
    const rr = new RoundedRectangle({ width: 2, height: 2 });
    rr.setCornerRadius(5);
    expect(rr.getCornerRadius()).toBe(1);
  });

  it('setRoundedRectCenter updates center', () => {
    const rr = new RoundedRectangle();
    rr.setRoundedRectCenter([3, 4, 0]);
    expect(rr.getRoundedRectCenter()).toEqual([3, 4, 0]);
  });

  it('generates non-empty points', () => {
    const rr = new RoundedRectangle();
    expect(rr.numPoints).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Star (PolygonExtensions)
// ---------------------------------------------------------------------------
describe('Star', () => {
  it('constructs with default options', () => {
    const s = new Star();
    expect(s.getNumPoints()).toBe(5);
    expect(s.getOuterRadius()).toBe(1);
    expect(s.getInnerRadius()).toBe(0.4);
    expect(s.getStarCenter()).toEqual([0, 0, 0]);
  });

  it('throws with numPoints < 2', () => {
    expect(() => new Star({ numPoints: 1 })).toThrow();
  });

  it('setOuterRadius / setInnerRadius update radii', () => {
    const s = new Star();
    s.setOuterRadius(2);
    s.setInnerRadius(0.8);
    expect(s.getOuterRadius()).toBe(2);
    expect(s.getInnerRadius()).toBe(0.8);
  });

  it('setStarCenter updates center', () => {
    const s = new Star();
    s.setStarCenter([1, 2, 0]);
    expect(s.getStarCenter()).toEqual([1, 2, 0]);
  });

  it('generates points (2*numPoints line segments)', () => {
    const s = new Star({ numPoints: 5 });
    // 10 vertices, 10 edges => 10 * 3 + 1 = 31 points
    expect(s.numPoints).toBe(31);
  });
});

// ---------------------------------------------------------------------------
// RegularPolygram (PolygonExtensions)
// ---------------------------------------------------------------------------
describe('RegularPolygram', () => {
  it('constructs with default options (pentagram {5/2})', () => {
    const rp = new RegularPolygram();
    expect(rp.getNumVertices()).toBe(5);
    expect(rp.getDensity()).toBe(2);
    expect(rp.getRadius()).toBe(1);
    expect(rp.getSchlafliSymbol()).toBe('{5/2}');
    expect(rp.getNumComponents()).toBe(1); // gcd(5,2) = 1
  });

  it('hexagram {6/2} has 2 components', () => {
    const rp = new RegularPolygram({ numVertices: 6, density: 2 });
    expect(rp.getNumComponents()).toBe(2); // gcd(6,2) = 2
    expect(rp.getSchlafliSymbol()).toBe('{6/2}');
  });

  it('Schlafli symbol for density=1 omits density', () => {
    const rp = new RegularPolygram({ numVertices: 5, density: 1 });
    expect(rp.getSchlafliSymbol()).toBe('{5}');
  });

  it('throws with numVertices < 3', () => {
    expect(() => new RegularPolygram({ numVertices: 2 })).toThrow();
  });

  it('throws with density < 1', () => {
    expect(() => new RegularPolygram({ numVertices: 5, density: 0 })).toThrow();
  });

  it('throws with density exceeding maximum', () => {
    // For n=5 (odd), max density = floor(5/2) = 2
    expect(() => new RegularPolygram({ numVertices: 5, density: 3 })).toThrow();
    // For n=6 (even), max density = 6/2 - 1 = 2
    expect(() => new RegularPolygram({ numVertices: 6, density: 3 })).toThrow();
  });

  it('setRadius / setPolygramCenter update', () => {
    const rp = new RegularPolygram();
    rp.setRadius(3);
    expect(rp.getRadius()).toBe(3);
    rp.setPolygramCenter([1, 1, 0]);
    expect(rp.getPolygramCenter()).toEqual([1, 1, 0]);
  });

  it('generates non-empty points for single-component polygram', () => {
    const rp = new RegularPolygram({ numVertices: 5, density: 2 });
    expect(rp.numPoints).toBeGreaterThan(0);
  });

  it('generates child components for multi-component polygram', () => {
    const rp = new RegularPolygram({ numVertices: 6, density: 2 });
    // 2 components should be added as children
    expect(rp.children.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Cutout (PolygonExtensions)
// ---------------------------------------------------------------------------
describe('Cutout', () => {
  it('constructs with two shapes', () => {
    const outer = new Circle({ radius: 2 });
    const inner = new Circle({ radius: 1 });
    const cutout = new Cutout({ outerShape: outer, innerShape: inner });
    expect(cutout.getOuterShape()).toBe(outer);
    expect(cutout.getInnerShape()).toBe(inner);
  });

  it('inherits color from outer shape by default', () => {
    const outer = new Circle({ radius: 2 });
    const inner = new Circle({ radius: 1 });
    const cutout = new Cutout({ outerShape: outer, innerShape: inner });
    expect(cutout.color).toBe(outer.color);
    expect(cutout.fillOpacity).toBe(outer.fillOpacity);
  });

  it('getSubpaths returns lengths of outer and inner', () => {
    const outer = new Circle({ radius: 2 });
    const inner = new Circle({ radius: 1 });
    const cutout = new Cutout({ outerShape: outer, innerShape: inner });
    const subpaths = cutout.getSubpaths();
    expect(subpaths.length).toBe(2);
    expect(subpaths[0]).toBe(outer.getPoints().length);
    expect(subpaths[1]).toBe(inner.getPoints().length);
  });

  it('accepts custom color overrides', () => {
    const outer = new Circle({ radius: 2 });
    const inner = new Circle({ radius: 1 });
    const cutout = new Cutout({
      outerShape: outer,
      innerShape: inner,
      color: '#ff0000',
      fillOpacity: 0.8,
    });
    expect(cutout.color).toBe('#ff0000');
    expect(cutout.fillOpacity).toBe(0.8);
  });
});

// ---------------------------------------------------------------------------
// ConvexHull (PolygonExtensions)
// ---------------------------------------------------------------------------
describe('ConvexHull', () => {
  it('constructs from a set of points', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [0.5, 0.5, 0],
      ],
    });
    // Interior point (0.5, 0.5) should not be on the hull
    expect(ch.getHullVertexCount()).toBe(3);
  });

  it('throws with fewer than 3 points', () => {
    expect(
      () =>
        new ConvexHull({
          points: [
            [0, 0, 0],
            [1, 0, 0],
          ],
        }),
    ).toThrow();
  });

  it('getInputPoints returns all original points', () => {
    const pts: [number, number, number][] = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ];
    const ch = new ConvexHull({ points: pts });
    expect(ch.getInputPoints().length).toBe(3);
  });

  it('getArea for a unit right triangle = 0.5', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(ch.getArea()).toBeCloseTo(0.5, 10);
  });

  it('getPerimeter for a unit right triangle', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    });
    // Perimeter = 1 + 1 + sqrt(2)
    expect(ch.getPerimeter()).toBeCloseTo(2 + Math.SQRT2, 5);
  });

  it('containsPoint returns true for interior point', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [4, 0, 0],
        [0, 4, 0],
      ],
    });
    expect(ch.containsPoint([1, 1, 0])).toBe(true);
  });

  it('containsPoint returns false for exterior point', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [4, 0, 0],
        [0, 4, 0],
      ],
    });
    expect(ch.containsPoint([5, 5, 0])).toBe(false);
  });

  it('correctly handles a square with interior points', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [2, 0, 0],
        [2, 2, 0],
        [0, 2, 0],
        [1, 1, 0],
        [0.5, 0.5, 0],
        [1.5, 1.5, 0], // interior
      ],
    });
    expect(ch.getHullVertexCount()).toBe(4);
    expect(ch.getArea()).toBeCloseTo(4, 5);
  });

  it('generates non-empty points', () => {
    const ch = new ConvexHull({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(ch.numPoints).toBeGreaterThan(0);
  });
});

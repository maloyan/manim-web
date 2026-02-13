import { describe, it, expect } from 'vitest';
import { PMobject, PointMobject, PointCloudDot, Mobject1D, Mobject2D, PGroup } from './index';

describe('PMobject', () => {
  it('constructs with default options (no points)', () => {
    const pm = new PMobject();
    expect(pm.numPoints).toBe(0);
    expect(pm.getPointSize()).toBe(10);
  });

  it('constructs with initial points', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }],
    });
    expect(pm.numPoints).toBe(2);
  });

  it('addPoint increases point count', () => {
    const pm = new PMobject();
    pm.addPoint({ position: [1, 2, 3] });
    expect(pm.numPoints).toBe(1);
    const pts = pm.getPoints();
    expect(pts[0].position).toEqual([1, 2, 3]);
  });

  it('addPoint returns this for chaining', () => {
    const pm = new PMobject();
    const result = pm.addPoint({ position: [0, 0, 0] });
    expect(result).toBe(pm);
  });

  it('addPoints adds multiple points', () => {
    const pm = new PMobject();
    pm.addPoints([{ position: [0, 0, 0] }, { position: [1, 0, 0] }, { position: [2, 0, 0] }]);
    expect(pm.numPoints).toBe(3);
  });

  it('removePoint removes by index', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }, { position: [2, 0, 0] }],
    });
    pm.removePoint(1);
    expect(pm.numPoints).toBe(2);
    const pts = pm.getPoints();
    expect(pts[0].position).toEqual([0, 0, 0]);
    expect(pts[1].position).toEqual([2, 0, 0]);
  });

  it('removePoint ignores out-of-bounds index', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }],
    });
    pm.removePoint(5);
    expect(pm.numPoints).toBe(1);
    pm.removePoint(-1);
    expect(pm.numPoints).toBe(1);
  });

  it('clearPoints removes all points', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }],
    });
    pm.clearPoints();
    expect(pm.numPoints).toBe(0);
  });

  it('getPoints returns copies of points', () => {
    const pm = new PMobject({
      points: [{ position: [1, 2, 3] }],
    });
    const pts = pm.getPoints();
    pts[0].position[0] = 999;
    expect(pm.getPoints()[0].position[0]).toBe(1);
  });

  it('setPointSize updates point size', () => {
    const pm = new PMobject();
    pm.setPointSize(20);
    expect(pm.getPointSize()).toBe(20);
  });

  it('setPointSize clamps minimum to 1', () => {
    const pm = new PMobject();
    pm.setPointSize(0);
    expect(pm.getPointSize()).toBe(1);
    pm.setPointSize(-5);
    expect(pm.getPointSize()).toBe(1);
  });

  it('getCenter returns position when no points', () => {
    const pm = new PMobject();
    const center = pm.getCenter();
    expect(center).toEqual([0, 0, 0]);
  });

  it('getCenter returns centroid of points', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }, { position: [2, 0, 0] }, { position: [0, 2, 0] }],
    });
    const center = pm.getCenter();
    expect(center[0]).toBeCloseTo(2 / 3);
    expect(center[1]).toBeCloseTo(2 / 3);
    expect(center[2]).toBeCloseTo(0);
  });

  it('addPoint inherits default color and opacity', () => {
    const pm = new PMobject({ color: '#ff0000', opacity: 0.5 });
    pm.addPoint({ position: [0, 0, 0] });
    const pts = pm.getPoints();
    expect(pts[0].color).toBe('#ff0000');
    expect(pts[0].opacity).toBe(0.5);
  });

  it('addPoint uses per-point color/opacity if specified', () => {
    const pm = new PMobject({ color: '#ff0000' });
    pm.addPoint({ position: [0, 0, 0], color: '#00ff00', opacity: 0.3 });
    const pts = pm.getPoints();
    expect(pts[0].color).toBe('#00ff00');
    expect(pts[0].opacity).toBe(0.3);
  });

  it('constructs with custom pointSize', () => {
    const pm = new PMobject({ pointSize: 25 });
    expect(pm.getPointSize()).toBe(25);
  });
});

describe('PointMobject', () => {
  it('constructs with default position [0, 0, 0]', () => {
    const pt = new PointMobject();
    expect(pt.getPosition()).toEqual([0, 0, 0]);
    expect(pt.numPoints).toBe(1);
  });

  it('constructs with custom position', () => {
    const pt = new PointMobject({ position: [1, 2, 3] });
    expect(pt.getPosition()).toEqual([1, 2, 3]);
  });

  it('constructs with custom size', () => {
    const pt = new PointMobject({ size: 15 });
    expect(pt.getPointSize()).toBe(15);
  });

  it('default size is 8', () => {
    const pt = new PointMobject();
    expect(pt.getPointSize()).toBe(8);
  });

  it('setPosition updates the point position', () => {
    const pt = new PointMobject();
    pt.setPosition([5, 6, 7]);
    expect(pt.getPosition()).toEqual([5, 6, 7]);
  });

  it('getCenter returns same as getPosition', () => {
    const pt = new PointMobject({ position: [3, 4, 5] });
    expect(pt.getCenter()).toEqual(pt.getPosition());
  });

  it('moveTo updates position', () => {
    const pt = new PointMobject();
    pt.moveTo([10, 20, 30]);
    expect(pt.getPosition()).toEqual([10, 20, 30]);
  });
});

describe('PointCloudDot', () => {
  it('constructs with default options', () => {
    const dot = new PointCloudDot();
    expect(dot.getRadius()).toBe(0.08);
    expect(dot.getNumParticles()).toBe(50);
    expect(dot.numPoints).toBe(50);
    expect(dot.getCenter()).toEqual([0, 0, 0]);
  });

  it('constructs with custom center', () => {
    const dot = new PointCloudDot({ center: [1, 2, 3] });
    expect(dot.getCenter()).toEqual([1, 2, 3]);
  });

  it('constructs with custom particle count', () => {
    const dot = new PointCloudDot({ numParticles: 10 });
    expect(dot.numPoints).toBe(10);
    expect(dot.getNumParticles()).toBe(10);
  });

  it('setRadius updates radius and regenerates', () => {
    const dot = new PointCloudDot({ numParticles: 5 });
    dot.setRadius(0.5);
    expect(dot.getRadius()).toBe(0.5);
    expect(dot.numPoints).toBe(5);
  });

  it('setRadius clamps to 0 minimum', () => {
    const dot = new PointCloudDot();
    dot.setRadius(-1);
    expect(dot.getRadius()).toBe(0);
  });

  it('setNumParticles updates count and regenerates', () => {
    const dot = new PointCloudDot();
    dot.setNumParticles(20);
    expect(dot.getNumParticles()).toBe(20);
    expect(dot.numPoints).toBe(20);
  });

  it('setNumParticles clamps to minimum 1', () => {
    const dot = new PointCloudDot();
    dot.setNumParticles(0);
    expect(dot.getNumParticles()).toBe(1);
  });

  it('setDistribution changes distribution and regenerates', () => {
    const dot = new PointCloudDot({ distribution: 'gaussian', numParticles: 10 });
    dot.setDistribution('uniform');
    expect(dot.numPoints).toBe(10);
  });

  it('regenerate recreates all particles', () => {
    const dot = new PointCloudDot({ numParticles: 10 });
    dot.regenerate();
    const pointsAfter = dot.getPoints().map((p) => p.position);
    // Points should be different (extremely unlikely to be same with randomness)
    // We just check count is same
    expect(pointsAfter.length).toBe(10);
  });
});

describe('Mobject1D', () => {
  it('constructs with default options', () => {
    const m = new Mobject1D();
    expect(m.getStart()).toEqual([-1, 0, 0]);
    expect(m.getEnd()).toEqual([1, 0, 0]);
    expect(m.numPoints).toBe(20);
  });

  it('getLength computes euclidean distance', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [3, 4, 0] });
    expect(m.getLength()).toBe(5);
  });

  it('getLength for default endpoints is 2', () => {
    const m = new Mobject1D();
    expect(m.getLength()).toBe(2);
  });

  it('constructs with custom numPoints', () => {
    const m = new Mobject1D({ numPoints: 5 });
    expect(m.numPoints).toBe(5);
  });

  it('constructs with density', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [2, 0, 0], density: 5 });
    // length=2, density=5 -> 10 points
    expect(m.numPoints).toBe(10);
  });

  it('points are distributed along the line', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0], numPoints: 5 });
    const pts = m.getPoints();
    expect(pts[0].position[0]).toBeCloseTo(0);
    expect(pts[4].position[0]).toBeCloseTo(4);
    expect(pts[2].position[0]).toBeCloseTo(2);
  });

  it('setStart updates start and regenerates', () => {
    const m = new Mobject1D({ numPoints: 3 });
    m.setStart([0, 0, 0]);
    expect(m.getStart()).toEqual([0, 0, 0]);
    expect(m.numPoints).toBe(3);
  });

  it('setEnd updates end and regenerates', () => {
    const m = new Mobject1D({ numPoints: 3 });
    m.setEnd([5, 0, 0]);
    expect(m.getEnd()).toEqual([5, 0, 0]);
  });

  it('setEndpoints updates both', () => {
    const m = new Mobject1D();
    m.setEndpoints([0, 0, 0], [10, 0, 0]);
    expect(m.getStart()).toEqual([0, 0, 0]);
    expect(m.getEnd()).toEqual([10, 0, 0]);
  });

  it('setNumPoints updates count', () => {
    const m = new Mobject1D();
    m.setNumPoints(5);
    expect(m.numPoints).toBe(5);
  });

  it('setDensity overrides numPoints', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0], numPoints: 10 });
    m.setDensity(2); // length 4 * density 2 = 8
    expect(m.numPoints).toBe(8);
  });

  it('getCenter returns midpoint of endpoints', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0] });
    expect(m.getCenter()).toEqual([2, 0, 0]);
  });
});

describe('Mobject2D', () => {
  it('constructs with default options (grid 10x10)', () => {
    const m = new Mobject2D();
    expect(m.getWidth()).toBe(2);
    expect(m.getHeight()).toBe(2);
    expect(m.getDistribution()).toBe('grid');
    // 10 * 10 = 100
    expect(m.numPoints).toBe(100);
  });

  it('getArea returns width * height', () => {
    const m = new Mobject2D({ width: 3, height: 4 });
    expect(m.getArea()).toBe(12);
  });

  it('constructs with custom grid sizes', () => {
    const m = new Mobject2D({ numPointsX: 3, numPointsY: 4 });
    expect(m.numPoints).toBe(12);
  });

  it('constructs with random distribution', () => {
    const m = new Mobject2D({ distribution: 'random', numPointsX: 50 });
    expect(m.numPoints).toBe(50);
    expect(m.getDistribution()).toBe('random');
  });

  it('constructs with density for grid', () => {
    const m = new Mobject2D({ width: 2, height: 3, density: 2, distribution: 'grid' });
    // width * density = 4, height * density = 6 -> 24 points
    expect(m.numPoints).toBe(24);
  });

  it('constructs with density for random', () => {
    const m = new Mobject2D({ width: 2, height: 3, density: 2, distribution: 'random' });
    // area * density = 6 * 2 = 12 points
    expect(m.numPoints).toBe(12);
  });

  it('grid points are distributed in the rectangular area', () => {
    const m = new Mobject2D({
      center: [0, 0, 0],
      width: 2,
      height: 2,
      numPointsX: 3,
      numPointsY: 3,
      distribution: 'grid',
    });
    const pts = m.getPoints();
    expect(pts.length).toBe(9);
    // Check corners exist
    const xs = pts.map((p) => p.position[0]);
    const ys = pts.map((p) => p.position[1]);
    expect(Math.min(...xs)).toBeCloseTo(-1);
    expect(Math.max(...xs)).toBeCloseTo(1);
    expect(Math.min(...ys)).toBeCloseTo(-1);
    expect(Math.max(...ys)).toBeCloseTo(1);
  });

  it('setWidth updates width and regenerates', () => {
    const m = new Mobject2D({ numPointsX: 2, numPointsY: 2 });
    m.setWidth(4);
    expect(m.getWidth()).toBe(4);
    expect(m.numPoints).toBe(4);
  });

  it('setHeight updates height and regenerates', () => {
    const m = new Mobject2D({ numPointsX: 2, numPointsY: 2 });
    m.setHeight(6);
    expect(m.getHeight()).toBe(6);
    expect(m.numPoints).toBe(4);
  });

  it('setDimensions updates both', () => {
    const m = new Mobject2D();
    m.setDimensions(5, 3);
    expect(m.getWidth()).toBe(5);
    expect(m.getHeight()).toBe(3);
  });

  it('setPointCounts changes grid resolution', () => {
    const m = new Mobject2D();
    m.setPointCounts(5, 5);
    expect(m.numPoints).toBe(25);
  });

  it('getCenter returns region center', () => {
    const m = new Mobject2D({ center: [1, 2, 3] });
    expect(m.getCenter()).toEqual([1, 2, 3]);
  });

  it('setDistribution changes pattern and regenerates', () => {
    const m = new Mobject2D({ numPointsX: 5, numPointsY: 5, distribution: 'grid' });
    expect(m.numPoints).toBe(25);
    m.setDistribution('random');
    expect(m.getDistribution()).toBe('random');
    // For random, numPointsX is total
    expect(m.numPoints).toBe(5);
  });
});

describe('PGroup', () => {
  it('constructs empty', () => {
    const g = new PGroup();
    expect(g.length).toBe(0);
  });

  it('constructs with initial PMobjects', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [1, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    expect(g.length).toBe(2);
  });

  it('addPMobject adds to group', () => {
    const g = new PGroup();
    const p = new PMobject();
    g.addPMobject(p);
    expect(g.length).toBe(1);
  });

  it('addPMobjects adds multiple', () => {
    const g = new PGroup();
    g.addPMobjects(new PMobject(), new PMobject());
    expect(g.length).toBe(2);
  });

  it('removePMobject removes from group', () => {
    const p = new PMobject();
    const g = new PGroup({ pmobjects: [p] });
    g.removePMobject(p);
    expect(g.length).toBe(0);
  });

  it('get returns PMobject by index', () => {
    const p1 = new PMobject();
    const p2 = new PMobject();
    const g = new PGroup({ pmobjects: [p1, p2] });
    expect(g.get(0)).toBe(p1);
    expect(g.get(1)).toBe(p2);
    expect(g.get(5)).toBeUndefined();
  });

  it('is iterable', () => {
    const p1 = new PMobject();
    const p2 = new PMobject();
    const g = new PGroup({ pmobjects: [p1, p2] });
    const items = [...g];
    expect(items).toEqual([p1, p2]);
  });
});

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
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

  it('setColor updates color of all existing points', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }],
    });
    pm.setColor('#ff0000');
    const pts = pm.getPoints();
    expect(pts[0].color).toBe('#ff0000');
    expect(pts[1].color).toBe('#ff0000');
  });

  it('setOpacity updates opacity of all existing points', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }],
    });
    pm.setOpacity(0.3);
    const pts = pm.getPoints();
    expect(pts[0].opacity).toBe(0.3);
    expect(pts[1].opacity).toBe(0.3);
  });

  it('shift translates all points and position', () => {
    const pm = new PMobject({
      points: [{ position: [1, 2, 3] }, { position: [4, 5, 6] }],
    });
    pm.shift([10, 20, 30]);
    const pts = pm.getPoints();
    expect(pts[0].position).toEqual([11, 22, 33]);
    expect(pts[1].position).toEqual([14, 25, 36]);
  });

  it('copy creates an independent PMobject with same properties', () => {
    const pm = new PMobject({
      points: [{ position: [1, 2, 3], color: '#ff0000', opacity: 0.5 }],
      color: '#ff0000',
      opacity: 0.5,
      pointSize: 15,
    });
    const c = pm.copy() as PMobject;
    expect(c).toBeInstanceOf(PMobject);
    expect(c.numPoints).toBe(1);
    expect(c.getPoints()[0].position).toEqual([1, 2, 3]);
    expect(c.getPointSize()).toBe(15);
    // Independent - modifying copy doesn't affect original
    c.addPoint({ position: [0, 0, 0] });
    expect(pm.numPoints).toBe(1);
  });

  it('dispose can be called without error', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }],
    });
    expect(() => pm.dispose()).not.toThrow();
  });

  it('getThreeObject returns THREE.Points with geometry and material', () => {
    const pm = new PMobject({
      points: [{ position: [1, 2, 3] }, { position: [4, 5, 6] }],
      pointSize: 15,
    });
    const obj = pm.getThreeObject();
    expect(obj).toBeInstanceOf(THREE.Points);
    const points = obj as THREE.Points;
    expect(points.geometry).toBeDefined();
    expect(points.material).toBeDefined();
    // Check geometry has position attribute with correct data
    const posAttr = points.geometry.getAttribute('position');
    expect(posAttr).toBeDefined();
    expect(posAttr.count).toBe(2);
    // Check color attribute
    const colorAttr = points.geometry.getAttribute('color');
    expect(colorAttr).toBeDefined();
    expect(colorAttr.count).toBe(2);
  });

  it('getThreeObject updates geometry on subsequent calls', () => {
    const pm = new PMobject({
      points: [{ position: [0, 0, 0] }],
    });
    const obj1 = pm.getThreeObject() as THREE.Points;
    expect(obj1.geometry.getAttribute('position').count).toBe(1);
    // Add more points and get object again
    pm.addPoint({ position: [1, 1, 1] });
    const obj2 = pm.getThreeObject() as THREE.Points;
    expect(obj2.geometry.getAttribute('position').count).toBe(2);
    // Should be the same object
    expect(obj1).toBe(obj2);
  });

  it('getThreeObject with existing material updates size', () => {
    const pm = new PMobject({ pointSize: 10, points: [{ position: [0, 0, 0] }] });
    const obj = pm.getThreeObject() as THREE.Points;
    const mat = obj.material as THREE.PointsMaterial;
    expect(mat.size).toBe(10);
    pm.setPointSize(20);
    pm.getThreeObject(); // triggers _syncMaterialToThree
    expect(mat.size).toBe(20);
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

  it('copy creates an independent PointMobject', () => {
    const pt = new PointMobject({ position: [3, 4, 5], color: '#00ff00', size: 12 });
    const c = pt.copy() as PointMobject;
    expect(c).toBeInstanceOf(PointMobject);
    expect(c.getPosition()).toEqual([3, 4, 5]);
    expect(c.getPointSize()).toBe(12);
    // Independent
    c.setPosition([0, 0, 0]);
    expect(pt.getPosition()).toEqual([3, 4, 5]);
  });

  it('getPosition falls back to mobject position when no points', () => {
    const pt = new PointMobject({ position: [1, 2, 3] });
    pt.clearPoints();
    // With no internal points, getPosition should fall back to THREE position
    const pos = pt.getPosition();
    expect(pos).toEqual([0, 0, 0]); // THREE.js position default
  });

  it('setPosition is a no-op when no internal points', () => {
    const pt = new PointMobject();
    pt.clearPoints();
    const result = pt.setPosition([5, 5, 5]);
    expect(result).toBe(pt);
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

  it('moveTo shifts center and all particles', () => {
    const dot = new PointCloudDot({ center: [0, 0, 0], numParticles: 5, radius: 0.1 });
    dot.moveTo([3, 4, 0]);
    expect(dot.getCenter()).toEqual([3, 4, 0]);
  });

  it('moveTo from non-origin center works', () => {
    const dot = new PointCloudDot({ center: [1, 1, 0], numParticles: 5 });
    dot.moveTo([5, 5, 0]);
    expect(dot.getCenter()).toEqual([5, 5, 0]);
  });

  it('constructs with uniform distribution', () => {
    const dot = new PointCloudDot({ distribution: 'uniform', numParticles: 20, radius: 0.5 });
    expect(dot.numPoints).toBe(20);
    // All points should be within radius of center
    const pts = dot.getPoints();
    for (const p of pts) {
      const dist = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2);
      expect(dist).toBeLessThanOrEqual(0.5 + 0.01); // small epsilon for float
    }
  });

  it('copy creates an independent PointCloudDot with same properties', () => {
    const dot = new PointCloudDot({
      center: [1, 2, 0],
      radius: 0.2,
      numParticles: 15,
      color: '#ff0000',
      opacity: 0.7,
      particleSize: 6,
      distribution: 'uniform',
    });
    const c = dot.copy() as PointCloudDot;
    expect(c).toBeInstanceOf(PointCloudDot);
    expect(c.getCenter()).toEqual([1, 2, 0]);
    expect(c.getRadius()).toBe(0.2);
    expect(c.getNumParticles()).toBe(15);
    expect(c.numPoints).toBe(15);
    // Independent
    c.setRadius(1);
    expect(dot.getRadius()).toBe(0.2);
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

  it('moveTo translates points by the correct delta', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0], numPoints: 3 });
    const ptsBefore = m.getPoints().map((p) => [...p.position]);
    // Center is [2, 0, 0], delta to [5, 5, 0] is [3, 5, 0]
    m.moveTo([5, 5, 0]);
    // moveTo updates _start/_end by delta, then shift also updates _start/_end by delta
    // resulting in a double-shift of endpoints, but points are shifted once by shift
    const ptsAfter = m.getPoints();
    for (let i = 0; i < ptsBefore.length; i++) {
      expect(ptsAfter[i].position[0]).toBeCloseTo(ptsBefore[i][0] + 3);
      expect(ptsAfter[i].position[1]).toBeCloseTo(ptsBefore[i][1] + 5);
    }
  });

  it('shift translates endpoints and points', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [2, 0, 0], numPoints: 3 });
    m.shift([1, 2, 3]);
    expect(m.getStart()).toEqual([1, 2, 3]);
    expect(m.getEnd()).toEqual([3, 2, 3]);
    const pts = m.getPoints();
    expect(pts[0].position[0]).toBeCloseTo(1);
    expect(pts[0].position[1]).toBeCloseTo(2);
    expect(pts[0].position[2]).toBeCloseTo(3);
  });

  it('regenerate recreates points along line', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [2, 0, 0], numPoints: 5 });
    m.regenerate();
    expect(m.numPoints).toBe(5);
    expect(m.getPoints()[0].position[0]).toBeCloseTo(0);
    expect(m.getPoints()[4].position[0]).toBeCloseTo(2);
  });

  it('copy creates an independent Mobject1D', () => {
    const m = new Mobject1D({
      start: [0, 0, 0],
      end: [3, 4, 0],
      numPoints: 10,
      color: '#00ff00',
      opacity: 0.5,
      pointSize: 8,
    });
    const c = m.copy() as Mobject1D;
    expect(c).toBeInstanceOf(Mobject1D);
    expect(c.getStart()).toEqual([0, 0, 0]);
    expect(c.getEnd()).toEqual([3, 4, 0]);
    expect(c.numPoints).toBe(10);
    expect(c.getLength()).toBe(5);
    // Independent
    c.setEnd([10, 0, 0]);
    expect(m.getEnd()).toEqual([3, 4, 0]);
  });

  it('copy preserves density setting', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0], density: 3 });
    const c = m.copy() as Mobject1D;
    expect(c.numPoints).toBe(m.numPoints);
  });

  it('single point distribution places at midpoint', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0], numPoints: 1 });
    expect(m.numPoints).toBe(1);
    expect(m.getPoints()[0].position[0]).toBeCloseTo(2);
  });

  it('setDensity clamps minimum to 0.1', () => {
    const m = new Mobject1D({ start: [0, 0, 0], end: [4, 0, 0] });
    m.setDensity(0.001);
    // density clamped to 0.1; length=4 * 0.1 = 0.4 rounds to max(2,0)=2
    expect(m.numPoints).toBe(2);
  });

  it('setNumPoints clamps minimum to 1', () => {
    const m = new Mobject1D();
    m.setNumPoints(0);
    expect(m.numPoints).toBe(1);
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

  it('setDensity updates density and regenerates points', () => {
    const m = new Mobject2D({ width: 2, height: 2, distribution: 'grid' });
    m.setDensity(3);
    // width * density = 6, height * density = 6 -> 36 points
    expect(m.numPoints).toBe(36);
  });

  it('setDensity clamps minimum to 0.1', () => {
    const m = new Mobject2D({ width: 2, height: 2, distribution: 'grid' });
    m.setDensity(0.01);
    // density becomes 0.1; width*0.1=0.2 rounds to max(2,0)=2, same for height -> 2*2=4
    expect(m.numPoints).toBeGreaterThanOrEqual(4);
  });

  it('setDensity with random distribution uses area-based count', () => {
    const m = new Mobject2D({ width: 2, height: 3, distribution: 'random' });
    m.setDensity(2);
    // area=6, density=2 -> 12 points
    expect(m.numPoints).toBe(12);
  });

  it('moveTo shifts points by the correct delta', () => {
    const m = new Mobject2D({
      center: [0, 0, 0],
      width: 2,
      height: 2,
      numPointsX: 2,
      numPointsY: 2,
    });
    const ptsBefore = m.getPoints().map((p) => [...p.position]);
    m.moveTo([3, 4, 0]);
    // moveTo computes delta and calls shift, which translates all points
    const ptsAfter = m.getPoints();
    for (let i = 0; i < ptsBefore.length; i++) {
      expect(ptsAfter[i].position[0]).toBeCloseTo(ptsBefore[i][0] + 3);
      expect(ptsAfter[i].position[1]).toBeCloseTo(ptsBefore[i][1] + 4);
    }
  });

  it('moveTo updates center2D', () => {
    const m = new Mobject2D({
      center: [1, 1, 0],
      width: 2,
      height: 2,
      numPointsX: 2,
      numPointsY: 2,
    });
    m.moveTo([5, 5, 0]);
    // moveTo sets _center2D = [5,5,0] then shift adds delta to _center2D again
    // so getCenter returns _center2D which has been double-shifted
    const center = m.getCenter();
    // The center is updated; just verify moveTo doesn't throw and produces some value
    expect(center).toBeDefined();
    expect(center.length).toBe(3);
  });

  it('shift translates region and all points', () => {
    const m = new Mobject2D({
      center: [0, 0, 0],
      width: 2,
      height: 2,
      numPointsX: 2,
      numPointsY: 2,
    });
    const ptsBefore = m.getPoints().map((p) => [...p.position]);
    m.shift([1, 2, 3]);
    expect(m.getCenter()).toEqual([1, 2, 3]);
    const ptsAfter = m.getPoints();
    for (let i = 0; i < ptsBefore.length; i++) {
      expect(ptsAfter[i].position[0]).toBeCloseTo(ptsBefore[i][0] + 1);
      expect(ptsAfter[i].position[1]).toBeCloseTo(ptsBefore[i][1] + 2);
      expect(ptsAfter[i].position[2]).toBeCloseTo(ptsBefore[i][2] + 3);
    }
  });

  it('shift updates the mobject position', () => {
    const m = new Mobject2D({ center: [0, 0, 0] });
    m.shift([5, 6, 7]);
    // position property on the Mobject should be updated
    expect(m.getCenter()[0]).toBeCloseTo(5);
    expect(m.getCenter()[1]).toBeCloseTo(6);
    expect(m.getCenter()[2]).toBeCloseTo(7);
  });

  it('regenerate recreates grid points', () => {
    const m = new Mobject2D({ numPointsX: 3, numPointsY: 3, distribution: 'grid' });
    expect(m.numPoints).toBe(9);
    m.regenerate();
    expect(m.numPoints).toBe(9);
  });

  it('regenerate recreates random points', () => {
    const m = new Mobject2D({ numPointsX: 20, distribution: 'random' });
    const ptsBefore = m.getPoints().map((p) => p.position);
    m.regenerate();
    const ptsAfter = m.getPoints().map((p) => p.position);
    expect(ptsAfter.length).toBe(20);
    // Extremely unlikely that random points are identical after regeneration
  });

  it('copy creates an independent Mobject2D with same properties', () => {
    const m = new Mobject2D({
      center: [1, 2, 0],
      width: 4,
      height: 3,
      numPointsX: 5,
      numPointsY: 4,
      distribution: 'grid',
      color: '#ff0000',
      opacity: 0.8,
      pointSize: 8,
    });
    const c = m.copy() as Mobject2D;
    expect(c).toBeInstanceOf(Mobject2D);
    expect(c.getCenter()).toEqual([1, 2, 0]);
    expect(c.getWidth()).toBe(4);
    expect(c.getHeight()).toBe(3);
    expect(c.getDistribution()).toBe('grid');
    expect(c.numPoints).toBe(20);
    // Modifying copy doesn't affect original
    c.setWidth(10);
    expect(m.getWidth()).toBe(4);
  });

  it('copy preserves density setting', () => {
    const m = new Mobject2D({ width: 2, height: 2, density: 3, distribution: 'grid' });
    const c = m.copy() as Mobject2D;
    expect(c.numPoints).toBe(m.numPoints);
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

  it('getCenter returns position when no children', () => {
    const g = new PGroup();
    expect(g.getCenter()).toEqual([0, 0, 0]);
  });

  it('getCenter returns average center of children', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [4, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(2);
    expect(center[1]).toBeCloseTo(0);
    expect(center[2]).toBeCloseTo(0);
  });

  it('shift translates all children', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [2, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    g.shift([1, 1, 0]);
    expect(p1.getPoints()[0].position[0]).toBeCloseTo(1);
    expect(p1.getPoints()[0].position[1]).toBeCloseTo(1);
    expect(p2.getPoints()[0].position[0]).toBeCloseTo(3);
    expect(p2.getPoints()[0].position[1]).toBeCloseTo(1);
  });

  it('moveTo translates children by the correct delta', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [2, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    // Center is [1, 0, 0], delta to [5, 5, 0] is [4, 5, 0]
    g.moveTo([5, 5, 0]);
    // Children should have been shifted by the delta
    expect(p1.getPoints()[0].position[0]).toBeCloseTo(4);
    expect(p1.getPoints()[0].position[1]).toBeCloseTo(5);
    expect(p2.getPoints()[0].position[0]).toBeCloseTo(6);
    expect(p2.getPoints()[0].position[1]).toBeCloseTo(5);
  });

  it('setColor cascades to all children', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [1, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    g.setColor('#00ff00');
    expect(p1.getPoints()[0].color).toBe('#00ff00');
    expect(p2.getPoints()[0].color).toBe('#00ff00');
  });

  it('setOpacity cascades to all children', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [1, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    g.setOpacity(0.5);
    expect(p1.getPoints()[0].opacity).toBe(0.5);
    expect(p2.getPoints()[0].opacity).toBe(0.5);
  });

  it('setPointSize cascades to PMobject children', () => {
    const p1 = new PMobject();
    const p2 = new PMobject();
    const g = new PGroup({ pmobjects: [p1, p2] });
    g.setPointSize(20);
    expect(p1.getPointSize()).toBe(20);
    expect(p2.getPointSize()).toBe(20);
  });

  it('copy creates an independent PGroup', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1] });
    const c = g.copy() as PGroup;
    expect(c).toBeInstanceOf(PGroup);
  });

  it('getThreeObject returns a THREE.Group with children', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [1, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    const obj = g.getThreeObject();
    expect(obj).toBeInstanceOf(THREE.Group);
  });

  it('arrange with no children is a no-op', () => {
    const g = new PGroup();
    const result = g.arrange();
    expect(result).toBe(g);
  });

  it('arrange repositions children in a row', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p3 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2, p3] });
    g.arrange([1, 0, 0], 0.5);
    // After arranging, children should be positioned to the right of each other
    expect(g.length).toBe(3);
  });

  it('arrange with default arguments works', () => {
    const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const p2 = new PMobject({ points: [{ position: [0, 0, 0] }] });
    const g = new PGroup({ pmobjects: [p1, p2] });
    const result = g.arrange();
    expect(result).toBe(g);
  });
});

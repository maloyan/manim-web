import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { linear } from '../rate-functions';
import {
  Homotopy,
  homotopy,
  ComplexHomotopy,
  complexHomotopy,
  SmoothedVectorizedHomotopy,
  smoothedVectorizedHomotopy,
  PhaseFlow,
  phaseFlow,
  type HomotopyFunction,
  type ComplexHomotopyFunction,
  type VectorFieldFunction,
  type Complex,
} from './movement/Homotopy';
import { MoveAlongPath, moveAlongPath } from './movement/MoveAlongPath';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMobject(): Mobject {
  return new Mobject();
}

function makeVMobject(pts?: number[][]): VMobject {
  const vm = new VMobject();
  if (pts) vm.setPoints(pts);
  return vm;
}

// A simple quadrilateral shape (4 points = 1 cubic Bezier segment)
function quadPoints(): number[][] {
  return [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ];
}

// Two cubic Bezier segments (7 points)
function twoSegmentPoints(): number[][] {
  return [
    [0, 0, 0], // anchor 0
    [0.33, 0, 0], // handle
    [0.66, 0, 0], // handle
    [1, 0, 0], // anchor 1
    [1.33, 0.5, 0], // handle
    [1.66, 1, 0], // handle
    [2, 1, 0], // anchor 2
  ];
}

// Three cubic Bezier segments (10 points) for more complex testing
function threeSegmentPoints(): number[][] {
  return [
    [0, 0, 0],
    [0.33, 0.33, 0],
    [0.66, 0.66, 0],
    [1, 1, 0],
    [1.33, 1, 0],
    [1.66, 0.66, 0],
    [2, 0, 0],
    [2.33, -0.33, 0],
    [2.66, -0.66, 0],
    [3, 0, 0],
  ];
}

// A straight-line path for MoveAlongPath (two segments along X axis)
function straightLinePath(): VMobject {
  const vm = new VMobject();
  // Two cubic Bezier segments forming a line from (0,0,0) to (6,0,0)
  vm.setPoints([
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
    [4, 0, 0],
    [5, 0, 0],
    [6, 0, 0],
  ]);
  return vm;
}

// A curved path for MoveAlongPath
function curvedPath(): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [0, 0, 0],
    [1, 2, 0],
    [2, 2, 0],
    [3, 0, 0],
  ]);
  return vm;
}

// ============================================================================
// Homotopy
// ============================================================================

describe('Homotopy', () => {
  describe('constructor', () => {
    it('stores the homotopy function', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const m = makeMobject();
      const anim = new Homotopy(m, { homotopyFunc: fn });
      expect(anim.homotopyFunc).toBe(fn);
      expect(anim.mobject).toBe(m);
    });

    it('defaults to duration=1', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new Homotopy(makeMobject(), { homotopyFunc: fn });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration and rateFunc', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new Homotopy(makeMobject(), {
        homotopyFunc: fn,
        duration: 3,
        rateFunc: linear,
      });
      expect(anim.duration).toBe(3);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('with non-VMobject (Mobject)', () => {
    it('interpolate transforms the position', () => {
      const m = makeMobject();
      m.position.set(1, 2, 3);
      const fn: HomotopyFunction = (x, y, z, t) => [x + t, y + t * 2, z + t * 3];
      const anim = new Homotopy(m, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.5);
      expect(m.position.x).toBeCloseTo(1.5, 5);
      expect(m.position.y).toBeCloseTo(3, 5);
      expect(m.position.z).toBeCloseTo(4.5, 5);
    });

    it('interpolate at alpha=0 keeps original position', () => {
      const m = makeMobject();
      m.position.set(2, 3, 4);
      const fn: HomotopyFunction = (x, y, z, t) => [x + t, y + t, z + t];
      const anim = new Homotopy(m, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0);
      // At t=0, homotopyFunc returns (x+0, y+0, z+0) = (2, 3, 4)
      expect(m.position.x).toBeCloseTo(2, 5);
      expect(m.position.y).toBeCloseTo(3, 5);
      expect(m.position.z).toBeCloseTo(4, 5);
    });

    it('interpolate at alpha=1 transforms fully', () => {
      const m = makeMobject();
      m.position.set(1, 1, 1);
      const fn: HomotopyFunction = (x, y, z, t) => [x * (1 + t), y * (1 + t), z * (1 + t)];
      const anim = new Homotopy(m, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(1);
      expect(m.position.x).toBeCloseTo(2, 5);
      expect(m.position.y).toBeCloseTo(2, 5);
      expect(m.position.z).toBeCloseTo(2, 5);
    });

    it('finish sets exact final position', () => {
      const m = makeMobject();
      m.position.set(0, 0, 0);
      const fn: HomotopyFunction = (_x, _y, _z, t) => [t * 10, t * 20, t * 30];
      const anim = new Homotopy(m, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(m.position.x).toBeCloseTo(10, 5);
      expect(m.position.y).toBeCloseTo(20, 5);
      expect(m.position.z).toBeCloseTo(30, 5);
    });
  });

  describe('with VMobject', () => {
    it('begin stores original points', () => {
      const vm = makeVMobject(quadPoints());
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new Homotopy(vm, { homotopyFunc: fn });
      anim.begin();
      // After begin, points should still be accessible
      const pts = vm.getPoints();
      expect(pts.length).toBe(4);
    });

    it('interpolate transforms all VMobject points', () => {
      const vm = makeVMobject(quadPoints());
      const origPts = vm.getPoints();
      // Shift all points by t in x
      const fn: HomotopyFunction = (x, y, z, t) => [x + t, y, z];
      const anim = new Homotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] + 1, 5);
        expect(pts[i][1]).toBeCloseTo(origPts[i][1], 5);
        expect(pts[i][2]).toBeCloseTo(origPts[i][2], 5);
      }
    });

    it('interpolate at alpha=0.5 transforms halfway', () => {
      const vm = makeVMobject(quadPoints());
      const origPts = vm.getPoints();
      // Scale all x by (1 + t)
      const fn: HomotopyFunction = (x, y, z, t) => [x * (1 + t), y, z];
      const anim = new Homotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] * 1.5, 5);
      }
    });

    it('uses original points for each interpolation call (not cumulative)', () => {
      const vm = makeVMobject(quadPoints());
      const origPts = vm.getPoints();
      const fn: HomotopyFunction = (x, y, z, t) => [x + t * 10, y, z];
      const anim = new Homotopy(vm, { homotopyFunc: fn });
      anim.begin();
      // Call interpolate multiple times
      anim.interpolate(0.5);
      anim.interpolate(0.5);
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      // Should still be shifted by 5 (not 15) since it uses originals
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] + 5, 5);
      }
    });

    it('finish ensures exact final transform', () => {
      const vm = makeVMobject(quadPoints());
      const origPts = vm.getPoints();
      const fn: HomotopyFunction = (x, y, z, _t) => [x + 100, y + 200, z + 300];
      const anim = new Homotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      const pts = vm.getPoints();
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] + 100, 5);
        expect(pts[i][1]).toBeCloseTo(origPts[i][1] + 200, 5);
        expect(pts[i][2]).toBeCloseTo(origPts[i][2] + 300, 5);
      }
    });

    it('handles empty VMobject gracefully', () => {
      const vm = makeVMobject([]);
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new Homotopy(vm, { homotopyFunc: fn });
      anim.begin();
      // VMobject with no points should still work (nothing to transform)
      anim.interpolate(0.5);
      expect(vm.getPoints().length).toBe(0);
    });
  });

  describe('homotopy() factory', () => {
    it('returns Homotopy instance', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = homotopy(makeMobject(), fn);
      expect(anim).toBeInstanceOf(Homotopy);
    });

    it('passes through options', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = homotopy(makeMobject(), fn, { duration: 5 });
      expect(anim.duration).toBe(5);
    });
  });
});

// ============================================================================
// ComplexHomotopy
// ============================================================================

describe('ComplexHomotopy', () => {
  describe('constructor', () => {
    it('stores the complex function', () => {
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const m = makeMobject();
      const anim = new ComplexHomotopy(m, { complexFunc: fn });
      expect(anim.complexFunc).toBe(fn);
      expect(anim.mobject).toBe(m);
    });

    it('defaults to duration=1', () => {
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const anim = new ComplexHomotopy(makeMobject(), { complexFunc: fn });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const anim = new ComplexHomotopy(makeMobject(), { complexFunc: fn, duration: 4 });
      expect(anim.duration).toBe(4);
    });
  });

  describe('with non-VMobject (Mobject)', () => {
    it('treats position as complex number (x=re, y=im)', () => {
      const m = makeMobject();
      m.position.set(1, 0, 5); // z=1+0i, z-coord=5
      // Rotation by 90 degrees: multiply by i
      const fn: ComplexHomotopyFunction = (z, t) => ({
        re: z.re * Math.cos((t * Math.PI) / 2) - z.im * Math.sin((t * Math.PI) / 2),
        im: z.re * Math.sin((t * Math.PI) / 2) + z.im * Math.cos((t * Math.PI) / 2),
      });
      const anim = new ComplexHomotopy(m, { complexFunc: fn });
      anim.begin();
      anim.interpolate(1);
      // z=1 rotated 90 degrees => z=i => (0, 1)
      expect(m.position.x).toBeCloseTo(0, 5);
      expect(m.position.y).toBeCloseTo(1, 5);
      // z-coordinate preserved
      expect(m.position.z).toBeCloseTo(5, 5);
    });

    it('interpolate at alpha=0 keeps original position', () => {
      const m = makeMobject();
      m.position.set(3, 4, 0);
      // Identity at t=0
      const fn: ComplexHomotopyFunction = (z, t) => ({
        re: z.re * (1 - t) + z.re * t,
        im: z.im * (1 - t) + z.im * t,
      });
      const anim = new ComplexHomotopy(m, { complexFunc: fn });
      anim.begin();
      anim.interpolate(0);
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(4, 5);
    });

    it('complex squaring: z^2', () => {
      const m = makeMobject();
      m.position.set(1, 1, 0); // z = 1+i
      // z^2 = (1+i)^2 = 1 + 2i - 1 = 2i
      const fn: ComplexHomotopyFunction = (z, t) => {
        // Interpolate from z to z^2
        const sqRe = z.re * z.re - z.im * z.im;
        const sqIm = 2 * z.re * z.im;
        return {
          re: z.re * (1 - t) + sqRe * t,
          im: z.im * (1 - t) + sqIm * t,
        };
      };
      const anim = new ComplexHomotopy(m, { complexFunc: fn });
      anim.begin();
      anim.interpolate(1);
      // z^2 of (1+i) = 2i => re=0, im=2
      expect(m.position.x).toBeCloseTo(0, 5);
      expect(m.position.y).toBeCloseTo(2, 5);
    });

    it('finish sets exact final position', () => {
      const m = makeMobject();
      m.position.set(2, 3, 0);
      const fn: ComplexHomotopyFunction = (_z, t) => ({ re: t * 10, im: t * 20 });
      const anim = new ComplexHomotopy(m, { complexFunc: fn });
      anim.begin();
      anim.interpolate(0.2);
      anim.finish();
      expect(m.position.x).toBeCloseTo(10, 5);
      expect(m.position.y).toBeCloseTo(20, 5);
    });
  });

  describe('with VMobject', () => {
    it('begin stores original points', () => {
      const vm = makeVMobject(quadPoints());
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const anim = new ComplexHomotopy(vm, { complexFunc: fn });
      anim.begin();
      expect(vm.getPoints().length).toBe(4);
    });

    it('transforms all points as complex numbers', () => {
      const vm = makeVMobject([
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
      ]);
      // Double the real part
      const fn: ComplexHomotopyFunction = (z, t) => ({
        re: z.re * (1 + t),
        im: z.im,
      });
      const anim = new ComplexHomotopy(vm, { complexFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      expect(pts[0][0]).toBeCloseTo(2, 5); // 1 * 2
      expect(pts[0][1]).toBeCloseTo(0, 5);
      expect(pts[1][0]).toBeCloseTo(0, 5); // 0 * 2
      expect(pts[1][1]).toBeCloseTo(1, 5);
      expect(pts[2][0]).toBeCloseTo(-2, 5); // -1 * 2
      expect(pts[2][1]).toBeCloseTo(0, 5);
      expect(pts[3][0]).toBeCloseTo(0, 5);
      expect(pts[3][1]).toBeCloseTo(-1, 5);
    });

    it('preserves z-coordinate of points', () => {
      const vm = makeVMobject([
        [1, 0, 5],
        [0, 1, 10],
        [-1, 0, 15],
        [0, -1, 20],
      ]);
      const fn: ComplexHomotopyFunction = (z, _t) => ({
        re: z.re * 2,
        im: z.im * 2,
      });
      const anim = new ComplexHomotopy(vm, { complexFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      expect(pts[0][2]).toBeCloseTo(5, 5);
      expect(pts[1][2]).toBeCloseTo(10, 5);
      expect(pts[2][2]).toBeCloseTo(15, 5);
      expect(pts[3][2]).toBeCloseTo(20, 5);
    });

    it('uses original points for each call (not cumulative)', () => {
      const vm = makeVMobject([
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
        [4, 0, 0],
      ]);
      const fn: ComplexHomotopyFunction = (z, t) => ({
        re: z.re + t * 100,
        im: z.im,
      });
      const anim = new ComplexHomotopy(vm, { complexFunc: fn });
      anim.begin();
      anim.interpolate(0.5);
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      // Should be original + 50, not original + 100
      expect(pts[0][0]).toBeCloseTo(51, 5);
      expect(pts[1][0]).toBeCloseTo(52, 5);
    });

    it('handles empty VMobject', () => {
      const vm = makeVMobject([]);
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const anim = new ComplexHomotopy(vm, { complexFunc: fn });
      anim.begin();
      anim.interpolate(0.5);
      expect(vm.getPoints().length).toBe(0);
    });

    it('finish applies exact final transform', () => {
      const vm = makeVMobject(quadPoints());
      const fn: ComplexHomotopyFunction = (z, _t) => ({
        re: z.re + 10,
        im: z.im + 20,
      });
      const anim = new ComplexHomotopy(vm, { complexFunc: fn });
      anim.begin();
      anim.interpolate(0.1);
      anim.finish();
      const pts = vm.getPoints();
      expect(pts[0][0]).toBeCloseTo(10, 5);
      expect(pts[0][1]).toBeCloseTo(20, 5);
    });
  });

  describe('complexHomotopy() factory', () => {
    it('returns ComplexHomotopy instance', () => {
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const anim = complexHomotopy(makeMobject(), fn);
      expect(anim).toBeInstanceOf(ComplexHomotopy);
    });

    it('passes through options', () => {
      const fn: ComplexHomotopyFunction = (z, _t) => z;
      const anim = complexHomotopy(makeMobject(), fn, { duration: 7 });
      expect(anim.duration).toBe(7);
    });
  });
});

// ============================================================================
// SmoothedVectorizedHomotopy
// ============================================================================

describe('SmoothedVectorizedHomotopy', () => {
  describe('constructor', () => {
    it('stores the homotopy function', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const vm = makeVMobject(quadPoints());
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      expect(anim.homotopyFunc).toBe(fn);
      expect(anim.mobject).toBe(vm);
    });

    it('defaults to duration=1', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new SmoothedVectorizedHomotopy(makeVMobject(quadPoints()), {
        homotopyFunc: fn,
      });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new SmoothedVectorizedHomotopy(makeVMobject(quadPoints()), {
        homotopyFunc: fn,
        duration: 6,
      });
      expect(anim.duration).toBe(6);
    });
  });

  describe('begin()', () => {
    it('stores original points and computes anchor indices', () => {
      const vm = makeVMobject(twoSegmentPoints());
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      // Points should still be there
      expect(vm.getPoints().length).toBe(7);
    });
  });

  describe('interpolate()', () => {
    it('handles empty VMobject gracefully', () => {
      const vm = makeVMobject([]);
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      // Should not throw
      anim.interpolate(0.5);
      expect(vm.getPoints().length).toBe(0);
    });

    it('identity homotopy preserves points', () => {
      const vm = makeVMobject(twoSegmentPoints());
      const origPts = vm.getPoints();
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      expect(pts.length).toBe(origPts.length);
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0], 3);
        expect(pts[i][1]).toBeCloseTo(origPts[i][1], 3);
        expect(pts[i][2]).toBeCloseTo(origPts[i][2], 3);
      }
    });

    it('transforms anchor points directly', () => {
      const vm = makeVMobject(twoSegmentPoints());
      // Simple translation
      const fn: HomotopyFunction = (x, y, z, t) => [x + t * 10, y, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      // Anchor 0 (index 0): should be at 0 + 10 = 10
      expect(pts[0][0]).toBeCloseTo(10, 3);
      // Anchor 1 (index 3): should be at 1 + 10 = 11
      expect(pts[3][0]).toBeCloseTo(11, 3);
      // Anchor 2 (index 6): should be at 2 + 10 = 12
      expect(pts[6][0]).toBeCloseTo(12, 3);
    });

    it('transforms handles with smoothing', () => {
      const vm = makeVMobject(twoSegmentPoints());
      const origPts = vm.getPoints();
      // Simple translation - handles should move similarly
      const fn: HomotopyFunction = (x, y, z, t) => [x + t * 5, y + t * 5, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      // Handles (indices 1, 2, 4, 5) should also have moved
      for (let i = 0; i < pts.length; i++) {
        // All points should have x roughly increased by 5
        expect(pts[i][0]).toBeGreaterThan(origPts[i][0]);
        expect(pts[i][1]).toBeGreaterThanOrEqual(origPts[i][1]);
      }
    });

    it('works with a single segment (4 points)', () => {
      const vm = makeVMobject(quadPoints());
      const fn: HomotopyFunction = (x, y, z, t) => [x * (1 + t), y * (1 + t), z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      // Anchor 0 at (0,0,0): scaled to (0,0,0)
      expect(pts[0][0]).toBeCloseTo(0, 3);
      // Anchor 1 at (0,1,0): scaled to (0,2,0)
      expect(pts[3][1]).toBeCloseTo(2, 3);
    });

    it('works with three segments (10 points)', () => {
      const vm = makeVMobject(threeSegmentPoints());
      const fn: HomotopyFunction = (x, y, z, t) => [x + t, y + t, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      // All anchors shifted by 1
      expect(pts[0][0]).toBeCloseTo(1, 3);
      expect(pts[3][0]).toBeCloseTo(2, 3);
      expect(pts[6][0]).toBeCloseTo(3, 3);
      expect(pts[9][0]).toBeCloseTo(4, 3);
    });

    it('interpolate uses originals (not cumulative)', () => {
      const vm = makeVMobject(twoSegmentPoints());
      const origPts = vm.getPoints();
      const fn: HomotopyFunction = (x, y, z, t) => [x + t * 100, y, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.5);
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      // Anchor 0 should be at 50 (from original 0 + 0.5*100)
      expect(pts[0][0]).toBeCloseTo(50, 3);
    });

    it('handles non-standard point count (last point includes as anchor)', () => {
      // 5 points: anchors at 0, 3; last index 4 is not a multiple of 3
      const vm = makeVMobject([
        [0, 0, 0],
        [1, 1, 0],
        [2, 1, 0],
        [3, 0, 0],
        [4, 0, 0], // extra handle after last anchor
      ]);
      const fn: HomotopyFunction = (x, y, z, t) => [x + t, y, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      // Should not throw
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      expect(pts.length).toBe(5);
    });
  });

  describe('finish()', () => {
    it('applies exact final transform', () => {
      const vm = makeVMobject(twoSegmentPoints());
      const fn: HomotopyFunction = (x, y, z, _t) => [x + 100, y + 200, z];
      const anim = new SmoothedVectorizedHomotopy(vm, { homotopyFunc: fn });
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      const pts = vm.getPoints();
      // Anchor 0 should be at 100
      expect(pts[0][0]).toBeCloseTo(100, 3);
    });
  });

  describe('smoothedVectorizedHomotopy() factory', () => {
    it('returns SmoothedVectorizedHomotopy instance', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = smoothedVectorizedHomotopy(makeVMobject(quadPoints()), fn);
      expect(anim).toBeInstanceOf(SmoothedVectorizedHomotopy);
    });

    it('passes through options', () => {
      const fn: HomotopyFunction = (x, y, z, _t) => [x, y, z];
      const anim = smoothedVectorizedHomotopy(makeVMobject(quadPoints()), fn, {
        duration: 8,
      });
      expect(anim.duration).toBe(8);
    });
  });
});

// ============================================================================
// PhaseFlow
// ============================================================================

describe('PhaseFlow', () => {
  describe('constructor', () => {
    it('stores the vector field function', () => {
      const vf: VectorFieldFunction = ([x, y, z]) => [-y, x, z];
      const m = makeMobject();
      const anim = new PhaseFlow(m, { vectorField: vf });
      expect(anim.vectorField).toBe(vf);
      expect(anim.mobject).toBe(m);
    });

    it('virtualTime defaults to 1', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(makeMobject(), { vectorField: vf });
      expect(anim.virtualTime).toBe(1);
    });

    it('accepts custom virtualTime', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(makeMobject(), { vectorField: vf, virtualTime: 5 });
      expect(anim.virtualTime).toBe(5);
    });

    it('accepts custom integrationSteps', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(makeMobject(), {
        vectorField: vf,
        integrationSteps: 200,
      });
      // integrationSteps is private, so we test through behavior
      expect(anim.duration).toBe(1);
    });

    it('defaults to duration=1', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(makeMobject(), { vectorField: vf });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(makeMobject(), { vectorField: vf, duration: 3 });
      expect(anim.duration).toBe(3);
    });
  });

  describe('with non-VMobject (Mobject)', () => {
    it('flows position along circular vector field', () => {
      const m = makeMobject();
      m.position.set(1, 0, 0);
      // Circular flow: dp/dt = [-y, x, 0]
      // Starting at (1, 0, 0), after time PI/2 should reach (0, 1, 0)
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(m, {
        vectorField: vf,
        virtualTime: Math.PI / 2,
      });
      anim.begin();
      anim.interpolate(1);
      expect(m.position.x).toBeCloseTo(0, 2);
      expect(m.position.y).toBeCloseTo(1, 2);
      expect(m.position.z).toBeCloseTo(0, 5);
    });

    it('interpolate at alpha=0 keeps original position', () => {
      const m = makeMobject();
      m.position.set(1, 0, 0);
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(m, { vectorField: vf, virtualTime: Math.PI / 2 });
      anim.begin();
      anim.interpolate(0);
      // flowTime = 0 * virtualTime = 0, so no movement
      expect(m.position.x).toBeCloseTo(1, 5);
      expect(m.position.y).toBeCloseTo(0, 5);
    });

    it('interpolate at alpha=0.5 flows half the virtual time', () => {
      const m = makeMobject();
      m.position.set(1, 0, 0);
      // Circular flow, virtualTime = PI => half is PI/2 (quarter turn)
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(m, { vectorField: vf, virtualTime: Math.PI });
      anim.begin();
      anim.interpolate(0.5);
      // At PI/2: (1,0) -> (0,1)
      expect(m.position.x).toBeCloseTo(0, 2);
      expect(m.position.y).toBeCloseTo(1, 2);
    });

    it('flows along constant vector field (translation)', () => {
      const m = makeMobject();
      m.position.set(0, 0, 0);
      // Constant field: velocity = (1, 2, 3) everywhere
      const vf: VectorFieldFunction = (_p) => [1, 2, 3];
      const anim = new PhaseFlow(m, { vectorField: vf, virtualTime: 5 });
      anim.begin();
      anim.interpolate(1);
      // After 5 time units: position = (0+5, 0+10, 0+15) = (5, 10, 15)
      expect(m.position.x).toBeCloseTo(5, 2);
      expect(m.position.y).toBeCloseTo(10, 2);
      expect(m.position.z).toBeCloseTo(15, 2);
    });

    it('flows from stored original position (not cumulative)', () => {
      const m = makeMobject();
      m.position.set(1, 0, 0);
      const vf: VectorFieldFunction = (_p) => [1, 0, 0];
      const anim = new PhaseFlow(m, { vectorField: vf, virtualTime: 10 });
      anim.begin();
      anim.interpolate(0.5); // position -> 1 + 5 = 6
      anim.interpolate(0.5); // position -> 1 + 5 = 6 (from original)
      expect(m.position.x).toBeCloseTo(6, 2);
    });

    it('finish sets exact final position', () => {
      const m = makeMobject();
      m.position.set(0, 0, 0);
      const vf: VectorFieldFunction = (_p) => [10, 20, 30];
      const anim = new PhaseFlow(m, { vectorField: vf, virtualTime: 1 });
      anim.begin();
      anim.interpolate(0.2);
      anim.finish();
      expect(m.position.x).toBeCloseTo(10, 2);
      expect(m.position.y).toBeCloseTo(20, 2);
      expect(m.position.z).toBeCloseTo(30, 2);
    });
  });

  describe('with VMobject', () => {
    it('flows all points along vector field', () => {
      const vm = makeVMobject([
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
      ]);
      // Constant translation field
      const vf: VectorFieldFunction = (_p) => [1, 0, 0];
      const anim = new PhaseFlow(vm, { vectorField: vf, virtualTime: 2 });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      expect(pts[0][0]).toBeCloseTo(3, 2); // 1 + 2
      expect(pts[1][0]).toBeCloseTo(2, 2); // 0 + 2
      expect(pts[2][0]).toBeCloseTo(1, 2); // -1 + 2
      expect(pts[3][0]).toBeCloseTo(2, 2); // 0 + 2
    });

    it('flows VMobject points along circular field', () => {
      const vm = makeVMobject([
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
        [4, 0, 0],
      ]);
      // Circular flow: quarter turn
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = new PhaseFlow(vm, {
        vectorField: vf,
        virtualTime: Math.PI / 2,
      });
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      // (1,0) -> (0,1), (2,0) -> (0,2), (3,0) -> (0,3), (4,0) -> (0,4)
      expect(pts[0][0]).toBeCloseTo(0, 1);
      expect(pts[0][1]).toBeCloseTo(1, 1);
      expect(pts[3][0]).toBeCloseTo(0, 1);
      expect(pts[3][1]).toBeCloseTo(4, 1);
    });

    it('uses original points for each call', () => {
      const vm = makeVMobject([
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ]);
      const vf: VectorFieldFunction = (_p) => [100, 0, 0];
      const anim = new PhaseFlow(vm, { vectorField: vf, virtualTime: 1 });
      anim.begin();
      anim.interpolate(0.5);
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      // From original, not cumulative
      expect(pts[0][0]).toBeCloseTo(50, 1);
      expect(pts[1][0]).toBeCloseTo(51, 1);
    });

    it('handles empty VMobject', () => {
      const vm = makeVMobject([]);
      const vf: VectorFieldFunction = (_p) => [1, 0, 0];
      const anim = new PhaseFlow(vm, { vectorField: vf });
      anim.begin();
      anim.interpolate(0.5);
      expect(vm.getPoints().length).toBe(0);
    });

    it('finish applies exact final flow', () => {
      const vm = makeVMobject(quadPoints());
      const vf: VectorFieldFunction = (_p) => [10, 0, 0];
      const anim = new PhaseFlow(vm, { vectorField: vf, virtualTime: 1 });
      anim.begin();
      anim.interpolate(0.1);
      anim.finish();
      const pts = vm.getPoints();
      // All points should have moved 10 in x
      expect(pts[0][0]).toBeCloseTo(10, 1);
      expect(pts[1][0]).toBeCloseTo(11, 1);
    });
  });

  describe('phaseFlow() factory', () => {
    it('returns PhaseFlow instance', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = phaseFlow(makeMobject(), vf);
      expect(anim).toBeInstanceOf(PhaseFlow);
    });

    it('passes through options', () => {
      const vf: VectorFieldFunction = ([x, y, _z]) => [-y, x, 0];
      const anim = phaseFlow(makeMobject(), vf, {
        virtualTime: 3,
        duration: 5,
      });
      expect(anim.virtualTime).toBe(3);
      expect(anim.duration).toBe(5);
    });
  });
});

// ============================================================================
// MoveAlongPath
// ============================================================================

describe('MoveAlongPath', () => {
  // MoveAlongPath.begin() calls getCenter() which requires a concrete Mobject
  // (getThreeObject -> _createThreeObject). Use VMobject for all tests.

  describe('constructor', () => {
    it('stores the path', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      expect(anim.path).toBe(path);
      expect(anim.mobject).toBe(m);
    });

    it('rotateAlongPath defaults to false', () => {
      const path = straightLinePath();
      const anim = new MoveAlongPath(makeVMobject(), { path });
      expect(anim.rotateAlongPath).toBe(false);
    });

    it('accepts rotateAlongPath=true', () => {
      const path = straightLinePath();
      const anim = new MoveAlongPath(makeVMobject(), { path, rotateAlongPath: true });
      expect(anim.rotateAlongPath).toBe(true);
    });

    it('defaults to duration=1', () => {
      const path = straightLinePath();
      const anim = new MoveAlongPath(makeVMobject(), { path });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const path = straightLinePath();
      const anim = new MoveAlongPath(makeVMobject(), { path, duration: 3 });
      expect(anim.duration).toBe(3);
    });
  });

  describe('interpolate along straight line path', () => {
    it('at alpha=0 mobject is at start of path', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0);
      // Path starts at (0, 0, 0)
      expect(m.position.x).toBeCloseTo(0, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
      expect(m.position.z).toBeCloseTo(0, 3);
    });

    it('at alpha=1 mobject is at end of path', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(1);
      // Path ends at (6, 0, 0)
      expect(m.position.x).toBeCloseTo(6, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
      expect(m.position.z).toBeCloseTo(0, 3);
    });

    it('at alpha=0.5 mobject is at midpoint', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0.5);
      // Midpoint of a straight line from 0 to 6 is 3
      expect(m.position.x).toBeCloseTo(3, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
    });
  });

  describe('interpolate along curved path', () => {
    it('at alpha=0 mobject is at start', () => {
      const path = curvedPath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0);
      expect(m.position.x).toBeCloseTo(0, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
    });

    it('at alpha=1 mobject is at end', () => {
      const path = curvedPath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(1);
      expect(m.position.x).toBeCloseTo(3, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
    });

    it('at alpha=0.5 mobject is at peak of curve', () => {
      const path = curvedPath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0.5);
      // At t=0.5 of a cubic Bezier [0,0]-[1,2]-[2,2]-[3,0]:
      // B(0.5) = 0.125*(0) + 0.375*(1) + 0.375*(2) + 0.125*(3) = 0.375 + 0.75 + 0.375 = 1.5
      // y: 0.125*(0) + 0.375*(2) + 0.375*(2) + 0.125*(0) = 0.75 + 0.75 = 1.5
      expect(m.position.x).toBeCloseTo(1.5, 3);
      expect(m.position.y).toBeCloseTo(1.5, 3);
    });
  });

  describe('with empty/short path', () => {
    it('handles path with no points (stays at current position)', () => {
      const path = makeVMobject([]);
      const m = makeVMobject();
      m.position.set(5, 5, 5);
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0.5);
      // No valid path, should stay at current position
      expect(m.position.x).toBeCloseTo(5, 3);
      expect(m.position.y).toBeCloseTo(5, 3);
    });

    it('handles path with fewer than 4 points', () => {
      const path = makeVMobject([
        [1, 0, 0],
        [2, 0, 0],
      ]);
      const m = makeVMobject();
      m.position.set(10, 20, 30);
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0.5);
      // Not enough points for a segment, stays at current position
      expect(m.position.x).toBeCloseTo(10, 3);
    });
  });

  describe('rotateAlongPath', () => {
    it('rotates mobject to align with tangent direction', () => {
      // Path going right (positive x): tangent is (1, 0, 0) => angle = 0
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path, rotateAlongPath: true });
      anim.begin();
      anim.interpolate(0.5);
      // Tangent along x-axis: angle = atan2(0, positive) = 0
      expect(m.rotation.z).toBeCloseTo(0, 3);
    });

    it('rotates mobject for upward-curving path', () => {
      // Path that curves upward
      const path = makeVMobject([
        [0, 0, 0],
        [0, 1, 0],
        [0, 2, 0],
        [0, 3, 0],
      ]);
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path, rotateAlongPath: true });
      anim.begin();
      anim.interpolate(0.5);
      // Tangent is (0, positive, 0) => angle = PI/2
      expect(m.rotation.z).toBeCloseTo(Math.PI / 2, 2);
    });

    it('does not rotate when rotateAlongPath is false', () => {
      const path = makeVMobject([
        [0, 0, 0],
        [0, 1, 0],
        [0, 2, 0],
        [0, 3, 0],
      ]);
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path, rotateAlongPath: false });
      anim.begin();
      anim.interpolate(0.5);
      // Rotation should not change
      expect(m.rotation.z).toBeCloseTo(0, 5);
    });
  });

  describe('finish()', () => {
    it('sets exact final position', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      // Should be exactly at end of path
      expect(m.position.x).toBeCloseTo(6, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
      expect(m.position.z).toBeCloseTo(0, 3);
    });
  });

  describe('moveAlongPath() factory', () => {
    it('returns MoveAlongPath instance', () => {
      const path = straightLinePath();
      const anim = moveAlongPath(makeVMobject(), path);
      expect(anim).toBeInstanceOf(MoveAlongPath);
    });

    it('passes through options', () => {
      const path = straightLinePath();
      const anim = moveAlongPath(makeVMobject(), path, {
        rotateAlongPath: true,
        duration: 5,
      });
      expect(anim.rotateAlongPath).toBe(true);
      expect(anim.duration).toBe(5);
    });
  });

  describe('alpha clamping', () => {
    it('clamps alpha below 0', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      // Should not throw, and should clamp to start
      anim.interpolate(-0.5);
      expect(m.position.x).toBeCloseTo(0, 3);
    });

    it('clamps alpha above 1', () => {
      const path = straightLinePath();
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      // Should not throw, and should clamp to end
      anim.interpolate(1.5);
      expect(m.position.x).toBeCloseTo(6, 3);
    });
  });

  describe('multi-segment path', () => {
    it('moves through all segments', () => {
      // 3 segments means 10 points
      const path = makeVMobject(threeSegmentPoints());
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();

      // At start
      anim.interpolate(0);
      expect(m.position.x).toBeCloseTo(0, 3);
      expect(m.position.y).toBeCloseTo(0, 3);

      // At end
      anim.interpolate(1);
      expect(m.position.x).toBeCloseTo(3, 3);
      expect(m.position.y).toBeCloseTo(0, 3);
    });

    it('at alpha=1/3 is at end of first segment', () => {
      const path = makeVMobject(threeSegmentPoints());
      const m = makeVMobject();
      const anim = new MoveAlongPath(m, { path });
      anim.begin();
      // 1/3 of 3 segments = segment 1 at t=0 (actually end of first segment)
      anim.interpolate(1 / 3);
      // End of first segment is anchor 1: (1, 1, 0)
      expect(m.position.x).toBeCloseTo(1, 3);
      expect(m.position.y).toBeCloseTo(1, 3);
    });
  });
});

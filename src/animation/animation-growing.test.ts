import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { Arrow } from '../mobjects/geometry/Arrow';
import { linear } from '../rate-functions';
import {
  GrowArrow,
  growArrow,
  GrowFromEdge,
  growFromEdge,
  GrowFromPoint,
  growFromPoint,
  SpinInFromNothing,
  spinInFromNothing,
} from './growing/index';
import { Blink, blink } from './indication/Blink';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeArrow(): Arrow {
  return new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });
}

function makeMobject(): Mobject {
  return new Mobject();
}

function makeVMobject(pts?: number[][]): VMobject {
  const vm = new VMobject();
  if (pts) vm.setPoints(pts);
  return vm;
}

// simple triangle-ish shape
function trianglePoints(): number[][] {
  return [
    [0, 0, 0],
    [0.33, 0.33, 0],
    [0.66, 0.66, 0],
    [1, 1, 0],
    [1, 1, 0],
    [0.83, 0.66, 0],
    [0.66, 0.33, 0],
    [0.5, 0, 0],
  ];
}

// ============================================================================
// GrowArrow
// ============================================================================

describe('GrowArrow', () => {
  describe('constructor', () => {
    it('stores the arrow mobject', () => {
      const arrow = makeArrow();
      const anim = new GrowArrow(arrow);
      expect(anim.mobject).toBe(arrow);
    });

    it('defaults to duration=1', () => {
      const anim = new GrowArrow(makeArrow());
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const anim = new GrowArrow(makeArrow(), { duration: 3 });
      expect(anim.duration).toBe(3);
    });
  });

  describe('begin()', () => {
    it('sets children scale to near-zero', () => {
      const arrow = makeArrow();
      const anim = new GrowArrow(arrow);
      anim.begin();
      for (const child of arrow.children) {
        expect(child.scaleVector.x).toBeCloseTo(0.001, 5);
        expect(child.scaleVector.y).toBeCloseTo(0.001, 5);
        expect(child.scaleVector.z).toBeCloseTo(0.001, 5);
      }
    });

    it('keeps group position unchanged', () => {
      const arrow = new Arrow({ start: [1, 2, 0], end: [3, 4, 0] });
      const before = arrow.position.clone();
      const anim = new GrowArrow(arrow);
      anim.begin();
      expect(arrow.position.x).toBeCloseTo(before.x, 5);
      expect(arrow.position.y).toBeCloseTo(before.y, 5);
      expect(arrow.position.z).toBeCloseTo(before.z, 5);
    });

    it('places shaft/tip centers at arrow start at begin', () => {
      const arrow = new Arrow({
        start: [-4, 0, 0],
        end: [4, 0, 0],
        tipLength: 0.6,
        tipWidth: 0.35,
      });
      arrow.shift([2, 1, 0]);
      const start = arrow.getStart();

      const anim = new GrowArrow(arrow);
      anim.begin();

      const shaftCenter = arrow.children[0].getCenter();
      const tipCenter = arrow.children[1].getCenter();

      expect(shaftCenter[0]).toBeCloseTo(start[0], 5);
      expect(shaftCenter[1]).toBeCloseTo(start[1], 5);
      expect(shaftCenter[2]).toBeCloseTo(start[2], 5);
      expect(tipCenter[0]).toBeCloseTo(start[0], 5);
      expect(tipCenter[1]).toBeCloseTo(start[1], 5);
      expect(tipCenter[2]).toBeCloseTo(start[2], 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0.5 scales children to roughly half', () => {
      const arrow = makeArrow();
      const orig = arrow.children.map((c) => c.scaleVector.clone());
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(0.5);
      for (let i = 0; i < arrow.children.length; i++) {
        expect(arrow.children[i].scaleVector.x).toBeCloseTo(orig[i].x * 0.5, 2);
        expect(arrow.children[i].scaleVector.y).toBeCloseTo(orig[i].y * 0.5, 2);
      }
    });

    it('moves shaft center from start to its end center', () => {
      const arrow = new Arrow({ start: [1, 2, 0], end: [6, 2, 0] });
      const shaft = arrow.children[0];
      const endCenter = shaft.getCenter();
      const start = arrow.getStart();

      const anim = new GrowArrow(arrow);
      anim.begin();

      const c0 = shaft.getCenter();
      expect(c0[0]).toBeCloseTo(start[0], 6);

      anim.interpolate(0.25);
      const c25 = shaft.getCenter();
      expect(c25[0]).toBeCloseTo(start[0] + (endCenter[0] - start[0]) * 0.25, 6);

      anim.interpolate(0.75);
      const c75 = shaft.getCenter();
      expect(c75[0]).toBeCloseTo(start[0] + (endCenter[0] - start[0]) * 0.75, 6);
    });

    it('interpolates tip center toward its offset end-center (not midpoint)', () => {
      const arrow = new Arrow({ start: [-1, 0, 0], end: [5, 0, 0], tipLength: 1 });
      const tip = arrow.children[1];
      const endTipCenter = tip.getCenter();
      const start = arrow.getStart();

      const anim = new GrowArrow(arrow);
      anim.begin();

      const c0 = tip.getCenter();
      expect(c0[0]).toBeCloseTo(start[0], 6);

      anim.interpolate(0.5);
      const c5 = tip.getCenter();
      expect(c5[0]).toBeCloseTo(start[0] + (endTipCenter[0] - start[0]) * 0.5, 6);

      anim.interpolate(1);
      const c1 = tip.getCenter();
      expect(c1[0]).toBeCloseTo(endTipCenter[0], 6);
      expect(c1[1]).toBeCloseTo(endTipCenter[1], 6);
      expect(c1[2]).toBeCloseTo(endTipCenter[2], 6);
    });

    it('at alpha=1 restores full child scales', () => {
      const arrow = makeArrow();
      const orig = arrow.children.map((c) => c.scaleVector.clone());
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(1);
      for (let i = 0; i < arrow.children.length; i++) {
        expect(arrow.children[i].scaleVector.x).toBeCloseTo(orig[i].x, 5);
      }
    });

    it('moves arrow center from start region to target center during interpolation', () => {
      const arrow = new Arrow({ start: [0, 0, 0], end: [4, 0, 0] });
      arrow.shift([10, 1, 0]);
      const targetCenter = arrow.getCenter();
      const anim = new GrowArrow(arrow);
      anim.begin();

      const c0 = arrow.getCenter();
      expect(c0[0]).toBeLessThan(targetCenter[0]);

      anim.interpolate(1);
      const c1 = arrow.getCenter();
      expect(c1[0]).toBeCloseTo(targetCenter[0], 6);
      expect(c1[1]).toBeCloseTo(targetCenter[1], 6);
    });
  });

  describe('finish()', () => {
    it('forces canonical alpha=1 end state', () => {
      const arrow = new Arrow({ start: [0, 0, 0], end: [4, 0, 0] });
      arrow.shift([-3, 2, 0]);

      const shaft = arrow.children[0];
      const tip = arrow.children[1];
      const shaftPos = shaft.position.clone();
      const shaftScale = shaft.scaleVector.clone();
      const tipPos = tip.position.clone();
      const tipScale = tip.scaleVector.clone();

      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();

      expect(shaft.position.x).toBe(shaftPos.x);
      expect(shaft.position.y).toBe(shaftPos.y);
      expect(shaft.position.z).toBe(shaftPos.z);
      expect(shaft.scaleVector.x).toBe(shaftScale.x);
      expect(shaft.scaleVector.y).toBe(shaftScale.y);
      expect(shaft.scaleVector.z).toBe(shaftScale.z);

      expect(tip.position.x).toBe(tipPos.x);
      expect(tip.position.y).toBe(tipPos.y);
      expect(tip.position.z).toBe(tipPos.z);
      expect(tip.scaleVector.x).toBe(tipScale.x);
      expect(tip.scaleVector.y).toBe(tipScale.y);
      expect(tip.scaleVector.z).toBe(tipScale.z);
    });
  });

  describe('growArrow() factory', () => {
    it('returns a GrowArrow instance', () => {
      const arrow = makeArrow();
      const anim = growArrow(arrow);
      expect(anim).toBeInstanceOf(GrowArrow);
      expect(anim.mobject).toBe(arrow);
    });

    it('passes options through', () => {
      const anim = growArrow(makeArrow(), { duration: 5 });
      expect(anim.duration).toBe(5);
    });
  });
});

// ============================================================================
// GrowFromEdge
// ============================================================================

describe('GrowFromEdge', () => {
  describe('constructor', () => {
    it('stores edge direction', () => {
      const m = makeMobject();
      const anim = new GrowFromEdge(m, { edge: [0, 1, 0] });
      expect(anim.edge).toEqual([0, 1, 0]);
    });

    it('defaults to duration=1', () => {
      const anim = new GrowFromEdge(makeMobject(), { edge: [1, 0, 0] });
      expect(anim.duration).toBe(1);
    });
  });

  describe('begin()', () => {
    it('sets scale to near-zero', () => {
      const m = makeVMobject(trianglePoints());
      const anim = new GrowFromEdge(m, { edge: [1, 0, 0] });
      anim.begin();
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);
      expect(m.scaleVector.y).toBeCloseTo(0.001, 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=1 restores original scale', () => {
      const m = makeVMobject(trianglePoints());
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromEdge(m, { edge: [0, 1, 0] });
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 5);
    });

    it('at alpha=0.5 scales to half the target', () => {
      const m = makeVMobject(trianglePoints());
      const anim = new GrowFromEdge(m, { edge: [1, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(0.5, 2);
    });
  });

  describe('finish()', () => {
    it('restores original scale and position', () => {
      const m = makeVMobject(trianglePoints());
      m.position.set(3, 4, 0);
      const origPos = m.position.clone();
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromEdge(m, { edge: [0, -1, 0] });
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.position.x).toBeCloseTo(origPos.x, 5);
      expect(m.position.y).toBeCloseTo(origPos.y, 5);
    });
  });

  describe('growFromEdge() factory', () => {
    it('returns GrowFromEdge instance', () => {
      const m = makeMobject();
      const anim = growFromEdge(m, [1, 0, 0]);
      expect(anim).toBeInstanceOf(GrowFromEdge);
      expect(anim.edge).toEqual([1, 0, 0]);
    });
  });
});

// ============================================================================
// GrowFromPoint
// ============================================================================

describe('GrowFromPoint', () => {
  describe('constructor', () => {
    it('stores the grow point', () => {
      const m = makeMobject();
      const anim = new GrowFromPoint(m, { point: [5, 5, 0] });
      expect(anim.point).toEqual([5, 5, 0]);
    });
  });

  describe('begin()', () => {
    it('sets scale to near-zero and moves to grow point', () => {
      const m = makeMobject();
      const anim = new GrowFromPoint(m, { point: [3, 7, 0] });
      anim.begin();
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(7, 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=1 restores original scale', () => {
      const m = makeMobject();
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
    });

    it('position interpolates from grow point toward target', () => {
      const m = makeMobject();
      m.position.set(4, 0, 0);
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      // Mid-way between [0,0,0] and [4,0,0] = [2,0,0]
      expect(m.position.x).toBeCloseTo(2, 2);
    });
  });

  describe('finish()', () => {
    it('restores original scale and position', () => {
      const m = makeMobject();
      m.position.set(2, 3, 0);
      const origPos = m.position.clone();
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.position.x).toBeCloseTo(origPos.x, 5);
      expect(m.position.y).toBeCloseTo(origPos.y, 5);
    });
  });

  describe('growFromPoint() factory', () => {
    it('returns GrowFromPoint instance', () => {
      const m = makeMobject();
      const anim = growFromPoint(m, [1, 2, 3]);
      expect(anim).toBeInstanceOf(GrowFromPoint);
      expect(anim.point).toEqual([1, 2, 3]);
    });
  });
});

// ============================================================================
// SpinInFromNothing
// ============================================================================

describe('SpinInFromNothing', () => {
  describe('constructor', () => {
    it('defaults: angle=2PI, axis=[0,0,1], duration=1', () => {
      const anim = new SpinInFromNothing(makeMobject());
      expect(anim.angle).toBeCloseTo(Math.PI * 2, 5);
      expect(anim.axis).toEqual([0, 0, 1]);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom angle and axis', () => {
      const anim = new SpinInFromNothing(makeMobject(), {
        angle: Math.PI,
        axis: [1, 0, 0],
      });
      expect(anim.angle).toBeCloseTo(Math.PI, 5);
      expect(anim.axis).toEqual([1, 0, 0]);
    });
  });

  describe('begin()', () => {
    it('sets scale to near-zero', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);
      expect(m.scaleVector.y).toBeCloseTo(0.001, 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=1 scale is restored to original', () => {
      const m = makeMobject();
      const origScale = m.scaleVector.clone();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 5);
    });

    it('at alpha=0.5 scale is half', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(0.5, 2);
    });

    it('rotation changes during interpolation', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      const initialRotZ = m.rotation.z;
      anim.interpolate(0.25);
      // Rotation should have changed from initial
      // At 0.25, currentAngle = 2PI * (1 - 0.25) = 1.5 PI
      // So rotation should differ from initial
      const afterRotZ = m.rotation.z;
      // They should differ (exact value depends on quaternion math)
      expect(
        Math.abs(afterRotZ - initialRotZ) > 0.01 ||
          Math.abs(m.rotation.x) > 0.01 ||
          Math.abs(m.rotation.y) > 0.01,
      ).toBe(true);
    });
  });

  describe('finish()', () => {
    it('restores original scale and rotation', () => {
      const m = makeMobject();
      const origRotation = m.rotation.clone();
      const origScale = m.scaleVector.clone();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.rotation.x).toBeCloseTo(origRotation.x, 3);
      expect(m.rotation.y).toBeCloseTo(origRotation.y, 3);
      expect(m.rotation.z).toBeCloseTo(origRotation.z, 3);
    });
  });

  describe('spinInFromNothing() factory', () => {
    it('returns SpinInFromNothing instance', () => {
      const anim = spinInFromNothing(makeMobject(), { angle: Math.PI });
      expect(anim).toBeInstanceOf(SpinInFromNothing);
      expect(anim.angle).toBeCloseTo(Math.PI, 5);
    });
  });
});

// ============================================================================
// Blink
// ============================================================================

describe('Blink', () => {
  describe('constructor defaults', () => {
    it('nBlinks=2, minOpacity=0, blinkDuration=0.3, duration=1', () => {
      const m = makeMobject();
      const anim = new Blink(m);
      expect(anim.nBlinks).toBe(2);
      expect(anim.minOpacity).toBe(0);
      expect(anim.blinkDuration).toBe(0.3);
      expect(anim.duration).toBe(1);
    });

    it('uses linear rate function by default', () => {
      const anim = new Blink(makeMobject());
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('custom options', () => {
    it('accepts custom nBlinks, minOpacity, blinkDuration', () => {
      const anim = new Blink(makeMobject(), {
        nBlinks: 5,
        minOpacity: 0.2,
        blinkDuration: 0.5,
        duration: 3,
      });
      expect(anim.nBlinks).toBe(5);
      expect(anim.minOpacity).toBe(0.2);
      expect(anim.blinkDuration).toBe(0.5);
      expect(anim.duration).toBe(3);
    });
  });

  describe('begin()', () => {
    it('stores original opacity', () => {
      const m = makeVMobject(trianglePoints());
      m.opacity = 0.8;
      const anim = new Blink(m);
      anim.begin();
      // After begin, opacity should still be 0.8 (not yet interpolated)
      expect(m.opacity).toBe(0.8);
    });
  });

  describe('interpolate()', () => {
    it('modulates opacity during blink cycle', () => {
      const m = makeVMobject(trianglePoints());
      m.opacity = 1;
      const anim = new Blink(m, { nBlinks: 1 });
      anim.begin();

      // At alpha=0, blinkPhase=0, we are at start of fade-out
      anim.interpolate(0);
      expect(m.opacity).toBeCloseTo(1, 1);

      // Mid-blink (alpha=0.5 with nBlinks=1): blinkPhase=0.5
      // At the middle, should be at minOpacity
      anim.interpolate(0.5);
      expect(m.opacity).toBeCloseTo(0, 1);
    });

    it('returns to original opacity at end of a complete blink cycle', () => {
      const m = makeVMobject(trianglePoints());
      m.opacity = 0.9;
      const anim = new Blink(m, { nBlinks: 1 });
      anim.begin();
      // At alpha close to 1, the blink cycle completes, fading back in
      anim.interpolate(0.999);
      expect(m.opacity).toBeCloseTo(0.9, 0);
    });
  });

  describe('finish()', () => {
    it('restores original opacity', () => {
      const m = makeVMobject(trianglePoints());
      m.opacity = 0.75;
      const anim = new Blink(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.opacity).toBeCloseTo(0.75, 5);
    });
  });

  describe('blink() factory', () => {
    it('returns Blink instance', () => {
      const m = makeMobject();
      const anim = blink(m, { nBlinks: 3 });
      expect(anim).toBeInstanceOf(Blink);
      expect(anim.nBlinks).toBe(3);
    });
  });
});

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

  // GrowArrow grows the shaft/tip children, leaving the Arrow's own
  // _start/_end (hence getStart/getEnd) untouched. Progress is therefore
  // measured on the RENDERED geometry: getWidth() is the rendered length and
  // getCenter() tracks the visual center from the start point to the midpoint.
  describe('begin()', () => {
    it('collapses the arrow to near-zero size', () => {
      const arrow = makeArrow();
      new GrowArrow(arrow).begin();
      expect(arrow.getWidth()).toBeCloseTo(0, 1);
    });

    it('collapses onto the start point', () => {
      const arrow = new Arrow({ start: [1, 2, 0], end: [3, 4, 0] });
      new GrowArrow(arrow).begin();
      const c = arrow.getCenter();
      expect(c[0]).toBeCloseTo(1, 1);
      expect(c[1]).toBeCloseTo(2, 1);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0.5 is roughly half-grown', () => {
      const arrow = makeArrow(); // full rendered width = 2
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(0.5);
      expect(arrow.getWidth()).toBeCloseTo(1, 1);
    });

    it('at alpha=1 reaches full size', () => {
      const arrow = makeArrow();
      const full = arrow.getWidth();
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(1);
      expect(arrow.getWidth()).toBeCloseTo(full, 2);
    });

    it('center grows from the start point toward the midpoint', () => {
      const arrow = new Arrow({ start: [0, 0, 0], end: [4, 0, 0] });
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(1);
      // fully grown: visual center sits at the segment midpoint (0+4)/2 = 2
      expect(arrow.getCenter()[0]).toBeCloseTo(2, 1);
    });
  });

  describe('finish()', () => {
    it('restores full size with center at the midpoint', () => {
      const arrow = new Arrow({ start: [0, 0, 0], end: [4, 0, 0] });
      const full = arrow.getWidth();
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(arrow.getWidth()).toBeCloseTo(full, 2);
      expect(arrow.getCenter()[0]).toBeCloseTo(2, 1);
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

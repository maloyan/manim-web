/**
 * Extra tests for growing animations to supplement animation-growing.test.ts.
 * Covers additional branches, edge cases, and deeper behavioral verification.
 */
import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { Arrow } from '../../mobjects/geometry/Arrow';
import {
  GrowArrow,
  growArrow,
  GrowFromEdge,
  growFromEdge,
  GrowFromPoint,
  growFromPoint,
  SpinInFromNothing,
  spinInFromNothing,
  GrowFromCenter,
  growFromCenter,
} from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMobject(): VMobject {
  return new VMobject();
}

function makeVMobject(pts?: number[][]): VMobject {
  const vm = new VMobject();
  if (pts) vm.setPoints(pts);
  return vm;
}

function makeArrow(
  start: [number, number, number] = [0, 0, 0],
  end: [number, number, number] = [2, 0, 0],
): Arrow {
  return new Arrow({ start, end });
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
// GrowArrow - extra tests
// ============================================================================

describe('GrowArrow (extra)', () => {
  describe('interpolate() progression', () => {
    it('scale increases monotonically from 0 to 1', () => {
      const arrow = makeArrow();
      const anim = new GrowArrow(arrow);
      anim.begin();

      const scales: number[] = [];
      for (let a = 0; a <= 1; a += 0.1) {
        anim.interpolate(a);
        scales.push(arrow.scaleVector.x);
      }

      // Each scale should be >= previous
      for (let i = 1; i < scales.length; i++) {
        expect(scales[i]).toBeGreaterThanOrEqual(scales[i - 1] - 0.001);
      }
    });

    it('at alpha=0, scale is clamped to 0.001 (not 0)', () => {
      const arrow = makeArrow();
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(0);
      expect(arrow.scaleVector.x).toBeCloseTo(0.001, 5);
      expect(arrow.scaleVector.y).toBeCloseTo(0.001, 5);
      expect(arrow.scaleVector.z).toBeCloseTo(0.001, 5);
    });

    it('position moves continuously from start to midpoint', () => {
      const arrow = makeArrow([0, 0, 0], [6, 0, 0]);
      const anim = new GrowArrow(arrow);
      anim.begin();

      anim.interpolate(0);
      expect(arrow.position.x).toBeCloseTo(0, 2);

      anim.interpolate(0.25);
      expect(arrow.position.x).toBeCloseTo(0.75, 2);

      anim.interpolate(0.5);
      expect(arrow.position.x).toBeCloseTo(1.5, 2);

      anim.interpolate(0.75);
      expect(arrow.position.x).toBeCloseTo(2.25, 2);

      anim.interpolate(1);
      expect(arrow.position.x).toBeCloseTo(3, 2); // midpoint
    });

    it('handles arrow with 3D coordinates', () => {
      const arrow = makeArrow([1, 2, 3], [5, 6, 7]);
      const anim = new GrowArrow(arrow);
      anim.begin();

      // Position should start at the start point
      expect(arrow.position.x).toBeCloseTo(1, 2);
      expect(arrow.position.y).toBeCloseTo(2, 2);
      expect(arrow.position.z).toBeCloseTo(3, 2);

      anim.interpolate(1);
      // At alpha=1, position should be at midpoint
      expect(arrow.position.x).toBeCloseTo(3, 2); // (1+5)/2
      expect(arrow.position.y).toBeCloseTo(4, 2); // (2+6)/2
      expect(arrow.position.z).toBeCloseTo(5, 2); // (3+7)/2
    });
  });

  describe('begin() stores target correctly', () => {
    it('preserves target scale for non-unit scaled arrow', () => {
      const arrow = makeArrow();
      arrow.scaleVector.set(2, 3, 4);
      const anim = new GrowArrow(arrow);
      anim.begin();

      // Scale should be near-zero after begin
      expect(arrow.scaleVector.x).toBeCloseTo(0.001, 5);

      anim.interpolate(1);
      expect(arrow.scaleVector.x).toBeCloseTo(2, 2);
      expect(arrow.scaleVector.y).toBeCloseTo(3, 2);
      expect(arrow.scaleVector.z).toBeCloseTo(4, 2);
    });
  });

  describe('finish() after partial interpolation', () => {
    it('restores exact state regardless of last interpolation step', () => {
      const arrow = makeArrow([0, 0, 0], [4, 4, 0]);
      const origScale = arrow.scaleVector.clone();
      const anim = new GrowArrow(arrow);
      anim.begin();
      anim.interpolate(0.1); // barely started
      anim.finish();
      expect(arrow.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(arrow.scaleVector.y).toBeCloseTo(origScale.y, 5);
      expect(arrow.scaleVector.z).toBeCloseTo(origScale.z, 5);
      expect(arrow.position.x).toBeCloseTo(2, 2); // midpoint x
      expect(arrow.position.y).toBeCloseTo(2, 2); // midpoint y
    });
  });

  describe('growArrow() factory (extra)', () => {
    it('passes rateFunc option through', () => {
      const rateFunc = (t: number) => t * t;
      const anim = growArrow(makeArrow(), { rateFunc });
      expect(anim.rateFunc).toBe(rateFunc);
    });
  });
});

// ============================================================================
// GrowFromEdge - extra tests
// ============================================================================

describe('GrowFromEdge (extra)', () => {
  describe('edge directions', () => {
    it('grows from RIGHT edge [1, 0, 0]', () => {
      const m = makeVMobject(trianglePoints());
      m.position.set(0, 0, 0);
      const origPos = m.position.clone();
      const anim = new GrowFromEdge(m, { edge: [1, 0, 0] });
      anim.begin();

      // Scale should be near-zero
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);

      anim.interpolate(0.5);
      // Scale should be 0.5
      expect(m.scaleVector.x).toBeCloseTo(0.5, 2);

      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.position.x).toBeCloseTo(origPos.x, 2);
    });

    it('grows from LEFT edge [-1, 0, 0]', () => {
      const m = makeVMobject(trianglePoints());
      const origPos = m.position.clone();
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromEdge(m, { edge: [-1, 0, 0] });
      anim.begin();
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.position.x).toBeCloseTo(origPos.x, 2);
    });

    it('grows from UP edge [0, 1, 0]', () => {
      const m = makeVMobject(trianglePoints());
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromEdge(m, { edge: [0, 1, 0] });
      anim.begin();
      anim.finish();
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 5);
    });

    it('grows from DOWN edge [0, -1, 0]', () => {
      const m = makeVMobject(trianglePoints());
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromEdge(m, { edge: [0, -1, 0] });
      anim.begin();
      anim.finish();
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 5);
    });

    it('grows from diagonal edge [1, 1, 0]', () => {
      const m = makeVMobject(trianglePoints());
      const origScale = m.scaleVector.clone();
      const origPos = m.position.clone();
      const anim = new GrowFromEdge(m, { edge: [1, 1, 0] });
      anim.begin();
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.position.x).toBeCloseTo(origPos.x, 2);
    });
  });

  describe('interpolate() progression', () => {
    it('position moves from edge point toward target', () => {
      const m = makeVMobject(trianglePoints());
      m.position.set(2, 3, 0);
      const anim = new GrowFromEdge(m, { edge: [1, 0, 0] });
      anim.begin();

      // At alpha=0, position is at edge point
      anim.interpolate(0);
      const posAtZero = m.position.clone();

      // At alpha=1, position should be back at target
      anim.interpolate(1);
      expect(m.position.x).toBeCloseTo(2, 2);
      expect(m.position.y).toBeCloseTo(3, 2);

      // At alpha=0.5, position should be halfway between edge and target
      anim.interpolate(0.5);
      expect(m.position.x).toBeCloseTo((posAtZero.x + 2) / 2, 1);
    });

    it('scale clamps to 0.001 at alpha=0', () => {
      const m = makeMobject();
      const anim = new GrowFromEdge(m, { edge: [0, 1, 0] });
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);
      expect(m.scaleVector.y).toBeCloseTo(0.001, 5);
      expect(m.scaleVector.z).toBeCloseTo(0.001, 5);
    });
  });

  describe('with non-unit initial scale', () => {
    it('preserves non-unit scale through animation cycle', () => {
      const m = makeVMobject(trianglePoints());
      m.scaleVector.set(3, 2, 1);
      const origScale = m.scaleVector.clone();
      const anim = new GrowFromEdge(m, { edge: [0, 1, 0] });
      anim.begin();

      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);

      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(1.5, 2);
      expect(m.scaleVector.y).toBeCloseTo(1, 2);
      expect(m.scaleVector.z).toBeCloseTo(0.5, 2);

      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 5);
      expect(m.scaleVector.z).toBeCloseTo(origScale.z, 5);
    });
  });

  describe('growFromEdge() factory (extra)', () => {
    it('passes duration option through', () => {
      const m = makeMobject();
      const anim = growFromEdge(m, [0, 1, 0], { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('passes rateFunc option through', () => {
      const rf = (t: number) => t;
      const anim = growFromEdge(makeMobject(), [1, 0, 0], { rateFunc: rf });
      expect(anim.rateFunc).toBe(rf);
    });
  });
});

// ============================================================================
// GrowFromPoint - extra tests
// ============================================================================

describe('GrowFromPoint (extra)', () => {
  describe('begin() with various grow points', () => {
    it('moves to grow point in 3D', () => {
      const m = makeMobject();
      m.position.set(0, 0, 0);
      const anim = new GrowFromPoint(m, { point: [5, 10, -3] });
      anim.begin();
      expect(m.position.x).toBeCloseTo(5, 5);
      expect(m.position.y).toBeCloseTo(10, 5);
      expect(m.position.z).toBeCloseTo(-3, 5);
    });

    it('negative coordinates for grow point', () => {
      const m = makeMobject();
      const anim = new GrowFromPoint(m, { point: [-5, -5, -5] });
      anim.begin();
      expect(m.position.x).toBeCloseTo(-5, 5);
      expect(m.position.y).toBeCloseTo(-5, 5);
      expect(m.position.z).toBeCloseTo(-5, 5);
    });
  });

  describe('interpolate() at various alpha values', () => {
    it('progressive scale increase', () => {
      const m = makeMobject();
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();

      const alphas = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
      let prevScale = 0;

      for (const alpha of alphas) {
        anim.interpolate(alpha);
        const curScale = m.scaleVector.x;
        expect(curScale).toBeGreaterThanOrEqual(prevScale - 0.001);
        prevScale = curScale;
      }
    });

    it('at alpha=0, scale is clamped to 0.001', () => {
      const m = makeMobject();
      const anim = new GrowFromPoint(m, { point: [1, 2, 3] });
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);
    });

    it('position at alpha=0.25 is 1/4 of the way', () => {
      const m = makeMobject();
      m.position.set(4, 0, 0);
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.25);
      expect(m.position.x).toBeCloseTo(1, 2);
    });

    it('position at alpha=0.75 is 3/4 of the way', () => {
      const m = makeMobject();
      m.position.set(4, 0, 0);
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.75);
      expect(m.position.x).toBeCloseTo(3, 2);
    });
  });

  describe('grow point at mobject position', () => {
    it('when grow point equals target, position stays fixed', () => {
      const m = makeMobject();
      m.position.set(3, 3, 0);
      const anim = new GrowFromPoint(m, { point: [3, 3, 0] });
      anim.begin();

      anim.interpolate(0);
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(3, 5);

      anim.interpolate(0.5);
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(3, 5);

      anim.interpolate(1);
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(3, 5);
    });
  });

  describe('non-unit initial scale', () => {
    it('preserves non-unit scale after full animation', () => {
      const m = makeMobject();
      m.scaleVector.set(5, 5, 5);
      const anim = new GrowFromPoint(m, { point: [0, 0, 0] });
      anim.begin();

      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(2.5, 2);

      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(5, 5);
      expect(m.scaleVector.y).toBeCloseTo(5, 5);
      expect(m.scaleVector.z).toBeCloseTo(5, 5);
    });
  });

  describe('growFromPoint() factory (extra)', () => {
    it('passes duration through', () => {
      const anim = growFromPoint(makeMobject(), [1, 2, 3], { duration: 2.5 });
      expect(anim.duration).toBe(2.5);
    });

    it('passes rateFunc through', () => {
      const rf = (t: number) => t * t * t;
      const anim = growFromPoint(makeMobject(), [0, 0, 0], { rateFunc: rf });
      expect(anim.rateFunc).toBe(rf);
    });
  });
});

// ============================================================================
// SpinInFromNothing - extra tests
// ============================================================================

describe('SpinInFromNothing (extra)', () => {
  describe('default axis is z-axis', () => {
    it('rotation is primarily around z-axis', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0.5);

      // At alpha=0.5, currentAngle = 2PI * (1 - 0.5) = PI
      // Should produce z-axis rotation
      const rotZ = m.rotation.z;
      // Rotation should be significant
      expect(Math.abs(rotZ)).toBeGreaterThan(0.1);
    });
  });

  describe('custom angle', () => {
    it('angle=PI results in half rotation', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m, { angle: Math.PI });
      anim.begin();

      anim.interpolate(0);
      // At alpha=0, currentAngle = PI * (1 - 0) = PI
      // Rotation should be -PI around z

      anim.interpolate(1);
      // At alpha=1, currentAngle = PI * (1 - 1) = 0, no extra rotation
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
    });

    it('angle=0 means no rotation, only scale', () => {
      const m = makeMobject();
      const initialRot = m.rotation.clone();
      const anim = new SpinInFromNothing(m, { angle: 0 });
      anim.begin();
      anim.interpolate(0.5);

      // Scale should still change
      expect(m.scaleVector.x).toBeCloseTo(0.5, 2);

      // Rotation should remain at initial (angle=0 => no spin)
      expect(m.rotation.x).toBeCloseTo(initialRot.x, 2);
      expect(m.rotation.y).toBeCloseTo(initialRot.y, 2);
      expect(m.rotation.z).toBeCloseTo(initialRot.z, 2);
    });
  });

  describe('custom axis', () => {
    it('axis=[1, 0, 0] rotates around x-axis', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m, { axis: [1, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);

      // Should have x-axis rotation component
      // The quaternion math distributes rotation
      expect(m.scaleVector.x).toBeCloseTo(0.5, 2);
    });

    it('axis=[0, 1, 0] rotates around y-axis', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m, { axis: [0, 1, 0] });
      anim.begin();
      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(0.5, 2);
    });

    it('axis is normalized internally', () => {
      const m1 = makeMobject();
      const m2 = makeMobject();
      const anim1 = new SpinInFromNothing(m1, { axis: [0, 0, 1] });
      const anim2 = new SpinInFromNothing(m2, { axis: [0, 0, 10] }); // non-unit length

      anim1.begin();
      anim2.begin();
      anim1.interpolate(0.5);
      anim2.interpolate(0.5);

      // Both should produce the same rotation since axis is normalized
      expect(m1.rotation.x).toBeCloseTo(m2.rotation.x, 3);
      expect(m1.rotation.y).toBeCloseTo(m2.rotation.y, 3);
      expect(m1.rotation.z).toBeCloseTo(m2.rotation.z, 3);
    });
  });

  describe('interpolate() scale clamping', () => {
    it('at alpha=0, scale is clamped to 0.001', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(0.001, 5);
      expect(m.scaleVector.y).toBeCloseTo(0.001, 5);
      expect(m.scaleVector.z).toBeCloseTo(0.001, 5);
    });

    it('at alpha=0.1, scale is 0.1', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0.1);
      expect(m.scaleVector.x).toBeCloseTo(0.1, 2);
    });
  });

  describe('finish() with various initial states', () => {
    it('restores non-zero initial rotation', () => {
      const m = makeMobject();
      m.rotation.set(0.5, 0.3, 0.1);
      const origRot = m.rotation.clone();
      const origScale = m.scaleVector.clone();

      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();

      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.rotation.x).toBeCloseTo(origRot.x, 3);
      expect(m.rotation.y).toBeCloseTo(origRot.y, 3);
      expect(m.rotation.z).toBeCloseTo(origRot.z, 3);
    });

    it('restores non-unit initial scale', () => {
      const m = makeMobject();
      m.scaleVector.set(2, 3, 4);
      const origScale = m.scaleVector.clone();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      anim.interpolate(0.7);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 5);
      expect(m.scaleVector.z).toBeCloseTo(origScale.z, 5);
    });
  });

  describe('full animation progression', () => {
    it('rotation converges to initial rotation as alpha approaches 1', () => {
      const m = makeMobject();
      const initialRot = m.rotation.clone();
      const anim = new SpinInFromNothing(m);
      anim.begin();

      // At alpha close to 1, rotation should be close to initial
      anim.interpolate(0.999);
      expect(m.rotation.x).toBeCloseTo(initialRot.x, 1);
      expect(m.rotation.y).toBeCloseTo(initialRot.y, 1);
      expect(m.rotation.z).toBeCloseTo(initialRot.z, 1);
    });

    it('marks dirty during interpolation', () => {
      const m = makeMobject();
      const anim = new SpinInFromNothing(m);
      anim.begin();
      // _markDirty is called during interpolate - no error
      anim.interpolate(0.5);
    });
  });

  describe('spinInFromNothing() factory (extra)', () => {
    it('defaults work when no options provided', () => {
      const anim = spinInFromNothing(makeMobject());
      expect(anim.angle).toBeCloseTo(Math.PI * 2, 5);
      expect(anim.axis).toEqual([0, 0, 1]);
      expect(anim.duration).toBe(1);
    });

    it('passes all options through', () => {
      const rf = (t: number) => t;
      const anim = spinInFromNothing(makeMobject(), {
        angle: Math.PI / 2,
        axis: [1, 0, 0],
        duration: 2,
        rateFunc: rf,
      });
      expect(anim.angle).toBeCloseTo(Math.PI / 2, 5);
      expect(anim.axis).toEqual([1, 0, 0]);
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(rf);
    });
  });
});

// ============================================================================
// GrowFromCenter - extra tests (re-exported from Scale module)
// ============================================================================

describe('GrowFromCenter (extra)', () => {
  describe('re-export verification', () => {
    it('GrowFromCenter class is available from growing module', () => {
      expect(GrowFromCenter).toBeDefined();
      const m = makeMobject();
      const anim = new GrowFromCenter(m);
      expect(anim).toBeInstanceOf(GrowFromCenter);
    });

    it('growFromCenter factory is available from growing module', () => {
      expect(growFromCenter).toBeDefined();
      const anim = growFromCenter(makeMobject());
      expect(anim).toBeInstanceOf(GrowFromCenter);
    });
  });

  describe('with pre-scaled mobject', () => {
    it('begin() sets scale to (0, 0, 0)', () => {
      const m = makeMobject();
      m.scaleVector.set(5, 10, 15);
      const anim = new GrowFromCenter(m);
      anim.begin();
      expect(m.scaleVector.x).toBeCloseTo(0, 5);
      expect(m.scaleVector.y).toBeCloseTo(0, 5);
      expect(m.scaleVector.z).toBeCloseTo(0, 5);
    });

    it('interpolate restores proportional scale', () => {
      const m = makeMobject();
      m.scaleVector.set(4, 8, 12);
      const anim = new GrowFromCenter(m);
      anim.begin();

      anim.interpolate(0.25);
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.scaleVector.y).toBeCloseTo(2, 5);
      expect(m.scaleVector.z).toBeCloseTo(3, 5);

      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(2, 5);
      expect(m.scaleVector.y).toBeCloseTo(4, 5);
      expect(m.scaleVector.z).toBeCloseTo(6, 5);

      anim.interpolate(0.75);
      expect(m.scaleVector.x).toBeCloseTo(3, 5);
      expect(m.scaleVector.y).toBeCloseTo(6, 5);
      expect(m.scaleVector.z).toBeCloseTo(9, 5);

      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(4, 5);
      expect(m.scaleVector.y).toBeCloseTo(8, 5);
      expect(m.scaleVector.z).toBeCloseTo(12, 5);
    });
  });

  describe('constructor options', () => {
    it('accepts custom duration', () => {
      const anim = new GrowFromCenter(makeMobject(), { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('accepts custom rateFunc', () => {
      const rf = (t: number) => t * t;
      const anim = new GrowFromCenter(makeMobject(), { rateFunc: rf });
      expect(anim.rateFunc).toBe(rf);
    });
  });

  describe('finish() guarantees exact target', () => {
    it('finish after 0 interpolation restores target scale', () => {
      const m = makeMobject();
      m.scaleVector.set(7, 7, 7);
      const anim = new GrowFromCenter(m);
      anim.begin();
      // No interpolation at all
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(7, 5);
      expect(m.scaleVector.y).toBeCloseTo(7, 5);
      expect(m.scaleVector.z).toBeCloseTo(7, 5);
    });
  });

  describe('growFromCenter() factory (extra)', () => {
    it('passes options through', () => {
      const rf = (t: number) => t;
      const anim = growFromCenter(makeMobject(), { duration: 5, rateFunc: rf });
      expect(anim.duration).toBe(5);
      expect(anim.rateFunc).toBe(rf);
    });
  });
});

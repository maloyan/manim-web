import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { Shift, shift, MoveToTargetPosition, MobjectWithTargetPosition } from './movement/Shift';
import { Scale, scale, GrowFromCenter, growFromCenter } from './movement/Scale';
import { Rotate, rotate } from './movement/Rotate';

// Helper: cast Mobject to bypass abstract instantiation
function mob(): Mobject {
  return new (Mobject as unknown as new () => Mobject)();
}

// ---------------------------------------------------------------------------
// Shift
// ---------------------------------------------------------------------------
describe('Shift', () => {
  it('constructor stores direction', () => {
    const m = mob();
    const anim = new Shift(m, { direction: [3, 4, 5] });
    expect(anim.direction).toEqual([3, 4, 5]);
  });

  it('begin() stores initial position and calculates target', () => {
    const m = mob();
    m.position.set(1, 2, 3);
    const anim = new Shift(m, { direction: [10, 20, 30] });
    anim.begin();
    // After begin, position unchanged
    expect(m.position.x).toBe(1);
    expect(m.position.y).toBe(2);
    expect(m.position.z).toBe(3);
  });

  it('interpolate(0) keeps position at initial', () => {
    const m = mob();
    m.position.set(1, 2, 3);
    const anim = new Shift(m, { direction: [10, 20, 30] });
    anim.begin();
    anim.interpolate(0);
    expect(m.position.x).toBeCloseTo(1, 5);
    expect(m.position.y).toBeCloseTo(2, 5);
    expect(m.position.z).toBeCloseTo(3, 5);
  });

  it('interpolate(0.5) sets halfway position', () => {
    const m = mob();
    const anim = new Shift(m, { direction: [4, 6, 8] });
    anim.begin();
    anim.interpolate(0.5);
    expect(m.position.x).toBeCloseTo(2, 5);
    expect(m.position.y).toBeCloseTo(3, 5);
    expect(m.position.z).toBeCloseTo(4, 5);
  });

  it('interpolate(1) sets position at target', () => {
    const m = mob();
    const anim = new Shift(m, { direction: [4, 6, 8] });
    anim.begin();
    anim.interpolate(1);
    expect(m.position.x).toBeCloseTo(4, 5);
    expect(m.position.y).toBeCloseTo(6, 5);
    expect(m.position.z).toBeCloseTo(8, 5);
  });

  it('finish() sets position to exact target', () => {
    const m = mob();
    const anim = new Shift(m, { direction: [1, 2, 3] });
    anim.begin();
    anim.interpolate(0.3); // partial
    anim.finish();
    expect(m.position.x).toBeCloseTo(1, 5);
    expect(m.position.y).toBeCloseTo(2, 5);
    expect(m.position.z).toBeCloseTo(3, 5);
  });

  it('works with non-origin starting position', () => {
    const m = mob();
    m.position.set(10, 20, 30);
    const anim = new Shift(m, { direction: [1, 2, 3] });
    anim.begin();
    anim.interpolate(1);
    expect(m.position.x).toBeCloseTo(11, 5);
    expect(m.position.y).toBeCloseTo(22, 5);
    expect(m.position.z).toBeCloseTo(33, 5);
  });

  it('shift() factory function creates a Shift animation', () => {
    const m = mob();
    const anim = shift(m, [1, 0, 0]);
    expect(anim).toBeInstanceOf(Shift);
    expect(anim.direction).toEqual([1, 0, 0]);
  });
});

// ---------------------------------------------------------------------------
// MoveToTargetPosition
// ---------------------------------------------------------------------------
describe('MoveToTargetPosition', () => {
  it('throws without targetPosition', () => {
    const m = mob();
    expect(() => new MoveToTargetPosition(m)).toThrow(
      'MoveToTargetPosition requires mobject.targetPosition to be set.',
    );
  });

  it('interpolates position correctly', () => {
    const m = mob() as MobjectWithTargetPosition;
    m.targetPosition = [6, 8, 10];
    const anim = new MoveToTargetPosition(m);
    anim.begin();

    anim.interpolate(0);
    expect(m.position.x).toBeCloseTo(0, 5);
    expect(m.position.y).toBeCloseTo(0, 5);
    expect(m.position.z).toBeCloseTo(0, 5);

    anim.interpolate(0.5);
    expect(m.position.x).toBeCloseTo(3, 5);
    expect(m.position.y).toBeCloseTo(4, 5);
    expect(m.position.z).toBeCloseTo(5, 5);

    anim.interpolate(1);
    expect(m.position.x).toBeCloseTo(6, 5);
    expect(m.position.y).toBeCloseTo(8, 5);
    expect(m.position.z).toBeCloseTo(10, 5);
  });
});

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------
describe('Scale', () => {
  it('uniform scale factor=2 doubles scale', () => {
    const m = mob();
    const anim = new Scale(m, { scaleFactor: 2, aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(2, 5);
    expect(m.scaleVector.y).toBeCloseTo(2, 5);
    expect(m.scaleVector.z).toBeCloseTo(2, 5);
  });

  it('interpolate(0.5) with factor=2 gives scale (1.5, 1.5, 1.5)', () => {
    const m = mob();
    const anim = new Scale(m, { scaleFactor: 2, aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(0.5);
    expect(m.scaleVector.x).toBeCloseTo(1.5, 5);
    expect(m.scaleVector.y).toBeCloseTo(1.5, 5);
    expect(m.scaleVector.z).toBeCloseTo(1.5, 5);
  });

  it('per-axis scale [2, 3, 1] scales each axis independently', () => {
    const m = mob();
    const anim = new Scale(m, { scaleFactor: [2, 3, 1], aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(2, 5);
    expect(m.scaleVector.y).toBeCloseTo(3, 5);
    expect(m.scaleVector.z).toBeCloseTo(1, 5);
  });

  it('z=0 in per-axis scale is treated as z=1 (singular matrix protection)', () => {
    const m = mob();
    const anim = new Scale(m, { scaleFactor: [2, 3, 0], aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(2, 5);
    expect(m.scaleVector.y).toBeCloseTo(3, 5);
    // z=0 is replaced with z=1 => target z = 1*1 = 1
    expect(m.scaleVector.z).toBeCloseTo(1, 5);
  });

  it('scale about point: position moves relative to aboutPoint', () => {
    const m = mob();
    // Place mobject at (2, 0, 0), scale about origin by factor 2
    m.position.set(2, 0, 0);
    const anim = new Scale(m, {
      scaleFactor: 2,
      aboutPoint: [0, 0, 0],
    });
    anim.begin();
    anim.interpolate(1);
    // Position offset (2,0,0) from origin should double to (4,0,0)
    expect(m.position.x).toBeCloseTo(4, 5);
    expect(m.position.y).toBeCloseTo(0, 5);
    expect(m.position.z).toBeCloseTo(0, 5);
  });

  it('scale about custom point: verifies position offset scales correctly', () => {
    const m = mob();
    // Mobject at (3, 0, 0), scale about (1, 0, 0) by factor 3
    m.position.set(3, 0, 0);
    const anim = new Scale(m, {
      scaleFactor: 3,
      aboutPoint: [1, 0, 0],
    });
    anim.begin();
    anim.interpolate(1);
    // Offset from aboutPoint is (2, 0, 0), scaled by 3 => (6, 0, 0)
    // New position = aboutPoint + scaled offset = (1+6, 0, 0) = (7, 0, 0)
    expect(m.position.x).toBeCloseTo(7, 5);
    expect(m.position.y).toBeCloseTo(0, 5);
    expect(m.position.z).toBeCloseTo(0, 5);
  });

  it('finish() sets exact target scale', () => {
    const m = mob();
    const anim = new Scale(m, { scaleFactor: 5, aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(0.3); // partial
    anim.finish();
    expect(m.scaleVector.x).toBeCloseTo(5, 5);
    expect(m.scaleVector.y).toBeCloseTo(5, 5);
    expect(m.scaleVector.z).toBeCloseTo(5, 5);
  });

  it('scale() factory function creates a Scale animation', () => {
    const m = mob();
    const anim = scale(m, 3);
    expect(anim).toBeInstanceOf(Scale);
    expect(anim.scaleFactor).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// GrowFromCenter
// ---------------------------------------------------------------------------
describe('GrowFromCenter', () => {
  it('begin() sets scale to (0, 0, 0)', () => {
    const m = mob();
    const anim = new GrowFromCenter(m);
    anim.begin();
    expect(m.scaleVector.x).toBeCloseTo(0, 5);
    expect(m.scaleVector.y).toBeCloseTo(0, 5);
    expect(m.scaleVector.z).toBeCloseTo(0, 5);
  });

  it('interpolate(0.5) sets scale to half of target', () => {
    const m = mob();
    // Default scale is (1,1,1), so target is (1,1,1)
    const anim = new GrowFromCenter(m);
    anim.begin();
    anim.interpolate(0.5);
    expect(m.scaleVector.x).toBeCloseTo(0.5, 5);
    expect(m.scaleVector.y).toBeCloseTo(0.5, 5);
    expect(m.scaleVector.z).toBeCloseTo(0.5, 5);
  });

  it('interpolate(1) sets scale to target', () => {
    const m = mob();
    const anim = new GrowFromCenter(m);
    anim.begin();
    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(1, 5);
    expect(m.scaleVector.y).toBeCloseTo(1, 5);
    expect(m.scaleVector.z).toBeCloseTo(1, 5);
  });

  it('finish() restores exact target scale', () => {
    const m = mob();
    const anim = new GrowFromCenter(m);
    anim.begin();
    anim.interpolate(0.3); // partial
    anim.finish();
    expect(m.scaleVector.x).toBeCloseTo(1, 5);
    expect(m.scaleVector.y).toBeCloseTo(1, 5);
    expect(m.scaleVector.z).toBeCloseTo(1, 5);
  });

  it('works with non-unit initial scale', () => {
    const m = mob();
    m.scaleVector.set(2, 3, 4);
    const anim = new GrowFromCenter(m);
    anim.begin();

    // Verify scale starts at 0
    expect(m.scaleVector.x).toBeCloseTo(0, 5);

    anim.interpolate(0.5);
    expect(m.scaleVector.x).toBeCloseTo(1, 5);
    expect(m.scaleVector.y).toBeCloseTo(1.5, 5);
    expect(m.scaleVector.z).toBeCloseTo(2, 5);

    anim.interpolate(1);
    expect(m.scaleVector.x).toBeCloseTo(2, 5);
    expect(m.scaleVector.y).toBeCloseTo(3, 5);
    expect(m.scaleVector.z).toBeCloseTo(4, 5);
  });

  it('growFromCenter() factory function creates a GrowFromCenter animation', () => {
    const m = mob();
    const anim = growFromCenter(m);
    expect(anim).toBeInstanceOf(GrowFromCenter);
  });
});

// ---------------------------------------------------------------------------
// Rotate
// ---------------------------------------------------------------------------
describe('Rotate', () => {
  it('constructor stores angle, axis defaults to Z [0,0,1]', () => {
    const m = mob();
    const anim = new Rotate(m, { angle: Math.PI / 2 });
    expect(anim.angle).toBe(Math.PI / 2);
    expect(anim.axis).toEqual([0, 0, 1]);
  });

  it('interpolate(0.5) rotates halfway', () => {
    const m = mob();
    const halfAngle = Math.PI / 4; // full angle PI/2, half is PI/4
    const anim = new Rotate(m, { angle: Math.PI / 2, aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(0.5);
    // Z-axis rotation of PI/4 => rotation.z should be PI/4
    expect(m.rotation.z).toBeCloseTo(halfAngle, 5);
  });

  it('interpolate(1) rotates full angle', () => {
    const m = mob();
    const anim = new Rotate(m, { angle: Math.PI / 2, aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(1);
    expect(m.rotation.z).toBeCloseTo(Math.PI / 2, 5);
  });

  it('rotation about custom axis', () => {
    const m = mob();
    // Rotate PI/2 about X axis
    const anim = new Rotate(m, { angle: Math.PI / 2, axis: [1, 0, 0], aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(1);
    expect(m.rotation.x).toBeCloseTo(Math.PI / 2, 5);
  });

  it('rotation about a point: Z-axis PI/2 orbits (1,0,0) to (0,1,0)', () => {
    const m = mob();
    m.position.set(1, 0, 0);
    const anim = new Rotate(m, {
      angle: Math.PI / 2,
      aboutPoint: [0, 0, 0],
    });
    anim.begin();
    anim.interpolate(1);
    expect(m.position.x).toBeCloseTo(0, 5);
    expect(m.position.y).toBeCloseTo(1, 5);
    expect(m.position.z).toBeCloseTo(0, 5);
  });

  it('rotation about a point at alpha=0.5: (1,0,0) -> (cos(PI/4), sin(PI/4), 0)', () => {
    const m = mob();
    m.position.set(1, 0, 0);
    const anim = new Rotate(m, {
      angle: Math.PI / 2,
      aboutPoint: [0, 0, 0],
    });
    anim.begin();
    anim.interpolate(0.5);
    expect(m.position.x).toBeCloseTo(Math.cos(Math.PI / 4), 5);
    expect(m.position.y).toBeCloseTo(Math.sin(Math.PI / 4), 5);
    expect(m.position.z).toBeCloseTo(0, 5);
  });

  it('finish() sets exact rotation', () => {
    const m = mob();
    const anim = new Rotate(m, { angle: Math.PI, aboutPoint: [0, 0, 0] });
    anim.begin();
    anim.interpolate(0.3); // partial
    anim.finish();
    expect(m.rotation.z).toBeCloseTo(Math.PI, 5);
  });

  it('rotate() factory function creates a Rotate animation', () => {
    const m = mob();
    const anim = rotate(m, Math.PI / 3);
    expect(anim).toBeInstanceOf(Rotate);
    expect(anim.angle).toBe(Math.PI / 3);
    expect(anim.axis).toEqual([0, 0, 1]);
  });
});

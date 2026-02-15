import { describe, it, expect, beforeEach } from 'vitest';
import { Mobject } from '../core/Mobject';
import { linear } from '../rate-functions';
import {
  Add,
  add,
  Remove,
  remove,
  Wait,
  wait,
  Rotating,
  rotating,
  Broadcast,
  broadcast,
} from './utility/index';

function createMob(): Mobject {
  return new Mobject();
}

// ==================================================================
// Add
// ==================================================================

describe('Add', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = createMob();
  });

  describe('constructor', () => {
    it('forces duration to 0', () => {
      const anim = new Add(mob);
      expect(anim.duration).toBe(0);
    });

    it('forces duration to 0 even if custom duration provided', () => {
      const anim = new Add(mob, { duration: 5 });
      expect(anim.duration).toBe(0);
    });

    it('stores mobject reference', () => {
      const anim = new Add(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  describe('begin()', () => {
    it('sets mobject opacity to 1', () => {
      mob.opacity = 0;
      const anim = new Add(mob);
      anim.begin();
      expect(mob.opacity).toBe(1);
    });

    it('marks _hasBegun true', () => {
      const anim = new Add(mob);
      anim.begin();
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });
  });

  describe('interpolate()', () => {
    it('does nothing (instant animation)', () => {
      mob.opacity = 1;
      const anim = new Add(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBe(1);
      anim.interpolate(0.5);
      expect(mob.opacity).toBe(1);
      anim.interpolate(1);
      expect(mob.opacity).toBe(1);
    });
  });

  describe('add() factory', () => {
    it('returns an Add instance', () => {
      const anim = add(mob);
      expect(anim).toBeInstanceOf(Add);
    });

    it('stores mobject reference', () => {
      const anim = add(mob);
      expect(anim.mobject).toBe(mob);
    });
  });
});

// ==================================================================
// Remove
// ==================================================================

describe('Remove', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = createMob();
  });

  describe('constructor', () => {
    it('forces duration to 0', () => {
      const anim = new Remove(mob);
      expect(anim.duration).toBe(0);
    });

    it('forces duration to 0 even if custom duration provided', () => {
      const anim = new Remove(mob, { duration: 3 });
      expect(anim.duration).toBe(0);
    });

    it('stores mobject reference', () => {
      const anim = new Remove(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  describe('begin()', () => {
    it('sets mobject opacity to 0', () => {
      mob.opacity = 1;
      const anim = new Remove(mob);
      anim.begin();
      expect(mob.opacity).toBe(0);
    });

    it('marks _hasBegun true', () => {
      const anim = new Remove(mob);
      anim.begin();
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });
  });

  describe('interpolate()', () => {
    it('does nothing (instant animation)', () => {
      mob.opacity = 1;
      const anim = new Remove(mob);
      anim.begin();
      // opacity set to 0 by begin
      anim.interpolate(0);
      expect(mob.opacity).toBe(0);
      anim.interpolate(1);
      expect(mob.opacity).toBe(0);
    });
  });

  describe('remove() factory', () => {
    it('returns a Remove instance', () => {
      const anim = remove(mob);
      expect(anim).toBeInstanceOf(Remove);
    });

    it('stores mobject reference', () => {
      const anim = remove(mob);
      expect(anim.mobject).toBe(mob);
    });
  });
});

// ==================================================================
// Wait
// ==================================================================

describe('Wait', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = createMob();
  });

  describe('constructor', () => {
    it('defaults duration to 1', () => {
      const anim = new Wait(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const anim = new Wait(mob, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('defaults rateFunc to linear', () => {
      const anim = new Wait(mob);
      expect(anim.rateFunc).toBe(linear);
    });

    it('accepts custom rateFunc', () => {
      const custom = (t: number) => t * t;
      const anim = new Wait(mob, { rateFunc: custom });
      expect(anim.rateFunc).toBe(custom);
    });
  });

  describe('interpolate()', () => {
    it('does nothing visually', () => {
      mob.opacity = 0.7;
      mob.position.set(1, 2, 3);
      const anim = new Wait(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBe(0.7);
      expect(mob.position.x).toBe(1);
      anim.interpolate(0.5);
      expect(mob.opacity).toBe(0.7);
      expect(mob.position.x).toBe(1);
      anim.interpolate(1);
      expect(mob.opacity).toBe(0.7);
      expect(mob.position.x).toBe(1);
    });
  });

  describe('wait() factory', () => {
    it('returns a Wait instance', () => {
      const anim = wait(mob);
      expect(anim).toBeInstanceOf(Wait);
    });

    it('accepts duration as second argument', () => {
      const anim = wait(mob, 5);
      expect(anim.duration).toBe(5);
    });

    it('passes additional options', () => {
      const custom = (t: number) => t;
      const anim = wait(mob, 2, { rateFunc: custom });
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(custom);
    });
  });
});

// ==================================================================
// Rotating
// ==================================================================

describe('Rotating', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = createMob();
  });

  describe('constructor', () => {
    it('defaults duration to 5', () => {
      const anim = new Rotating(mob);
      expect(anim.duration).toBe(5);
    });

    it('defaults angle to 2*PI (TAU)', () => {
      const anim = new Rotating(mob);
      expect(anim.angle).toBeCloseTo(2 * Math.PI, 5);
    });

    it('defaults axis to Z [0,0,1]', () => {
      const anim = new Rotating(mob);
      expect(anim.axis).toEqual([0, 0, 1]);
    });

    it('defaults aboutPoint to null (mobject center)', () => {
      const anim = new Rotating(mob);
      expect(anim.aboutPoint).toBeNull();
    });

    it('defaults rateFunc to linear', () => {
      const anim = new Rotating(mob);
      expect(anim.rateFunc).toBe(linear);
    });

    it('accepts custom angle', () => {
      const anim = new Rotating(mob, { angle: Math.PI });
      expect(anim.angle).toBeCloseTo(Math.PI, 5);
    });

    it('accepts custom axis', () => {
      const anim = new Rotating(mob, { axis: [1, 0, 0] });
      expect(anim.axis).toEqual([1, 0, 0]);
    });

    it('accepts custom aboutPoint', () => {
      const anim = new Rotating(mob, { aboutPoint: [1, 2, 3] });
      expect(anim.aboutPoint).toEqual([1, 2, 3]);
    });

    it('accepts custom duration', () => {
      const anim = new Rotating(mob, { duration: 10 });
      expect(anim.duration).toBe(10);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 rotation is unchanged from initial', () => {
      mob.position.set(0, 0, 0);
      // Provide aboutPoint to avoid getCenter() calling getThreeObject() on abstract Mobject
      const anim = new Rotating(mob, { aboutPoint: [0, 0, 0] });
      anim.begin();

      const initialZ = mob.rotation.z;
      anim.interpolate(0);
      expect(mob.rotation.z).toBeCloseTo(initialZ, 5);
    });

    it('at alpha=1 with default angle rotates by TAU (full circle)', () => {
      mob.position.set(0, 0, 0);
      const anim = new Rotating(mob, { aboutPoint: [0, 0, 0] });
      anim.begin();

      anim.interpolate(1);
      // Full TAU rotation: z should be back near 0 (mod 2PI)
      // Euler angles may wrap, so check sin/cos
      const z = mob.rotation.z;
      expect(Math.cos(z)).toBeCloseTo(1, 3);
      expect(Math.sin(z)).toBeCloseTo(0, 3);
    });

    it('at alpha=0.5 with PI angle rotates by PI/2', () => {
      mob.position.set(0, 0, 0);
      const anim = new Rotating(mob, {
        angle: Math.PI,
        aboutPoint: [0, 0, 0],
      });
      anim.begin();

      anim.interpolate(0.5);
      // totalAngle = PI * 0.5 = PI/2
      const z = mob.rotation.z;
      expect(Math.cos(z)).toBeCloseTo(0, 2);
      expect(Math.sin(z)).toBeCloseTo(1, 2);
    });

    it('rotation about a point changes position', () => {
      mob.position.set(1, 0, 0);
      const anim = new Rotating(mob, {
        angle: Math.PI / 2,
        aboutPoint: [0, 0, 0],
      });
      anim.begin();

      anim.interpolate(1);
      // 90 degrees around Z at origin: (1,0,0) -> (0,1,0)
      expect(mob.position.x).toBeCloseTo(0, 2);
      expect(mob.position.y).toBeCloseTo(1, 2);
    });

    it('rotation about X axis', () => {
      mob.position.set(0, 1, 0);
      const anim = new Rotating(mob, {
        angle: Math.PI / 2,
        axis: [1, 0, 0],
        aboutPoint: [0, 0, 0],
      });
      anim.begin();

      anim.interpolate(1);
      // 90 degrees around X: (0,1,0) -> (0,0,1)
      expect(mob.position.x).toBeCloseTo(0, 2);
      expect(mob.position.y).toBeCloseTo(0, 2);
      expect(mob.position.z).toBeCloseTo(1, 2);
    });

    it('marks mobject dirty', () => {
      const anim = new Rotating(mob, { aboutPoint: [0, 0, 0] });
      anim.begin();
      mob._dirty = false;
      anim.interpolate(0.5);
      expect(mob._dirty).toBe(true);
    });
  });

  describe('rotating() factory', () => {
    it('returns a Rotating instance', () => {
      const anim = rotating(mob);
      expect(anim).toBeInstanceOf(Rotating);
    });

    it('passes options through', () => {
      const anim = rotating(mob, {
        angle: Math.PI,
        duration: 3,
        axis: [0, 1, 0],
      });
      expect(anim.angle).toBeCloseTo(Math.PI, 5);
      expect(anim.duration).toBe(3);
      expect(anim.axis).toEqual([0, 1, 0]);
    });
  });
});

// ==================================================================
// Broadcast
// ==================================================================
// NOTE: Broadcast relies on THREE.js Line2/LineMaterial/LineGeometry
// and window.innerWidth/innerHeight. Full interpolation testing
// requires WebGL context. We test constructor/config and factory only.

describe('Broadcast', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = createMob();
  });

  describe('constructor', () => {
    it('defaults duration to 1', () => {
      const anim = new Broadcast(mob);
      expect(anim.duration).toBe(1);
    });

    it('defaults numRings to 3', () => {
      const anim = new Broadcast(mob);
      expect(anim.numRings).toBe(3);
    });

    it('defaults maxRadius to 2', () => {
      const anim = new Broadcast(mob);
      expect(anim.maxRadius).toBe(2);
    });

    it('defaults lagRatio to 0.3', () => {
      const anim = new Broadcast(mob);
      expect(anim.lagRatio).toBeCloseTo(0.3, 5);
    });

    it('defaults rateFunc to linear', () => {
      const anim = new Broadcast(mob);
      expect(anim.rateFunc).toBe(linear);
    });

    it('accepts custom options', () => {
      const anim = new Broadcast(mob, {
        color: '#ff0000',
        numRings: 5,
        maxRadius: 4,
        strokeWidth: 2,
        lagRatio: 0.5,
        duration: 2,
      });
      expect(anim.ringColor).toBe('#ff0000');
      expect(anim.numRings).toBe(5);
      expect(anim.maxRadius).toBe(4);
      expect(anim.strokeWidth).toBe(2);
      expect(anim.lagRatio).toBeCloseTo(0.5, 5);
      expect(anim.duration).toBe(2);
    });
  });

  describe('broadcast() factory', () => {
    it('returns a Broadcast instance', () => {
      const anim = broadcast(mob);
      expect(anim).toBeInstanceOf(Broadcast);
    });

    it('passes options through', () => {
      const anim = broadcast(mob, {
        numRings: 7,
        maxRadius: 5,
        duration: 3,
      });
      expect(anim.numRings).toBe(7);
      expect(anim.maxRadius).toBe(5);
      expect(anim.duration).toBe(3);
    });
  });
});

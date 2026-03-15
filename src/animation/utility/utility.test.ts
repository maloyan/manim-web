import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { linear } from '../../rate-functions';
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
} from './index';

// =============================================================
// Add Animation
// =============================================================

describe('Add', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('sets duration to 0', () => {
      const anim = new Add(mob);
      expect(anim.duration).toBe(0);
    });

    it('forces duration to 0 even if options specify duration', () => {
      const anim = new Add(mob, { duration: 5 });
      expect(anim.duration).toBe(0);
    });

    it('stores mobject reference', () => {
      const anim = new Add(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('sets opacity to 1', () => {
      mob.opacity = 0;
      const anim = new Add(mob);
      anim.begin();
      expect(mob.opacity).toBe(1);
    });

    it('marks mobject as dirty', () => {
      mob._dirty = false;
      const anim = new Add(mob);
      anim.begin();
      expect(mob._dirty).toBe(true);
    });

    it('resets _isFinished on begin', () => {
      const anim = new Add(mob);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('does nothing (instant animation)', () => {
      mob.opacity = 1;
      const pos = mob.position.clone();
      const anim = new Add(mob);
      anim.begin();
      anim.interpolate(0);
      anim.interpolate(0.5);
      anim.interpolate(1);
      // Nothing should change
      expect(mob.opacity).toBe(1);
      expect(mob.position.x).toBe(pos.x);
      expect(mob.position.y).toBe(pos.y);
    });
  });

  // -----------------------------------------------------------
  // add() factory
  // -----------------------------------------------------------

  describe('add() factory', () => {
    it('returns an Add instance', () => {
      const anim = add(mob);
      expect(anim).toBeInstanceOf(Add);
    });

    it('passes mobject through', () => {
      const anim = add(mob);
      expect(anim.mobject).toBe(mob);
    });

    it('always has duration 0', () => {
      const anim = add(mob, { duration: 10 });
      expect(anim.duration).toBe(0);
    });
  });
});

// =============================================================
// Remove Animation
// =============================================================

describe('Remove', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('sets duration to 0', () => {
      const anim = new Remove(mob);
      expect(anim.duration).toBe(0);
    });

    it('forces duration to 0 even if options specify duration', () => {
      const anim = new Remove(mob, { duration: 5 });
      expect(anim.duration).toBe(0);
    });

    it('stores mobject reference', () => {
      const anim = new Remove(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('sets opacity to 0', () => {
      mob.opacity = 1;
      const anim = new Remove(mob);
      anim.begin();
      expect(mob.opacity).toBe(0);
    });

    it('marks mobject as dirty', () => {
      mob._dirty = false;
      const anim = new Remove(mob);
      anim.begin();
      expect(mob._dirty).toBe(true);
    });

    it('resets _isFinished on begin', () => {
      const anim = new Remove(mob);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('does nothing (instant animation)', () => {
      mob.opacity = 0;
      const anim = new Remove(mob);
      anim.begin();
      anim.interpolate(0);
      anim.interpolate(0.5);
      anim.interpolate(1);
      // Opacity stays at 0 (set in begin)
      expect(mob.opacity).toBe(0);
    });
  });

  // -----------------------------------------------------------
  // remove() factory
  // -----------------------------------------------------------

  describe('remove() factory', () => {
    it('returns a Remove instance', () => {
      const anim = remove(mob);
      expect(anim).toBeInstanceOf(Remove);
    });

    it('passes mobject through', () => {
      const anim = remove(mob);
      expect(anim.mobject).toBe(mob);
    });

    it('always has duration 0', () => {
      const anim = remove(mob, { duration: 10 });
      expect(anim.duration).toBe(0);
    });
  });
});

// =============================================================
// Wait Animation
// =============================================================

describe('Wait', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

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
      const customRate = (t: number) => t * t;
      const anim = new Wait(mob, { rateFunc: customRate });
      expect(anim.rateFunc).toBe(customRate);
    });

    it('stores mobject reference', () => {
      const anim = new Wait(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('does nothing at any alpha', () => {
      mob.position.set(1, 2, 3);
      mob.opacity = 0.7;
      const anim = new Wait(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.position.x).toBe(1);
      expect(mob.opacity).toBe(0.7);

      anim.interpolate(0.5);
      expect(mob.position.x).toBe(1);
      expect(mob.opacity).toBe(0.7);

      anim.interpolate(1);
      expect(mob.position.x).toBe(1);
      expect(mob.opacity).toBe(0.7);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('marks animation as finished', () => {
      const anim = new Wait(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // wait() factory
  // -----------------------------------------------------------

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
      const customRate = (t: number) => t * t;
      const anim = wait(mob, 2, { rateFunc: customRate });
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(customRate);
    });

    it('defaults to duration 1 when undefined', () => {
      const anim = wait(mob, undefined);
      expect(anim.duration).toBe(1);
    });
  });
});

// =============================================================
// Rotating Animation
// =============================================================

describe('Rotating', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('defaults duration to 5', () => {
      const anim = new Rotating(mob);
      expect(anim.duration).toBe(5);
    });

    it('accepts custom duration', () => {
      const anim = new Rotating(mob, { duration: 2 });
      expect(anim.duration).toBe(2);
    });

    it('defaults angle to 2*PI (full revolution)', () => {
      const anim = new Rotating(mob);
      expect(anim.angle).toBeCloseTo(2 * Math.PI, 5);
    });

    it('accepts custom angle', () => {
      const anim = new Rotating(mob, { angle: Math.PI / 2 });
      expect(anim.angle).toBeCloseTo(Math.PI / 2, 5);
    });

    it('defaults axis to Z-axis [0,0,1]', () => {
      const anim = new Rotating(mob);
      expect(anim.axis).toEqual([0, 0, 1]);
    });

    it('accepts custom axis', () => {
      const anim = new Rotating(mob, { axis: [1, 0, 0] });
      expect(anim.axis).toEqual([1, 0, 0]);
    });

    it('defaults aboutPoint to null (uses mobject center)', () => {
      const anim = new Rotating(mob);
      expect(anim.aboutPoint).toBeNull();
    });

    it('accepts custom aboutPoint', () => {
      const anim = new Rotating(mob, { aboutPoint: [1, 2, 3] });
      expect(anim.aboutPoint).toEqual([1, 2, 3]);
    });

    it('defaults rateFunc to linear', () => {
      const anim = new Rotating(mob);
      expect(anim.rateFunc).toBe(linear);
    });

    it('accepts custom rateFunc', () => {
      const customRate = (t: number) => t * t;
      const anim = new Rotating(mob, { rateFunc: customRate });
      expect(anim.rateFunc).toBe(customRate);
    });

    it('stores mobject reference', () => {
      const anim = new Rotating(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('stores initial rotation state', () => {
      mob.rotation.set(0.1, 0.2, 0.3);
      // Provide aboutPoint to avoid getCenter() calling _createThreeObject
      const anim = new Rotating(mob, { aboutPoint: [0, 0, 0] });
      anim.begin();
      // After begin, position/rotation should still be the same
      expect(mob.rotation.x).toBeCloseTo(0.1, 5);
      expect(mob.rotation.y).toBeCloseTo(0.2, 5);
      expect(mob.rotation.z).toBeCloseTo(0.3, 5);
    });

    it('stores initial position', () => {
      mob.position.set(3, 4, 5);
      const anim = new Rotating(mob, { aboutPoint: [0, 0, 0] });
      anim.begin();
      expect(mob.position.x).toBe(3);
      expect(mob.position.y).toBe(4);
      expect(mob.position.z).toBe(5);
    });

    it('uses mobject center when no aboutPoint given', () => {
      // Assign a _threeObject so getCenter() works on abstract Mobject
      mob._threeObject = new THREE.Group();
      mob.position.set(1, 2, 0);
      const anim = new Rotating(mob);
      // Should not throw - it calls getCenter() internally
      expect(() => anim.begin()).not.toThrow();
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('at alpha=0: rotation stays at initial value', () => {
      mob.rotation.set(0, 0, 0);
      const anim = new Rotating(mob, { angle: Math.PI, aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0);
      expect(mob.rotation.z).toBeCloseTo(0, 3);
    });

    it('at alpha=1 with PI angle: rotates by PI around Z-axis', () => {
      mob.rotation.set(0, 0, 0);
      const anim = new Rotating(mob, { angle: Math.PI, aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(1);
      // After PI rotation around Z, z-euler should be approximately PI
      expect(mob.rotation.z).toBeCloseTo(Math.PI, 2);
    });

    it('at alpha=0.5 with PI angle: rotates by PI/2', () => {
      mob.rotation.set(0, 0, 0);
      const anim = new Rotating(mob, { angle: Math.PI, aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.rotation.z).toBeCloseTo(Math.PI / 2, 2);
    });

    it('marks mobject as dirty', () => {
      const anim = new Rotating(mob, { angle: Math.PI, aboutPoint: [0, 0, 0] });
      anim.begin();
      mob._dirty = false;
      anim.interpolate(0.5);
      expect(mob._dirty).toBe(true);
    });

    it('rotates around X-axis correctly', () => {
      mob.rotation.set(0, 0, 0);
      const anim = new Rotating(mob, {
        angle: Math.PI / 2,
        axis: [1, 0, 0],
        aboutPoint: [0, 0, 0],
      });
      anim.begin();
      anim.interpolate(1);
      // After PI/2 rotation around X, x-euler should change
      expect(mob.rotation.x).toBeCloseTo(Math.PI / 2, 2);
    });

    it('rotation about a point moves position', () => {
      // Place mob at (2,0,0), rotate about origin by PI around Z-axis
      mob.position.set(2, 0, 0);
      const anim = new Rotating(mob, {
        angle: Math.PI,
        aboutPoint: [0, 0, 0],
      });
      anim.begin();
      anim.interpolate(1);
      // After PI rotation around Z about origin: (2,0,0) -> (-2,0,0)
      expect(mob.position.x).toBeCloseTo(-2, 2);
      expect(mob.position.y).toBeCloseTo(0, 2);
    });

    it('rotation about a point at alpha=0.5 moves position halfway', () => {
      mob.position.set(1, 0, 0);
      const anim = new Rotating(mob, {
        angle: Math.PI,
        aboutPoint: [0, 0, 0],
      });
      anim.begin();
      anim.interpolate(0.5);
      // After PI/2 rotation around Z about origin: (1,0,0) -> (0,1,0)
      expect(mob.position.x).toBeCloseTo(0, 2);
      expect(mob.position.y).toBeCloseTo(1, 2);
    });

    it('full revolution (2*PI) returns to original rotation', () => {
      mob.rotation.set(0, 0, 0);
      const anim = new Rotating(mob, { angle: 2 * Math.PI, aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(1);
      // After full revolution, should be back at (nearly) 0
      // Note: Euler angles may wrap, so check quaternion equivalence
      const quat = new THREE.Quaternion().setFromEuler(mob.rotation);
      const identityQuat = new THREE.Quaternion(); // identity
      // The quaternion should be close to identity (or its negative, which represents same rotation)
      expect(Math.abs(quat.dot(identityQuat))).toBeCloseTo(1, 2);
    });

    it('negative angle rotates in opposite direction', () => {
      mob.position.set(1, 0, 0);
      const anim = new Rotating(mob, {
        angle: -Math.PI / 2,
        aboutPoint: [0, 0, 0],
      });
      anim.begin();
      anim.interpolate(1);
      // -PI/2 around Z about origin: (1,0,0) -> (0,-1,0)
      expect(mob.position.x).toBeCloseTo(0, 2);
      expect(mob.position.y).toBeCloseTo(-1, 2);
    });
  });

  // -----------------------------------------------------------
  // rotating() factory
  // -----------------------------------------------------------

  describe('rotating() factory', () => {
    it('returns a Rotating instance', () => {
      const anim = rotating(mob);
      expect(anim).toBeInstanceOf(Rotating);
    });

    it('passes options through', () => {
      const anim = rotating(mob, {
        angle: Math.PI,
        axis: [1, 0, 0],
        duration: 3,
        aboutPoint: [1, 2, 3],
      });
      expect(anim.angle).toBeCloseTo(Math.PI, 5);
      expect(anim.axis).toEqual([1, 0, 0]);
      expect(anim.duration).toBe(3);
      expect(anim.aboutPoint).toEqual([1, 2, 3]);
    });

    it('passes mobject through', () => {
      const anim = rotating(mob);
      expect(anim.mobject).toBe(mob);
    });
  });
});

// =============================================================
// Broadcast Animation
// =============================================================

describe('Broadcast', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('defaults duration to 3', () => {
      const anim = new Broadcast(mob);
      expect(anim.duration).toBe(3);
    });

    it('accepts custom duration', () => {
      const anim = new Broadcast(mob, { duration: 5 });
      expect(anim.duration).toBe(5);
    });

    it('defaults nMobs to 5', () => {
      const anim = new Broadcast(mob);
      expect(anim.nMobs).toBe(5);
    });

    it('accepts custom nMobs', () => {
      const anim = new Broadcast(mob, { nMobs: 8 });
      expect(anim.nMobs).toBe(8);
    });

    it('defaults focalPoint to ORIGIN', () => {
      const anim = new Broadcast(mob);
      expect(anim.focalPoint).toEqual([0, 0, 0]);
    });

    it('accepts custom focalPoint', () => {
      const anim = new Broadcast(mob, { focalPoint: [1, 2, 3] });
      expect(anim.focalPoint).toEqual([1, 2, 3]);
    });

    it('defaults lagRatio to 0.2', () => {
      const anim = new Broadcast(mob);
      expect(anim.lagRatio).toBeCloseTo(0.2, 5);
    });

    it('accepts custom lagRatio', () => {
      const anim = new Broadcast(mob, { lagRatio: 0.5 });
      expect(anim.lagRatio).toBeCloseTo(0.5, 5);
    });

    it('defaults rateFunc to linear', () => {
      const anim = new Broadcast(mob);
      expect(anim.rateFunc).toBe(linear);
    });

    it('stores mobject reference', () => {
      const anim = new Broadcast(mob);
      expect(anim.mobject).toBe(mob);
    });

    it('defaults initialOpacity to 1', () => {
      const anim = new Broadcast(mob);
      expect(anim.initialOpacity).toBe(1);
    });

    it('defaults finalOpacity to 0', () => {
      const anim = new Broadcast(mob);
      expect(anim.finalOpacity).toBe(0);
    });

    it('defaults initialWidth to 0', () => {
      const anim = new Broadcast(mob);
      expect(anim.initialWidth).toBe(0);
    });

    it('defaults remover to false', () => {
      const anim = new Broadcast(mob);
      expect(anim.remover).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // interpolate() without begin (guard test)
  // -----------------------------------------------------------

  describe('interpolate() guard', () => {
    it('returns early if copies are empty (no begin called)', () => {
      const anim = new Broadcast(mob);
      // Should not throw - interpolate returns early if _copies is empty
      expect(() => anim.interpolate(0.5)).not.toThrow();
    });
  });

  // -----------------------------------------------------------
  // finish() without begin (guard test)
  // -----------------------------------------------------------

  describe('finish() without begin', () => {
    it('handles finish gracefully when copies were never created', () => {
      const anim = new Broadcast(mob);
      // Should not throw
      expect(() => anim.finish()).not.toThrow();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // broadcast() factory
  // -----------------------------------------------------------

  describe('broadcast() factory', () => {
    it('returns a Broadcast instance', () => {
      const anim = broadcast(mob);
      expect(anim).toBeInstanceOf(Broadcast);
    });

    it('passes options through', () => {
      const anim = broadcast(mob, {
        focalPoint: [1, 0, 0],
        nMobs: 7,
        initialOpacity: 0.8,
        finalOpacity: 0.1,
        initialWidth: 0.5,
        lagRatio: 0.3,
        duration: 2,
      });
      expect(anim.focalPoint).toEqual([1, 0, 0]);
      expect(anim.nMobs).toBe(7);
      expect(anim.initialOpacity).toBe(0.8);
      expect(anim.finalOpacity).toBe(0.1);
      expect(anim.initialWidth).toBe(0.5);
      expect(anim.lagRatio).toBeCloseTo(0.3, 5);
      expect(anim.duration).toBe(2);
    });

    it('passes mobject through', () => {
      const anim = broadcast(mob);
      expect(anim.mobject).toBe(mob);
    });
  });
});

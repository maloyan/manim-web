import { describe, it, expect } from 'vitest';
import { PhysicsWorld } from './PhysicsWorld';
import { DistanceConstraint, SpringConstraint } from './constraints';
import { pendulum, springChain } from './builders';
import { distanceVec2 } from './vec2';

describe('DistanceConstraint', () => {
  it('keeps a pendulum bob a near-constant distance from the pivot', () => {
    const pivot: [number, number] = [0, 2];
    const length = 1.5;
    const world = pendulum({ pivot, length, angle: Math.PI / 3 });
    const bob = world.getBodies()[0];
    for (let i = 0; i < 200; i++) {
      world.step(0.02);
      expect(distanceVec2(bob.position, pivot)).toBeCloseTo(length, 4);
    }
  });

  it('the bob actually swings (position changes under gravity)', () => {
    const world = pendulum({ pivot: [0, 2], length: 1.5, angle: Math.PI / 3 });
    const bob = world.getBodies()[0];
    const startX = bob.position[0];
    for (let i = 0; i < 20; i++) world.step(0.02);
    expect(bob.position[0]).not.toBeCloseTo(startX, 3);
  });

  it('holds the distance between two dynamic bodies', () => {
    const world = new PhysicsWorld({ gravity: [0, -9.8] });
    const a = world.addBody({ position: [-0.5, 0], mass: 1 });
    const b = world.addBody({ position: [0.5, 0], mass: 1 });
    world.addConstraint(new DistanceConstraint(a, b, 1));
    for (let i = 0; i < 50; i++) world.step(0.02);
    expect(distanceVec2(a.position, b.position)).toBeCloseTo(1, 4);
  });
});

describe('SpringConstraint', () => {
  it('pulls a body toward the rest length and settles there', () => {
    const anchor: [number, number] = [0, 3];
    const rest = 1;
    const world = new PhysicsWorld({ gravity: [0, 0] });
    const body = world.addBody({ position: [0, 3], mass: 1 });
    // Start stretched; a damped spring should settle at rest length below.
    body.position[1] = 1; // stretched to length 2
    world.addConstraint(new SpringConstraint(body, anchor, rest, { stiffness: 60, damping: 6 }));
    for (let i = 0; i < 400; i++) world.step(0.01);
    expect(distanceVec2(body.position, anchor)).toBeCloseTo(rest, 2);
  });

  it('a spring chain settles without exploding', () => {
    const world = springChain({ count: 4, spacing: 0.5, stiffness: 80, damping: 6 });
    for (let i = 0; i < 300; i++) world.step(0.01);
    for (const body of world.getBodies()) {
      expect(Number.isFinite(body.position[0])).toBe(true);
      expect(Number.isFinite(body.position[1])).toBe(true);
    }
  });
});

describe('builders determinism', () => {
  it('springChain with the same seed produces an identical trajectory', () => {
    const run = (seed: number): number[][] => {
      const w = springChain({ count: 3, jitter: 0.2, seed });
      for (let i = 0; i < 30; i++) w.step(0.02);
      return w.getBodies().map((b) => [...b.position]);
    };
    expect(run(5)).toEqual(run(5));
  });

  it('springChain with a different seed diverges when jitter is on', () => {
    const run = (seed: number): number[][] => {
      const w = springChain({ count: 3, jitter: 0.2, seed });
      for (let i = 0; i < 30; i++) w.step(0.02);
      return w.getBodies().map((b) => [...b.position]);
    };
    expect(run(1)).not.toEqual(run(2));
  });
});

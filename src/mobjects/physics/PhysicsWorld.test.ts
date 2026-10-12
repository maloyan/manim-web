import { describe, it, expect } from 'vitest';
import { PhysicsWorld } from './PhysicsWorld';
import { Body } from './bodies';
import { Dot } from '../geometry/Dot';

describe('PhysicsWorld', () => {
  describe('gravity and integration', () => {
    it('accelerates velocity.y by g * dt each step (semi-implicit Euler)', () => {
      const g = 10;
      const world = new PhysicsWorld({ gravity: [0, -g] });
      const body = world.addBody({ position: [0, 0], velocity: [0, 0] });
      const dt = 0.1;
      for (let i = 1; i <= 5; i++) {
        world.step(dt);
        expect(body.velocity[1]).toBeCloseTo(-g * dt * i, 10);
      }
    });

    it('integrates position from the updated velocity', () => {
      const g = 10;
      const world = new PhysicsWorld({ gravity: [0, -g] });
      const body = world.addBody({ position: [0, 0] });
      const dt = 0.1;
      world.step(dt);
      // v.y = -g*dt; pos.y += v.y*dt = -g*dt^2
      expect(body.velocity[1]).toBeCloseTo(-g * dt, 10);
      expect(body.position[1]).toBeCloseTo(-g * dt * dt, 10);
    });

    it('gravityScale of 0 ignores gravity for that body', () => {
      const world = new PhysicsWorld({ gravity: [0, -10] });
      const floating = world.addBody({ position: [0, 0], gravityScale: 0 });
      for (let i = 0; i < 10; i++) world.step(0.1);
      expect(floating.velocity[1]).toBeCloseTo(0, 10);
      expect(floating.position[1]).toBeCloseTo(0, 10);
    });
  });

  describe('bouncing off the bounds', () => {
    it('reverses velocity scaled by restitution on the floor', () => {
      const world = new PhysicsWorld({ gravity: [0, 0], bounds: { minY: 0 } });
      const e = 0.8;
      const ball = world.addBody({
        position: [0, 0.3],
        velocity: [0, -5],
        restitution: e,
        shape: { kind: 'circle', radius: 0.2 },
      });
      world.step(0.1);
      // Bottom crossed the floor, so velocity flips and loses the (1 - e) share.
      expect(ball.velocity[1]).toBeCloseTo(5 * e, 10);
      expect(ball.velocity[1]).toBeGreaterThan(0);
      // The ball sits on the floor: bottom (pos.y - r) == 0.
      expect(ball.position[1]).toBeCloseTo(0.2, 10);
    });

    it('a full-restitution ball keeps its speed after a floor bounce', () => {
      const world = new PhysicsWorld({ gravity: [0, 0], bounds: { minY: 0 } });
      const ball = world.addBody({
        position: [0, 0.3],
        velocity: [0, -4],
        restitution: 1,
        shape: { kind: 'circle', radius: 0.2 },
      });
      world.step(0.1);
      expect(Math.abs(ball.velocity[1])).toBeCloseTo(4, 10);
    });
  });

  describe('circle-circle momentum', () => {
    it('conserves linear momentum through a collision', () => {
      const world = new PhysicsWorld({ gravity: [0, 0] });
      const a = world.addBody({
        position: [-0.4, 0],
        velocity: [2, 0],
        mass: 1,
        restitution: 0.5,
        shape: { kind: 'circle', radius: 0.5 },
      });
      const b = world.addBody({
        position: [0.4, 0],
        velocity: [-1, 0],
        mass: 2,
        restitution: 0.5,
        shape: { kind: 'circle', radius: 0.5 },
      });
      const before = a.mass * a.velocity[0] + b.mass * b.velocity[0];
      world.step(0.01);
      const after = a.mass * a.velocity[0] + b.mass * b.velocity[0];
      expect(after).toBeCloseTo(before, 8);
    });

    it('swaps velocities for an equal-mass elastic head-on hit', () => {
      const world = new PhysicsWorld({ gravity: [0, 0] });
      const a = world.addBody({
        position: [-0.4, 0],
        velocity: [1, 0],
        restitution: 1,
        shape: { kind: 'circle', radius: 0.5 },
      });
      const b = world.addBody({
        position: [0.4, 0],
        velocity: [-1, 0],
        restitution: 1,
        shape: { kind: 'circle', radius: 0.5 },
      });
      world.step(0.001);
      expect(a.velocity[0]).toBeCloseTo(-1, 6);
      expect(b.velocity[0]).toBeCloseTo(1, 6);
    });
  });

  describe('determinism', () => {
    it('produces an identical trajectory for the same configuration', () => {
      const build = (): PhysicsWorld => {
        const w = new PhysicsWorld({ gravity: [0, -9.8], bounds: { minY: -2 }, seed: 7 });
        w.addBody({ position: [0.1, 1], velocity: [0.3, 0], restitution: 0.7 });
        w.addBody({ position: [-0.2, 2], velocity: [-0.1, 0.2], restitution: 0.4 });
        return w;
      };
      const a = build();
      const b = build();
      for (let i = 0; i < 40; i++) {
        a.step(0.05);
        b.step(0.05);
      }
      expect(a.getBodies().map((x) => [...x.position])).toEqual(
        b.getBodies().map((x) => [...x.position]),
      );
    });
  });

  describe('reset', () => {
    it('restores every body to its initial position and velocity', () => {
      const world = new PhysicsWorld({ gravity: [0, -9.8] });
      const body = world.addBody({ position: [1, 5], velocity: [2, 0] });
      for (let i = 0; i < 10; i++) world.step(0.1);
      expect(body.position[1]).toBeLessThan(5);
      world.reset();
      expect(body.position).toEqual([1, 5]);
      expect(body.velocity).toEqual([2, 0]);
    });

    it('repeats the same evolution after a reset', () => {
      const world = new PhysicsWorld({ gravity: [0, -9.8], bounds: { minY: -1 } });
      world.addBody({ position: [0, 2], velocity: [1, 0], restitution: 0.6 });
      const run = (): number[] => {
        for (let i = 0; i < 30; i++) world.step(0.05);
        return [...world.getBodies()[0].position];
      };
      const first = run();
      world.reset();
      const second = run();
      expect(second).toEqual(first);
    });
  });

  describe('edge cases', () => {
    it('does not throw for an empty world', () => {
      const world = new PhysicsWorld();
      expect(() => world.step(0.1)).not.toThrow();
      expect(world.getBodies()).toEqual([]);
    });

    it('does not advance on a non-positive dt', () => {
      const world = new PhysicsWorld({ gravity: [0, -10] });
      const body = world.addBody({ position: [0, 0] });
      expect(() => {
        world.step(0);
        world.step(-1);
      }).not.toThrow();
      expect(body.position).toEqual([0, 0]);
      expect(body.velocity).toEqual([0, 0]);
    });

    it('never moves a single static body', () => {
      const world = new PhysicsWorld({ gravity: [0, -10] });
      const wall = world.addBody({ position: [0, 0], isStatic: true });
      expect(wall.invMass).toBe(0);
      expect(wall.mass).toBe(Infinity);
      for (let i = 0; i < 10; i++) world.step(0.1);
      expect(wall.position).toEqual([0, 0]);
      expect(wall.velocity).toEqual([0, 0]);
    });
  });

  describe('scene integration', () => {
    it('drives the simulation through the updater loop', () => {
      const world = new PhysicsWorld({ gravity: [0, -10] });
      const body = world.addBody({ position: [0, 0] });
      world.update(0.1); // scene render loop entry point
      expect(body.velocity[1]).toBeCloseTo(-1, 10);
    });

    it('moves an attached mobject to the body position', () => {
      const world = new PhysicsWorld({ gravity: [0, -10] });
      const dot = new Dot({ point: [0, 2, 0] });
      const body = world.addBody({
        position: [0, 2],
        shape: { kind: 'circle', radius: 0.1 },
        mobject: dot,
      });
      expect(world.children).toContain(dot);
      for (let i = 0; i < 5; i++) world.step(0.1);
      const center = dot.getCenter();
      expect(center[1]).toBeCloseTo(body.position[1], 6);
      expect(center[1]).toBeLessThan(2);
    });

    it('accepts a Body instance directly', () => {
      const world = new PhysicsWorld({ gravity: [0, 0] });
      const body = new Body({ position: [3, 4] });
      expect(world.addBody(body)).toBe(body);
      expect(world.getBody(0)).toBe(body);
    });

    it('copy() reproduces the same seeded evolution', () => {
      const world = new PhysicsWorld({ gravity: [0, -9.8], bounds: { minY: -1 }, seed: 3 });
      world.addBody({ position: [0, 2], velocity: [1, 0], restitution: 0.5 });
      const clone = world.copy();
      for (let i = 0; i < 20; i++) {
        world.step(0.05);
        clone.step(0.05);
      }
      expect(clone.getBodies().map((b) => [...b.position])).toEqual(
        world.getBodies().map((b) => [...b.position]),
      );
    });
  });
});

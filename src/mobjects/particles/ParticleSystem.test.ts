import { describe, it, expect } from 'vitest';
import { ParticleSystem } from './ParticleSystem';
import { interpolateColor } from '../../utils/color';

describe('ParticleSystem', () => {
  describe('spawning', () => {
    it('spawns ~spawnRate * dt particles per step (within rounding)', () => {
      const ps = new ParticleSystem({ spawnRate: 30, lifetime: 100, seed: 1 });
      ps.step(1.0);
      expect(ps.getLivingCount()).toBe(30);
    });

    it('carries the fractional remainder across steps', () => {
      const ps = new ParticleSystem({ spawnRate: 25, lifetime: 100, seed: 1 });
      ps.step(0.1); // 2.5 -> floor 2
      expect(ps.getLivingCount()).toBe(2);
      ps.step(0.1); // carry 0.5 + 2.5 = 3.0 -> floor 3
      expect(ps.getLivingCount()).toBe(5); // 25 * 0.2 total
    });

    it('does not spawn on a non-positive dt', () => {
      const ps = new ParticleSystem({ spawnRate: 30, lifetime: 100, seed: 1 });
      ps.step(0);
      ps.step(-1);
      expect(ps.getLivingCount()).toBe(0);
    });

    it('caps the living count at maxParticles', () => {
      const ps = new ParticleSystem({ spawnRate: 1000, maxParticles: 50, lifetime: 100, seed: 1 });
      for (let i = 0; i < 20; i++) ps.step(0.1);
      expect(ps.getLivingCount()).toBe(50);
    });
  });

  describe('forces', () => {
    it('gravity accelerates velocity.y as -g * age (semi-implicit Euler)', () => {
      const g = 10;
      const ps = new ParticleSystem({
        spawnRate: 10,
        lifetime: 100,
        velocity: [0, 0, 0],
        forces: { gravity: [0, -g, 0] },
        seed: 1,
      });
      const dt = 0.1;
      for (let i = 0; i < 5; i++) ps.step(dt);
      for (const p of ps.getParticles()) {
        expect(p.velocity[1]).toBeCloseTo(-g * p.age, 6);
        expect(p.position[1]).toBeLessThan(0); // fell downward
      }
    });

    it('drag reduces speed over time', () => {
      const ps = new ParticleSystem({
        spawnRate: 10,
        lifetime: 100,
        velocity: [5, 0, 0],
        forces: { drag: 2 },
        seed: 1,
      });
      ps.step(0.1);
      const after = ps.getParticles()[0].velocity[0];
      expect(after).toBeLessThan(5);
      expect(after).toBeGreaterThan(0);
    });
  });

  describe('lifetime', () => {
    it('removes particles once age passes lifetime (count drops to 0)', () => {
      const ps = new ParticleSystem({ spawnRate: 50, lifetime: 0.3, seed: 1 });
      for (let i = 0; i < 5; i++) ps.step(0.1);
      expect(ps.getLivingCount()).toBeGreaterThan(0);
      ps.setSpawnRate(0);
      for (let i = 0; i < 10; i++) ps.step(0.1); // 1s elapsed, well past lifetime
      expect(ps.getLivingCount()).toBe(0);
    });

    it('never lets a particle age beyond its lifetime plus one step', () => {
      const lifetime = 0.35;
      const dt = 0.1;
      const ps = new ParticleSystem({ spawnRate: 10, lifetime, seed: 1 });
      for (let i = 0; i < 30; i++) ps.step(dt);
      const maxAge = Math.max(...ps.getParticles().map((p) => p.age));
      expect(maxAge).toBeLessThanOrEqual(lifetime + dt + 1e-9);
    });
  });

  describe('determinism', () => {
    it('same seed produces identical positions after N steps', () => {
      const opts = {
        spawnRate: 20,
        lifetime: 100,
        positionSpread: [1, 1, 1] as [number, number, number],
        velocitySpread: [1, 1, 1] as [number, number, number],
        seed: 42,
      };
      const a = new ParticleSystem(opts);
      const b = new ParticleSystem(opts);
      for (let i = 0; i < 10; i++) {
        a.step(0.1);
        b.step(0.1);
      }
      expect(a.getParticles().map((p) => p.position)).toEqual(
        b.getParticles().map((p) => p.position),
      );
    });

    it('different seed produces different positions', () => {
      const base = {
        spawnRate: 20,
        lifetime: 100,
        positionSpread: [1, 1, 1] as [number, number, number],
        velocitySpread: [1, 1, 1] as [number, number, number],
      };
      const a = new ParticleSystem({ ...base, seed: 1 });
      const b = new ParticleSystem({ ...base, seed: 2 });
      for (let i = 0; i < 10; i++) {
        a.step(0.1);
        b.step(0.1);
      }
      expect(a.getParticles().map((p) => p.position)).not.toEqual(
        b.getParticles().map((p) => p.position),
      );
    });
  });

  describe('size and color interpolation', () => {
    it('interpolates size from startSize to endSize over the life', () => {
      const ps = new ParticleSystem({
        spawnRate: 10,
        lifetime: 1,
        startSize: 10,
        endSize: 0,
        seed: 1,
      });
      ps.step(0.1); // oldest particle: age 0.1, t = 0.1
      expect(ps.getParticles()[0].size).toBeCloseTo(9, 6); // lerp(10, 0, 0.1)
      for (let i = 0; i < 9; i++) ps.step(0.1); // oldest reaches t = 1 (age 1.0)
      expect(ps.getParticles()[0].size).toBeLessThan(1);
    });

    it('interpolates color from startColor to endColor over the life', () => {
      const ps = new ParticleSystem({
        spawnRate: 10,
        lifetime: 1,
        startColor: '#ff0000',
        endColor: '#0000ff',
        seed: 1,
      });
      ps.step(0.1);
      expect(ps.getParticles()[0].color).toBe(interpolateColor('#ff0000', '#0000ff', 0.1));
    });
  });

  describe('reset and integration hooks', () => {
    it('reset() clears all particles', () => {
      const ps = new ParticleSystem({ spawnRate: 50, lifetime: 100, seed: 1 });
      ps.step(1);
      expect(ps.getLivingCount()).toBeGreaterThan(0);
      ps.reset();
      expect(ps.getLivingCount()).toBe(0);
    });

    it('reset() restarts the PRNG so the evolution repeats', () => {
      const ps = new ParticleSystem({
        spawnRate: 20,
        lifetime: 100,
        positionSpread: [1, 1, 1],
        seed: 7,
      });
      for (let i = 0; i < 5; i++) ps.step(0.1);
      const first = ps.getParticles().map((p) => p.position);
      ps.reset();
      for (let i = 0; i < 5; i++) ps.step(0.1);
      const second = ps.getParticles().map((p) => p.position);
      expect(second).toEqual(first);
    });

    it('update(dt) drives the simulation via the updater loop', () => {
      const ps = new ParticleSystem({ spawnRate: 10, lifetime: 100, seed: 1 });
      ps.update(0.5); // scene render loop entry point
      expect(ps.getLivingCount()).toBe(5);
    });

    it('getParticles() returns copies that cannot mutate internal state', () => {
      const ps = new ParticleSystem({ spawnRate: 10, lifetime: 100, seed: 1 });
      ps.step(0.1);
      const snap = ps.getParticles()[0];
      snap.position[0] = 999;
      expect(ps.getParticles()[0].position[0]).not.toBe(999);
    });
  });

  describe('rendering integration', () => {
    it('mirrors living particles into the point buffer', () => {
      const ps = new ParticleSystem({ spawnRate: 10, lifetime: 100, seed: 1 });
      ps.step(0.3);
      expect(ps.numPoints).toBe(ps.getLivingCount());
    });

    it('copy() reproduces the same seeded evolution', () => {
      const ps = new ParticleSystem({
        spawnRate: 20,
        lifetime: 100,
        velocitySpread: [1, 1, 1],
        seed: 3,
      });
      const clone = ps.copy();
      for (let i = 0; i < 5; i++) {
        ps.step(0.1);
        clone.step(0.1);
      }
      expect(clone.getParticles().map((p) => p.position)).toEqual(
        ps.getParticles().map((p) => p.position),
      );
    });
  });
});

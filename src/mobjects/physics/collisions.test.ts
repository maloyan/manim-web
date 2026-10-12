import { describe, it, expect } from 'vitest';
import { Body } from './bodies';
import { resolveBounds, resolveCircleCircle } from './collisions';

describe('resolveBounds', () => {
  it('clamps a circle to the floor and reflects its velocity by restitution', () => {
    const body = new Body({
      position: [0, -0.5],
      velocity: [0, -3],
      restitution: 0.5,
      shape: { kind: 'circle', radius: 0.2 },
    });
    resolveBounds(body, { minY: 0 });
    expect(body.position[1]).toBeCloseTo(0.2, 10); // bottom sits on the floor
    expect(body.velocity[1]).toBeCloseTo(1.5, 10); // 3 * 0.5, reversed
  });

  it('leaves a body inside the bounds untouched', () => {
    const body = new Body({
      position: [0, 1],
      velocity: [0, -3],
      shape: { kind: 'circle', radius: 0.2 },
    });
    resolveBounds(body, { minY: 0 });
    expect(body.position[1]).toBe(1);
    expect(body.velocity[1]).toBe(-3);
  });

  it('never moves a static body', () => {
    const body = new Body({
      position: [0, -5],
      isStatic: true,
      shape: { kind: 'circle', radius: 0.2 },
    });
    resolveBounds(body, { minY: 0 });
    expect(body.position).toEqual([0, -5]);
  });

  it('clamps a polygon by its axis-aligned bounds', () => {
    const body = new Body({
      position: [0, -0.5],
      velocity: [0, -2],
      restitution: 1,
      shape: {
        kind: 'polygon',
        vertices: [
          [-0.5, -0.5],
          [0.5, -0.5],
          [0.5, 0.5],
          [-0.5, 0.5],
        ],
      },
    });
    resolveBounds(body, { minY: 0 });
    expect(body.aabb()[1]).toBeCloseTo(0, 10); // bottom on the floor
    expect(body.velocity[1]).toBeCloseTo(2, 10);
  });
});

describe('resolveCircleCircle', () => {
  it('separates overlapping circles and exchanges momentum elastically', () => {
    const a = new Body({
      position: [-0.4, 0],
      velocity: [1, 0],
      restitution: 1,
      shape: { kind: 'circle', radius: 0.5 },
    });
    const b = new Body({
      position: [0.4, 0],
      velocity: [-1, 0],
      restitution: 1,
      shape: { kind: 'circle', radius: 0.5 },
    });
    resolveCircleCircle(a, b);
    // Equal mass, elastic, head-on: velocities swap.
    expect(a.velocity[0]).toBeCloseTo(-1, 10);
    expect(b.velocity[0]).toBeCloseTo(1, 10);
    // No longer overlapping.
    expect(
      Math.hypot(b.position[0] - a.position[0], b.position[1] - a.position[1]),
    ).toBeGreaterThanOrEqual(1 - 1e-9);
  });

  it('does nothing when the circles do not overlap', () => {
    const a = new Body({
      position: [-2, 0],
      velocity: [0, 0],
      shape: { kind: 'circle', radius: 0.5 },
    });
    const b = new Body({
      position: [2, 0],
      velocity: [0, 0],
      shape: { kind: 'circle', radius: 0.5 },
    });
    resolveCircleCircle(a, b);
    expect(a.position).toEqual([-2, 0]);
    expect(b.position).toEqual([2, 0]);
  });

  it('a heavy body barely moves when a light one hits it', () => {
    const light = new Body({
      position: [-0.4, 0],
      velocity: [2, 0],
      mass: 1,
      shape: { kind: 'circle', radius: 0.5 },
    });
    const heavy = new Body({
      position: [0.4, 0],
      velocity: [0, 0],
      mass: 1000,
      shape: { kind: 'circle', radius: 0.5 },
    });
    resolveCircleCircle(light, heavy);
    expect(Math.abs(heavy.velocity[0])).toBeLessThan(Math.abs(light.velocity[0]));
  });
});

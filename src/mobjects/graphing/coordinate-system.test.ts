import { describe, it, expect } from 'vitest';
import { Axes } from './Axes';
import { NumberPlane } from './NumberPlane';
import type { CoordinateSystem } from './CoordinateSystem';

describe('CoordinateSystem', () => {
  it('is implemented by Axes (structural, compile-time + runtime surface)', () => {
    const axes = new Axes();
    // Assignable to the interface: compile-time proof Axes implements it.
    const system: CoordinateSystem = axes;
    expect(typeof system.coordsToPoint).toBe('function');
    expect(typeof system.c2p).toBe('function');
    expect(typeof system.pointToCoords).toBe('function');
    expect(typeof system.getXAxis).toBe('function');
    expect(typeof system.getYAxis).toBe('function');
    expect(typeof system.getOrigin).toBe('function');
  });

  it('round-trips coords through the shared surface', () => {
    const system: CoordinateSystem = new Axes();
    const point = system.coordsToPoint(2, 3);
    const [x, y] = system.pointToCoords(point);
    expect(x).toBeCloseTo(2, 6);
    expect(y).toBeCloseTo(3, 6);
  });

  it('is inherited by NumberPlane via Axes', () => {
    const plane = new NumberPlane();
    const system: CoordinateSystem = plane;
    expect(plane).toBeInstanceOf(Axes);
    expect(system.getXRange().length).toBe(3);
    expect(system.getYRange().length).toBe(3);
  });
});

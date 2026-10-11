import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { StreamLines, stepVectorField, type VectorFunction } from './VectorField';

/** The streamline children are VMobjects; read their raw anchor/control points. */
const childPoints = (sl: StreamLines): number[][][] =>
  sl.children.map((c) => (c as VMobject).getLocalPoints());

/** Rotational (solenoidal) field. Exact flow is a circle centered at origin. */
const rotationFunc: VectorFunction = (x, y) => [-y, x];
/** Uniform rightward field. */
const uniformFunc: VectorFunction = () => [1, 0];

/** Trace a field from a start point for a fixed number of steps. */
function trace(
  func: VectorFunction,
  start: [number, number],
  dt: number,
  steps: number,
  integrator: 'euler' | 'rk4',
): [number, number] {
  let [x, y] = start;
  for (let i = 0; i < steps; i++) {
    [x, y] = stepVectorField(func, x, y, dt, integrator);
  }
  return [x, y];
}

const radius = (x: number, y: number): number => Math.sqrt(x * x + y * y);

describe('stepVectorField', () => {
  it('defaults to euler and reproduces the legacy `x + dt * v` update exactly', () => {
    const func: VectorFunction = () => [2, -3];
    expect(stepVectorField(func, 1, 1, 0.5)).toEqual([1 + 0.5 * 2, 1 + 0.5 * -3]);
    expect(stepVectorField(func, 1, 1, 0.5, 'euler')).toEqual([2, -0.5]);
  });

  it('rk4 is exact for a constant field (matches euler there)', () => {
    const func: VectorFunction = () => [2, -3];
    expect(stepVectorField(func, 0, 0, 0.5, 'rk4')).toEqual([1, -1.5]);
  });

  it('rk4 stays on the orbit of a rotational field far better than euler', () => {
    const dt = 0.05;
    const steps = 60; // ~0.95 rad of rotation
    const start: [number, number] = [1, 0];

    const [ex, ey] = trace(rotationFunc, start, dt, steps, 'euler');
    const [rx, ry] = trace(rotationFunc, start, dt, steps, 'rk4');

    const eulerErr = Math.abs(radius(ex, ey) - 1);
    const rk4Err = Math.abs(radius(rx, ry) - 1);

    // Euler spirals outward measurably; rk4 holds the unit circle.
    expect(eulerErr).toBeGreaterThan(0.01);
    expect(rk4Err).toBeLessThan(1e-3);
    expect(rk4Err).toBeLessThan(eulerErr);
  });

  it('rk4 error shrinks with smaller steps (fourth-order convergence)', () => {
    const start: [number, number] = [1, 0];
    const totalTime = 1;

    const coarse = trace(rotationFunc, start, 0.1, totalTime / 0.1, 'rk4');
    const fine = trace(rotationFunc, start, 0.025, totalTime / 0.025, 'rk4');

    const coarseErr = Math.abs(radius(coarse[0], coarse[1]) - 1);
    const fineErr = Math.abs(radius(fine[0], fine[1]) - 1);

    expect(fineErr).toBeLessThan(coarseErr);
  });
});

describe('StreamLines integrator option', () => {
  it('defaults to euler', () => {
    const sl = new StreamLines({ func: rotationFunc, startPoints: [[1, 0]] });
    expect(sl.getIntegrator()).toBe('euler');
  });

  it('leaves default output unchanged versus an explicit euler', () => {
    const opts = {
      func: rotationFunc,
      xRange: [-2, 2, 1] as [number, number, number],
      yRange: [-2, 2, 1] as [number, number, number],
      startPoints: [
        [1, 0],
        [2, 0],
      ] as [number, number][],
    };
    const defaultLines = new StreamLines(opts);
    const explicitEuler = new StreamLines({ ...opts, integrator: 'euler' });

    expect(childPoints(explicitEuler)).toEqual(childPoints(defaultLines));
  });

  it('traces a different path with rk4 than with euler on a curved field', () => {
    const base = {
      func: rotationFunc,
      startPoints: [[1, 0]] as [number, number][],
    };
    const euler = new StreamLines({ ...base, integrator: 'euler' });
    const rk4 = new StreamLines({ ...base, integrator: 'rk4' });

    expect(euler.getIntegrator()).toBe('euler');
    expect(rk4.getIntegrator()).toBe('rk4');
    expect(rk4.children.length).toBeGreaterThan(0);

    expect(JSON.stringify(childPoints(rk4))).not.toBe(JSON.stringify(childPoints(euler)));
  });

  it('constructs with rk4 headless without throwing', () => {
    expect(() => new StreamLines({ func: uniformFunc, integrator: 'rk4' })).not.toThrow();
  });

  it('carries the integrator through copy()', () => {
    const sl = new StreamLines({ func: rotationFunc, startPoints: [[1, 0]], integrator: 'rk4' });
    expect(sl.copy().getIntegrator()).toBe('rk4');
  });
});

describe('StreamLines seeded flow animation', () => {
  const makeLines = () =>
    new StreamLines({
      func: rotationFunc,
      xRange: [-2, 2, 1],
      yRange: [-2, 2, 1],
    });

  it('exposes no phases before an animation starts', () => {
    expect(makeLines().getFlowPhases()).toEqual([]);
  });

  it('produces identical phases for the same seed across instances', () => {
    const a = makeLines();
    const b = makeLines();
    a.startAnimation({ seed: 42, warmUp: false });
    b.startAnimation({ seed: 42, warmUp: false });

    const phases = a.getFlowPhases();
    expect(phases.length).toBeGreaterThan(0);
    expect(b.getFlowPhases()).toEqual(phases);

    a.endAnimation();
    b.endAnimation();
  });

  it('produces different phases for different seeds', () => {
    const a = makeLines();
    const b = makeLines();
    a.startAnimation({ seed: 1, warmUp: false });
    b.startAnimation({ seed: 2, warmUp: false });

    expect(b.getFlowPhases()).not.toEqual(a.getFlowPhases());

    a.endAnimation();
    b.endAnimation();
  });

  it('negates seeded phases when warmUp is true', () => {
    const sl = makeLines();
    sl.startAnimation({ seed: 7, warmUp: true });
    const phases = sl.getFlowPhases();
    expect(phases.length).toBeGreaterThan(0);
    expect(phases.every((p) => p <= 0)).toBe(true);
    sl.endAnimation();
  });

  it('clears phases on endAnimation', () => {
    const sl = makeLines();
    sl.startAnimation({ seed: 3 });
    expect(sl.getFlowPhases().length).toBeGreaterThan(0);
    sl.endAnimation();
    expect(sl.getFlowPhases()).toEqual([]);
  });

  it('still animates with no seed (nondeterministic, as before)', () => {
    const sl = makeLines();
    sl.startAnimation({ warmUp: false });
    expect(sl.getFlowPhases().length).toBeGreaterThan(0);
    expect(sl.hasUpdaters()).toBe(true);
    sl.endAnimation();
  });
});

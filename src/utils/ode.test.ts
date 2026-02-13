import { describe, it, expect } from 'vitest';
import { rk4Step, solveIVP, flowPoint, flowPointTrajectory } from './ode';

describe('rk4Step', () => {
  it('integrates a constant derivative', () => {
    // dy/dt = 1, y(0) = 0, after h=1: y = 1
    const f = (_t: number, _y: number[]) => [1];
    const result = rk4Step(f, 0, [0], 1);
    expect(result[0]).toBeCloseTo(1, 10);
  });

  it('integrates a linear ODE dy/dt = -y', () => {
    // Exact: y(t) = e^(-t), y(0) = 1
    // After one step of h=0.1: y ≈ e^(-0.1) ≈ 0.904837
    const f = (_t: number, y: number[]) => [-y[0]];
    const result = rk4Step(f, 0, [1], 0.1);
    expect(result[0]).toBeCloseTo(Math.exp(-0.1), 6);
  });

  it('handles 2D state vectors', () => {
    // Simple harmonic oscillator: x'' = -x
    // y = [x, v], dy/dt = [v, -x]
    const f = (_t: number, y: number[]) => [y[1], -y[0]];
    const result = rk4Step(f, 0, [1, 0], 0.01);
    // x should decrease slightly, v should be slightly negative
    expect(result[0]).toBeLessThan(1);
    expect(result[1]).toBeLessThan(0);
  });
});

describe('solveIVP', () => {
  it('solves exponential decay dy/dt = -y', () => {
    const f = (_t: number, y: number[]) => [-y[0]];
    const result = solveIVP(f, 0, [1], 1, { numSteps: 1000 });
    expect(result.y[0]).toBeCloseTo(Math.exp(-1), 6);
    expect(result.t).toBeCloseTo(1, 10);
  });

  it('solves harmonic oscillator over one period', () => {
    // y = [x, v], dy/dt = [v, -x]
    // x(0) = 1, v(0) = 0 => x(t) = cos(t), v(t) = -sin(t)
    const f = (_t: number, y: number[]) => [y[1], -y[0]];
    const result = solveIVP(f, 0, [1, 0], 2 * Math.PI, { numSteps: 10000 });
    expect(result.y[0]).toBeCloseTo(1, 4);
    expect(result.y[1]).toBeCloseTo(0, 4);
  });

  it('records trajectory when requested', () => {
    const f = (_t: number, y: number[]) => [1];
    const result = solveIVP(f, 0, [0], 1, { numSteps: 10, recordTrajectory: true });
    expect(result.trajectory).toHaveLength(11); // 10 steps + initial
    expect(result.trajectory[0].t).toBe(0);
    expect(result.trajectory[0].y[0]).toBe(0);
    expect(result.trajectory[10].y[0]).toBeCloseTo(1, 10);
  });

  it('empty trajectory when not requested', () => {
    const f = (_t: number, _y: number[]) => [0];
    const result = solveIVP(f, 0, [0], 1);
    expect(result.trajectory).toHaveLength(0);
  });

  it('uses stepSize when provided', () => {
    const f = (_t: number, y: number[]) => [-y[0]];
    const result = solveIVP(f, 0, [1], 1, { stepSize: 0.001 });
    expect(result.y[0]).toBeCloseTo(Math.exp(-1), 6);
  });
});

describe('flowPoint', () => {
  it('flows a point along a constant field', () => {
    // dp/dt = [1, 0, 0] => point moves right
    const field = (_p: [number, number, number]): [number, number, number] => [1, 0, 0];
    const result = flowPoint(field, [0, 0, 0], 5, 1000);
    expect(result[0]).toBeCloseTo(5, 3);
    expect(result[1]).toBeCloseTo(0, 10);
    expect(result[2]).toBeCloseTo(0, 10);
  });

  it('flows along a circular vector field', () => {
    // dp/dt = [-y, x, 0] => circular motion
    // Starting at [1, 0, 0], after PI/2: should be at [0, 1, 0]
    const field = ([x, y, _z]: [number, number, number]): [number, number, number] => [-y, x, 0];
    const result = flowPoint(field, [1, 0, 0], Math.PI / 2, 1000);
    expect(result[0]).toBeCloseTo(0, 2);
    expect(result[1]).toBeCloseTo(1, 2);
    expect(result[2]).toBeCloseTo(0, 10);
  });

  it('returns start point when time is 0', () => {
    const field = (_p: [number, number, number]): [number, number, number] => [1, 1, 1];
    const result = flowPoint(field, [3, 4, 5], 0);
    expect(result).toEqual([3, 4, 5]);
  });

  it('flows backward with negative time', () => {
    const field = (_p: [number, number, number]): [number, number, number] => [1, 0, 0];
    const result = flowPoint(field, [5, 0, 0], -2, 1000);
    expect(result[0]).toBeCloseTo(3, 3);
  });
});

describe('flowPointTrajectory', () => {
  it('returns trajectory including start and end', () => {
    const field = (_p: [number, number, number]): [number, number, number] => [1, 0, 0];
    const traj = flowPointTrajectory(field, [0, 0, 0], 1, 10);
    expect(traj.length).toBeGreaterThan(1);
    expect(traj[0]).toEqual([0, 0, 0]);
    expect(traj[traj.length - 1][0]).toBeCloseTo(1, 3);
  });

  it('returns single-element array when time is 0', () => {
    const field = (_p: [number, number, number]): [number, number, number] => [1, 0, 0];
    const traj = flowPointTrajectory(field, [2, 3, 4], 0);
    expect(traj).toHaveLength(1);
    expect(traj[0]).toEqual([2, 3, 4]);
  });

  it('trajectory points lie on expected path', () => {
    // Circular motion: all points should be ~distance 1 from origin
    const field = ([x, y, _z]: [number, number, number]): [number, number, number] => [-y, x, 0];
    const traj = flowPointTrajectory(field, [1, 0, 0], Math.PI, 500);
    for (const pt of traj) {
      const dist = Math.sqrt(pt[0] ** 2 + pt[1] ** 2);
      expect(dist).toBeCloseTo(1, 2);
    }
  });
});

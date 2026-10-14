import { describe, it, expect } from 'vitest';
import { createCradleSystem, type CradleParams, type CradleInitial } from './cradleSystem';

const baseParams: CradleParams = {
  innerRadius: 1,
  outerRadius: 1.3,
  halfOpening: 1.0,
  cradleMass: 2,
  disk: { mass: 0.5, radius: 0.25 },
  springStiffness: 40,
  springAnchorOffset: 1.8,
  groundDrop: 2.2,
  gravity: 9.81,
  pendulum: {
    lengths: [0.5, 0.4, 0.3],
    linkDensity: 0.2,
    pointMass: 0.3,
    pointSpacing: 0.5,
  },
};

const excited: CradleInitial = {
  theta: 0.3,
  alpha: 0.2,
  beta: [0.2, -0.3, 0.4],
  thetaDot: 0.5,
  alphaDot: -0.4,
  betaDot: [0.3, -0.2, 0.1],
};

/** Mean spacing of downward zero crossings of a signal, found by linear interpolation. */
function measurePeriod(signal: (t: number) => number, step: () => void, dt: number, steps: number) {
  const crossings: number[] = [];
  let prev = signal(0);
  for (let i = 1; i <= steps; i++) {
    step();
    const cur = signal(i * dt);
    if (prev > 0 && cur <= 0) {
      crossings.push((i - 1) * dt + (dt * prev) / (prev - cur));
    }
    prev = cur;
  }
  expect(crossings.length).toBeGreaterThanOrEqual(3);
  const periods = crossings.slice(1).map((c, i) => c - crossings[i]);
  return periods.reduce((a, b) => a + b, 0) / periods.length;
}

describe('createCradleSystem validation', () => {
  it('rejects bad geometry', () => {
    expect(() => createCradleSystem({ ...baseParams, innerRadius: 2 })).toThrow();
    expect(() => createCradleSystem({ ...baseParams, halfOpening: 0 })).toThrow();
    expect(() => createCradleSystem({ ...baseParams, disk: { mass: 1, radius: 1 } })).toThrow();
    expect(() => createCradleSystem({ ...baseParams, springStiffness: -1 })).toThrow();
    expect(() =>
      createCradleSystem({
        ...baseParams,
        pendulum: { lengths: [0.5, 0.4, 0.3], linkDensity: 0, pointMass: 1, pointSpacing: 0.5 },
      }),
    ).toThrow();
  });
});

describe('cradle system API', () => {
  it('reports coordinate count for each configuration', () => {
    expect(createCradleSystem(baseParams).getCoordinateCount()).toBe(5);
    expect(createCradleSystem({ ...baseParams, pendulum: null }).getCoordinateCount()).toBe(2);
    expect(createCradleSystem({ ...baseParams, disk: null }).getCoordinateCount()).toBe(4);
    expect(
      createCradleSystem({ ...baseParams, disk: null, pendulum: null }).getCoordinateCount(),
    ).toBe(1);
  });

  it('applies the initial state and advances time with step', () => {
    const sys = createCradleSystem(baseParams, excited);
    expect(sys.getTheta()).toBeCloseTo(0.3, 12);
    expect(sys.getAlpha()).toBeCloseTo(0.2, 12);
    expect(sys.getBetas()).toEqual([0.2, -0.3, 0.4]);
    expect(sys.getTime()).toBe(0);
    sys.step(0.01);
    expect(sys.getTime()).toBeCloseTo(0.01, 12);
    expect(sys.getTheta()).not.toBeCloseTo(0.3, 6);
  });

  it('exposes the poses of every body', () => {
    const sys = createCradleSystem(baseParams, excited);
    const cradle = sys.getCradlePose();
    expect(cradle.pivot).toEqual([0, 0]);
    expect(cradle.angle).toBeCloseTo(0.3, 12);

    // Disk center sits at R_i - r from the pivot, at angle theta + alpha from straight down.
    const disk = sys.getDiskPose();
    expect(disk).not.toBeNull();
    expect(Math.hypot(disk!.center[0], disk!.center[1])).toBeCloseTo(0.75, 12);
    expect(disk!.center[0]).toBeCloseTo(0.75 * Math.sin(0.5), 12);
    expect(disk!.center[1]).toBeCloseTo(-0.75 * Math.cos(0.5), 12);
    expect(Math.hypot(disk!.contact[0], disk!.contact[1])).toBeCloseTo(1, 12);

    // Springs run from fixed ground anchors to the arm tips.
    const springs = sys.getSpringEndpoints();
    expect(springs[0].anchor).toEqual([1.8, -2.2]);
    expect(springs[1].anchor).toEqual([-1.8, -2.2]);
    expect(springs[0].attach[0]).toBeCloseTo(1.3 * Math.sin(0.3 + 1.0), 12);
    expect(springs[0].attach[1]).toBeCloseTo(-1.3 * Math.cos(0.3 + 1.0), 12);
    expect(springs[1].attach[0]).toBeCloseTo(1.3 * Math.sin(0.3 - 1.0), 12);

    // Linkage: 4 joints starting at the cradle bottom point.
    const joints = sys.getLinkJoints();
    expect(joints).not.toBeNull();
    expect(joints!.length).toBe(4);
    expect(joints![0][0]).toBeCloseTo(1.3 * Math.sin(0.3), 12);
    expect(joints![0][1]).toBeCloseTo(-1.3 * Math.cos(0.3), 12);
    expect(joints![1][0] - joints![0][0]).toBeCloseTo(0.5 * Math.sin(0.2), 12);
    expect(joints![1][1] - joints![0][1]).toBeCloseTo(-0.5 * Math.cos(0.2), 12);

    // Two point masses are w_p apart and perpendicular to the last link.
    const masses = sys.getPointMasses();
    expect(masses).not.toBeNull();
    expect(Math.hypot(masses![0][0] - masses![1][0], masses![0][1] - masses![1][1])).toBeCloseTo(
      0.5,
      12,
    );
    const mid = [(masses![0][0] + masses![1][0]) / 2, (masses![0][1] + masses![1][1]) / 2];
    expect(mid[0]).toBeCloseTo(joints![3][0], 12);
    expect(mid[1]).toBeCloseTo(joints![3][1], 12);
  });

  it('returns null poses for removed parts', () => {
    const sys = createCradleSystem({ ...baseParams, disk: null, pendulum: null });
    expect(sys.getDiskPose()).toBeNull();
    expect(sys.getLinkJoints()).toBeNull();
    expect(sys.getPointMasses()).toBeNull();
    expect(sys.getAlpha()).toBe(0);
    expect(sys.getBetas()).toEqual([]);
  });
});

describe('cradle system correctness gates', () => {
  it('matches the Euler-Lagrange residual from T and V by finite differences', () => {
    const sys = createCradleSystem(baseParams);
    const n = sys.getCoordinateCount();
    const q = [0.31, -0.22, 0.4, -0.5, 0.15];
    const v = [0.7, -0.3, 0.5, 0.2, -0.6];
    const a = sys.accelerationsAt(q, v);
    const eps = 1e-4;
    const lag = (qq: number[], vv: number[]) =>
      sys.kineticEnergyAt(qq, vv) - sys.potentialEnergyAt(qq);
    // dL/dv_i evaluated at (q, v)
    const dLdv = (qq: number[], vv: number[], i: number) => {
      const vp = [...vv];
      const vm = [...vv];
      vp[i] += eps;
      vm[i] -= eps;
      return (lag(qq, vp) - lag(qq, vm)) / (2 * eps);
    };
    for (let i = 0; i < n; i++) {
      // d/dt (dL/dv_i) along the motion q' = v, v' = a
      const qp = q.map((x, j) => x + eps * v[j]);
      const qm = q.map((x, j) => x - eps * v[j]);
      const vp = v.map((x, j) => x + eps * a[j]);
      const vm = v.map((x, j) => x - eps * a[j]);
      const ddt = (dLdv(qp, vp, i) - dLdv(qm, vm, i)) / (2 * eps);
      const qpi = [...q];
      const qmi = [...q];
      qpi[i] += eps;
      qmi[i] -= eps;
      const dLdq = (lag(qpi, v) - lag(qmi, v)) / (2 * eps);
      expect(ddt - dLdq).toBeCloseTo(0, 4);
    }
  });

  /** Largest absolute energy deviation over a run, plus the excitation energy above rest. */
  function energyDrift(dt: number, seconds: number) {
    const sys = createCradleSystem(baseParams, excited);
    const e0 = sys.getTotalEnergy();
    const eRest = createCradleSystem(baseParams).getTotalEnergy();
    let worst = 0;
    let thetaMax = 0;
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i++) {
      sys.step(dt);
      worst = Math.max(worst, Math.abs(sys.getTotalEnergy() - e0));
      thetaMax = Math.max(thetaMax, Math.abs(sys.getTheta()));
    }
    return { worst, e0, excitation: e0 - eRest, thetaMax, steps };
  }

  it('conserves total energy without damping over 40000 RK4 steps', () => {
    const r = energyDrift(0.0005, 20);
    expect(r.steps).toBe(40000);
    expect(r.excitation).toBeGreaterThan(0.5);
    expect(r.worst / Math.abs(r.e0)).toBeLessThan(1e-6);
    expect(r.worst / r.excitation).toBeLessThan(1e-5);
    // Motion must be real, not a frozen state.
    expect(r.thetaMax).toBeGreaterThan(0.1);
  });

  it('energy drift shrinks with the step size, so it is integrator error and not a model error', () => {
    const coarse = energyDrift(0.001, 10);
    const fine = energyDrift(0.0005, 10);
    expect(coarse.worst / fine.worst).toBeGreaterThan(8);
  });

  it('loses energy when damping is on', () => {
    const sys = createCradleSystem({ ...baseParams, damping: 0.5 }, excited);
    const e0 = sys.getTotalEnergy();
    for (let i = 0; i < 3000; i++) sys.step(0.001);
    expect(sys.getTotalEnergy()).toBeLessThan(e0 - 0.1);
  });

  it('stays at the static equilibrium when started there at rest', () => {
    const sys = createCradleSystem(baseParams);
    const forces = sys.generalizedForcesAt(new Array(5).fill(0));
    for (const f of forces) expect(Math.abs(f)).toBeLessThan(1e-12);
    for (let i = 0; i < 5000; i++) sys.step(0.001);
    expect(Math.abs(sys.getTheta())).toBeLessThan(1e-10);
    expect(Math.abs(sys.getAlpha())).toBeLessThan(1e-10);
    for (const b of sys.getBetas()) expect(Math.abs(b)).toBeLessThan(1e-10);
  });

  it('returns to a stable equilibrium after a small kick (no drift away)', () => {
    const sys = createCradleSystem(baseParams, { theta: 0.001 });
    let peak = 0;
    for (let i = 0; i < 5000; i++) {
      sys.step(0.001);
      peak = Math.max(peak, Math.abs(sys.getTheta()), Math.abs(sys.getAlpha()));
    }
    expect(peak).toBeLessThan(0.01);
  });

  it('reduces to a spring and gravity oscillator when disk and pendulum are removed', () => {
    const p: CradleParams = { ...baseParams, disk: null, pendulum: null };
    const { innerRadius: ri, outerRadius: ro, halfOpening: b, cradleMass: m } = p;
    const d = p.springAnchorOffset;
    const h = p.groundDrop;
    const s0 = Math.hypot(ro * Math.sin(b) - d, h - ro * Math.cos(b));
    // Torsional stiffness of the two springs at theta = 0 (rest length equals s0).
    const kSpring =
      (2 * p.springStiffness * ro * ro * (d * Math.cos(b) - h * Math.sin(b)) ** 2) / (s0 * s0);
    // Centroid distance of the annular sector and its moment about the pivot.
    const rho = (2 * Math.sin(b) * (ro ** 3 - ri ** 3)) / (3 * b * (ro ** 2 - ri ** 2));
    const inertia = (m * (ro * ro + ri * ri)) / 2;
    const kEff = kSpring + m * p.gravity * rho;
    const expected = (2 * Math.PI) / Math.sqrt(kEff / inertia);

    const sys = createCradleSystem(p, { theta: 0.01 });
    const dt = 0.0005;
    const measured = measurePeriod(
      () => sys.getTheta(),
      () => sys.step(dt),
      dt,
      40000,
    );
    const relErr = Math.abs(measured - expected) / expected;
    expect(relErr).toBeLessThan(1e-3);
  });

  it('reduces to a disk rolling in a fixed bowl when the springs are very stiff', () => {
    const p: CradleParams = {
      ...baseParams,
      pendulum: null,
      springStiffness: 1e5,
      cradleMass: 2,
    };
    const rBig = p.innerRadius;
    const r = p.disk!.radius;
    // Small oscillation of a solid disk rolling without slipping in a fixed bowl.
    const expected = 2 * Math.PI * Math.sqrt((1.5 * (rBig - r)) / p.gravity);
    const sys = createCradleSystem(p, { alpha: 0.02 });
    const dt = 0.0001;
    const measured = measurePeriod(
      () => sys.getAlpha(),
      () => sys.step(dt),
      dt,
      70000,
    );
    expect(Math.abs(measured - expected) / expected).toBeLessThan(2e-3);
  });

  it('keeps the no slip constraint at every step', () => {
    const sys = createCradleSystem(baseParams, excited);
    const h = 1e-5;
    let worstSlip = 0;
    for (let i = 0; i < 2000; i++) {
      sys.step(0.002);
      worstSlip = Math.max(worstSlip, sys.getContactSlipSpeed(h));
    }
    expect(worstSlip).toBeLessThan(1e-6);
  });

  it('rolling angle is linked to the contact arc length', () => {
    const sys = createCradleSystem(baseParams, excited);
    for (let i = 0; i < 500; i++) sys.step(0.002);
    // phi = (theta - theta0) - (R_i - r) / r * (alpha - alpha0), so phi(0) = 0
    const r = 0.25;
    const k = (1 - r) / r;
    const expected = sys.getTheta() - 0.3 - k * (sys.getAlpha() - 0.2);
    expect(sys.getDiskPose()!.spin).toBeCloseTo(expected, 9);
  });
});

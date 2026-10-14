/**
 * Exact Lagrangian model of a spring supported rocker (cradle) that carries a
 * rolling disk and a hanging three link pendulum with two point masses.
 *
 * The derivation is in `thoughts/research/2026-10-14-cradle-eom.md`. Short form:
 *
 * - The cradle is a rigid annular sector. It turns about a fixed pivot at the
 *   center of its arc. Its tilt is `theta`, measured counter clockwise from straight down.
 * - The disk rolls without slipping on the inner arc. Its contact angle in the
 *   cradle frame is `alpha`. The no slip constraint is holonomic, so the spin
 *   angle `phi` is a function of `theta` and `alpha`. It adds no coordinate.
 * - Two linear springs run from fixed ground anchors to the two arm tips of the cradle.
 * - The pendulum hangs from the bottom point of the outer arc. Its three rods
 *   have absolute angles `beta1..beta3` from straight down. Two point masses
 *   sit on an axle at the tip of rod 3.
 *
 * Every body is a sum of terms `radius * (sin a, -cos a)`, where `a` is a
 * linear function of the coordinates. That form gives exact Jacobians and exact
 * second derivatives, so the equations of motion carry no numerical differentiation:
 *
 *   M(q) q'' = Q(q) - sum_b m_b J_b^T (Jdot_b q')
 *
 * where `M = sum_b (m_b J_b^T J_b + I_b s_b^T s_b)`. This is the Euler-Lagrange
 * equation of `L = T - V`. RK4 integrates it.
 */

import type { Vec2 } from './vec2';

/** One summand of a body position: `radius * (sin a, -cos a)`, `a = offset + sum coef * q[index]`. */
interface PolarTerm {
  radius: number;
  offset: number;
  coef: Array<[number, number]>;
}

/** A rigid body with a position built from polar terms and a spin rate linear in q'. */
interface Body {
  mass: number;
  /** Moment of inertia about the center of mass. */
  inertia: number;
  terms: PolarTerm[];
  /** Spin rate is `sum coef * v[index]`. */
  spin: Array<[number, number]>;
}

/** Disk parameters. */
export interface CradleDiskParams {
  mass: number;
  radius: number;
}

/** Pendulum parameters. */
export interface CradlePendulumParams {
  /** Rod lengths l1, l2, l3. */
  lengths: [number, number, number];
  /** Mass per length of each uniform rod. Must be above 0 so that M(q) stays invertible. */
  linkDensity: number;
  /** Mass of each of the two point masses. */
  pointMass: number;
  /** Distance w_p between the two point masses. */
  pointSpacing: number;
}

/** All model parameters. Lengths in meters, masses in kg, stiffness in N/m. */
export interface CradleParams {
  /** Inner radius R_i of the arc. */
  innerRadius: number;
  /** Outer radius R_o of the arc. */
  outerRadius: number;
  /** Half opening angle beta_s of the arc, in radians. */
  halfOpening: number;
  /** Cradle mass M. */
  cradleMass: number;
  /** Rolling disk, or null for no disk. */
  disk: CradleDiskParams | null;
  /** Stiffness k of each of the two identical springs. */
  springStiffness: number;
  /** Horizontal distance d_s of each ground anchor from the pivot. */
  springAnchorOffset: number;
  /** Vertical distance of the ground line below the pivot. */
  groundDrop: number;
  /** Rest length of each spring. Default: the length at the upright pose. */
  springRestLength?: number;
  /** Gravity g, pointing down. */
  gravity: number;
  /** Pendulum linkage, or null for no pendulum. */
  pendulum: CradlePendulumParams | null;
  /** Viscous damping on every coordinate. Default: 0, which conserves energy. */
  damping?: number;
}

/** Initial state. Missing values are zero. */
export interface CradleInitial {
  theta?: number;
  alpha?: number;
  beta?: [number, number, number];
  thetaDot?: number;
  alphaDot?: number;
  betaDot?: [number, number, number];
}

/** Pose of the cradle. */
export interface CradlePose {
  pivot: Vec2;
  angle: number;
}

/** Pose of the disk. */
export interface DiskPose {
  center: Vec2;
  /** Spin angle phi, zero at t = 0. */
  spin: number;
  /** Contact point on the inner arc. */
  contact: Vec2;
}

/** The two ends of one spring. */
export interface SpringEnds {
  anchor: Vec2;
  attach: Vec2;
}

const THETA = 0;

/** Solve `A x = b` by Gauss elimination with partial pivoting. `A` is n by n and is not modified. */
function solveLinear(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    if (Math.abs(m[pivot][col]) < 1e-300) {
      throw new Error('CradleSystem: the mass matrix is singular');
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = col + 1; r < n; r++) {
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = m[r][n];
    for (let c = r + 1; c < n; c++) s -= m[r][c] * x[c];
    x[r] = s / m[r][r];
  }
  return x;
}

function termAngle(t: PolarTerm, q: number[]): number {
  let a = t.offset;
  for (const [i, c] of t.coef) a += c * q[i];
  return a;
}

function bodyPosition(body: Body, q: number[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const t of body.terms) {
    const a = termAngle(t, q);
    x += t.radius * Math.sin(a);
    y -= t.radius * Math.cos(a);
  }
  return [x, y];
}

/** Position Jacobian (2 by n) and the acceleration bias `Jdot q'` of a body. */
function bodyKinematics(body: Body, q: number[], v: number[]) {
  const n = q.length;
  const jx = new Array<number>(n).fill(0);
  const jy = new Array<number>(n).fill(0);
  let bx = 0;
  let by = 0;
  for (const t of body.terms) {
    const a = termAngle(t, q);
    const s = Math.sin(a);
    const c = Math.cos(a);
    let rate = 0;
    for (const [i, k] of t.coef) {
      jx[i] += t.radius * k * c;
      jy[i] += t.radius * k * s;
      rate += k * v[i];
    }
    // Second derivative of (sin a, -cos a) with respect to a is (-sin a, cos a).
    bx -= t.radius * rate * rate * s;
    by += t.radius * rate * rate * c;
  }
  return { jx, jy, bx, by };
}

function spinRate(body: Body, v: number[]): number {
  let w = 0;
  for (const [i, k] of body.spin) w += k * v[i];
  return w;
}

/** Cradle body: annular sector turning about the arc center. */
function cradleBody(p: CradleParams): Body {
  const { innerRadius: ri, outerRadius: ro, halfOpening: bs, cradleMass: m } = p;
  const rho = (2 * Math.sin(bs) * (ro ** 3 - ri ** 3)) / (3 * bs * (ro ** 2 - ri ** 2));
  const inertiaPivot = (m * (ro * ro + ri * ri)) / 2;
  return {
    mass: m,
    inertia: inertiaPivot - m * rho * rho,
    terms: [{ radius: rho, offset: 0, coef: [[THETA, 1]] }],
    spin: [[THETA, 1]],
  };
}

/** Disk body: rolls without slipping inside the arc. */
function diskBody(p: CradleParams, disk: CradleDiskParams, alphaIndex: number): Body {
  const r = disk.radius;
  const k = (p.innerRadius - r) / r;
  return {
    mass: disk.mass,
    inertia: 0.5 * disk.mass * r * r,
    terms: [
      {
        radius: p.innerRadius - r,
        offset: 0,
        coef: [
          [THETA, 1],
          [alphaIndex, 1],
        ],
      },
    ],
    spin: [
      [THETA, 1],
      [alphaIndex, -k],
    ],
  };
}

/** Three uniform rods and two point masses on an axle at the tip of rod 3. */
function pendulumBodies(p: CradleParams, pend: CradlePendulumParams, betaIndex: number) {
  const { lengths, linkDensity, pointMass, pointSpacing } = pend;
  const base: PolarTerm[] = [{ radius: p.outerRadius, offset: 0, coef: [[THETA, 1]] }];
  const rods: Body[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = betaIndex + i;
    const l = lengths[i];
    rods.push({
      mass: linkDensity * l,
      inertia: (linkDensity * l * l * l) / 12,
      terms: [...base, { radius: l / 2, offset: 0, coef: [[idx, 1]] }],
      spin: [[idx, 1]],
    });
    base.push({ radius: l, offset: 0, coef: [[idx, 1]] });
  }
  const last = betaIndex + 2;
  const points: Body[] = [1, -1].map((sign) => ({
    mass: pointMass,
    inertia: 0,
    terms: [
      ...base,
      {
        radius: (sign * pointSpacing) / 2,
        offset: Math.PI / 2,
        coef: [[last, 1]] as Array<[number, number]>,
      },
    ],
    spin: [],
  }));
  return { rods, points };
}

/** Initial coordinates and speeds. Missing values are zero. */
function initialState(n: number, alphaIndex: number, betaIndex: number, init: CradleInitial) {
  const q = new Array<number>(n).fill(0);
  const v = new Array<number>(n).fill(0);
  q[THETA] = init.theta ?? 0;
  v[THETA] = init.thetaDot ?? 0;
  if (alphaIndex >= 0) {
    q[alphaIndex] = init.alpha ?? 0;
    v[alphaIndex] = init.alphaDot ?? 0;
  }
  if (betaIndex >= 0) {
    for (let i = 0; i < 3; i++) {
      q[betaIndex + i] = init.beta?.[i] ?? 0;
      v[betaIndex + i] = init.betaDot?.[i] ?? 0;
    }
  }
  return { q, v };
}

function positive(x: number, name: string): void {
  if (!(x > 0) || !Number.isFinite(x)) throw new Error(`CradleSystem: ${name} must be above 0`);
}

function validateGeometry(p: CradleParams): void {
  positive(p.innerRadius, 'innerRadius');
  positive(p.outerRadius, 'outerRadius');
  if (!(p.innerRadius < p.outerRadius)) {
    throw new Error('CradleSystem: innerRadius must be below outerRadius');
  }
  if (!(p.halfOpening > 0 && p.halfOpening < Math.PI)) {
    throw new Error('CradleSystem: halfOpening must be between 0 and pi');
  }
  positive(p.cradleMass, 'cradleMass');
  if (!(p.springStiffness >= 0)) {
    throw new Error('CradleSystem: springStiffness must not be negative');
  }
  positive(p.springAnchorOffset, 'springAnchorOffset');
  positive(p.groundDrop, 'groundDrop');
  if (!Number.isFinite(p.gravity)) throw new Error('CradleSystem: gravity must be finite');
  if (p.springRestLength !== undefined && !(p.springRestLength >= 0)) {
    throw new Error('CradleSystem: springRestLength must not be negative');
  }
  if (!((p.damping ?? 0) >= 0)) throw new Error('CradleSystem: damping must not be negative');
}

function validateParams(p: CradleParams, init: CradleInitial): void {
  validateGeometry(p);
  if (p.disk) {
    positive(p.disk.mass, 'disk.mass');
    positive(p.disk.radius, 'disk.radius');
    if (!(p.disk.radius < p.innerRadius)) {
      throw new Error('CradleSystem: disk.radius must be below innerRadius');
    }
  }
  if (p.pendulum) {
    for (const l of p.pendulum.lengths) positive(l, 'pendulum.lengths');
    positive(p.pendulum.linkDensity, 'pendulum.linkDensity');
    positive(p.pendulum.pointMass, 'pendulum.pointMass');
    positive(p.pendulum.pointSpacing, 'pendulum.pointSpacing');
  }
  if (init.beta && init.beta.length !== 3) {
    throw new Error('CradleSystem: initial beta needs 3 values');
  }
}

export class CradleSystem {
  readonly params: CradleParams;
  private readonly _n: number;
  private readonly _alphaIndex: number;
  private readonly _betaIndex: number;
  private readonly _bodies: Body[] = [];
  /** Bodies that carry the pendulum point masses (subset of `_bodies`, in order +w/2, -w/2). */
  private readonly _pointBodies: Body[] = [];
  private readonly _restLength: number;
  private readonly _damping: number;
  private readonly _diskK: number;
  private _q: number[];
  private _v: number[];
  private _time = 0;
  private _theta0: number;
  private _alpha0: number;

  constructor(params: CradleParams, initial: CradleInitial = {}) {
    validateParams(params, initial);
    this.params = params;
    this._damping = params.damping ?? 0;
    const { innerRadius: ri, outerRadius: ro, halfOpening: bs } = params;

    let n = 1;
    this._alphaIndex = params.disk ? n++ : -1;
    this._betaIndex = params.pendulum ? n : -1;
    if (params.pendulum) n += 3;
    this._n = n;

    this._bodies.push(cradleBody(params));
    if (params.disk) this._bodies.push(diskBody(params, params.disk, this._alphaIndex));
    this._diskK = params.disk ? (ri - params.disk.radius) / params.disk.radius : 0;
    if (params.pendulum) {
      const pend = pendulumBodies(params, params.pendulum, this._betaIndex);
      this._bodies.push(...pend.rods, ...pend.points);
      this._pointBodies.push(...pend.points);
    }

    this._restLength =
      params.springRestLength ??
      Math.hypot(
        ro * Math.sin(bs) - params.springAnchorOffset,
        params.groundDrop - ro * Math.cos(bs),
      );

    const state = initialState(n, this._alphaIndex, this._betaIndex, initial);
    this._q = state.q;
    this._v = state.v;
    this._theta0 = this._q[THETA];
    this._alpha0 = this._alphaIndex >= 0 ? this._q[this._alphaIndex] : 0;
  }

  // ---------------------------------------------------------------- dynamics

  /** Number of generalized coordinates. */
  getCoordinateCount(): number {
    return this._n;
  }

  /** `-dV/dq` for gravity and the two springs. `q` has `getCoordinateCount()` entries. */
  generalizedForcesAt(q: number[]): number[] {
    const { gravity: g, springStiffness: k, outerRadius: ro, halfOpening: bs } = this.params;
    const force = new Array<number>(this._n).fill(0);
    const zero = new Array<number>(this._n).fill(0);
    for (const body of this._bodies) {
      const { jy } = bodyKinematics(body, q, zero);
      for (let i = 0; i < this._n; i++) force[i] -= body.mass * g * jy[i];
    }
    for (const side of [1, -1]) {
      const a = q[THETA] + side * bs;
      const px = ro * Math.sin(a);
      const py = -ro * Math.cos(a);
      const dx = px - side * this.params.springAnchorOffset;
      const dy = py + this.params.groundDrop;
      const s = Math.hypot(dx, dy);
      // ds/dtheta = (P - Q) . dP/dtheta / s, with dP/dtheta = R_o (cos a, sin a)
      const dsdTheta = (dx * ro * Math.cos(a) + dy * ro * Math.sin(a)) / s;
      force[THETA] -= k * (s - this._restLength) * dsdTheta;
    }
    return force;
  }

  /** Total potential energy at `q`: gravity plus both springs. */
  potentialEnergyAt(q: number[]): number {
    let v = 0;
    for (const body of this._bodies)
      v += body.mass * this.params.gravity * bodyPosition(body, q)[1];
    for (const end of this._springEndsAt(q)) {
      const s = Math.hypot(end.attach[0] - end.anchor[0], end.attach[1] - end.anchor[1]);
      v += 0.5 * this.params.springStiffness * (s - this._restLength) ** 2;
    }
    return v;
  }

  /** Total kinetic energy at `(q, v)`. */
  kineticEnergyAt(q: number[], v: number[]): number {
    let t = 0;
    for (const body of this._bodies) {
      const { jx, jy } = bodyKinematics(body, q, v);
      let vx = 0;
      let vy = 0;
      for (let i = 0; i < this._n; i++) {
        vx += jx[i] * v[i];
        vy += jy[i] * v[i];
      }
      const w = spinRate(body, v);
      t += 0.5 * body.mass * (vx * vx + vy * vy) + 0.5 * body.inertia * w * w;
    }
    return t;
  }

  /** Solve `M(q) q'' = f(q, q')` for the generalized accelerations. */
  accelerationsAt(q: number[], v: number[]): number[] {
    const n = this._n;
    const mass: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    const rhs = this.generalizedForcesAt(q);
    for (let i = 0; i < n; i++) rhs[i] -= this._damping * v[i];
    for (const body of this._bodies) {
      const { jx, jy, bx, by } = bodyKinematics(body, q, v);
      const spin = new Array<number>(n).fill(0);
      for (const [i, k] of body.spin) spin[i] += k;
      for (let i = 0; i < n; i++) {
        rhs[i] -= body.mass * (jx[i] * bx + jy[i] * by);
        for (let j = 0; j < n; j++) {
          mass[i][j] +=
            body.mass * (jx[i] * jx[j] + jy[i] * jy[j]) + body.inertia * spin[i] * spin[j];
        }
      }
    }
    return solveLinear(mass, rhs);
  }

  /** Advance the state by `dt` seconds with one RK4 step. A negative `dt` runs backward. */
  step(dt: number): void {
    const n = this._n;
    const q = this._q;
    const v = this._v;
    const k1q = v;
    const k1v = this.accelerationsAt(q, v);
    const q2 = q.map((x, i) => x + 0.5 * dt * k1q[i]);
    const v2 = v.map((x, i) => x + 0.5 * dt * k1v[i]);
    const k2q = v2;
    const k2v = this.accelerationsAt(q2, v2);
    const q3 = q.map((x, i) => x + 0.5 * dt * k2q[i]);
    const v3 = v.map((x, i) => x + 0.5 * dt * k2v[i]);
    const k3q = v3;
    const k3v = this.accelerationsAt(q3, v3);
    const q4 = q.map((x, i) => x + dt * k3q[i]);
    const v4 = v.map((x, i) => x + dt * k3v[i]);
    const k4q = v4;
    const k4v = this.accelerationsAt(q4, v4);
    for (let i = 0; i < n; i++) {
      this._q[i] = q[i] + (dt / 6) * (k1q[i] + 2 * k2q[i] + 2 * k3q[i] + k4q[i]);
      this._v[i] = v[i] + (dt / 6) * (k1v[i] + 2 * k2v[i] + 2 * k3v[i] + k4v[i]);
    }
    this._time += dt;
  }

  // ----------------------------------------------------------------- readout

  getTime(): number {
    return this._time;
  }

  getTheta(): number {
    return this._q[THETA];
  }

  getAlpha(): number {
    return this._alphaIndex >= 0 ? this._q[this._alphaIndex] : 0;
  }

  /** Pendulum rod angles beta1..beta3, or an empty array without a pendulum. */
  getBetas(): number[] {
    return this._betaIndex >= 0 ? this._q.slice(this._betaIndex, this._betaIndex + 3) : [];
  }

  getKineticEnergy(): number {
    return this.kineticEnergyAt(this._q, this._v);
  }

  getPotentialEnergy(): number {
    return this.potentialEnergyAt(this._q);
  }

  /** Kinetic plus potential energy. It stays constant when damping is 0. */
  getTotalEnergy(): number {
    return this.getKineticEnergy() + this.getPotentialEnergy();
  }

  getCradlePose(): CradlePose {
    return { pivot: [0, 0], angle: this._q[THETA] };
  }

  getDiskPose(): DiskPose | null {
    if (!this.params.disk) return null;
    const { innerRadius: ri } = this.params;
    const psi = this._q[THETA] + this._q[this._alphaIndex];
    const spin =
      this._q[THETA] - this._theta0 - this._diskK * (this._q[this._alphaIndex] - this._alpha0);
    const n: Vec2 = [Math.sin(psi), -Math.cos(psi)];
    const rd = ri - this.params.disk.radius;
    return { center: [rd * n[0], rd * n[1]], spin, contact: [ri * n[0], ri * n[1]] };
  }

  private _springEndsAt(q: number[]): SpringEnds[] {
    const { outerRadius: ro, halfOpening: bs, springAnchorOffset: d, groundDrop: h } = this.params;
    return [1, -1].map((side) => {
      const a = q[THETA] + side * bs;
      return {
        anchor: [side * d, -h] as Vec2,
        attach: [ro * Math.sin(a), -ro * Math.cos(a)] as Vec2,
      };
    });
  }

  /** Both springs: `[right, left]`. The right spring has its anchor at positive x. */
  getSpringEndpoints(): [SpringEnds, SpringEnds] {
    const ends = this._springEndsAt(this._q);
    return [ends[0], ends[1]];
  }

  /** The four pendulum joints, from the cradle attachment to the tip of rod 3. */
  getLinkJoints(): Vec2[] | null {
    if (!this.params.pendulum) return null;
    const { lengths } = this.params.pendulum;
    const ro = this.params.outerRadius;
    const th = this._q[THETA];
    const joints: Vec2[] = [[ro * Math.sin(th), -ro * Math.cos(th)]];
    for (let i = 0; i < 3; i++) {
      const b = this._q[this._betaIndex + i];
      const p = joints[i];
      joints.push([p[0] + lengths[i] * Math.sin(b), p[1] - lengths[i] * Math.cos(b)]);
    }
    return joints;
  }

  /** The two pendulum point masses, `+w_p/2` first. */
  getPointMasses(): [Vec2, Vec2] | null {
    if (this._pointBodies.length !== 2) return null;
    return [
      bodyPosition(this._pointBodies[0], this._q),
      bodyPosition(this._pointBodies[1], this._q),
    ];
  }

  /**
   * Relative speed between the disk contact point and the cradle contact point.
   * It uses central differences of the poses over `h` seconds. It is 0 when the disk rolls
   * without slipping.
   */
  getContactSlipSpeed(h = 1e-5): number {
    if (!this.params.disk) return 0;
    const fwd = this._fork();
    const bwd = this._fork();
    fwd.step(h);
    bwd.step(-h);
    const df = fwd.getDiskPose()!;
    const db = bwd.getDiskPose()!;
    const now = this.getDiskPose()!;
    const r = this.params.disk.radius;
    const nx = (now.contact[0] - now.center[0]) / r;
    const ny = (now.contact[1] - now.center[1]) / r;
    const cx = (df.center[0] - db.center[0]) / (2 * h);
    const cy = (df.center[1] - db.center[1]) / (2 * h);
    const wDisk = (df.spin - db.spin) / (2 * h);
    const wCradle = (fwd.getTheta() - bwd.getTheta()) / (2 * h);
    // Velocity of the disk material point at the contact: v_center + w x (r n), with w x n = (-ny, nx).
    const dvx = cx + wDisk * r * -ny;
    const dvy = cy + wDisk * r * nx;
    // Velocity of the cradle material point at the contact: theta' x (R_i n).
    const ri = this.params.innerRadius;
    const cvx = wCradle * ri * -ny;
    const cvy = wCradle * ri * nx;
    return Math.hypot(dvx - cvx, dvy - cvy);
  }

  private _fork(): CradleSystem {
    const copy = new CradleSystem(this.params);
    copy._q = [...this._q];
    copy._v = [...this._v];
    copy._time = this._time;
    copy._theta0 = this._theta0;
    copy._alpha0 = this._alpha0;
    return copy;
  }
}

/** Create a cradle system. See {@link CradleParams} for the parameters. */
export function createCradleSystem(
  params: CradleParams,
  initial: CradleInitial = {},
): CradleSystem {
  return new CradleSystem(params, initial);
}

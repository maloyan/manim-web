/**
 * Constraints that link bodies together or pin them to a point.
 *
 * Two kinds exist:
 *
 * - A {@link DistanceConstraint} holds two endpoints a fixed distance apart.
 *   A pendulum is one dynamic body plus a distance constraint to a fixed
 *   pivot. The constraint corrects positions after integration, so the bob
 *   keeps a near-constant distance from the pivot while it swings.
 * - A {@link SpringConstraint} pulls two endpoints toward a rest length with
 *   a Hooke's-law force and optional damping. It adds a force during the
 *   force phase, so the endpoints oscillate.
 *
 * An endpoint is either a {@link Body} or a fixed point (a {@link Vec2}). A
 * fixed point has infinite mass, so only the body moves.
 */

import { Body } from './bodies';
import { Vec2, distanceVec2, dotVec2 } from './vec2';

/** A constraint endpoint: a dynamic body or a fixed world point. */
export type Anchor = Body | Vec2;

/**
 * A constraint on the physics world.
 *
 * The world runs two phases each step. It calls {@link accumulateForces} in
 * the force phase (before integration) and {@link solvePositions} in the
 * position phase (after integration). A constraint implements only the phase
 * it needs.
 */
export interface Constraint {
  /** Add forces to the linked bodies before integration. Optional. */
  accumulateForces?(): void;
  /** Correct the linked body positions after integration. Optional. */
  solvePositions?(): void;
  /** Return a copy of this constraint with bodies remapped through `map`. */
  clone(map: Map<Body, Body>): Constraint;
}

/** Read the position of an endpoint. */
function anchorPosition(anchor: Anchor): Vec2 {
  return anchor instanceof Body ? anchor.position : anchor;
}

/** Read the inverse mass of an endpoint. A fixed point is immovable. */
function anchorInvMass(anchor: Anchor): number {
  return anchor instanceof Body ? anchor.invMass : 0;
}

/** Read the velocity of an endpoint. A fixed point does not move. */
function anchorVelocity(anchor: Anchor): Vec2 {
  return anchor instanceof Body ? anchor.velocity : [0, 0];
}

/** Remap an endpoint through a body map, keeping fixed points unchanged. */
function remapAnchor(anchor: Anchor, map: Map<Body, Body>): Anchor {
  if (anchor instanceof Body) {
    return map.get(anchor) ?? anchor;
  }
  return [anchor[0], anchor[1]];
}

/** Options for a {@link DistanceConstraint}. */
export interface DistanceConstraintOptions {
  /** How strongly the constraint corrects, from 0 to 1. Default: 1. */
  stiffness?: number;
}

/**
 * A rigid distance constraint. It keeps endpoint `a` and endpoint `b` a fixed
 * `length` apart by correcting positions after integration. The correction
 * splits between the endpoints by inverse mass, so a body pinned to a fixed
 * point moves alone.
 */
export class DistanceConstraint implements Constraint {
  private readonly _a: Anchor;
  private readonly _b: Anchor;
  private readonly _length: number;
  private readonly _stiffness: number;

  constructor(a: Anchor, b: Anchor, length: number, options: DistanceConstraintOptions = {}) {
    this._a = a;
    this._b = b;
    this._length = length;
    this._stiffness = options.stiffness ?? 1;
  }

  /** The target distance between the endpoints. */
  get length(): number {
    return this._length;
  }

  solvePositions(): void {
    const pa = anchorPosition(this._a);
    const pb = anchorPosition(this._b);
    const dist = distanceVec2(pa, pb);
    if (dist === 0) return;

    const invA = anchorInvMass(this._a);
    const invB = anchorInvMass(this._b);
    const totalInv = invA + invB;
    if (totalInv === 0) return;

    // Unit vector from a to b, and the signed length error C.
    const nx = (pb[0] - pa[0]) / dist;
    const ny = (pb[1] - pa[1]) / dist;
    const c = (dist - this._length) * this._stiffness;

    // Move a toward b and b toward a, split by inverse mass.
    const ka = (invA / totalInv) * c;
    const kb = (invB / totalInv) * c;
    if (this._a instanceof Body) {
      this._a.position[0] += nx * ka;
      this._a.position[1] += ny * ka;
    }
    if (this._b instanceof Body) {
      this._b.position[0] -= nx * kb;
      this._b.position[1] -= ny * kb;
    }
  }

  clone(map: Map<Body, Body>): DistanceConstraint {
    return new DistanceConstraint(
      remapAnchor(this._a, map),
      remapAnchor(this._b, map),
      this._length,
      {
        stiffness: this._stiffness,
      },
    );
  }
}

/** Options for a {@link SpringConstraint}. */
export interface SpringConstraintOptions {
  /** Spring stiffness (Hooke's constant). Default: 10. */
  stiffness?: number;
  /** Damping on the relative velocity along the spring. Default: 0. */
  damping?: number;
}

/**
 * A spring between two endpoints. It applies a Hooke's-law force toward the
 * rest length, plus optional damping on the closing speed, during the force
 * phase. The endpoints oscillate around the rest length.
 */
export class SpringConstraint implements Constraint {
  private readonly _a: Anchor;
  private readonly _b: Anchor;
  private readonly _restLength: number;
  private readonly _stiffness: number;
  private readonly _damping: number;

  constructor(a: Anchor, b: Anchor, restLength: number, options: SpringConstraintOptions = {}) {
    this._a = a;
    this._b = b;
    this._restLength = restLength;
    this._stiffness = options.stiffness ?? 10;
    this._damping = options.damping ?? 0;
  }

  /** The rest length the spring pulls toward. */
  get restLength(): number {
    return this._restLength;
  }

  accumulateForces(): void {
    const pa = anchorPosition(this._a);
    const pb = anchorPosition(this._b);
    const dist = distanceVec2(pa, pb);
    if (dist === 0) return;

    const nx = (pb[0] - pa[0]) / dist;
    const ny = (pb[1] - pa[1]) / dist;
    const stretch = dist - this._restLength;

    // Closing/opening speed along the spring axis for damping.
    const va = anchorVelocity(this._a);
    const vb = anchorVelocity(this._b);
    const relAlong = dotVec2([vb[0] - va[0], vb[1] - va[1]], [nx, ny]);

    // Force on a points toward b when stretched; b gets the opposite.
    const magnitude = this._stiffness * stretch + this._damping * relAlong;
    if (this._a instanceof Body) {
      this._a.applyForce([nx * magnitude, ny * magnitude]);
    }
    if (this._b instanceof Body) {
      this._b.applyForce([-nx * magnitude, -ny * magnitude]);
    }
  }

  clone(map: Map<Body, Body>): SpringConstraint {
    return new SpringConstraint(
      remapAnchor(this._a, map),
      remapAnchor(this._b, map),
      this._restLength,
      {
        stiffness: this._stiffness,
        damping: this._damping,
      },
    );
  }
}

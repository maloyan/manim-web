import { Dot } from '../mobjects/geometry/Dot';
import { Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import { YELLOW } from '../constants';
import { Draggable } from './Draggable';

/**
 * A function that re-projects a dragged position onto a constraint
 * (a graph, a parametric curve, a line or a segment).
 */
type PointConstraint = (position: Vector3Tuple) => Vector3Tuple;

/**
 * Options for creating a {@link MovablePoint}.
 */
export interface MovablePointOptions {
  /** Initial position. Default: [0, 0, 0]. */
  point?: Vector3Tuple;
  /** Fill color as a CSS color string. Default: YELLOW. */
  color?: string;
  /** Radius of the dot. Default: 0.1. */
  radius?: number;
  /** Called with the new position whenever the point moves. */
  onChange?: (position: Vector3Tuple) => void;
  /** ValueTracker that receives the point's x coordinate. */
  xTracker?: ValueTracker;
  /** ValueTracker that receives the point's y coordinate. */
  yTracker?: ValueTracker;
  /**
   * Re-render the scene after each drag update. Default: true. Set false when
   * a render loop (play(), wait() with updaters) is already running.
   */
  autoRender?: boolean;
}

/**
 * MovablePoint — a draggable in-scene point whose position drives bound values.
 *
 * It is a {@link Dot} the reader can drag with the mouse or a finger. Each move
 * writes the new x and y into the bound {@link ValueTracker}s and calls
 * `onChange`, so dependent mobjects update live through the normal updater or
 * `alwaysRedraw` path. This is the Desmos-style interactivity that drives an
 * explorable explanation.
 *
 * The point can be constrained to stay on a graph (`constrainToFunction`), a
 * parametric curve (`constrainToParametric`), an infinite line
 * (`constrainToLine`) or a finite segment (`constrainToSegment`).
 *
 * @example
 * ```typescript
 * const xT = new ValueTracker(1);
 * const p = new MovablePoint(scene, { point: [1, 1, 0], xTracker: xT });
 * p.constrainToFunction((x) => Math.sin(x));
 * scene.add(p);
 *
 * // A label that always reads the live x value.
 * const label = alwaysRedraw(() => new DecimalNumber({ value: xT.getValue() }));
 * scene.add(label);
 * ```
 */
export class MovablePoint extends Dot {
  private _draggable: Draggable;
  private _onChange?: (position: Vector3Tuple) => void;
  private _xTracker?: ValueTracker;
  private _yTracker?: ValueTracker;
  private _constraint: PointConstraint | null = null;
  private _parameter: number | null = null;

  /**
   * Create a MovablePoint.
   * @param scene - The scene the point lives in (needed for pointer events).
   * @param options - Appearance, bound trackers and the change callback.
   */
  constructor(scene: Scene, options: MovablePointOptions = {}) {
    const {
      point = [0, 0, 0],
      color = YELLOW,
      radius = 0.1,
      onChange,
      xTracker,
      yTracker,
      autoRender,
    } = options;

    super({ point, color, radius });

    this._onChange = onChange;
    this._xTracker = xTracker;
    this._yTracker = yTracker;

    this._draggable = new Draggable(this, scene, {
      autoRender,
      onDrag: (_mobject, position) => this._commit(position, true),
    });

    // Seed the trackers from the initial position without firing onChange.
    this._syncTrackers(this.getPoint());
  }

  /**
   * Move the point to a position, applying any active constraint, syncing the
   * bound trackers and firing `onChange`.
   * @param point - The requested position (before constraint projection).
   * @returns this for chaining.
   */
  override setPoint(point: Vector3Tuple): this {
    this._commit(point, true);
    return this;
  }

  /**
   * Keep the point on the graph y = f(x) while dragging.
   * @param fn - The graph function.
   * @returns this for chaining.
   */
  constrainToFunction(fn: (x: number) => number): this {
    this._constraint = ([x, , z]) => [x, fn(x), z];
    this._reproject();
    return this;
  }

  /**
   * Keep the point on a parametric curve, projecting the drag to the nearest
   * point on the curve.
   * @param fn - Maps a parameter t to a point [x, y].
   * @param tRange - [tMin, tMax] and an optional sample count (default 256).
   * @returns this for chaining.
   */
  constrainToParametric(
    fn: (t: number) => [number, number],
    tRange: [number, number] | [number, number, number],
  ): this {
    const tMin = tRange[0];
    const tMax = tRange[1];
    const samples = tRange.length > 2 ? Math.max(2, Math.floor(tRange[2] as number)) : 256;
    this._constraint = ([x, y, z]) => {
      const t = nearestParameter(fn, tMin, tMax, samples, x, y);
      this._parameter = t;
      const [px, py] = fn(t);
      return [px, py, z];
    };
    this._reproject();
    return this;
  }

  /**
   * Keep the point on the infinite line through p1 and p2.
   * @param p1 - A point on the line.
   * @param p2 - A second point on the line.
   * @returns this for chaining.
   */
  constrainToLine(p1: Vector3Tuple, p2: Vector3Tuple): this {
    this._constraint = (pos) => projectToSegment(p1, p2, pos, false);
    this._reproject();
    return this;
  }

  /**
   * Keep the point on the finite segment from p1 to p2 (clamped to the ends).
   * @param p1 - The start of the segment.
   * @param p2 - The end of the segment.
   * @returns this for chaining.
   */
  constrainToSegment(p1: Vector3Tuple, p2: Vector3Tuple): this {
    this._constraint = (pos) => projectToSegment(p1, p2, pos, true);
    this._reproject();
    return this;
  }

  /**
   * Remove any active constraint so the point drags freely again.
   * @returns this for chaining.
   */
  clearConstraint(): this {
    this._constraint = null;
    this._parameter = null;
    return this;
  }

  /**
   * Get the current parameter t from the last parametric projection, or null
   * when no parametric constraint is active.
   */
  getParameter(): number | null {
    return this._parameter;
  }

  /** Get the underlying {@link Draggable} behavior. */
  getDraggable(): Draggable {
    return this._draggable;
  }

  /** Remove pointer-event listeners. Call when the point is no longer used. */
  dispose(): void {
    this._draggable.dispose();
  }

  /** Apply the current constraint to the current position without firing onChange. */
  private _reproject(): void {
    this._commit(this.getPoint(), false);
  }

  private _commit(position: Vector3Tuple, fireChange: boolean): void {
    const projected = this._constraint ? this._constraint(position) : position;
    this.moveTo(projected);
    this._syncTrackers(projected);
    if (fireChange) this._onChange?.(projected);
  }

  private _syncTrackers(position: Vector3Tuple): void {
    this._xTracker?.setValue(position[0]);
    this._yTracker?.setValue(position[1]);
  }
}

/**
 * Project a point onto the line through p1 and p2.
 * @param clamp - When true, clamp the projection to the segment [p1, p2].
 */
function projectToSegment(
  p1: Vector3Tuple,
  p2: Vector3Tuple,
  pos: Vector3Tuple,
  clamp: boolean,
): Vector3Tuple {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const lengthSq = dx * dx + dy * dy;
  let s = lengthSq === 0 ? 0 : ((pos[0] - p1[0]) * dx + (pos[1] - p1[1]) * dy) / lengthSq;
  if (clamp) s = Math.max(0, Math.min(1, s));
  return [p1[0] + s * dx, p1[1] + s * dy, pos[2]];
}

/**
 * Find the parameter t in [tMin, tMax] whose curve point is nearest to (x, y).
 * Samples the range, then refines around the best sample with a short bisection.
 */
function nearestParameter(
  fn: (t: number) => [number, number],
  tMin: number,
  tMax: number,
  samples: number,
  x: number,
  y: number,
): number {
  const distanceSq = (t: number): number => {
    const [px, py] = fn(t);
    const dx = px - x;
    const dy = py - y;
    return dx * dx + dy * dy;
  };

  let bestT = tMin;
  let bestD = distanceSq(tMin);
  for (let i = 1; i <= samples; i++) {
    const t = tMin + ((tMax - tMin) * i) / samples;
    const d = distanceSq(t);
    if (d < bestD) {
      bestD = d;
      bestT = t;
    }
  }

  // Refine within one sample step on each side of the best sample.
  const stepT = (tMax - tMin) / samples;
  let lo = Math.max(tMin, bestT - stepT);
  let hi = Math.min(tMax, bestT + stepT);
  for (let i = 0; i < 40; i++) {
    const midLo = lo + (hi - lo) / 3;
    const midHi = hi - (hi - lo) / 3;
    if (distanceSq(midLo) < distanceSq(midHi)) {
      hi = midHi;
    } else {
      lo = midLo;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Factory function to create a {@link MovablePoint}.
 * @param scene - The scene the point lives in.
 * @param options - Appearance, bound trackers and the change callback.
 * @returns A new MovablePoint.
 */
export function makeMovablePoint(scene: Scene, options?: MovablePointOptions): MovablePoint {
  return new MovablePoint(scene, options);
}

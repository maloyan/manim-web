import { Group } from '../../core/Group';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { Arrow, Circle, Dot } from '../geometry';
import { ValueTracker } from '../value-tracker/ValueTracker';
import type { Complex } from './ComplexPlane';
import {
  fourierCoefficients,
  orderCoefficients,
  type FourierCoefficient,
  type FourierOrder,
} from './fourier';

/** A parametric complex path: `func(t)` for `t` over `tRange` (default `[0, 1]`). */
export interface ComplexPathFunction {
  /** Maps a parameter to a complex plane point. */
  func: (t: number) => Complex;
  /** Parameter range as `[min, max]`. Default `[0, 1]`. */
  tRange?: [number, number];
}

/**
 * The path an epicycle chain approximates. One of:
 * - `number[][]`: equally spaced samples, each `[x, y]` read as the complex point `x + i·y`.
 * - {@link VMobject}: sampled along its arc length into complex points.
 * - {@link ComplexPathFunction}: a parametric complex function sampled over its range.
 */
export type FourierPathInput = number[][] | VMobject | ComplexPathFunction;

/**
 * Options for {@link FourierEpicycles}.
 */
export interface FourierEpicyclesOptions {
  /** The path to approximate. */
  path: FourierPathInput;
  /** Number of rotating vectors to show. Default: all coefficients. */
  numTerms?: number;
  /** Samples taken from a {@link VMobject} or {@link ComplexPathFunction}. Default `256`. */
  numSamples?: number;
  /** Origin of the vector chain (the fixed tail of the first vector). Default `[0, 0, 0]`. */
  center?: Vector3Tuple;
  /** Vector chain ordering. Default `'frequency'` (the iconic `0, +1, -1, +2, -2, …`). */
  order?: FourierOrder;
  /** Color of the rotating vectors (arrows). Default `'#58c4dd'`. */
  color?: string;
  /** Whether to draw the circles behind the vectors. Default `true`. */
  showCircles?: boolean;
  /** Color of the circles. Default `'#888888'`. */
  circleColor?: string;
  /** Opacity of the circles' stroke. Default `0.5`. */
  circleOpacity?: number;
  /** Color of the traced output curve. Default `'#ffff00'`. */
  traceColor?: string;
  /** Stroke width of the traced curve. Default `3`. */
  traceWidth?: number;
  /** Stroke width of the vectors. Default `2`. */
  strokeWidth?: number;
  /** Arrow tip length for the vectors. Default `0.15`. */
  tipLength?: number;
  /** Whether to show a pen dot at the chain tip. Default `true`. */
  showPen?: boolean;
  /** Cycles per second advanced by the internal updater. Default `0.2`. */
  speed?: number;
  /** Install an updater that advances time each frame. Default `true`. */
  animate?: boolean;
  /**
   * Optional tracker that drives time instead of the internal clock. When set,
   * `time` is read from the tracker each frame (one period spans value `0 → 1`).
   */
  tracker?: ValueTracker;
  /** Maximum number of accumulated trace points before the oldest are dropped. Default `2000`. */
  maxTracePoints?: number;
}

const DEFAULT_NUM_SAMPLES = 256;
const DEFAULT_MAX_TRACE_POINTS = 2000;

/**
 * FourierEpicycles - the rotating-vector ("epicycle") approximation of a path.
 *
 * Given a path and a number of terms `N`, this builds the chain of `N` rotating
 * vectors (and their circles) whose tip-to-tail sum tracks the path, plus the
 * curve traced by the final tip. An updater rotates each vector at its own
 * frequency and extends the traced curve over time, reproducing the iconic
 * 3Blue1Brown Fourier-series animation.
 *
 * The geometry is deterministic: {@link setTime} fully determines every vector,
 * circle, and the tip for a given normalized time `t`.
 *
 * @example
 * ```typescript
 * // Approximate a square wave path with 50 rotating vectors.
 * const path: number[][] = [];
 * for (let i = 0; i < 256; i++) {
 *   const a = (2 * Math.PI * i) / 256;
 *   path.push([Math.cos(a), Math.sin(3 * a) / 3]);
 * }
 * const epicycles = new FourierEpicycles({ path, numTerms: 50 });
 * scene.add(epicycles);
 * ```
 */
export class FourierEpicycles extends Group {
  private _coefficients: FourierCoefficient[];
  private _center: Vector3Tuple;
  private _speed: number;
  private _tracker: ValueTracker | null;
  private _maxTracePoints: number;
  private _showPen: boolean;

  private _circlesGroup: Group;
  private _vectorsGroup: Group;
  private _tracedPath: VMobject;
  private _circles: Circle[] = [];
  private _vectors: Arrow[] = [];
  private _pen: Dot | null = null;

  private _time = 0;
  private _tracePoints: number[][] = [];
  private _lastTip: Vector3Tuple;

  // Retained for copy().
  private _sourceSamples: Complex[];
  private _options: FourierEpicyclesOptions;

  constructor(options: FourierEpicyclesOptions) {
    super();
    this._options = { ...options };

    const {
      numSamples = DEFAULT_NUM_SAMPLES,
      center = [0, 0, 0],
      order = 'frequency',
      color = '#58c4dd',
      showCircles = true,
      circleColor = '#888888',
      circleOpacity = 0.5,
      traceColor = '#ffff00',
      traceWidth = 3,
      strokeWidth = 2,
      tipLength = 0.15,
      showPen = true,
      speed = 0.2,
      animate = true,
      tracker,
      maxTracePoints = DEFAULT_MAX_TRACE_POINTS,
    } = options;

    this._center = [center[0], center[1], center[2]];
    this._speed = speed;
    this._tracker = tracker ?? null;
    this._maxTracePoints = Math.max(2, maxTracePoints);
    this._showPen = showPen;

    this._sourceSamples = FourierEpicycles._resolveSamples(options.path, numSamples);

    const allCoefficients = orderCoefficients(fourierCoefficients(this._sourceSamples), order);
    const requested = options.numTerms ?? allCoefficients.length;
    const termCount = Math.max(0, Math.min(requested, allCoefficients.length));
    this._coefficients = allCoefficients.slice(0, termCount);

    this._circlesGroup = new Group();
    this._vectorsGroup = new Group();
    this._tracedPath = new VMobject();
    this._tracedPath.color = traceColor;
    this._tracedPath.fillOpacity = 0;
    this._tracedPath.strokeWidth = traceWidth;

    for (const coeff of this._coefficients) {
      if (showCircles) {
        const circle = new Circle({
          radius: coeff.amplitude,
          color: circleColor,
          strokeWidth: 1,
        });
        circle.setStrokeOpacity(circleOpacity);
        circle.fillOpacity = 0;
        this._circles.push(circle);
        this._circlesGroup.add(circle);
      }

      const arrow = new Arrow({
        start: [0, 0, 0],
        end: [coeff.amplitude || 1e-6, 0, 0],
        color,
        strokeWidth,
        tipLength,
      });
      this._vectors.push(arrow);
      this._vectorsGroup.add(arrow);
    }

    if (showCircles) this.add(this._circlesGroup);
    this.add(this._vectorsGroup);
    this.add(this._tracedPath);

    if (this._showPen) {
      this._pen = new Dot({ point: [...this._center], color: traceColor });
      this.add(this._pen);
    }

    // Position at t = 0 and seed the trace with the initial tip.
    this._lastTip = [...this._center];
    this.setTime(0);
    this._tracePoints.push([...this._lastTip]);

    if (animate) {
      this.addUpdater((_mobject, dt) => this._advance(dt));
    }
  }

  /**
   * Resolve a {@link FourierPathInput} into equally spaced complex samples.
   */
  private static _resolveSamples(path: FourierPathInput, numSamples: number): Complex[] {
    if (Array.isArray(path)) {
      return path.map((p) => ({ re: p[0] ?? 0, im: p[1] ?? 0 }));
    }

    const count = Math.max(0, Math.floor(numSamples));
    if (count === 0) return [];

    if (path instanceof VMobject) {
      if (path.getLocalPoints().length === 0) return [];
      const samples: Complex[] = [];
      for (let i = 0; i < count; i++) {
        const point = path.getPointFromProportion(i / count);
        samples.push({ re: point[0], im: point[1] });
      }
      return samples;
    }

    const [tMin, tMax] = path.tRange ?? [0, 1];
    const samples: Complex[] = [];
    for (let i = 0; i < count; i++) {
      const t = tMin + ((tMax - tMin) * i) / count;
      samples.push(path.func(t));
    }
    return samples;
  }

  /**
   * Advance the internal clock by `dt` seconds (scaled by `speed`), reposition
   * the chain, and extend the traced curve. When a tracker drives time, its
   * value is used directly instead of the internal clock.
   */
  private _advance(dt: number): void {
    const t = this._tracker ? this._tracker.getValue() : (this._time += dt * this._speed);
    this.setTime(t);
    this._appendTracePoint(this._lastTip);
  }

  private _appendTracePoint(point: Vector3Tuple): void {
    this._tracePoints.push([...point]);
    if (this._tracePoints.length > this._maxTracePoints) {
      this._tracePoints.shift();
    }
    this._rebuildTrace();
  }

  private _rebuildTrace(): void {
    const pts = this._tracePoints;
    if (pts.length < 2) {
      this._tracedPath.setPoints3D([]);
      return;
    }

    const bezier: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      if (i === 0) bezier.push([...p0]);
      bezier.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      bezier.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, p0[2] + (2 * dz) / 3]);
      bezier.push([...p1]);
    }
    this._tracedPath.setPoints3D(bezier);
  }

  /**
   * Position every vector and circle for normalized time `t` and move the pen
   * to the chain tip. One full period spans `t ∈ [0, 1)`. Pure positioning:
   * this does not extend the traced curve.
   *
   * @param t - Normalized time.
   * @returns The chain tip as `[x, y, z]`, equal to the `numTerms` partial sum.
   */
  setTime(t: number): Vector3Tuple {
    const z = this._center[2];
    let runningX = this._center[0];
    let runningY = this._center[1];

    for (let i = 0; i < this._coefficients.length; i++) {
      const { freq, amplitude, phase } = this._coefficients[i];
      const angle = 2 * Math.PI * freq * t + phase;
      const vx = amplitude * Math.cos(angle);
      const vy = amplitude * Math.sin(angle);

      const circle = this._circles[i];
      if (circle) circle.moveTo([runningX, runningY, z]);

      const nextX = runningX + vx;
      const nextY = runningY + vy;
      this._vectors[i].putStartAndEndOn([runningX, runningY, z], [nextX, nextY, z]);

      runningX = nextX;
      runningY = nextY;
    }

    this._lastTip = [runningX, runningY, z];
    if (this._pen) this._pen.moveTo([...this._lastTip]);
    return [...this._lastTip];
  }

  /** Current normalized time of the internal clock. */
  getTime(): number {
    return this._time;
  }

  /** The chain tip computed at the most recent {@link setTime}. */
  getTipPoint(): Vector3Tuple {
    return [...this._lastTip];
  }

  /** The ordered coefficients actually shown (length equals the vector count). */
  getCoefficients(): FourierCoefficient[] {
    return this._coefficients.map((c) => ({ ...c }));
  }

  /** The number of rotating vectors (equals the requested, clamped, term count). */
  getNumTerms(): number {
    return this._coefficients.length;
  }

  /** The group of rotating-vector arrows. */
  getVectors(): Group {
    return this._vectorsGroup;
  }

  /** The group of circles (empty when `showCircles` is `false`). */
  getCircles(): Group {
    return this._circlesGroup;
  }

  /** The VMobject holding the traced output curve. */
  getTracedPath(): VMobject {
    return this._tracedPath;
  }

  /** The accumulated trace points, oldest first. */
  getTracePoints(): number[][] {
    return this._tracePoints.map((p) => [...p]);
  }

  /** Clear the accumulated traced curve. */
  clearTrace(): this {
    this._tracePoints = [];
    this._tracedPath.setPoints3D([]);
    return this;
  }

  override copy(): FourierEpicycles {
    const copy = new FourierEpicycles({
      ...this._options,
      path: this._sourceSamples.map((s) => [s.re, s.im, 0]),
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

/* eslint-disable max-lines */
import { Group } from '../../core/Group';
import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple, UpdaterFunction } from '../../core/Mobject';
import { Arrow } from '../geometry';
import { DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Type for vector field function that maps (x, y) to [vx, vy]
 */
export type VectorFunction = (x: number, y: number) => [number, number];

/**
 * Type for color function that maps magnitude (or x, y, vx, vy) to a color string
 */
export type ColorFunction = (
  magnitude: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
) => string;

/**
 * Base options for all vector field types
 */
export interface VectorFieldBaseOptions {
  /** The vector function mapping (x, y) to [vx, vy] */
  func: VectorFunction;
  /** X range as [min, max, step]. Default: [-5, 5, 0.5] */
  xRange?: [number, number, number];
  /** Y range as [min, max, step]. Default: [-3, 3, 0.5] */
  yRange?: [number, number, number];
  /** Length scaling factor for vectors. Default: 1 */
  lengthScale?: number;
  /** Color function or static color. Default: magnitude-based gradient */
  color?: string | ColorFunction;
  /** Minimum magnitude threshold (vectors smaller are not drawn). Default: 0 */
  minMagnitude?: number;
  /** Maximum magnitude threshold (vectors are capped). Default: Infinity */
  maxMagnitude?: number;
  /** Stroke width. Default: DEFAULT_STROKE_WIDTH / 2 */
  strokeWidth?: number;
  /** Opacity. Default: 1 */
  opacity?: number;
}

/**
 * Options for ArrowVectorField
 */
export interface ArrowVectorFieldOptions extends VectorFieldBaseOptions {
  /** Length of arrow tips. Default: 0.15 */
  tipLength?: number;
  /** Maximum visual length for each arrow. Default: 0.8 (step size) */
  maxArrowLength?: number;
  /** Whether to normalize all arrows to the same length. Default: false */
  normalizeArrows?: boolean;
}

/**
 * Options for StreamLines
 */
export interface StreamLinesOptions extends VectorFieldBaseOptions {
  /** Number of streamlines to draw. Default: 15 */
  numLines?: number;
  /** Starting points for streamlines. If not provided, generated automatically. */
  startPoints?: [number, number][];
  /** Maximum length of each streamline. Default: 10 */
  maxLineLength?: number;
  /** Integration step size. Default: 0.05 */
  stepSize?: number;
  /** Minimum step count before stopping. Default: 3 */
  minSteps?: number;
  /** Line width variation based on magnitude. Default: false */
  variableWidth?: boolean;
  /** Whether to draw arrows along streamlines. Default: false */
  showArrows?: boolean;
  /** Spacing between arrows on streamlines. Default: 1 */
  arrowSpacing?: number;
  /** Total virtual time for the simulation. Default: 3 */
  virtualTime?: number;
  /** Maximum anchor points per line (downsamples if exceeded). Default: 100 */
  maxAnchorsPerLine?: number;
  /** Noise added to grid start points. Default: yRange step / 2 */
  noiseFactor?: number;
  /** Padding beyond range boundaries for line termination. Default: 3 */
  padding?: number;
  /** Number of lines per grid point. Default: 1 */
  nRepeats?: number;
}

/**
 * Python manim's SCALAR_FIELD_DEFAULT_COLORS: BLUE_E → GREEN → YELLOW → RED
 */
const SCALAR_FIELD_COLORS: [number, number, number][] = [
  [0x23 / 255, 0x6b / 255, 0x8e / 255], // BLUE_E  #236B8E
  [0x83 / 255, 0xc1 / 255, 0x67 / 255], // GREEN   #83C167
  [0xff / 255, 0xff / 255, 0x00 / 255], // YELLOW  #FFFF00
  [0xfc / 255, 0x62 / 255, 0x55 / 255], // RED     #FC6255
];

/**
 * Default color function that maps magnitude to a 4-color gradient
 * matching Python manim's scalar field coloring over [0, 2].
 */
function defaultColorFunction(magnitude: number): string {
  const t = Math.min(Math.max(magnitude / 2, 0), 1);
  const n = SCALAR_FIELD_COLORS.length;
  const idx = t * (n - 1);
  const lo = Math.min(Math.floor(idx), n - 2);
  const frac = idx - lo;
  const c0 = SCALAR_FIELD_COLORS[lo];
  const c1 = SCALAR_FIELD_COLORS[lo + 1];
  const r = Math.round((c0[0] + (c1[0] - c0[0]) * frac) * 255);
  const g = Math.round((c0[1] + (c1[1] - c0[1]) * frac) * 255);
  const b = Math.round((c0[2] + (c1[2] - c0[2]) * frac) * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * VectorField - Base class for vector field visualizations
 *
 * Provides common functionality for vector fields including:
 * - Grid generation for sample points
 * - Vector function evaluation
 * - Color computation based on magnitude
 * - Magnitude scaling
 *
 * @example
 * ```typescript
 * // Create a radial vector field
 * const field = new VectorField({
 *   func: (x, y) => [x, y],
 *   xRange: [-3, 3, 0.5],
 *   yRange: [-2, 2, 0.5]
 * });
 * ```
 */
export class VectorField extends Group {
  protected _func: VectorFunction;
  protected _xRange: [number, number, number];
  protected _yRange: [number, number, number];
  protected _lengthScale: number;
  protected _colorFunc: ColorFunction;
  protected _minMagnitude: number;
  protected _maxMagnitude: number;
  protected _strokeWidth: number;
  protected _opacity: number;

  constructor(options: VectorFieldBaseOptions) {
    super();

    const {
      func,
      xRange = [-5, 5, 0.5],
      yRange = [-3, 3, 0.5],
      lengthScale = 1,
      color,
      minMagnitude = 0,
      maxMagnitude = Infinity,
      strokeWidth = DEFAULT_STROKE_WIDTH / 2,
      opacity = 1,
    } = options;

    this._func = func;
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._lengthScale = lengthScale;
    this._minMagnitude = minMagnitude;
    this._maxMagnitude = maxMagnitude;
    this._strokeWidth = strokeWidth;
    this._opacity = opacity;

    // Set up color function
    if (typeof color === 'function') {
      this._colorFunc = color;
    } else if (typeof color === 'string') {
      this._colorFunc = () => color;
    } else {
      this._colorFunc = defaultColorFunction;
    }
  }

  /**
   * Generate grid sample points
   * @returns Array of [x, y] coordinates
   */
  protected _generateGridPoints(): [number, number][] {
    const points: [number, number][] = [];
    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;

    for (let x = xMin; x <= xMax + xStep * 0.01; x += xStep) {
      for (let y = yMin; y <= yMax + yStep * 0.01; y += yStep) {
        points.push([x, y]);
      }
    }

    return points;
  }

  /**
   * Evaluate the vector function at a point
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Vector [vx, vy] with magnitude constraints applied
   */
  protected _evaluateVector(x: number, y: number): [number, number] {
    const [vx, vy] = this._func(x, y);
    const magnitude = Math.sqrt(vx * vx + vy * vy);

    // Skip if below minimum magnitude
    if (magnitude < this._minMagnitude) {
      return [0, 0];
    }

    // Cap at maximum magnitude
    if (magnitude > this._maxMagnitude) {
      const scale = this._maxMagnitude / magnitude;
      return [vx * scale, vy * scale];
    }

    return [vx, vy];
  }

  /**
   * Get the color for a vector at a point
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param vx - Vector X component
   * @param vy - Vector Y component
   * @returns CSS color string
   */
  protected _getColor(x: number, y: number, vx: number, vy: number): string {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    return this._colorFunc(magnitude, x, y, vx, vy);
  }

  /**
   * Calculate the magnitude of a vector
   */
  protected _magnitude(vx: number, vy: number): number {
    return Math.sqrt(vx * vx + vy * vy);
  }

  /**
   * Get the vector function
   */
  getFunction(): VectorFunction {
    return this._func;
  }

  /**
   * Set a new vector function and regenerate the field
   * @param func - New vector function
   */
  setFunction(func: VectorFunction): this {
    this._func = func;
    this._regenerate();
    return this;
  }

  /**
   * Get the X range
   */
  getXRange(): [number, number, number] {
    return [...this._xRange];
  }

  /**
   * Get the Y range
   */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /**
   * Set the length scale factor
   */
  setLengthScale(scale: number): this {
    this._lengthScale = scale;
    this._regenerate();
    return this;
  }

  /**
   * Get the length scale factor
   */
  getLengthScale(): number {
    return this._lengthScale;
  }

  /**
   * Regenerate the vector field (to be overridden by subclasses)
   */
  protected _regenerate(): void {
    // Base implementation does nothing
    // Subclasses should override this
  }

  /**
   * Update the vector field for animation purposes
   * Allows smooth updates to the vector function
   * @param func - New vector function
   * @param alpha - Interpolation factor (0-1)
   */
  interpolateFunction(func: VectorFunction, alpha: number): this {
    const originalFunc = this._func;
    this._func = (x: number, y: number): [number, number] => {
      const [vx1, vy1] = originalFunc(x, y);
      const [vx2, vy2] = func(x, y);
      return [vx1 + (vx2 - vx1) * alpha, vy1 + (vy2 - vy1) * alpha];
    };
    this._regenerate();
    return this;
  }

  /**
   * Create a copy of this VectorField
   */
  protected override _createCopy(): VectorField {
    return new VectorField({
      func: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      lengthScale: this._lengthScale,
      color: this._colorFunc,
      minMagnitude: this._minMagnitude,
      maxMagnitude: this._maxMagnitude,
      strokeWidth: this._strokeWidth,
      opacity: this._opacity,
    });
  }
}

/**
 * ArrowVectorField - Vector field visualization using arrows
 *
 * Displays a grid of arrows representing the vector field, where:
 * - Arrow position indicates the sample point
 * - Arrow direction indicates the vector direction
 * - Arrow length indicates the vector magnitude (unless normalized)
 * - Arrow color can indicate magnitude or use a custom function
 *
 * @example
 * ```typescript
 * // Create a rotation field
 * const rotationField = new ArrowVectorField({
 *   func: (x, y) => [-y, x],
 *   xRange: [-3, 3, 0.5],
 *   yRange: [-3, 3, 0.5],
 *   color: '#00ff00'
 * });
 *
 * // Create a field with magnitude-based coloring
 * const gradientField = new ArrowVectorField({
 *   func: (x, y) => [Math.sin(y), Math.cos(x)],
 *   color: (mag) => mag > 0.5 ? '#ff0000' : '#0000ff'
 * });
 * ```
 */
export class ArrowVectorField extends VectorField {
  protected _tipLength: number;
  protected _maxArrowLength: number;
  protected _normalizeArrows: boolean;

  constructor(options: ArrowVectorFieldOptions) {
    super(options);

    const {
      tipLength = 0.15,
      maxArrowLength = options.xRange ? options.xRange[2] * 0.8 : 0.4,
      normalizeArrows = false,
    } = options;

    this._tipLength = tipLength;
    this._maxArrowLength = maxArrowLength;
    this._normalizeArrows = normalizeArrows;

    this._generateArrows();
  }

  /**
   * Generate arrows at each grid point
   */
  private _generateArrows(): void {
    // Clear existing children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    const points = this._generateGridPoints();

    for (const [x, y] of points) {
      const [vx, vy] = this._evaluateVector(x, y);
      const magnitude = this._magnitude(vx, vy);

      // Skip zero vectors
      if (magnitude < 1e-10) {
        continue;
      }

      // Normalize direction
      const dirX = vx / magnitude;
      const dirY = vy / magnitude;

      // Calculate arrow length
      let arrowLength: number;
      if (this._normalizeArrows) {
        arrowLength = this._maxArrowLength * this._lengthScale;
      } else {
        arrowLength = Math.min(magnitude * this._lengthScale, this._maxArrowLength);
      }

      // Calculate end point
      const endX = x + dirX * arrowLength;
      const endY = y + dirY * arrowLength;

      // Get color
      const color = this._getColor(x, y, vx, vy);

      // Create arrow
      const arrow = new Arrow({
        start: [x, y, 0] as Vector3Tuple,
        end: [endX, endY, 0] as Vector3Tuple,
        color,
        strokeWidth: this._strokeWidth,
        tipLength: Math.min(this._tipLength, arrowLength * 0.4),
        tipWidth: Math.min(this._tipLength * 0.6, arrowLength * 0.25),
      });
      arrow.setOpacity(this._opacity);

      this.add(arrow);
    }
  }

  /**
   * Regenerate the vector field
   */
  protected override _regenerate(): void {
    this._generateArrows();
    this._markDirty();
  }

  /**
   * Set whether arrows should be normalized
   */
  setNormalizeArrows(normalize: boolean): this {
    this._normalizeArrows = normalize;
    this._regenerate();
    return this;
  }

  /**
   * Get whether arrows are normalized
   */
  getNormalizeArrows(): boolean {
    return this._normalizeArrows;
  }

  /**
   * Set the maximum arrow length
   */
  setMaxArrowLength(length: number): this {
    this._maxArrowLength = length;
    this._regenerate();
    return this;
  }

  /**
   * Get the maximum arrow length
   */
  getMaxArrowLength(): number {
    return this._maxArrowLength;
  }

  /**
   * Create a copy of this ArrowVectorField
   */
  protected override _createCopy(): ArrowVectorField {
    return new ArrowVectorField({
      func: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      lengthScale: this._lengthScale,
      color: this._colorFunc,
      minMagnitude: this._minMagnitude,
      maxMagnitude: this._maxMagnitude,
      strokeWidth: this._strokeWidth,
      opacity: this._opacity,
      tipLength: this._tipLength,
      maxArrowLength: this._maxArrowLength,
      normalizeArrows: this._normalizeArrows,
    });
  }
}

/**
 * Options for continuous streaming animation on StreamLines
 */
export interface ContinuousMotionOptions {
  /** Whether to warm up (initialize with randomized phases). Default: true */
  warmUp?: boolean;
  /** Flow speed multiplier. Default: 1 */
  flowSpeed?: number;
  /** Width of the visible window (0-1 fraction of total path). Default: 0.3 */
  timeWidth?: number;
  /** Rate function for opacity within the window. Default: linear */
  rateFunc?: (t: number) => number;
}

/** Simple seeded PRNG (mulberry32) for reproducible noise */
function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lerp between two 3D points */
function lerpPt(a: number[], b: number[], t: number): number[] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t,
  ];
}

/** De Casteljau split of a cubic Bezier at parameter t */
function splitBezierAt(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number,
): { left: number[][]; right: number[][] } {
  const q0 = lerpPt(p0, p1, t);
  const q1 = lerpPt(p1, p2, t);
  const q2 = lerpPt(p2, p3, t);
  const r0 = lerpPt(q0, q1, t);
  const r1 = lerpPt(q1, q2, t);
  const s0 = lerpPt(r0, r1, t);
  return { left: [p0, q0, r0, s0], right: [s0, r1, q2, p3] };
}

/**
 * Extract a subsection of cubic Bezier control points between parametric
 * values `lower` and `upper` (both 0-1).  Equivalent to Python manim's
 * `pointwise_become_partial`.
 */
function getPartialBezierPoints(allPoints: number[][], lower: number, upper: number): number[][] {
  if (allPoints.length < 4) return [];
  const nCurves = (allPoints.length - 1) / 3;
  if (nCurves < 1 || lower >= upper) return [];

  lower = Math.max(0, Math.min(1, lower));
  upper = Math.max(0, Math.min(1, upper));

  const lowerIdx = lower * nCurves;
  const upperIdx = upper * nCurves;
  let lowerCurve = Math.floor(lowerIdx);
  let upperCurve = Math.floor(upperIdx);
  let lowerT = lowerIdx - lowerCurve;
  let upperT = upperIdx - upperCurve;

  if (upperCurve >= nCurves) {
    upperCurve = Math.floor(nCurves) - 1;
    upperT = 1.0;
  }
  if (lowerCurve >= nCurves) {
    lowerCurve = Math.floor(nCurves) - 1;
    lowerT = 1.0;
  }

  const result: number[][] = [];

  for (let i = lowerCurve; i <= upperCurve; i++) {
    const base = i * 3;
    let cp0 = allPoints[base];
    let cp1 = allPoints[base + 1];
    let cp2 = allPoints[base + 2];
    let cp3 = allPoints[base + 3];
    if (!cp0 || !cp1 || !cp2 || !cp3) break;

    const startT = i === lowerCurve ? lowerT : 0;
    let endT = i === upperCurve ? upperT : 1;

    if (startT > 0) {
      const s = splitBezierAt(cp0, cp1, cp2, cp3, startT);
      cp0 = s.right[0];
      cp1 = s.right[1];
      cp2 = s.right[2];
      cp3 = s.right[3];
      if (startT < 1) endT = (endT - startT) / (1 - startT);
    }
    if (endT < 1) {
      const s = splitBezierAt(cp0, cp1, cp2, cp3, endT);
      cp0 = s.left[0];
      cp1 = s.left[1];
      cp2 = s.left[2];
      cp3 = s.left[3];
    }

    if (result.length === 0) result.push(cp0);
    result.push(cp1, cp2, cp3);
  }

  return result;
}

/**
 * StreamLines - Streamline visualization for vector fields
 *
 * Draws curves that follow the flow of the vector field.
 * At every point on a streamline, the tangent is parallel to the vector field.
 *
 * @example
 * ```typescript
 * // Create streamlines for a sink field
 * const streamlines = new StreamLines({
 *   func: (x, y) => [-x, -y],
 *   numLines: 20,
 *   maxLineLength: 8
 * });
 *
 * // Create streamlines with custom start points
 * const customLines = new StreamLines({
 *   func: (x, y) => [y, -x],
 *   startPoints: [[1, 0], [2, 0], [3, 0], [-1, 0], [-2, 0], [-3, 0]]
 * });
 *
 * // Create streamlines with arrows
 * const arrowLines = new StreamLines({
 *   func: (x, y) => [Math.sin(x), Math.cos(y)],
 *   showArrows: true,
 *   arrowSpacing: 1.5
 * });
 * ```
 */
export class StreamLines extends VectorField {
  protected _numLines: number;
  protected _startPoints: [number, number][] | null;
  protected _maxLineLength: number;
  protected _stepSize: number;
  protected _minSteps: number;
  protected _variableWidth: boolean;
  protected _showArrows: boolean;
  protected _arrowSpacing: number;
  private _virtualTime: number;
  private _maxAnchorsPerLine: number;
  private _noiseFactor: number;
  private _padding: number;
  private _nRepeats: number;
  private _lineDurations: number[] = [];

  /** Raw integrated points for each streamline (populated during generation) */
  private _streamlineData: { x: number; y: number; vx: number; vy: number }[][] = [];
  /** The VMobject children corresponding to each streamline (no arrows) */
  private _streamlineVMobjects: VMobject[] = [];
  /** Updater reference for continuous motion animation */
  private _animationUpdater: UpdaterFunction | null = null;
  /** Phase for each streamline (0-1), used during continuous motion */
  private _phases: number[] = [];
  /** Saved original bezier points per streamline for restoration after animation */
  private _savedOriginalPoints: number[][][] = [];

  /** Total virtual time of the simulation (matches Python manim) */
  get virtualTime(): number {
    return this._virtualTime;
  }

  constructor(options: StreamLinesOptions) {
    super({
      xRange: [-8, 8, 0.5] as [number, number, number],
      yRange: [-4, 4, 0.5] as [number, number, number],
      ...options,
    });

    const {
      numLines = 15,
      startPoints,
      maxLineLength = 10,
      stepSize = 0.05,
      minSteps = 3,
      variableWidth = false,
      showArrows = false,
      arrowSpacing = 1,
      virtualTime = 3,
      maxAnchorsPerLine = 100,
      padding = 3,
      nRepeats = 1,
    } = options;

    this._numLines = numLines;
    this._startPoints = startPoints || null;
    this._maxLineLength = maxLineLength;
    this._stepSize = stepSize;
    this._minSteps = minSteps;
    this._variableWidth = variableWidth;
    this._showArrows = showArrows;
    this._arrowSpacing = arrowSpacing;
    this._virtualTime = virtualTime;
    this._maxAnchorsPerLine = maxAnchorsPerLine;
    this._noiseFactor = options.noiseFactor ?? this._yRange[2] / 2;
    this._padding = padding;
    this._nRepeats = nRepeats;

    this._generateStreamlines();
  }

  /**
   * Generate starting points for streamlines.
   * Uses grid-based generation with noise (matching Python manim) when
   * startPoints is not explicitly set.
   */
  private _getStartPoints(): [number, number][] {
    if (this._startPoints) {
      return this._startPoints;
    }

    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;
    const points: [number, number][] = [];
    const rng = seededRandom(0);
    const nf = this._noiseFactor;

    for (let x = xMin; x <= xMax + xStep * 0.01; x += xStep) {
      for (let y = yMin; y <= yMax + yStep * 0.01; y += yStep) {
        for (let r = 0; r < this._nRepeats; r++) {
          points.push([x + nf * (rng() - 0.5), y + nf * (rng() - 0.5)]);
        }
      }
    }

    return points;
  }

  /**
   * Integrate a streamline from a starting point using simple Euler integration.
   * Matches Python manim behavior: magnitude directly scales step size.
   * @param startX - Starting X coordinate
   * @param startY - Starting Y coordinate
   * @returns Array of points along the streamline
   */
  private _integrateStreamline(
    startX: number,
    startY: number,
  ): { points: { x: number; y: number; vx: number; vy: number }[]; lastStep: number } {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;
    const maxSteps = Math.ceil(this._virtualTime / this._stepSize) + 1;
    const dt = this._stepSize;

    const points: { x: number; y: number; vx: number; vy: number }[] = [];
    let x = startX;
    let y = startY;
    let lastStep = 0;

    const [initVx, initVy] = this._func(x, y);
    points.push({ x, y, vx: initVx, vy: initVy });

    for (let step = 0; step < maxSteps; step++) {
      lastStep = step;
      const [vx, vy] = this._func(x, y);

      // Simple Euler integration - magnitude directly scales step (matches Python)
      const newX = x + dt * vx;
      const newY = y + dt * vy;

      // Check bounds with padding
      if (
        newX < xMin - this._padding ||
        newX > xMax + this._padding ||
        newY < yMin - this._padding ||
        newY > yMax + this._padding
      ) {
        break;
      }

      x = newX;
      y = newY;
      const [newVx, newVy] = this._func(x, y);
      points.push({ x, y, vx: newVx, vy: newVy });
    }

    return { points, lastStep };
  }

  /**
   * Convert an array of integrated points to cubic Bezier control points
   */
  private _pointsToBezier(
    linePoints: { x: number; y: number; vx: number; vy: number }[],
  ): number[][] {
    const bezierPoints: number[][] = [];

    for (let i = 0; i < linePoints.length; i++) {
      const p = linePoints[i];

      if (i === 0) {
        bezierPoints.push([p.x, p.y, 0]);
      } else {
        const prev = linePoints[i - 1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;

        bezierPoints.push([prev.x + dx / 3, prev.y + dy / 3, 0]);
        bezierPoints.push([prev.x + (2 * dx) / 3, prev.y + (2 * dy) / 3, 0]);
        bezierPoints.push([p.x, p.y, 0]);
      }
    }

    return bezierPoints;
  }

  /**
   * Downsample an array of points to a maximum count, preserving first and last
   */
  private _downsample<T>(points: T[], maxPoints: number): T[] {
    if (points.length <= maxPoints) return points;

    const result: T[] = [points[0]];
    const step = (points.length - 1) / (maxPoints - 1);

    for (let i = 1; i < maxPoints - 1; i++) {
      result.push(points[Math.round(i * step)]);
    }
    result.push(points[points.length - 1]);

    return result;
  }

  /**
   * Generate all streamlines
   */
  private _generateStreamlines(): void {
    // Clear existing children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }
    this._streamlineData = [];
    this._streamlineVMobjects = [];
    this._lineDurations = [];

    const startPoints = this._getStartPoints();

    for (const [startX, startY] of startPoints) {
      const result = this._integrateStreamline(startX, startY);
      let linePoints = result.points;

      if (linePoints.length < 2) {
        continue;
      }

      // Store duration (step_count * dt) matching Python
      this._lineDurations.push(result.lastStep * this._stepSize);

      // Store the raw integrated data for animation use
      this._streamlineData.push(linePoints);

      // Downsample to maxAnchorsPerLine
      if (linePoints.length > this._maxAnchorsPerLine) {
        linePoints = this._downsample(linePoints, this._maxAnchorsPerLine);
      }

      // Create streamline as VMobject with Bezier curves
      const streamline = new VMobject();
      const bezierPoints = this._pointsToBezier(linePoints);
      streamline.setPoints3D(bezierPoints);

      // Color based on average magnitude along the line
      const avgMagnitude =
        linePoints.reduce((sum, p) => sum + Math.sqrt(p.vx ** 2 + p.vy ** 2), 0) /
        linePoints.length;

      const color = this._colorFunc(
        avgMagnitude,
        startX,
        startY,
        linePoints[0].vx,
        linePoints[0].vy,
      );

      streamline.setColor(color);
      streamline.setOpacity(this._opacity);
      streamline.fillOpacity = 0;

      // Variable width based on magnitude
      if (this._variableWidth) {
        streamline.setStrokeWidth(this._strokeWidth * (0.5 + avgMagnitude / 2));
      } else {
        streamline.setStrokeWidth(this._strokeWidth);
      }

      this.add(streamline);
      this._streamlineVMobjects.push(streamline);

      // Add arrows along the streamline if requested
      if (this._showArrows) {
        this._addArrowsToLine(linePoints, color);
      }
    }
  }

  /**
   * Add arrows along a streamline
   */
  private _addArrowsToLine(
    linePoints: { x: number; y: number; vx: number; vy: number }[],
    color: string,
  ): void {
    let distanceAccum = 0;
    let lastArrowDist = 0;

    for (let i = 1; i < linePoints.length; i++) {
      const prev = linePoints[i - 1];
      const curr = linePoints[i];

      const segmentLen = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      distanceAccum += segmentLen;

      // Place arrow at spacing intervals
      if (distanceAccum - lastArrowDist >= this._arrowSpacing) {
        const mag = Math.sqrt(curr.vx ** 2 + curr.vy ** 2);
        if (mag > 1e-10) {
          const arrowLen = Math.min(this._arrowSpacing * 0.3, 0.2);
          const dirX = curr.vx / mag;
          const dirY = curr.vy / mag;

          const arrow = new Arrow({
            start: [curr.x - (dirX * arrowLen) / 2, curr.y - (dirY * arrowLen) / 2, 0],
            end: [curr.x + (dirX * arrowLen) / 2, curr.y + (dirY * arrowLen) / 2, 0],
            color,
            strokeWidth: this._strokeWidth,
            tipLength: arrowLen * 0.5,
            tipWidth: arrowLen * 0.3,
          });
          arrow.setOpacity(this._opacity);
          this.add(arrow);

          lastArrowDist = distanceAccum;
        }
      }
    }
  }

  /**
   * Regenerate the vector field
   */
  protected override _regenerate(): void {
    this._generateStreamlines();
    this._markDirty();
  }

  /**
   * Set custom starting points
   */
  setStartPoints(points: [number, number][]): this {
    this._startPoints = points;
    this._regenerate();
    return this;
  }

  /**
   * Get the starting points
   */
  getStartPoints(): [number, number][] {
    return this._getStartPoints();
  }

  /**
   * Set the number of streamlines (only used when startPoints is null)
   */
  setNumLines(num: number): this {
    this._numLines = num;
    if (!this._startPoints) {
      this._regenerate();
    }
    return this;
  }

  /**
   * Get the number of streamlines
   */
  getNumLines(): number {
    return this._numLines;
  }

  /**
   * Set whether to show arrows along streamlines
   */
  setShowArrows(show: boolean): this {
    this._showArrows = show;
    this._regenerate();
    return this;
  }

  /**
   * Get whether arrows are shown
   */
  getShowArrows(): boolean {
    return this._showArrows;
  }

  /**
   * Set the maximum line length
   */
  setMaxLineLength(length: number): this {
    this._maxLineLength = length;
    this._regenerate();
    return this;
  }

  /**
   * Get the maximum line length
   */
  getMaxLineLength(): number {
    return this._maxLineLength;
  }

  /**
   * Start continuous flowing animation on the streamlines.
   *
   * Matches Python manim's AnimatedStreamLines / ShowPassingFlash behavior:
   * each streamline shows only a `timeWidth` fraction of its path, sliding
   * along each frame as a bright streak that fades in at the front and out
   * at the back.
   *
   * @param options - Animation configuration
   */
  startAnimation(options: ContinuousMotionOptions = {}): this {
    const { warmUp = true, flowSpeed = 1, timeWidth = 0.3 } = options;

    // Stop any existing animation first
    if (this._animationUpdater) {
      this.endAnimation();
    }

    const numLines = this._streamlineData.length;
    if (numLines === 0) return this;

    // Save each streamline's original bezier points so endAnimation can restore them
    this._savedOriginalPoints = [];
    for (let i = 0; i < numLines; i++) {
      const vmob = this._streamlineVMobjects[i];
      if (vmob) {
        this._savedOriginalPoints.push(vmob.getPoints());
      } else {
        this._savedOriginalPoints.push([]);
      }
    }

    // Use stored line durations and virtualTime
    const runTimes: number[] = this._lineDurations.map((d) => d / Math.max(flowSpeed, 1e-6));
    const virtualTime = this._virtualTime;

    // Initialize per-line time (seconds). Matches Python manim:
    //   line.time = random.random() * virtual_time
    //   if warm_up: line.time *= -1
    // When warmUp=True, time starts negative so lines are initially invisible
    // and gradually appear. When warmUp=False, time starts positive (random phase).
    this._phases = new Array(numLines);
    for (let i = 0; i < numLines; i++) {
      const randTime = Math.random() * virtualTime;
      this._phases[i] = warmUp ? -randTime : randTime;
    }

    // Create the updater – mirrors Python manim's updater logic exactly:
    //   line.time += dt * flow_speed
    //   if line.time >= virtual_time: line.time -= virtual_time
    //   alpha = clip(line.time / line.anim.run_time, 0, 1)
    //   line.anim.interpolate(alpha)  # ShowPassingFlash
    this._animationUpdater = (_mob: Mobject, dt: number) => {
      for (let i = 0; i < numLines; i++) {
        const vmob = this._streamlineVMobjects[i];
        const origPoints = this._savedOriginalPoints[i];
        if (!vmob || !origPoints || origPoints.length < 4) continue;

        const runTime = runTimes[i];

        // Advance time (matches Python: line.time += dt * flow_speed)
        this._phases[i] += dt * flowSpeed;
        if (this._phases[i] >= virtualTime) {
          this._phases[i] -= virtualTime;
        }

        // Compute alpha, clamped to [0, 1]
        const alpha = Math.max(0, Math.min(this._phases[i] / runTime, 1));

        // ShowPassingFlash._get_bounds
        let upper = alpha * (1 + timeWidth);
        let lower = upper - timeWidth;
        upper = Math.min(upper, 1);
        lower = Math.max(lower, 0);

        if (upper <= lower || alpha <= 0) {
          vmob.setOpacity(0);
          vmob._markDirty();
          continue;
        }

        // Use pointwise_become_partial equivalent
        const partialPoints = getPartialBezierPoints(origPoints, lower, upper);
        if (partialPoints.length < 4) {
          vmob.setOpacity(0);
          vmob._markDirty();
          continue;
        }

        vmob.setPoints3D(partialPoints);
        vmob.setOpacity(this._opacity);
        vmob._markDirty();
      }
    };

    this.addUpdater(this._animationUpdater);
    return this;
  }

  /**
   * Stop the continuous flowing animation.
   * Removes the updater and restores all streamlines to their full original
   * bezier points and opacity.
   */
  endAnimation(): this {
    if (this._animationUpdater) {
      this.removeUpdater(this._animationUpdater);
      this._animationUpdater = null;
    }

    // Restore each streamline from saved original bezier points
    for (let i = 0; i < this._streamlineVMobjects.length; i++) {
      const vmob = this._streamlineVMobjects[i];
      if (!vmob) continue;

      if (this._savedOriginalPoints[i] && this._savedOriginalPoints[i].length > 0) {
        vmob.setPoints3D(this._savedOriginalPoints[i]);
      } else {
        // Fallback: recompute from integrated data
        const linePoints = this._streamlineData[i];
        if (linePoints && linePoints.length >= 2) {
          const bezierPoints = this._pointsToBezier(linePoints);
          vmob.setPoints3D(bezierPoints);
        }
      }

      vmob.setOpacity(this._opacity);
      vmob._markDirty();
    }

    this._savedOriginalPoints = [];
    this._phases = [];
    return this;
  }

  /**
   * Create a copy of this StreamLines
   */
  protected override _createCopy(): StreamLines {
    return new StreamLines({
      func: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      lengthScale: this._lengthScale,
      color: this._colorFunc,
      minMagnitude: this._minMagnitude,
      maxMagnitude: this._maxMagnitude,
      strokeWidth: this._strokeWidth,
      opacity: this._opacity,
      numLines: this._numLines,
      startPoints: this._startPoints || undefined,
      maxLineLength: this._maxLineLength,
      stepSize: this._stepSize,
      minSteps: this._minSteps,
      variableWidth: this._variableWidth,
      showArrows: this._showArrows,
      arrowSpacing: this._arrowSpacing,
      virtualTime: this._virtualTime,
      maxAnchorsPerLine: this._maxAnchorsPerLine,
      noiseFactor: this._noiseFactor,
      padding: this._padding,
      nRepeats: this._nRepeats,
    });
  }
}

export default VectorField;

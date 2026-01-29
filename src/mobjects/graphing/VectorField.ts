import { Group } from '../../core/Group';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
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
  vy: number
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
  /** Integration step size. Default: 0.1 */
  stepSize?: number;
  /** Minimum step count before stopping. Default: 3 */
  minSteps?: number;
  /** Line width variation based on magnitude. Default: false */
  variableWidth?: boolean;
  /** Whether to draw arrows along streamlines. Default: false */
  showArrows?: boolean;
  /** Spacing between arrows on streamlines. Default: 1 */
  arrowSpacing?: number;
}

/**
 * Default color function that maps magnitude to a blue-to-red gradient
 */
function defaultColorFunction(magnitude: number): string {
  // Clamp magnitude to [0, 1] range for color mapping
  const t = Math.min(Math.max(magnitude / 3, 0), 1);

  // Blue (#58C4DD) to Yellow (#FFFF00) to Red (#FF0000)
  const r = Math.round(88 + (255 - 88) * t);
  const g = Math.round(196 - 196 * t * t);
  const b = Math.round(221 * (1 - t));

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
  interpolateFunction(
    func: VectorFunction,
    alpha: number
  ): this {
    const originalFunc = this._func;
    this._func = (x: number, y: number): [number, number] => {
      const [vx1, vy1] = originalFunc(x, y);
      const [vx2, vy2] = func(x, y);
      return [
        vx1 + (vx2 - vx1) * alpha,
        vy1 + (vy2 - vy1) * alpha,
      ];
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
        arrowLength = Math.min(
          magnitude * this._lengthScale,
          this._maxArrowLength
        );
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

  constructor(options: StreamLinesOptions) {
    super(options);

    const {
      numLines = 15,
      startPoints,
      maxLineLength = 10,
      stepSize = 0.1,
      minSteps = 3,
      variableWidth = false,
      showArrows = false,
      arrowSpacing = 1,
    } = options;

    this._numLines = numLines;
    this._startPoints = startPoints || null;
    this._maxLineLength = maxLineLength;
    this._stepSize = stepSize;
    this._minSteps = minSteps;
    this._variableWidth = variableWidth;
    this._showArrows = showArrows;
    this._arrowSpacing = arrowSpacing;

    this._generateStreamlines();
  }

  /**
   * Generate starting points for streamlines if not provided
   */
  private _getStartPoints(): [number, number][] {
    if (this._startPoints) {
      return this._startPoints;
    }

    // Generate evenly distributed start points
    const points: [number, number][] = [];
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    // Use a quasi-random distribution
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    for (let i = 0; i < this._numLines; i++) {
      const t = i / this._numLines;
      // Use golden ratio spiral for better distribution
      const x = xMin + (xMax - xMin) * ((t * phi) % 1);
      const y = yMin + (yMax - yMin) * ((t * phi * phi) % 1);
      points.push([x, y]);
    }

    return points;
  }

  /**
   * Integrate a streamline from a starting point using RK4
   * @param startX - Starting X coordinate
   * @param startY - Starting Y coordinate
   * @returns Array of points along the streamline
   */
  private _integrateStreamline(
    startX: number,
    startY: number
  ): { x: number; y: number; vx: number; vy: number }[] {
    const points: { x: number; y: number; vx: number; vy: number }[] = [];
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    let x = startX;
    let y = startY;
    let totalLength = 0;
    let steps = 0;

    // Helper for RK4 integration
    const rk4Step = (
      x: number,
      y: number,
      h: number
    ): { x: number; y: number; vx: number; vy: number } | null => {
      const [k1x, k1y] = this._func(x, y);
      const mag1 = Math.sqrt(k1x * k1x + k1y * k1y);
      if (mag1 < 1e-10) return null;

      const [k2x, k2y] = this._func(
        x + 0.5 * h * k1x / mag1,
        y + 0.5 * h * k1y / mag1
      );
      const mag2 = Math.sqrt(k2x * k2x + k2y * k2y);
      if (mag2 < 1e-10) return null;

      const [k3x, k3y] = this._func(
        x + 0.5 * h * k2x / mag2,
        y + 0.5 * h * k2y / mag2
      );
      const mag3 = Math.sqrt(k3x * k3x + k3y * k3y);
      if (mag3 < 1e-10) return null;

      const [k4x, k4y] = this._func(
        x + h * k3x / mag3,
        y + h * k3y / mag3
      );
      const mag4 = Math.sqrt(k4x * k4x + k4y * k4y);
      if (mag4 < 1e-10) return null;

      // Weighted average of derivatives (normalized)
      const dx = h * (k1x / mag1 + 2 * k2x / mag2 + 2 * k3x / mag3 + k4x / mag4) / 6;
      const dy = h * (k1y / mag1 + 2 * k2y / mag2 + 2 * k3y / mag3 + k4y / mag4) / 6;

      return {
        x: x + dx,
        y: y + dy,
        vx: k1x,
        vy: k1y,
      };
    };

    // Initial point
    const [initVx, initVy] = this._func(x, y);
    points.push({ x, y, vx: initVx, vy: initVy });

    // Integrate forward
    while (totalLength < this._maxLineLength) {
      const result = rk4Step(x, y, this._stepSize * this._lengthScale);
      if (!result) break;

      const { x: newX, y: newY, vx, vy } = result;

      // Check bounds
      if (newX < xMin || newX > xMax || newY < yMin || newY > yMax) {
        // Add boundary point and stop
        const clampedX = Math.max(xMin, Math.min(xMax, newX));
        const clampedY = Math.max(yMin, Math.min(yMax, newY));
        points.push({ x: clampedX, y: clampedY, vx, vy });
        break;
      }

      // Update step length
      const stepLen = Math.sqrt((newX - x) ** 2 + (newY - y) ** 2);
      totalLength += stepLen;
      steps++;

      x = newX;
      y = newY;
      points.push({ x, y, vx, vy });

      // Safety limit
      if (steps > 1000) break;
    }

    // Only return if we have enough steps
    return steps >= this._minSteps ? points : [];
  }

  /**
   * Generate all streamlines
   */
  private _generateStreamlines(): void {
    // Clear existing children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    const startPoints = this._getStartPoints();

    for (const [startX, startY] of startPoints) {
      const linePoints = this._integrateStreamline(startX, startY);

      if (linePoints.length < 2) {
        continue;
      }

      // Create streamline as VMobject with Bezier curves
      const streamline = new VMobject();

      // Convert to cubic Bezier points
      const bezierPoints: number[][] = [];

      for (let i = 0; i < linePoints.length; i++) {
        const p = linePoints[i];

        if (i === 0) {
          bezierPoints.push([p.x, p.y, 0]);
        } else {
          const prev = linePoints[i - 1];
          // Create cubic Bezier control points for smooth curve
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;

          bezierPoints.push([prev.x + dx / 3, prev.y + dy / 3, 0]);
          bezierPoints.push([prev.x + 2 * dx / 3, prev.y + 2 * dy / 3, 0]);
          bezierPoints.push([p.x, p.y, 0]);
        }
      }

      streamline.setPoints3D(bezierPoints);

      // Color based on average magnitude along the line
      const avgMagnitude = linePoints.reduce(
        (sum, p) => sum + Math.sqrt(p.vx ** 2 + p.vy ** 2),
        0
      ) / linePoints.length;

      const color = this._colorFunc(
        avgMagnitude,
        startX,
        startY,
        linePoints[0].vx,
        linePoints[0].vy
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
    color: string
  ): void {
    let distanceAccum = 0;
    let lastArrowDist = 0;

    for (let i = 1; i < linePoints.length; i++) {
      const prev = linePoints[i - 1];
      const curr = linePoints[i];

      const segmentLen = Math.sqrt(
        (curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2
      );
      distanceAccum += segmentLen;

      // Place arrow at spacing intervals
      if (distanceAccum - lastArrowDist >= this._arrowSpacing) {
        const mag = Math.sqrt(curr.vx ** 2 + curr.vy ** 2);
        if (mag > 1e-10) {
          const arrowLen = Math.min(this._arrowSpacing * 0.3, 0.2);
          const dirX = curr.vx / mag;
          const dirY = curr.vy / mag;

          const arrow = new Arrow({
            start: [curr.x - dirX * arrowLen / 2, curr.y - dirY * arrowLen / 2, 0],
            end: [curr.x + dirX * arrowLen / 2, curr.y + dirY * arrowLen / 2, 0],
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
    });
  }
}

export default VectorField;

import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Base options for all arrow tips
 */
export interface ArrowTipOptions {
  /** Length of the tip along the arrow direction. Default: 0.3 */
  length?: number;
  /** Width of the tip perpendicular to arrow direction. Default: 0.1 */
  width?: number;
  /** Color of the tip. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 */
  strokeWidth?: number;
  /** Fill opacity from 0 to 1. Default: 0 for unfilled tips */
  fillOpacity?: number;
  /** Position at end of line (tip point). Default: [0, 0, 0] */
  position?: Vector3Tuple;
  /** Direction the tip points towards (normalized). Default: [1, 0, 0] */
  direction?: Vector3Tuple;
}

/**
 * Helper to normalize a vector
 */
function normalize(v: Vector3Tuple): Vector3Tuple {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [1, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Helper to get a perpendicular vector in the XY plane
 */
function getPerpendicular(dir: Vector3Tuple): Vector3Tuple {
  if (Math.abs(dir[2]) > 0.99) {
    // Direction is along Z, use X as perpendicular
    return [1, 0, 0];
  }
  // Cross with Z axis to get perpendicular in XY plane
  const perpX = -dir[1];
  const perpY = dir[0];
  const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
  if (perpLen === 0) return [0, 1, 0];
  return [perpX / perpLen, perpY / perpLen, 0];
}

/**
 * ArrowTip - Base class for arrow tips
 *
 * This is an abstract base class that defines the interface for arrow tips.
 * Concrete tip styles extend this class.
 *
 * @example
 * ```typescript
 * // Tips are typically used with Arrow class, but can be standalone
 * const tip = new ArrowTriangleTip({
 *   position: [1, 0, 0],
 *   direction: [1, 0, 0],
 *   length: 0.3,
 *   width: 0.2
 * });
 * ```
 */
export abstract class ArrowTip extends VMobject {
  protected _length: number;
  protected _width: number;
  protected _position: Vector3Tuple;
  protected _direction: Vector3Tuple;

  constructor(options: ArrowTipOptions = {}) {
    super();

    const {
      length = 0.3,
      width = 0.1,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      fillOpacity = 0,
      position = [0, 0, 0],
      direction = [1, 0, 0],
    } = options;

    this._length = length;
    this._width = width;
    this._position = [...position];
    this._direction = normalize(direction);

    this.color = color;
    this.strokeWidth = strokeWidth;
    this.fillOpacity = fillOpacity;
  }

  /**
   * Get the tip length
   */
  getLength(): number {
    return this._length;
  }

  /**
   * Set the tip length
   */
  setLength(value: number): this {
    this._length = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the tip width
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Set the tip width
   */
  setWidth(value: number): this {
    this._width = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the tip position (point where it attaches)
   */
  getPosition(): Vector3Tuple {
    return [...this._position];
  }

  /**
   * Set the tip position
   */
  setTipPosition(position: Vector3Tuple): this {
    this._position = [...position];
    this._generatePoints();
    return this;
  }

  /**
   * Get the tip direction
   */
  getDirection(): Vector3Tuple {
    return [...this._direction];
  }

  /**
   * Set the tip direction
   */
  setDirection(direction: Vector3Tuple): this {
    this._direction = normalize(direction);
    this._generatePoints();
    return this;
  }

  /**
   * Get the base point of the tip (opposite to the point)
   */
  getBase(): Vector3Tuple {
    return [
      this._position[0] - this._direction[0] * this._length,
      this._position[1] - this._direction[1] * this._length,
      this._position[2] - this._direction[2] * this._length,
    ];
  }

  /**
   * Get the angle of the tip relative to the X axis (radians)
   */
  getAngle(): number {
    return Math.atan2(this._direction[1], this._direction[0]);
  }

  /**
   * Generate the points for this tip - implemented by subclasses
   */
  protected abstract _generatePoints(): void;
}

/**
 * ArrowTriangleTip - Standard unfilled triangle arrow tip
 *
 * Creates a simple triangular arrowhead outline.
 *
 * @example
 * ```typescript
 * const tip = new ArrowTriangleTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   color: '#ff0000'
 * });
 * ```
 */
export class ArrowTriangleTip extends ArrowTip {
  constructor(options: ArrowTipOptions = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 0 });
    this._generatePoints();
  }

  protected _generatePoints(): void {
    const [px, py, pz] = this._position;
    const [dx, dy, dz] = this._direction;
    const [perpX, perpY, perpZ] = getPerpendicular(this._direction);

    // Base position (back of the triangle)
    const baseX = px - dx * this._length;
    const baseY = py - dy * this._length;
    const baseZ = pz - dz * this._length;

    // Left and right corners of the triangle base
    const leftX = baseX + perpX * this._width;
    const leftY = baseY + perpY * this._width;
    const leftZ = baseZ + perpZ * this._width;

    const rightX = baseX - perpX * this._width;
    const rightY = baseY - perpY * this._width;
    const rightZ = baseZ - perpZ * this._width;

    const points: number[][] = [];

    // Helper to add a line segment as cubic Bezier
    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const ldx = p1[0] - p0[0];
      const ldy = p1[1] - p0[1];
      const ldz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + ldx / 3, p0[1] + ldy / 3, p0[2] + ldz / 3]);
      points.push([p0[0] + (2 * ldx) / 3, p0[1] + (2 * ldy) / 3, p0[2] + (2 * ldz) / 3]);
      points.push([...p1]);
    };

    // Triangle: left -> point -> right -> left
    addLineSegment([leftX, leftY, leftZ], [px, py, pz], true);
    addLineSegment([px, py, pz], [rightX, rightY, rightZ], false);
    addLineSegment([rightX, rightY, rightZ], [leftX, leftY, leftZ], false);

    this.setPoints3D(points);
  }

  protected override _createCopy(): ArrowTriangleTip {
    return new ArrowTriangleTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
    });
  }
}

/**
 * ArrowTriangleFilledTip - Filled triangle arrow tip
 *
 * Creates a solid filled triangular arrowhead.
 *
 * @example
 * ```typescript
 * const tip = new ArrowTriangleFilledTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   color: '#ff0000'
 * });
 * ```
 */
export class ArrowTriangleFilledTip extends ArrowTriangleTip {
  constructor(options: ArrowTipOptions = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 1 });
  }

  protected override _createCopy(): ArrowTriangleFilledTip {
    return new ArrowTriangleFilledTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
    });
  }
}

/**
 * ArrowCircleTip - Unfilled circle at the end of an arrow
 *
 * Creates a circular arrowhead outline.
 *
 * @example
 * ```typescript
 * const tip = new ArrowCircleTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   width: 0.2  // Radius of the circle
 * });
 * ```
 */
export class ArrowCircleTip extends ArrowTip {
  private _numSegments: number;

  constructor(options: ArrowTipOptions & { numSegments?: number } = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 0 });
    this._numSegments = options.numSegments ?? 8;
    this._generatePoints();
  }

  protected _generatePoints(): void {
    const [px, py, pz] = this._position;
    const [dx, dy, dz] = this._direction;

    // Center of circle is offset from position by radius (width)
    const radius = this._width;
    const centerX = px - dx * radius;
    const centerY = py - dy * radius;
    const centerZ = pz - dz * radius;

    const points: number[][] = [];
    const numSegments = this._numSegments;

    // Generate circle points using cubic Bezier approximation
    // For a unit circle, the optimal handle length is 4 * (sqrt(2) - 1) / 3 ~ 0.5523
    // (Note: kappa is the standard approximation but we use the tangent-based formula below for variable arc sizes)
    const _kappa = 0.5522847498;
    void _kappa;

    for (let i = 0; i < numSegments; i++) {
      const angle1 = (i / numSegments) * 2 * Math.PI;
      const angle2 = ((i + 1) / numSegments) * 2 * Math.PI;

      const cos1 = Math.cos(angle1);
      const sin1 = Math.sin(angle1);
      const cos2 = Math.cos(angle2);
      const sin2 = Math.sin(angle2);

      // Start point of segment
      const p0 = [centerX + radius * cos1, centerY + radius * sin1, centerZ];

      // End point of segment
      const p3 = [centerX + radius * cos2, centerY + radius * sin2, centerZ];

      // Calculate control points for circular arc
      const arcLength = (2 * Math.PI) / numSegments;
      const handleLen = (4 / 3) * Math.tan(arcLength / 4) * radius;

      const p1 = [p0[0] - handleLen * sin1, p0[1] + handleLen * cos1, p0[2]];

      const p2 = [p3[0] + handleLen * sin2, p3[1] - handleLen * cos2, p3[2]];

      if (i === 0) {
        points.push(p0);
      }
      points.push(p1, p2, p3);
    }

    this.setPoints3D(points);
  }

  protected override _createCopy(): ArrowCircleTip {
    return new ArrowCircleTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
      numSegments: this._numSegments,
    });
  }
}

/**
 * ArrowCircleFilledTip - Filled circle at the end of an arrow
 *
 * Creates a solid filled circular arrowhead.
 *
 * @example
 * ```typescript
 * const tip = new ArrowCircleFilledTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   width: 0.2  // Radius of the circle
 * });
 * ```
 */
export class ArrowCircleFilledTip extends ArrowCircleTip {
  constructor(options: ArrowTipOptions & { numSegments?: number } = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 1 });
  }

  protected override _createCopy(): ArrowCircleFilledTip {
    return new ArrowCircleFilledTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
    });
  }
}

/**
 * ArrowSquareTip - Unfilled square at the end of an arrow
 *
 * Creates a square arrowhead outline.
 *
 * @example
 * ```typescript
 * const tip = new ArrowSquareTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   width: 0.15
 * });
 * ```
 */
export class ArrowSquareTip extends ArrowTip {
  constructor(options: ArrowTipOptions = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 0 });
    this._generatePoints();
  }

  protected _generatePoints(): void {
    const [px, py, pz] = this._position;
    const [dx, dy, dz] = this._direction;
    const [perpX, perpY, perpZ] = getPerpendicular(this._direction);

    const halfWidth = this._width;

    // Front of square (at position)
    const frontLeftX = px + perpX * halfWidth;
    const frontLeftY = py + perpY * halfWidth;
    const frontLeftZ = pz + perpZ * halfWidth;

    const frontRightX = px - perpX * halfWidth;
    const frontRightY = py - perpY * halfWidth;
    const frontRightZ = pz - perpZ * halfWidth;

    // Back of square
    const sideLength = this._width * 2;
    const backX = px - dx * sideLength;
    const backY = py - dy * sideLength;
    const backZ = pz - dz * sideLength;

    const backLeftX = backX + perpX * halfWidth;
    const backLeftY = backY + perpY * halfWidth;
    const backLeftZ = backZ + perpZ * halfWidth;

    const backRightX = backX - perpX * halfWidth;
    const backRightY = backY - perpY * halfWidth;
    const backRightZ = backZ - perpZ * halfWidth;

    const points: number[][] = [];

    // Helper to add a line segment as cubic Bezier
    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const ldx = p1[0] - p0[0];
      const ldy = p1[1] - p0[1];
      const ldz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + ldx / 3, p0[1] + ldy / 3, p0[2] + ldz / 3]);
      points.push([p0[0] + (2 * ldx) / 3, p0[1] + (2 * ldy) / 3, p0[2] + (2 * ldz) / 3]);
      points.push([...p1]);
    };

    // Square: frontLeft -> frontRight -> backRight -> backLeft -> frontLeft
    addLineSegment(
      [frontLeftX, frontLeftY, frontLeftZ],
      [frontRightX, frontRightY, frontRightZ],
      true,
    );
    addLineSegment(
      [frontRightX, frontRightY, frontRightZ],
      [backRightX, backRightY, backRightZ],
      false,
    );
    addLineSegment([backRightX, backRightY, backRightZ], [backLeftX, backLeftY, backLeftZ], false);
    addLineSegment([backLeftX, backLeftY, backLeftZ], [frontLeftX, frontLeftY, frontLeftZ], false);

    this.setPoints3D(points);
  }

  protected override _createCopy(): ArrowSquareTip {
    return new ArrowSquareTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
    });
  }
}

/**
 * ArrowSquareFilledTip - Filled square at the end of an arrow
 *
 * Creates a solid filled square arrowhead.
 *
 * @example
 * ```typescript
 * const tip = new ArrowSquareFilledTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   width: 0.15
 * });
 * ```
 */
export class ArrowSquareFilledTip extends ArrowSquareTip {
  constructor(options: ArrowTipOptions = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 1 });
  }

  protected override _createCopy(): ArrowSquareFilledTip {
    return new ArrowSquareFilledTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
    });
  }
}

/**
 * StealthTip - Stealth fighter style sharp arrow tip
 *
 * Creates a sleek, swept-back arrow tip similar to a stealth aircraft.
 * The tip has an indented back creating a sharper, more aggressive look.
 *
 * @example
 * ```typescript
 * const tip = new StealthTip({
 *   position: [2, 0, 0],
 *   direction: [1, 0, 0],
 *   length: 0.35,
 *   width: 0.2
 * });
 * ```
 */
export class StealthTip extends ArrowTip {
  private _backAngle: number;

  constructor(options: ArrowTipOptions & { backAngle?: number } = {}) {
    super({ ...options, fillOpacity: options.fillOpacity ?? 1 });
    // Back angle determines how deep the notch is (0 = flat, 0.5 = half length)
    this._backAngle = options.backAngle ?? 0.3;
    this._generatePoints();
  }

  protected _generatePoints(): void {
    const [px, py, pz] = this._position;
    const [dx, dy, dz] = this._direction;
    const [perpX, perpY, perpZ] = getPerpendicular(this._direction);

    // Base position (back of the tip)
    const baseX = px - dx * this._length;
    const baseY = py - dy * this._length;
    const baseZ = pz - dz * this._length;

    // Left and right corners (swept back)
    const leftX = baseX + perpX * this._width;
    const leftY = baseY + perpY * this._width;
    const leftZ = baseZ + perpZ * this._width;

    const rightX = baseX - perpX * this._width;
    const rightY = baseY - perpY * this._width;
    const rightZ = baseZ - perpZ * this._width;

    // Notch in the back (creates the stealth look)
    const notchDepth = this._length * this._backAngle;
    const notchX = baseX + dx * notchDepth;
    const notchY = baseY + dy * notchDepth;
    const notchZ = baseZ + dz * notchDepth;

    const points: number[][] = [];

    // Helper to add a line segment as cubic Bezier
    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const ldx = p1[0] - p0[0];
      const ldy = p1[1] - p0[1];
      const ldz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + ldx / 3, p0[1] + ldy / 3, p0[2] + ldz / 3]);
      points.push([p0[0] + (2 * ldx) / 3, p0[1] + (2 * ldy) / 3, p0[2] + (2 * ldz) / 3]);
      points.push([...p1]);
    };

    // Stealth shape: point -> right -> notch -> left -> point
    addLineSegment([px, py, pz], [rightX, rightY, rightZ], true);
    addLineSegment([rightX, rightY, rightZ], [notchX, notchY, notchZ], false);
    addLineSegment([notchX, notchY, notchZ], [leftX, leftY, leftZ], false);
    addLineSegment([leftX, leftY, leftZ], [px, py, pz], false);

    this.setPoints3D(points);
  }

  /**
   * Get the back angle (notch depth ratio)
   */
  getBackAngle(): number {
    return this._backAngle;
  }

  /**
   * Set the back angle (notch depth ratio, 0-1)
   */
  setBackAngle(value: number): this {
    this._backAngle = Math.max(0, Math.min(1, value));
    this._generatePoints();
    return this;
  }

  protected override _createCopy(): StealthTip {
    return new StealthTip({
      length: this._length,
      width: this._width,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
      position: this._position,
      direction: this._direction,
      backAngle: this._backAngle,
    });
  }
}

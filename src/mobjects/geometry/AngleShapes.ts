import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';
import { Line } from './Line';

/**
 * Options for creating an Angle
 */
export interface AngleOptions {
  /** Radius of the angle arc. Default: 0.5 */
  radius?: number;
  /** Quadrant for angle indicator (1, 2, 3, or 4). Default: auto-detect */
  quadrant?: 1 | 2 | 3 | 4;
  /** Show the angle value as a label. Default: false */
  showValue?: boolean;
  /** Stroke color. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
  /** Number of decimal places for angle value display. Default: 2 */
  decimalPlaces?: number;
  /** Display unit for angle. Default: 'radians' */
  unit?: 'radians' | 'degrees';
  /** Other lines (for double/triple angle indicators). Default: undefined */
  otherAngle?: Angle;
}

/**
 * Input for Angle constructor - either two Lines or three points
 */
export type AngleInput =
  | { line1: Line; line2: Line }
  | { points: [Vector3Tuple, Vector3Tuple, Vector3Tuple] };

/**
 * Angle - Angle indicator between two lines
 *
 * Creates an arc to indicate the angle between two lines or
 * three points (vertex at the second point).
 *
 * @example
 * ```typescript
 * // Using two lines
 * const line1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
 * const line2 = new Line({ start: [0, 0, 0], end: [1, 1, 0] });
 * const angle = new Angle({ line1, line2 }, { radius: 0.5 });
 *
 * // Using three points (vertex at middle point)
 * const angle2 = new Angle(
 *   { points: [[2, 0, 0], [0, 0, 0], [1, 1, 0]] },
 *   { showValue: true }
 * );
 * ```
 */
export class Angle extends VMobject {
  private _vertex: Vector3Tuple;
  private _startAngle: number;
  private _angleValue: number;
  private _radius: number;
  private _label: string | null = null;
  private _showValue: boolean;
  private _decimalPlaces: number;
  private _unit: 'radians' | 'degrees';

  constructor(input: AngleInput, options: AngleOptions = {}) {
    super();

    const {
      radius = 0.5,
      quadrant,
      showValue = false,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      decimalPlaces = 2,
      unit = 'radians',
    } = options;

    this._radius = radius;
    this._showValue = showValue;
    this._decimalPlaces = decimalPlaces;
    this._unit = unit;
    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    // Extract points from input
    let point1: Vector3Tuple;
    let vertex: Vector3Tuple;
    let point2: Vector3Tuple;

    if ('line1' in input && 'line2' in input) {
      // Two lines - find intersection point (vertex)
      const line1Start = input.line1.getStart();
      const line1End = input.line1.getEnd();
      const line2Start = input.line2.getStart();
      const line2End = input.line2.getEnd();

      // Find the best vertex (closest intersection point)
      const d1 = this._distance(line1Start, line2Start);
      const d2 = this._distance(line1Start, line2End);
      const d3 = this._distance(line1End, line2Start);
      const d4 = this._distance(line1End, line2End);

      const minDist = Math.min(d1, d2, d3, d4);

      if (minDist === d1) {
        vertex = line1Start;
        point1 = line1End;
        point2 = line2End;
      } else if (minDist === d2) {
        vertex = line1Start;
        point1 = line1End;
        point2 = line2Start;
      } else if (minDist === d3) {
        vertex = line1End;
        point1 = line1Start;
        point2 = line2End;
      } else {
        vertex = line1End;
        point1 = line1Start;
        point2 = line2Start;
      }
    } else {
      // Three points - vertex is the middle point
      [point1, vertex, point2] = input.points;
    }

    this._vertex = [...vertex];

    // Calculate angles from vertex to each point
    const angle1 = Math.atan2(point1[1] - vertex[1], point1[0] - vertex[0]);
    const angle2 = Math.atan2(point2[1] - vertex[1], point2[0] - vertex[0]);

    // Determine the angle span
    let deltaAngle = angle2 - angle1;

    // Handle quadrant selection
    if (quadrant !== undefined) {
      // Adjust angle based on quadrant preference
      const adjustedAngle = this._adjustForQuadrant(angle1, deltaAngle, quadrant);
      this._startAngle = adjustedAngle.start;
      this._angleValue = adjustedAngle.delta;
    } else {
      // Auto-detect: use smaller angle
      if (deltaAngle > Math.PI) {
        deltaAngle -= 2 * Math.PI;
      } else if (deltaAngle < -Math.PI) {
        deltaAngle += 2 * Math.PI;
      }

      // Prefer positive angles
      if (deltaAngle < 0) {
        this._startAngle = angle2;
        this._angleValue = -deltaAngle;
      } else {
        this._startAngle = angle1;
        this._angleValue = deltaAngle;
      }
    }

    this._generatePoints();
  }

  private _distance(p1: Vector3Tuple, p2: Vector3Tuple): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private _adjustForQuadrant(startAngle: number, deltaAngle: number, quadrant: 1 | 2 | 3 | 4): { start: number; delta: number } {
    // Quadrant adjustments for angle direction
    switch (quadrant) {
      case 1:
        // First quadrant: ensure angle goes counter-clockwise
        if (deltaAngle < 0) {
          return { start: startAngle + deltaAngle, delta: -deltaAngle };
        }
        return { start: startAngle, delta: deltaAngle };
      case 2:
        // Second quadrant
        if (deltaAngle > 0) {
          return { start: startAngle, delta: deltaAngle - 2 * Math.PI };
        }
        return { start: startAngle, delta: deltaAngle };
      case 3:
        // Third quadrant
        if (deltaAngle > 0) {
          return { start: startAngle + deltaAngle, delta: 2 * Math.PI - deltaAngle };
        }
        return { start: startAngle, delta: deltaAngle };
      case 4:
        // Fourth quadrant
        if (deltaAngle < 0) {
          return { start: startAngle, delta: deltaAngle + 2 * Math.PI };
        }
        return { start: startAngle, delta: deltaAngle };
      default:
        return { start: startAngle, delta: deltaAngle };
    }
  }

  private _generatePoints(): void {
    // Create arc points using Arc's algorithm
    const points: number[][] = [];
    const [cx, cy, cz] = this._vertex;
    const r = this._radius;

    const totalAngle = this._angleValue;
    const numSegments = Math.max(1, Math.ceil(Math.abs(totalAngle) / (Math.PI / 2) * 2));
    const segmentAngle = totalAngle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = this._startAngle + i * segmentAngle;
      const theta2 = this._startAngle + (i + 1) * segmentAngle;

      const x0 = cx + r * Math.cos(theta1);
      const y0 = cy + r * Math.sin(theta1);
      const x3 = cx + r * Math.cos(theta2);
      const y3 = cy + r * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * r * dx1;
      const y1 = y0 + kappa * r * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * r * dx2;
      const y2 = y3 - kappa * r * dy2;

      if (i === 0) {
        points.push([x0, y0, cz]);
      }
      points.push([x1, y1, cz]);
      points.push([x2, y2, cz]);
      points.push([x3, y3, cz]);
    }

    this.setPoints3D(points);
  }

  /**
   * Get the angle value in radians
   */
  getAngleValue(): number {
    return Math.abs(this._angleValue);
  }

  /**
   * Get the angle value in degrees
   */
  getAngleValueDegrees(): number {
    return Math.abs(this._angleValue) * (180 / Math.PI);
  }

  /**
   * Get the vertex point
   */
  getVertex(): Vector3Tuple {
    return [...this._vertex];
  }

  /**
   * Get the radius of the angle arc
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius of the angle arc
   */
  setRadius(radius: number): this {
    this._radius = radius;
    this._generatePoints();
    return this;
  }

  /**
   * Get the label for this angle
   */
  getLabel(): string | null {
    if (this._showValue) {
      const value = this._unit === 'degrees'
        ? this.getAngleValueDegrees()
        : this.getAngleValue();
      return value.toFixed(this._decimalPlaces) + (this._unit === 'degrees' ? '\u00B0' : '');
    }
    return this._label;
  }

  /**
   * Set a custom label for this angle
   */
  setLabel(label: string): this {
    this._label = label;
    return this;
  }

  /**
   * Get the midpoint of the angle arc (useful for label positioning)
   */
  getArcMidpoint(): Vector3Tuple {
    const midAngle = this._startAngle + this._angleValue / 2;
    return [
      this._vertex[0] + this._radius * Math.cos(midAngle),
      this._vertex[1] + this._radius * Math.sin(midAngle),
      this._vertex[2],
    ];
  }

  protected override _createCopy(): Angle {
    // Create a simple copy by recreating with three points
    const startAngle = this._startAngle;
    const endAngle = this._startAngle + this._angleValue;

    const point1: Vector3Tuple = [
      this._vertex[0] + Math.cos(startAngle),
      this._vertex[1] + Math.sin(startAngle),
      this._vertex[2],
    ];
    const point2: Vector3Tuple = [
      this._vertex[0] + Math.cos(endAngle),
      this._vertex[1] + Math.sin(endAngle),
      this._vertex[2],
    ];

    const angle = new Angle(
      { points: [point1, this._vertex, point2] },
      {
        radius: this._radius,
        showValue: this._showValue,
        color: this.color,
        strokeWidth: this.strokeWidth,
        decimalPlaces: this._decimalPlaces,
        unit: this._unit,
      }
    );
    angle._label = this._label;
    return angle;
  }
}

/**
 * Options for creating a RightAngle
 */
export interface RightAngleOptions {
  /** Size of the square indicator. Default: 0.3 */
  size?: number;
  /** Stroke color. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
}

/**
 * RightAngle - 90 degree angle indicator (square corner)
 *
 * Creates a square marker to indicate a right angle between two lines
 * or three points.
 *
 * @example
 * ```typescript
 * // Using two perpendicular lines
 * const line1 = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
 * const line2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });
 * const rightAngle = new RightAngle({ line1, line2 });
 *
 * // Using three points
 * const rightAngle2 = new RightAngle(
 *   { points: [[2, 0, 0], [0, 0, 0], [0, 2, 0]] },
 *   { size: 0.4 }
 * );
 * ```
 */
export class RightAngle extends VMobject {
  private _vertex: Vector3Tuple;
  private _size: number;
  private _angle1: number;
  private _angle2: number;

  constructor(input: AngleInput, options: RightAngleOptions = {}) {
    super();

    const {
      size = 0.3,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    this._size = size;
    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    // Extract points from input (same logic as Angle)
    let point1: Vector3Tuple;
    let vertex: Vector3Tuple;
    let point2: Vector3Tuple;

    if ('line1' in input && 'line2' in input) {
      const line1Start = input.line1.getStart();
      const line1End = input.line1.getEnd();
      const line2Start = input.line2.getStart();
      const line2End = input.line2.getEnd();

      const d1 = this._distance(line1Start, line2Start);
      const d2 = this._distance(line1Start, line2End);
      const d3 = this._distance(line1End, line2Start);
      const d4 = this._distance(line1End, line2End);

      const minDist = Math.min(d1, d2, d3, d4);

      if (minDist === d1) {
        vertex = line1Start;
        point1 = line1End;
        point2 = line2End;
      } else if (minDist === d2) {
        vertex = line1Start;
        point1 = line1End;
        point2 = line2Start;
      } else if (minDist === d3) {
        vertex = line1End;
        point1 = line1Start;
        point2 = line2End;
      } else {
        vertex = line1End;
        point1 = line1Start;
        point2 = line2Start;
      }
    } else {
      [point1, vertex, point2] = input.points;
    }

    this._vertex = [...vertex];
    this._angle1 = Math.atan2(point1[1] - vertex[1], point1[0] - vertex[0]);
    this._angle2 = Math.atan2(point2[1] - vertex[1], point2[0] - vertex[0]);

    this._generatePoints();
  }

  private _distance(p1: Vector3Tuple, p2: Vector3Tuple): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private _generatePoints(): void {
    const [vx, vy, vz] = this._vertex;
    const s = this._size;

    // Calculate the two corner points along each line direction
    const corner1: Vector3Tuple = [
      vx + s * Math.cos(this._angle1),
      vy + s * Math.sin(this._angle1),
      vz,
    ];
    const corner2: Vector3Tuple = [
      vx + s * Math.cos(this._angle2),
      vy + s * Math.sin(this._angle2),
      vz,
    ];

    // Calculate the outer corner of the square
    const outerCorner: Vector3Tuple = [
      vx + s * Math.cos(this._angle1) + s * Math.cos(this._angle2),
      vy + s * Math.sin(this._angle1) + s * Math.sin(this._angle2),
      vz,
    ];

    // Create L-shaped path: corner1 -> outerCorner -> corner2
    const points: number[][] = [];

    // Line from corner1 to outerCorner
    this._addLinePoints(points, corner1, outerCorner);

    // Line from outerCorner to corner2
    this._addLinePoints(points, outerCorner, corner2);

    this.setPoints3D(points);
  }

  private _addLinePoints(points: number[][], start: Vector3Tuple, end: Vector3Tuple): void {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    if (points.length === 0) {
      points.push([...start]);
    }

    // Control points at 1/3 and 2/3 for straight line
    points.push([start[0] + dx / 3, start[1] + dy / 3, start[2] + dz / 3]);
    points.push([start[0] + 2 * dx / 3, start[1] + 2 * dy / 3, start[2] + 2 * dz / 3]);
    points.push([...end]);
  }

  /**
   * Get the size of the right angle indicator
   */
  getSize(): number {
    return this._size;
  }

  /**
   * Set the size of the right angle indicator
   */
  setSize(size: number): this {
    this._size = size;
    this._generatePoints();
    return this;
  }

  /**
   * Get the vertex point
   */
  getVertex(): Vector3Tuple {
    return [...this._vertex];
  }

  protected override _createCopy(): RightAngle {
    const point1: Vector3Tuple = [
      this._vertex[0] + Math.cos(this._angle1),
      this._vertex[1] + Math.sin(this._angle1),
      this._vertex[2],
    ];
    const point2: Vector3Tuple = [
      this._vertex[0] + Math.cos(this._angle2),
      this._vertex[1] + Math.sin(this._angle2),
      this._vertex[2],
    ];

    return new RightAngle(
      { points: [point1, this._vertex, point2] },
      {
        size: this._size,
        color: this.color,
        strokeWidth: this.strokeWidth,
      }
    );
  }
}

/**
 * Options for creating an Elbow
 */
export interface ElbowOptions {
  /** Width of the elbow (horizontal extent). Default: 1 */
  width?: number;
  /** Height of the elbow (vertical extent). Default: 1 */
  height?: number;
  /** Rotation angle in radians. Default: 0 */
  angle?: number;
  /** Stroke color. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
  /** Position of the corner/vertex. Default: [0, 0, 0] */
  position?: Vector3Tuple;
}

/**
 * Elbow - L-shaped line
 *
 * Creates an L-shaped path useful for indicating connections,
 * orthogonal paths, or decorative elements.
 *
 * @example
 * ```typescript
 * // Create a basic L-shape
 * const elbow = new Elbow();
 *
 * // Create a rotated elbow
 * const rotatedElbow = new Elbow({
 *   width: 2,
 *   height: 1,
 *   angle: Math.PI / 4,
 *   color: '#ff0000'
 * });
 * ```
 */
export class Elbow extends VMobject {
  private _width: number;
  private _height: number;
  private _angle: number;
  private _cornerPosition: Vector3Tuple;

  constructor(options: ElbowOptions = {}) {
    super();

    const {
      width = 1,
      height = 1,
      angle = 0,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      position = [0, 0, 0],
    } = options;

    this._width = width;
    this._height = height;
    this._angle = angle;
    this._cornerPosition = [...position];
    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  private _generatePoints(): void {
    const [cx, cy, cz] = this._cornerPosition;
    const cos = Math.cos(this._angle);
    const sin = Math.sin(this._angle);

    // Calculate the three points of the L-shape
    // Start point is at (-width, 0) rotated
    const start: Vector3Tuple = [
      cx + (-this._width) * cos,
      cy + (-this._width) * sin,
      cz,
    ];

    // Corner is at (0, 0) which is the position
    const corner: Vector3Tuple = [cx, cy, cz];

    // End point is at (0, height) rotated
    const end: Vector3Tuple = [
      cx + (-this._height) * sin,
      cy + this._height * cos,
      cz,
    ];

    const points: number[][] = [];

    // First segment: start to corner
    this._addLinePoints(points, start, corner);

    // Second segment: corner to end
    this._addLinePoints(points, corner, end);

    this.setPoints3D(points);
  }

  private _addLinePoints(points: number[][], start: Vector3Tuple, end: Vector3Tuple): void {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    if (points.length === 0) {
      points.push([...start]);
    }

    points.push([start[0] + dx / 3, start[1] + dy / 3, start[2] + dz / 3]);
    points.push([start[0] + 2 * dx / 3, start[1] + 2 * dy / 3, start[2] + 2 * dz / 3]);
    points.push([...end]);
  }

  /**
   * Get the width of the elbow
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Set the width of the elbow
   */
  setWidth(width: number): this {
    this._width = width;
    this._generatePoints();
    return this;
  }

  /**
   * Get the height of the elbow
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the height of the elbow
   */
  setHeight(height: number): this {
    this._height = height;
    this._generatePoints();
    return this;
  }

  /**
   * Get the rotation angle of the elbow
   */
  getAngle(): number {
    return this._angle;
  }

  /**
   * Set the rotation angle of the elbow
   */
  setAngle(angle: number): this {
    this._angle = angle;
    this._generatePoints();
    return this;
  }

  /**
   * Get the corner position
   */
  getCornerPosition(): Vector3Tuple {
    return [...this._cornerPosition];
  }

  /**
   * Set the corner position
   */
  setCornerPosition(position: Vector3Tuple): this {
    this._cornerPosition = [...position];
    this._generatePoints();
    return this;
  }

  protected override _createCopy(): Elbow {
    return new Elbow({
      width: this._width,
      height: this._height,
      angle: this._angle,
      color: this.color,
      strokeWidth: this.strokeWidth,
      position: this._cornerPosition,
    });
  }
}

/**
 * Options for creating a TangentLine
 */
export interface TangentLineOptions {
  /** Parameter t (0-1) for where to place the tangent on the curve. Default: 0.5 */
  t?: number;
  /** Length of the tangent line. Default: 2 */
  length?: number;
  /** Stroke color. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
  /** Small offset for numerical derivative calculation. Default: 0.001 */
  dT?: number;
}

/**
 * TangentLine - Tangent line to a curve at a specific point
 *
 * Creates a line tangent to a VMobject at the given parameter t (0-1).
 * The tangent direction is computed numerically from the curve's points.
 *
 * @example
 * ```typescript
 * // Create a tangent line to a circle at t=0.25
 * const circle = new Circle({ radius: 2 });
 * const tangent = new TangentLine(circle, { t: 0.25, length: 3 });
 *
 * // Tangent to a parametric function
 * const curve = new ParametricFunction({
 *   function: (t) => [Math.cos(t * Math.PI), Math.sin(t * Math.PI), 0],
 *   range: [0, 1]
 * });
 * const curveTangent = new TangentLine(curve, { t: 0.5 });
 * ```
 */
export class TangentLine extends VMobject {
  private _vmobject: VMobject;
  private _t: number;
  private _length: number;
  private _dT: number;
  private _tangentPoint: Vector3Tuple;
  private _tangentDirection: Vector3Tuple;

  constructor(vmobject: VMobject, options: TangentLineOptions = {}) {
    super();

    const {
      t = 0.5,
      length = 2,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      dT = 0.001,
    } = options;

    this._vmobject = vmobject;
    this._t = Math.max(0, Math.min(1, t));
    this._length = length;
    this._dT = dT;
    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    // Initialize with default values (will be computed in _generatePoints)
    this._tangentPoint = [0, 0, 0];
    this._tangentDirection = [1, 0, 0];

    this._generatePoints();
  }

  private _generatePoints(): void {
    const points3D = this._vmobject.getPoints();
    if (points3D.length < 2) {
      // Fallback: create a simple horizontal line
      this._tangentPoint = [0, 0, 0];
      this._tangentDirection = [1, 0, 0];
      this._createLinePoints();
      return;
    }

    // Get the point on the curve at parameter t
    this._tangentPoint = this._getPointAtT(this._t, points3D);

    // Calculate tangent direction using numerical derivative
    const t1 = Math.max(0, this._t - this._dT);
    const t2 = Math.min(1, this._t + this._dT);

    const p1 = this._getPointAtT(t1, points3D);
    const p2 = this._getPointAtT(t2, points3D);

    // Direction vector
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (len > 0) {
      this._tangentDirection = [dx / len, dy / len, dz / len];
    } else {
      this._tangentDirection = [1, 0, 0];
    }

    this._createLinePoints();
  }

  private _getPointAtT(t: number, points: number[][]): Vector3Tuple {
    // The points are stored as cubic Bezier control points
    // Structure: [anchor, handle, handle, anchor, handle, handle, anchor, ...]
    // Each segment has 4 points, consecutive segments share anchor

    const numPoints = points.length;
    if (numPoints < 4) {
      // Not enough points for a Bezier curve, interpolate linearly
      const index = Math.floor(t * (numPoints - 1));
      const frac = t * (numPoints - 1) - index;

      if (index >= numPoints - 1) {
        return [points[numPoints - 1][0], points[numPoints - 1][1], points[numPoints - 1][2]];
      }

      const p1 = points[index];
      const p2 = points[index + 1];
      return [
        p1[0] + (p2[0] - p1[0]) * frac,
        p1[1] + (p2[1] - p1[1]) * frac,
        p1[2] + (p2[2] - p1[2]) * frac,
      ];
    }

    // Calculate number of Bezier segments
    const numSegments = Math.floor((numPoints - 1) / 3);
    if (numSegments === 0) {
      return [points[0][0], points[0][1], points[0][2]];
    }

    // Find which segment and local t
    const scaledT = t * numSegments;
    const segmentIndex = Math.min(Math.floor(scaledT), numSegments - 1);
    const localT = scaledT - segmentIndex;

    // Get the 4 control points for this segment
    const baseIndex = segmentIndex * 3;
    const p0 = points[baseIndex];
    const p1 = points[baseIndex + 1];
    const p2 = points[baseIndex + 2];
    const p3 = points[baseIndex + 3];

    // Evaluate cubic Bezier at localT
    return this._evaluateBezierPoint(p0, p1, p2, p3, localT);
  }

  private _evaluateBezierPoint(p0: number[], p1: number[], p2: number[], p3: number[], t: number): Vector3Tuple {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return [
      mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
      mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
      mt3 * p0[2] + 3 * mt2 * t * p1[2] + 3 * mt * t2 * p2[2] + t3 * p3[2],
    ];
  }

  private _createLinePoints(): void {
    const halfLength = this._length / 2;

    const start: Vector3Tuple = [
      this._tangentPoint[0] - halfLength * this._tangentDirection[0],
      this._tangentPoint[1] - halfLength * this._tangentDirection[1],
      this._tangentPoint[2] - halfLength * this._tangentDirection[2],
    ];

    const end: Vector3Tuple = [
      this._tangentPoint[0] + halfLength * this._tangentDirection[0],
      this._tangentPoint[1] + halfLength * this._tangentDirection[1],
      this._tangentPoint[2] + halfLength * this._tangentDirection[2],
    ];

    // Create line as degenerate cubic Bezier
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    this.setPoints3D([
      [...start],
      [start[0] + dx / 3, start[1] + dy / 3, start[2] + dz / 3],
      [start[0] + 2 * dx / 3, start[1] + 2 * dy / 3, start[2] + 2 * dz / 3],
      [...end],
    ]);
  }

  /**
   * Get the parameter t
   */
  getT(): number {
    return this._t;
  }

  /**
   * Set the parameter t and regenerate the tangent
   */
  setT(t: number): this {
    this._t = Math.max(0, Math.min(1, t));
    this._generatePoints();
    return this;
  }

  /**
   * Get the length of the tangent line
   */
  getLength(): number {
    return this._length;
  }

  /**
   * Set the length of the tangent line
   */
  setLength(length: number): this {
    this._length = length;
    this._generatePoints();
    return this;
  }

  /**
   * Get the point where the tangent touches the curve
   */
  getTangentPoint(): Vector3Tuple {
    return [...this._tangentPoint];
  }

  /**
   * Get the tangent direction (unit vector)
   */
  getTangentDirection(): Vector3Tuple {
    return [...this._tangentDirection];
  }

  /**
   * Get the start point of the tangent line
   */
  getStart(): Vector3Tuple {
    const halfLength = this._length / 2;
    return [
      this._tangentPoint[0] - halfLength * this._tangentDirection[0],
      this._tangentPoint[1] - halfLength * this._tangentDirection[1],
      this._tangentPoint[2] - halfLength * this._tangentDirection[2],
    ];
  }

  /**
   * Get the end point of the tangent line
   */
  getEnd(): Vector3Tuple {
    const halfLength = this._length / 2;
    return [
      this._tangentPoint[0] + halfLength * this._tangentDirection[0],
      this._tangentPoint[1] + halfLength * this._tangentDirection[1],
      this._tangentPoint[2] + halfLength * this._tangentDirection[2],
    ];
  }

  /**
   * Update the tangent for a new position on the curve
   * Call this if the underlying VMobject has changed
   */
  update(): this {
    this._generatePoints();
    return this;
  }

  protected override _createCopy(): TangentLine {
    return new TangentLine(this._vmobject, {
      t: this._t,
      length: this._length,
      color: this.color,
      strokeWidth: this.strokeWidth,
      dT: this._dT,
    });
  }
}

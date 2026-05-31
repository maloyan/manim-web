import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a CurvedArrow
 */
export interface CurvedArrowOptions {
  /** Start point of the arrow. Default: [-1, 0, 0] */
  startPoint?: Vector3Tuple;
  /** End point of the arrow. Default: [1, 0, 0] */
  endPoint?: Vector3Tuple;
  /** Arc angle in radians. Default: PI/4 */
  angle?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Length of the arrowhead tip. Default: 0.25 */
  tipLength?: number;
  /** Width of the arrowhead base. Default: 0.15 */
  tipWidth?: number;
  /** Number of Bezier segments for approximation. Default: 8 */
  numComponents?: number;
}

/**
 * CurvedArrow - An arrow that follows an arc path
 *
 * Creates an arrow that curves from start to end point.
 *
 * @example
 * ```typescript
 * // Create a curved arrow
 * const curvedArrow = new CurvedArrow({
 *   startPoint: [-2, 0, 0],
 *   endPoint: [2, 0, 0],
 *   angle: Math.PI / 3
 * });
 *
 * // Create an arrow curving the other way
 * const otherWay = new CurvedArrow({
 *   startPoint: [0, -1, 0],
 *   endPoint: [0, 1, 0],
 *   angle: -Math.PI / 4
 * });
 * ```
 */
export class CurvedArrow extends VMobject {
  private _startPoint: Vector3Tuple;
  private _endPoint: Vector3Tuple;
  private _angle: number;
  private _tipLength: number;
  private _tipWidth: number;
  private _numComponents: number;

  constructor(options: CurvedArrowOptions = {}) {
    super();

    const {
      startPoint = [-1, 0, 0],
      endPoint = [1, 0, 0],
      angle = Math.PI / 4,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      tipLength = 0.25,
      tipWidth = 0.15,
      numComponents = 8,
    } = options;

    this._startPoint = [...startPoint];
    this._endPoint = [...endPoint];
    this._angle = angle;
    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._numComponents = numComponents;

    this.color = color;
    this.fillOpacity = 1; // Fill the arrowhead
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curved arrow points.
   */
  private _generatePoints(): void {
    const points: number[][] = [];

    // Calculate arc parameters
    const start = this._startPoint;
    const end = this._endPoint;
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    const chordX = end[0] - start[0];
    const chordY = end[1] - start[1];
    const halfChord = Math.sqrt(chordX * chordX + chordY * chordY) / 2;

    if (halfChord < 1e-10) {
      this.setPoints([]);
      return;
    }

    const halfAngle = Math.abs(this._angle) / 2;
    const radius = halfChord / Math.sin(halfAngle);
    const distToCenter = radius * Math.cos(halfAngle);

    const chordLength = 2 * halfChord;
    let perpX = -chordY / chordLength;
    let perpY = chordX / chordLength;

    if (this._angle > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const centerX = midX + distToCenter * perpX;
    const centerY = midY + distToCenter * perpY;
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    // Calculate where to end the arc (before the tip)
    // We need to find the point on the arc that is tipLength away from the end
    const arcLength = Math.abs(radius * this._angle);
    const shortenedArcLength = arcLength - this._tipLength;
    const shortenedAngle = (this._angle > 0 ? 1 : -1) * (shortenedArcLength / radius);

    // Generate arc points for the shaft
    const numSegments = Math.max(
      1,
      Math.ceil((Math.abs(shortenedAngle) / (Math.PI / 2)) * (this._numComponents / 4)),
    );
    const segmentAngle = shortenedAngle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = startAngle + i * segmentAngle;
      const theta2 = startAngle + (i + 1) * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * radius * dx1;
      const y1 = y0 + kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * radius * dx2;
      const y2 = y3 - kappa * radius * dy2;

      if (i === 0) {
        points.push([x0, y0, midZ]);
      }
      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    // Calculate tip base position (where the shaft ends)
    const tipBaseAngle = startAngle + shortenedAngle;
    const tipBaseX = centerX + radius * Math.cos(tipBaseAngle);
    const tipBaseY = centerY + radius * Math.sin(tipBaseAngle);

    // Direction at the tip (tangent to the arc)
    const endAngleOnArc = startAngle + this._angle;
    const dirX = this._angle > 0 ? -Math.sin(endAngleOnArc) : Math.sin(endAngleOnArc);
    const dirY = this._angle > 0 ? Math.cos(endAngleOnArc) : -Math.cos(endAngleOnArc);
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
    const normDirX = dirX / dirLen;
    const normDirY = dirY / dirLen;

    // Perpendicular to direction
    const tipPerpX = -normDirY;
    const tipPerpY = normDirX;

    // Tip corners
    const tipLeftX = tipBaseX + tipPerpX * this._tipWidth;
    const tipLeftY = tipBaseY + tipPerpY * this._tipWidth;
    const tipRightX = tipBaseX - tipPerpX * this._tipWidth;
    const tipRightY = tipBaseY - tipPerpY * this._tipWidth;

    // Add arrowhead as line segments
    const addLineSegment = (p0: number[], p1: number[]) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, p0[2] + (2 * dz) / 3]);
      points.push([...p1]);
    };

    // Tip: tipBase -> tipLeft -> end -> tipRight -> tipBase
    addLineSegment([tipBaseX, tipBaseY, midZ], [tipLeftX, tipLeftY, midZ]);
    addLineSegment([tipLeftX, tipLeftY, midZ], [end[0], end[1], midZ]);
    addLineSegment([end[0], end[1], midZ], [tipRightX, tipRightY, midZ]);
    addLineSegment([tipRightX, tipRightY, midZ], [tipBaseX, tipBaseY, midZ]);

    this.setPoints3D(points);
  }

  /**
   * Get the start point
   */
  getStartPoint(): Vector3Tuple {
    return [...this._startPoint];
  }

  /**
   * Set the start point
   */
  setStartPoint(point: Vector3Tuple): this {
    this._startPoint = [...point];
    this._generatePoints();
    return this;
  }

  /**
   * Get the end point
   */
  getEndPoint(): Vector3Tuple {
    return [...this._endPoint];
  }

  /**
   * Set the end point
   */
  setEndPoint(point: Vector3Tuple): this {
    this._endPoint = [...point];
    this._generatePoints();
    return this;
  }

  /**
   * Get the arc angle
   */
  getAngle(): number {
    return this._angle;
  }

  /**
   * Set the arc angle
   */
  setAngle(value: number): this {
    this._angle = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the tip length
   */
  getTipLength(): number {
    return this._tipLength;
  }

  /**
   * Get the tip width
   */
  getTipWidth(): number {
    return this._tipWidth;
  }

  /**
   * Create a copy of this CurvedArrow
   */
  override copy(): CurvedArrow {
    this.normalizeTransform();
    const clone = new CurvedArrow({
      startPoint: this._startPoint,
      endPoint: this._endPoint,
      angle: this._angle,
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      numComponents: this._numComponents,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, false);
    return clone;
  }
}

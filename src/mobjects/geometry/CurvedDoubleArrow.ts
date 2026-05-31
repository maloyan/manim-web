import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';
import { CurvedArrowOptions } from './CurvedArrow';

/**
 * CurvedDoubleArrow - A double arrow that follows an arc path
 *
 * Creates a double-headed arrow that curves from start to end point.
 *
 * @example
 * ```typescript
 * // Create a curved double arrow
 * const curvedDouble = new CurvedDoubleArrow({
 *   startPoint: [-2, 0, 0],
 *   endPoint: [2, 0, 0],
 *   angle: Math.PI / 3
 * });
 * ```
 */
export class CurvedDoubleArrow extends VMobject {
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
    this.fillOpacity = 1;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curved double arrow points.
   */
  private _generatePoints(): void {
    const points: number[][] = [];

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

    // Calculate shortened angles for both ends
    const shortenedAngleFromStart = (this._angle > 0 ? 1 : -1) * (this._tipLength / radius);
    const shortenedAngleFromEnd = (this._angle > 0 ? -1 : 1) * (this._tipLength / radius);

    const actualStartAngle = startAngle + shortenedAngleFromStart;
    const actualEndAngle = startAngle + this._angle + shortenedAngleFromEnd;
    const actualArcAngle = actualEndAngle - actualStartAngle;

    // Start tip
    const startTipBaseX = centerX + radius * Math.cos(actualStartAngle);
    const startTipBaseY = centerY + radius * Math.sin(actualStartAngle);

    // Direction at start (tangent to arc, pointing away from start)
    const startDirX = this._angle > 0 ? Math.sin(startAngle) : -Math.sin(startAngle);
    const startDirY = this._angle > 0 ? -Math.cos(startAngle) : Math.cos(startAngle);
    const startDirLen = Math.sqrt(startDirX * startDirX + startDirY * startDirY);
    const normStartDirX = startDirX / startDirLen;
    const normStartDirY = startDirY / startDirLen;

    const startPerpX = -normStartDirY;
    const startPerpY = normStartDirX;

    const startTipLeftX = startTipBaseX + startPerpX * this._tipWidth;
    const startTipLeftY = startTipBaseY + startPerpY * this._tipWidth;
    const startTipRightX = startTipBaseX - startPerpX * this._tipWidth;
    const startTipRightY = startTipBaseY - startPerpY * this._tipWidth;

    // Helper to add line segment
    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, p0[2] + (2 * dz) / 3]);
      points.push([...p1]);
    };

    // Start tip
    addLineSegment([start[0], start[1], midZ], [startTipLeftX, startTipLeftY, midZ], true);
    addLineSegment(
      [startTipLeftX, startTipLeftY, midZ],
      [startTipBaseX, startTipBaseY, midZ],
      false,
    );

    // Arc shaft
    const numSegments = Math.max(
      1,
      Math.ceil((Math.abs(actualArcAngle) / (Math.PI / 2)) * (this._numComponents / 4)),
    );
    const segmentAngle = actualArcAngle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = actualStartAngle + i * segmentAngle;
      const theta2 = actualStartAngle + (i + 1) * segmentAngle;

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

      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    // End tip
    const endTipBaseX = centerX + radius * Math.cos(actualEndAngle);
    const endTipBaseY = centerY + radius * Math.sin(actualEndAngle);

    const endAngleOnArc = startAngle + this._angle;
    const endDirX = this._angle > 0 ? -Math.sin(endAngleOnArc) : Math.sin(endAngleOnArc);
    const endDirY = this._angle > 0 ? Math.cos(endAngleOnArc) : -Math.cos(endAngleOnArc);
    const endDirLen = Math.sqrt(endDirX * endDirX + endDirY * endDirY);
    const normEndDirX = endDirX / endDirLen;
    const normEndDirY = endDirY / endDirLen;

    const endPerpX = -normEndDirY;
    const endPerpY = normEndDirX;

    const endTipLeftX = endTipBaseX + endPerpX * this._tipWidth;
    const endTipLeftY = endTipBaseY + endPerpY * this._tipWidth;
    const endTipRightX = endTipBaseX - endPerpX * this._tipWidth;
    const endTipRightY = endTipBaseY - endPerpY * this._tipWidth;

    addLineSegment([endTipBaseX, endTipBaseY, midZ], [endTipLeftX, endTipLeftY, midZ], false);
    addLineSegment([endTipLeftX, endTipLeftY, midZ], [end[0], end[1], midZ], false);
    addLineSegment([end[0], end[1], midZ], [endTipRightX, endTipRightY, midZ], false);
    addLineSegment([endTipRightX, endTipRightY, midZ], [endTipBaseX, endTipBaseY, midZ], false);

    // Return along arc (reversed)
    for (let i = numSegments - 1; i >= 0; i--) {
      const theta1 = actualStartAngle + (i + 1) * segmentAngle;
      const theta2 = actualStartAngle + i * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 - kappa * radius * dx1;
      const y1 = y0 - kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 + kappa * radius * dx2;
      const y2 = y3 + kappa * radius * dy2;

      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    // Complete start tip
    addLineSegment(
      [startTipBaseX, startTipBaseY, midZ],
      [startTipRightX, startTipRightY, midZ],
      false,
    );
    addLineSegment([startTipRightX, startTipRightY, midZ], [start[0], start[1], midZ], false);

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
   * Create a copy of this CurvedDoubleArrow
   */
  override copy(): CurvedDoubleArrow {
    this.normalizeTransform();
    const clone = new CurvedDoubleArrow({
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

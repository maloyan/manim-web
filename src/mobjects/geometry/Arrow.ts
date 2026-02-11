import { Group } from '../../core/Group';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { WHITE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating an Arrow
 */
export interface ArrowOptions {
  /** Start point of the arrow. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point of the arrow (where the tip points). Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /** Stroke color as CSS color string. Default: WHITE (#FFFFFF) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Length of the arrowhead tip. Default: 0.25 */
  tipLength?: number;
  /** Width of the arrowhead base. Default: 0.15 */
  tipWidth?: number;
}

/**
 * ArrowShaft - The line part of an arrow (internal use)
 */
class ArrowShaft extends VMobject {
  constructor(start: number[], end: number[], color: string, strokeWidth: number) {
    super();
    this.color = color;
    this.strokeWidth = strokeWidth;
    this.fillOpacity = 0;

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

  protected _createCopy(): ArrowShaft {
    return new ArrowShaft([0, 0, 0], [1, 0, 0], this.color, this.strokeWidth);
  }
}

/**
 * ArrowTip - The triangular tip of an arrow (internal use)
 */
class ArrowTip extends VMobject {
  constructor(tipPoint: number[], tipLeft: number[], tipRight: number[], color: string) {
    super();
    this.color = color;
    this.fillOpacity = 1;
    this.strokeWidth = 0;

    const addLineSegment = (points: number[][], p0: number[], p1: number[], isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    const points: number[][] = [];
    addLineSegment(points, tipLeft, tipPoint, true);
    addLineSegment(points, tipPoint, tipRight, false);
    addLineSegment(points, tipRight, tipLeft, false);
    this.setPoints3D(points);
  }

  protected _createCopy(): ArrowTip {
    return new ArrowTip([0, 0, 0], [0, 0, 0], [0, 0, 0], this.color);
  }
}

/**
 * Arrow - A line with an arrowhead at the end
 *
 * Creates a line segment with a triangular arrowhead at the end point.
 * The arrow automatically calculates the tip orientation based on the line direction.
 *
 * @example
 * ```typescript
 * // Create a simple arrow
 * const arrow = new Arrow();
 *
 * // Create an arrow from point A to point B
 * const arrow2 = new Arrow({
 *   start: [-2, 0, 0],
 *   end: [2, 1, 0],
 *   color: '#ff0000'
 * });
 *
 * // Create an arrow with larger tip
 * const bigTip = new Arrow({ tipLength: 0.4, tipWidth: 0.25 });
 * ```
 */
export class Arrow extends Group {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;
  private _tipLength: number;
  private _tipWidth: number;
  private _strokeWidth: number;
  private _shaft: ArrowShaft | null = null;
  private _tip: ArrowTip | null = null;

  constructor(options: ArrowOptions = {}) {
    super();

    const {
      start = [0, 0, 0],
      end = [1, 0, 0],
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      tipLength = 0.25,
      tipWidth = 0.15,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._color = color;
    this._strokeWidth = strokeWidth;

    this._generateParts();
  }

  /**
   * Generate the arrow parts (shaft line + tip triangle)
   */
  private _generateParts(): void {
    this.clear();

    const [x0, y0, z0] = this._start;
    const [x1, y1, z1] = this._end;

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (length === 0) {
      return;
    }

    const dirX = dx / length;
    const dirY = dy / length;
    const dirZ = dz / length;

    let perpX: number, perpY: number, perpZ: number;
    if (Math.abs(dirZ) > 0.99) {
      perpX = 1;
      perpY = 0;
      perpZ = 0;
    } else {
      perpX = -dirY;
      perpY = dirX;
      perpZ = 0;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      perpX /= perpLen;
      perpY /= perpLen;
    }

    const tipBaseX = x1 - dirX * this._tipLength;
    const tipBaseY = y1 - dirY * this._tipLength;
    const tipBaseZ = z1 - dirZ * this._tipLength;

    const tipLeft = [
      tipBaseX + perpX * this._tipWidth,
      tipBaseY + perpY * this._tipWidth,
      tipBaseZ + perpZ * this._tipWidth,
    ];
    const tipRight = [
      tipBaseX - perpX * this._tipWidth,
      tipBaseY - perpY * this._tipWidth,
      tipBaseZ - perpZ * this._tipWidth,
    ];

    this._shaft = new ArrowShaft(
      [x0, y0, z0],
      [tipBaseX, tipBaseY, tipBaseZ],
      this._color,
      this._strokeWidth
    );
    this.add(this._shaft);

    this._tip = new ArrowTip(
      [x1, y1, z1],
      tipLeft,
      tipRight,
      this._color
    );
    this.add(this._tip);
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Set the start point
   */
  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._generateParts();
    return this;
  }

  /**
   * Get the end point (tip of the arrow)
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Set the end point (tip of the arrow)
   */
  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._generateParts();
    return this;
  }

  /**
   * Get the length of the arrow (including tip)
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the tip length
   */
  getTipLength(): number {
    return this._tipLength;
  }

  /**
   * Set the tip length
   */
  setTipLength(value: number): this {
    this._tipLength = value;
    this._generateParts();
    return this;
  }

  /**
   * Get the tip width
   */
  getTipWidth(): number {
    return this._tipWidth;
  }

  /**
   * Set the tip width
   */
  setTipWidth(value: number): this {
    this._tipWidth = value;
    this._generateParts();
    return this;
  }

  /**
   * Get the direction vector of the arrow (normalized)
   */
  getDirection(): Vector3Tuple {
    const length = this.getLength();
    if (length === 0) {
      return [1, 0, 0];
    }
    return [
      (this._end[0] - this._start[0]) / length,
      (this._end[1] - this._start[1]) / length,
      (this._end[2] - this._start[2]) / length,
    ];
  }

  /**
   * Get the angle of the arrow in the XY plane (in radians)
   */
  getAngle(): number {
    return Math.atan2(
      this._end[1] - this._start[1],
      this._end[0] - this._start[0]
    );
  }

  /**
   * Create a copy of this Arrow
   */
  protected override _createCopy(): Arrow {
    return new Arrow({
      start: this._start,
      end: this._end,
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * DoubleArrow - An arrow with tips on both ends
 */
export class DoubleArrow extends Group {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;
  private _tipLength: number;
  private _tipWidth: number;
  private _strokeWidth: number;

  constructor(options: ArrowOptions = {}) {
    super();

    const {
      start = [0, 0, 0],
      end = [1, 0, 0],
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      tipLength = 0.25,
      tipWidth = 0.15,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._color = color;
    this._strokeWidth = strokeWidth;

    this._generateParts();
  }

  private _generateParts(): void {
    this.clear();

    const [x0, y0, z0] = this._start;
    const [x1, y1, z1] = this._end;

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (length === 0) {
      return;
    }

    const dirX = dx / length;
    const dirY = dy / length;
    const dirZ = dz / length;

    let perpX: number, perpY: number, perpZ: number;
    if (Math.abs(dirZ) > 0.99) {
      perpX = 1;
      perpY = 0;
      perpZ = 0;
    } else {
      perpX = -dirY;
      perpY = dirX;
      perpZ = 0;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      perpX /= perpLen;
      perpY /= perpLen;
    }

    const endTipBaseX = x1 - dirX * this._tipLength;
    const endTipBaseY = y1 - dirY * this._tipLength;
    const endTipBaseZ = z1 - dirZ * this._tipLength;

    const startTipBaseX = x0 + dirX * this._tipLength;
    const startTipBaseY = y0 + dirY * this._tipLength;
    const startTipBaseZ = z0 + dirZ * this._tipLength;

    const endTipLeft = [endTipBaseX + perpX * this._tipWidth, endTipBaseY + perpY * this._tipWidth, endTipBaseZ + perpZ * this._tipWidth];
    const endTipRight = [endTipBaseX - perpX * this._tipWidth, endTipBaseY - perpY * this._tipWidth, endTipBaseZ - perpZ * this._tipWidth];
    const startTipLeft = [startTipBaseX + perpX * this._tipWidth, startTipBaseY + perpY * this._tipWidth, startTipBaseZ + perpZ * this._tipWidth];
    const startTipRight = [startTipBaseX - perpX * this._tipWidth, startTipBaseY - perpY * this._tipWidth, startTipBaseZ - perpZ * this._tipWidth];

    const shaft = new ArrowShaft(
      [startTipBaseX, startTipBaseY, startTipBaseZ],
      [endTipBaseX, endTipBaseY, endTipBaseZ],
      this._color,
      this._strokeWidth
    );
    this.add(shaft);

    const endTip = new ArrowTip([x1, y1, z1], endTipLeft, endTipRight, this._color);
    this.add(endTip);

    const startTip = new ArrowTip([x0, y0, z0], startTipRight, startTipLeft, this._color);
    this.add(startTip);
  }

  getStart(): Vector3Tuple {
    return [...this._start];
  }

  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._generateParts();
    return this;
  }

  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._generateParts();
    return this;
  }

  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  protected override _createCopy(): DoubleArrow {
    return new DoubleArrow({
      start: this._start,
      end: this._end,
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      color: this._color,
      strokeWidth: this._strokeWidth,
    });
  }
}

/**
 * Vector - An Arrow starting from the origin by default
 */
export class Vector extends Arrow {
  constructor(options: Omit<ArrowOptions, 'start'> & { direction?: Vector3Tuple } = {}) {
    const { direction, end, ...rest } = options;
    super({
      ...rest,
      start: [0, 0, 0],
      end: direction ?? end ?? [1, 0, 0],
    });
  }
}

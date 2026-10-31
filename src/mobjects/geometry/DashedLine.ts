import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { Line } from './Line';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/** Manim CE's DEFAULT_DASH_LENGTH. */
const DEFAULT_DASH_LENGTH = 0.05;

/**
 * Options for creating a DashedLine
 */
export interface DashedLineOptions {
  /** Start point of the line. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point of the line. Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /**
   * Approximate length of each dash (Manim CE's `dash_length`). The dash count
   * is `max(2, ceil(length / dashLength * dashRatio))`, and the dashes are
   * stretched so the line starts and ends with one. Default: 0.05
   * (Manim CE's DEFAULT_DASH_LENGTH).
   */
  dashLength?: number;
  /** Fraction of the line covered by dashes (Manim CE's `dashed_ratio`). Default: 0.5 */
  dashRatio?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
}

/**
 * DashedLine - A dashed line segment VMobject
 *
 * Creates a line made up of multiple small line segments with gaps between them.
 * The dashes are stored as children for proper rendering.
 *
 * @example
 * ```typescript
 * // Create a horizontal dashed line
 * const dashed = new DashedLine();
 *
 * // Create a dashed diagonal with custom dash length
 * const diagonal = new DashedLine({
 *   start: [-1, -1, 0],
 *   end: [1, 1, 0],
 *   dashLength: 0.2,
 *   dashRatio: 0.6
 * });
 * ```
 */
export class DashedLine extends VMobject {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;
  private _dashLength: number;
  private _dashRatio: number;
  private _dashes: Line[] = [];

  constructor(options: DashedLineOptions = {}) {
    super();

    const {
      start = [0, 0, 0],
      end = [1, 0, 0],
      dashLength = DEFAULT_DASH_LENGTH,
      dashRatio = 0.5,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._dashLength = dashLength;
    this._dashRatio = Math.max(0, Math.min(1, dashRatio));

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generateDashes();
  }

  /**
   * Generate the dash segments along the line
   */
  private _generateDashes(): void {
    // Remove old dashes
    for (const dash of this._dashes) {
      this.remove(dash);
      dash.dispose();
    }
    this._dashes = [];

    // Calculate line properties
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    const totalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (totalLength < 1e-10) {
      // Degenerate case: start and end are the same
      return;
    }

    // Direction vector (normalized)
    const dirX = dx / totalLength;
    const dirY = dy / totalLength;
    const dirZ = dz / totalLength;

    // Manim CE's DashedLine: n = max(2, ceil(L / dash_length * ratio)) dashes
    // covering `ratio` of the line, an open path that starts and ends with a
    // dash, so the n - 1 gaps share the rest (DashedVMobject).
    if (this._dashLength <= 0) {
      this.clearPoints();
      return;
    }
    const ratio = this._dashRatio;
    const numDashes = Math.max(2, Math.ceil((totalLength / this._dashLength) * ratio));
    const dashLen = (ratio * totalLength) / numDashes;
    const gapLen = ((1 - ratio) * totalLength) / (numDashes - 1);
    const cycleLen = dashLen + gapLen;
    const EPS = 1e-9;

    for (let i = 0; i < numDashes; i++) {
      const dashStart = i * cycleLen;
      const dashEnd =
        i === numDashes - 1 ? totalLength : Math.min(dashStart + dashLen, totalLength);

      if (dashEnd - dashStart > EPS) {
        const startPoint: Vector3Tuple = [
          this._start[0] + dirX * dashStart,
          this._start[1] + dirY * dashStart,
          this._start[2] + dirZ * dashStart,
        ];
        const endPoint: Vector3Tuple = [
          this._start[0] + dirX * dashEnd,
          this._start[1] + dirY * dashEnd,
          this._start[2] + dirZ * dashEnd,
        ];

        const dash = new Line({
          start: startPoint,
          end: endPoint,
          color: this.color,
          strokeWidth: this.strokeWidth,
        });

        this._dashes.push(dash);
        this.add(dash);
      }
    }

    // Clear the parent VMobject's own points since we use children for rendering
    this.clearPoints();
  }

  /**
   * Get the individual dash segments
   */
  getDashes(): Line[] {
    return [...this._dashes];
  }

  /**
   * Get the start point of the dashed line
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Set the start point of the dashed line
   */
  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._generateDashes();
    return this;
  }

  /**
   * Get the end point of the dashed line
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Set the end point of the dashed line
   */
  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._generateDashes();
    return this;
  }

  /**
   * Get the dash length
   */
  getDashLength(): number {
    return this._dashLength;
  }

  /**
   * Set the dash length
   */
  setDashLength(length: number): this {
    this._dashLength = length;
    this._generateDashes();
    return this;
  }

  /**
   * Get the dash ratio
   */
  getDashRatio(): number {
    return this._dashRatio;
  }

  /**
   * Set the dash ratio
   */
  setDashRatio(ratio: number): this {
    this._dashRatio = Math.max(0, Math.min(1, ratio));
    this._generateDashes();
    return this;
  }

  /**
   * Get the total length of the line
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Override setColor to propagate to dashes
   */
  override setColor(color: string): this {
    super.setColor(color);
    for (const dash of this._dashes) {
      dash.setColor(color);
    }
    return this;
  }

  /**
   * Override setStrokeWidth to propagate to dashes
   */
  override setStrokeWidth(width: number): this {
    super.setStrokeWidth(width);
    for (const dash of this._dashes) {
      dash.setStrokeWidth(width);
    }
    return this;
  }

  /**
   * Override setStrokeOpacity to propagate to dashes
   */
  override setStrokeOpacity(opacity: number): this {
    super.setStrokeOpacity(opacity);
    for (const dash of this._dashes) {
      dash.setStrokeOpacity(opacity);
    }
    return this;
  }

  /**
   * Copy this DashedLine, rebuilding dashes from endpoint params.
   * @post result.children.length === this.children.length  // dashes rebuilt by constructor
   */
  override copy(): DashedLine {
    this.normalizeTransform();
    const clone = new DashedLine({
      start: this._start,
      end: this._end,
      dashLength: this._dashLength,
      dashRatio: this._dashRatio,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyPosition: false, copyChildren: false });
    clone._dashes = clone.children.slice() as Line[];
    return clone;
  }
}

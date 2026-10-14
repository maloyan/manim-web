import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';

/** Options for creating a {@link Spring}. */
export interface SpringMobjectOptions {
  /** Start point. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point. Default: [3, 0, 0] */
  end?: Vector3Tuple;
  /** Number of coils. One coil has two peaks. Default: 8 */
  coils?: number;
  /** Full peak to peak width of the coil. Default: 0.3 */
  width?: number;
  /** Length of the straight lead at each end. Default: 0.25 */
  leadLength?: number;
  /** Stroke color. Default: WHITE */
  color?: string;
  /** Stroke width. Default: 3 */
  strokeWidth?: number;
}

/**
 * Spring: a zigzag coil between two endpoints, with a straight lead at each end.
 *
 * The spring has no state besides its endpoints and its shape options.
 * Call {@link Spring.setEndpoints} each frame to stretch it between two moving
 * anchors. The coil count and the width stay the same when it stretches.
 *
 * @example
 * ```typescript
 * const spring = new Spring({ start: [-2, -2, 0], end: [-1, 0, 0], coils: 10 });
 * spring.setEndpoints([-2, -2, 0], [-1.2, 0.3, 0]);
 * ```
 */
export class Spring extends VMobject {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;
  private _coils: number;
  private _width: number;
  private _leadLength: number;
  private _corners: number[][] = [];

  constructor(options: SpringMobjectOptions = {}) {
    super();
    const {
      start = [0, 0, 0],
      end = [3, 0, 0],
      coils = 8,
      width = 0.3,
      leadLength = 0.25,
      color = WHITE,
      strokeWidth = 3,
    } = options;
    if (!Number.isInteger(coils) || coils < 1) {
      throw new Error('Spring: coils must be an integer of at least 1');
    }
    if (!(width >= 0)) throw new Error('Spring: width must not be negative');
    if (!(leadLength >= 0)) throw new Error('Spring: leadLength must not be negative');

    this._start = [...start];
    this._end = [...end];
    this._coils = coils;
    this._width = width;
    this._leadLength = leadLength;
    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;
    this._generatePoints();
  }

  private _generatePoints(): void {
    const [x0, y0, z0] = this._start;
    const dx = this._end[0] - x0;
    const dy = this._end[1] - y0;
    const dz = this._end[2] - z0;
    const length = Math.hypot(dx, dy, dz);

    // Unit vector along the axis. A zero length spring has no direction.
    const ux = length > 0 ? dx / length : 1;
    const uy = length > 0 ? dy / length : 0;
    const uz = length > 0 ? dz / length : 0;
    // Unit vector across the axis, in the XY plane.
    const nx = -uy;
    const ny = ux;

    const lead = Math.min(this._leadLength, length / 2);
    const coilSpan = length - 2 * lead;
    const half = this._width / 2;
    const at = (s: number, offset: number): number[] => [
      x0 + ux * s + nx * offset,
      y0 + uy * s + ny * offset,
      z0 + uz * s,
    ];

    const corners: number[][] = [[x0, y0, z0], at(lead, 0)];
    const peaks = 2 * this._coils;
    for (let i = 0; i < peaks; i++) {
      const s = lead + (coilSpan * (i + 0.5)) / peaks;
      // A spring with no room for coils stays on the axis.
      const offset = coilSpan > 0 ? (i % 2 === 0 ? half : -half) : 0;
      corners.push(at(s, offset));
    }
    corners.push(at(length - lead, 0), [this._end[0], this._end[1], this._end[2]]);

    this._corners = corners;
    this.setPointsAsCorners(corners);
  }

  /** Move both endpoints. The coil count and width stay the same. */
  setEndpoints(start: Vector3Tuple, end: Vector3Tuple): this {
    this._start = [...start];
    this._end = [...end];
    this._generatePoints();
    return this;
  }

  /** Start point in local coordinates. */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /** End point in local coordinates. */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /** Distance between the endpoints. */
  getLength(): number {
    return Math.hypot(
      this._end[0] - this._start[0],
      this._end[1] - this._start[1],
      this._end[2] - this._start[2],
    );
  }

  /** Number of coils. */
  getCoils(): number {
    return this._coils;
  }

  /** Peak to peak width of the coil. */
  getSpringWidth(): number {
    return this._width;
  }

  /** Length of the straight lead at each end. */
  getLeadLength(): number {
    return this._leadLength;
  }

  /** The polyline vertices: start, lead end, two peaks per coil, coil end, end. */
  getCorners(): number[][] {
    return this._corners.map((c) => [...c]);
  }

  override copy(): Spring {
    this.normalizeTransform();
    const clone = new Spring({
      start: this._start,
      end: this._end,
      coils: this._coils,
      width: this._width,
      leadLength: this._leadLength,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyPosition: false });
    return clone;
  }
}

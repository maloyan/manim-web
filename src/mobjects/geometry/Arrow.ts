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
  /** Length of the arrowhead tip. Default: 0.3 */
  tipLength?: number;
  /** Width of the arrowhead base. Default: 0.1 */
  tipWidth?: number;
}

/**
 * ArrowShaft - The line part of an arrow (internal use)
 */
class ArrowShaft extends VMobject {
  constructor(delta: number[], color: string, strokeWidth: number) {
    super();
    this.color = color;
    this.strokeWidth = strokeWidth;
    this.fillOpacity = 0;

    const [dx, dy, dz] = delta;
    this.setPoints3D([
      [0, 0, 0],
      [dx / 3, dy / 3, dz / 3],
      [(2 * dx) / 3, (2 * dy) / 3, (2 * dz) / 3],
      [dx, dy, dz],
    ]);
  }

  protected _createCopy(): ArrowShaft {
    return new ArrowShaft([1, 0, 0], this.color, this.strokeWidth);
  }
}

/**
 * ArrowTip - The triangular tip of an arrow (internal use)
 */
class ArrowTip extends VMobject {
  constructor(delta: number[], tipLength: number, tipWidth: number, color: string) {
    super();
    this.color = color;
    this.fillOpacity = 1;
    this.strokeWidth = 0;

    const [dx, dy, dz] = delta;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len === 0) {
      this.setPoints3D([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      return;
    }

    const dirX = dx / len;
    const dirY = dy / len;
    const dirZ = dz / len;
    const [perpX, perpY, perpZ] = perpendicularFromDirection(dirX, dirY, dirZ);

    const baseCenter: Vector3Tuple = [-dirX * tipLength, -dirY * tipLength, -dirZ * tipLength];
    const widthOffset = tipWidth;
    const tipPoint: Vector3Tuple = [0, 0, 0];
    const tipLeft: Vector3Tuple = [
      baseCenter[0] + perpX * widthOffset,
      baseCenter[1] + perpY * widthOffset,
      baseCenter[2] + perpZ * widthOffset,
    ];
    const tipRight: Vector3Tuple = [
      baseCenter[0] - perpX * widthOffset,
      baseCenter[1] - perpY * widthOffset,
      baseCenter[2] - perpZ * widthOffset,
    ];

    const addLineSegment = (points: number[][], p0: number[], p1: number[], isFirst: boolean) => {
      const sdx = p1[0] - p0[0];
      const sdy = p1[1] - p0[1];
      const sdz = p1[2] - p0[2];

      if (isFirst) points.push([...p0]);
      points.push([p0[0] + sdx / 3, p0[1] + sdy / 3, p0[2] + sdz / 3]);
      points.push([p0[0] + (2 * sdx) / 3, p0[1] + (2 * sdy) / 3, p0[2] + (2 * sdz) / 3]);
      points.push([...p1]);
    };

    const points: number[][] = [];
    addLineSegment(points, tipLeft, tipPoint, true);
    addLineSegment(points, tipPoint, tipRight, false);
    addLineSegment(points, tipRight, tipLeft, false);
    this.setPoints3D(points);
  }

  protected _createCopy(): ArrowTip {
    return new ArrowTip([1, 0, 0], 0.3, 0.1, this.color);
  }
}

function perpendicularFromDirection(dirX: number, dirY: number, dirZ: number): Vector3Tuple {
  const ref: Vector3Tuple = Math.abs(dirZ) < 0.9 ? [0, 0, 1] : [1, 0, 0];

  // ref × dir
  let px = ref[1] * dirZ - ref[2] * dirY;
  let py = ref[2] * dirX - ref[0] * dirZ;
  let pz = ref[0] * dirY - ref[1] * dirX;

  let len = Math.sqrt(px * px + py * py + pz * pz);
  if (len < 1e-10) {
    const alt: Vector3Tuple = [0, 1, 0];
    px = alt[1] * dirZ - alt[2] * dirY;
    py = alt[2] * dirX - alt[0] * dirZ;
    pz = alt[0] * dirY - alt[1] * dirX;
    len = Math.sqrt(px * px + py * py + pz * pz) || 1;
  }

  return [px / len, py / len, pz / len];
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
      tipLength = 0.3,
      tipWidth = 0.1,
    } = options;

    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._color = color;
    this._strokeWidth = strokeWidth;

    this.putStartAndEndOn(start, end);
  }

  /**
   * Generate the arrow parts (shaft line + tip triangle)
   *
   * Uses delta vector to compute positions directly.
   */
  private _generateParts(delta: Vector3Tuple): void {
    this.clear();

    const [dx, dy, dz] = delta;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;
    const dirZ = dz / length;

    const shaftLength = length - this._tipLength;
    const shaftDelta: Vector3Tuple = [dirX * shaftLength, dirY * shaftLength, dirZ * shaftLength];

    this._shaft = new ArrowShaft(shaftDelta, this._color, this._strokeWidth);
    this._tip = new ArrowTip(delta, this._tipLength, this._tipWidth, this._color);

    this.add(this._shaft);
    this.add(this._tip);
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    const pos = this._shaft!.position;
    return [pos.x, pos.y, pos.z];
  }

  /**
   * Set both start and end points in one canonical operation.
   * Does not modify the group's own position.
   */
  putStartAndEndOn(start: Vector3Tuple, end: Vector3Tuple): this {
    const delta: Vector3Tuple = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
    this._generateParts(delta);

    this._shaft!.moveTo(start);
    this._tip!.moveTo(end);
    return this;
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setStart(point: Vector3Tuple): this {
    return this.putStartAndEndOn(point, this.getEnd());
  }

  /**
   * Get the end point (tip of the arrow)
   */
  getEnd(): Vector3Tuple {
    const pos = this._tip!.position;
    return [pos.x, pos.y, pos.z];
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setEnd(point: Vector3Tuple): this {
    return this.putStartAndEndOn(this.getStart(), point);
  }

  /**
   * Get the length of the arrow (including tip)
   */
  getLength(): number {
    const start = this.getStart();
    const end = this.getEnd();
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
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
    this.putStartAndEndOn(this.getStart(), this.getEnd());
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
    this.putStartAndEndOn(this.getStart(), this.getEnd());
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
    const start = this.getStart();
    const end = this.getEnd();
    return [
      (end[0] - start[0]) / length,
      (end[1] - start[1]) / length,
      (end[2] - start[2]) / length,
    ];
  }

  /**
   * Get the angle of the arrow in the XY plane (in radians)
   */
  getAngle(): number {
    const start = this.getStart();
    const end = this.getEnd();
    return Math.atan2(end[1] - start[1], end[0] - start[0]);
  }

  /**
   * Rebuild the tip triangle from the shaft's and tip's current (possibly transformed) points.
   * Uses the tip's already-transformed apex so the arrow still points at the exact
   * transformed coordinate, while restoring a clean isosceles triangle shape.
   */
  reconstructTip(): void {
    if (!this._shaft || !this._tip) return;

    const shaftPts = this._shaft.getPoints();
    if (shaftPts.length < 4) return;

    // The tip's transformed apex is at Bezier index 3
    // (segment 0: tipLeft→tipPoint, so index 3 = tipPoint)
    const curTipPts = this._tip.getPoints();
    if (curTipPts.length < 4) return;

    const shaftEnd = shaftPts[shaftPts.length - 1];
    const tipApex = curTipPts[3]; // already at the correct transformed position

    const dx = tipApex[0] - shaftEnd[0];
    const dy = tipApex[1] - shaftEnd[1];
    const dz = tipApex[2] - shaftEnd[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len === 0) return;

    const dirX = dx / len;
    const dirY = dy / len;
    const dirZ = dz / len;

    const [perpX, perpY, perpZ] = perpendicularFromDirection(dirX, dirY, dirZ);

    const halfW = this._tipWidth;
    const tipLeft = [
      shaftEnd[0] + perpX * halfW,
      shaftEnd[1] + perpY * halfW,
      shaftEnd[2] + perpZ * halfW,
    ];
    const tipRight = [
      shaftEnd[0] - perpX * halfW,
      shaftEnd[1] - perpY * halfW,
      shaftEnd[2] - perpZ * halfW,
    ];

    const addSeg = (pts: number[][], p0: number[], p1: number[], first: boolean) => {
      const sdx = p1[0] - p0[0],
        sdy = p1[1] - p0[1],
        sdz = p1[2] - p0[2];
      if (first) pts.push([...p0]);
      pts.push([p0[0] + sdx / 3, p0[1] + sdy / 3, p0[2] + sdz / 3]);
      pts.push([p0[0] + (2 * sdx) / 3, p0[1] + (2 * sdy) / 3, p0[2] + (2 * sdz) / 3]);
      pts.push([...p1]);
    };
    const newPts: number[][] = [];
    addSeg(newPts, tipLeft, tipApex, true);
    addSeg(newPts, tipApex, tipRight, false);
    addSeg(newPts, tipRight, tipLeft, false);
    this._tip.setPoints(newPts);
  }

  /**
   * Create a copy of this Arrow
   */
  protected override _createCopy(): Arrow {
    return new Arrow({
      start: this.getStart(),
      end: this.getEnd(),
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
      tipLength = 0.3,
      tipWidth = 0.1,
    } = options;

    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._color = color;
    this._strokeWidth = strokeWidth;

    this.putStartAndEndOn(start, end);
  }

  private _generateParts(delta: Vector3Tuple): void {
    this.clear();

    const [dx, dy, dz] = delta;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;
    const dirZ = dz / length;

    const shaftLength = length - 2 * this._tipLength;
    const shaftDelta: Vector3Tuple = [dirX * shaftLength, dirY * shaftLength, dirZ * shaftLength];

    const shaft = new ArrowShaft(shaftDelta, this._color, this._strokeWidth);
    const endTip = new ArrowTip(delta, this._tipLength, this._tipWidth, this._color);
    const startTip = new ArrowTip([-dx, -dy, -dz], this._tipLength, this._tipWidth, this._color);

    this.add(shaft);
    this.add(endTip);
    this.add(startTip);
  }

  getStart(): Vector3Tuple {
    const startTip = this.children[2] as ArrowTip;
    const pos = startTip.position;
    return [pos.x, pos.y, pos.z];
  }

  putStartAndEndOn(start: Vector3Tuple, end: Vector3Tuple): this {
    const delta: Vector3Tuple = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
    this._generateParts(delta);

    const length = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1] + delta[2] * delta[2]);
    if (length === 0) return this;

    const dirX = delta[0] / length;
    const dirY = delta[1] / length;
    const dirZ = delta[2] / length;

    const shaftStart: Vector3Tuple = [
      start[0] + dirX * this._tipLength,
      start[1] + dirY * this._tipLength,
      start[2] + dirZ * this._tipLength,
    ];

    (this.children[0] as ArrowShaft).moveTo(shaftStart);
    (this.children[1] as ArrowTip).moveTo(end);
    (this.children[2] as ArrowTip).moveTo(start);
    return this;
  }

  setTipLength(value: number): this {
    this._tipLength = value;
    this.putStartAndEndOn(this.getStart(), this.getEnd());
    return this;
  }

  getTipLength(): number {
    return this._tipLength;
  }

  setTipWidth(value: number): this {
    this._tipWidth = value;
    this.putStartAndEndOn(this.getStart(), this.getEnd());
    return this;
  }

  getTipWidth(): number {
    return this._tipWidth;
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setStart(point: Vector3Tuple): this {
    return this.putStartAndEndOn(point, this.getEnd());
  }

  getEnd(): Vector3Tuple {
    const endTip = this.children[1] as ArrowTip;
    const pos = endTip.position;
    return [pos.x, pos.y, pos.z];
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setEnd(point: Vector3Tuple): this {
    return this.putStartAndEndOn(this.getStart(), point);
  }

  getLength(): number {
    const start = this.getStart();
    const end = this.getEnd();
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Rebuild both tip triangles from the shaft's current transformed endpoints.
   */
  reconstructTips(): void {
    // DoubleArrow has children: [shaft, endTip, startTip]
    const kids = this.children;
    if (kids.length < 3) return;

    const shaft = kids[0];
    const endTipMob = kids[1];
    const startTipMob = kids[2];

    // Duck-type check
    type VMobLike = { getPoints(): number[][]; setPoints(p: number[][]): void };
    const asVMob = (m: unknown): VMobLike | null => {
      const o = m as Record<string, unknown>;
      return typeof o.getPoints === 'function' && typeof o.setPoints === 'function'
        ? (o as unknown as VMobLike)
        : null;
    };
    const shaftVM = asVMob(shaft);
    const endTipVM = asVMob(endTipMob);
    const startTipVM = asVMob(startTipMob);
    if (!shaftVM || !endTipVM || !startTipVM) return;

    const shaftPts = shaftVM.getPoints();
    if (shaftPts.length < 4) return;

    const endTipCurPts = endTipVM.getPoints();
    const startTipCurPts = startTipVM.getPoints();
    if (endTipCurPts.length < 4 || startTipCurPts.length < 4) return;

    const shaftStart = shaftPts[0];
    const shaftEnd = shaftPts[shaftPts.length - 1];

    // Use already-transformed apex positions (Bezier index 3) so tips
    // land on the exact transformed coordinates
    const endApex = endTipCurPts[3];
    const startApex = startTipCurPts[3];

    const halfW = this._tipWidth;
    const addSeg = (pts: number[][], p0: number[], p1: number[], first: boolean) => {
      const sdx = p1[0] - p0[0],
        sdy = p1[1] - p0[1],
        sdz = p1[2] - p0[2];
      if (first) pts.push([...p0]);
      pts.push([p0[0] + sdx / 3, p0[1] + sdy / 3, p0[2] + sdz / 3]);
      pts.push([p0[0] + (2 * sdx) / 3, p0[1] + (2 * sdy) / 3, p0[2] + (2 * sdz) / 3]);
      pts.push([...p1]);
    };

    const rebuildTip = (base: number[], apex: number[], vm: VMobLike, reverse: boolean) => {
      const dx = apex[0] - base[0];
      const dy = apex[1] - base[1];
      const dz = apex[2] - base[2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len === 0) return;
      const dxn = dx / len,
        dyn = dy / len,
        dzn = dz / len;

      const [perpX, perpY, perpZ] = perpendicularFromDirection(dxn, dyn, dzn);

      const left = [base[0] + perpX * halfW, base[1] + perpY * halfW, base[2] + perpZ * halfW];
      const right = [base[0] - perpX * halfW, base[1] - perpY * halfW, base[2] - perpZ * halfW];
      const pts: number[][] = [];
      if (reverse) {
        addSeg(pts, right, apex, true);
        addSeg(pts, apex, left, false);
        addSeg(pts, left, right, false);
      } else {
        addSeg(pts, left, apex, true);
        addSeg(pts, apex, right, false);
        addSeg(pts, right, left, false);
      }
      vm.setPoints(pts);
    };

    rebuildTip(shaftEnd, endApex, endTipVM, false);
    rebuildTip(shaftStart, startApex, startTipVM, true);
  }

  protected override _createCopy(): DoubleArrow {
    return new DoubleArrow({
      start: this.getStart(),
      end: this.getEnd(),
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

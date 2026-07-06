import { VGroup } from "../../core/VGroup";
import { VMobject } from "../../core/VMobject";
import { Vector3Tuple } from "../../core/Mobject";
import { DEFAULT_STROKE_WIDTH, WHITE } from "../../constants";
import { segmentAngle, segmentDirection, segmentLength } from "./segment";

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
  /**
   * Build a straight shaft spanning `delta`, optionally trimmed by independent
   * amounts at each end along the direction of travel.
   *
   * The geometry is laid out in a frame centered on the FULL `delta` (endpoints
   * at ∓delta/2), then each end is pulled inward by its margin. Asymmetric
   * margins therefore shift the line off its own geometric center, which is how
   * Arrow keeps a tip-trimmed shaft (endMargin = tipLength) anchored at the true
   * start while its carrier sits at the arrow center. See Arrow._generateParts.
   *
   * @pre startMargin >= 0 && endMargin >= 0
   * @pre startMargin + endMargin <= |delta|
   */
  constructor(
    delta: number[],
    color: string,
    strokeWidth: number,
    startMargin = 0,
    endMargin = 0,
  ) {
    super();
    this.color = color;
    this.strokeWidth = strokeWidth;
    this.fillOpacity = 0;

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

    if (startMargin < 0 || endMargin < 0) {
      throw new Error(
        `ArrowShaft margins must be >= 0, got (${startMargin}, ${endMargin})`,
      );
    }
    if (startMargin + endMargin > len + 1e-9) {
      throw new Error(
        `ArrowShaft margins ${startMargin}+${endMargin} exceed length ${len}`,
      );
    }

    const dirX = dx / len;
    const dirY = dy / len;
    const dirZ = dz / len;

    const sx = -dx / 2 + dirX * startMargin;
    const sy = -dy / 2 + dirY * startMargin;
    const sz = -dz / 2 + dirZ * startMargin;
    const ex = dx / 2 - dirX * endMargin;
    const ey = dy / 2 - dirY * endMargin;
    const ez = dz / 2 - dirZ * endMargin;

    this.setPoints3D([
      [sx, sy, sz],
      [sx + (ex - sx) / 3, sy + (ey - sy) / 3, sz + (ez - sz) / 3],
      [
        sx + (2 * (ex - sx)) / 3,
        sy + (2 * (ey - sy)) / 3,
        sz + (2 * (ez - sz)) / 3,
      ],
      [ex, ey, ez],
    ]);
  }

  override copy(): ArrowShaft {
    const copy = new ArrowShaft([1, 0, 0], this.color, this.strokeWidth);
    this._copyBaseAttributesInto(copy, {
      copyChildren: false,
      copyPosition: false,
    });
    return copy;
  }
}

/**
 * ArrowTip - The triangular tip of an arrow (internal use)
 */
class ArrowTip extends VMobject {
  constructor(
    delta: number[],
    tipLength: number,
    tipWidth: number,
    color: string,
  ) {
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

    const baseCenter: Vector3Tuple = [
      -dirX * tipLength,
      -dirY * tipLength,
      -dirZ * tipLength,
    ];
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

    const addLineSegment = (
      points: number[][],
      p0: number[],
      p1: number[],
      isFirst: boolean,
    ) => {
      const sdx = p1[0] - p0[0];
      const sdy = p1[1] - p0[1];
      const sdz = p1[2] - p0[2];

      if (isFirst) points.push([...p0]);
      points.push([p0[0] + sdx / 3, p0[1] + sdy / 3, p0[2] + sdz / 3]);
      points.push([
        p0[0] + (2 * sdx) / 3,
        p0[1] + (2 * sdy) / 3,
        p0[2] + (2 * sdz) / 3,
      ]);
      points.push([...p1]);
    };

    const points: number[][] = [];
    addLineSegment(points, tipLeft, tipPoint, true);
    addLineSegment(points, tipPoint, tipRight, false);
    addLineSegment(points, tipRight, tipLeft, false);
    this.setPoints3D(points);
  }

  override copy(): ArrowTip {
    const copy = new ArrowTip([1, 0, 0], 0.3, 0.1, this.color);
    this._copyBaseAttributesInto(copy, {
      copyChildren: false,
      copyPosition: false,
    });
    return copy;
  }

  /**
   * Center of the tip along its own spine: the midpoint between the base center
   * and the apex, mapped to world.
   *
   * VMobject.getCenter() takes the bbox of the *world* points, which drifts off
   * the triangle once the tip is rotated. The tip's local geometry is fixed
   * (see ArrowTip's addLineSegment order): index 3 is the apex, indices 0 and 6
   * are the two base corners. Averaging the apex with the base-corner midpoint
   * gives the spine midpoint, which we then map through the world matrix so the
   * center stays rigidly attached to the geometry under rotation.
   *
   * @post this.rotation === 0 && uniform scale => result === midpoint(baseCenter, apex)
   */
  override getCenter(): Vector3Tuple {
    const local = this.getLocalPoints();
    if (local.length < 7) return super.getCenter();

    const apex = local[3];
    const leftBase = local[0];
    const rightBase = local[6];
    return this._localToWorld([
      (apex[0] + (leftBase[0] + rightBase[0]) / 2) / 2,
      (apex[1] + (leftBase[1] + rightBase[1]) / 2) / 2,
      (apex[2] + (leftBase[2] + rightBase[2]) / 2) / 2,
    ]);
  }
}

function perpendicularFromDirection(
  dirX: number,
  dirY: number,
  dirZ: number,
): Vector3Tuple {
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
export class Arrow extends VGroup {
  /** Configured triangle depth measured from apex back toward shaft. */
  private _tipLength: number;
  /** Configured half-width from tip base-center to either side corner. */
  private _tipWidth: number;
  /** Shaft stroke width used when regenerating parts. */
  private _strokeWidth: number;
  /** Internal shaft child (always present after putStartAndEndOn, including zero-length). */
  private _shaft: ArrowShaft | null = null;
  /** Internal tip child (always present after putStartAndEndOn, including zero-length). */
  private _tip: ArrowTip | null = null;
  /**
   * Endpoints in this group's LOCAL frame — the source of truth for the arrow's
   * geometry. getStart()/getEnd() map these through _localToWorld(), and
   * normalizeTransform() re-bakes them so they stay world-invariant when the
   * group's deferred transform is folded into the children (cf. Circle folding
   * scale into _radius). The shaft/tip children are pure rendering derived from
   * these in putStartAndEndOn().
   */
  private _start: Vector3Tuple = [0, 0, 0];
  private _end: Vector3Tuple = [0, 0, 0];

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
   * Convert full arrow delta to shaft delta by removing tip length along direction.
   *
   * Convention: tip geometry is built from full `delta`, shaft geometry from
   * `max(0, |delta| - tipLength)` in the same direction.
   */
  private _getShaftDelta(delta: Vector3Tuple): Vector3Tuple {
    const [dx, dy, dz] = delta;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return [0, 0, 0];

    const shaftLength = Math.max(0, length - this._tipLength);
    const inv = 1 / length;
    return [
      dx * inv * shaftLength,
      dy * inv * shaftLength,
      dz * inv * shaftLength,
    ];
  }

  /**
   * Regenerate canonical children from endpoint delta.
   *
   * Conventions:
   * - Always rebuilds children (no in-place geometry mutation).
   * - Zero-length still yields canonical shaft+tip children.
   * - Tip local geometry is centered via centerPointsAroundPosition(), so
   *   `tip.getCenter() === tip.position` for the child object itself.
   */
  private _generateParts(delta: Vector3Tuple): void {
    this.remove(...this.children);

    const [dx, dy, dz] = delta;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (length === 0) {
      // Important invariant: putStartAndEndOn() must always leave Arrow with
      // canonical children (shaft + tip), even for degenerate/zero-length input.
      // Graphing vectors rely on this path and call endpoint helpers on zero vectors.
      this._shaft = new ArrowShaft([0, 0, 0], this._color, this._strokeWidth);
      this._tip = new ArrowTip(
        [0, 0, 0],
        this._tipLength,
        this._tipWidth,
        this._color,
      );
      this._tip.centerPointsAroundPosition();
      this.add(this._shaft);
      this.add(this._tip);
      return;
    }

    // Build the shaft from the FULL delta but trim only the tip end, so its
    // geometry spans [start, end - tipLength*dir]. Placed with its carrier at
    // the arrow center (see putStartAndEndOn) this leaves the near end exactly
    // on getStart() — a symmetric shaftDelta-long line would instead sit
    // tipLength/2 forward, gapping at the start and poking into the tip.
    const endMargin = Math.min(this._tipLength, length);
    this._shaft = new ArrowShaft(
      delta,
      this._color,
      this._strokeWidth,
      0,
      endMargin,
    );
    this._tip = new ArrowTip(
      delta,
      this._tipLength,
      this._tipWidth,
      this._color,
    );
    this._tip.centerPointsAroundPosition();

    this.add(this._shaft);
    this.add(this._tip);
  }

  /**
   * Get the start point in world coordinates.
   * @post result === _localToWorld(_start)
   */
  getStart(): Vector3Tuple {
    return this._localToWorld(this._start);
  }

  /**
   * Set both start and end points in one canonical operation.
   *
   * Conventions:
   * - Regenerates shaft/tip from delta every call.
   * - Does not mutate this VGroup's own position.
   * - Places shaft carrier at geometric midpoint.
   * - Places tip carrier at midpoint + shaftDelta/2 (forward along direction).
   */
  putStartAndEndOn(start: Vector3Tuple, end: Vector3Tuple): this {
    const delta: Vector3Tuple = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2],
    ];
    this._generateParts(delta);

    // Endpoints are the source of truth; the shaft/tip layout below just renders them.
    this._start = [...start];
    this._end = [...end];

    const center: Vector3Tuple = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ];

    const shaftDelta = this._getShaftDelta(delta);

    // Seat the shaft CARRIER (not its bbox center) at the arrow center. The shaft
    // geometry is laid out in the full-delta frame spanning [start, end - tipLength]
    // (see _generateParts), so its local origin already corresponds to the arrow
    // center; placing position there lands the near end exactly on `start`.
    // moveTo() would instead align the shaft's bbox center, shifting the
    // tip-trimmed shaft forward by tipLength/2 and offsetting getStart/getEnd.
    this._shaft!.position.set(center[0], center[1], center[2]);
    this._shaft!._markDirty();
    this._tip!.moveTo([
      center[0] + shaftDelta[0] / 2,
      center[1] + shaftDelta[1] / 2,
      center[2] + shaftDelta[2] / 2,
    ]);

    return this;
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setStart(point: Vector3Tuple): this {
    return this.putStartAndEndOn(point, this.getEnd());
  }

  /**
   * Get the end point (tip of the arrow) in world coordinates.
   * @post result === _localToWorld(_end)
   */
  getEnd(): Vector3Tuple {
    return this._localToWorld(this._end);
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setEnd(point: Vector3Tuple): this {
    return this.putStartAndEndOn(this.getStart(), point);
  }

  /**
   * Get the center point of the arrow in world coordinates.
   *
   * Delegates to the VGroup world-bounds center: the old shaft-position shortcut
   * ignored this Arrow's own group transform, so a shifted/scaled Arrow reported
   * a stale center.
   */
  override getCenter(): Vector3Tuple {
    return super.getCenter();
  }

  /**
   * Get the length of the arrow (including tip), in world space.
   * @post result === dist(getStart(), getEnd())
   */
  getLength(): number {
    return segmentLength(this.getStart(), this.getEnd());
  }

  /**
   * Re-express the endpoint cache so getStart()/getEnd() stay world-invariant
   * when normalization folds this group's deferred transform into the children.
   *
   * _start/_end are in this group's local frame; capture their world positions
   * before super bakes (and resets) the group transform, then map them back into
   * the post-bake local frame. Mirrors Circle.normalizeTransform folding scale
   * into _radius — without it, _start/_end would silently drift (as the old
   * shaft-position/_originToStartLocal reconstruction did).
   */
  override normalizeTransform(): this {
    const worldStart = this.getStart();
    const worldEnd = this.getEnd();
    super.normalizeTransform();
    this._start = this._worldToLocal(worldStart);
    this._end = this._worldToLocal(worldEnd);
    return this;
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
   * Get the direction vector of the arrow (normalized, world-space).
   * @post result === normalize(getEnd() - getStart())
   */
  getDirection(): Vector3Tuple {
    return segmentDirection(this.getStart(), this.getEnd());
  }

  /**
   * Get the angle of the arrow in the XY plane (in radians, world-space).
   */
  getAngle(): number {
    return segmentAngle(this.getStart(), this.getEnd());
  }

  /**
   * Empty shell for {@link Mobject.copy}. The Arrow constructor eagerly builds
   * shaft+tip, so we strip them: copy() clones the source's actual children
   * (preserving per-child state like a recolored tip) and {@link copy} rebinds
   * the _shaft/_tip pointers to them.
   *
   * @post result.children.length === 0
   */
  reconstructTip(): void {
    if (!this._shaft || !this._tip) return;

    const shaftPts = this._shaft.getLocalPoints();
    if (shaftPts.length < 4) return;

    // The tip's transformed apex is at Bezier index 3
    // (segment 0: tipLeft→tipPoint, so index 3 = tipPoint)
    const curTipPts = this._tip.getLocalPoints();
    if (curTipPts.length < 4) return;

    const start = shaftPts[0];
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

    const addSeg = (
      pts: number[][],
      p0: number[],
      p1: number[],
      first: boolean,
    ) => {
      const sdx = p1[0] - p0[0],
        sdy = p1[1] - p0[1],
        sdz = p1[2] - p0[2];
      if (first) pts.push([...p0]);
      pts.push([p0[0] + sdx / 3, p0[1] + sdy / 3, p0[2] + sdz / 3]);
      pts.push([
        p0[0] + (2 * sdx) / 3,
        p0[1] + (2 * sdy) / 3,
        p0[2] + (2 * sdz) / 3,
      ]);
      pts.push([...p1]);
    };
    const newPts: number[][] = [];
    addSeg(newPts, tipLeft, tipApex, true);
    addSeg(newPts, tipApex, tipRight, false);
    addSeg(newPts, tipRight, tipLeft, false);
    this._tip.setPoints(newPts);

    this._start = [start[0], start[1], start[2]];
    this._end = [tipApex[0], tipApex[1], tipApex[2]];
  }

  /**
   * Copy this Arrow by cloning its actual shaft/tip children and rebinding the
   * _shaft/_tip pointers to them, rather than rebuilding geometry from endpoint
   * params via the constructor. This preserves per-child state (e.g. a recolored
   * tip) that constructor params can't express.
   *
   * @post result.children.length === 2  // shaft, tip
   * @post result.getStart() === this.getStart() && result.getEnd() === this.getEnd()
   */
  override copy(): Arrow {
    this.normalizeTransform();

    // Construct a shell carrying only the scalar config; strip the children the
    // constructor eagerly built so we can rebind to clones of THIS arrow's parts.
    const clone = new Arrow({
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
    clone.remove(...clone.children);

    clone._shaft = this._shaft ? this._shaft.copy() : null;
    clone._tip = this._tip ? this._tip.copy() : null;
    if (clone._shaft) clone.add(clone._shaft);
    if (clone._tip) clone.add(clone._tip);

    // Endpoints are the source of truth; carry them over directly (children
    // already encode the matching geometry).
    clone._start = [...this._start];
    clone._end = [...this._end];

    this._copyBaseAttributesInto(clone, {
      copyChildren: false,
      copyPosition: false,
    });
    return clone;
  }
}

/**
 * DoubleArrow - An arrow with tips on both ends
 */
export class DoubleArrow extends VGroup {
  private _tipLength: number;
  private _tipWidth: number;
  private _strokeWidth: number;
  /**
   * Endpoints in this group's LOCAL frame — the source of truth (see Arrow._start).
   * getStart()/getEnd() map these through _localToWorld(); the shaft/tips are
   * pure rendering laid out from them in putStartAndEndOn(). normalizeTransform()
   * re-bakes them so they stay world-invariant under deferred group transforms.
   */
  private _start: Vector3Tuple = [0, 0, 0];
  private _end: Vector3Tuple = [0, 0, 0];

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
    this.remove(...this.children);

    const [dx, dy, dz] = delta;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;
    const dirZ = dz / length;

    const shaftLength = length - 2 * this._tipLength;
    const shaftDelta: Vector3Tuple = [
      dirX * shaftLength,
      dirY * shaftLength,
      dirZ * shaftLength,
    ];

    const shaft = new ArrowShaft(shaftDelta, this._color, this._strokeWidth);
    const endTip = new ArrowTip(
      delta,
      this._tipLength,
      this._tipWidth,
      this._color,
    );
    const startTip = new ArrowTip(
      [-dx, -dy, -dz],
      this._tipLength,
      this._tipWidth,
      this._color,
    );

    this.add(shaft);
    this.add(endTip);
    this.add(startTip);
  }

  /**
   * Get the start point in world coordinates.
   * @post result === _localToWorld(_start)
   */
  getStart(): Vector3Tuple {
    return this._localToWorld(this._start);
  }

  putStartAndEndOn(start: Vector3Tuple, end: Vector3Tuple): this {
    const delta: Vector3Tuple = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2],
    ];
    this._generateParts(delta);

    // Endpoints are the source of truth; the shaft/tip layout below just renders them.
    this._start = [...start];
    this._end = [...end];

    const length = Math.sqrt(
      delta[0] * delta[0] + delta[1] * delta[1] + delta[2] * delta[2],
    );
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

  /**
   * Get the end point in world coordinates.
   * @post result === _localToWorld(_end)
   */
  getEnd(): Vector3Tuple {
    return this._localToWorld(this._end);
  }

  /**
   * @deprecated Use putStartAndEndOn(start, end) for canonical endpoint updates.
   */
  setEnd(point: Vector3Tuple): this {
    return this.putStartAndEndOn(this.getStart(), point);
  }

  /**
   * Get the length of the arrow in world space.
   * @post result === dist(getStart(), getEnd())
   */
  getLength(): number {
    return segmentLength(this.getStart(), this.getEnd());
  }

  /**
   * Re-express the endpoint cache so getStart()/getEnd() stay world-invariant
   * when normalization folds this group's deferred transform into the children.
   * See Arrow.normalizeTransform.
   */
  override normalizeTransform(): this {
    const worldStart = this.getStart();
    const worldEnd = this.getEnd();
    super.normalizeTransform();
    this._start = this._worldToLocal(worldStart);
    this._end = this._worldToLocal(worldEnd);
    return this;
  }

  /**
   * Empty shell for {@link Mobject.copy}. The constructor eagerly builds
   * shaft+endTip+startTip, so we strip them and let copy() clone the source's
   * actual children. DoubleArrow reads its parts by child index (no cached
   * pointers), so no rebind override is needed.
   *
   * @post result.children.length === 0
   */
  override copy(): DoubleArrow {
    this.normalizeTransform();
    const clone = new DoubleArrow({
      start: this.getStart(),
      end: this.getEnd(),
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      color: this._color,
      strokeWidth: this._strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyPosition: false });
    return clone;
  }
}

/**
 * Vector - An Arrow starting from the origin by default
 */
export class Vector extends Arrow {
  constructor(
    options: Omit<ArrowOptions, "start"> & { direction?: Vector3Tuple } = {},
  ) {
    const { direction, end, ...rest } = options;
    super({
      ...rest,
      start: [0, 0, 0],
      end: direction ?? end ?? [1, 0, 0],
    });
  }
}

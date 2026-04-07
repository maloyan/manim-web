import { VMobject } from '../../core/VMobject';

export interface TipOptions {
  /** Length of the tip. Default: 0.25 */
  tipLength?: number;
  /** Width of the tip base. Default: 0.25 */
  tipWidth?: number;
  /** Color of the tip. Default: same as parent */
  color?: string;
  /** Fill opacity of the tip. Default: 1 */
  fillOpacity?: number;
}

export interface TipableVMobjectOptions {
  /** Whether to add a tip at the end. Default: false */
  addTip?: boolean;
  /** Tip configuration */
  tipConfig?: TipOptions;
}

/**
 * TipableVMobject - Base class for VMobjects that can have arrow tips
 *
 * Provides methods to add, remove, and query arrow tips on the endpoints
 * of a curve. This enables adding tips to arbitrary VMobjects, not just Arrows.
 *
 * @example
 * ```typescript
 * const arc = new TipableArc({ radius: 2, addTip: true });
 * // Or add tips after creation:
 * const curve = new SomeCurve();
 * (curve as TipableVMobject).addTip();
 * ```
 */
export abstract class TipableVMobject extends VMobject {
  protected _tips: VMobject[] = [];
  protected _tipConfig: TipOptions;

  constructor(options: TipableVMobjectOptions = {}) {
    super();
    this._tipConfig = options.tipConfig ?? {};

    if (options.addTip) {
      this.addTip(this._tipConfig);
    }
  }

  /**
   * Add a tip to the end of the curve
   */
  addTip(options: TipOptions = {}): this {
    const tip = this._createTipMobject(options, false);
    this._tips.push(tip);
    this._positionTip(tip, false);
    this.add(tip);
    return this;
  }

  /**
   * Add a tip to the start of the curve
   */
  addStartTip(options: TipOptions = {}): this {
    const tip = this._createTipMobject(options, true);
    this._tips.push(tip);
    this._positionTip(tip, true);
    this.add(tip);
    return this;
  }

  /**
   * Remove all tips
   */
  removeTips(): this {
    for (const tip of this._tips) {
      this.remove(tip);
    }
    this._tips = [];
    return this;
  }

  /**
   * Get all tips
   */
  getTips(): VMobject[] {
    return [...this._tips];
  }

  /**
   * Get the tip at the end of the curve
   */
  getTip(): VMobject | null {
    return this._tips.length > 0 ? this._tips[this._tips.length - 1] : null;
  }

  /**
   * Check if there are any tips
   */
  hasTip(): boolean {
    return this._tips.length > 0;
  }

  /**
   * Check if there is a start tip
   */
  hasStartTip(): boolean {
    return this._tips.length > 1;
  }

  /**
   * Get the start point of the curve (for tip positioning)
   */
  getStart(): number[] {
    const points = this.getPoints();
    return points.length > 0 ? [...points[0]] : [0, 0, 0];
  }

  /**
   * Get the end point of the curve (for tip positioning)
   */
  getEnd(): number[] {
    const points = this.getPoints();
    return points.length > 0 ? [...points[points.length - 1]] : [1, 0, 0];
  }

  /**
   * Get the unit tangent vector at the end of the curve
   */
  protected _getEndTangent(): number[] {
    const points = this.getPoints();
    if (points.length < 2) return [1, 0, 0];

    const end = points[points.length - 1];
    const prev = points[points.length - 2];

    const dx = end[0] - prev[0];
    const dy = end[1] - prev[1];
    const dz = end[2] - prev[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (len < 1e-8) return [1, 0, 0];
    return [dx / len, dy / len, dz / len];
  }

  /**
   * Get the unit tangent vector at the start of the curve
   */
  protected _getStartTangent(): number[] {
    const points = this.getPoints();
    if (points.length < 2) return [-1, 0, 0];

    const start = points[0];
    const next = points[1];

    const dx = start[0] - next[0];
    const dy = start[1] - next[1];
    const dz = start[2] - next[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (len < 1e-8) return [-1, 0, 0];
    return [dx / len, dy / len, dz / len];
  }

  /**
   * Create a triangular tip VMobject
   */
  protected _createTipMobject(options: TipOptions, _atStart: boolean): VMobject {
    const tipLength = options.tipLength ?? this._tipConfig.tipLength ?? 0.25;
    const tipWidth = options.tipWidth ?? this._tipConfig.tipWidth ?? 0.25;
    const tipColor = options.color ?? this._tipConfig.color ?? this.color;
    const tipFillOpacity = options.fillOpacity ?? this._tipConfig.fillOpacity ?? 1;

    const tip = new VMobject();
    tip.color = tipColor;
    tip.fillOpacity = tipFillOpacity;
    tip.strokeWidth = 0;

    // Create a unit triangle pointing right, will be transformed later
    const halfWidth = tipWidth / 2;

    const points: number[][] = [];
    // Triangle: tipPoint, left, right
    const tipPoint = [tipLength, 0, 0];
    const left = [0, halfWidth, 0];
    const right = [0, -halfWidth, 0];

    // Convert to bezier segments (straight lines as cubic beziers)
    const addSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      if (isFirst) points.push([...p0]);
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, p0[2] + (2 * dz) / 3]);
      points.push([...p1]);
    };

    addSegment(left, tipPoint, true);
    addSegment(tipPoint, right, false);
    addSegment(right, left, false);

    tip.setPoints3D(points);
    return tip;
  }

  /**
   * Position and orient a tip at the start or end of the curve
   */
  protected _positionTip(tip: VMobject, atStart: boolean): void {
    const tangent = atStart ? this._getStartTangent() : this._getEndTangent();
    const position = atStart ? this.getStart() : this.getEnd();

    // Calculate rotation angle from tangent
    const angle = Math.atan2(tangent[1], tangent[0]);

    tip.moveTo(position as [number, number, number]);
    // Rotate tip to align with tangent
    const threeObj = tip.getThreeObject();
    threeObj.rotation.z = angle;
  }

  /**
   * Get the length of the curve (approximate)
   */
  getLength(): number {
    const points = this.getPoints();
    if (points.length < 2) return 0;

    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      const dz = points[i][2] - points[i - 1][2];
      length += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return length;
  }
}

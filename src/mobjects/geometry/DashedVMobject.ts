import { VMobject } from '../../core/VMobject';
import { Group } from '../../core/Group';

/**
 * Options for creating a DashedVMobject
 */
export interface DashedVMobjectOptions {
  /** The VMobject to create a dashed version of */
  vmobject: VMobject;
  /** Number of dashes. Default: 15 */
  numDashes?: number;
  /** Ratio of dash length to total (dash + gap). Default: 0.5 */
  dashRatio?: number;
  /** Override color. Default: uses vmobject's color */
  color?: string;
  /** Override stroke width. Default: uses vmobject's stroke width */
  strokeWidth?: number;
}

/**
 * DashedVMobject - Creates a dashed version of any VMobject
 *
 * Takes any VMobject and creates a dashed version by sampling points
 * along the original path. Each dash is a separate VMobject child.
 *
 * @example
 * ```typescript
 * // Create a dashed circle
 * const circle = new Circle({ radius: 2 });
 * const dashedCircle = new DashedVMobject({ vmobject: circle });
 *
 * // Create a dashed arc with more dashes
 * const arc = new Arc({ angle: Math.PI });
 * const dashedArc = new DashedVMobject({
 *   vmobject: arc,
 *   numDashes: 20,
 *   dashRatio: 0.6
 * });
 * ```
 */
export class DashedVMobject extends Group {
  private _sourceVMobject: VMobject;
  private _numDashes: number;
  private _dashRatio: number;
  private _dashColor: string;
  private _dashStrokeWidth: number;
  private _dashSegments: VMobject[] = [];

  constructor(options: DashedVMobjectOptions) {
    super();

    const {
      vmobject,
      numDashes = 15,
      dashRatio = 0.5,
      color,
      strokeWidth,
    } = options;

    this._sourceVMobject = vmobject;
    this._numDashes = Math.max(1, Math.floor(numDashes));
    this._dashRatio = Math.max(0, Math.min(1, dashRatio));
    this._dashColor = color ?? vmobject.color;
    this._dashStrokeWidth = strokeWidth ?? vmobject.strokeWidth;

    this._generateDashes();
  }

  /**
   * Generate dashes by sampling the source VMobject's points
   */
  private _generateDashes(): void {
    // Remove old dashes
    for (const dash of this._dashSegments) {
      this.remove(dash);
      dash.dispose();
    }
    this._dashSegments = [];

    // Get the source points
    const sourcePoints = this._sourceVMobject.getPoints();
    if (sourcePoints.length < 2) {
      return;
    }

    // Calculate the approximate total path length
    const pathPoints = this._samplePathPoints(sourcePoints, this._numDashes * 10);
    const totalLength = this._calculatePathLength(pathPoints);

    if (totalLength < 1e-10) {
      return;
    }

    // Calculate dash and gap lengths
    const cycleLength = totalLength / this._numDashes;
    const dashLength = cycleLength * this._dashRatio;

    // Generate dashes
    let currentLength = 0;
    let dashIndex = 0;

    while (dashIndex < this._numDashes && currentLength < totalLength) {
      const dashStartLength = currentLength;
      const dashEndLength = Math.min(currentLength + dashLength, totalLength);

      // Get points for this dash
      const dashPoints = this._getPointsInRange(
        pathPoints,
        dashStartLength,
        dashEndLength
      );

      if (dashPoints.length >= 2) {
        const dash = new VMobject();
        dash.setPoints3D(dashPoints);
        dash.color = this._dashColor;
        dash.strokeWidth = this._dashStrokeWidth;
        dash.fillOpacity = 0;

        this._dashSegments.push(dash);
        this.add(dash);
      }

      currentLength += cycleLength;
      dashIndex++;
    }
  }

  /**
   * Sample evenly spaced points along a Bezier path
   */
  private _samplePathPoints(points: number[][], numSamples: number): number[][] {
    const result: number[][] = [];

    // Process cubic Bezier segments
    let i = 0;
    const samplesPerSegment = Math.max(
      2,
      Math.ceil(numSamples / Math.floor((points.length - 1) / 3))
    );

    while (i + 3 < points.length) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];
      const p3 = points[i + 3];

      for (let j = 0; j < samplesPerSegment; j++) {
        const t = j / samplesPerSegment;
        result.push(this._evaluateCubicBezier(p0, p1, p2, p3, t));
      }

      i += 3;
    }

    // Add final point
    if (points.length > 0) {
      result.push([...points[points.length - 1]]);
    }

    return result;
  }

  /**
   * Evaluate a cubic Bezier curve at parameter t
   */
  private _evaluateCubicBezier(
    p0: number[],
    p1: number[],
    p2: number[],
    p3: number[],
    t: number
  ): number[] {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return [
      mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
      mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
      mt3 * p0[2] + 3 * mt2 * t * p1[2] + 3 * mt * t2 * p2[2] + t3 * p3[2],
    ];
  }

  /**
   * Calculate the total path length from sampled points
   */
  private _calculatePathLength(points: number[][]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      const dz = points[i][2] - points[i - 1][2];
      length += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return length;
  }

  /**
   * Get points within a length range along the path
   */
  private _getPointsInRange(
    points: number[][],
    startLength: number,
    endLength: number
  ): number[][] {
    const result: number[][] = [];
    let currentLength = 0;
    let inRange = false;

    for (let i = 0; i < points.length; i++) {
      if (i > 0) {
        const dx = points[i][0] - points[i - 1][0];
        const dy = points[i][1] - points[i - 1][1];
        const dz = points[i][2] - points[i - 1][2];
        const segmentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const prevLength = currentLength;
        currentLength += segmentLength;

        // Check if we're entering the range
        if (!inRange && currentLength >= startLength) {
          inRange = true;
          // Interpolate start point
          if (segmentLength > 0) {
            const t = (startLength - prevLength) / segmentLength;
            result.push([
              points[i - 1][0] + t * dx,
              points[i - 1][1] + t * dy,
              points[i - 1][2] + t * dz,
            ]);
          }
        }

        // Check if we're exiting the range
        if (inRange && currentLength >= endLength) {
          // Interpolate end point
          if (segmentLength > 0) {
            const t = (endLength - prevLength) / segmentLength;
            result.push([
              points[i - 1][0] + t * dx,
              points[i - 1][1] + t * dy,
              points[i - 1][2] + t * dz,
            ]);
          }
          break;
        }
      }

      // Add point if in range
      if (inRange) {
        result.push([...points[i]]);
      }
    }

    return result;
  }

  /**
   * Get the individual dash segments
   */
  getDashes(): VMobject[] {
    return [...this._dashSegments];
  }

  /**
   * Get the number of dashes
   */
  getNumDashes(): number {
    return this._numDashes;
  }

  /**
   * Set the number of dashes and regenerate
   */
  setNumDashes(num: number): this {
    this._numDashes = Math.max(1, Math.floor(num));
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
   * Set the dash ratio and regenerate
   */
  setDashRatio(ratio: number): this {
    this._dashRatio = Math.max(0, Math.min(1, ratio));
    this._generateDashes();
    return this;
  }

  /**
   * Get the source VMobject
   */
  getSourceVMobject(): VMobject {
    return this._sourceVMobject;
  }

  /**
   * Create a copy of this DashedVMobject
   */
  protected override _createCopy(): DashedVMobject {
    return new DashedVMobject({
      vmobject: this._sourceVMobject.copy() as VMobject,
      numDashes: this._numDashes,
      dashRatio: this._dashRatio,
      color: this._dashColor,
      strokeWidth: this._dashStrokeWidth,
    });
  }
}

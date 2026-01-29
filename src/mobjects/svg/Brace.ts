import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple, DOWN } from '../../core/Mobject';
import { Group } from '../../core/Group';
import { Text } from '../text/Text';
import { Arc } from '../geometry/Arc';
import { DEFAULT_STROKE_WIDTH, WHITE } from '../../constants';

/**
 * Options for creating a Brace
 */
export interface BraceOptions {
  /** Direction to place the brace relative to the mobject. Default: DOWN */
  direction?: Vector3Tuple;
  /** Buffer distance from the mobject. Default: 0.2 */
  buff?: number;
  /** Stroke color as CSS color string. Default: WHITE */
  color?: string;
  /** Stroke width in pixels. Default: 4 */
  strokeWidth?: number;
  /** Sharpness of the brace tip (0-1). Default: 2 */
  sharpness?: number;
}

/**
 * Options for creating a BraceBetweenPoints
 */
export interface BraceBetweenPointsOptions {
  /** Start point of the brace */
  start: Vector3Tuple;
  /** End point of the brace */
  end: Vector3Tuple;
  /** Direction perpendicular to the line between points. Default: computed from points */
  direction?: Vector3Tuple;
  /** Buffer distance. Default: 0.2 */
  buff?: number;
  /** Stroke color as CSS color string. Default: WHITE */
  color?: string;
  /** Stroke width in pixels. Default: 4 */
  strokeWidth?: number;
  /** Sharpness of the brace tip (0-1). Default: 2 */
  sharpness?: number;
}

/**
 * Options for creating an ArcBrace
 */
export interface ArcBraceOptions {
  /** The arc to place the brace on */
  arc: Arc;
  /** Direction to place the brace (1 = outside, -1 = inside). Default: 1 */
  direction?: number;
  /** Buffer distance from the arc. Default: 0.2 */
  buff?: number;
  /** Stroke color as CSS color string. Default: WHITE */
  color?: string;
  /** Stroke width in pixels. Default: 4 */
  strokeWidth?: number;
}

/**
 * Options for creating a BraceLabel
 */
export interface BraceLabelOptions extends BraceOptions {
  /** The label to attach (string or Mobject). Default: '' */
  label?: string | Mobject;
  /** Font size for text labels. Default: 36 */
  fontSize?: number;
  /** Buffer between brace tip and label. Default: 0.2 */
  labelBuff?: number;
  /** Color for the label. Default: WHITE */
  labelColor?: string;
}

/**
 * Helper function to get bounding box from a mobject
 */
function getMobjectBounds(mobject: Mobject): { width: number; height: number; depth: number } {
  // Try to access _getBoundingBox if it exists
  if (typeof (mobject as any)._getBoundingBox === 'function') {
    return (mobject as any)._getBoundingBox();
  }
  return { width: 1, height: 1, depth: 1 };
}

/**
 * Brace - A curly brace shape constructed with cubic Bezier curves
 *
 * Creates the classic { brace shape that can be placed alongside a mobject
 * to indicate grouping or measurement.
 *
 * @example
 * ```typescript
 * // Create a brace under a rectangle
 * const rect = new Rectangle({ width: 3, height: 2 });
 * const brace = new Brace(rect, { direction: DOWN });
 *
 * // Create a brace to the left of a circle
 * const circle = new Circle({ radius: 1 });
 * const leftBrace = new Brace(circle, { direction: LEFT });
 * ```
 */
export class Brace extends VMobject {
  /** The mobject this brace is attached to */
  readonly mobject: Mobject | null;
  /** The direction the brace points */
  readonly braceDirection: Vector3Tuple;
  /** Buffer distance from the mobject */
  readonly buff: number;
  /** Sharpness of the brace tip */
  readonly sharpness: number;
  /** Tip point of the brace */
  protected _tipPoint: Vector3Tuple;

  constructor(mobject: Mobject, options: BraceOptions = {}) {
    super();

    const {
      direction = DOWN,
      buff = 0.2,
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      sharpness = 2,
    } = options;

    this.mobject = mobject;
    this.braceDirection = [...direction];
    this.buff = buff;
    this.sharpness = sharpness;
    this._tipPoint = [0, 0, 0];

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generateBracePoints();
  }

  /**
   * Generate the Bezier curve points for the curly brace shape
   */
  protected _generateBracePoints(): void {
    if (!this.mobject) return;

    // Get the mobject bounds
    const mobjectCenter = this.mobject.getCenter();
    const bounds = getMobjectBounds(this.mobject);

    // Normalize direction
    const dirMag = Math.sqrt(
      this.braceDirection[0] ** 2 +
      this.braceDirection[1] ** 2 +
      this.braceDirection[2] ** 2
    );
    const normDir: Vector3Tuple = [
      this.braceDirection[0] / dirMag,
      this.braceDirection[1] / dirMag,
      this.braceDirection[2] / dirMag,
    ];

    // Perpendicular direction (for the width of the brace)
    const perpDir: Vector3Tuple = [-normDir[1], normDir[0], 0];

    // Calculate the width based on direction and bounds
    let width: number;
    if (Math.abs(normDir[0]) > Math.abs(normDir[1])) {
      // Horizontal direction - brace spans height
      width = bounds.height;
    } else {
      // Vertical direction - brace spans width
      width = bounds.width;
    }

    // Calculate the start point (edge of mobject in direction)
    const edgeOffset = Math.abs(normDir[0]) > Math.abs(normDir[1])
      ? bounds.width / 2
      : bounds.height / 2;

    const braceStart: Vector3Tuple = [
      mobjectCenter[0] + normDir[0] * (edgeOffset + this.buff) - perpDir[0] * width / 2,
      mobjectCenter[1] + normDir[1] * (edgeOffset + this.buff) - perpDir[1] * width / 2,
      mobjectCenter[2],
    ];

    const braceEnd: Vector3Tuple = [
      mobjectCenter[0] + normDir[0] * (edgeOffset + this.buff) + perpDir[0] * width / 2,
      mobjectCenter[1] + normDir[1] * (edgeOffset + this.buff) + perpDir[1] * width / 2,
      mobjectCenter[2],
    ];

    this._generateBraceFromPoints(braceStart, braceEnd, normDir);
  }

  /**
   * Generate the brace shape between two points
   */
  protected _generateBraceFromPoints(
    start: Vector3Tuple,
    end: Vector3Tuple,
    direction: Vector3Tuple
  ): void {
    const points: number[][] = [];

    // Calculate mid point and tip position
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    // The brace extends outward in the direction
    const tipDepth = 0.25 * this.sharpness;
    this._tipPoint = [
      midX + direction[0] * tipDepth,
      midY + direction[1] * tipDepth,
      midZ,
    ];

    // Vector from start to end
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1e-6) {
      // Degenerate case - just a point
      this.setPoints3D([[...start], [...start], [...start], [...start]]);
      return;
    }

    // Unit vectors
    const tangent: Vector3Tuple = [dx / length, dy / length, 0];

    // Control point distances
    const quarterLength = length / 4;
    const controlDepth = tipDepth * 0.5;
    const curveWidth = quarterLength * 0.4;

    // Generate the { shape using 4 Bezier curves:
    // 1. Start -> quarter point (curving outward)
    // 2. Quarter point -> tip (sharp curve)
    // 3. Tip -> three-quarter point (sharp curve back)
    // 4. Three-quarter point -> end (curving inward)

    // Quarter point
    const q1: Vector3Tuple = [
      start[0] + tangent[0] * quarterLength,
      start[1] + tangent[1] * quarterLength,
      start[2],
    ];

    // Three-quarter point
    const q3: Vector3Tuple = [
      start[0] + tangent[0] * quarterLength * 3,
      start[1] + tangent[1] * quarterLength * 3,
      start[2],
    ];

    // Curve 1: Start to quarter point (gentle curve outward)
    const c1_h1: number[] = [
      start[0] + tangent[0] * curveWidth,
      start[1] + tangent[1] * curveWidth,
      start[2],
    ];
    const c1_h2: number[] = [
      q1[0] - tangent[0] * curveWidth + direction[0] * controlDepth,
      q1[1] - tangent[1] * curveWidth + direction[1] * controlDepth,
      q1[2],
    ];
    const c1_end: number[] = [
      q1[0] + direction[0] * controlDepth,
      q1[1] + direction[1] * controlDepth,
      q1[2],
    ];

    // Curve 2: Quarter point to tip (sharp curve to peak)
    const c2_h1: number[] = [
      c1_end[0] + tangent[0] * quarterLength * 0.3,
      c1_end[1] + tangent[1] * quarterLength * 0.3,
      c1_end[2],
    ];
    const c2_h2: number[] = [
      this._tipPoint[0] - tangent[0] * quarterLength * 0.3,
      this._tipPoint[1] - tangent[1] * quarterLength * 0.3,
      this._tipPoint[2],
    ];

    // Curve 3: Tip to three-quarter point (sharp curve down)
    const c3_h1: number[] = [
      this._tipPoint[0] + tangent[0] * quarterLength * 0.3,
      this._tipPoint[1] + tangent[1] * quarterLength * 0.3,
      this._tipPoint[2],
    ];
    const c3_end: number[] = [
      q3[0] + direction[0] * controlDepth,
      q3[1] + direction[1] * controlDepth,
      q3[2],
    ];
    const c3_h2: number[] = [
      c3_end[0] - tangent[0] * quarterLength * 0.3,
      c3_end[1] - tangent[1] * quarterLength * 0.3,
      c3_end[2],
    ];

    // Curve 4: Three-quarter point to end (gentle curve inward)
    const c4_h1: number[] = [
      c3_end[0] + tangent[0] * curveWidth - direction[0] * controlDepth,
      c3_end[1] + tangent[1] * curveWidth - direction[1] * controlDepth,
      c3_end[2],
    ];
    const c4_h2: number[] = [
      end[0] - tangent[0] * curveWidth,
      end[1] - tangent[1] * curveWidth,
      end[2],
    ];

    // Assemble all points
    // Curve 1
    points.push([...start]);
    points.push(c1_h1);
    points.push(c1_h2);
    points.push(c1_end);

    // Curve 2
    points.push(c2_h1);
    points.push(c2_h2);
    points.push([...this._tipPoint]);

    // Curve 3
    points.push(c3_h1);
    points.push(c3_h2);
    points.push(c3_end);

    // Curve 4
    points.push(c4_h1);
    points.push(c4_h2);
    points.push([...end]);

    this.setPoints3D(points);
  }

  /**
   * Get the tip point of the brace (the peak of the { shape)
   * @returns Tip point as [x, y, z]
   */
  getTip(): Vector3Tuple {
    return [...this._tipPoint];
  }

  /**
   * Get the direction the brace is facing
   * @returns Direction as normalized [x, y, z]
   */
  getDirection(): Vector3Tuple {
    const mag = Math.sqrt(
      this.braceDirection[0] ** 2 +
      this.braceDirection[1] ** 2 +
      this.braceDirection[2] ** 2
    );
    return [
      this.braceDirection[0] / mag,
      this.braceDirection[1] / mag,
      this.braceDirection[2] / mag,
    ];
  }

  /**
   * Create a copy of this Brace
   */
  protected override _createCopy(): Brace {
    const brace = new Brace(this.mobject!, {
      direction: this.braceDirection,
      buff: this.buff,
      color: this.color,
      strokeWidth: this.strokeWidth,
      sharpness: this.sharpness,
    });
    return brace;
  }
}


/**
 * BraceBetweenPoints - A curly brace between two arbitrary points
 *
 * Similar to Brace but allows specifying exact endpoints.
 *
 * @example
 * ```typescript
 * // Create a brace between two points
 * const brace = new BraceBetweenPoints({
 *   start: [-2, 0, 0],
 *   end: [2, 0, 0],
 *   direction: DOWN,
 * });
 * ```
 */
export class BraceBetweenPoints extends VMobject {
  protected _start: Vector3Tuple;
  protected _end: Vector3Tuple;
  protected _direction: Vector3Tuple;
  protected _buff: number;
  protected _sharpness: number;
  protected _tipPoint: Vector3Tuple;

  constructor(options: BraceBetweenPointsOptions) {
    super();

    const {
      start,
      end,
      direction,
      buff = 0.2,
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      sharpness = 2,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._buff = buff;
    this._sharpness = sharpness;
    this._tipPoint = [0, 0, 0];

    // If direction not specified, compute perpendicular to line
    if (direction) {
      this._direction = [...direction];
    } else {
      // Default direction is perpendicular to the line (pointing "down" relative to start->end)
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 1e-6) {
        this._direction = [-dy / length, dx / length, 0];
      } else {
        this._direction = [0, -1, 0];
      }
    }

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generateBracePoints();
  }

  /**
   * Generate the Bezier curve points for the curly brace shape
   */
  protected _generateBracePoints(): void {
    // Normalize direction
    const dirMag = Math.sqrt(
      this._direction[0] ** 2 +
      this._direction[1] ** 2 +
      this._direction[2] ** 2
    );
    const normDir: Vector3Tuple = [
      this._direction[0] / dirMag,
      this._direction[1] / dirMag,
      this._direction[2] / dirMag,
    ];

    // Apply buff offset
    const adjustedStart: Vector3Tuple = [
      this._start[0] + normDir[0] * this._buff,
      this._start[1] + normDir[1] * this._buff,
      this._start[2],
    ];
    const adjustedEnd: Vector3Tuple = [
      this._end[0] + normDir[0] * this._buff,
      this._end[1] + normDir[1] * this._buff,
      this._end[2],
    ];

    this._generateBraceFromPoints(adjustedStart, adjustedEnd, normDir);
  }

  /**
   * Generate the brace shape between two points (same algorithm as Brace)
   */
  protected _generateBraceFromPoints(
    start: Vector3Tuple,
    end: Vector3Tuple,
    direction: Vector3Tuple
  ): void {
    const points: number[][] = [];

    // Calculate mid point and tip position
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    // The brace extends outward in the direction
    const tipDepth = 0.25 * this._sharpness;
    this._tipPoint = [
      midX + direction[0] * tipDepth,
      midY + direction[1] * tipDepth,
      midZ,
    ];

    // Vector from start to end
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1e-6) {
      this.setPoints3D([[...start], [...start], [...start], [...start]]);
      return;
    }

    // Unit vectors
    const tangent: Vector3Tuple = [dx / length, dy / length, 0];

    // Control point distances
    const quarterLength = length / 4;
    const controlDepth = tipDepth * 0.5;
    const curveWidth = quarterLength * 0.4;

    // Quarter point
    const q1: Vector3Tuple = [
      start[0] + tangent[0] * quarterLength,
      start[1] + tangent[1] * quarterLength,
      start[2],
    ];

    // Three-quarter point
    const q3: Vector3Tuple = [
      start[0] + tangent[0] * quarterLength * 3,
      start[1] + tangent[1] * quarterLength * 3,
      start[2],
    ];

    // Curve 1: Start to quarter point
    const c1_h1: number[] = [
      start[0] + tangent[0] * curveWidth,
      start[1] + tangent[1] * curveWidth,
      start[2],
    ];
    const c1_h2: number[] = [
      q1[0] - tangent[0] * curveWidth + direction[0] * controlDepth,
      q1[1] - tangent[1] * curveWidth + direction[1] * controlDepth,
      q1[2],
    ];
    const c1_end: number[] = [
      q1[0] + direction[0] * controlDepth,
      q1[1] + direction[1] * controlDepth,
      q1[2],
    ];

    // Curve 2: Quarter point to tip
    const c2_h1: number[] = [
      c1_end[0] + tangent[0] * quarterLength * 0.3,
      c1_end[1] + tangent[1] * quarterLength * 0.3,
      c1_end[2],
    ];
    const c2_h2: number[] = [
      this._tipPoint[0] - tangent[0] * quarterLength * 0.3,
      this._tipPoint[1] - tangent[1] * quarterLength * 0.3,
      this._tipPoint[2],
    ];

    // Curve 3: Tip to three-quarter point
    const c3_h1: number[] = [
      this._tipPoint[0] + tangent[0] * quarterLength * 0.3,
      this._tipPoint[1] + tangent[1] * quarterLength * 0.3,
      this._tipPoint[2],
    ];
    const c3_end: number[] = [
      q3[0] + direction[0] * controlDepth,
      q3[1] + direction[1] * controlDepth,
      q3[2],
    ];
    const c3_h2: number[] = [
      c3_end[0] - tangent[0] * quarterLength * 0.3,
      c3_end[1] - tangent[1] * quarterLength * 0.3,
      c3_end[2],
    ];

    // Curve 4: Three-quarter point to end
    const c4_h1: number[] = [
      c3_end[0] + tangent[0] * curveWidth - direction[0] * controlDepth,
      c3_end[1] + tangent[1] * curveWidth - direction[1] * controlDepth,
      c3_end[2],
    ];
    const c4_h2: number[] = [
      end[0] - tangent[0] * curveWidth,
      end[1] - tangent[1] * curveWidth,
      end[2],
    ];

    // Assemble all points
    points.push([...start]);
    points.push(c1_h1);
    points.push(c1_h2);
    points.push(c1_end);

    points.push(c2_h1);
    points.push(c2_h2);
    points.push([...this._tipPoint]);

    points.push(c3_h1);
    points.push(c3_h2);
    points.push(c3_end);

    points.push(c4_h1);
    points.push(c4_h2);
    points.push([...end]);

    this.setPoints3D(points);
  }

  /**
   * Get the tip point of the brace
   * @returns Tip point as [x, y, z]
   */
  getTip(): Vector3Tuple {
    return [...this._tipPoint];
  }

  /**
   * Get the direction the brace is facing
   * @returns Direction as normalized [x, y, z]
   */
  getDirection(): Vector3Tuple {
    const mag = Math.sqrt(
      this._direction[0] ** 2 +
      this._direction[1] ** 2 +
      this._direction[2] ** 2
    );
    return [
      this._direction[0] / mag,
      this._direction[1] / mag,
      this._direction[2] / mag,
    ];
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Get the end point
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Create a copy of this BraceBetweenPoints
   */
  protected override _createCopy(): BraceBetweenPoints {
    return new BraceBetweenPoints({
      start: this._start,
      end: this._end,
      direction: this._direction,
      buff: this._buff,
      color: this.color,
      strokeWidth: this.strokeWidth,
      sharpness: this._sharpness,
    });
  }
}


/**
 * ArcBrace - A curly brace that follows an arc
 *
 * Creates a brace that curves along an arc, useful for indicating
 * angles or sections of circular arrangements.
 *
 * @example
 * ```typescript
 * // Create an arc brace on the outside of an arc
 * const arc = new Arc({ radius: 2, angle: Math.PI / 2 });
 * const brace = new ArcBrace({ arc });
 *
 * // Create an arc brace on the inside
 * const innerBrace = new ArcBrace({ arc, direction: -1 });
 * ```
 */
export class ArcBrace extends VMobject {
  protected _arc: Arc;
  protected _direction: number;
  protected _buff: number;
  protected _tipPoint: Vector3Tuple;

  constructor(options: ArcBraceOptions) {
    super();

    const {
      arc,
      direction = 1,
      buff = 0.2,
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    this._arc = arc;
    this._direction = direction;
    this._buff = buff;
    this._tipPoint = [0, 0, 0];

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generateArcBracePoints();
  }

  /**
   * Generate points for the arc brace
   */
  protected _generateArcBracePoints(): void {
    const points: number[][] = [];

    const center = this._arc.getArcCenter();
    const radius = this._arc.getRadius();
    const startAngle = this._arc.getStartAngle();
    const arcAngle = this._arc.getAngle();

    // Brace radius is offset from arc
    const braceRadius = radius + this._direction * this._buff;
    const tipRadius = braceRadius + this._direction * 0.2;

    // Key angles
    const midAngle = startAngle + arcAngle / 2;
    const q1Angle = startAngle + arcAngle / 4;
    const q3Angle = startAngle + 3 * arcAngle / 4;

    // Calculate tip point (at middle of arc)
    this._tipPoint = [
      center[0] + tipRadius * Math.cos(midAngle),
      center[1] + tipRadius * Math.sin(midAngle),
      center[2],
    ];

    // Start and end points on the brace
    const braceStart: Vector3Tuple = [
      center[0] + braceRadius * Math.cos(startAngle),
      center[1] + braceRadius * Math.sin(startAngle),
      center[2],
    ];

    const braceEnd: Vector3Tuple = [
      center[0] + braceRadius * Math.cos(startAngle + arcAngle),
      center[1] + braceRadius * Math.sin(startAngle + arcAngle),
      center[2],
    ];

    // Quarter points
    const q1Point: Vector3Tuple = [
      center[0] + braceRadius * Math.cos(q1Angle),
      center[1] + braceRadius * Math.sin(q1Angle),
      center[2],
    ];

    const q3Point: Vector3Tuple = [
      center[0] + braceRadius * Math.cos(q3Angle),
      center[1] + braceRadius * Math.sin(q3Angle),
      center[2],
    ];

    // Kappa for arc approximation
    const segmentAngle = arcAngle / 4;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    // Generate 4 Bezier curves
    // Curve 1: Start to quarter
    const tangentStart: Vector3Tuple = [-Math.sin(startAngle), Math.cos(startAngle), 0];
    const tangentQ1: Vector3Tuple = [-Math.sin(q1Angle), Math.cos(q1Angle), 0];

    points.push([...braceStart]);
    points.push([
      braceStart[0] + kappa * braceRadius * tangentStart[0],
      braceStart[1] + kappa * braceRadius * tangentStart[1],
      braceStart[2],
    ]);
    points.push([
      q1Point[0] - kappa * braceRadius * tangentQ1[0],
      q1Point[1] - kappa * braceRadius * tangentQ1[1],
      q1Point[2],
    ]);
    points.push([...q1Point]);

    // Curve 2: Quarter to tip
    const tangentMid: Vector3Tuple = [-Math.sin(midAngle), Math.cos(midAngle), 0];
    const q1ToMidKappa = kappa * 0.5;

    points.push([
      q1Point[0] + q1ToMidKappa * braceRadius * tangentQ1[0],
      q1Point[1] + q1ToMidKappa * braceRadius * tangentQ1[1],
      q1Point[2],
    ]);
    points.push([
      this._tipPoint[0] - q1ToMidKappa * tipRadius * tangentMid[0],
      this._tipPoint[1] - q1ToMidKappa * tipRadius * tangentMid[1],
      this._tipPoint[2],
    ]);
    points.push([...this._tipPoint]);

    // Curve 3: Tip to three-quarter
    const tangentQ3: Vector3Tuple = [-Math.sin(q3Angle), Math.cos(q3Angle), 0];

    points.push([
      this._tipPoint[0] + q1ToMidKappa * tipRadius * tangentMid[0],
      this._tipPoint[1] + q1ToMidKappa * tipRadius * tangentMid[1],
      this._tipPoint[2],
    ]);
    points.push([
      q3Point[0] - q1ToMidKappa * braceRadius * tangentQ3[0],
      q3Point[1] - q1ToMidKappa * braceRadius * tangentQ3[1],
      q3Point[2],
    ]);
    points.push([...q3Point]);

    // Curve 4: Three-quarter to end
    const tangentEnd: Vector3Tuple = [-Math.sin(startAngle + arcAngle), Math.cos(startAngle + arcAngle), 0];

    points.push([
      q3Point[0] + kappa * braceRadius * tangentQ3[0],
      q3Point[1] + kappa * braceRadius * tangentQ3[1],
      q3Point[2],
    ]);
    points.push([
      braceEnd[0] - kappa * braceRadius * tangentEnd[0],
      braceEnd[1] - kappa * braceRadius * tangentEnd[1],
      braceEnd[2],
    ]);
    points.push([...braceEnd]);

    this.setPoints3D(points);
  }

  /**
   * Get the tip point of the arc brace
   * @returns Tip point as [x, y, z]
   */
  getTip(): Vector3Tuple {
    return [...this._tipPoint];
  }

  /**
   * Get the direction (1 = outside, -1 = inside)
   */
  getDirection(): number {
    return this._direction;
  }

  /**
   * Create a copy of this ArcBrace
   */
  protected override _createCopy(): ArcBrace {
    return new ArcBrace({
      arc: this._arc,
      direction: this._direction,
      buff: this._buff,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}


/**
 * BraceLabel - A brace with an attached label
 *
 * Creates a curly brace with a text or mobject label positioned
 * at the tip of the brace.
 *
 * @example
 * ```typescript
 * // Create a labeled brace
 * const rect = new Rectangle({ width: 3, height: 2 });
 * const brace = new BraceLabel(rect, {
 *   label: 'width',
 *   direction: DOWN,
 * });
 *
 * // Access the label
 * const label = brace.getLabel();
 * ```
 */
export class BraceLabel extends Group {
  protected _brace: Brace;
  protected _label: Mobject | null;
  protected _labelBuff: number;

  constructor(mobject: Mobject, options: BraceLabelOptions = {}) {
    super();

    const {
      label = '',
      fontSize = 36,
      labelBuff = 0.2,
      labelColor = WHITE,
      direction = DOWN,
      buff = 0.2,
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      sharpness = 2,
    } = options;

    this._labelBuff = labelBuff;

    // Create the brace
    this._brace = new Brace(mobject, {
      direction,
      buff,
      color,
      strokeWidth,
      sharpness,
    });
    this.add(this._brace);

    // Create or use the label
    if (typeof label === 'string' && label.length > 0) {
      this._label = new Text({
        text: label,
        fontSize,
        color: labelColor,
      });
      this._positionLabel();
      this.add(this._label);
    } else if (label instanceof Mobject) {
      this._label = label;
      this._positionLabel();
      this.add(this._label);
    } else {
      this._label = null;
    }
  }

  /**
   * Position the label at the tip of the brace
   */
  protected _positionLabel(): void {
    if (!this._label) return;

    const tip = this._brace.getTip();
    const normDir = this._brace.getDirection();

    // Position label beyond the tip
    this._label.moveTo([
      tip[0] + normDir[0] * this._labelBuff,
      tip[1] + normDir[1] * this._labelBuff,
      tip[2],
    ]);
  }

  /**
   * Get the brace component
   */
  getBrace(): Brace {
    return this._brace;
  }

  /**
   * Get the label component
   */
  getLabel(): Mobject | null {
    return this._label;
  }

  /**
   * Get the tip point of the brace
   */
  getTip(): Vector3Tuple {
    return this._brace.getTip();
  }

  /**
   * Create a copy of this BraceLabel
   */
  protected override _createCopy(): BraceLabel {
    // This is a simplified copy - full implementation would need to
    // recreate with the original mobject
    const copy = new BraceLabel(this._brace.mobject!, {
      direction: this._brace.braceDirection,
      buff: this._brace.buff,
      color: this._brace.color,
      strokeWidth: this._brace.strokeWidth,
      sharpness: this._brace.sharpness,
      labelBuff: this._labelBuff,
    });
    return copy;
  }
}


/**
 * BraceText - Alias for BraceLabel with text
 *
 * A convenience class that is identical to BraceLabel.
 * Provided for API compatibility with Manim.
 *
 * @example
 * ```typescript
 * // These are equivalent:
 * const brace1 = new BraceLabel(mobject, { label: 'text' });
 * const brace2 = new BraceText(mobject, 'text');
 * ```
 */
export class BraceText extends BraceLabel {
  constructor(
    mobject: Mobject,
    text: string,
    options: Omit<BraceLabelOptions, 'label'> = {}
  ) {
    super(mobject, { ...options, label: text });
  }

  /**
   * Create a copy of this BraceText
   */
  protected override _createCopy(): BraceText {
    const labelText = this._label instanceof Text
      ? (this._label as Text).getText()
      : '';
    return new BraceText(this._brace.mobject!, labelText, {
      direction: this._brace.braceDirection,
      buff: this._brace.buff,
      color: this._brace.color,
      strokeWidth: this._brace.strokeWidth,
      sharpness: this._brace.sharpness,
      labelBuff: this._labelBuff,
    });
  }
}

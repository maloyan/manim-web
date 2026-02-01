import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple, DOWN } from '../../core/Mobject';
import { Group } from '../../core/Group';
import { Text } from '../text/Text';
import { MathTex } from '../text/MathTex';
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
 * Get key points from a mobject for brace placement.
 * Uses actual VMobject points when available, falls back to bounding box corners.
 */
function getMobjectKeyPoints(mobject: Mobject): number[][] {
  // If it's a VMobject with accessible points, use those
  if (mobject instanceof VMobject) {
    const pts = (mobject as VMobject).getPoints();
    if (pts.length > 0) return pts;
  }
  // Fallback: use bounding box corners from the mobject
  const center = mobject.getCenter();
  let w = 1, h = 1;
  if (typeof (mobject as any)._getBoundingBox === 'function') {
    const bb = (mobject as any)._getBoundingBox();
    w = bb.width;
    h = bb.height;
  }
  return [
    [center[0] - w/2, center[1] - h/2, center[2]],
    [center[0] + w/2, center[1] - h/2, center[2]],
    [center[0] + w/2, center[1] + h/2, center[2]],
    [center[0] - w/2, center[1] + h/2, center[2]],
  ];
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
      strokeWidth = 1,
      sharpness = 2,
    } = options;

    this.mobject = mobject;
    this.braceDirection = [...direction];
    this.buff = buff;
    this.sharpness = sharpness;
    this._tipPoint = [0, 0, 0];

    this.color = color;
    this.fillOpacity = 1;
    this.strokeWidth = 0;

    this._generateBracePoints();
  }

  /**
   * Generate the Bezier curve points for the curly brace shape.
   * Projects the mobject's actual points onto the brace's perpendicular axis
   * to correctly handle diagonal and arbitrarily-oriented mobjects.
   */
  protected _generateBracePoints(): void {
    if (!this.mobject) return;

    const mobjectCenter = this.mobject.getCenter();
    const keyPoints = getMobjectKeyPoints(this.mobject);

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

    // Perpendicular direction (tangent along which the brace spans)
    const perpDir: Vector3Tuple = [-normDir[1], normDir[0], 0];

    // Project all key points onto normDir and perpDir (relative to center)
    let maxNormProj = -Infinity;
    let minPerpProj = Infinity;
    let maxPerpProj = -Infinity;

    for (const p of keyPoints) {
      const dx = p[0] - mobjectCenter[0];
      const dy = p[1] - mobjectCenter[1];
      const normProj = dx * normDir[0] + dy * normDir[1];
      const perpProj = dx * perpDir[0] + dy * perpDir[1];
      if (normProj > maxNormProj) maxNormProj = normProj;
      if (perpProj < minPerpProj) minPerpProj = perpProj;
      if (perpProj > maxPerpProj) maxPerpProj = perpProj;
    }

    // Brace is placed just beyond the mobject's extent in normDir
    const offset = maxNormProj + this.buff;

    const braceStart: Vector3Tuple = [
      mobjectCenter[0] + normDir[0] * offset + perpDir[0] * minPerpProj,
      mobjectCenter[1] + normDir[1] * offset + perpDir[1] * minPerpProj,
      mobjectCenter[2],
    ];

    const braceEnd: Vector3Tuple = [
      mobjectCenter[0] + normDir[0] * offset + perpDir[0] * maxPerpProj,
      mobjectCenter[1] + normDir[1] * offset + perpDir[1] * maxPerpProj,
      mobjectCenter[2],
    ];

    this._generateBraceFromPoints(braceStart, braceEnd, normDir);
  }

  /**
   * Generate the brace shape between two points as a filled outline.
   *
   * Creates a curly brace using cubic Bezier curves that match
   * the Manim CE brace proportions. The shape is rendered as a filled
   * closed path with variable thickness:
   * - Thin at the end curls (tapering to points)
   * - Thick at the arm sections
   * - Thin at the center tip (tapering to a point)
   */
  protected _generateBraceFromPoints(
    start: Vector3Tuple,
    end: Vector3Tuple,
    direction: Vector3Tuple
  ): void {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1e-6) {
      this.setPoints3D([[...start], [...start], [...start], [...start]]);
      return;
    }

    const t: Vector3Tuple = [dx / length, dy / length, 0]; // tangent
    const n = direction; // normal (toward tip)

    // Fixed centerline heights from Manim CE SVG analysis
    const CURL_HEIGHT = 0.14;
    const TIP_HEIGHT = 0.25;
    const tipProt = TIP_HEIGHT - CURL_HEIGHT;

    // Compute widths based on Manim CE formula
    const SVG_MIN_WIDTH = 0.90552;
    const linearSection = Math.max(0, (length * this.sharpness - SVG_MIN_WIDTH) / 2);
    const svgTotalWidth = SVG_MIN_WIDTH + 2 * linearSection;
    const wScale = length / svgTotalWidth;

    // Scaled section widths
    const curlW = 0.23 * wScale;
    const tipTransW = 0.22 * wScale;
    const armLen = linearSection * wScale;

    // Tip point
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    this._tipPoint = [
      midX + n[0] * TIP_HEIGHT,
      midY + n[1] * TIP_HEIGHT,
      midZ,
    ];

    // Helper: point at offset along tangent and normal from origin
    const pt = (ox: number[], td: number, nd: number): number[] => [
      ox[0] + t[0] * td + n[0] * nd,
      ox[1] + t[1] * td + n[1] * nd,
      ox[2],
    ];

    // Centerline anchor points
    const lArmStart = pt(start, curlW, CURL_HEIGHT);
    const lArmEnd = pt(lArmStart, armLen, 0);
    const rArmEnd = pt(end, -curlW, CURL_HEIGHT);
    const rArmStart = pt(rArmEnd, -armLen, 0);

    // Centerline control points
    const c1_h1 = pt(start, curlW * 0.30, CURL_HEIGHT * 0.85);
    const c1_h2 = pt(start, curlW * 0.78, CURL_HEIGHT * 1.0);
    const c2_h1 = pt(lArmStart, armLen / 3, 0);
    const c2_h2 = pt(lArmStart, armLen * 2 / 3, 0);
    const c3_h1 = pt(lArmEnd, tipTransW * 0.55, tipProt * 0.05);
    const c3_h2: number[] = [
      this._tipPoint[0] - t[0] * tipTransW * 0.02 - n[0] * tipProt * 0.45,
      this._tipPoint[1] - t[1] * tipTransW * 0.02 - n[1] * tipProt * 0.45,
      this._tipPoint[2],
    ];
    const c4_h1: number[] = [
      this._tipPoint[0] + t[0] * tipTransW * 0.02 - n[0] * tipProt * 0.45,
      this._tipPoint[1] + t[1] * tipTransW * 0.02 - n[1] * tipProt * 0.45,
      this._tipPoint[2],
    ];
    const c4_h2 = pt(rArmStart, -tipTransW * 0.55, tipProt * 0.05);
    const c5_h1 = pt(rArmStart, armLen / 3, 0);
    const c5_h2 = pt(rArmStart, armLen * 2 / 3, 0);
    const c6_h1 = pt(end, -curlW * 0.78, CURL_HEIGHT * 1.0);
    const c6_h2 = pt(end, -curlW * 0.30, CURL_HEIGHT * 0.85);

    // All 19 centerline points
    const cl: number[][] = [
      [...start], c1_h1, c1_h2, lArmStart,
      c2_h1, c2_h2, lArmEnd,
      c3_h1, c3_h2, [...this._tipPoint],
      c4_h1, c4_h2, rArmStart,
      c5_h1, c5_h2, rArmEnd,
      c6_h1, c6_h2, [...end],
    ];

    // Half-thickness at each point (0 at ends/tip, max at arms)
    const H = 0.025;
    const ht = [
      0, H*0.3, H*0.8, H,         // curl → arm start
      H, H, H,                     // arm
      H*0.7, H*0.15, 0,            // tip transition → tip
      H*0.15, H*0.7, H,            // tip → arm start
      H, H, H,                     // arm
      H*0.8, H*0.3, 0,             // arm end → curl edge
    ];

    // Per-point normals (perpendicular to local tangent, pointing outward)
    const normals: number[][] = [];
    for (let i = 0; i < 19; i++) {
      const prev = cl[Math.max(0, i - 1)];
      const next = cl[Math.min(18, i + 1)];
      const ddx = next[0] - prev[0];
      const ddy = next[1] - prev[1];
      const len = Math.sqrt(ddx * ddx + ddy * ddy);
      if (len < 1e-10) {
        normals.push([n[0], n[1]]);
        continue;
      }
      const tx = ddx / len;
      const ty = ddy / len;
      let nx = -ty, ny = tx;
      // Ensure normal points outward (same side as n)
      if (nx * n[0] + ny * n[1] < 0) { nx = -nx; ny = -ny; }
      normals.push([nx, ny]);
    }

    // Compute upper (outer) and lower (inner) contour points
    const upper: number[][] = [];
    const lower: number[][] = [];
    for (let i = 0; i < 19; i++) {
      const h = ht[i];
      upper.push([
        cl[i][0] + normals[i][0] * h,
        cl[i][1] + normals[i][1] * h,
        cl[i][2],
      ]);
      lower.push([
        cl[i][0] - normals[i][0] * h,
        cl[i][1] - normals[i][1] * h,
        cl[i][2],
      ]);
    }

    // Closed filled path: upper contour forward + lower contour reversed
    this.setPoints3D([
      upper[0],
      upper[1],  upper[2],  upper[3],   // curve 1
      upper[4],  upper[5],  upper[6],   // curve 2
      upper[7],  upper[8],  upper[9],   // curve 3
      upper[10], upper[11], upper[12],  // curve 4
      upper[13], upper[14], upper[15],  // curve 5
      upper[16], upper[17], upper[18],  // curve 6
      // Lower contour reversed (right to left)
      lower[17], lower[16], lower[15],  // curve 6 rev
      lower[14], lower[13], lower[12],  // curve 5 rev
      lower[11], lower[10], lower[9],   // curve 4 rev
      lower[8],  lower[7],  lower[6],   // curve 3 rev
      lower[5],  lower[4],  lower[3],   // curve 2 rev
      lower[2],  lower[1],  lower[0],   // curve 1 rev
    ]);
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
   * Create a Text label positioned at the tip of the brace.
   * Mirrors Manim's Brace.get_text() API.
   */
  getText(text: string, options: { fontSize?: number; color?: string; buff?: number } = {}): Text {
    const { fontSize = 36, color = WHITE, buff = 0.4 } = options;
    const tip = this.getTip();
    const dir = this.getDirection();
    const label = new Text({ text, fontSize, color });
    label.moveTo([
      tip[0] + dir[0] * buff,
      tip[1] + dir[1] * buff,
      tip[2],
    ]);
    return label;
  }

  /**
   * Create a MathTex label positioned at the tip of the brace.
   * Mirrors Manim's Brace.get_tex() API.
   */
  getTex(latex: string, options: { fontSize?: number; color?: string; buff?: number } = {}): MathTex {
    const { fontSize = 36, color = WHITE, buff = 0.4 } = options;
    const tip = this.getTip();
    const dir = this.getDirection();
    const label = new MathTex({ latex, fontSize, color });
    label.moveTo([
      tip[0] + dir[0] * buff,
      tip[1] + dir[1] * buff,
      tip[2],
    ]);
    return label;
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
      strokeWidth = 1,
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
    this.fillOpacity = 1;
    this.strokeWidth = 0;

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
   * Generate the brace shape between two points as a filled outline.
   * Same algorithm as Brace._generateBraceFromPoints.
   */
  protected _generateBraceFromPoints(
    start: Vector3Tuple,
    end: Vector3Tuple,
    direction: Vector3Tuple
  ): void {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 1e-6) {
      this.setPoints3D([[...start], [...start], [...start], [...start]]);
      return;
    }

    const t: Vector3Tuple = [dx / length, dy / length, 0];
    const n = direction;

    const CURL_HEIGHT = 0.14;
    const TIP_HEIGHT = 0.25;
    const SVG_MIN_WIDTH = 0.90552;
    const linearSection = Math.max(0, (length * this._sharpness - SVG_MIN_WIDTH) / 2);
    const svgTotalWidth = SVG_MIN_WIDTH + 2 * linearSection;
    const wScale = length / svgTotalWidth;

    const curlW = 0.23 * wScale;
    const tipTransW = 0.22 * wScale;
    const armLen = linearSection * wScale;
    const tipProt = TIP_HEIGHT - CURL_HEIGHT;

    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    this._tipPoint = [midX + n[0] * TIP_HEIGHT, midY + n[1] * TIP_HEIGHT, midZ];

    const pt = (ox: number[], td: number, nd: number): number[] => [
      ox[0] + t[0] * td + n[0] * nd,
      ox[1] + t[1] * td + n[1] * nd,
      ox[2],
    ];

    const lArmStart = pt(start, curlW, CURL_HEIGHT);
    const lArmEnd = pt(lArmStart, armLen, 0);
    const rArmEnd = pt(end, -curlW, CURL_HEIGHT);
    const rArmStart = pt(rArmEnd, -armLen, 0);

    const c1_h1 = pt(start, curlW * 0.30, CURL_HEIGHT * 0.85);
    const c1_h2 = pt(start, curlW * 0.78, CURL_HEIGHT * 1.0);
    const c2_h1 = pt(lArmStart, armLen / 3, 0);
    const c2_h2 = pt(lArmStart, armLen * 2 / 3, 0);
    const c3_h1 = pt(lArmEnd, tipTransW * 0.55, tipProt * 0.05);
    const c3_h2: number[] = [
      this._tipPoint[0] - t[0] * tipTransW * 0.02 - n[0] * tipProt * 0.45,
      this._tipPoint[1] - t[1] * tipTransW * 0.02 - n[1] * tipProt * 0.45,
      this._tipPoint[2],
    ];
    const c4_h1: number[] = [
      this._tipPoint[0] + t[0] * tipTransW * 0.02 - n[0] * tipProt * 0.45,
      this._tipPoint[1] + t[1] * tipTransW * 0.02 - n[1] * tipProt * 0.45,
      this._tipPoint[2],
    ];
    const c4_h2 = pt(rArmStart, -tipTransW * 0.55, tipProt * 0.05);
    const c5_h1 = pt(rArmStart, armLen / 3, 0);
    const c5_h2 = pt(rArmStart, armLen * 2 / 3, 0);
    const c6_h1 = pt(end, -curlW * 0.78, CURL_HEIGHT * 1.0);
    const c6_h2 = pt(end, -curlW * 0.30, CURL_HEIGHT * 0.85);

    // All 19 centerline points
    const cl: number[][] = [
      [...start], c1_h1, c1_h2, lArmStart,
      c2_h1, c2_h2, lArmEnd,
      c3_h1, c3_h2, [...this._tipPoint],
      c4_h1, c4_h2, rArmStart,
      c5_h1, c5_h2, rArmEnd,
      c6_h1, c6_h2, [...end],
    ];

    // Half-thickness at each point (0 at ends/tip, max at arms)
    const H = 0.025;
    const ht = [
      0, H*0.3, H*0.8, H,
      H, H, H,
      H*0.7, H*0.15, 0,
      H*0.15, H*0.7, H,
      H, H, H,
      H*0.8, H*0.3, 0,
    ];

    // Per-point normals
    const normals: number[][] = [];
    for (let i = 0; i < 19; i++) {
      const prev = cl[Math.max(0, i - 1)];
      const next = cl[Math.min(18, i + 1)];
      const ddx = next[0] - prev[0];
      const ddy = next[1] - prev[1];
      const len = Math.sqrt(ddx * ddx + ddy * ddy);
      if (len < 1e-10) {
        normals.push([n[0], n[1]]);
        continue;
      }
      const tx = ddx / len;
      const ty = ddy / len;
      let nx = -ty, ny = tx;
      if (nx * n[0] + ny * n[1] < 0) { nx = -nx; ny = -ny; }
      normals.push([nx, ny]);
    }

    const upper: number[][] = [];
    const lower: number[][] = [];
    for (let i = 0; i < 19; i++) {
      const h = ht[i];
      upper.push([cl[i][0] + normals[i][0]*h, cl[i][1] + normals[i][1]*h, cl[i][2]]);
      lower.push([cl[i][0] - normals[i][0]*h, cl[i][1] - normals[i][1]*h, cl[i][2]]);
    }

    this.setPoints3D([
      upper[0],
      upper[1],  upper[2],  upper[3],
      upper[4],  upper[5],  upper[6],
      upper[7],  upper[8],  upper[9],
      upper[10], upper[11], upper[12],
      upper[13], upper[14], upper[15],
      upper[16], upper[17], upper[18],
      lower[17], lower[16], lower[15],
      lower[14], lower[13], lower[12],
      lower[11], lower[10], lower[9],
      lower[8],  lower[7],  lower[6],
      lower[5],  lower[4],  lower[3],
      lower[2],  lower[1],  lower[0],
    ]);
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
      strokeWidth = 1,
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

import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Rectangle } from './Rectangle';
import { Line } from './Line';
import { YELLOW, BLACK, RED, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a BackgroundRectangle
 */
export interface BackgroundRectangleOptions {
  /** Padding around the mobject. Default: 0.2 */
  buff?: number;
  /** Background fill color. Default: BLACK (#000000) */
  color?: string;
  /** Fill opacity. Default: 0.75 */
  fillOpacity?: number;
  /** Stroke width. Default: 0 (no stroke) */
  strokeWidth?: number;
}

/**
 * BackgroundRectangle - A filled rectangle that appears behind a mobject
 *
 * Creates a rectangle sized to the bounding box of a mobject plus padding.
 * Useful for highlighting text or creating backgrounds for formulas.
 *
 * @example
 * ```typescript
 * const text = new Text({ text: 'Hello' });
 * const bg = new BackgroundRectangle(text, { fillOpacity: 0.8 });
 * scene.add(bg, text);
 * ```
 */
export class BackgroundRectangle extends Rectangle {
  private _targetMobject: Mobject;
  private _buff: number;

  constructor(mobject: Mobject, options: BackgroundRectangleOptions = {}) {
    const {
      buff = 0.2,
      color = BLACK,
      fillOpacity = 0.75,
      strokeWidth = 0,
    } = options;

    // Calculate initial dimensions from mobject bounding box
    const bounds = mobject['_getBoundingBox']();
    const center = mobject.getCenter();

    super({
      width: bounds.width + 2 * buff,
      height: bounds.height + 2 * buff,
      center,
      color,
      fillOpacity,
      strokeWidth,
    });

    this._targetMobject = mobject;
    this._buff = buff;

    // Add updater to track mobject changes
    this._addTrackingUpdater();
  }

  /**
   * Add an updater that tracks the target mobject's position and size
   */
  private _addTrackingUpdater(): void {
    this.addUpdater(() => {
      const bounds = this._targetMobject['_getBoundingBox']();
      const center = this._targetMobject.getCenter();

      this.setWidth(bounds.width + 2 * this._buff);
      this.setHeight(bounds.height + 2 * this._buff);
      this.setRectCenter(center);
    });
  }

  /**
   * Get the target mobject
   */
  getTargetMobject(): Mobject {
    return this._targetMobject;
  }

  /**
   * Get the buffer/padding
   */
  getBuff(): number {
    return this._buff;
  }

  /**
   * Set the buffer/padding
   */
  setBuff(value: number): this {
    this._buff = value;
    this._markDirty();
    return this;
  }

  /**
   * Create a copy of this BackgroundRectangle
   */
  protected override _createCopy(): BackgroundRectangle {
    return new BackgroundRectangle(this._targetMobject, {
      buff: this._buff,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a SurroundingRectangle
 */
export interface SurroundingRectangleOptions {
  /** Padding around the mobject. Default: 0.2 */
  buff?: number;
  /** Stroke color. Default: YELLOW */
  color?: string;
  /** Corner radius for rounded corners. Default: 0 (sharp corners) */
  cornerRadius?: number;
  /** Stroke width. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Fill opacity. Default: 0 (no fill) */
  fillOpacity?: number;
}

/**
 * SurroundingRectangle - A stroke rectangle that surrounds a mobject
 *
 * Creates a rectangle outline around a mobject, useful for highlighting
 * or drawing attention to elements.
 *
 * @example
 * ```typescript
 * const formula = new MathTex({ tex: 'E = mc^2' });
 * const rect = new SurroundingRectangle(formula, { color: YELLOW });
 * scene.add(formula, rect);
 * ```
 */
export class SurroundingRectangle extends VMobject {
  private _targetMobject: Mobject;
  private _buff: number;
  private _cornerRadius: number;
  private _rectWidth: number;
  private _rectHeight: number;
  private _centerPoint: Vector3Tuple;

  constructor(mobject: Mobject, options: SurroundingRectangleOptions = {}) {
    super();

    const {
      buff = 0.2,
      color = YELLOW,
      cornerRadius = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      fillOpacity = 0,
    } = options;

    this._targetMobject = mobject;
    this._buff = buff;
    this._cornerRadius = cornerRadius;

    // Calculate initial dimensions
    const bounds = mobject['_getBoundingBox']();
    this._rectWidth = bounds.width + 2 * buff;
    this._rectHeight = bounds.height + 2 * buff;
    this._centerPoint = mobject.getCenter();

    this.color = color;
    this.strokeWidth = strokeWidth;
    this.fillOpacity = fillOpacity;

    this._generatePoints();
    this._addTrackingUpdater();
  }

  /**
   * Generate rectangle points, with optional rounded corners
   */
  private _generatePoints(): void {
    const halfWidth = this._rectWidth / 2;
    const halfHeight = this._rectHeight / 2;
    const [cx, cy, cz] = this._centerPoint;
    const r = Math.min(this._cornerRadius, halfWidth, halfHeight);

    if (r <= 0) {
      // Sharp corners - standard rectangle
      this._generateSharpCornerPoints(cx, cy, cz, halfWidth, halfHeight);
    } else {
      // Rounded corners
      this._generateRoundedCornerPoints(cx, cy, cz, halfWidth, halfHeight, r);
    }
  }

  /**
   * Generate points for sharp corner rectangle
   */
  private _generateSharpCornerPoints(
    cx: number, cy: number, cz: number,
    halfWidth: number, halfHeight: number
  ): void {
    const topLeft: number[] = [cx - halfWidth, cy + halfHeight, cz];
    const topRight: number[] = [cx + halfWidth, cy + halfHeight, cz];
    const bottomRight: number[] = [cx + halfWidth, cy - halfHeight, cz];
    const bottomLeft: number[] = [cx - halfWidth, cy - halfHeight, cz];

    const points: number[][] = [];

    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (!isFirst) {
        points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
        points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
        points.push([...p1]);
      } else {
        points.push([...p0]);
        points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
        points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
        points.push([...p1]);
      }
    };

    addLineSegment(topLeft, topRight, true);
    addLineSegment(topRight, bottomRight, false);
    addLineSegment(bottomRight, bottomLeft, false);
    addLineSegment(bottomLeft, topLeft, false);

    this.setPoints3D(points);
  }

  /**
   * Generate points for rounded corner rectangle
   */
  private _generateRoundedCornerPoints(
    cx: number, cy: number, cz: number,
    halfWidth: number, halfHeight: number,
    r: number
  ): void {
    const points: number[][] = [];
    // Magic number for approximating circular arc with cubic Bezier
    const k = 0.5522847498;

    // Start at top-left corner, after the curve
    // Top-left corner arc center
    const tlCx = cx - halfWidth + r;
    const tlCy = cy + halfHeight - r;

    // Top-right corner arc center
    const trCx = cx + halfWidth - r;
    const trCy = cy + halfHeight - r;

    // Bottom-right corner arc center
    const brCx = cx + halfWidth - r;
    const brCy = cy - halfHeight + r;

    // Bottom-left corner arc center
    const blCx = cx - halfWidth + r;
    const blCy = cy - halfHeight + r;

    // Helper to add arc from angle1 to angle2
    const addArc = (arcCx: number, arcCy: number, startAngle: number, isFirst: boolean) => {
      // Each corner is a 90-degree arc
      const cosStart = Math.cos(startAngle);
      const sinStart = Math.sin(startAngle);
      const cosEnd = Math.cos(startAngle + Math.PI / 2);
      const sinEnd = Math.sin(startAngle + Math.PI / 2);

      const p0: number[] = [arcCx + r * cosStart, arcCy + r * sinStart, cz];
      const p3: number[] = [arcCx + r * cosEnd, arcCy + r * sinEnd, cz];

      // Control points for quarter circle
      const p1: number[] = [
        p0[0] - k * r * sinStart,
        p0[1] + k * r * cosStart,
        cz
      ];
      const p2: number[] = [
        p3[0] + k * r * sinEnd,
        p3[1] - k * r * cosEnd,
        cz
      ];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([...p1], [...p2], [...p3]);
    };

    // Helper to add line segment
    const addLine = (p0: number[], p1: number[]) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    // Top-left arc (starts pointing up, 90 degrees)
    addArc(tlCx, tlCy, Math.PI / 2, true);

    // Top edge
    addLine(
      [tlCx, cy + halfHeight, cz],
      [trCx, cy + halfHeight, cz]
    );

    // Top-right arc (starts pointing right, 0 degrees)
    addArc(trCx, trCy, 0, false);

    // Right edge
    addLine(
      [cx + halfWidth, trCy, cz],
      [cx + halfWidth, brCy, cz]
    );

    // Bottom-right arc (starts pointing down, -90 degrees)
    addArc(brCx, brCy, -Math.PI / 2, false);

    // Bottom edge
    addLine(
      [brCx, cy - halfHeight, cz],
      [blCx, cy - halfHeight, cz]
    );

    // Bottom-left arc (starts pointing left, 180 degrees)
    addArc(blCx, blCy, Math.PI, false);

    // Left edge (closing)
    addLine(
      [cx - halfWidth, blCy, cz],
      [cx - halfWidth, tlCy, cz]
    );

    this.setPoints3D(points);
  }

  /**
   * Add an updater that tracks the target mobject
   */
  private _addTrackingUpdater(): void {
    this.addUpdater(() => {
      const bounds = this._targetMobject['_getBoundingBox']();
      const center = this._targetMobject.getCenter();

      const newWidth = bounds.width + 2 * this._buff;
      const newHeight = bounds.height + 2 * this._buff;

      if (
        newWidth !== this._rectWidth ||
        newHeight !== this._rectHeight ||
        center[0] !== this._centerPoint[0] ||
        center[1] !== this._centerPoint[1] ||
        center[2] !== this._centerPoint[2]
      ) {
        this._rectWidth = newWidth;
        this._rectHeight = newHeight;
        this._centerPoint = center;
        this._generatePoints();
      }
    });
  }

  /**
   * Get the target mobject
   */
  getTargetMobject(): Mobject {
    return this._targetMobject;
  }

  /**
   * Get the buffer/padding
   */
  getBuff(): number {
    return this._buff;
  }

  /**
   * Set the buffer/padding
   */
  setBuff(value: number): this {
    this._buff = value;
    const bounds = this._targetMobject['_getBoundingBox']();
    this._rectWidth = bounds.width + 2 * value;
    this._rectHeight = bounds.height + 2 * value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the corner radius
   */
  getCornerRadius(): number {
    return this._cornerRadius;
  }

  /**
   * Set the corner radius
   */
  setCornerRadius(value: number): this {
    this._cornerRadius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this SurroundingRectangle
   */
  protected override _createCopy(): SurroundingRectangle {
    return new SurroundingRectangle(this._targetMobject, {
      buff: this._buff,
      color: this.color,
      cornerRadius: this._cornerRadius,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
    });
  }
}

/**
 * Options for creating an Underline
 */
export interface UnderlineOptions {
  /** Distance below the mobject. Default: 0.1 */
  buff?: number;
  /** How much to extend past the edges. Default: 0 */
  stretch?: number;
  /** Stroke color. Default: YELLOW */
  color?: string;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
}

/**
 * Underline - A line drawn beneath a mobject
 *
 * Creates a horizontal line positioned below a mobject, useful for
 * underlining text or formulas.
 *
 * @example
 * ```typescript
 * const text = new Text({ text: 'Important' });
 * const underline = new Underline(text, { color: RED });
 * scene.add(text, underline);
 * ```
 */
export class Underline extends Line {
  private _targetMobject: Mobject;
  private _buff: number;
  private _stretch: number;

  constructor(mobject: Mobject, options: UnderlineOptions = {}) {
    const {
      buff = 0.1,
      stretch = 0,
      color = YELLOW,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    // Calculate initial line position
    const bounds = mobject['_getBoundingBox']();
    const center = mobject.getCenter();
    const bottom = center[1] - bounds.height / 2;
    const halfWidth = bounds.width / 2 + stretch;

    super({
      start: [center[0] - halfWidth, bottom - buff, center[2]],
      end: [center[0] + halfWidth, bottom - buff, center[2]],
      color,
      strokeWidth,
    });

    this._targetMobject = mobject;
    this._buff = buff;
    this._stretch = stretch;

    this._addTrackingUpdater();
  }

  /**
   * Add an updater that tracks the target mobject
   */
  private _addTrackingUpdater(): void {
    this.addUpdater(() => {
      const bounds = this._targetMobject['_getBoundingBox']();
      const center = this._targetMobject.getCenter();
      const bottom = center[1] - bounds.height / 2;
      const halfWidth = bounds.width / 2 + this._stretch;

      this.setStart([center[0] - halfWidth, bottom - this._buff, center[2]]);
      this.setEnd([center[0] + halfWidth, bottom - this._buff, center[2]]);
    });
  }

  /**
   * Get the target mobject
   */
  getTargetMobject(): Mobject {
    return this._targetMobject;
  }

  /**
   * Get the buffer distance
   */
  getBuff(): number {
    return this._buff;
  }

  /**
   * Set the buffer distance
   */
  setBuff(value: number): this {
    this._buff = value;
    this._markDirty();
    return this;
  }

  /**
   * Get the stretch amount
   */
  getStretch(): number {
    return this._stretch;
  }

  /**
   * Set the stretch amount
   */
  setStretch(value: number): this {
    this._stretch = value;
    this._markDirty();
    return this;
  }

  /**
   * Create a copy of this Underline
   */
  protected override _createCopy(): Underline {
    return new Underline(this._targetMobject, {
      buff: this._buff,
      stretch: this._stretch,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a Cross
 */
export interface CrossOptions {
  /** Stroke width. Default: 6 */
  strokeWidth?: number;
  /** Stroke color. Default: RED */
  color?: string;
  /** Scale factor for the cross size. Default: 1 */
  scale?: number;
}

/**
 * Cross - An X mark drawn over a mobject
 *
 * Creates two diagonal lines forming an X over a mobject, useful for
 * indicating cancellation or rejection.
 *
 * @example
 * ```typescript
 * const formula = new MathTex({ tex: 'x + 1 = 0' });
 * const cross = new Cross(formula, { color: RED });
 * scene.add(formula, cross);
 * ```
 */
export class Cross extends VMobject {
  private _targetMobject: Mobject;
  private _scale: number;
  private _line1: Line;
  private _line2: Line;

  constructor(mobject: Mobject, options: CrossOptions = {}) {
    super();

    const {
      strokeWidth = 6,
      color = RED,
      scale = 1,
    } = options;

    this._targetMobject = mobject;
    this._scale = scale;
    this.color = color;
    this.strokeWidth = strokeWidth;

    // Calculate corners
    const bounds = mobject['_getBoundingBox']();
    const center = mobject.getCenter();
    const halfWidth = (bounds.width / 2) * scale;
    const halfHeight = (bounds.height / 2) * scale;

    // Create two diagonal lines
    this._line1 = new Line({
      start: [center[0] - halfWidth, center[1] + halfHeight, center[2]],
      end: [center[0] + halfWidth, center[1] - halfHeight, center[2]],
      color,
      strokeWidth,
    });

    this._line2 = new Line({
      start: [center[0] + halfWidth, center[1] + halfHeight, center[2]],
      end: [center[0] - halfWidth, center[1] - halfHeight, center[2]],
      color,
      strokeWidth,
    });

    this.add(this._line1, this._line2);
    this._addTrackingUpdater();
  }

  /**
   * Add an updater that tracks the target mobject
   */
  private _addTrackingUpdater(): void {
    this.addUpdater(() => {
      const bounds = this._targetMobject['_getBoundingBox']();
      const center = this._targetMobject.getCenter();
      const halfWidth = (bounds.width / 2) * this._scale;
      const halfHeight = (bounds.height / 2) * this._scale;

      this._line1.setStart([center[0] - halfWidth, center[1] + halfHeight, center[2]]);
      this._line1.setEnd([center[0] + halfWidth, center[1] - halfHeight, center[2]]);

      this._line2.setStart([center[0] + halfWidth, center[1] + halfHeight, center[2]]);
      this._line2.setEnd([center[0] - halfWidth, center[1] - halfHeight, center[2]]);
    });
  }

  /**
   * Get the target mobject
   */
  getTargetMobject(): Mobject {
    return this._targetMobject;
  }

  /**
   * Get the scale factor
   */
  getScale(): number {
    return this._scale;
  }

  /**
   * Set the scale factor
   */
  setScale(value: number): this {
    this._scale = value;
    this._markDirty();
    return this;
  }

  /**
   * Override setColor to update child lines
   */
  override setColor(color: string): this {
    super.setColor(color);
    this._line1.setColor(color);
    this._line2.setColor(color);
    return this;
  }

  /**
   * Override setStrokeWidth to update child lines
   */
  override setStrokeWidth(width: number): this {
    super.setStrokeWidth(width);
    this._line1.setStrokeWidth(width);
    this._line2.setStrokeWidth(width);
    return this;
  }

  /**
   * Create a copy of this Cross
   */
  protected override _createCopy(): Cross {
    return new Cross(this._targetMobject, {
      strokeWidth: this.strokeWidth,
      color: this.color,
      scale: this._scale,
    });
  }
}

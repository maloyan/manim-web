import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { RoundedRectangle } from '../geometry/PolygonExtensions';
import { Dot } from '../geometry/Dot';
import { WHITE, BLACK } from '../../constants';

/**
 * Options for creating a DiceFace
 */
export interface DiceFaceOptions {
  /** Face value (1-6). Default: 1 */
  value?: number;
  /** Side length of the die face square. Default: 1.5 */
  size?: number;
  /** Color for the dots (pips). Default: BLACK */
  dotColor?: string;
  /** Background fill color. Default: WHITE */
  backgroundColor?: string;
  /** Corner radius for the die face. Default: 0.15 */
  cornerRadius?: number;
  /** Stroke color for the outline. Default: BLACK */
  strokeColor?: string;
  /** Stroke width. Default: 2 */
  strokeWidth?: number;
  /** Radius of each dot (pip). Default: auto-calculated from size */
  dotRadius?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * Standard die pip positions in normalized coordinates (-1 to 1).
 *
 * Each face value maps to an array of [x, y] positions within the die face,
 * using the standard Western die layout.
 */
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [
    [0, 0],
  ],
  2: [
    [-0.5, 0.5],
    [0.5, -0.5],
  ],
  3: [
    [-0.5, 0.5],
    [0, 0],
    [0.5, -0.5],
  ],
  4: [
    [-0.5, 0.5],
    [0.5, 0.5],
    [-0.5, -0.5],
    [0.5, -0.5],
  ],
  5: [
    [-0.5, 0.5],
    [0.5, 0.5],
    [0, 0],
    [-0.5, -0.5],
    [0.5, -0.5],
  ],
  6: [
    [-0.5, 0.5],
    [0.5, 0.5],
    [-0.5, 0],
    [0.5, 0],
    [-0.5, -0.5],
    [0.5, -0.5],
  ],
};

/**
 * DiceFace - A square with dots arranged like a standard die face (1-6).
 *
 * Creates a visual representation of a single die face with configurable
 * size, dot color, background color, and corner radius. The dots (pips)
 * follow the standard Western die layout.
 *
 * @example
 * ```typescript
 * // Create a die face showing 5
 * const face = new DiceFace({ value: 5 });
 *
 * // Create a smaller red die face showing 3
 * const redDie = new DiceFace({
 *   value: 3,
 *   size: 1,
 *   backgroundColor: '#CC0000',
 *   dotColor: WHITE,
 * });
 *
 * // Show all six faces in a row
 * const dice = new VGroup();
 * for (let i = 1; i <= 6; i++) {
 *   dice.add(new DiceFace({ value: i }));
 * }
 * dice.arrange(RIGHT, 0.3);
 * ```
 */
export class DiceFace extends VGroup {
  private _value: number;
  private _size: number;
  private _dotColor: string;
  private _backgroundColor: string;
  private _cornerRadius: number;
  private _strokeColor: string;
  private _faceStrokeWidth: number;
  private _dotRadius: number;
  private _faceCenter: Vector3Tuple;

  /** The background rounded rectangle */
  private _background: RoundedRectangle;

  /** The dots (pips) on the face */
  private _dots: Dot[] = [];

  constructor(options: DiceFaceOptions = {}) {
    super();

    const {
      value = 1,
      size = 1.5,
      dotColor = BLACK,
      backgroundColor = WHITE,
      cornerRadius = 0.15,
      strokeColor = BLACK,
      strokeWidth = 2,
      dotRadius,
      center = [0, 0, 0],
    } = options;

    if (value < 1 || value > 6 || !Number.isInteger(value)) {
      throw new Error(`DiceFace value must be an integer from 1 to 6. Got: ${value}`);
    }

    this._value = value;
    this._size = size;
    this._dotColor = dotColor;
    this._backgroundColor = backgroundColor;
    this._cornerRadius = cornerRadius;
    this._strokeColor = strokeColor;
    this._faceStrokeWidth = strokeWidth;
    this._dotRadius = dotRadius ?? size * 0.08;
    this._faceCenter = [...center];

    // Create the background square
    this._background = new RoundedRectangle({
      width: size,
      height: size,
      cornerRadius,
      color: strokeColor,
      fillOpacity: 1,
      strokeWidth,
      center,
    });
    // Set the fill color to the background color
    this._background.setColor(backgroundColor);
    // Restore stroke color (setColor changes both fill and stroke)
    this._background.color = strokeColor;
    this._background.fillColor = backgroundColor;

    this.add(this._background);

    // Create the dots
    this._createDots();
  }

  /**
   * Create the pip dots based on the current value.
   */
  private _createDots(): void {
    const positions = PIP_POSITIONS[this._value];
    const [cx, cy, cz] = this._faceCenter;
    // Scale factor: pips are positioned within inner area of the die face
    const innerScale = this._size * 0.55;

    for (const [nx, ny] of positions) {
      const dot = new Dot({
        point: [
          cx + nx * innerScale,
          cy + ny * innerScale,
          cz + 0.001,
        ],
        radius: this._dotRadius,
        color: this._dotColor,
        fillOpacity: 1,
        strokeWidth: 0,
      });
      this._dots.push(dot);
      this.add(dot);
    }
  }

  /**
   * Get the face value (1-6).
   */
  getValue(): number {
    return this._value;
  }

  /**
   * Set the face value, recreating the dots.
   * @param value - New face value (1-6)
   * @returns this for chaining
   */
  setValue(value: number): this {
    if (value < 1 || value > 6 || !Number.isInteger(value)) {
      throw new Error(`DiceFace value must be an integer from 1 to 6. Got: ${value}`);
    }

    // Remove existing dots
    for (const dot of this._dots) {
      this.remove(dot);
    }
    this._dots = [];

    this._value = value;
    this._createDots();
    this._markDirty();
    return this;
  }

  /**
   * Get the background rectangle.
   */
  getBackground(): RoundedRectangle {
    return this._background;
  }

  /**
   * Get all the dot mobjects.
   */
  getDots(): Dot[] {
    return [...this._dots];
  }

  /**
   * Get the size (side length) of the die face.
   */
  getSize(): number {
    return this._size;
  }

  /**
   * Get the dot color.
   */
  getDotColor(): string {
    return this._dotColor;
  }

  /**
   * Set the dot color for all pips.
   * @param color - CSS color string
   * @returns this for chaining
   */
  setDotColor(color: string): this {
    this._dotColor = color;
    for (const dot of this._dots) {
      dot.setColor(color);
    }
    return this;
  }

  /**
   * Get the background color.
   */
  getBackgroundColor(): string {
    return this._backgroundColor;
  }

  /**
   * Set the background color.
   * @param color - CSS color string
   * @returns this for chaining
   */
  setBackgroundColor(color: string): this {
    this._backgroundColor = color;
    this._background.fillColor = color;
    this._background._markDirty();
    return this;
  }

  /**
   * Create a copy of this DiceFace.
   */
  protected override _createCopy(): VMobject {
    return new DiceFace({
      value: this._value,
      size: this._size,
      dotColor: this._dotColor,
      backgroundColor: this._backgroundColor,
      cornerRadius: this._cornerRadius,
      strokeColor: this._strokeColor,
      strokeWidth: this._faceStrokeWidth,
      dotRadius: this._dotRadius,
      center: this._faceCenter,
    });
  }
}

/**
 * Create a VGroup containing all six die faces arranged in a row.
 *
 * @param options - Shared options applied to each DiceFace
 * @param buff - Buffer/spacing between faces. Default: 0.3
 * @returns A VGroup containing DiceFace mobjects for values 1-6
 *
 * @example
 * ```typescript
 * const allFaces = createDiceRow({ size: 1 });
 * scene.add(allFaces);
 * ```
 */
export function createDiceRow(
  options: Omit<DiceFaceOptions, 'value' | 'center'> = {},
  buff: number = 0.3,
): VGroup {
  const size = options.size ?? 1.5;
  const faces: DiceFace[] = [];

  for (let i = 1; i <= 6; i++) {
    const xOffset = (i - 3.5) * (size + buff);
    faces.push(
      new DiceFace({
        ...options,
        value: i,
        center: [xOffset, 0, 0],
      }),
    );
  }

  const group = new VGroup(...faces);
  return group;
}

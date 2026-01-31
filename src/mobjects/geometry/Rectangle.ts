import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a Rectangle
 */
export interface RectangleOptions {
  /** Width of the rectangle. Default: 2 */
  width?: number;
  /** Height of the rectangle. Default: 1 */
  height?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * Rectangle - A rectangular VMobject
 *
 * Creates a rectangle defined by its width and height, centered at a point.
 *
 * @example
 * ```typescript
 * // Create a 2x1 rectangle
 * const rect = new Rectangle();
 *
 * // Create a square
 * const square = new Rectangle({ width: 2, height: 2 });
 *
 * // Create a filled rectangle
 * const filled = new Rectangle({ fillOpacity: 0.5, color: '#ff0000' });
 * ```
 */
export class Rectangle extends VMobject {
  private _width: number;
  private _height: number;
  private _centerPoint: Vector3Tuple;

  constructor(options: RectangleOptions = {}) {
    super();

    const {
      width = 2,
      height = 1,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
    } = options;

    this._width = width;
    this._height = height;
    this._centerPoint = [...center];

    this.setColor(color);
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the rectangle points as 4 line segments
   */
  private _generatePoints(): void {
    const halfWidth = this._width / 2;
    const halfHeight = this._height / 2;
    const [cx, cy, cz] = this._centerPoint;

    // Define corners
    const topLeft: number[] = [cx - halfWidth, cy + halfHeight, cz];
    const topRight: number[] = [cx + halfWidth, cy + halfHeight, cz];
    const bottomRight: number[] = [cx + halfWidth, cy - halfHeight, cz];
    const bottomLeft: number[] = [cx - halfWidth, cy - halfHeight, cz];

    // Build path as 4 line segments (each as a degenerate cubic Bezier)
    const points: number[][] = [];

    // Helper to add a line segment as cubic Bezier
    const addLineSegment = (p0: number[], p1: number[]) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      // If this is not the first segment, skip the anchor (it's shared)
      if (points.length > 0) {
        // Control points
        points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
        points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
        points.push([...p1]);
      } else {
        // First segment includes anchor
        points.push([...p0]);
        points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
        points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
        points.push([...p1]);
      }
    };

    // Top edge: topLeft -> topRight
    addLineSegment(topLeft, topRight);
    // Right edge: topRight -> bottomRight
    addLineSegment(topRight, bottomRight);
    // Bottom edge: bottomRight -> bottomLeft
    addLineSegment(bottomRight, bottomLeft);
    // Left edge: bottomLeft -> topLeft (close)
    addLineSegment(bottomLeft, topLeft);

    this.setPoints3D(points);
  }

  /**
   * Get the width of the rectangle
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Set the width of the rectangle
   */
  setWidth(value: number): this {
    this._width = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the height of the rectangle
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the height of the rectangle
   */
  setHeight(value: number): this {
    this._height = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the rectangle
   */
  getRectCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Set the center of the rectangle
   */
  setRectCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Get the area of the rectangle
   */
  getArea(): number {
    return this._width * this._height;
  }

  /**
   * Get the perimeter of the rectangle
   */
  getPerimeter(): number {
    return 2 * (this._width + this._height);
  }

  /**
   * Get a specific corner of the rectangle
   */
  getCorner(corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'): Vector3Tuple {
    const halfWidth = this._width / 2;
    const halfHeight = this._height / 2;
    const [cx, cy, cz] = this._centerPoint;

    switch (corner) {
      case 'topLeft':
        return [cx - halfWidth, cy + halfHeight, cz];
      case 'topRight':
        return [cx + halfWidth, cy + halfHeight, cz];
      case 'bottomRight':
        return [cx + halfWidth, cy - halfHeight, cz];
      case 'bottomLeft':
        return [cx - halfWidth, cy - halfHeight, cz];
    }
  }

  /**
   * Get the top edge center
   */
  getTop(): Vector3Tuple {
    return [this._centerPoint[0], this._centerPoint[1] + this._height / 2, this._centerPoint[2]];
  }

  /**
   * Get the bottom edge center
   */
  getBottom(): Vector3Tuple {
    return [this._centerPoint[0], this._centerPoint[1] - this._height / 2, this._centerPoint[2]];
  }

  /**
   * Get the left edge center
   */
  getLeft(): Vector3Tuple {
    return [this._centerPoint[0] - this._width / 2, this._centerPoint[1], this._centerPoint[2]];
  }

  /**
   * Get the right edge center
   */
  getRight(): Vector3Tuple {
    return [this._centerPoint[0] + this._width / 2, this._centerPoint[1], this._centerPoint[2]];
  }

  /**
   * Create a copy of this Rectangle
   */
  protected override _createCopy(): Rectangle {
    return new Rectangle({
      width: this._width,
      height: this._height,
      center: this._centerPoint,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Square - A special case of Rectangle with equal width and height
 */
export class Square extends Rectangle {
  constructor(
    options: Omit<RectangleOptions, 'width' | 'height'> & { sideLength?: number } = {}
  ) {
    const { sideLength = 2, ...rest } = options;
    super({ ...rest, width: sideLength, height: sideLength });
  }

  /**
   * Get the side length of the square
   */
  getSideLength(): number {
    return this.getWidth();
  }

  /**
   * Set the side length of the square
   */
  setSideLength(value: number): this {
    this.setWidth(value);
    this.setHeight(value);
    return this;
  }

  /**
   * Create a copy of this Square
   */
  protected override _createCopy(): Square {
    return new Square({
      sideLength: this.getWidth(),
      center: this.getRectCenter(),
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

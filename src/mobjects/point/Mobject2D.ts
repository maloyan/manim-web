import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';
import { PMobject } from './PMobject';

/**
 * Distribution type for Mobject2D
 */
export type Distribution2D = 'grid' | 'random';

/**
 * Options for creating a Mobject2D
 */
export interface Mobject2DOptions {
  /** Center of the region [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Width of the region (along x-axis). Default: 2 */
  width?: number;
  /** Height of the region (along y-axis). Default: 2 */
  height?: number;
  /** Number of points along width for grid, or total points for random. Default: 10 */
  numPointsX?: number;
  /** Number of points along height for grid. Default: 10 */
  numPointsY?: number;
  /** Alternative to numPoints: density (points per unit area for random, per unit length for grid). */
  density?: number;
  /** Distribution pattern: 'grid' or 'random'. Default: 'grid' */
  distribution?: Distribution2D;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size of each point in pixels. Default: 6 */
  pointSize?: number;
}

/**
 * Mobject2D - 2D point distribution in a rectangular plane
 *
 * Points are distributed within a rectangular region. Supports
 * grid distribution (evenly spaced rows and columns) or random
 * distribution within the bounds.
 *
 * @example
 * ```typescript
 * // Create a 10x10 grid of points
 * const grid = new Mobject2D({
 *   center: [0, 0, 0],
 *   width: 4,
 *   height: 4,
 *   numPointsX: 10,
 *   numPointsY: 10,
 *   distribution: 'grid',
 * });
 *
 * // Create random points in a region
 * const randomCloud = new Mobject2D({
 *   center: [0, 0, 0],
 *   width: 3,
 *   height: 2,
 *   numPointsX: 100,  // total points for random
 *   distribution: 'random',
 *   color: '#ff00ff',
 * });
 *
 * // Use density instead of explicit counts
 * const densePlane = new Mobject2D({
 *   width: 2,
 *   height: 2,
 *   density: 5,  // 5 points per unit (grid) or 5 per unit area (random)
 *   distribution: 'grid',
 * });
 * ```
 */
export class Mobject2D extends PMobject {
  protected _center2D: Vector3Tuple;
  protected _width: number;
  protected _height: number;
  protected _numPointsX: number;
  protected _numPointsY: number;
  protected _density?: number;
  protected _distribution: Distribution2D;

  constructor(options: Mobject2DOptions = {}) {
    const {
      center = [0, 0, 0],
      width = 2,
      height = 2,
      numPointsX = 10,
      numPointsY = 10,
      density,
      distribution = 'grid',
      color = WHITE,
      opacity = 1,
      pointSize = 6,
    } = options;

    super({
      color,
      opacity,
      pointSize,
    });

    this._center2D = [...center];
    this._width = width;
    this._height = height;
    this._numPointsX = numPointsX;
    this._numPointsY = numPointsY;
    this._density = density;
    this._distribution = distribution;

    this._generatePoints();
  }

  /**
   * Get the area of the region
   */
  getArea(): number {
    return this._width * this._height;
  }

  /**
   * Get actual point counts based on density or config
   */
  protected _getActualPointCounts(): { x: number; y: number; total: number } {
    if (this._density !== undefined) {
      if (this._distribution === 'grid') {
        // Density = points per unit length
        const xCount = Math.max(2, Math.round(this._width * this._density));
        const yCount = Math.max(2, Math.round(this._height * this._density));
        return { x: xCount, y: yCount, total: xCount * yCount };
      } else {
        // Density = points per unit area for random
        const totalPoints = Math.max(1, Math.round(this.getArea() * this._density));
        return { x: totalPoints, y: 1, total: totalPoints };
      }
    }
    return {
      x: this._numPointsX,
      y: this._numPointsY,
      total: this._distribution === 'grid' ? this._numPointsX * this._numPointsY : this._numPointsX,
    };
  }

  /**
   * Generate points in the rectangular region
   */
  protected _generatePoints(): void {
    this.clearPoints();

    const counts = this._getActualPointCounts();
    const halfWidth = this._width / 2;
    const halfHeight = this._height / 2;

    if (this._distribution === 'grid') {
      // Grid distribution
      for (let i = 0; i < counts.x; i++) {
        for (let j = 0; j < counts.y; j++) {
          const tx = counts.x === 1 ? 0.5 : i / (counts.x - 1);
          const ty = counts.y === 1 ? 0.5 : j / (counts.y - 1);

          const x = this._center2D[0] - halfWidth + tx * this._width;
          const y = this._center2D[1] - halfHeight + ty * this._height;
          const z = this._center2D[2];

          this._points.push({
            position: [x, y, z],
            color: this.color,
            opacity: this._opacity,
          });
        }
      }
    } else {
      // Random distribution
      for (let i = 0; i < counts.total; i++) {
        const x = this._center2D[0] - halfWidth + Math.random() * this._width;
        const y = this._center2D[1] - halfHeight + Math.random() * this._height;
        const z = this._center2D[2];

        this._points.push({
          position: [x, y, z],
          color: this.color,
          opacity: this._opacity,
        });
      }
    }

    this._markDirty();
  }

  /**
   * Get the width of the region
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Get the height of the region
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the width and regenerate
   * @param width - New width
   * @returns this for chaining
   */
  setWidth(width: number): this {
    this._width = Math.max(0, width);
    this._generatePoints();
    return this;
  }

  /**
   * Set the height and regenerate
   * @param height - New height
   * @returns this for chaining
   */
  setHeight(height: number): this {
    this._height = Math.max(0, height);
    this._generatePoints();
    return this;
  }

  /**
   * Set both dimensions and regenerate
   * @param width - New width
   * @param height - New height
   * @returns this for chaining
   */
  setDimensions(width: number, height: number): this {
    this._width = Math.max(0, width);
    this._height = Math.max(0, height);
    this._generatePoints();
    return this;
  }

  /**
   * Set point counts for grid distribution (clears density)
   * @param xCount - Points along width
   * @param yCount - Points along height
   * @returns this for chaining
   */
  setPointCounts(xCount: number, yCount: number): this {
    this._numPointsX = Math.max(1, Math.round(xCount));
    this._numPointsY = Math.max(1, Math.round(yCount));
    this._density = undefined;
    this._generatePoints();
    return this;
  }

  /**
   * Set the density and regenerate (overrides point counts)
   * @param density - Points per unit length (grid) or per unit area (random)
   * @returns this for chaining
   */
  setDensity(density: number): this {
    this._density = Math.max(0.1, density);
    this._generatePoints();
    return this;
  }

  /**
   * Set the distribution pattern and regenerate
   * @param distribution - 'grid' or 'random'
   * @returns this for chaining
   */
  setDistribution(distribution: Distribution2D): this {
    this._distribution = distribution;
    this._generatePoints();
    return this;
  }

  /**
   * Get the distribution pattern
   */
  getDistribution(): Distribution2D {
    return this._distribution;
  }

  /**
   * Get the center of the region
   */
  override getCenter(): Vector3Tuple {
    return this._localToWorld(this._center2D);
  }

  /**
   * Move the region to center at a new position
   * @param point - Target center position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    const currentCenter = this.getCenter();
    const delta: Vector3Tuple = [
      point[0] - currentCenter[0],
      point[1] - currentCenter[1],
      point[2] - currentCenter[2],
    ];
    return this.shift(delta);
  }

  /**
   * Shift the region by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    return super.shift(delta);
  }

  /**
   * Regenerate the points (useful for random distribution refresh)
   * @returns this for chaining
   */
  regenerate(): this {
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this Mobject2D
   */
  protected override _createCopy(): Mobject2D {
    return new Mobject2D({
      center: [...this._center2D],
      width: this._width,
      height: this._height,
      numPointsX: this._numPointsX,
      numPointsY: this._numPointsY,
      density: this._density,
      distribution: this._distribution,
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
    });
  }
}

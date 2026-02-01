import { Circle } from './Circle';
import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';

/**
 * Options for creating a Dot
 */
export interface DotOptions {
  /** Position of the dot. Default: [0, 0, 0] */
  point?: Vector3Tuple;
  /** Radius of the dot. Default: 0.08 */
  radius?: number;
  /** Fill color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 0 (no stroke) */
  strokeWidth?: number;
}

/**
 * Dot - A small filled circle for marking points
 *
 * Creates a small filled circle, typically used for marking specific points
 * in visualizations. Extends Circle with different defaults appropriate
 * for point markers.
 *
 * @example
 * ```typescript
 * // Create a dot at the origin
 * const dot = new Dot();
 *
 * // Create a red dot at a specific position
 * const redDot = new Dot({
 *   point: [1, 2, 0],
 *   color: '#ff0000'
 * });
 *
 * // Create a larger dot
 * const largeDot = new Dot({ radius: 0.15 });
 * ```
 */
export class Dot extends Circle {
  private _point: Vector3Tuple;

  constructor(options: DotOptions = {}) {
    const {
      point = [0, 0, 0],
      radius = 0.08,
      color = WHITE,
      fillOpacity = 1,
      strokeWidth = 0,
    } = options;

    // Initialize as a filled circle at the specified point
    super({
      radius,
      color,
      fillOpacity,
      strokeWidth,
      center: point,
    });

    this._point = [...point];
  }

  /**
   * Get the center position of the dot
   */
  override getCenter(): Vector3Tuple {
    return [...this._point];
  }

  /**
   * Shift the dot by updating its internal point and Circle center.
   * Does not change Mobject.position to avoid double-counting in THREE.js hierarchy.
   */
  override shift(delta: Vector3Tuple): this {
    this._point[0] += delta[0];
    this._point[1] += delta[1];
    this._point[2] += delta[2];
    // Delegate to Circle.shift which updates _centerPoint and regenerates bezier
    return super.shift(delta);
  }

  /**
   * Move the dot to a new position
   * @param point Target position [x, y, z]
   */
  moveTo(point: Vector3Tuple): this {
    this._point = [...point];
    this.setCircleCenter(point);
    return this;
  }

  /**
   * Get the position of the dot
   */
  getPoint(): Vector3Tuple {
    return [...this._point];
  }

  /**
   * Set the position of the dot (alias for moveTo)
   */
  setPoint(point: Vector3Tuple): this {
    return this.moveTo(point);
  }

  /**
   * Create a copy of this Dot
   */
  protected override _createCopy(): Dot {
    return new Dot({
      point: this._point,
      radius: this.getRadius(),
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * SmallDot - An even smaller dot for fine details
 *
 * A convenience class that creates a very small dot.
 *
 * @example
 * ```typescript
 * const smallDot = new SmallDot({ point: [1, 0, 0] });
 * ```
 */
export class SmallDot extends Dot {
  constructor(options: Omit<DotOptions, 'radius'> = {}) {
    super({
      ...options,
      radius: 0.04,
    });
  }

  /**
   * Create a copy of this SmallDot
   */
  protected override _createCopy(): SmallDot {
    return new SmallDot({
      point: this.getPoint(),
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * LargeDot - A larger dot for emphasis
 *
 * A convenience class that creates a larger dot.
 *
 * @example
 * ```typescript
 * const largeDot = new LargeDot({ point: [0, 1, 0] });
 * ```
 */
export class LargeDot extends Dot {
  constructor(options: Omit<DotOptions, 'radius'> = {}) {
    super({
      ...options,
      radius: 0.16,
    });
  }

  /**
   * Create a copy of this LargeDot
   */
  protected override _createCopy(): LargeDot {
    return new LargeDot({
      point: this.getPoint(),
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

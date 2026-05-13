import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';
import { PMobject } from './PMobject';

/**
 * Options for creating a PointMobject
 */
export interface PointMobjectOptions {
  /** Position [x, y, z]. Default: [0, 0, 0] */
  position?: Vector3Tuple;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size in pixels. Default: 8 */
  size?: number;
}

/**
 * PointMobject - Single point mobject
 *
 * Renders as a single dot/particle. Lightweight, no stroke.
 * Uses THREE.js Points for efficient rendering.
 *
 * @example
 * ```typescript
 * // Create a point at the origin
 * const point = new PointMobject();
 *
 * // Create a red point at a specific position
 * const redPoint = new PointMobject({
 *   position: [1, 2, 0],
 *   color: '#ff0000',
 *   size: 12,
 * });
 * ```
 */
export class PointMobject extends PMobject {
  constructor(options: PointMobjectOptions = {}) {
    const { position = [0, 0, 0], color = WHITE, opacity = 1, size = 8 } = options;

    super({
      points: [{ position: [0, 0, 0], color, opacity }],
      color,
      opacity,
      pointSize: size,
    });

    this.position.set(...position);
  }

  /**
   * Get the position of the point
   * @returns Position as [x, y, z]
   */
  getPosition(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Set the position of the point
   * @param position - New position [x, y, z]
   * @returns this for chaining
   */
  setPosition(position: Vector3Tuple): this {
    this.position.set(...position);
    this._markDirty();
    return this;
  }

  /**
   * Get the center (same as position for a single point)
   */
  override getCenter(): Vector3Tuple {
    return this.getPosition();
  }

  /**
   * Move the point to a new position
   * @param point - Target position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    return this.setPosition(point);
  }

  /**
   * Create a copy of this PointMobject
   */
  protected override _createCopy(): PointMobject {
    const copy = new PointMobject({
      position: this.getPosition(),
      color: this.color,
      opacity: this._opacity,
      size: this._pointSize,
    });
    return copy;
  }
}

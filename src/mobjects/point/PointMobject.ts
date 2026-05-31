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
   * Get the world-space position of the point.
   *
   * Applies this node's transform and all ancestor transforms (via getPoints()).
   * For local-space coordinates, use the `position` field directly.
   *
   * @returns World position as [x, y, z]
   */
  getPosition(): Vector3Tuple {
    const pts = this.getPoints();
    if (pts.length === 0) return [this.position.x, this.position.y, this.position.z];
    return pts[0] as Vector3Tuple;
  }

  /**
   * Set the local-space position of the point.
   *
   * Updates this mobject's position field only; does not modify parent transforms.
   * To move the point in world space, use moveTo().
   *
   * @param position - New local position [x, y, z]
   * @returns this for chaining
   */
  setPosition(position: Vector3Tuple): this {
    this.position.set(...position);
    this._markDirty();
    return this;
  }

  /**
   * Create a copy of this PointMobject
   */
  protected override _createCopy(): PointMobject {
    return new PointMobject({
      position: this.getPosition(),
      color: this.color,
      opacity: this._opacity,
      size: this._pointSize,
    });
  }
}

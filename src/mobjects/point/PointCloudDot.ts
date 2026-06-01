import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';
import { PMobject } from './PMobject';

/**
 * Options for creating a PointCloudDot
 */
export interface PointCloudDotOptions {
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Radius of the dot. Default: 0.08 */
  radius?: number;
  /** Number of particles. Default: 50 */
  numParticles?: number;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size of each particle in pixels. Default: 4 */
  particleSize?: number;
  /** Spread pattern: 'uniform' for even distribution, 'gaussian' for center-heavy. Default: 'gaussian' */
  distribution?: 'uniform' | 'gaussian';
}

/**
 * PointCloudDot - Dot rendered as multiple particles
 *
 * Creates a "fuzzy" dot effect by rendering multiple particles
 * within a radius. The particles create a soft, glowing appearance.
 *
 * @example
 * ```typescript
 * // Create a fuzzy dot at the origin
 * const dot = new PointCloudDot();
 *
 * // Create a large, dense fuzzy dot
 * const bigDot = new PointCloudDot({
 *   center: [1, 0, 0],
 *   radius: 0.2,
 *   numParticles: 100,
 *   color: '#ff6600',
 *   distribution: 'gaussian',
 * });
 * ```
 */
export class PointCloudDot extends PMobject {
  protected _center: Vector3Tuple;
  protected _radius: number;
  protected _numParticles: number;
  protected _distribution: 'uniform' | 'gaussian';

  constructor(options: PointCloudDotOptions = {}) {
    const {
      center = [0, 0, 0],
      radius = 0.08,
      numParticles = 50,
      color = WHITE,
      opacity = 1,
      particleSize = 4,
      distribution = 'gaussian',
    } = options;

    super({
      color,
      opacity,
      pointSize: particleSize,
    });

    this._center = [...center];
    this._radius = radius;
    this._numParticles = numParticles;
    this._distribution = distribution;

    this._generateParticles();
  }

  /**
   * Generate particles within the radius
   */
  protected _generateParticles(): void {
    this.clearPoints();

    for (let i = 0; i < this._numParticles; i++) {
      let x: number, y: number, z: number;

      if (this._distribution === 'gaussian') {
        // Gaussian distribution - more particles near center
        const r = this._radius * Math.sqrt(-2 * Math.log(Math.random())) * 0.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        x = this._center[0] + r * Math.sin(phi) * Math.cos(theta);
        y = this._center[1] + r * Math.sin(phi) * Math.sin(theta);
        z = this._center[2] + r * Math.cos(phi);
      } else {
        // Uniform distribution within sphere
        const r = this._radius * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        x = this._center[0] + r * Math.sin(phi) * Math.cos(theta);
        y = this._center[1] + r * Math.sin(phi) * Math.sin(theta);
        z = this._center[2] + r * Math.cos(phi);
      }

      // Opacity varies based on distance from center for softer edges
      const distFromCenter = Math.sqrt(
        (x - this._center[0]) ** 2 + (y - this._center[1]) ** 2 + (z - this._center[2]) ** 2,
      );
      const normalizedDist = distFromCenter / this._radius;
      const pointOpacity = this._opacity * (1 - normalizedDist * 0.5);

      this._points.push({
        position: [x, y, z],
        color: this.color,
        opacity: Math.max(0, pointOpacity),
      });
    }

    this._markDirty();
  }

  /**
   * Get the center of the dot
   */
  override getCenter(): Vector3Tuple {
    return [...this._center];
  }

  /**
   * Move the dot to a new position
   * @param point - Target position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    const delta: Vector3Tuple = [
      point[0] - this._center[0],
      point[1] - this._center[1],
      point[2] - this._center[2],
    ];
    this._center = [...point];
    return this.shift(delta);
  }

  /**
   * Get the radius of the dot
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius and regenerate particles
   * @param radius - New radius
   * @returns this for chaining
   */
  setRadius(radius: number): this {
    this._radius = Math.max(0, radius);
    this._generateParticles();
    return this;
  }

  /**
   * Get the number of particles
   */
  getNumParticles(): number {
    return this._numParticles;
  }

  /**
   * Set the number of particles and regenerate
   * @param count - New particle count
   * @returns this for chaining
   */
  setNumParticles(count: number): this {
    this._numParticles = Math.max(1, Math.round(count));
    this._generateParticles();
    return this;
  }

  /**
   * Set the distribution pattern and regenerate
   * @param distribution - 'uniform' or 'gaussian'
   * @returns this for chaining
   */
  setDistribution(distribution: 'uniform' | 'gaussian'): this {
    this._distribution = distribution;
    this._generateParticles();
    return this;
  }

  /**
   * Regenerate the particles (useful after changing properties)
   * @returns this for chaining
   */
  regenerate(): this {
    this._generateParticles();
    return this;
  }

  override copy(): PointCloudDot {
    const copy = new PointCloudDot({
      center: this._center,
      radius: this._radius,
      numParticles: this._numParticles,
      color: this.color,
      opacity: this._opacity,
      particleSize: this._pointSize,
      distribution: this._distribution,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

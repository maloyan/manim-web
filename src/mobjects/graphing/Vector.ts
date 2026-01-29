import { Vector3Tuple } from '../../core/Mobject';
import { Arrow } from '../geometry';

/**
 * Options for creating a VectorFieldVector
 */
export interface VectorFieldVectorOptions {
  /** The direction of the vector as [x, y, z] */
  direction: Vector3Tuple;
  /** The starting point of the vector. Default: [0, 0, 0] */
  startPoint?: Vector3Tuple;
  /** Stroke color. Default: '#58c4dd' (Manim blue) */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Length of the arrow tip. Default: 0.2 */
  tipLength?: number;
  /** Maximum length for vector fields. Default: Infinity (no cap) */
  maxLength?: number;
}

/**
 * VectorFieldVector - A mathematical vector represented as an arrow
 *
 * Convenience class for working with vectors in mathematical contexts.
 * Extends Arrow with additional methods for vector operations.
 *
 * @example
 * ```typescript
 * // Create a vector pointing in the direction [1, 1, 0]
 * const v = new VectorFieldVector({
 *   direction: [1, 1, 0]
 * });
 *
 * // Create a vector at a specific position
 * const w = new VectorFieldVector({
 *   direction: [2, 0, 0],
 *   startPoint: [1, 1, 0]
 * });
 *
 * // Create a capped vector for vector fields
 * const fieldVector = new VectorFieldVector({
 *   direction: [10, 10, 0],
 *   maxLength: 1.5  // Will be scaled down to length 1.5
 * });
 * ```
 */
export class VectorFieldVector extends Arrow {
  private _direction: Vector3Tuple;
  private _startPoint: Vector3Tuple;
  private _maxLength: number;

  constructor(options: VectorFieldVectorOptions) {
    const {
      direction,
      startPoint = [0, 0, 0],
      color = '#58c4dd',
      strokeWidth = 2,
      tipLength = 0.2,
      maxLength = Infinity,
    } = options;

    // Calculate the actual direction vector
    const dirLength = Math.sqrt(
      direction[0] * direction[0] +
      direction[1] * direction[1] +
      direction[2] * direction[2]
    );

    // Apply max length constraint
    let scaledDirection = [...direction] as Vector3Tuple;
    if (dirLength > maxLength && maxLength > 0) {
      const scaleFactor = maxLength / dirLength;
      scaledDirection = [
        direction[0] * scaleFactor,
        direction[1] * scaleFactor,
        direction[2] * scaleFactor,
      ];
    }

    // Calculate end point
    const end: Vector3Tuple = [
      startPoint[0] + scaledDirection[0],
      startPoint[1] + scaledDirection[1],
      startPoint[2] + scaledDirection[2],
    ];

    super({
      start: startPoint,
      end,
      color,
      strokeWidth,
      tipLength,
      tipWidth: tipLength * 0.6,
    });

    this._direction = [...direction];
    this._startPoint = [...startPoint];
    this._maxLength = maxLength;
  }

  /**
   * Get the direction vector
   */
  getDirection(): Vector3Tuple {
    return [...this._direction];
  }

  /**
   * Set the direction vector
   * @param direction - New direction as [x, y, z]
   */
  setDirection(direction: Vector3Tuple): this {
    this._direction = [...direction];

    // Recalculate length
    const dirLength = Math.sqrt(
      direction[0] * direction[0] +
      direction[1] * direction[1] +
      direction[2] * direction[2]
    );

    // Apply max length constraint
    let scaledDirection = [...direction] as Vector3Tuple;
    if (dirLength > this._maxLength && this._maxLength > 0) {
      const scaleFactor = this._maxLength / dirLength;
      scaledDirection = [
        direction[0] * scaleFactor,
        direction[1] * scaleFactor,
        direction[2] * scaleFactor,
      ];
    }

    // Update end point
    const end: Vector3Tuple = [
      this._startPoint[0] + scaledDirection[0],
      this._startPoint[1] + scaledDirection[1],
      this._startPoint[2] + scaledDirection[2],
    ];

    this.setStart(this._startPoint);
    this.setEnd(end);

    return this;
  }

  /**
   * Get the magnitude (length) of the vector
   */
  getMagnitude(): number {
    return Math.sqrt(
      this._direction[0] * this._direction[0] +
      this._direction[1] * this._direction[1] +
      this._direction[2] * this._direction[2]
    );
  }

  /**
   * Get the visual length of the vector (may be capped by maxLength)
   */
  getVisualLength(): number {
    return Math.min(this.getMagnitude(), this._maxLength);
  }

  /**
   * Set the length of the vector (scales the direction)
   * @param length - New length for the vector
   */
  setMagnitude(length: number): this {
    const currentLength = this.getMagnitude();
    if (currentLength === 0) {
      // If current direction is zero, default to pointing right
      this.setDirection([length, 0, 0]);
    } else {
      const scaleFactor = length / currentLength;
      this.setDirection([
        this._direction[0] * scaleFactor,
        this._direction[1] * scaleFactor,
        this._direction[2] * scaleFactor,
      ]);
    }
    return this;
  }

  /**
   * Get the unit vector (normalized direction)
   */
  getUnitVector(): Vector3Tuple {
    const length = this.getMagnitude();
    if (length === 0) return [1, 0, 0];
    return [
      this._direction[0] / length,
      this._direction[1] / length,
      this._direction[2] / length,
    ];
  }

  /**
   * Get the start point
   */
  getStartPoint(): Vector3Tuple {
    return [...this._startPoint];
  }

  /**
   * Set the start point (keeps the same direction)
   */
  setStartPoint(point: Vector3Tuple): this {
    this._startPoint = [...point];
    this.setDirection(this._direction); // This will recalculate end point
    return this;
  }

  /**
   * Get the maximum length constraint
   */
  getMaxLength(): number {
    return this._maxLength;
  }

  /**
   * Set the maximum length constraint
   */
  setMaxLength(maxLength: number): this {
    this._maxLength = maxLength;
    this.setDirection(this._direction); // Reapply constraint
    return this;
  }

  /**
   * Get the angle of the vector in the XY plane (in radians)
   */
  getAngleXY(): number {
    return Math.atan2(this._direction[1], this._direction[0]);
  }

  /**
   * Scale the direction vector by a factor
   * Note: This method is named scaleDirection to avoid conflict with
   * the inherited scaleVector property from Mobject.
   */
  scaleDirection(factor: number): this {
    this.setDirection([
      this._direction[0] * factor,
      this._direction[1] * factor,
      this._direction[2] * factor,
    ]);
    return this;
  }

  /**
   * Add another vector to this one
   */
  addVector(other: VectorFieldVector | Vector3Tuple): this {
    const dir = Array.isArray(other) ? other : other.getDirection();
    this.setDirection([
      this._direction[0] + dir[0],
      this._direction[1] + dir[1],
      this._direction[2] + dir[2],
    ]);
    return this;
  }

  /**
   * Compute the dot product with another vector
   */
  dot(other: VectorFieldVector | Vector3Tuple): number {
    const dir = Array.isArray(other) ? other : other.getDirection();
    return (
      this._direction[0] * dir[0] +
      this._direction[1] * dir[1] +
      this._direction[2] * dir[2]
    );
  }

  /**
   * Compute the cross product with another vector
   */
  cross(other: VectorFieldVector | Vector3Tuple): Vector3Tuple {
    const dir = Array.isArray(other) ? other : other.getDirection();
    return [
      this._direction[1] * dir[2] - this._direction[2] * dir[1],
      this._direction[2] * dir[0] - this._direction[0] * dir[2],
      this._direction[0] * dir[1] - this._direction[1] * dir[0],
    ];
  }

  /**
   * Create a copy of this VectorFieldVector
   */
  protected override _createCopy(): Arrow {
    return new VectorFieldVector({
      direction: this._direction,
      startPoint: this._startPoint,
      color: this.color,
      strokeWidth: this.strokeWidth,
      tipLength: this.getTipLength(),
      maxLength: this._maxLength,
    });
  }
}

export default VectorFieldVector;

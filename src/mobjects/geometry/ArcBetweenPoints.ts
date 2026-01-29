import { Arc } from './Arc';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating an ArcBetweenPoints
 */
export interface ArcBetweenPointsOptions {
  /** Start point of the arc */
  start: Vector3Tuple;
  /** End point of the arc */
  end: Vector3Tuple;
  /** Arc angle in radians. Default: PI/2 */
  angle?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
}

/**
 * ArcBetweenPoints - An arc that passes through two specified points
 *
 * Creates a circular arc from a start point to an end point with a given
 * arc angle. The center and radius are calculated automatically.
 *
 * @example
 * ```typescript
 * // Create an arc from (-1, 0) to (1, 0)
 * const arc = new ArcBetweenPoints({
 *   start: [-1, 0, 0],
 *   end: [1, 0, 0],
 *   angle: Math.PI / 2
 * });
 *
 * // Create a semicircle between two points
 * const semicircle = new ArcBetweenPoints({
 *   start: [0, 0, 0],
 *   end: [2, 0, 0],
 *   angle: Math.PI
 * });
 * ```
 */
export class ArcBetweenPoints extends Arc {
  private _startPoint: Vector3Tuple;
  private _endPoint: Vector3Tuple;

  constructor(options: ArcBetweenPointsOptions) {
    const {
      start,
      end,
      angle = Math.PI / 2,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    // Calculate the center and radius from the two points and angle
    const { center, radius, startAngle } = ArcBetweenPoints._calculateArcParams(
      start,
      end,
      angle
    );

    // Initialize the parent Arc with calculated parameters
    super({
      radius,
      startAngle,
      angle,
      color,
      strokeWidth,
      center,
    });

    this._startPoint = [...start];
    this._endPoint = [...end];
  }

  /**
   * Calculate the arc parameters (center, radius, startAngle) from two points and angle.
   *
   * Given two points and an arc angle, we find the circle that:
   * 1. Passes through both points
   * 2. The arc from start to end subtends the given angle
   *
   * The center lies on the perpendicular bisector of the chord between the points.
   */
  private static _calculateArcParams(
    start: Vector3Tuple,
    end: Vector3Tuple,
    angle: number
  ): { center: Vector3Tuple; radius: number; startAngle: number } {
    // Handle degenerate case where angle is very small
    if (Math.abs(angle) < 1e-10) {
      const midpoint: Vector3Tuple = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2,
      ];
      return {
        center: midpoint,
        radius: 0,
        startAngle: 0,
      };
    }

    // Midpoint of the chord
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    // Chord vector
    const chordX = end[0] - start[0];
    const chordY = end[1] - start[1];

    // Half chord length
    const halfChord = Math.sqrt(chordX * chordX + chordY * chordY) / 2;

    // Handle degenerate case where points are the same
    if (halfChord < 1e-10) {
      return {
        center: [...start],
        radius: 0,
        startAngle: 0,
      };
    }

    // Distance from midpoint to center along perpendicular bisector
    // Using: halfChord = radius * sin(angle/2)
    // Therefore: radius = halfChord / sin(angle/2)
    const halfAngle = Math.abs(angle) / 2;
    const radius = halfChord / Math.sin(halfAngle);

    // Distance from midpoint to center
    // Using: d = radius * cos(angle/2)
    const distToCenter = radius * Math.cos(halfAngle);

    // Perpendicular direction to the chord (normalized)
    const chordLength = 2 * halfChord;
    let perpX = -chordY / chordLength;
    let perpY = chordX / chordLength;

    // Determine which side of the chord the center should be
    // For positive angles, center is to the left of the chord direction
    // For negative angles, center is to the right
    if (angle > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    // Calculate center position
    const centerX = midX + distToCenter * perpX;
    const centerY = midY + distToCenter * perpY;
    const center: Vector3Tuple = [centerX, centerY, midZ];

    // Calculate start angle (angle from center to start point)
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    return { center, radius, startAngle };
  }

  /**
   * Get the start point of the arc
   */
  override getStartPoint(): Vector3Tuple {
    return [...this._startPoint];
  }

  /**
   * Get the end point of the arc
   */
  override getEndPoint(): Vector3Tuple {
    return [...this._endPoint];
  }

  /**
   * Create a copy of this ArcBetweenPoints
   */
  protected override _createCopy(): ArcBetweenPoints {
    return new ArcBetweenPoints({
      start: this._startPoint,
      end: this._endPoint,
      angle: this._angle,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}

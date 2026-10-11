import { Vector3Tuple } from '../../core/Mobject';
import { NumberLine } from './NumberLine';

/**
 * CoordinateSystem - the shared surface of every coordinate system.
 *
 * In ManimCE (`manim/mobject/graphing/coordinate_systems.py`) `CoordinateSystem`
 * is the abstract base of `Axes` and `NumberPlane`. manim-web does not need that
 * class hierarchy, because `Axes` is concrete and `NumberPlane extends Axes`.
 * This interface captures the coordinate-conversion surface that both classes
 * share, so callers can program against the abstraction. `Axes` declares
 * `implements CoordinateSystem`, so the compiler checks the surface stays in
 * sync, and `NumberPlane` inherits it.
 */
export interface CoordinateSystem {
  /** Map coordinates `(x, y)` to a point in scene space. */
  coordsToPoint(x: number, y: number): Vector3Tuple;
  /** Shorthand for {@link coordsToPoint} (matches ManimCE `c2p`). */
  c2p(x: number, y: number): Vector3Tuple;
  /** Map a point in scene space back to coordinates `[x, y]`. */
  pointToCoords(point: Vector3Tuple): [number, number];
  /** The x value of `coordsToPoint(x, 0)`. */
  c2pX(x: number): number;
  /** The y value of `coordsToPoint(0, y)`. */
  c2pY(y: number): number;
  /** The x-axis number line. */
  getXAxis(): NumberLine;
  /** The y-axis number line. */
  getYAxis(): NumberLine;
  /** The x range as `[min, max, step]`. */
  getXRange(): [number, number, number];
  /** The y range as `[min, max, step]`. */
  getYRange(): [number, number, number];
  /** The visual length of the x-axis. */
  getXLength(): number;
  /** The visual length of the y-axis. */
  getYLength(): number;
  /** The scene-space point of the coordinate origin `(0, 0)`. */
  getOrigin(): Vector3Tuple;
}

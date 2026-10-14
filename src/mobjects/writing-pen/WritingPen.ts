import { VGroup } from '../../core/VGroup';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Polygon } from '../geometry/Polygon';
import { WHITE } from '../../constants';

/** Options for {@link WritingPen}. */
export interface WritingPenOptions {
  /**
   * Custom mobject used as the pen body (for example an ImageMobject of a
   * hand). When omitted, the pen is a vector nib and barrel built from
   * polygons, so no image asset is needed.
   */
  tip?: Mobject;
  /**
   * Position of the nib tip in the pen's local frame, relative to the pen
   * origin. Default `[0, 0, 0]`, which matches the built-in vector pen. For a
   * custom `tip`, set this to the fingertip or nib point of that mobject.
   */
  tipOffset?: Vector3Tuple;
  /** Color of the built-in vector pen. Default: white. */
  color?: string;
  /** Length of the built-in pen barrel in scene units. Default: 0.8. */
  length?: number;
}

/**
 * A pen that can be placed by its nib. The default shape is a filled triangle
 * nib with a barrel, pointing up and to the right, with the nib tip at the
 * pen origin. Pair it with {@link writeWithPen} to follow a `Write` stroke.
 */
export class WritingPen extends VGroup {
  /** Nib tip in the pen's local frame. */
  readonly tipOffset: Vector3Tuple;

  constructor(options: WritingPenOptions = {}) {
    super();
    const { tip, tipOffset = [0, 0, 0], color = WHITE, length = 0.8 } = options;
    this.tipOffset = [...tipOffset];
    this.add(tip ?? WritingPen._buildVectorPen(color, length));
  }

  /** Build the nib triangle and barrel, with the nib tip at the origin. */
  private static _buildVectorPen(color: string, length: number): VGroup {
    const nibA: Vector3Tuple = [0.06, 0.2, 0];
    const nibB: Vector3Tuple = [0.2, 0.06, 0];
    const d = Math.SQRT1_2;
    const far = (p: Vector3Tuple): Vector3Tuple => [p[0] + length * d, p[1] + length * d, 0];
    const nib = new Polygon({
      vertices: [[0, 0, 0], nibA, nibB],
      color,
      fillOpacity: 1,
    });
    const barrel = new Polygon({
      vertices: [nibA, nibB, far(nibB), far(nibA)],
      color,
      fillOpacity: 0.35,
    });
    return new VGroup(nib, barrel);
  }

  /** The nib tip in world coordinates. */
  getNibPosition(): Vector3Tuple {
    return this._localToWorld(this.tipOffset);
  }

  /** Move the pen so that its nib tip sits on the given world point. */
  placeNibAt(point: Vector3Tuple): this {
    const nib = this.getNibPosition();
    return this.shift([point[0] - nib[0], point[1] - nib[1], point[2] - nib[2]]);
  }
}

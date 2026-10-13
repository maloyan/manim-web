/**
 * SafeArea - responsive layout against a common visible rectangle.
 *
 * Content creators author one scene and render it at several aspect ratios
 * (16:9 landscape, 9:16 portrait, 1:1 square). The safe area is the rectangle
 * visible in EVERY target aspect: the intersection of all the target frames at
 * a shared reference scale. Anchor a mobject to the safe area and it stays on
 * screen in every aspect ("reflows") instead of being clipped when the author
 * switches aspect with {@link Scene.setFrameAspect}.
 *
 * The frame model mirrors the camera's `fill` mode (see {@link Camera2D}): all
 * target frames share one reference height, so the frame width tracks the
 * aspect and the width is the limiting dimension. This keeps the safe area
 * exact against what the camera actually renders.
 */

import { Mobject, Vector3Tuple } from './Mobject';
import { DEFAULT_FRAME_HEIGHT } from '../constants';

/**
 * A frame rectangle, centered at the origin, in world units.
 */
export interface AspectFrameSize {
  /** Frame width in world units. */
  width: number;
  /** Frame height in world units. */
  height: number;
}

/**
 * Where to anchor a mobject inside the safe area.
 * Edges inset by the buffer on one axis, corners on both.
 */
export type SafeAreaAnchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

/**
 * Options for {@link SafeArea.fromAspectRatios}.
 */
export interface SafeAreaOptions {
  /**
   * Reference height every target frame shares, in world units. Defaults to
   * {@link DEFAULT_FRAME_HEIGHT} (8), matching the camera's `fill` mode.
   */
  referenceHeight?: number;
}

/**
 * Intersect frame rectangles that are all centered at the origin.
 * The common rectangle has the smallest width and the smallest height.
 *
 * @param frames - One or more frames. Must not be empty.
 * @returns The intersection rectangle, centered at the origin.
 * @throws If `frames` is empty.
 */
export function intersectFrames(frames: readonly AspectFrameSize[]): AspectFrameSize {
  if (frames.length === 0) {
    throw new Error('intersectFrames requires at least one frame.');
  }
  let width = Infinity;
  let height = Infinity;
  for (const frame of frames) {
    width = Math.min(width, frame.width);
    height = Math.min(height, frame.height);
  }
  return { width, height };
}

/** Does `anchor` pull content toward the left edge? */
function anchorsLeft(anchor: SafeAreaAnchor): boolean {
  return anchor === 'left' || anchor === 'topLeft' || anchor === 'bottomLeft';
}

/** Does `anchor` pull content toward the right edge? */
function anchorsRight(anchor: SafeAreaAnchor): boolean {
  return anchor === 'right' || anchor === 'topRight' || anchor === 'bottomRight';
}

/** Does `anchor` pull content toward the top edge? */
function anchorsTop(anchor: SafeAreaAnchor): boolean {
  return anchor === 'top' || anchor === 'topLeft' || anchor === 'topRight';
}

/** Does `anchor` pull content toward the bottom edge? */
function anchorsBottom(anchor: SafeAreaAnchor): boolean {
  return anchor === 'bottom' || anchor === 'bottomLeft' || anchor === 'bottomRight';
}

/**
 * The rectangle visible in every target aspect, with helpers to position
 * mobjects against it. The safe area is centered at the origin.
 */
export class SafeArea {
  /** Safe-area width in world units. */
  readonly width: number;
  /** Safe-area height in world units. */
  readonly height: number;
  /** The per-aspect frames this safe area was built from. */
  readonly frames: readonly AspectFrameSize[];

  /**
   * Build a safe area from explicit frames (all centered at the origin).
   * @param frames - One or more target frames. Must not be empty.
   */
  constructor(frames: readonly AspectFrameSize[]) {
    this.frames = frames.map((f) => ({ width: f.width, height: f.height }));
    const rect = intersectFrames(this.frames);
    this.width = rect.width;
    this.height = rect.height;
  }

  /**
   * Build a safe area from target aspect ratios (width / height).
   *
   * Each aspect becomes a frame of the shared reference height, so the frame
   * width is `referenceHeight * aspect`. This matches the camera's `fill` mode
   * used by {@link Scene.setFrameAspect}.
   *
   * @param aspectRatios - Target aspect ratios, e.g. `[16/9, 9/16, 1/1]`.
   * @param options - Reference height (defaults to {@link DEFAULT_FRAME_HEIGHT}).
   * @returns A new SafeArea.
   * @throws If `aspectRatios` is empty.
   */
  static fromAspectRatios(
    aspectRatios: readonly number[],
    options: SafeAreaOptions = {},
  ): SafeArea {
    if (aspectRatios.length === 0) {
      throw new Error('SafeArea.fromAspectRatios requires at least one aspect ratio.');
    }
    const referenceHeight = options.referenceHeight ?? DEFAULT_FRAME_HEIGHT;
    const frames = aspectRatios.map((aspect) => ({
      width: referenceHeight * aspect,
      height: referenceHeight,
    }));
    return new SafeArea(frames);
  }

  /** Half the safe-area width. */
  get halfWidth(): number {
    return this.width / 2;
  }

  /** Half the safe-area height. */
  get halfHeight(): number {
    return this.height / 2;
  }

  /**
   * A point on the safe area for the given anchor, inset by `buffer`.
   * The center anchor returns the origin; edges inset on one axis, corners
   * on both.
   *
   * @param anchor - The anchor position.
   * @param buffer - Inset from the edge in world units. Defaults to 0.
   * @returns The anchor point `[x, y, 0]`.
   */
  anchorPoint(anchor: SafeAreaAnchor, buffer: number = 0): Vector3Tuple {
    const x = anchorsLeft(anchor)
      ? -(this.halfWidth - buffer)
      : anchorsRight(anchor)
        ? this.halfWidth - buffer
        : 0;
    const y = anchorsTop(anchor)
      ? this.halfHeight - buffer
      : anchorsBottom(anchor)
        ? -(this.halfHeight - buffer)
        : 0;
    return [x, y, 0];
  }

  /**
   * Position a mobject against the safe area so it stays inside every target
   * aspect. The matching edge or corner of the mobject's bounding box aligns
   * to the safe-area edge, inset by `buffer`; `center` moves the mobject to
   * the origin.
   *
   * @param mob - The mobject to position.
   * @param anchor - The anchor position. Defaults to `center`.
   * @param buffer - Inset from the edge in world units. Defaults to 0.
   * @returns The mobject, for chaining.
   */
  place<T extends Mobject>(mob: T, anchor: SafeAreaAnchor = 'center', buffer: number = 0): T {
    const halfW = mob.getWidth() / 2;
    const halfH = mob.getHeight() / 2;

    const cx = anchorsLeft(anchor)
      ? -this.halfWidth + buffer + halfW
      : anchorsRight(anchor)
        ? this.halfWidth - buffer - halfW
        : 0;
    const cy = anchorsTop(anchor)
      ? this.halfHeight - buffer - halfH
      : anchorsBottom(anchor)
        ? -this.halfHeight + buffer + halfH
        : 0;

    mob.moveTo([cx, cy, 0]);
    return mob;
  }

  /**
   * Whether a mobject's bounding box fits entirely inside the safe area,
   * optionally inset by `buffer`.
   *
   * @param mob - The mobject to test.
   * @param buffer - Inset from the edge in world units. Defaults to 0.
   * @returns True if the mobject is fully inside.
   */
  contains(mob: Mobject, buffer: number = 0): boolean {
    const eps = 1e-6;
    const limitX = this.halfWidth - buffer;
    const limitY = this.halfHeight - buffer;
    return (
      mob.getLeft()[0] >= -limitX - eps &&
      mob.getRight()[0] <= limitX + eps &&
      mob.getBottom()[1] >= -limitY - eps &&
      mob.getTop()[1] <= limitY + eps
    );
  }
}

/**
 * Frame/Screen mobjects for manimweb
 *
 * This module provides mobjects related to the camera frame and screen,
 * useful for backgrounds, fade effects, and screen-relative positioning.
 */

import { Rectangle, type RectangleOptions } from '../geometry/Rectangle';
import { Vector3Tuple } from '../../core/Mobject';
import { BLACK, WHITE } from '../../constants/colors';
import {
  DEFAULT_FRAME_WIDTH,
  DEFAULT_FRAME_HEIGHT,
} from '../../constants';

/**
 * Default 16:9 aspect ratio
 */
export const DEFAULT_ASPECT_RATIO = 16 / 9;

/**
 * Options for creating a ScreenRectangle
 */
export interface ScreenRectangleOptions extends Omit<RectangleOptions, 'width'> {
  /** Height of the rectangle. Default: 4 */
  height?: number;
  /** Aspect ratio (width/height). Default: 16/9 */
  aspectRatio?: number;
}

/**
 * ScreenRectangle - A rectangle that matches a screen/frame aspect ratio
 *
 * Creates a rectangle where the width is calculated from the height and aspect ratio.
 * Useful for creating screen-like shapes or video frame outlines.
 *
 * @example
 * ```typescript
 * // Create a 16:9 screen rectangle with height 4
 * const screen = new ScreenRectangle();
 *
 * // Create a 4:3 screen rectangle
 * const oldScreen = new ScreenRectangle({ aspectRatio: 4/3 });
 *
 * // Create a larger screen
 * const bigScreen = new ScreenRectangle({ height: 6 });
 * ```
 */
export class ScreenRectangle extends Rectangle {
  private _aspectRatio: number;

  constructor(options: ScreenRectangleOptions = {}) {
    const {
      height = 4,
      aspectRatio = DEFAULT_ASPECT_RATIO,
      ...rest
    } = options;

    const width = height * aspectRatio;

    super({ ...rest, width, height });

    this._aspectRatio = aspectRatio;
  }

  /**
   * Get the aspect ratio of this screen rectangle
   */
  getAspectRatio(): number {
    return this._aspectRatio;
  }

  /**
   * Set the aspect ratio, recalculating width while keeping height constant
   */
  setAspectRatio(ratio: number): this {
    this._aspectRatio = ratio;
    const newWidth = this.getHeight() * ratio;
    this.setWidth(newWidth);
    return this;
  }

  /**
   * Override setHeight to maintain aspect ratio
   */
  override setHeight(value: number): this {
    super.setHeight(value);
    super.setWidth(value * this._aspectRatio);
    return this;
  }

  /**
   * Create a copy of this ScreenRectangle
   */
  protected override _createCopy(): ScreenRectangle {
    return new ScreenRectangle({
      height: this.getHeight(),
      aspectRatio: this._aspectRatio,
      center: this.getRectCenter(),
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a FullScreenRectangle
 */
export interface FullScreenRectangleOptions {
  /** Fill color. Default: BLACK (#000000) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 0 (no stroke) */
  strokeWidth?: number;
  /** Stroke color. Default: same as fill color */
  strokeColor?: string;
  /** Frame width in world units. Default: DEFAULT_FRAME_WIDTH (14.222) */
  frameWidth?: number;
  /** Frame height in world units. Default: DEFAULT_FRAME_HEIGHT (8) */
  frameHeight?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * FullScreenRectangle - A rectangle that covers the entire camera frame
 *
 * Creates a rectangle sized to match the camera frame dimensions.
 * Perfect for backgrounds, overlays, and scene-wide effects.
 *
 * @example
 * ```typescript
 * // Create a black background
 * const bg = new FullScreenRectangle();
 *
 * // Create a semi-transparent blue overlay
 * const overlay = new FullScreenRectangle({
 *   color: '#0000ff',
 *   fillOpacity: 0.3,
 * });
 *
 * // Create a custom-sized full screen for a different camera setup
 * const customBg = new FullScreenRectangle({
 *   frameWidth: 16,
 *   frameHeight: 9,
 * });
 * ```
 */
export class FullScreenRectangle extends Rectangle {
  private _frameWidth: number;
  private _frameHeight: number;

  constructor(options: FullScreenRectangleOptions = {}) {
    const {
      color = BLACK,
      fillOpacity = 1,
      strokeWidth = 0,
      strokeColor,
      frameWidth = DEFAULT_FRAME_WIDTH,
      frameHeight = DEFAULT_FRAME_HEIGHT,
      center = [0, 0, 0],
    } = options;

    super({
      width: frameWidth,
      height: frameHeight,
      color: strokeColor ?? color,
      fillOpacity,
      strokeWidth,
      center,
    });

    this._frameWidth = frameWidth;
    this._frameHeight = frameHeight;

    // Set fill color explicitly if different from stroke
    if (strokeColor && strokeColor !== color) {
      this.fillColor = color;
    } else {
      this.fillColor = color;
    }
  }

  /**
   * Get the frame width
   */
  getFrameWidth(): number {
    return this._frameWidth;
  }

  /**
   * Get the frame height
   */
  getFrameHeight(): number {
    return this._frameHeight;
  }

  /**
   * Update to match new camera frame dimensions
   */
  matchCamera(frameWidth: number, frameHeight: number): this {
    this._frameWidth = frameWidth;
    this._frameHeight = frameHeight;
    this.setWidth(frameWidth);
    this.setHeight(frameHeight);
    return this;
  }

  /**
   * Create a copy of this FullScreenRectangle
   */
  protected override _createCopy(): FullScreenRectangle {
    return new FullScreenRectangle({
      color: this.fillColor ?? this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
      strokeColor: this.color,
      frameWidth: this._frameWidth,
      frameHeight: this._frameHeight,
      center: this.getRectCenter(),
    });
  }
}

/**
 * Options for creating a FullScreenFadeRectangle
 */
export interface FullScreenFadeRectangleOptions extends Omit<FullScreenRectangleOptions, 'fillOpacity'> {
  /** Initial opacity for the fade. Default: 0 (invisible) */
  opacity?: number;
}

/**
 * FullScreenFadeRectangle - A full screen rectangle designed for fade transitions
 *
 * Extends FullScreenRectangle with convenience methods for fade effects.
 * Commonly used for fade-to-black, fade-to-white, or other transition effects.
 *
 * @example
 * ```typescript
 * // Create a fade-to-black rectangle (starts invisible)
 * const fadeBlack = new FullScreenFadeRectangle();
 *
 * // Create a fade-to-white rectangle
 * const fadeWhite = new FullScreenFadeRectangle({ color: '#ffffff' });
 *
 * // In an animation, gradually increase opacity
 * timeline.add(fadeIn(fadeBlack));
 *
 * // Or manually animate opacity
 * fadeBlack.setFadeProgress(0.5); // Half faded
 * fadeBlack.setFadeProgress(1.0); // Fully faded (opaque)
 * ```
 */
export class FullScreenFadeRectangle extends FullScreenRectangle {
  private _fadeProgress: number;

  constructor(options: FullScreenFadeRectangleOptions = {}) {
    const { opacity = 0, ...rest } = options;

    super({ ...rest, fillOpacity: opacity });

    this._fadeProgress = opacity;
  }

  /**
   * Get the current fade progress (0 = transparent, 1 = opaque)
   */
  getFadeProgress(): number {
    return this._fadeProgress;
  }

  /**
   * Set the fade progress
   * @param progress Value from 0 (transparent) to 1 (opaque)
   */
  setFadeProgress(progress: number): this {
    this._fadeProgress = Math.max(0, Math.min(1, progress));
    this.fillOpacity = this._fadeProgress;
    this._markDirty();
    return this;
  }

  /**
   * Convenience method to set to fully transparent
   */
  fadeOut(): this {
    return this.setFadeProgress(0);
  }

  /**
   * Convenience method to set to fully opaque
   */
  fadeIn(): this {
    return this.setFadeProgress(1);
  }

  /**
   * Check if currently fully transparent
   */
  isTransparent(): boolean {
    return this._fadeProgress === 0;
  }

  /**
   * Check if currently fully opaque
   */
  isOpaque(): boolean {
    return this._fadeProgress === 1;
  }

  /**
   * Create a copy of this FullScreenFadeRectangle
   */
  protected override _createCopy(): FullScreenFadeRectangle {
    return new FullScreenFadeRectangle({
      color: this.fillColor ?? this.color,
      opacity: this._fadeProgress,
      strokeWidth: this.strokeWidth,
      strokeColor: this.color,
      frameWidth: this.getFrameWidth(),
      frameHeight: this.getFrameHeight(),
      center: this.getRectCenter(),
    });
  }
}

/**
 * Create a black fade rectangle for fade-to-black effects
 */
export function createFadeToBlack(options: Omit<FullScreenFadeRectangleOptions, 'color'> = {}): FullScreenFadeRectangle {
  return new FullScreenFadeRectangle({ ...options, color: BLACK });
}

/**
 * Create a white fade rectangle for fade-to-white effects
 */
export function createFadeToWhite(options: Omit<FullScreenFadeRectangleOptions, 'color'> = {}): FullScreenFadeRectangle {
  return new FullScreenFadeRectangle({ ...options, color: WHITE });
}

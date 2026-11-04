/**
 * GlyphVMobject - A VMobject created from a single font glyph's outline.
 *
 * Uses opentype.js to extract vector paths from a glyph, then converts
 * the path commands to cubic Bezier control points that VMobject can render
 * as Line2 geometry (for dash-based stroke animation).
 */

import { VMobject } from '../../core/VMobject';
import type { Font, Glyph } from 'opentype.js';
import { skeletonizeGlyph, type SkeletonizeOptions } from '../../utils/skeletonize';
import { DEFAULT_FONT_SIZE_PT, TEXT_FONT_SIZE_IN_WORLD_SPACE } from '../../constants/fontRender';

/**
 * Scale factor: font pixels (font-size units) to world units. Matches Manim
 * CE's Text: one em at font size 48 is TEXT_FONT_SIZE_IN_WORLD_SPACE (2/3).
 */
const PIXEL_TO_WORLD = TEXT_FONT_SIZE_IN_WORLD_SPACE / DEFAULT_FONT_SIZE_PT;

export interface GlyphVMobjectOptions {
  /** The opentype.js Glyph object */
  glyph: Glyph;
  /** The font this glyph belongs to (needed for unitsPerEm) */
  font: Font;
  /** Font size in pixels */
  fontSize: number;
  /** X offset in pixels (for character positioning) */
  xOffset?: number;
  /** Y offset in pixels */
  yOffset?: number;
  /** Stroke color */
  color?: string;
  /** Stroke width for outline drawing */
  strokeWidth?: number;
  /**
   * When true, compute the skeleton (medial axis) of the glyph outline
   * so the Write animation can draw along the center-line rather than
   * the perimeter. Default: false.
   */
  useSkeletonStroke?: boolean;
  /** Options forwarded to the skeletonization algorithm. */
  skeletonOptions?: SkeletonizeOptions;
}

/**
 * A VMobject that represents a single glyph's outline as cubic Bezier curves.
 *
 * The glyph's path commands (M, L, Q, C, Z) are converted to the cubic Bezier
 * control point format that VMobject expects:
 *   [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
 *
 * Multi-contour glyphs (e.g., "o", "B", "i") produce multiple subpaths, one
 * per contour. The subpath lengths are published via `setBaseSubpathLengths`
 * so the renderer strokes each contour on its own, with no line bridging the
 * disjoint pieces (issue #716).
 */
export class GlyphVMobject extends VMobject {
  private _glyph: Glyph;
  private _glyphFontSize: number;

  /** Whether skeleton computation was requested */
  private _useSkeletonStroke: boolean;
  /** Options for skeleton computation */
  private _skeletonOptions: SkeletonizeOptions;
  /** Cached skeleton path (null = not yet computed, empty array = no skeleton) */
  private _skeletonPath: number[][] | null = null;
  /** The raw outline points used to derive the skeleton */
  private _outlinePoints: number[][] = [];

  constructor(options: GlyphVMobjectOptions) {
    super();

    this._glyph = options.glyph;
    this._glyphFontSize = options.fontSize;
    this._useSkeletonStroke = options.useSkeletonStroke ?? false;
    this._skeletonOptions = options.skeletonOptions ?? {};

    const xOff = options.xOffset ?? 0;
    const yOff = options.yOffset ?? 0;
    const color = options.color ?? '#ffffff';
    const sw = options.strokeWidth ?? 2;

    this.setColor(color);
    this.strokeWidth = sw;
    this.fillOpacity = 0; // outline only during animation
    this._style.fillOpacity = 0;

    const { points: points3D, subpathLengths } = this._buildPoints(
      options.glyph,
      options.font,
      options.fontSize,
      xOff,
      yOff,
    );
    this._outlinePoints = points3D;

    if (points3D.length > 0) {
      this.setPoints3D(points3D);
      // Each glyph contour is its own subpath. The metadata makes the renderer
      // stroke each contour on its own, so no line bridges the disjoint pieces
      // (e.g. the dot and stem of 'i', the bowl of 'b'). See issue #716.
      if (subpathLengths.length > 0) {
        this.setBaseSubpathLengths(subpathLengths);
      }
    }

    // Eagerly compute skeleton if requested
    if (this._useSkeletonStroke && points3D.length > 0) {
      this._skeletonPath = skeletonizeGlyph(points3D, this._skeletonOptions);
    }
  }

  /**
   * Convert glyph path commands to cubic Bezier control points in world space.
   *
   * Each glyph contour (started by an `M` command) becomes a separate subpath.
   * The returned `subpathLengths` records the control-point count of each
   * contour so the renderer strokes them independently. No segment bridges two
   * disjoint contours (e.g. the dot and stem of 'i'). See issue #716.
   */
  private _buildPoints(
    glyph: Glyph,
    _font: Font,
    fontSize: number,
    xOffset: number,
    yOffset: number,
  ): { points: number[][]; subpathLengths: number[] } {
    // Get path commands from opentype.js
    const path = glyph.getPath(xOffset, yOffset, fontSize);
    const cmds = path.commands;

    if (cmds.length === 0) return { points: [], subpathLengths: [] };

    const allPoints: number[][] = [];
    const subpathLengths: number[] = [];
    let subpathStart = 0;
    let currentX = 0;
    let currentY = 0;
    let contourStartX = 0;
    let contourStartY = 0;
    let contourStarted = false;

    /** Record the length of the contour that just ended, if non-empty. */
    const closeSubpath = (): void => {
      const count = allPoints.length - subpathStart;
      if (count > 0) subpathLengths.push(count);
      subpathStart = allPoints.length;
    };

    for (const cmd of cmds) {
      switch (cmd.type) {
        case 'M': {
          // Start a new contour as its own subpath — never bridge the gap to
          // the previous contour with a connecting segment.
          if (contourStarted) {
            closeSubpath();
          }
          allPoints.push([cmd.x * PIXEL_TO_WORLD, -cmd.y * PIXEL_TO_WORLD, 0]);
          currentX = cmd.x;
          currentY = cmd.y;
          contourStartX = cmd.x;
          contourStartY = cmd.y;
          contourStarted = true;
          break;
        }

        case 'L': {
          // Line to — convert to cubic Bezier with control points at 1/3 and 2/3
          const x = cmd.x;
          const y = cmd.y;
          const cp1x = currentX + (x - currentX) / 3;
          const cp1y = currentY + (y - currentY) / 3;
          const cp2x = currentX + ((x - currentX) * 2) / 3;
          const cp2y = currentY + ((y - currentY) * 2) / 3;

          allPoints.push([cp1x * PIXEL_TO_WORLD, -cp1y * PIXEL_TO_WORLD, 0]);
          allPoints.push([cp2x * PIXEL_TO_WORLD, -cp2y * PIXEL_TO_WORLD, 0]);
          allPoints.push([x * PIXEL_TO_WORLD, -y * PIXEL_TO_WORLD, 0]);

          currentX = x;
          currentY = y;
          break;
        }

        case 'Q': {
          // Quadratic Bezier — convert to cubic
          // CP1 = P0 + 2/3*(Q - P0), CP2 = P + 2/3*(Q - P)
          const qx = cmd.x1;
          const qy = cmd.y1;
          const x = cmd.x;
          const y = cmd.y;

          const cp1x = currentX + (2 / 3) * (qx - currentX);
          const cp1y = currentY + (2 / 3) * (qy - currentY);
          const cp2x = x + (2 / 3) * (qx - x);
          const cp2y = y + (2 / 3) * (qy - y);

          allPoints.push([cp1x * PIXEL_TO_WORLD, -cp1y * PIXEL_TO_WORLD, 0]);
          allPoints.push([cp2x * PIXEL_TO_WORLD, -cp2y * PIXEL_TO_WORLD, 0]);
          allPoints.push([x * PIXEL_TO_WORLD, -y * PIXEL_TO_WORLD, 0]);

          currentX = x;
          currentY = y;
          break;
        }

        case 'C': {
          // Cubic Bezier — use directly
          allPoints.push([cmd.x1 * PIXEL_TO_WORLD, -cmd.y1 * PIXEL_TO_WORLD, 0]);
          allPoints.push([cmd.x2 * PIXEL_TO_WORLD, -cmd.y2 * PIXEL_TO_WORLD, 0]);
          allPoints.push([cmd.x * PIXEL_TO_WORLD, -cmd.y * PIXEL_TO_WORLD, 0]);

          currentX = cmd.x;
          currentY = cmd.y;
          break;
        }

        case 'Z': {
          // Close path — line back to contour start
          if (currentX !== contourStartX || currentY !== contourStartY) {
            const cp1x = currentX + (contourStartX - currentX) / 3;
            const cp1y = currentY + (contourStartY - currentY) / 3;
            const cp2x = currentX + ((contourStartX - currentX) * 2) / 3;
            const cp2y = currentY + ((contourStartY - currentY) * 2) / 3;

            allPoints.push([cp1x * PIXEL_TO_WORLD, -cp1y * PIXEL_TO_WORLD, 0]);
            allPoints.push([cp2x * PIXEL_TO_WORLD, -cp2y * PIXEL_TO_WORLD, 0]);
            allPoints.push([contourStartX * PIXEL_TO_WORLD, -contourStartY * PIXEL_TO_WORLD, 0]);
          }
          currentX = contourStartX;
          currentY = contourStartY;
          break;
        }
      }
    }

    // Record the final contour.
    closeSubpath();

    return { points: allPoints, subpathLengths };
  }

  /**
   * Get the skeleton (medial-axis) path for this glyph.
   *
   * The skeleton is computed lazily on first call (unless pre-computed
   * at construction via `useSkeletonStroke: true`).
   *
   * @param options  Override skeletonization options for this call.
   * @returns Cubic Bezier control points tracing the glyph center-line,
   *   or `null` if the glyph has no computable skeleton.
   */
  getSkeletonPath(options?: SkeletonizeOptions): number[][] | null {
    if (this._skeletonPath !== null)
      return this._skeletonPath.length > 0 ? this._skeletonPath : null;

    if (this._outlinePoints.length < 4) {
      this._skeletonPath = [];
      return null;
    }

    this._skeletonPath = skeletonizeGlyph(this._outlinePoints, options ?? this._skeletonOptions);
    return this._skeletonPath.length > 0 ? this._skeletonPath : null;
  }

  /**
   * Returns true if this glyph was configured with skeleton stroke mode.
   */
  get useSkeletonStroke(): boolean {
    return this._useSkeletonStroke;
  }

  /**
   * Enable or disable skeleton stroke mode.
   * If enabling, the skeleton is computed immediately.
   */
  set useSkeletonStroke(value: boolean) {
    this._useSkeletonStroke = value;
    if (value && this._skeletonPath === null && this._outlinePoints.length > 0) {
      this._skeletonPath = skeletonizeGlyph(this._outlinePoints, this._skeletonOptions);
    }
  }

  override copy(): GlyphVMobject {
    const copy = new GlyphVMobject({
      glyph: this._glyph,
      font: null as unknown as Font, // font reference not needed for copy since points are already built
      fontSize: this._glyphFontSize,
      color: this.color,
      strokeWidth: this.strokeWidth,
      useSkeletonStroke: this._useSkeletonStroke,
      skeletonOptions: { ...this._skeletonOptions },
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

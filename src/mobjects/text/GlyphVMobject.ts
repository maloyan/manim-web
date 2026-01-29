/**
 * GlyphVMobject - A VMobject created from a single font glyph's outline.
 *
 * Uses opentype.js to extract vector paths from a glyph, then converts
 * the path commands to cubic Bezier control points that VMobject can render
 * as Line2 geometry (for dash-based stroke animation).
 */

import { VMobject } from '../../core/VMobject';
import type { Font, Glyph } from 'opentype.js';

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

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
}

/**
 * A VMobject that represents a single glyph's outline as cubic Bezier curves.
 *
 * The glyph's path commands (M, L, Q, C, Z) are converted to the cubic Bezier
 * control point format that VMobject expects:
 *   [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
 *
 * Multi-contour glyphs (e.g., "o", "B", "i") produce multiple sub-paths
 * joined by degenerate zero-length segments.
 */
export class GlyphVMobject extends VMobject {
  private _glyph: Glyph;
  private _glyphFontSize: number;

  constructor(options: GlyphVMobjectOptions) {
    super();

    this._glyph = options.glyph;
    this._glyphFontSize = options.fontSize;

    const xOff = options.xOffset ?? 0;
    const yOff = options.yOffset ?? 0;
    const color = options.color ?? '#ffffff';
    const sw = options.strokeWidth ?? 2;

    this.setColor(color);
    this.strokeWidth = sw;
    this.fillOpacity = 0; // outline only during animation
    this._style.fillOpacity = 0;

    const points3D = this._buildPoints(options.glyph, options.font, options.fontSize, xOff, yOff);
    if (points3D.length > 0) {
      this.setPoints3D(points3D);
    }
  }

  /**
   * Convert glyph path commands to cubic Bezier control points in world space.
   */
  private _buildPoints(
    glyph: Glyph,
    _font: Font,
    fontSize: number,
    xOffset: number,
    yOffset: number,
  ): number[][] {
    // Get path commands from opentype.js
    const path = glyph.getPath(xOffset, yOffset, fontSize);
    const cmds = path.commands;

    if (cmds.length === 0) return [];

    const allPoints: number[][] = [];
    let currentX = 0;
    let currentY = 0;
    let contourStartX = 0;
    let contourStartY = 0;
    let contourStarted = false;

    for (const cmd of cmds) {
      switch (cmd.type) {
        case 'M': {
          // If we had a previous contour, connect with a degenerate segment
          if (contourStarted && allPoints.length > 0) {
            // Add degenerate zero-length cubic to connect contours
            const lastPt = allPoints[allPoints.length - 1];
            const newPt = [cmd.x * PIXEL_TO_WORLD, -cmd.y * PIXEL_TO_WORLD, 0];
            allPoints.push([...lastPt]);  // handle1 = previous anchor
            allPoints.push([...newPt]);   // handle2 = new anchor
            allPoints.push([...newPt]);   // anchor2 = new start
          } else {
            // First contour: set the start anchor
            allPoints.push([cmd.x * PIXEL_TO_WORLD, -cmd.y * PIXEL_TO_WORLD, 0]);
          }
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
          const cp2x = currentX + (x - currentX) * 2 / 3;
          const cp2y = currentY + (y - currentY) * 2 / 3;

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
            const cp2x = currentX + (contourStartX - currentX) * 2 / 3;
            const cp2y = currentY + (contourStartY - currentY) * 2 / 3;

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

    return allPoints;
  }

  protected override _createCopy(): GlyphVMobject {
    return new GlyphVMobject({
      glyph: this._glyph,
      font: null as any, // font reference not needed for copy since points are already built
      fontSize: this._glyphFontSize,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}

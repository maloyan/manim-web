/**
 * ShowPassingFlashWithThinningStrokeWidth animation - creates a flash of light
 * traveling along a path with stroke width that tapers from full to thin.
 *
 * This extends ShowPassingFlash by adding a stroke width taper,
 * where the flash starts with full stroke width and progressively thins
 * as it travels along the path.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject } from '../../core/Mobject';
import { ShowPassingFlash, ShowPassingFlashOptions } from './ShowPassingFlash';

export interface ShowPassingFlashWithThinningStrokeWidthOptions extends ShowPassingFlashOptions {
  /** Minimum stroke width at the tail (proportion of strokeWidth). Default: 0.1 */
  minStrokeWidthRatio?: number;
}

export class ShowPassingFlashWithThinningStrokeWidth extends ShowPassingFlash {
  /** Minimum stroke width ratio (tail) */
  readonly minStrokeWidthRatio: number;

  constructor(mobject: Mobject, options: ShowPassingFlashWithThinningStrokeWidthOptions = {}) {
    super(mobject, options);
    this.minStrokeWidthRatio = options.minStrokeWidthRatio ?? 0.1;
  }

  override interpolate(alpha: number): void {
    if (!this._flashGroup || this._pathPoints.length < 2) return;

    // Clear previous flash lines
    while (this._flashGroup.children.length > 0) {
      const child = this._flashGroup.children[0];
      this._flashGroup.remove(child);
      if (child instanceof Line2) {
        child.geometry.dispose();
        (child.material as LineMaterial).dispose();
      }
    }

    // Calculate which portion of the path to highlight
    const numPoints = this._pathPoints.length;
    const flashStart = alpha - this.timeWidth / 2;
    const flashEnd = alpha + this.timeWidth / 2;

    // Get point indices for the flash segment
    const startIdx = Math.max(0, Math.floor(flashStart * (numPoints - 1)));
    const endIdx = Math.min(numPoints - 1, Math.ceil(flashEnd * (numPoints - 1)));

    if (startIdx >= endIdx) return;

    // Extract flash segment points
    const flashPoints = this._pathPoints.slice(startIdx, endIdx + 1);
    if (flashPoints.length < 2) return;

    // Calculate base opacity based on position - fade in at start, fade out at end
    let baseOpacity = 1;
    if (alpha < this.timeWidth) {
      baseOpacity = alpha / this.timeWidth;
    } else if (alpha > 1 - this.timeWidth) {
      baseOpacity = (1 - alpha) / this.timeWidth;
    }

    // Create multiple line segments with varying stroke widths for taper effect
    // We break the flash into segments, each with progressively thinner stroke
    const numSegments = Math.max(2, flashPoints.length - 1);

    for (let i = 0; i < numSegments; i++) {
      const segmentStartIdx = i;
      const segmentEndIdx = i + 1;

      if (segmentEndIdx >= flashPoints.length) break;

      const pt0 = flashPoints[segmentStartIdx];
      const pt1 = flashPoints[segmentEndIdx];

      const positions: number[] = [
        pt0[0], pt0[1], (pt0[2] ?? 0) + 0.01,
        pt1[0], pt1[1], (pt1[2] ?? 0) + 0.01,
      ];

      const geometry = new LineGeometry();
      geometry.setPositions(positions);

      // Calculate stroke width taper
      // The "head" (leading edge) of the flash has full width
      // The "tail" (trailing edge) has minimum width
      // Progress along flash: 0 = tail (behind), 1 = head (front)
      const progressAlongFlash = i / Math.max(1, numSegments - 1);

      // Stroke width: min at tail (progressAlongFlash=0), max at head (progressAlongFlash=1)
      const strokeWidthMultiplier = this.minStrokeWidthRatio +
        (1 - this.minStrokeWidthRatio) * progressAlongFlash;
      const segmentStrokeWidth = this.flashStrokeWidth * strokeWidthMultiplier;

      // Opacity also tapers slightly for smoother visual
      const segmentOpacity = baseOpacity * (0.5 + 0.5 * progressAlongFlash);

      const material = new LineMaterial({
        color: new THREE.Color(this.flashColor).getHex(),
        linewidth: segmentStrokeWidth * 0.01,
        transparent: true,
        opacity: segmentOpacity,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      });

      const line = new Line2(geometry, material);
      line.computeLineDistances();
      this._flashGroup.add(line);
    }
  }
}

/**
 * Create a ShowPassingFlashWithThinningStrokeWidth animation for a mobject.
 * Shows a highlighted flash traveling along the mobject's path with stroke
 * width that tapers from full width at the head to thin at the tail.
 * @param mobject The mobject (preferably VMobject) to show flash on
 * @param options Animation options (color, timeWidth, strokeWidth, minStrokeWidthRatio)
 */
export function showPassingFlashWithThinningStrokeWidth(
  mobject: Mobject,
  options?: ShowPassingFlashWithThinningStrokeWidthOptions
): ShowPassingFlashWithThinningStrokeWidth {
  return new ShowPassingFlashWithThinningStrokeWidth(mobject, options);
}

/**
 * ShowPassingFlashWithThinningStrokeWidth animation - creates a flash of light
 * traveling along a path with stroke width that tapers from full to thin.
 *
 * This extends the ShowPassingFlash concept by adding a stroke width taper,
 * where the flash starts with full stroke width and progressively thins
 * as it travels along the path.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';
import { YELLOW, DEFAULT_STROKE_WIDTH } from '../../constants';

export interface ShowPassingFlashWithThinningStrokeWidthOptions extends AnimationOptions {
  /** Color of the flash. Default: YELLOW */
  color?: string;
  /** Width of the flash as a proportion of the path (0-1). Default: 0.2 */
  timeWidth?: number;
  /** Starting stroke width of the flash. Default: DEFAULT_STROKE_WIDTH * 1.5 */
  strokeWidth?: number;
  /** Minimum stroke width at the tail (proportion of strokeWidth). Default: 0.1 */
  minStrokeWidthRatio?: number;
}

export class ShowPassingFlashWithThinningStrokeWidth extends Animation {
  /** Flash color */
  readonly flashColor: string;

  /** Width of flash as proportion of path */
  readonly timeWidth: number;

  /** Flash stroke width (maximum at head) */
  readonly flashStrokeWidth: number;

  /** Minimum stroke width ratio (tail) */
  readonly minStrokeWidthRatio: number;

  /** Flash line group */
  private _flashGroup: THREE.Group | null = null;

  /** Parent object */
  private _parentObject: THREE.Object3D | null = null;

  /** Path points (sampled from VMobject) */
  private _pathPoints: number[][] = [];

  /** Whether mobject is a VMobject */
  private _isVMobject: boolean = false;

  constructor(mobject: Mobject, options: ShowPassingFlashWithThinningStrokeWidthOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? linear,
    });
    this.flashColor = options.color ?? YELLOW;
    this.timeWidth = options.timeWidth ?? 0.2;
    this.flashStrokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH * 1.5;
    this.minStrokeWidthRatio = options.minStrokeWidthRatio ?? 0.1;
    this._isVMobject = mobject instanceof VMobject;
  }

  override begin(): void {
    super.begin();

    const threeObj = this.mobject.getThreeObject();
    this._parentObject = threeObj.parent ?? threeObj;

    // Get path points from VMobject or use bounding box
    if (this._isVMobject) {
      const vmob = this.mobject as VMobject;
      this._pathPoints = vmob.getPoints();

      // Sample Bezier path for smoother flash
      this._pathPoints = this._samplePath(this._pathPoints);
    } else {
      // For non-VMobjects, create a simple path around bounding box
      const center = this.mobject.getCenter();
      const box = new THREE.Box3().setFromObject(threeObj);
      const size = new THREE.Vector3();
      box.getSize(size);
      const hw = size.x / 2;
      const hh = size.y / 2;

      this._pathPoints = [
        [center[0] - hw, center[1] + hh, center[2]],
        [center[0] + hw, center[1] + hh, center[2]],
        [center[0] + hw, center[1] - hh, center[2]],
        [center[0] - hw, center[1] - hh, center[2]],
        [center[0] - hw, center[1] + hh, center[2]],
      ];
    }

    // Create flash group
    this._flashGroup = new THREE.Group();
    this._parentObject.add(this._flashGroup);
  }

  private _samplePath(points: number[][]): number[][] {
    if (points.length < 4) return points;

    const result: number[][] = [];
    const samplesPerSegment = 4;

    // Process Bezier segments
    for (let i = 0; i + 3 < points.length; i += 3) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];
      const p3 = points[i + 3];

      for (let t = 0; t <= samplesPerSegment; t++) {
        const u = t / samplesPerSegment;
        const pt = this._evalCubicBezier(p0, p1, p2, p3, u);
        if (result.length === 0 || this._distance(pt, result[result.length - 1]) > 0.01) {
          result.push(pt);
        }
      }
    }

    return result.length > 1 ? result : points;
  }

  private _evalCubicBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return [
      mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
      mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
      (p0[2] ?? 0) * mt3 + (p1[2] ?? 0) * 3 * mt2 * t + (p2[2] ?? 0) * 3 * mt * t2 + (p3[2] ?? 0) * t3,
    ];
  }

  private _distance(a: number[], b: number[]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = (a[2] ?? 0) - (b[2] ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  interpolate(alpha: number): void {
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

  override finish(): void {
    // Remove flash group from scene
    if (this._flashGroup && this._parentObject) {
      this._parentObject.remove(this._flashGroup);

      this._flashGroup.traverse((child) => {
        if (child instanceof Line2) {
          child.geometry.dispose();
          (child.material as LineMaterial).dispose();
        }
      });

      this._flashGroup = null;
    }

    super.finish();
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

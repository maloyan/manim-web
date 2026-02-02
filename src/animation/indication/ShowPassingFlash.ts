/**
 * ShowPassingFlash animation - creates a flash of light traveling along a path.
 *
 * This mimics Manim's ShowPassingFlash animation, which shows a highlighted
 * portion of a VMobject's stroke traveling along its path.
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
import { evalCubicBezier } from '../../utils/math';

export interface ShowPassingFlashOptions extends AnimationOptions {
  /** Color of the flash. Default: YELLOW */
  color?: string;
  /** Width of the flash as a proportion of the path (0-1). Default: 0.2 */
  timeWidth?: number;
  /** Stroke width of the flash. Default: DEFAULT_STROKE_WIDTH * 1.5 */
  strokeWidth?: number;
}

export class ShowPassingFlash extends Animation {
  /** Flash color */
  readonly flashColor: string;

  /** Width of flash as proportion of path */
  readonly timeWidth: number;

  /** Flash stroke width */
  readonly flashStrokeWidth: number;

  /** Flash line group */
  protected _flashGroup: THREE.Group | null = null;

  /** Parent object */
  protected _parentObject: THREE.Object3D | null = null;

  /** Path points (sampled from VMobject) */
  protected _pathPoints: number[][] = [];

  /** Whether mobject is a VMobject */
  protected _isVMobject: boolean = false;

  constructor(mobject: Mobject, options: ShowPassingFlashOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? linear,
    });
    this.flashColor = options.color ?? YELLOW;
    this.timeWidth = options.timeWidth ?? 0.2;
    this.flashStrokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH * 1.5;
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

  protected _samplePath(points: number[][]): number[][] {
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
        const pt = evalCubicBezier(p0, p1, p2, p3, u);
        if (result.length === 0 || this._distance(pt, result[result.length - 1]) > 0.01) {
          result.push(pt);
        }
      }
    }

    return result.length > 1 ? result : points;
  }

  protected _distance(a: number[], b: number[]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = (a[2] ?? 0) - (b[2] ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  interpolate(alpha: number): void {
    if (!this._flashGroup || this._pathPoints.length < 2) return;

    // Clear previous flash
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

    // Create flash line
    const positions: number[] = [];
    for (const pt of flashPoints) {
      positions.push(pt[0], pt[1], (pt[2] ?? 0) + 0.01); // Slightly above original
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    // Calculate opacity based on position - fade in at start, fade out at end
    let opacity = 1;
    if (alpha < this.timeWidth) {
      opacity = alpha / this.timeWidth;
    } else if (alpha > 1 - this.timeWidth) {
      opacity = (1 - alpha) / this.timeWidth;
    }

    const material = new LineMaterial({
      color: new THREE.Color(this.flashColor).getHex(),
      linewidth: this.flashStrokeWidth * 0.01,
      transparent: true,
      opacity: opacity,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });

    const line = new Line2(geometry, material);
    line.computeLineDistances();
    this._flashGroup.add(line);
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
 * Create a ShowPassingFlash animation for a mobject.
 * Shows a highlighted flash traveling along the mobject's path.
 * @param mobject The mobject (preferably VMobject) to show flash on
 * @param options ShowPassingFlash options (color, timeWidth, strokeWidth)
 */
export function showPassingFlash(mobject: Mobject, options?: ShowPassingFlashOptions): ShowPassingFlash {
  return new ShowPassingFlash(mobject, options);
}

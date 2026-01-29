/**
 * Circumscribe animation - draws a shape around the mobject.
 *
 * This mimics Manim's Circumscribe animation, which draws a rectangle
 * or circle around a mobject to highlight it, then fades it away.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { YELLOW, DEFAULT_STROKE_WIDTH } from '../../constants';

export type CircumscribeShape = 'rectangle' | 'circle';

export interface CircumscribeOptions extends AnimationOptions {
  /** Shape to draw around the mobject. Default: 'rectangle' */
  shape?: CircumscribeShape;
  /** Color of the circumscribe shape. Default: YELLOW */
  color?: string;
  /** Buffer space between mobject and shape. Default: 0.2 */
  buff?: number;
  /** Width of the shape stroke. Default: DEFAULT_STROKE_WIDTH */
  strokeWidth?: number;
  /** Time proportion to draw the shape (0-1). Default: 0.3 */
  timeWidth?: number;
  /** Whether to fade out after drawing. Default: true */
  fadeOut?: boolean;
}

export class Circumscribe extends Animation {
  /** Shape type */
  readonly shapeType: CircumscribeShape;

  /** Shape color */
  readonly shapeColor: string;

  /** Buffer space */
  readonly buff: number;

  /** Stroke width */
  readonly strokeWidth: number;

  /** Time proportion for drawing */
  readonly timeWidth: number;

  /** Whether to fade out */
  readonly fadeOut: boolean;

  /** Shape line group */
  private _shapeGroup: THREE.Group | null = null;

  /** Parent object */
  private _parentObject: THREE.Object3D | null = null;

  /** Bounds of the mobject */
  private _bounds: { center: Vector3Tuple; width: number; height: number } | null = null;

  /** Total path length for progressive drawing */
  private _totalLength: number = 0;

  constructor(mobject: Mobject, options: CircumscribeOptions = {}) {
    super(mobject, { duration: options.duration ?? 1, ...options });
    this.shapeType = options.shape ?? 'rectangle';
    this.shapeColor = options.color ?? YELLOW;
    this.buff = options.buff ?? 0.2;
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    this.timeWidth = options.timeWidth ?? 0.3;
    this.fadeOut = options.fadeOut ?? true;
  }

  override begin(): void {
    super.begin();

    // Calculate bounds of mobject
    const center = this.mobject.getCenter();
    const threeObj = this.mobject.getThreeObject();
    const box = new THREE.Box3().setFromObject(threeObj);
    const size = new THREE.Vector3();
    box.getSize(size);

    this._bounds = {
      center: center,
      width: size.x + this.buff * 2,
      height: size.y + this.buff * 2,
    };

    // Get parent
    this._parentObject = threeObj.parent ?? threeObj;

    // Create shape
    this._shapeGroup = new THREE.Group();
    this._shapeGroup.position.set(center[0], center[1], center[2] + 0.01);

    const line = this._createShape();
    this._shapeGroup.add(line);

    this._parentObject.add(this._shapeGroup);
  }

  private _createShape(): Line2 {
    const material = new LineMaterial({
      color: new THREE.Color(this.shapeColor).getHex(),
      linewidth: this.strokeWidth * 0.01,
      transparent: true,
      opacity: 1,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      dashed: true,
      dashScale: 1,
    });

    let positions: number[];

    if (this.shapeType === 'circle') {
      positions = this._createCirclePositions();
    } else {
      positions = this._createRectanglePositions();
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const line = new Line2(geometry, material);
    line.computeLineDistances();

    // Calculate total length for dash animation
    const lineDistances = (line.geometry as any).attributes.lineDistance;
    if (lineDistances && lineDistances.count > 0) {
      this._totalLength = lineDistances.array[lineDistances.count - 1] || 1;
    } else {
      this._totalLength = 1;
    }

    // Start with nothing visible
    material.dashSize = 0;
    material.gapSize = this._totalLength;
    material.needsUpdate = true;

    return line;
  }

  private _createRectanglePositions(): number[] {
    if (!this._bounds) return [];

    const hw = this._bounds.width / 2;
    const hh = this._bounds.height / 2;

    // Rectangle corners (centered at origin since group is at mobject center)
    return [
      -hw, hh, 0,    // top-left
      hw, hh, 0,     // top-right
      hw, -hh, 0,    // bottom-right
      -hw, -hh, 0,   // bottom-left
      -hw, hh, 0,    // close back to top-left
    ];
  }

  private _createCirclePositions(): number[] {
    if (!this._bounds) return [];

    const radius = Math.max(this._bounds.width, this._bounds.height) / 2;
    const numSegments = 64;
    const positions: number[] = [];

    for (let i = 0; i <= numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }

    return positions;
  }

  interpolate(alpha: number): void {
    if (!this._shapeGroup) return;

    this._shapeGroup.traverse((child) => {
      if (child instanceof Line2) {
        const material = child.material as LineMaterial;

        // Calculate draw progress
        // For the first (1 - timeWidth) of the animation, draw the shape
        // For the last timeWidth, optionally fade out
        const drawEnd = 1 - this.timeWidth;
        const drawAlpha = drawEnd > 0 ? Math.min(1, alpha / drawEnd) : 1;

        // Progressive drawing using dash
        const visibleLength = drawAlpha * this._totalLength;
        material.dashSize = visibleLength;
        material.gapSize = this._totalLength - visibleLength + 0.0001;

        // Fade out in the last portion
        if (this.fadeOut && alpha > drawEnd) {
          const fadeAlpha = (alpha - drawEnd) / this.timeWidth;
          material.opacity = 1 - fadeAlpha;
        } else {
          material.opacity = 1;
        }

        material.needsUpdate = true;
      }
    });
  }

  override finish(): void {
    // Remove shape from scene
    if (this._shapeGroup && this._parentObject) {
      this._parentObject.remove(this._shapeGroup);

      this._shapeGroup.traverse((child) => {
        if (child instanceof Line2) {
          child.geometry.dispose();
          (child.material as LineMaterial).dispose();
        }
      });

      this._shapeGroup = null;
    }

    super.finish();
  }
}

/**
 * Create a Circumscribe animation for a mobject.
 * Draws a shape (rectangle or circle) around the mobject.
 * @param mobject The mobject to circumscribe
 * @param options Circumscribe options (shape, color, buff, strokeWidth, timeWidth, fadeOut)
 */
export function circumscribe(mobject: Mobject, options?: CircumscribeOptions): Circumscribe {
  return new Circumscribe(mobject, options);
}

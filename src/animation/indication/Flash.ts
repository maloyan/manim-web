/**
 * Flash animation - creates a flash of light/color emanating from the mobject.
 *
 * This mimics Manim's Flash animation, which creates radiating lines
 * that flash outward from the mobject's center.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { YELLOW, DEFAULT_STROKE_WIDTH } from '../../constants';

export interface FlashOptions extends AnimationOptions {
  /** Color of the flash lines. Default: YELLOW */
  color?: string;
  /** Number of flash lines. Default: 8 */
  numLines?: number;
  /** Maximum radius the flash extends to. Default: 1 */
  flashRadius?: number;
  /** Width of flash lines. Default: DEFAULT_STROKE_WIDTH */
  lineWidth?: number;
  /** Starting radius (from center). Default: 0 */
  innerRadius?: number;
}

export class Flash extends Animation {
  /** Flash color */
  readonly flashColor: string;

  /** Number of flash lines */
  readonly numLines: number;

  /** Maximum radius */
  readonly flashRadius: number;

  /** Line width */
  readonly lineWidth: number;

  /** Inner radius */
  readonly innerRadius: number;

  /** Flash lines group */
  private _flashGroup: THREE.Group | null = null;

  /** Parent object to add flash to */
  private _parentObject: THREE.Object3D | null = null;

  /** Center point of the mobject */
  private _center: Vector3Tuple = [0, 0, 0];

  constructor(mobject: Mobject, options: FlashOptions = {}) {
    super(mobject, { duration: options.duration ?? 0.5, ...options });
    this.flashColor = options.color ?? YELLOW;
    this.numLines = options.numLines ?? 8;
    this.flashRadius = options.flashRadius ?? 1;
    this.lineWidth = options.lineWidth ?? DEFAULT_STROKE_WIDTH;
    this.innerRadius = options.innerRadius ?? 0;
  }

  override begin(): void {
    super.begin();

    // Get center of mobject
    this._center = this.mobject.getCenter();

    // Get parent Three.js object
    const threeObj = this.mobject.getThreeObject();
    this._parentObject = threeObj.parent ?? threeObj;

    // Create flash lines group
    this._flashGroup = new THREE.Group();
    this._flashGroup.position.set(this._center[0], this._center[1], this._center[2] + 0.01);

    // Create radial flash lines
    for (let i = 0; i < this.numLines; i++) {
      const angle = (i / this.numLines) * Math.PI * 2;
      const line = this._createFlashLine(angle);
      this._flashGroup.add(line);
    }

    // Add to scene
    this._parentObject.add(this._flashGroup);
  }

  private _createFlashLine(angle: number): Line2 {
    const geometry = new LineGeometry();
    const material = new LineMaterial({
      color: new THREE.Color(this.flashColor).getHex(),
      linewidth: this.lineWidth * 0.01,
      transparent: true,
      opacity: 1,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });

    // Initial position: just a point at inner radius
    const innerX = Math.cos(angle) * this.innerRadius;
    const innerY = Math.sin(angle) * this.innerRadius;
    geometry.setPositions([innerX, innerY, 0, innerX, innerY, 0]);

    const line = new Line2(geometry, material);
    line.computeLineDistances();
    return line;
  }

  interpolate(alpha: number): void {
    if (!this._flashGroup) return;

    // Flash grows outward and fades
    const currentOuterRadius = this.innerRadius + (this.flashRadius - this.innerRadius) * alpha;
    const opacity = 1 - alpha; // Fade out as it expands

    this._flashGroup.children.forEach((child, i) => {
      if (child instanceof Line2) {
        const angle = (i / this.numLines) * Math.PI * 2;
        const material = child.material as LineMaterial;

        // Update opacity
        material.opacity = opacity;
        material.transparent = true;

        // Update line positions - grow from inner to outer radius
        const innerX = Math.cos(angle) * this.innerRadius;
        const innerY = Math.sin(angle) * this.innerRadius;
        const outerX = Math.cos(angle) * currentOuterRadius;
        const outerY = Math.sin(angle) * currentOuterRadius;

        // Create new geometry with updated positions
        const geometry = new LineGeometry();
        geometry.setPositions([innerX, innerY, 0, outerX, outerY, 0]);

        // Dispose old geometry and set new one
        child.geometry.dispose();
        child.geometry = geometry;
        child.computeLineDistances();
      }
    });
  }

  override finish(): void {
    // Remove flash group from scene
    if (this._flashGroup && this._parentObject) {
      this._parentObject.remove(this._flashGroup);

      // Dispose geometries and materials
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
 * Create a Flash animation for a mobject.
 * Creates radiating lines that flash outward from the mobject's center.
 * @param mobject The mobject to flash around
 * @param options Flash options (color, numLines, flashRadius, lineWidth)
 */
export function flash(mobject: Mobject, options?: FlashOptions): Flash {
  return new Flash(mobject, options);
}

/**
 * FocusOn animation - creates a zoom/focus effect on a mobject.
 *
 * This mimics Manim's FocusOn animation, which creates an expanding
 * ring or dot that focuses attention on a specific point.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { smooth } from '../../rate-functions';
import { GRAY, DEFAULT_STROKE_WIDTH } from '../../constants';

export interface FocusOnOptions extends AnimationOptions {
  /** Color of the focus effect. Default: GRAY */
  color?: string;
  /** Starting radius. Default: 2 */
  startRadius?: number;
  /** Ending radius (shrinks down to this). Default: 0 */
  endRadius?: number;
  /** Number of rings. Default: 5 */
  numRings?: number;
  /** Stroke width. Default: DEFAULT_STROKE_WIDTH */
  strokeWidth?: number;
  /** Opacity of the rings. Default: 0.5 */
  opacity?: number;
}

export class FocusOn extends Animation {
  /** Focus color */
  readonly focusColor: string;

  /** Starting radius */
  readonly startRadius: number;

  /** Ending radius */
  readonly endRadius: number;

  /** Number of rings */
  readonly numRings: number;

  /** Stroke width */
  readonly strokeWidth: number;

  /** Ring opacity */
  readonly ringOpacity: number;

  /** Focus rings group */
  private _ringsGroup: THREE.Group | null = null;

  /** Parent object */
  private _parentObject: THREE.Object3D | null = null;

  /** Center point */
  private _center: Vector3Tuple = [0, 0, 0];

  constructor(mobject: Mobject, options: FocusOnOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 0.5,
      rateFunc: options.rateFunc ?? smooth,
    });
    this.focusColor = options.color ?? GRAY;
    this.startRadius = options.startRadius ?? 2;
    this.endRadius = options.endRadius ?? 0;
    this.numRings = options.numRings ?? 5;
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    this.ringOpacity = options.opacity ?? 0.5;
  }

  override begin(): void {
    super.begin();

    // Get center of mobject
    this._center = this.mobject.getCenter();

    // Get parent
    const threeObj = this.mobject.getThreeObject();
    this._parentObject = threeObj.parent ?? threeObj;

    // Create rings group
    this._ringsGroup = new THREE.Group();
    this._ringsGroup.position.set(this._center[0], this._center[1], this._center[2] - 0.01);

    // Create concentric rings
    for (let i = 0; i < this.numRings; i++) {
      const ring = this._createRing(this.startRadius);
      this._ringsGroup.add(ring);
    }

    this._parentObject.add(this._ringsGroup);
  }

  private _createRing(radius: number): Line2 {
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

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: new THREE.Color(this.focusColor).getHex(),
      linewidth: this.strokeWidth * 0.01,
      transparent: true,
      opacity: this.ringOpacity,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });

    const ring = new Line2(geometry, material);
    ring.computeLineDistances();
    return ring;
  }

  private _updateRing(ring: Line2, radius: number, opacity: number): void {
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

    // Create new geometry
    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    // Update geometry and material
    ring.geometry.dispose();
    ring.geometry = geometry;
    ring.computeLineDistances();

    const material = ring.material as LineMaterial;
    material.opacity = opacity;
    material.needsUpdate = true;
  }

  interpolate(alpha: number): void {
    if (!this._ringsGroup) return;

    this._ringsGroup.children.forEach((child, i) => {
      if (child instanceof Line2) {
        // Stagger the rings - each one slightly delayed
        const ringDelay = i / (this.numRings * 2);
        const adjustedAlpha = Math.max(0, Math.min(1, (alpha - ringDelay) / (1 - ringDelay)));

        // Calculate radius: starts large, shrinks to end
        const radius = this.startRadius + (this.endRadius - this.startRadius) * adjustedAlpha;

        // Calculate opacity: visible in middle, fades at end
        let opacity: number;
        if (adjustedAlpha < 0.1) {
          // Fade in
          opacity = adjustedAlpha / 0.1 * this.ringOpacity;
        } else if (adjustedAlpha > 0.8) {
          // Fade out
          opacity = (1 - (adjustedAlpha - 0.8) / 0.2) * this.ringOpacity;
        } else {
          opacity = this.ringOpacity;
        }

        this._updateRing(child, Math.max(0.01, radius), opacity);
      }
    });
  }

  override finish(): void {
    // Remove rings from scene
    if (this._ringsGroup && this._parentObject) {
      this._parentObject.remove(this._ringsGroup);

      this._ringsGroup.traverse((child) => {
        if (child instanceof Line2) {
          child.geometry.dispose();
          (child.material as LineMaterial).dispose();
        }
      });

      this._ringsGroup = null;
    }

    super.finish();
  }
}

/**
 * Create a FocusOn animation for a mobject.
 * Creates converging rings that focus attention on the mobject.
 * @param mobject The mobject to focus on
 * @param options FocusOn options (color, startRadius, endRadius, numRings, strokeWidth, opacity)
 */
export function focusOn(mobject: Mobject, options?: FocusOnOptions): FocusOn {
  return new FocusOn(mobject, options);
}

/**
 * Pulse animation - makes a mobject pulse (scale up and down) once.
 * A simpler variant of FocusOn that just affects the mobject itself.
 */
export interface PulseOptions extends AnimationOptions {
  /** Scale factor at peak. Default: 1.2 */
  scaleFactor?: number;
  /** Number of pulses. Default: 1 */
  nPulses?: number;
}

export class Pulse extends Animation {
  /** Scale factor at peak */
  readonly scaleFactor: number;

  /** Number of pulses */
  readonly nPulses: number;

  /** Original scale */
  private _originalScale: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: PulseOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 0.5,
      rateFunc: options.rateFunc ?? smooth,
    });
    this.scaleFactor = options.scaleFactor ?? 1.2;
    this.nPulses = options.nPulses ?? 1;
  }

  override begin(): void {
    super.begin();
    this._originalScale.copy(this.mobject.scaleVector);
  }

  interpolate(alpha: number): void {
    // Create pulse effect using sine
    const pulsePhase = alpha * this.nPulses * Math.PI * 2;
    const pulseValue = Math.sin(pulsePhase);

    // Scale from 1 to scaleFactor and back
    // Use abs to make it pulse up only
    const currentScale = 1 + (this.scaleFactor - 1) * Math.abs(pulseValue);

    this.mobject.scaleVector.set(
      this._originalScale.x * currentScale,
      this._originalScale.y * currentScale,
      this._originalScale.z * currentScale
    );

    this.mobject._markDirty();
  }

  override finish(): void {
    // Restore original scale
    this.mobject.scaleVector.copy(this._originalScale);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a Pulse animation for a mobject.
 * Makes the mobject pulse (scale up and down).
 * @param mobject The mobject to pulse
 * @param options Pulse options (scaleFactor, nPulses)
 */
export function pulse(mobject: Mobject, options?: PulseOptions): Pulse {
  return new Pulse(mobject, options);
}

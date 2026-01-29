/**
 * ApplyWave animation - applies a wave distortion to a mobject.
 *
 * This mimics Manim's ApplyWave animation, which creates a wave-like
 * distortion that passes through the mobject.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';

export type WaveDirection = 'horizontal' | 'vertical';

export interface ApplyWaveOptions extends AnimationOptions {
  /** Direction of the wave. Default: 'horizontal' */
  direction?: WaveDirection;
  /** Amplitude of the wave. Default: 0.2 */
  amplitude?: number;
  /** Number of wave cycles. Default: 1.5 */
  wavelength?: number;
  /** Speed multiplier for wave propagation. Default: 1 */
  speed?: number;
  /** Ripple out from center instead of linear wave. Default: false */
  ripples?: boolean;
}

export class ApplyWave extends Animation {
  /** Wave direction */
  readonly direction: WaveDirection;

  /** Wave amplitude */
  readonly amplitude: number;

  /** Number of wavelengths */
  readonly wavelength: number;

  /** Speed multiplier */
  readonly speed: number;

  /** Whether to use ripple mode */
  readonly ripples: boolean;

  /** Whether mobject is a VMobject */
  private _isVMobject: boolean = false;

  /** Original points (for VMobjects) */
  private _originalPoints: number[][] = [];

  /** Original position */
  private _originalPosition: THREE.Vector3 = new THREE.Vector3();

  /** Center of the mobject */
  private _center: Vector3Tuple = [0, 0, 0];

  /** Bounds for wave calculation */
  private _bounds: { minX: number; maxX: number; minY: number; maxY: number } = {
    minX: 0, maxX: 1, minY: 0, maxY: 1
  };

  constructor(mobject: Mobject, options: ApplyWaveOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? linear,
    });
    this.direction = options.direction ?? 'horizontal';
    this.amplitude = options.amplitude ?? 0.2;
    this.wavelength = options.wavelength ?? 1.5;
    this.speed = options.speed ?? 1;
    this.ripples = options.ripples ?? false;
    this._isVMobject = mobject instanceof VMobject;
  }

  override begin(): void {
    super.begin();

    this._originalPosition.copy(this.mobject.position);
    this._center = this.mobject.getCenter();

    if (this._isVMobject) {
      const vmob = this.mobject as VMobject;
      this._originalPoints = vmob.getPoints().map(p => [...p]);

      // Calculate bounds
      if (this._originalPoints.length > 0) {
        this._bounds = {
          minX: Math.min(...this._originalPoints.map(p => p[0])),
          maxX: Math.max(...this._originalPoints.map(p => p[0])),
          minY: Math.min(...this._originalPoints.map(p => p[1])),
          maxY: Math.max(...this._originalPoints.map(p => p[1])),
        };
      }
    } else {
      // For non-VMobjects, use bounding box
      const threeObj = this.mobject.getThreeObject();
      const box = new THREE.Box3().setFromObject(threeObj);
      this._bounds = {
        minX: box.min.x,
        maxX: box.max.x,
        minY: box.min.y,
        maxY: box.max.y,
      };
    }
  }

  interpolate(alpha: number): void {
    if (this._isVMobject) {
      this._applyWaveToVMobject(alpha);
    } else {
      this._applyWaveToPosition(alpha);
    }
  }

  private _applyWaveToVMobject(alpha: number): void {
    const vmob = this.mobject as VMobject;

    // Calculate wave parameters
    // Wave travels from one side to the other
    const wavePhase = alpha * (1 + this.wavelength * 2) * this.speed;

    // Apply wave distortion to each point
    const newPoints = this._originalPoints.map((point) => {
      const [x, y, z] = point;

      // Calculate normalized position along wave direction
      let normalizedPos: number;
      if (this.ripples) {
        // Radial distance from center
        const dx = x - this._center[0];
        const dy = y - this._center[1];
        normalizedPos = Math.sqrt(dx * dx + dy * dy);
        // Normalize by max distance
        const maxDist = Math.max(
          this._bounds.maxX - this._center[0],
          this._center[0] - this._bounds.minX,
          this._bounds.maxY - this._center[1],
          this._center[1] - this._bounds.minY
        );
        normalizedPos = normalizedPos / (maxDist || 1);
      } else if (this.direction === 'horizontal') {
        normalizedPos = (x - this._bounds.minX) / (this._bounds.maxX - this._bounds.minX || 1);
      } else {
        normalizedPos = (y - this._bounds.minY) / (this._bounds.maxY - this._bounds.minY || 1);
      }

      // Calculate wave displacement
      const waveInput = (normalizedPos - wavePhase) * Math.PI * 2 * this.wavelength;

      // Envelope: wave starts and ends smoothly
      const envelope = Math.sin(alpha * Math.PI);

      // Wave displacement
      const displacement = Math.sin(waveInput) * this.amplitude * envelope;

      // Apply displacement perpendicular to wave direction
      if (this.ripples) {
        // Radial displacement
        const dx = x - this._center[0];
        const dy = y - this._center[1];
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return [
          x + (dx / dist) * displacement * 0.5,
          y + (dy / dist) * displacement * 0.5,
          z,
        ];
      } else if (this.direction === 'horizontal') {
        return [x, y + displacement, z];
      } else {
        return [x + displacement, y, z];
      }
    });

    vmob.setPoints(newPoints);
  }

  private _applyWaveToPosition(alpha: number): void {
    // For non-VMobjects, just apply a simple position oscillation
    const envelope = Math.sin(alpha * Math.PI);
    const wave = Math.sin(alpha * Math.PI * 2 * this.wavelength * this.speed);
    const displacement = wave * this.amplitude * envelope;

    if (this.direction === 'horizontal') {
      this.mobject.position.y = this._originalPosition.y + displacement;
    } else {
      this.mobject.position.x = this._originalPosition.x + displacement;
    }

    this.mobject._markDirty();
  }

  override finish(): void {
    // Restore original state
    if (this._isVMobject) {
      const vmob = this.mobject as VMobject;
      vmob.setPoints(this._originalPoints);
    }

    this.mobject.position.copy(this._originalPosition);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create an ApplyWave animation for a mobject.
 * Applies a wave distortion that passes through the mobject.
 * @param mobject The mobject to apply wave to
 * @param options ApplyWave options (direction, amplitude, wavelength, speed, ripples)
 */
export function applyWave(mobject: Mobject, options?: ApplyWaveOptions): ApplyWave {
  return new ApplyWave(mobject, options);
}

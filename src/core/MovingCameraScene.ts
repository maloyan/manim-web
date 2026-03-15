import * as THREE from 'three';
import { Scene, SceneOptions } from './Scene';
import { Mobject, Vector3Tuple } from './Mobject';
import { smoothstep } from '../utils/math';

/**
 * Options for configuring a MovingCameraScene.
 */
export interface MovingCameraSceneOptions extends SceneOptions {
  /** Default duration for camera animations. Defaults to 1 second. */
  defaultCameraDuration?: number;
}

/**
 * Scene with moving camera support.
 * The camera can be animated smoothly between positions.
 * Maintains frame of reference tracking for complex camera movements.
 */
export class MovingCameraScene extends Scene {
  /** Frame of reference - the point the camera tracks */
  private _frameCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  /** Default duration for camera animations */
  private _defaultCameraDuration: number;

  /** Pending camera animation state */
  private _cameraAnimating: boolean = false;
  private _cameraAnimationStart: THREE.Vector3 | null = null;
  private _cameraAnimationTarget: THREE.Vector3 | null = null;
  private _cameraAnimationProgress: number = 0;
  private _cameraAnimationDuration: number = 1;

  /** Zoom animation state */
  private _zoomAnimating: boolean = false;
  private _zoomStart: number = 1;
  private _zoomTarget: number = 1;
  private _zoomProgress: number = 0;
  private _zoomDuration: number = 1;

  /**
   * Create a new moving camera scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: MovingCameraSceneOptions = {}) {
    super(container, options);
    this._defaultCameraDuration = options.defaultCameraDuration ?? 1;
  }

  /**
   * Get the current frame center (what the camera is tracking).
   */
  get frameCenter(): Vector3Tuple {
    return [this._frameCenter.x, this._frameCenter.y, this._frameCenter.z];
  }

  /**
   * Set the frame center directly (no animation).
   * @param point - New frame center [x, y, z]
   * @returns this for chaining
   */
  setFrameCenter(point: Vector3Tuple): this {
    this._frameCenter.set(point[0], point[1], point[2]);
    this.camera.moveTo([point[0], point[1], this.camera.position.z]);
    this.render();
    return this;
  }

  /**
   * Animate the camera to a new position.
   * @param position - Target position [x, y, z]
   * @param duration - Animation duration in seconds (optional)
   * @returns Promise that resolves when the animation completes
   */
  moveCameraTo(position: Vector3Tuple, duration?: number): Promise<void> {
    const dur = duration ?? this._defaultCameraDuration;

    this._cameraAnimating = true;
    this._cameraAnimationStart = this.camera.position.clone();
    this._cameraAnimationTarget = new THREE.Vector3(position[0], position[1], position[2]);
    this._cameraAnimationProgress = 0;
    this._cameraAnimationDuration = dur;

    // Update frame center to match
    this._frameCenter.set(position[0], position[1], 0);

    return new Promise((resolve) => {
      const animate = () => {
        if (!this._cameraAnimating || this._disposed) {
          this._cameraAnimating = false;
          resolve();
          return;
        }

        this._cameraAnimationProgress += 1 / 60; // Assume 60fps
        const t = Math.min(1, this._cameraAnimationProgress / this._cameraAnimationDuration);
        const smoothT = smoothstep(t);

        if (this._cameraAnimationStart && this._cameraAnimationTarget) {
          const newPos = new THREE.Vector3().lerpVectors(
            this._cameraAnimationStart,
            this._cameraAnimationTarget,
            smoothT,
          );
          this.camera.moveTo([newPos.x, newPos.y, newPos.z]);
        }

        this.render();

        if (t >= 1) {
          this._cameraAnimating = false;
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Animate zoom to a specific level.
   * @param zoom - Target zoom level (1 = normal, 2 = 2x zoom in)
   * @param duration - Animation duration in seconds (optional)
   * @returns Promise that resolves when the animation completes
   */
  zoomTo(zoom: number, duration?: number): Promise<void> {
    const dur = duration ?? this._defaultCameraDuration;

    this._zoomAnimating = true;
    this._zoomStart = this.camera.frameWidth / 14; // Assuming 14 is default width
    this._zoomTarget = 1 / zoom;
    this._zoomProgress = 0;
    this._zoomDuration = dur;

    return new Promise((resolve) => {
      const animate = () => {
        if (!this._zoomAnimating || this._disposed) {
          this._zoomAnimating = false;
          resolve();
          return;
        }

        this._zoomProgress += 1 / 60; // Assume 60fps
        const t = Math.min(1, this._zoomProgress / this._zoomDuration);
        const smoothT = smoothstep(t);

        const currentZoom = this._zoomStart + (this._zoomTarget - this._zoomStart) * smoothT;
        this.camera.frameWidth = 14 * currentZoom;
        this.camera.frameHeight = 8 * currentZoom;

        this.render();

        if (t >= 1) {
          this._zoomAnimating = false;
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Pan the camera to follow a target point.
   * @param target - Target point to pan to [x, y, z]
   * @param duration - Animation duration in seconds (optional)
   * @returns Promise that resolves when the animation completes
   */
  panTo(target: Vector3Tuple, duration?: number): Promise<void> {
    return this.moveCameraTo([target[0], target[1], this.camera.position.z], duration);
  }

  /**
   * Follow a mobject with the camera (keeps it centered).
   * @param mobject - The mobject to follow
   * @param duration - Duration to follow (0 = instant move)
   * @returns Promise that resolves when initial move completes
   */
  followMobject(mobject: Mobject, duration: number = 0): Promise<void> {
    const center = mobject.getCenter();
    if (duration > 0) {
      return this.panTo(center, duration);
    } else {
      this.setFrameCenter(center);
      return Promise.resolve();
    }
  }
}

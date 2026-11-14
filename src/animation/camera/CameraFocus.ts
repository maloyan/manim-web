/**
 * CameraFocus: a seekable camera move that frames a mobject or a point in a
 * ThreeDScene. Use it inside `scene.play(...)` next to other animations, or
 * call `scene.focusOn(target, options)` for the awaitable shorthand.
 */

import type * as THREE from 'three';
import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import type { CameraState, ThreeDScene } from '../../core/ThreeDScene';
import { addVec, crossVec, normalizeVec, scaleVec, subVec } from '../../utils/vectors';
import { AnimationOptions } from '../Animation';
import { LazyStateAnimation } from './LazyStateAnimation';

export interface CameraFocusOptions extends AnimationOptions {
  /** Alias of `duration` (Manim's run_time). Default: 1.5 */
  runTime?: number;
  /** Camera distance from the look-at point. Overrides `fill`. */
  distance?: number;
  /**
   * Fraction of the frame's shorter half-extent the target's radius fills
   * (0..1]. Used when `distance` is not given and the target is a mobject.
   * Default: 0.5
   */
  fill?: number;
  /** Target polar angle (radians). Default: keep the current angle. */
  phi?: number;
  /** Target azimuthal angle (radians). Default: keep the current angle. */
  theta?: number;
  /**
   * Where the target lands on screen, in fixed-in-frame units (the HUD
   * frame). [0, 0] is the frame centre; [0, 1] puts the target 1 unit above
   * it, leaving room for a caption below. Default: [0, 0]
   */
  screenOffset?: [number, number];
}

/** World-space centre and radius of a focus target. */
function targetSphere(target: Mobject | Vector3Tuple): {
  center: Vector3Tuple;
  radius: number | null;
} {
  if (Array.isArray(target)) return { center: [target[0], target[1], target[2]], radius: null };
  const mob = target;
  if (mob.isEmpty()) return { center: mob.getCenter(), radius: null };
  const { min, max } = mob.getBounds();
  const size: Vector3Tuple = [max.x - min.x, max.y - min.y, max.z - min.z];
  // RMS half-extent: equals r for a sphere's AABB (the half-diagonal would
  // overshoot by sqrt(3) and frame spheres too small).
  const radius = Math.sqrt((size[0] ** 2 + size[1] ** 2 + size[2] ** 2) / 3) / 2;
  return {
    center: [(min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2],
    radius,
  };
}

/** Wrap an angle difference into (-PI, PI] so theta takes the short way. */
function shortAngle(delta: number): number {
  const twoPi = Math.PI * 2;
  let d = ((delta % twoPi) + twoPi) % twoPi;
  if (d > Math.PI) d -= twoPi;
  return d;
}

/**
 * Compute the camera pose that frames `target`.
 * @pre options.fill === undefined || (options.fill > 0 && options.fill <= 1)
 * @post result.distance > 0
 */
export function computeFocusState(
  scene: ThreeDScene,
  target: Mobject | Vector3Tuple,
  options: CameraFocusOptions,
  from: CameraState,
): CameraState {
  const phi = options.phi ?? from.phi;
  const theta = options.theta ?? from.theta;
  const cam = scene.camera3D.getCamera();
  const halfV = (scene.camera3D.fov * Math.PI) / 180 / 2;
  const halfH = Math.atan(Math.tan(halfV) * cam.aspect);
  const halfMin = Math.min(halfV, halfH);

  const { center, radius } = targetSphere(target);
  let distance = options.distance ?? from.distance;
  if (options.distance === undefined && radius !== null && radius > 0) {
    const fill = options.fill ?? 0.5;
    distance = radius / Math.sin(Math.atan(fill * Math.tan(halfMin)));
  }
  distance = Math.max(distance, 1e-3);

  let lookAt = center;
  const offset = options.screenOffset;
  if (offset && (offset[0] !== 0 || offset[1] !== 0)) {
    // Camera basis at the target orientation. orbit() keeps camera.up fixed.
    const n: Vector3Tuple = [
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
    ];
    const forward = scaleVec(-1, n);
    const up0: Vector3Tuple = [cam.up.x, cam.up.y, cam.up.z];
    const right = normalizeVec(crossVec(forward, up0));
    const up = crossVec(right, forward);
    // World units per HUD unit at the target's depth.
    const frameH = scene.fixedInFrameSize.height;
    const k = (distance * Math.tan(halfV)) / (frameH / 2);
    const shift = addVec(scaleVec(offset[0] * k, right), scaleVec(offset[1] * k, up));
    lookAt = subVec(center, shift);
  }
  return { phi, theta: from.theta + shortAngle(theta - from.theta), distance, lookAt };
}

/**
 * A copy of the scene camera placed at the pose a focus move would end on,
 * from the current pose. For tests that need the final view before the move
 * runs (for example the occluder rule of `FocusDim`).
 * @post result !== scene.camera3D.getCamera()
 */
export function focusCamera(
  scene: ThreeDScene,
  target: Mobject | Vector3Tuple,
  options: CameraFocusOptions = {},
): THREE.PerspectiveCamera {
  const state = computeFocusState(scene, target, options, scene.getCameraState());
  const camera = scene.camera3D.getCamera().clone();
  const { phi, theta, distance, lookAt } = state;
  const n: Vector3Tuple = [
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  ];
  camera.position.set(...addVec(lookAt, scaleVec(distance, n)));
  camera.lookAt(...lookAt);
  camera.updateMatrixWorld(true);
  return camera;
}

/** Linear blend of two camera states. */
export function lerpCameraState(a: CameraState, b: CameraState, t: number): CameraState {
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    phi: mix(a.phi, b.phi),
    theta: mix(a.theta, b.theta),
    // Blend distance in log space: a long dolly then feels even in speed.
    distance: Math.exp(mix(Math.log(a.distance), Math.log(b.distance))),
    lookAt: [
      mix(a.lookAt[0], b.lookAt[0]),
      mix(a.lookAt[1], b.lookAt[1]),
      mix(a.lookAt[2], b.lookAt[2]),
    ],
  };
}

/**
 * Animate a ThreeDScene camera to frame a mobject or a point.
 *
 * Runs on the scene timeline like any Animation, so it is seekable in the
 * Player and renders in frame-by-frame video export. The start pose is read
 * when the move starts, so chained focus moves start where the last ended.
 *
 * @example
 * ```ts
 * await scene.play(
 *   new CameraFocus(scene, nucleus, { fill: 0.45, phi: 1.1, screenOffset: [0, 0.8] }),
 *   card.update({ title: 'Nucleus' }),
 * );
 * ```
 */
export class CameraFocus extends LazyStateAnimation<CameraState> {
  readonly scene: ThreeDScene;
  readonly target: Mobject | Vector3Tuple;
  readonly options: CameraFocusOptions;

  constructor(
    scene: ThreeDScene,
    target: Mobject | Vector3Tuple,
    options: CameraFocusOptions = {},
  ) {
    const { runTime, distance, fill, phi, theta, screenOffset, ...animOptions } = options;
    super({ ...animOptions, duration: options.duration ?? runTime ?? 1.5 });
    this.scene = scene;
    this.target = target;
    this.options = { distance, fill, phi, theta, screenOffset };
  }

  protected captureState(): CameraState {
    return this.scene.getCameraState();
  }

  protected targetState(from: CameraState): CameraState {
    return computeFocusState(this.scene, this.target, this.options, from);
  }

  protected applyState(from: CameraState, to: CameraState, alpha: number): void {
    this.scene.setCameraState(lerpCameraState(from, to, alpha));
  }
}

/** Factory for {@link CameraFocus}. */
export function cameraFocus(
  scene: ThreeDScene,
  target: Mobject | Vector3Tuple,
  options?: CameraFocusOptions,
): CameraFocus {
  return new CameraFocus(scene, target, options);
}

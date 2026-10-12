/**
 * Shared types for {@link SpatialAudio}.
 *
 * These interfaces are the dependency-injection seam: a real `AudioContext`,
 * `PannerNode`, and `AudioListener` satisfy them, and tests inject stubs that
 * implement only these members, so no real Web Audio is required.
 */

import type { PositionalSource } from './spatialAudioSources';

/**
 * The subset of `AudioParam` this module writes: setting `value` is enough.
 * A real `AudioParam` satisfies this; a stub records the last value.
 */
export interface SpatialAudioParam {
  /** The current parameter value. */
  value: number;
}

/**
 * A node whose 3D position this module can set, through either the modern
 * `positionX/Y/Z` AudioParams or the legacy `setPosition(x, y, z)` method.
 */
export interface PositionTarget {
  /** X position AudioParam (modern API). */
  positionX?: SpatialAudioParam;
  /** Y position AudioParam (modern API). */
  positionY?: SpatialAudioParam;
  /** Z position AudioParam (modern API). */
  positionZ?: SpatialAudioParam;
  /** Legacy position setter (older Safari). */
  setPosition?(x: number, y: number, z: number): void;
}

/**
 * The subset of `PannerNode` this module writes. A real `PannerNode`
 * satisfies it; tests inject a stub that records the fields.
 */
export interface SpatialPanner extends PositionTarget {
  /** Spatialization algorithm (`'equalpower'` or `'HRTF'`). */
  panningModel: PanningModelType;
  /** Distance-attenuation algorithm. */
  distanceModel: DistanceModelType;
  /** Reference distance for the attenuation. */
  refDistance: number;
  /** Maximum distance beyond which attenuation stops. */
  maxDistance: number;
  /** Rolloff factor for the attenuation. */
  rolloffFactor: number;
  /** Wire the panner output into `destination`. */
  connect(destination: unknown): void;
  /** Disconnect the panner. */
  disconnect(): void;
}

/**
 * The subset of `AudioListener` this module writes: position and orientation,
 * through either the modern AudioParams or the legacy setter methods.
 */
export interface SpatialListenerLike extends PositionTarget {
  /** Forward X orientation AudioParam (modern API). */
  forwardX?: SpatialAudioParam;
  /** Forward Y orientation AudioParam (modern API). */
  forwardY?: SpatialAudioParam;
  /** Forward Z orientation AudioParam (modern API). */
  forwardZ?: SpatialAudioParam;
  /** Up X orientation AudioParam (modern API). */
  upX?: SpatialAudioParam;
  /** Up Y orientation AudioParam (modern API). */
  upY?: SpatialAudioParam;
  /** Up Z orientation AudioParam (modern API). */
  upZ?: SpatialAudioParam;
  /** Legacy orientation setter (older Safari). */
  setOrientation?(fx: number, fy: number, fz: number, ux: number, uy: number, uz: number): void;
}

/**
 * The subset of `AudioContext` this module uses. Only the destination, the
 * listener, and `createPanner` are needed. Tests inject a stub implementing
 * exactly this, so no real Web Audio is required.
 */
export interface SpatialAudioContextLike {
  /** The final output node the panner connects to. */
  readonly destination: unknown;
  /** The spatial listener for this context. */
  readonly listener: SpatialListenerLike;
  /** Create a new panner node. */
  createPanner(): SpatialPanner;
}

/**
 * A minimal camera view used by `SpatialAudio.setListenerFromCamera`. The
 * manim-web `Camera` satisfies this (its `position` and `lookAtTarget` are
 * `THREE.Vector3`, which have `x` / `y` / `z`).
 */
export interface ListenerCameraView {
  /** The camera position. */
  readonly position: { x: number; y: number; z: number };
  /** The point the camera looks at, if any. */
  readonly lookAtTarget?: { x: number; y: number; z: number };
  /** The camera up vector, if any. */
  readonly up?: { x: number; y: number; z: number };
}

/** Options for constructing a `SpatialAudio`. */
export interface SpatialAudioOptions {
  /** Pre-built context to use (dependency injection / testing). */
  context?: SpatialAudioContextLike;
  /** Transport source to drive from play / pause / stop. */
  source?: PositionalSource;
  /** Spatialization algorithm. Defaults to `'HRTF'`. */
  panningModel?: PanningModelType;
  /** Distance-attenuation algorithm. Defaults to `'inverse'`. */
  distanceModel?: DistanceModelType;
  /** Reference distance for attenuation. Defaults to 1. */
  refDistance?: number;
  /** Maximum distance for attenuation. Defaults to 10000. */
  maxDistance?: number;
  /** Rolloff factor. Defaults to 1. */
  rolloffFactor?: number;
  /** Initial position of the sound. Defaults to the origin. */
  position?: [number, number, number];
}

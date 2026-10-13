/**
 * SpatialAudio - Positional (3D) audio for manim-web.
 *
 * Wraps a Web Audio `PannerNode` so a sound can live at a point in the scene
 * and pan as it, or the camera, moves. The sound can follow a mobject: on
 * every `update(dt)` the panner moves to the mobject center, so the standard
 * updater loop keeps audio and geometry in sync. An `AudioListener` setter
 * places the listener from the camera, so the mix tracks the point of view.
 *
 * This is impossible in file-based ManimCE and is browser-unique. It mirrors
 * {@link AudioAnalyzer}: the same feature detection, the same dependency
 * injection seam, and the same degrade-to-no-op contract.
 *
 * Every Web Audio and DOM access is feature-detected. In Node, jsdom, or SSR
 * the class degrades to a no-op: it tracks its position but builds no audio
 * graph and nothing throws.
 *
 * @example
 * ```ts
 * const audio = SpatialAudio.fromMediaElement(audioEl, { refDistance: 2 });
 * audio.setListenerFromCamera(scene.camera);
 *
 * const dot = new Dot();
 * audio.attachTo(dot);           // the sound follows the dot
 * dot.addUpdater(audio.createUpdater());
 * audio.play();
 * ```
 */

import { logger } from '../utils/logger';
import type { Mobject, UpdaterFunction } from '../core/Mobject';
import type { Vector3Tuple } from '../core/MobjectTypes';
import { MediaElementSource, BufferSource, type PositionalSource } from './spatialAudioSources';
import type {
  PositionTarget,
  SpatialPanner,
  SpatialAudioContextLike,
  ListenerCameraView,
  SpatialAudioOptions,
} from './spatialAudioTypes';

export type { PositionalSource } from './spatialAudioSources';
export type {
  SpatialAudioParam,
  PositionTarget,
  SpatialPanner,
  SpatialListenerLike,
  SpatialAudioContextLike,
  ListenerCameraView,
  SpatialAudioOptions,
} from './spatialAudioTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default reference distance at which the volume is unattenuated. */
const DEFAULT_REF_DISTANCE = 1;
/** Default maximum distance beyond which the volume no longer drops. */
const DEFAULT_MAX_DISTANCE = 10000;
/** Default rolloff factor (how fast the volume drops with distance). */
const DEFAULT_ROLLOFF = 1;
/** Default panning model (HRTF gives a convincing 3D image). */
const DEFAULT_PANNING_MODEL: PanningModelType = 'HRTF';
/** Default distance model. */
const DEFAULT_DISTANCE_MODEL: DistanceModelType = 'inverse';
/** Forward vector used when a camera has no explicit look-at target. */
const DEFAULT_FORWARD: Vector3Tuple = [0, 0, -1];
/** Up vector used when a camera has no explicit up vector. */
const DEFAULT_UP: Vector3Tuple = [0, 1, 0];

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

/**
 * Resolve the `AudioContext` constructor for this environment.
 * Returns `null` in Node, jsdom, and SSR so callers degrade without throwing.
 */
function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  if (typeof window !== 'undefined' && 'webkitAudioContext' in window) {
    return (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  }
  return null;
}

/** Whether the Web Audio positional API (`PannerNode`) is available here. */
export function isSpatialAudioSupported(): boolean {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return false;
  return typeof Ctor.prototype.createPanner === 'function';
}

/** Write `[x, y, z]` to a position target (AudioParam or legacy setter). */
function writePosition(target: PositionTarget, x: number, y: number, z: number): void {
  if (target.positionX && target.positionY && target.positionZ) {
    target.positionX.value = x;
    target.positionY.value = y;
    target.positionZ.value = z;
  } else if (typeof target.setPosition === 'function') {
    target.setPosition(x, y, z);
  }
}

/** Normalize a vector, returning the default when it has zero length. */
function normalize(v: Vector3Tuple, fallback: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(v[0], v[1], v[2]);
  if (length === 0) return [...fallback];
  return [v[0] / length, v[1] / length, v[2] / length];
}

// ---------------------------------------------------------------------------
// SpatialAudio
// ---------------------------------------------------------------------------

/** A sound positioned in 3D that can follow a mobject and pan to the camera. */
export class SpatialAudio {
  private readonly _context: SpatialAudioContextLike | null;
  private readonly _panner: SpatialPanner | null;
  private readonly _source: PositionalSource | null;
  private _target: Mobject | null = null;
  private _position: Vector3Tuple;

  constructor(options: SpatialAudioOptions = {}) {
    this._position = options.position ? [...options.position] : [0, 0, 0];
    this._source = options.source ?? null;
    this._context = options.context ?? null;

    if (!this._context) {
      // No audio graph in this environment; track position only.
      this._panner = null;
      return;
    }

    const panner = this._context.createPanner();
    panner.panningModel = options.panningModel ?? DEFAULT_PANNING_MODEL;
    panner.distanceModel = options.distanceModel ?? DEFAULT_DISTANCE_MODEL;
    panner.refDistance = options.refDistance ?? DEFAULT_REF_DISTANCE;
    panner.maxDistance = options.maxDistance ?? DEFAULT_MAX_DISTANCE;
    panner.rolloffFactor = options.rolloffFactor ?? DEFAULT_ROLLOFF;
    panner.connect(this._context.destination);
    this._panner = panner;
    writePosition(panner, this._position[0], this._position[1], this._position[2]);
  }

  // --------------------------------------------------------------------------
  // Factories
  // --------------------------------------------------------------------------

  /**
   * Create a positional sound from an `<audio>` / `<video>` element.
   * No-op (disconnected) when Web Audio is unavailable.
   */
  static fromMediaElement(
    element: HTMLMediaElement,
    options: SpatialAudioOptions = {},
  ): SpatialAudio {
    const Ctor = getAudioContextCtor();
    if (!Ctor || !isSpatialAudioSupported()) {
      logger.warn('SpatialAudio: Web Audio API unavailable; media element not connected.');
      return new SpatialAudio(options);
    }
    const ctx = new Ctor();
    const node = ctx.createMediaElementSource(element);
    const audio = new SpatialAudio({
      ...options,
      context: ctx as unknown as SpatialAudioContextLike,
      source: new MediaElementSource(element),
    });
    audio._wireInput(node);
    return audio;
  }

  /**
   * Create a positional sound from a decoded `AudioBuffer`.
   * No-op (disconnected) when Web Audio is unavailable.
   */
  static fromBuffer(
    buffer: AudioBuffer,
    options: SpatialAudioOptions & { loop?: boolean } = {},
  ): SpatialAudio {
    const Ctor = getAudioContextCtor();
    if (!Ctor || !isSpatialAudioSupported()) {
      logger.warn('SpatialAudio: Web Audio API unavailable; buffer not connected.');
      return new SpatialAudio(options);
    }
    const ctx = new Ctor();
    const gain = ctx.createGain();
    const audio = new SpatialAudio({
      ...options,
      context: ctx as unknown as SpatialAudioContextLike,
      source: new BufferSource(ctx, buffer, gain, options.loop ?? false),
    });
    audio._wireInput(gain);
    return audio;
  }

  // --------------------------------------------------------------------------
  // Position
  // --------------------------------------------------------------------------

  /**
   * Set the sound position in scene coordinates.
   * The position is tracked even when no audio graph exists.
   * @returns this for chaining
   */
  setPosition(position: Vector3Tuple): this {
    this._position = [...position];
    if (this._panner) {
      writePosition(this._panner, position[0], position[1], position[2]);
    }
    return this;
  }

  /** The current sound position in scene coordinates. */
  getPosition(): Vector3Tuple {
    return [...this._position];
  }

  /**
   * Follow a mobject: each {@link update} moves the sound to its center.
   * Snaps to the current center immediately.
   * @returns this for chaining
   */
  attachTo(mobject: Mobject): this {
    this._target = mobject;
    this.setPosition(mobject.getCenter());
    return this;
  }

  /**
   * Stop following a mobject. The sound stays at its last position.
   * @returns this for chaining
   */
  detach(): this {
    this._target = null;
    return this;
  }

  /**
   * Advance the driver by `dt` seconds. When attached, moves the sound to the
   * mobject center. The `dt` argument keeps the updater signature uniform.
   */
  update(_dt: number): void {
    if (this._target) {
      this.setPosition(this._target.getCenter());
    }
  }

  /**
   * Build an updater that calls {@link update} each frame. Add it with
   * `mobject.addUpdater(audio.createUpdater())`.
   */
  createUpdater(): UpdaterFunction {
    return (_mobject: Mobject, dt: number) => this.update(dt);
  }

  // --------------------------------------------------------------------------
  // Listener
  // --------------------------------------------------------------------------

  /**
   * Set the listener position in scene coordinates.
   * @returns this for chaining
   */
  setListenerPosition(position: Vector3Tuple): this {
    if (this._context) {
      writePosition(this._context.listener, position[0], position[1], position[2]);
    }
    return this;
  }

  /**
   * Set the listener forward and up orientation (normalized internally).
   * @returns this for chaining
   */
  setListenerOrientation(forward: Vector3Tuple, up: Vector3Tuple = DEFAULT_UP): this {
    if (!this._context) return this;
    const listener = this._context.listener;
    const f = normalize(forward, DEFAULT_FORWARD);
    const u = normalize(up, DEFAULT_UP);
    if (
      listener.forwardX &&
      listener.forwardY &&
      listener.forwardZ &&
      listener.upX &&
      listener.upY &&
      listener.upZ
    ) {
      listener.forwardX.value = f[0];
      listener.forwardY.value = f[1];
      listener.forwardZ.value = f[2];
      listener.upX.value = u[0];
      listener.upY.value = u[1];
      listener.upZ.value = u[2];
    } else if (typeof listener.setOrientation === 'function') {
      listener.setOrientation(f[0], f[1], f[2], u[0], u[1], u[2]);
    }
    return this;
  }

  /**
   * Place the listener from a camera: position from the camera, forward from
   * the look-at target (or the default forward), up from the camera up vector.
   * @returns this for chaining
   */
  setListenerFromCamera(camera: ListenerCameraView): this {
    const { position, lookAtTarget, up } = camera;
    this.setListenerPosition([position.x, position.y, position.z]);
    const forward: Vector3Tuple = lookAtTarget
      ? [lookAtTarget.x - position.x, lookAtTarget.y - position.y, lookAtTarget.z - position.z]
      : [...DEFAULT_FORWARD];
    const upVec: Vector3Tuple = up ? [up.x, up.y, up.z] : [...DEFAULT_UP];
    return this.setListenerOrientation(forward, upVec);
  }

  // --------------------------------------------------------------------------
  // Transport + volume
  // --------------------------------------------------------------------------

  /** Start (or resume) playback. No-op with no source. */
  play(): this {
    this._source?.play();
    return this;
  }

  /** Pause playback. No-op with no source. */
  pause(): this {
    this._source?.pause();
    return this;
  }

  /** Stop playback and reset to the start. No-op with no source. */
  stop(): this {
    this._source?.stop();
    return this;
  }

  /** Set the source volume `[0, 1]`. No-op with no source. */
  setVolume(value: number): this {
    this._source?.setVolume(value);
    return this;
  }

  // --------------------------------------------------------------------------
  // Panner option setters
  // --------------------------------------------------------------------------

  /** Set the reference distance for attenuation. @returns this for chaining */
  setRefDistance(value: number): this {
    if (this._panner) this._panner.refDistance = value;
    return this;
  }

  /** Set the rolloff factor for attenuation. @returns this for chaining */
  setRolloffFactor(value: number): this {
    if (this._panner) this._panner.rolloffFactor = value;
    return this;
  }

  /** Set the maximum attenuation distance. @returns this for chaining */
  setMaxDistance(value: number): this {
    if (this._panner) this._panner.maxDistance = value;
    return this;
  }

  /** Set the spatialization algorithm. @returns this for chaining */
  setPanningModel(model: PanningModelType): this {
    if (this._panner) this._panner.panningModel = model;
    return this;
  }

  /** Set the distance-attenuation algorithm. @returns this for chaining */
  setDistanceModel(model: DistanceModelType): this {
    if (this._panner) this._panner.distanceModel = model;
    return this;
  }

  // --------------------------------------------------------------------------
  // Introspection / lifecycle
  // --------------------------------------------------------------------------

  /** Whether an audio graph exists (a panner was created). */
  get connected(): boolean {
    return this._panner !== null;
  }

  /** The panner node, or `null` when Web Audio is unavailable. */
  get panner(): SpatialPanner | null {
    return this._panner;
  }

  /** Release the panner connection. Does not close an injected context. */
  dispose(): void {
    this._source?.stop();
    this._panner?.disconnect();
    this._target = null;
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /** Connect an input node into the panner (used by the factories). */
  private _wireInput(node: AudioNode): void {
    if (this._panner) {
      // cast: SpatialPanner is a structural wrapper, not a Web Audio AudioNode
      // subtype, but at runtime it is the real PannerNode that `connect` needs.
      node.connect(this._panner as unknown as AudioNode);
    }
  }
}

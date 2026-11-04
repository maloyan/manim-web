import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { TexturedMobject } from '../../core/TexturedMobject';
import { defaultGifDecoder, type DecodedGif, type GifDecoder } from './gifDecoder';

export type { DecodedGif, DecodedGifFrame, GifDecoder } from './gifDecoder';

/**
 * Options for creating an {@link AnimatedImageMobject}.
 */
export interface AnimatedImageMobjectOptions {
  /** GIF source: URL or base64 data URI. Required. */
  source: string;
  /** Loop back to the first frame after the last. Default: true */
  loop?: boolean;
  /** Start playing as soon as the GIF decodes. Default: false */
  autoplay?: boolean;
  /** Override the GIF frame rate (frames per second). Default: use GIF delays */
  fps?: number;
  /** Width of the image in scene units. Default: auto from aspect ratio */
  width?: number;
  /** Height of the image in scene units. Default: auto from aspect ratio */
  height?: number;
  /** If both width and height given, fit inside the box preserving aspect. Default: true */
  scaleToFit?: boolean;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Render both sides of the plane. Default: false */
  doubleSided?: boolean;
}

/** Injected GIF decoder; when set, the real `gifuct-js` decoder is never used. */
let gifDecoderOverride: GifDecoder | null = null;

/**
 * Inject a GIF decoder, replacing the lazy-loaded `gifuct-js` decoder. Pass
 * `null` to restore the default. Tests use this to decode a mock GIF with no
 * network or `gifuct-js` dependency.
 */
export function setGifDecoder(decoder: GifDecoder | null): void {
  gifDecoderOverride = decoder;
}

/** Minimum per-frame delay in ms, so a 0 ms frame can never stall playback. */
const MIN_FRAME_DELAY_MS = 1;

/**
 * AnimatedImageMobject - play an animated GIF as a movable, scalable mobject.
 *
 * The GIF is decoded to RGBA frames (see {@link gifDecoder}) and each frame is
 * drawn through a `THREE.DataTexture` on a `THREE.PlaneGeometry`, mirroring how
 * `ImageMobject` draws a still image. It therefore participates in the standard
 * mobject transforms, z-index/depth, opacity, and `scene.add`. During play an
 * updater advances the frame by elapsed time; call {@link syncToTime} on scrub
 * or seek so the displayed frame follows the scene time.
 *
 * @example
 * ```typescript
 * const gif = new AnimatedImageMobject({ source: 'spin.gif', width: 4, loop: true });
 * scene.add(gif);
 * await gif.waitForLoad();
 * gif.play();
 * ```
 */
export class AnimatedImageMobject extends TexturedMobject {
  protected _source: string;
  protected _loop: boolean;
  protected _autoplay: boolean;
  protected _fps: number | undefined;
  protected _width: number | undefined;
  protected _height: number | undefined;
  protected _scaleToFit: boolean;
  protected _centerPoint: Vector3Tuple;
  protected _doubleSided: boolean;

  protected _frames: Uint8ClampedArray[] = [];
  protected _frameDurations: number[] = [];
  protected _frameTextures: (THREE.DataTexture | null)[] = [];
  protected _totalDurationMs: number = 0;
  protected _currentFrame: number = 0;
  protected _accumulatorMs: number = 0;
  protected _playing: boolean = false;

  protected _texture: THREE.DataTexture | null = null;
  protected _loaded: boolean = false;
  protected _loadError: Error | null = null;
  protected _naturalWidth: number = 1;
  protected _naturalHeight: number = 1;
  private _mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | null = null;

  private _loadPromise: Promise<void>;
  private _loadResolve: (() => void) | null = null;
  private _loadReject: ((reason: Error) => void) | null = null;

  constructor(options: AnimatedImageMobjectOptions) {
    super();

    const {
      source,
      loop = true,
      autoplay = false,
      fps,
      width,
      height,
      scaleToFit = true,
      center = [0, 0, 0],
      opacity = 1,
      doubleSided = false,
    } = options;

    this._source = source;
    this._loop = loop;
    this._autoplay = autoplay;
    this._fps = fps;
    this._width = width;
    this._height = height;
    this._scaleToFit = scaleToFit;
    this._centerPoint = [...center];
    this._doubleSided = doubleSided;
    this._opacity = opacity;

    this.position.set(center[0], center[1], center[2]);

    this._loadPromise = new Promise((resolve, reject) => {
      this._loadResolve = resolve;
      this._loadReject = reject;
    });

    // The Player drives playback by calling update(dt) each frame.
    this.addUpdater((_mobject, dt) => {
      if (this._playing) this._advance(dt * 1000);
    });

    void this._startLoad();
  }

  /** Decode the GIF, then ingest its frames. Node/SSR-safe: never throws. */
  private async _startLoad(): Promise<void> {
    try {
      const decoder = gifDecoderOverride ?? defaultGifDecoder;
      const decoded = await decoder(this._source);
      this._ingest(decoded);
      if (this._loadResolve) {
        this._loadResolve();
        this._loadResolve = null;
        this._loadReject = null;
      }
    } catch (error) {
      this._failLoad(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /** Store decoded frames, compute durations, and show the first frame. */
  private _ingest(decoded: DecodedGif): void {
    this._naturalWidth = decoded.width || 1;
    this._naturalHeight = decoded.height || 1;
    this._frames = decoded.frames.map((frame) => frame.data);

    const perFrameMs = this._fps !== undefined && this._fps > 0 ? 1000 / this._fps : undefined;
    this._frameDurations = decoded.frames.map((frame) =>
      Math.max(MIN_FRAME_DELAY_MS, perFrameMs ?? frame.delay),
    );
    this._totalDurationMs = this._frameDurations.reduce((sum, d) => sum + d, 0);
    this._frameTextures = this._frames.map(() => null);

    this._loaded = true;
    this._currentFrame = 0;
    this._accumulatorMs = 0;
    this._setFrame(0);
    this._updateGeometry();
    this._markDirty();

    if (this._autoplay) this._playing = true;
  }

  /** Record a load error and reject the ready promise once. */
  private _failLoad(error: Error): void {
    this._loadError = error;
    if (this._loadReject) {
      this._loadReject(error);
      this._loadReject = null;
      this._loadResolve = null;
    }
  }

  /** Advance playback by `deltaMs`, honouring per-frame delays and loop. */
  private _advance(deltaMs: number): void {
    if (this._frames.length === 0) return;
    this._accumulatorMs += deltaMs;

    let guard = this._frames.length * 2 + 2; // bound the walk against huge jumps
    while (this._accumulatorMs >= this._frameDurations[this._currentFrame] && guard-- > 0) {
      this._accumulatorMs -= this._frameDurations[this._currentFrame];
      const next = this._currentFrame + 1;
      if (next < this._frames.length) {
        this._setFrame(next);
      } else if (this._loop) {
        this._setFrame(0);
      } else {
        this._setFrame(this._frames.length - 1);
        this._playing = false;
        this._accumulatorMs = 0;
        break;
      }
    }
  }

  /** Build (or reuse) the texture for `index` and show it. */
  private _setFrame(index: number): void {
    if (index < 0 || index >= this._frames.length) return;
    this._currentFrame = index;

    let texture = this._frameTextures[index];
    if (!texture) {
      texture = this._createFrameTexture(this._frames[index]);
      this._frameTextures[index] = texture;
    }
    this._texture = texture;

    const mesh = this._mesh;
    if (mesh) {
      const material = mesh.material;
      material.map = texture;
      material.needsUpdate = true;
    }
    this._markDirty();
  }

  /** Create an upright RGBA DataTexture from a full-canvas frame buffer. */
  private _createFrameTexture(data: Uint8ClampedArray): THREE.DataTexture {
    const w = this._naturalWidth;
    const h = this._naturalHeight;
    // DataTexture is not flipped by the renderer; flip rows to match plane UVs.
    const flipped = new Uint8ClampedArray(data.length);
    const rowBytes = w * 4;
    for (let y = 0; y < h; y++) {
      const src = y * rowBytes;
      const dst = (h - 1 - y) * rowBytes;
      flipped.set(data.subarray(src, src + rowBytes), dst);
    }
    const texture = new THREE.DataTexture(flipped, w, h, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  /** Promise that resolves once the GIF decodes and rejects on decode error. */
  async waitForLoad(): Promise<void> {
    return this._loadPromise;
  }

  /** The captured load error, or null when no error occurred. */
  getLoadError(): Error | null {
    return this._loadError;
  }

  /** Whether the GIF has decoded and the first frame is ready. */
  isLoaded(): boolean {
    return this._loaded;
  }
  /** The GIF source URL or data URI. */
  getSource(): string {
    return this._source;
  }
  /** Number of decoded frames (0 until the GIF loads). */
  get frameCount(): number {
    return this._frames.length;
  }
  /** Index of the frame currently displayed. */
  get currentFrame(): number {
    return this._currentFrame;
  }
  /** Total play time of one loop, in seconds (0 until loaded). */
  get duration(): number {
    return this._totalDurationMs / 1000;
  }
  /** Whether playback is currently running. */
  isPlaying(): boolean {
    return this._playing;
  }
  /** Start or resume playback. */
  play(): this {
    if (this._frames.length > 0) this._playing = true;
    return this;
  }
  /** Pause playback on the current frame. */
  pause(): this {
    this._playing = false;
    return this;
  }

  /** Jump to a frame index, clamped to [0, frameCount - 1]. */
  seek(frame: number): this {
    if (this._frames.length === 0) return this;
    const index = Math.max(0, Math.min(this._frames.length - 1, Math.floor(frame)));
    this._accumulatorMs = 0;
    this._setFrame(index);
    return this;
  }

  /** Enable or disable looping. */
  setLoop(loop: boolean): this {
    this._loop = loop;
    return this;
  }

  /**
   * Follow the Player clock: show the frame at `sceneTime` seconds. Use this on
   * scrub and seek so the displayed frame tracks the timeline position.
   */
  syncToTime(sceneTime: number): this {
    if (this._frames.length === 0 || this._totalDurationMs <= 0) return this;

    let ms = sceneTime * 1000;
    if (this._loop) {
      ms = ((ms % this._totalDurationMs) + this._totalDurationMs) % this._totalDurationMs;
    } else {
      ms = Math.max(0, Math.min(ms, this._totalDurationMs));
    }

    let cumulative = 0;
    let index = this._frames.length - 1;
    for (let i = 0; i < this._frameDurations.length; i++) {
      cumulative += this._frameDurations[i];
      if (ms < cumulative) {
        index = i;
        break;
      }
    }
    this._accumulatorMs = 0;
    this._setFrame(index);
    return this;
  }

  /** Display dimensions from width/height options and the natural size. */
  private _calculateDimensions(): { width: number; height: number } {
    const aspectRatio = this._naturalWidth / this._naturalHeight;

    if (this._width !== undefined && this._height !== undefined) {
      if (this._scaleToFit) {
        const boxAspect = this._width / this._height;
        if (aspectRatio > boxAspect) {
          return { width: this._width, height: this._width / aspectRatio };
        }
        return { width: this._height * aspectRatio, height: this._height };
      }
      return { width: this._width, height: this._height };
    }
    if (this._width !== undefined) {
      return { width: this._width, height: this._width / aspectRatio };
    }
    if (this._height !== undefined) {
      return { width: this._height * aspectRatio, height: this._height };
    }
    // Default: half the standard frame height (matches ImageMobject intent).
    return { width: 4 * aspectRatio, height: 4 };
  }

  protected _createThreeObject(): THREE.Object3D {
    const dims = this._calculateDimensions();
    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      opacity: this._opacity,
      side: this._doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      // Flat mesh: draw both faces in one pass. Otherwise three.js renders a
      // transparent DoubleSide material twice and re-resolves its program per frame.
      forceSinglePass: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(dims.width, dims.height, 1);
    mesh.frustumCulled = false;
    this._mesh = mesh;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  override getDisplayMeshLength(): number {
    return 1;
  }

  override getDisplayMeshes(): THREE.Mesh[] {
    const object = this.getThreeObject();
    if (!(object instanceof THREE.Group)) {
      throw new Error('AnimatedImageMobject.getThreeObject() must return a THREE.Group');
    }
    if (!this._mesh) {
      throw new Error('AnimatedImageMobject.getDisplayMeshes requires _mesh');
    }
    return [this._mesh];
  }

  applyTextureFrom(other: TexturedMobject): void {
    if (!(other instanceof AnimatedImageMobject)) {
      throw new Error('AnimatedImageMobject.applyTextureFrom requires AnimatedImageMobject');
    }
    const mesh = this._mesh;
    const sourceMesh = other.getDisplayMeshes()[0];
    if (!mesh || !sourceMesh) {
      throw new Error('AnimatedImageMobject.applyTextureFrom requires both meshes');
    }
    const material = mesh.material;
    const sourceMaterial = sourceMesh.material;
    if (
      !(material instanceof THREE.MeshBasicMaterial) ||
      !(sourceMaterial instanceof THREE.MeshBasicMaterial)
    ) {
      throw new Error('AnimatedImageMobject.applyTextureFrom requires MeshBasicMaterial');
    }
    const nextTexture = sourceMaterial.map as THREE.DataTexture | null;
    const previousTexture = this._texture;
    this._handoffTextureMap(material, nextTexture, previousTexture);
    this._texture = nextTexture;
  }

  applyVisualSize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this._scaleToFit = false;
    this._updateGeometry();
  }

  applyContentFrom(other: TexturedMobject): void {
    if (!(other instanceof AnimatedImageMobject)) {
      throw new Error('AnimatedImageMobject.applyContentFrom requires AnimatedImageMobject');
    }
    this._source = other._source;
  }

  protected _updateGeometry(): void {
    const mesh = this._mesh;
    if (!mesh) return;
    const dims = this._calculateDimensions();
    mesh.scale.set(dims.width, dims.height, 1);
    const material = mesh.material;
    if (material && this._texture) {
      material.map = this._texture;
      material.needsUpdate = true;
    }
    this._markDirty();
  }

  protected override _syncMaterialToThree(): void {
    const mesh = this._mesh;
    if (!mesh) return;
    const material = mesh.material;
    material.opacity = this._opacity;
    material.transparent = this._opacity < 1;
    material.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
    if (this._texture) material.map = this._texture;
    material.needsUpdate = true;
  }

  override getBoundingBox(): { width: number; height: number; depth: number } {
    const dims = this._calculateDimensions();
    return {
      width: dims.width * this.scaleVector.x,
      height: dims.height * this.scaleVector.y,
      depth: 0.01,
    };
  }

  override copy(): AnimatedImageMobject {
    const copy = new AnimatedImageMobject({
      source: this._source,
      loop: this._loop,
      autoplay: this._autoplay,
      fps: this._fps,
      width: this._width,
      height: this._height,
      scaleToFit: this._scaleToFit,
      center: this._centerPoint,
      opacity: this._opacity,
      doubleSided: this._doubleSided,
    });
    // copyPosition stays true: a mesh keeps its translation on `position` (not
    // baked into points like a VMobject), so dropping the live position would
    // snap a copy back to its construction-time center and break Transform.
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }

  override dispose(): void {
    super.dispose();
    this._playing = false;
    for (const texture of this._frameTextures) {
      if (texture) texture.dispose();
    }
    this._frameTextures = [];
    this._frames = [];
    this._texture = null;
  }
}

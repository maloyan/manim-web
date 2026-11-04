import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { TexturedMobject } from '../../core/TexturedMobject';

/**
 * Options for creating a VideoMobject.
 */
export interface VideoMobjectOptions {
  /** Video source URL. Required. */
  src: string;
  /** Loop playback when it reaches the end. Default: false */
  loop?: boolean;
  /** Mute the audio track. Default: true (needed for browser autoplay policies) */
  muted?: boolean;
  /** Start playing as soon as data is available. Default: false */
  autoplay?: boolean;
  /** Playback speed multiplier (1 = normal). Default: 1 */
  playbackRate?: number;
  /** Width of the video in scene units. Default: auto from aspect ratio */
  width?: number;
  /** Height of the video in scene units. Default: auto from aspect ratio */
  height?: number;
  /** If both width and height given, fit inside the box preserving aspect. Default: true */
  scaleToFit?: boolean;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Render both sides of the plane. Default: false */
  doubleSided?: boolean;
  /** crossOrigin attribute for the video element. Default: 'anonymous' */
  crossOrigin?: string | null;
}

/**
 * VideoMobject - display an HTML `<video>` as a movable, scalable mobject.
 *
 * The video is drawn onto a `THREE.PlaneGeometry` through a
 * `THREE.VideoTexture`, mirroring how {@link ImageMobject} draws images. It
 * therefore participates in the standard mobject transforms (shift, scale,
 * rotate), z-index/depth, opacity, and `scene.add`.
 *
 * Playback follows the DOM video clock during normal play. When the Player
 * scrubs or seeks, call {@link syncToTime} so the displayed frame follows the
 * scene time.
 *
 * @example
 * ```typescript
 * const clip = new VideoMobject({ src: 'intro.mp4', width: 6, loop: true });
 * scene.add(clip);
 * await clip.waitForLoad();
 * clip.play();
 * ```
 */
export class VideoMobject extends TexturedMobject {
  protected _source: string;
  protected _loop: boolean;
  protected _muted: boolean;
  protected _autoplay: boolean;
  protected _playbackRate: number;
  protected _width: number | undefined;
  protected _height: number | undefined;
  protected _scaleToFit: boolean;
  protected _centerPoint: Vector3Tuple;
  protected _doubleSided: boolean;
  protected _crossOrigin: string | null;

  protected _video: HTMLVideoElement | null = null;
  protected _texture: THREE.VideoTexture | null = null;
  protected _videoLoaded: boolean = false;
  protected _loadError: Error | null = null;
  protected _naturalWidth: number = 16;
  protected _naturalHeight: number = 9;
  private _mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | null = null;

  private _loadPromise: Promise<void>;
  private _loadResolve: (() => void) | null = null;
  private _loadReject: ((reason: Error) => void) | null = null;

  constructor(options: VideoMobjectOptions) {
    super();

    const {
      src,
      loop = false,
      muted = true,
      autoplay = false,
      playbackRate = 1,
      width,
      height,
      scaleToFit = true,
      center = [0, 0, 0],
      opacity = 1,
      doubleSided = false,
      crossOrigin = 'anonymous',
    } = options;

    this._source = src;
    this._loop = loop;
    this._muted = muted;
    this._autoplay = autoplay;
    this._playbackRate = playbackRate;
    this._width = width;
    this._height = height;
    this._scaleToFit = scaleToFit;
    this._centerPoint = [...center];
    this._doubleSided = doubleSided;
    this._crossOrigin = crossOrigin;
    this._opacity = opacity;

    this.position.set(center[0], center[1], center[2]);

    this._loadPromise = new Promise((resolve, reject) => {
      this._loadResolve = resolve;
      this._loadReject = reject;
    });

    // Keep the video texture fresh each frame during live playback. VideoTexture
    // also self-updates, so this is a belt-and-suspenders hook and is idempotent.
    this.addUpdater(() => {
      if (this._texture) this._texture.needsUpdate = true;
    });

    this._createVideo();
  }

  /**
   * Create the DOM video element and its VideoTexture. Node/SSR-safe: when
   * `document` is missing, the load fails gracefully instead of throwing.
   */
  private _createVideo(): void {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      this._failLoad(new Error('Failed to load video: no DOM (document is unavailable)'));
      return;
    }

    const video = document.createElement('video');
    video.src = this._source;
    video.loop = this._loop;
    video.muted = this._muted;
    video.autoplay = this._autoplay;
    video.playbackRate = this._playbackRate;
    video.playsInline = true;
    if (this._crossOrigin !== null) video.crossOrigin = this._crossOrigin;

    video.addEventListener('loadeddata', () => {
      this._naturalWidth = video.videoWidth || this._naturalWidth;
      this._naturalHeight = video.videoHeight || this._naturalHeight;
      this._videoLoaded = true;
      this._updateGeometry();
      this._markDirty();
      if (this._loadResolve) {
        this._loadResolve();
        this._loadResolve = null;
        this._loadReject = null;
      }
    });

    video.addEventListener('error', () => {
      this._failLoad(new Error(`Failed to load video: ${this._source}`));
    });

    this._video = video;

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this._texture = texture;
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

  /** Promise that resolves on `loadeddata` and rejects on load error. */
  async waitForLoad(): Promise<void> {
    return this._loadPromise;
  }

  /** The captured load error, or null when no error occurred. */
  getLoadError(): Error | null {
    return this._loadError;
  }

  /** Whether the first frame of video data is available. */
  isLoaded(): boolean {
    return this._videoLoaded;
  }

  /** The video source URL. */
  getSource(): string {
    return this._source;
  }

  /** Start (or resume) playback. Silently ignores autoplay rejections. */
  play(): this {
    const result = this._video?.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        /* autoplay policy may reject; the caller can retry after a gesture */
      });
    }
    return this;
  }

  /** Pause playback. */
  pause(): this {
    this._video?.pause();
    return this;
  }

  /** Seek the video to an absolute time in seconds, clamped to [0, duration]. */
  seek(seconds: number): this {
    if (this._video) this._video.currentTime = this._clampTime(seconds);
    return this;
  }

  /** Set the playback speed multiplier. */
  setPlaybackRate(rate: number): this {
    this._playbackRate = rate;
    if (this._video) this._video.playbackRate = rate;
    return this;
  }

  /** Duration of the video in seconds (NaN until metadata loads). */
  get duration(): number {
    return this._video ? this._video.duration : NaN;
  }

  /**
   * Follow the Player clock: show the frame at `sceneTime`. Use this on scrub
   * and seek so the displayed frame tracks the timeline position.
   */
  syncToTime(sceneTime: number): this {
    if (this._video) {
      this._video.currentTime = this._clampTime(sceneTime);
      if (this._texture) this._texture.needsUpdate = true;
    }
    return this;
  }

  /** Clamp a time to [0, duration]; duration may be NaN before metadata loads. */
  private _clampTime(seconds: number): number {
    const d = this._video ? this._video.duration : NaN;
    const lower = Math.max(0, seconds);
    return Number.isFinite(d) ? Math.min(lower, d) : lower;
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
      throw new Error('VideoMobject.getThreeObject() must return a THREE.Group');
    }
    if (!this._mesh) {
      throw new Error('VideoMobject.getDisplayMeshes requires _mesh');
    }
    return [this._mesh];
  }

  applyTextureFrom(other: TexturedMobject): void {
    if (!(other instanceof VideoMobject)) {
      throw new Error('VideoMobject.applyTextureFrom requires VideoMobject');
    }
    const mesh = this._mesh;
    const sourceMesh = other.getDisplayMeshes()[0];
    if (!mesh) {
      throw new Error('VideoMobject.applyTextureFrom requires mesh');
    }
    if (!sourceMesh) {
      throw new Error('VideoMobject.applyTextureFrom requires source mesh');
    }
    const material = mesh.material;
    const sourceMaterial = sourceMesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial)) {
      throw new Error('VideoMobject.applyTextureFrom requires MeshBasicMaterial');
    }
    if (!(sourceMaterial instanceof THREE.MeshBasicMaterial)) {
      throw new Error('VideoMobject.applyTextureFrom requires source MeshBasicMaterial');
    }
    const nextTexture = sourceMaterial.map as THREE.VideoTexture | null;
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
    if (!(other instanceof VideoMobject)) {
      throw new Error('VideoMobject.applyContentFrom requires VideoMobject');
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

  override copy(): VideoMobject {
    const copy = new VideoMobject({
      src: this._source,
      loop: this._loop,
      muted: this._muted,
      autoplay: this._autoplay,
      playbackRate: this._playbackRate,
      width: this._width,
      height: this._height,
      scaleToFit: this._scaleToFit,
      center: this._centerPoint,
      opacity: this._opacity,
      doubleSided: this._doubleSided,
      crossOrigin: this._crossOrigin,
    });
    copy._videoLoaded = this._videoLoaded;
    copy._naturalWidth = this._naturalWidth;
    copy._naturalHeight = this._naturalHeight;
    // copyPosition stays true: a mesh keeps its translation on `position` (not
    // baked into points like a VMobject), so dropping the live position would
    // snap a copy back to its construction-time center and break Transform.
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }

  override dispose(): void {
    super.dispose();
    if (this._video) {
      this._video.pause();
      this._video.removeAttribute('src');
      this._video.load();
      this._video = null;
    }
    if (this._texture) {
      this._texture.dispose();
      this._texture = null;
    }
  }
}

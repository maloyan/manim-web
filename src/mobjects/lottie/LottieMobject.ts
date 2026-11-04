import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { TexturedMobject } from '../../core/TexturedMobject';

/**
 * LottieMobject - display a Lottie (Bodymovin JSON) animation as a mobject.
 *
 * ManimCE cannot import After Effects / Lottie vector animations. The browser
 * can: `lottie-web` renders the JSON into an offscreen `<canvas>`, which this
 * mobject presents through a `THREE.CanvasTexture` on a plane - exactly how
 * {@link VideoMobject} and {@link ImageMobject} draw their frames. The plane
 * then participates in the standard mobject transforms (shift, scale, rotate),
 * z-index/depth, opacity, and `scene.add`.
 *
 * The animation is time-driven: call {@link syncToTime} on scrub/seek so the
 * displayed frame follows the Player clock, or {@link play} for live playback
 * via the updater. `lottie-web` is pulled in through a lazy dynamic `import()`
 * so the base bundle and SSR never load it. Tests inject a player (via the
 * `player` option or {@link setLottiePlayerFactory}) to avoid the real library
 * and any DOM/canvas - mirroring ModelMobject's loader-injection seam.
 *
 * @example
 * ```typescript
 * const anim = await LottieMobject.fromUrl('spinner.json', { width: 4, loop: true });
 * scene.add(anim);
 * anim.play();
 * ```
 */

/**
 * Parsed Bodymovin JSON. Only `w`, `h` and `fr` are read here (for the natural
 * size and frame rate); the whole object is handed to the player unchanged.
 */
export interface LottieAnimationData {
  /** Composition width in pixels. */
  w?: number;
  /** Composition height in pixels. */
  h?: number;
  /** Frame rate in frames per second. */
  fr?: number;
  [key: string]: unknown;
}

/**
 * The subset of a `lottie-web` AnimationItem this mobject drives. The real
 * AnimationItem satisfies it structurally; tests implement it with a stub.
 */
export interface LottieAnimation {
  /** Total number of frames in the composition. */
  totalFrames: number;
  /** Frame rate in frames per second. */
  frameRate: number;
  /** Seek to a frame (`isFrame` true) or a time, and stop there. */
  goToAndStop(value: number, isFrame?: boolean): void;
  /** Set the live-playback speed multiplier. */
  setSpeed?(speed: number): void;
  /** Release the player's resources. */
  destroy(): void;
}

/** Parameters passed to the player's `loadAnimation`. */
export interface LottieLoadParams {
  /** The canvas element that backs the texture. */
  container: unknown;
  /** Always `'canvas'`: this mobject renders into an offscreen canvas. */
  renderer: 'canvas';
  /** Loop the composition during live playback. */
  loop: boolean;
  /** Never autoplay: playback is driven by the updater or by seeks. */
  autoplay: boolean;
  /** The parsed Bodymovin JSON. */
  animationData: LottieAnimationData;
  /** Canvas renderer settings (the 2D context to draw into). */
  rendererSettings: { context?: unknown; canvas?: unknown; clearCanvas?: boolean };
}

/**
 * The minimal player contract. `lottie-web`'s default export satisfies it.
 */
export interface LottiePlayer {
  loadAnimation(params: LottieLoadParams): LottieAnimation;
}

/** Builds a player. The DI seam set by {@link setLottiePlayerFactory}. */
export type LottiePlayerFactory = () => LottiePlayer | Promise<LottiePlayer>;

/** Injected player factory. When set, the lazy default import is skipped. */
let playerFactoryOverride: LottiePlayerFactory | null = null;

/**
 * Inject a player factory, replacing the lazy-loaded `lottie-web`. Pass `null`
 * to restore the default. Tests use this to avoid the real library.
 */
export function setLottiePlayerFactory(factory: LottiePlayerFactory | null): void {
  playerFactoryOverride = factory;
}

/**
 * Dynamically load `lottie-web`. The specifier is a literal so bundlers emit a
 * separate lazy chunk and keep it out of the base bundle.
 */
async function defaultPlayerFactory(): Promise<LottiePlayer> {
  const mod = await import('lottie-web');
  const candidate = (mod as { default?: unknown }).default ?? mod;
  // cast: lottie-web ships no usable types for the default export; the runtime
  // object satisfies the LottiePlayer shape this module relies on.
  return candidate as unknown as LottiePlayer;
}

/** Resolve the player, honoring the injected player / factory. */
async function resolvePlayer(injected?: LottiePlayer): Promise<LottiePlayer> {
  if (injected) return injected;
  if (playerFactoryOverride) return playerFactoryOverride();
  return defaultPlayerFactory();
}

/** Options for creating a {@link LottieMobject}. */
export interface LottieMobjectOptions {
  /** Parsed Bodymovin JSON. Required unless using {@link LottieMobject.fromUrl}. */
  animationData?: LottieAnimationData;
  /** Loop the composition during live playback and time wrapping. Default: false. */
  loop?: boolean;
  /** Playback speed multiplier (1 = normal). Default: 1. */
  speed?: number;
  /** Width in scene units. Default: auto from the composition aspect ratio. */
  width?: number;
  /** Height in scene units. Default: auto from the composition aspect ratio. */
  height?: number;
  /** If both width and height given, fit inside the box preserving aspect. Default: true. */
  scaleToFit?: boolean;
  /** Center position [x, y, z]. Default: [0, 0, 0]. */
  center?: Vector3Tuple;
  /** Opacity from 0 to 1. Default: 1. */
  opacity?: number;
  /** Render both sides of the plane. Default: false. */
  doubleSided?: boolean;
  /** Inject a player directly (bypasses the factory and the network). */
  player?: LottiePlayer;
}

/** Options for {@link LottieMobject.fromUrl}. */
export interface LottieFromUrlOptions extends Omit<LottieMobjectOptions, 'animationData'> {
  /** Inject a `fetch` implementation (bypasses the global; used by tests). */
  fetchImpl?: typeof fetch;
}

/** Default natural size when the Bodymovin JSON omits `w`/`h`. */
const DEFAULT_SIZE = 512;
/** Default frame rate when neither the player nor the JSON reports one. */
const DEFAULT_FRAME_RATE = 30;

export class LottieMobject extends TexturedMobject {
  protected _animationData: LottieAnimationData | undefined;
  protected _loop: boolean;
  protected _speed: number;
  protected _width: number | undefined;
  protected _height: number | undefined;
  protected _scaleToFit: boolean;
  protected _centerPoint: Vector3Tuple;
  protected _doubleSided: boolean;
  protected _injectedPlayer: LottiePlayer | undefined;

  protected _canvas: HTMLCanvasElement | null = null;
  protected _texture: THREE.CanvasTexture | null = null;
  protected _animation: LottieAnimation | null = null;
  protected _totalFrames: number = 0;
  protected _frameRate: number = DEFAULT_FRAME_RATE;
  protected _naturalWidth: number = DEFAULT_SIZE;
  protected _naturalHeight: number = DEFAULT_SIZE;
  protected _loaded: boolean = false;
  protected _loadError: Error | null = null;
  protected _playing: boolean = false;
  protected _playhead: number = 0;
  private _mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | null = null;

  private _loadPromise: Promise<void>;
  private _loadResolve: (() => void) | null = null;
  private _loadReject: ((reason: Error) => void) | null = null;

  constructor(options: LottieMobjectOptions) {
    super();

    const {
      animationData,
      loop = false,
      speed = 1,
      width,
      height,
      scaleToFit = true,
      center = [0, 0, 0],
      opacity = 1,
      doubleSided = false,
      player,
    } = options;

    this._animationData = animationData;
    this._loop = loop;
    this._speed = speed;
    this._width = width;
    this._height = height;
    this._scaleToFit = scaleToFit;
    this._centerPoint = [...center];
    this._doubleSided = doubleSided;
    this._opacity = opacity;
    this._injectedPlayer = player;

    if (animationData) {
      this._naturalWidth = animationData.w ?? DEFAULT_SIZE;
      this._naturalHeight = animationData.h ?? DEFAULT_SIZE;
      if (typeof animationData.fr === 'number' && animationData.fr > 0) {
        this._frameRate = animationData.fr;
      }
    }

    this.position.set(center[0], center[1], center[2]);

    this._loadPromise = new Promise((resolve, reject) => {
      this._loadResolve = resolve;
      this._loadReject = reject;
    });

    // Advance live playback and keep the canvas texture fresh each frame.
    this.addUpdater((_mobject, dt: number) => {
      if (!this._playing) return;
      this._playhead += dt * this._speed;
      this._applyTime(this._playhead);
    });

    this._createCanvasTexture();
    void this._load();
  }

  /**
   * Load a Lottie JSON from a URL and return a ready LottieMobject.
   *
   * The JSON is fetched and parsed, then handed to the player. Inject a player
   * (via the `player` option or {@link setLottiePlayerFactory}) and a `fetchImpl`
   * to avoid the network, e.g. in tests.
   */
  static async fromUrl(url: string, options: LottieFromUrlOptions = {}): Promise<LottieMobject> {
    const { fetchImpl, ...rest } = options;
    const fetchFn = fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined);
    if (!fetchFn) {
      throw new Error('Failed to load Lottie: no fetch available (no DOM/network)');
    }
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`Failed to load Lottie from "${url}": HTTP ${response.status}`);
    }
    const animationData = (await response.json()) as LottieAnimationData;
    const mobject = new LottieMobject({ ...rest, animationData });
    await mobject.waitForLoad();
    return mobject;
  }

  /**
   * Create the offscreen canvas and its CanvasTexture. Node/SSR-safe: when
   * `document` is missing, the load fails gracefully instead of throwing.
   */
  private _createCanvasTexture(): void {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(this._naturalWidth));
    canvas.height = Math.max(1, Math.round(this._naturalHeight));
    this._canvas = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this._texture = texture;
  }

  /** Resolve the player, load the animation, and show the first frame. */
  private async _load(): Promise<void> {
    if (!this._animationData) {
      this._failLoad(new Error('Failed to load Lottie: no animationData provided'));
      return;
    }
    if (!this._canvas) {
      this._failLoad(new Error('Failed to load Lottie: no DOM (canvas is unavailable)'));
      return;
    }
    try {
      const player = await resolvePlayer(this._injectedPlayer);
      const context = this._canvas.getContext('2d') ?? undefined;
      const animation = player.loadAnimation({
        container: this._canvas,
        renderer: 'canvas',
        loop: this._loop,
        autoplay: false,
        animationData: this._animationData,
        rendererSettings: { context, canvas: this._canvas, clearCanvas: true },
      });

      this._animation = animation;
      this._totalFrames = animation.totalFrames > 0 ? animation.totalFrames : 0;
      if (animation.frameRate > 0) this._frameRate = animation.frameRate;
      if (this._speed !== 1 && typeof animation.setSpeed === 'function') {
        animation.setSpeed(this._speed);
      }
      this._loaded = true;
      this._seekFrame(0);
      this._updateGeometry();
      this._markDirty();
      if (this._loadResolve) {
        this._loadResolve();
        this._loadResolve = null;
        this._loadReject = null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this._failLoad(new Error(`Failed to load Lottie: ${message}`));
    }
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

  /** Promise that resolves when the animation is ready and rejects on error. */
  async waitForLoad(): Promise<void> {
    return this._loadPromise;
  }

  /** The captured load error, or null when no error occurred. */
  getLoadError(): Error | null {
    return this._loadError;
  }

  /** Whether the animation is loaded and seekable. */
  isLoaded(): boolean {
    return this._loaded;
  }

  /** Total number of frames in the composition (0 until loaded). */
  getTotalFrames(): number {
    return this._totalFrames;
  }

  /** Frame rate in frames per second. */
  getFrameRate(): number {
    return this._frameRate;
  }

  /** Natural duration of one loop in seconds (0 until loaded). */
  get duration(): number {
    return this._frameRate > 0 ? this._totalFrames / this._frameRate : 0;
  }

  /** The frame index for a scene time, honoring speed and loop. */
  private _frameForTime(seconds: number): number {
    const total = this._totalFrames;
    if (total <= 0) return 0;
    const rate = this._frameRate > 0 ? this._frameRate : DEFAULT_FRAME_RATE;
    let frame = seconds * rate * this._speed;
    if (this._loop) {
      frame = ((frame % total) + total) % total;
    } else {
      frame = Math.max(0, Math.min(frame, total));
    }
    return frame;
  }

  /** Seek the player to a frame and flag the texture for upload. */
  private _seekFrame(frame: number): void {
    if (this._animation) this._animation.goToAndStop(frame, true);
    if (this._texture) this._texture.needsUpdate = true;
  }

  /** Show the frame for a scene time without moving the live playhead. */
  private _applyTime(seconds: number): void {
    this._seekFrame(this._frameForTime(seconds));
  }

  /**
   * Follow the Player clock: show the frame at `sceneTime` seconds. Use this on
   * scrub and seek so the displayed frame tracks the timeline position.
   */
  syncToTime(sceneTime: number): this {
    this._playhead = sceneTime;
    this._applyTime(sceneTime);
    return this;
  }

  /** Seek to a progress fraction in [0, 1] of the composition. */
  seekToProgress(progress: number): this {
    const total = this._totalFrames;
    if (total <= 0) return this;
    let frame = progress * total;
    if (this._loop) {
      frame = ((frame % total) + total) % total;
    } else {
      frame = Math.max(0, Math.min(frame, total));
    }
    this._playhead = this._frameRate > 0 ? frame / (this._frameRate * this._speed) : 0;
    this._seekFrame(frame);
    return this;
  }

  /** Start live playback from the current playhead (advanced by the updater). */
  play(): this {
    this._playing = true;
    return this;
  }

  /** Pause live playback. */
  pause(): this {
    this._playing = false;
    return this;
  }

  /** Set the playback speed multiplier. */
  setSpeed(speed: number): this {
    this._speed = speed;
    if (this._animation && typeof this._animation.setSpeed === 'function') {
      this._animation.setSpeed(speed);
    }
    return this;
  }

  /** Enable or disable looping. */
  setLoop(loop: boolean): this {
    this._loop = loop;
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
    // Default: half the standard frame height (matches Video/ImageMobject).
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
      throw new Error('LottieMobject.getThreeObject() must return a THREE.Group');
    }
    if (!this._mesh) {
      throw new Error('LottieMobject.getDisplayMeshes requires _mesh');
    }
    return [this._mesh];
  }

  applyTextureFrom(other: TexturedMobject): void {
    if (!(other instanceof LottieMobject)) {
      throw new Error('LottieMobject.applyTextureFrom requires LottieMobject');
    }
    const mesh = this._mesh;
    const sourceMesh = other.getDisplayMeshes()[0];
    if (!mesh) {
      throw new Error('LottieMobject.applyTextureFrom requires mesh');
    }
    if (!sourceMesh) {
      throw new Error('LottieMobject.applyTextureFrom requires source mesh');
    }
    const material = mesh.material;
    const sourceMaterial = sourceMesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial)) {
      throw new Error('LottieMobject.applyTextureFrom requires MeshBasicMaterial');
    }
    if (!(sourceMaterial instanceof THREE.MeshBasicMaterial)) {
      throw new Error('LottieMobject.applyTextureFrom requires source MeshBasicMaterial');
    }
    const nextTexture = sourceMaterial.map as THREE.CanvasTexture | null;
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
    if (!(other instanceof LottieMobject)) {
      throw new Error('LottieMobject.applyContentFrom requires LottieMobject');
    }
    this._animationData = other._animationData;
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

  override copy(): LottieMobject {
    const copy = new LottieMobject({
      animationData: this._animationData,
      loop: this._loop,
      speed: this._speed,
      width: this._width,
      height: this._height,
      scaleToFit: this._scaleToFit,
      center: this._centerPoint,
      opacity: this._opacity,
      doubleSided: this._doubleSided,
      player: this._injectedPlayer,
    });
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
    this._playing = false;
    if (this._animation) {
      this._animation.destroy();
      this._animation = null;
    }
    if (this._texture) {
      this._texture.dispose();
      this._texture = null;
    }
    this._canvas = null;
  }
}

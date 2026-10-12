/**
 * PostProcessingPipeline - opt-in GPU post-processing for manim-web scenes.
 *
 * Native Cairo ManimCE cannot do screen-space GPU effects. Three.js ships an
 * `EffectComposer` with ready-made passes (bloom/glow, bokeh depth of field,
 * and custom shader passes). manim-web exposes them behind an OPT-IN pipeline
 * so the default render path stays byte-identical to a direct
 * `renderer.render(scene, camera)` call.
 *
 * Wiring (why rendering can fall back):
 *   The composer and its passes come from `three/examples/jsm/postprocessing`,
 *   which have no bundled types and must stay out of the base bundle. They are
 *   pulled in through a lazy dynamic `import()` on first use (same seam as
 *   ModelMobject's loaders). While the modules load, `render()` reports that it
 *   did not draw, so the caller (Scene) keeps using the direct render path for
 *   that frame. Once the modules resolve, the composer builds and every later
 *   frame routes through `composer.render()`.
 *
 * Tests inject the module classes synchronously with `setPostProcessingModules`
 * so the composer builds on the first render without any real GPU or network.
 */
import * as THREE from 'three';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Public option types
// ---------------------------------------------------------------------------

/** Bloom (glow) pass configuration. */
export interface BloomOptions {
  /** Glow intensity. Higher spreads brighter areas more. Default: 1. */
  strength?: number;
  /** Glow spread radius (0-1). Default: 0.4. */
  radius?: number;
  /** Luminance threshold above which pixels glow (0-1). Default: 0.85. */
  threshold?: number;
}

/** Vignette pass configuration (darkened frame edges). */
export interface VignetteOptions {
  /** Distance from center where darkening starts. Default: 1. */
  offset?: number;
  /** Edge darkness strength. Default: 1. */
  darkness?: number;
}

/** Bokeh depth-of-field pass configuration. */
export interface DepthOfFieldOptions {
  /** Focus distance in world units. Default: 10. */
  focus?: number;
  /** Lens aperture; larger blurs out-of-focus areas more. Default: 0.025. */
  aperture?: number;
  /** Maximum blur amount (0-1). Default: 0.01. */
  maxblur?: number;
}

/** Discriminated record of a configured pass, in insertion order. */
export type PassConfig =
  | ({ type: 'bloom' } & Required<BloomOptions>)
  | ({ type: 'vignette' } & Required<VignetteOptions>)
  | ({ type: 'dof' } & Required<DepthOfFieldOptions>);

// ---------------------------------------------------------------------------
// Structural contracts for the lazily-loaded three example modules
// ---------------------------------------------------------------------------

/** The subset of `EffectComposer` the pipeline uses. */
export interface ComposerLike {
  setSize(width: number, height: number): void;
  setPixelRatio(ratio: number): void;
  addPass(pass: unknown): void;
  render(deltaTime?: number): void;
  dispose?(): void;
}

/** A uniform slot, as three's ShaderPass exposes them. */
interface UniformSlot {
  value: unknown;
}

/** The subset of a ShaderPass the pipeline mutates after construction. */
interface ShaderPassLike {
  uniforms: Record<string, UniformSlot>;
}

/**
 * The module classes the pipeline needs. Three's example modules ship without
 * types, so they are cast to this structural contract (the `as unknown as`
 * typed-contract pattern used by ModelMobject).
 */
export interface PostProcessingModules {
  EffectComposer: new (renderer: THREE.WebGLRenderer) => ComposerLike;
  RenderPass: new (scene: THREE.Scene, camera: THREE.Camera) => unknown;
  UnrealBloomPass: new (
    resolution: THREE.Vector2,
    strength: number,
    radius: number,
    threshold: number,
  ) => unknown;
  ShaderPass: new (shader: unknown) => ShaderPassLike;
  OutputPass: new () => unknown;
  BokehPass: new (
    scene: THREE.Scene,
    camera: THREE.Camera,
    params: { focus: number; aperture: number; maxblur: number },
  ) => unknown;
}

// ---------------------------------------------------------------------------
// Module loading seam (lazy by default, injectable for tests)
// ---------------------------------------------------------------------------

/** Loads the post-processing module classes. May be sync (tests) or async. */
export type PostProcessingModulesLoader = () =>
  PostProcessingModules | Promise<PostProcessingModules>;

let cachedModules: PostProcessingModules | null = null;
let moduleLoaderOverride: PostProcessingModulesLoader | null = null;

/**
 * Inject the module classes directly, resolved synchronously. Tests use this
 * to build the composer on the first render with no real GPU. Pass `null` to
 * clear the cache and restore the lazy default import.
 */
export function setPostProcessingModules(modules: PostProcessingModules | null): void {
  cachedModules = modules;
}

/**
 * Replace the lazy default import with a custom loader. Pass `null` to restore.
 */
export function setPostProcessingModulesLoader(loader: PostProcessingModulesLoader | null): void {
  moduleLoaderOverride = loader;
}

/**
 * Dynamically import the three example post-processing modules. The import
 * specifiers are literals so bundlers emit separate lazy chunks and keep them
 * out of the base bundle.
 */
async function defaultModulesLoader(): Promise<PostProcessingModules> {
  const [composerMod, renderMod, bloomMod, shaderMod, outputMod, bokehMod] = await Promise.all([
    import('three/examples/jsm/postprocessing/EffectComposer.js'),
    import('three/examples/jsm/postprocessing/RenderPass.js'),
    import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
    import('three/examples/jsm/postprocessing/ShaderPass.js'),
    import('three/examples/jsm/postprocessing/OutputPass.js'),
    import('three/examples/jsm/postprocessing/BokehPass.js'),
  ]);
  return {
    EffectComposer: composerMod.EffectComposer,
    RenderPass: renderMod.RenderPass,
    UnrealBloomPass: bloomMod.UnrealBloomPass,
    ShaderPass: shaderMod.ShaderPass,
    OutputPass: outputMod.OutputPass,
    BokehPass: bokehMod.BokehPass,
  } as unknown as PostProcessingModules;
}

// ---------------------------------------------------------------------------
// Inline vignette shader (a small ShaderPass, no extra module needed)
// ---------------------------------------------------------------------------

/** Minimal radial vignette shader for a ShaderPass. */
const VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.0 },
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}',
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float offset;',
    'uniform float darkness;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec4 texel = texture2D(tDiffuse, vUv);',
    '  vec2 uv = (vUv - vec2(0.5)) * vec2(offset);',
    '  float vig = clamp(1.0 - dot(uv, uv), 0.0, 1.0);',
    '  texel.rgb *= mix(1.0, vig, darkness);',
    '  gl_FragColor = texel;',
    '}',
  ].join('\n'),
};

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * An opt-in stack of GPU post-processing passes. Add passes with
 * {@link addBloom}, {@link addVignette}, and {@link addDepthOfField}, then
 * attach it with `scene.usePostProcessing(pipeline)`.
 */
export class PostProcessingPipeline {
  private _enabled: boolean = true;
  private _passConfigs: PassConfig[] = [];
  private _composer: ComposerLike | null = null;
  private _loading: boolean = false;
  private _width: number = 0;
  private _height: number = 0;
  private _pixelRatio: number = 1;
  // Marks the composer stale (a pass was added/removed after it was built), so
  // the next render rebuilds it instead of drawing an out-of-date stack.
  private _dirty: boolean = false;

  /**
   * Whether the pipeline is active. When false the renderer uses the direct
   * render path, exactly as if no pipeline were attached.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * Enable or disable the pipeline.
   * @param value - true to route rendering through the composer
   * @returns this for chaining
   */
  setEnabled(value: boolean): this {
    this._enabled = value;
    return this;
  }

  /** Whether the composer is built and ready to render this frame. */
  get isReady(): boolean {
    return this._composer !== null && !this._dirty;
  }

  /** The configured passes, in insertion order. */
  getPassConfigs(): readonly PassConfig[] {
    return this._passConfigs;
  }

  /**
   * Add a bloom (glow) pass. Bright areas bleed a soft halo.
   * @param options - strength, radius, threshold
   * @returns this for chaining
   */
  addBloom(options: BloomOptions = {}): this {
    this._passConfigs.push({
      type: 'bloom',
      strength: options.strength ?? 1,
      radius: options.radius ?? 0.4,
      threshold: options.threshold ?? 0.85,
    });
    this._dirty = true;
    return this;
  }

  /**
   * Add a vignette pass that darkens the frame edges.
   * @param options - offset, darkness
   * @returns this for chaining
   */
  addVignette(options: VignetteOptions = {}): this {
    this._passConfigs.push({
      type: 'vignette',
      offset: options.offset ?? 1,
      darkness: options.darkness ?? 1,
    });
    this._dirty = true;
    return this;
  }

  /**
   * Add a bokeh depth-of-field pass. Reads explicit focus/aperture/maxblur, or
   * their defaults. A ThreeDCamera's `depthOfField`/`focalDistance` can be fed
   * in through the options.
   * @param options - focus, aperture, maxblur
   * @returns this for chaining
   */
  addDepthOfField(options: DepthOfFieldOptions = {}): this {
    this._passConfigs.push({
      type: 'dof',
      focus: options.focus ?? 10,
      aperture: options.aperture ?? 0.025,
      maxblur: options.maxblur ?? 0.01,
    });
    this._dirty = true;
    return this;
  }

  /** Remove all configured passes and drop the built composer. */
  clear(): this {
    this._passConfigs = [];
    this._disposeComposer();
    this._dirty = false;
    return this;
  }

  /**
   * Store the target size. Applied to the composer immediately when it exists,
   * otherwise used when the composer is first built.
   * @param width - canvas width in CSS pixels
   * @param height - canvas height in CSS pixels
   */
  setSize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    if (this._composer) {
      this._composer.setSize(width, height);
    }
  }

  /**
   * Render one frame through the composer.
   *
   * Returns true when the composer drew the frame, false when it could not
   * (modules still loading, no passes, or the build failed). On false the
   * caller falls back to its direct render path, so default behavior is kept.
   *
   * @param renderer - the three WebGLRenderer
   * @param scene - the three Scene
   * @param camera - the three Camera
   * @param width - canvas width in CSS pixels
   * @param height - canvas height in CSS pixels
   * @param deltaTime - optional frame delta in seconds
   */
  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
    deltaTime?: number,
  ): boolean {
    if (!this._enabled || this._passConfigs.length === 0) return false;
    this._width = width;
    this._height = height;
    this._pixelRatio = renderer.getPixelRatio();
    if (!this._ensureBuilt(renderer, scene, camera)) return false;
    const composer = this._composer;
    if (composer === null) return false;
    composer.setPixelRatio(this._pixelRatio);
    composer.setSize(width, height);
    composer.render(deltaTime);
    return true;
  }

  /**
   * Preload the post-processing modules so the next render can build the
   * composer synchronously. Safe to call repeatedly. Resolves even if loading
   * is already in flight.
   */
  async prepare(): Promise<void> {
    if (cachedModules !== null || this._loading) return;
    await this._loadModules();
  }

  /** Dispose GPU resources held by the composer. */
  dispose(): void {
    this._disposeComposer();
  }

  /**
   * Build the composer from the cached modules if possible. Returns true when
   * a ready composer exists after the call. When the modules are not cached
   * yet, starts the async load once and returns false so the caller falls back.
   */
  private _ensureBuilt(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ): boolean {
    if (this._composer !== null && !this._dirty) return true;
    if (cachedModules === null) {
      void this._loadModules();
      return false;
    }
    this._buildComposer(cachedModules, renderer, scene, camera);
    return this._composer !== null;
  }

  /**
   * Kick off (once) the async module load, caching the result globally. Errors
   * are logged, not thrown, so a fire-and-forget call cannot raise an unhandled
   * rejection and the pipeline simply keeps using the direct render path.
   */
  private async _loadModules(): Promise<void> {
    if (this._loading) return;
    this._loading = true;
    try {
      cachedModules = moduleLoaderOverride
        ? await moduleLoaderOverride()
        : await defaultModulesLoader();
    } catch (err) {
      logger.warn(`PostProcessingPipeline: failed to load post-processing modules: ${err}`);
    } finally {
      this._loading = false;
    }
  }

  /** Construct the composer and every configured pass, in order. */
  private _buildComposer(
    modules: PostProcessingModules,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ): void {
    this._disposeComposer();
    const composer = new modules.EffectComposer(renderer);
    composer.setPixelRatio(this._pixelRatio);
    composer.setSize(this._width, this._height);
    composer.addPass(new modules.RenderPass(scene, camera));

    for (const config of this._passConfigs) {
      composer.addPass(this._buildPass(config, modules, scene, camera));
    }

    // OutputPass applies tone mapping and color-space conversion last, so the
    // composited result matches a direct render's output encoding.
    composer.addPass(new modules.OutputPass());

    this._composer = composer;
    this._dirty = false;
  }

  /** Build a single pass from its config. */
  private _buildPass(
    config: PassConfig,
    modules: PostProcessingModules,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ): unknown {
    if (config.type === 'bloom') {
      const resolution = new THREE.Vector2(this._width || 1, this._height || 1);
      return new modules.UnrealBloomPass(
        resolution,
        config.strength,
        config.radius,
        config.threshold,
      );
    }
    if (config.type === 'vignette') {
      const pass = new modules.ShaderPass(VIGNETTE_SHADER);
      pass.uniforms.offset.value = config.offset;
      pass.uniforms.darkness.value = config.darkness;
      return pass;
    }
    return new modules.BokehPass(scene, camera, {
      focus: config.focus,
      aperture: config.aperture,
      maxblur: config.maxblur,
    });
  }

  /** Dispose and drop the current composer, if any. */
  private _disposeComposer(): void {
    if (this._composer && typeof this._composer.dispose === 'function') {
      this._composer.dispose();
    }
    this._composer = null;
  }
}

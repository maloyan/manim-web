/**
 * ModelMobject - import an external 3D model (glTF / .glb / .obj) as a mobject.
 *
 * ManimCE has no way to import an external 3D model (see the long-standing
 * "OBJ Support" request). Three.js ships loaders for the common formats, so
 * manim-web exposes them through a mobject that drops the loaded
 * `THREE.Object3D` into the normal Group/Mobject hierarchy. The model then
 * participates in shift / scale / rotate, z-depth and the 3D camera exactly
 * like a built-in primitive (Cube, Surface3D, ...).
 *
 * Scene-graph wiring (why there are nested groups):
 *   wrapper      - returned as `_threeObject`; its local transform is written
 *                  by `Mobject._syncToThree` from the mobject transform, so it
 *                  must stay under manim's control alone.
 *     content    - carries the `scale` and `upAxis` options.
 *       center   - carries the `center` recenter offset.
 *         model  - the pristine loaded Object3D (never mutated by options, so
 *                  `copy()` can clone it and re-apply the options cleanly).
 *
 * The real Three.js example loaders are pulled in through a lazy dynamic
 * `import()` on first use, so the base bundle and SSR never load them. Tests
 * inject a loader (via the `loader` option or `setModelLoaderFactory`), which
 * bypasses the import and the network entirely - mirroring the
 * `setTypstCompiler` dependency-injection seam in TypstRenderer.
 */
import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { Mobject3D } from './Mobject3D';
import { applyObjMaterials, type MtlLoader } from './objMaterials';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported model formats, picked from the URL extension. */
export type ModelFormat = 'gltf' | 'obj';

/**
 * The model's up direction. An axis name, or an explicit vector. The model is
 * rotated so this direction aligns with the scene up (+Y).
 */
export type ModelUpAxis = 'x' | 'y' | 'z' | Vector3Tuple;

/** A GLTF-style result, whose root Object3D lives on `.scene`. */
interface GltfLike {
  scene: THREE.Object3D;
}

/**
 * The minimal loader contract ModelMobject needs. Three.js GLTFLoader and
 * OBJLoader both satisfy it structurally. Tests implement it with a stub.
 */
export interface ModelLoader {
  loadAsync(
    url: string,
    onProgress?: (event: ProgressEvent) => void,
  ): Promise<THREE.Object3D | GltfLike>;
}

/** Builds a loader for a format. The DI seam set by `setModelLoaderFactory`. */
export type ModelLoaderFactory = (format: ModelFormat) => ModelLoader | Promise<ModelLoader>;

/** Options for {@link ModelMobject.fromUrl}. */
export interface ModelMobjectOptions {
  /** Uniform factor, or per-axis factors, applied to the loaded model. */
  scale?: number | Vector3Tuple;
  /** The model's up direction; the model is rotated to the scene up (+Y). */
  upAxis?: ModelUpAxis;
  /** Recenter the model's bounding box to the origin. Default: false. */
  center?: boolean;
  /** Convenience fill color applied to every mesh material. */
  color?: string;
  /** Replace every mesh material with this one. Wins over `color` and MTL. */
  materialOverride?: THREE.Material;
  /**
   * For .obj only: explicit companion .mtl URL. Its materials and texture maps
   * apply to the meshes. `materialOverride` and `color` still win over them.
   * Ignored for glTF, which embeds its materials natively.
   */
  mtlUrl?: string;
  /**
   * For .obj only: auto-derive the .mtl URL from the .obj URL and load it.
   * `mtlUrl` takes priority when both are set. Default: false.
   */
  loadMaterials?: boolean;
  /** Progress callback forwarded to the loader. */
  onProgress?: (event: ProgressEvent) => void;
  /** Inject a loader directly (bypasses the factory and the network). */
  loader?: ModelLoader;
  /** Inject an MTLLoader directly (bypasses the factory and the network). */
  mtlLoader?: MtlLoader;
  /**
   * When false, a load failure resolves to an empty ModelMobject whose
   * {@link ModelMobject.getLoadError} holds the error instead of rejecting.
   * Default: true (the returned promise rejects on failure).
   */
  throwOnError?: boolean;
}

// ---------------------------------------------------------------------------
// Scene up and the injectable loader factory
// ---------------------------------------------------------------------------

/** The scene up direction. manim-web renders X right, Y up, Z toward viewer. */
const SCENE_UP = new THREE.Vector3(0, 1, 0);

/** Injected loader factory. When set, the lazy default import is skipped. */
let loaderFactoryOverride: ModelLoaderFactory | null = null;

/**
 * Inject a loader factory, replacing the lazy-loaded Three.js example loaders.
 * Pass `null` to restore the default. Tests use this to avoid any real loader.
 */
export function setModelLoaderFactory(factory: ModelLoaderFactory | null): void {
  loaderFactoryOverride = factory;
}

/** Pick the model format from a URL's extension (ignores query and fragment). */
export function detectModelFormat(url: string): ModelFormat {
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith('.glb') || path.endsWith('.gltf')) return 'gltf';
  if (path.endsWith('.obj')) return 'obj';
  throw new Error(`Unsupported 3D model extension for "${url}". Use .glb, .gltf, or .obj.`);
}

/**
 * Dynamically load a Three.js example loader. The import specifiers are
 * literals so bundlers emit separate lazy chunks and static analysers still
 * see the dependency as used.
 */
async function defaultLoaderFactory(format: ModelFormat): Promise<ModelLoader> {
  if (format === 'gltf') {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    return new GLTFLoader() as unknown as ModelLoader;
  }
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
  return new OBJLoader() as unknown as ModelLoader;
}

/** Resolve the loader for a format, honoring the injected loader / factory. */
async function resolveLoader(format: ModelFormat, injected?: ModelLoader): Promise<ModelLoader> {
  if (injected) return injected;
  if (loaderFactoryOverride) return loaderFactoryOverride(format);
  return defaultLoaderFactory(format);
}

/** Normalize a loader result to the root Object3D (GLTF keeps it on `.scene`). */
function normalizeLoadResult(result: THREE.Object3D | GltfLike): THREE.Object3D {
  if (result instanceof THREE.Object3D) return result;
  if (result && 'scene' in result && result.scene instanceof THREE.Object3D) return result.scene;
  throw new Error('Model loader returned neither an Object3D nor a GLTF scene.');
}

/** Wrap a raw loader error with the URL and format for a useful message. */
function wrapLoadError(error: unknown, url: string, format: ModelFormat): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Failed to load ${format} model from "${url}": ${message}`);
}

/** A material that carries a color (MeshStandardMaterial, MeshBasicMaterial, ...). */
interface ColoredMaterial extends THREE.Material {
  color: THREE.Color;
}

function hasColor(material: THREE.Material): material is ColoredMaterial {
  return 'color' in material && (material as ColoredMaterial).color instanceof THREE.Color;
}

// ---------------------------------------------------------------------------
// ModelMobject
// ---------------------------------------------------------------------------

export class ModelMobject extends Mobject3D {
  private readonly _model: THREE.Object3D;
  private readonly _centerGroup: THREE.Group;
  private readonly _content: THREE.Group;
  private readonly _wrapper: THREE.Group;
  private readonly _format: ModelFormat | null;
  private readonly _options: ModelMobjectOptions;
  private _loadError: Error | null = null;

  /**
   * Prefer {@link ModelMobject.fromUrl}. This constructor wraps an already
   * loaded Object3D (or `null` for an empty placeholder) and applies the
   * geometry options.
   */
  constructor(
    object: THREE.Object3D | null,
    options: ModelMobjectOptions = {},
    format: ModelFormat | null = null,
  ) {
    super();
    this._options = { ...options };
    this._format = format;
    this._model = object ?? new THREE.Group();
    this._centerGroup = new THREE.Group();
    this._content = new THREE.Group();
    this._wrapper = new THREE.Group();

    if (object) {
      if (options.center) this._recenter();
      this._applyUpAxis(options.upAxis);
      this._applyScale(options.scale);
      this._applyMaterials(options);
      if (options.color) this.color = options.color;
    }

    this._centerGroup.add(this._model);
    this._content.add(this._centerGroup);
    this._wrapper.add(this._content);
  }

  /**
   * Load a model from a URL and return a ready ModelMobject.
   *
   * The loader is chosen from the extension: `.glb` / `.gltf` -> GLTFLoader,
   * `.obj` -> OBJLoader. Inject a loader with the `loader` option (or
   * `setModelLoaderFactory`) to avoid the network, e.g. in tests.
   *
   * For `.obj`, set `mtlUrl` (or `loadMaterials: true` to derive the .mtl URL)
   * to load the companion .mtl and apply its materials and texture maps before
   * the OBJ parse. `materialOverride` and `color` still win over them.
   */
  static async fromUrl(url: string, options: ModelMobjectOptions = {}): Promise<ModelMobject> {
    const format = detectModelFormat(url);
    try {
      const loader = await resolveLoader(format, options.loader);
      if (format === 'obj') await applyObjMaterials(loader, url, options);
      const result = await loader.loadAsync(url, options.onProgress);
      const object = normalizeLoadResult(result);
      return new ModelMobject(object, options, format);
    } catch (error) {
      const wrapped = wrapLoadError(error, url, format);
      if (options.throwOnError === false) {
        const placeholder = new ModelMobject(null, options, format);
        placeholder._loadError = wrapped;
        return placeholder;
      }
      throw wrapped;
    }
  }

  // ── Option application ───────────────────────────────────────────

  /** Offset the center group so the model's bounding box sits at the origin. */
  private _recenter(): void {
    const box = new THREE.Box3().setFromObject(this._model);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    this._centerGroup.position.copy(center.negate());
  }

  /** Rotate the content group so the model's up axis aligns with +Y. */
  private _applyUpAxis(upAxis?: ModelUpAxis): void {
    if (upAxis === undefined) return;
    const from = this._upAxisVector(upAxis);
    if (from.lengthSq() === 0) return;
    from.normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(from, SCENE_UP);
    this._content.quaternion.premultiply(rotation);
  }

  private _upAxisVector(upAxis: ModelUpAxis): THREE.Vector3 {
    if (typeof upAxis === 'string') {
      if (upAxis === 'x') return new THREE.Vector3(1, 0, 0);
      if (upAxis === 'y') return new THREE.Vector3(0, 1, 0);
      return new THREE.Vector3(0, 0, 1);
    }
    return new THREE.Vector3(upAxis[0], upAxis[1], upAxis[2]);
  }

  /** Scale the content group uniformly or per axis. */
  private _applyScale(scale?: number | Vector3Tuple): void {
    if (scale === undefined) return;
    if (typeof scale === 'number') {
      this._content.scale.multiplyScalar(scale);
      return;
    }
    this._content.scale.multiply(new THREE.Vector3(scale[0], scale[1], scale[2]));
  }

  /** Apply a material override, or a fill color, to every mesh in the model. */
  private _applyMaterials(options: ModelMobjectOptions): void {
    const override = options.materialOverride;
    const color = options.color;
    if (!override && !color) return;
    this._forEachMesh((mesh) => {
      if (override) {
        mesh.material = override;
      } else if (color) {
        this._applyColor(mesh.material, color);
      }
    });
  }

  private _applyColor(material: THREE.Material | THREE.Material[], color: string): void {
    const materials = Array.isArray(material) ? material : [material];
    for (const entry of materials) {
      if (hasColor(entry)) entry.color.set(color);
    }
  }

  private _forEachMesh(fn: (mesh: THREE.Mesh) => void): void {
    this._model.traverse((object) => {
      if (object instanceof THREE.Mesh) fn(object);
    });
  }

  // ── Accessors ────────────────────────────────────────────────────

  /** The loaded model root (an empty Group if the load failed). */
  getObject(): THREE.Object3D {
    return this._model;
  }

  /** The format this model was loaded as, or null for a bare construction. */
  getFormat(): ModelFormat | null {
    return this._format;
  }

  /** The load error, or null if the model loaded successfully. */
  getLoadError(): Error | null {
    return this._loadError;
  }

  // ── Mobject integration ──────────────────────────────────────────

  protected _createThreeObject(): THREE.Object3D {
    return this._wrapper;
  }

  override copy(): ModelMobject {
    const clonedModel = this._loadError ? null : this._model.clone(true);
    const copy = new ModelMobject(clonedModel, { ...this._options }, this._format);
    copy._loadError = this._loadError;
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

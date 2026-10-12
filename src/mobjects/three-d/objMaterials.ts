/**
 * OBJ material (.mtl) support for ModelMobject.
 *
 * A bare OBJLoader loads geometry only, so an .obj renders with a default
 * material and no textures. The Wavefront format keeps materials in a
 * companion .mtl file, and the maps that file names (diffuse, normal, ...) are
 * separate image files. This module loads the .mtl with MTLLoader, preloads its
 * materials, and hands them to the OBJLoader before it parses, so the meshes
 * get their materials and texture maps.
 *
 * It follows the same seams as ModelMobject: the real Three.js MTLLoader is
 * pulled in through a lazy dynamic `import()` on first use, and tests inject a
 * stub loader (via the `mtlLoader` option or `setMtlLoaderFactory`) so no test
 * touches the network. GLTF is untouched - it embeds its materials natively.
 */
import type { ModelLoader } from './ModelMobject';

/** A preloaded MTL material set. Three.js MaterialCreator satisfies it. */
export interface MtlMaterials {
  preload(): void;
}

/**
 * The minimal MTLLoader contract ModelMobject needs. Three.js MTLLoader
 * satisfies it structurally. Tests implement it with a stub.
 */
export interface MtlLoader {
  setPath(path: string): MtlLoader;
  setResourcePath(path: string): MtlLoader;
  loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<MtlMaterials>;
}

/**
 * The OBJLoader subset that accepts materials. OBJLoader.setMaterials applies
 * the given materials to the meshes it then parses.
 */
export interface ObjMaterialSink {
  setMaterials(materials: MtlMaterials): void;
}

/** Builds an MTLLoader. The DI seam set by `setMtlLoaderFactory`. */
export type MtlLoaderFactory = () => MtlLoader | Promise<MtlLoader>;

/** The options that drive OBJ material loading. A subset of ModelMobjectOptions. */
export interface ObjMaterialOptions {
  /** Explicit companion .mtl URL. Takes priority over `loadMaterials`. */
  mtlUrl?: string;
  /** Auto-derive the .mtl URL from the .obj URL and load it. Default: false. */
  loadMaterials?: boolean;
  /** Inject an MTLLoader directly (bypasses the factory and the network). */
  mtlLoader?: MtlLoader;
  /** Progress callback forwarded to the MTLLoader. */
  onProgress?: (event: ProgressEvent) => void;
}

/** Injected MTLLoader factory. When set, the lazy default import is skipped. */
let mtlLoaderFactoryOverride: MtlLoaderFactory | null = null;

/**
 * Inject an MTLLoader factory, replacing the lazy-loaded Three.js MTLLoader.
 * Pass `null` to restore the default. Tests use this to avoid any real loader.
 */
export function setMtlLoaderFactory(factory: MtlLoaderFactory | null): void {
  mtlLoaderFactoryOverride = factory;
}

/** Dynamically load the Three.js MTLLoader. The specifier is a literal. */
async function defaultMtlLoaderFactory(): Promise<MtlLoader> {
  const { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js');
  return new MTLLoader() as unknown as MtlLoader;
}

/** Resolve the MTLLoader, honoring the injected loader / factory. */
async function resolveMtlLoader(injected?: MtlLoader): Promise<MtlLoader> {
  if (injected) return injected;
  if (mtlLoaderFactoryOverride) return mtlLoaderFactoryOverride();
  return defaultMtlLoaderFactory();
}

/** The directory part of a URL, with its trailing slash; ignores query and fragment. */
export function deriveBasePath(url: string): string {
  const path = url.split(/[?#]/)[0];
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.slice(0, slash + 1) : '';
}

/** The last path segment (file name) of a URL; ignores query and fragment. */
function fileName(url: string): string {
  const path = url.split(/[?#]/)[0];
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.slice(slash + 1) : path;
}

/** The companion .mtl URL for an .obj URL (same name, .mtl extension). */
export function deriveMtlUrl(objUrl: string): string {
  const path = objUrl.split(/[?#]/)[0];
  return path.replace(/\.obj$/i, '.mtl');
}

/** Pick the .mtl URL to load: explicit `mtlUrl`, else derived, else none. */
function resolveMtlUrl(objUrl: string, options: ObjMaterialOptions): string | null {
  if (options.mtlUrl) return options.mtlUrl;
  if (options.loadMaterials) return deriveMtlUrl(objUrl);
  return null;
}

/** Narrow a ModelLoader to one that can accept MTL materials. */
function acceptsMaterials(loader: ModelLoader): loader is ModelLoader & ObjMaterialSink {
  return typeof (loader as Partial<ObjMaterialSink>).setMaterials === 'function';
}

/**
 * Load the companion .mtl and hand its materials to the OBJ loader before it
 * parses. Call this on the resolved OBJ loader before `loadAsync`.
 *
 * It is a no-op when neither `mtlUrl` nor `loadMaterials` is set (so an OBJ
 * loads exactly as before), and when the loader cannot accept materials. The
 * MTLLoader base path and resource path come from the .mtl URL, so texture maps
 * named in the .mtl load from the same directory.
 */
export async function applyObjMaterials(
  loader: ModelLoader,
  objUrl: string,
  options: ObjMaterialOptions,
): Promise<void> {
  const mtlUrl = resolveMtlUrl(objUrl, options);
  if (!mtlUrl) return;
  if (!acceptsMaterials(loader)) return;
  const mtlLoader = await resolveMtlLoader(options.mtlLoader);
  const basePath = deriveBasePath(mtlUrl);
  mtlLoader.setPath(basePath);
  mtlLoader.setResourcePath(basePath);
  const materials = await mtlLoader.loadAsync(fileName(mtlUrl), options.onProgress);
  materials.preload();
  loader.setMaterials(materials);
}

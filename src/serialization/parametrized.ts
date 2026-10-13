/**
 * Props/schema parametrized scenes with data-at-render (Remotion-style).
 *
 * A parametrized scene is a reusable scene recipe: a typed props object with
 * defaults, an optional async `calculateMetadata` hook that may fetch data and
 * override the render size/fps/duration BEFORE the scene is built, and a
 * `build` function that assembles the scene from the resolved props and the
 * fetched data. One definition renders many prop sets, so a single scene drives
 * data-driven batch generation (the same scene, many inputs).
 *
 * This mirrors Remotion's parameterized rendering
 * (https://www.remotion.dev/docs/parameterized-rendering): typed input props
 * plus a metadata hook that runs before render. manim-web already had URL-state
 * permalinks ({@link ./urlState}); this adds the typed input-props contract and
 * the pre-render data hook on top of it, and reuses the URL codec so a
 * parametrized scene stays shareable.
 *
 * The props validator is a small, dependency-free coercer: it reads each input
 * prop against the type of the matching default and coerces or falls back, so a
 * definition never needs a heavy schema dependency.
 */

import { Scene, type SceneOptions } from '../core/Scene';
import { readVec3, isRecord } from './props';
import { encodeStateToHash, writeStateToUrl, readStateFromUrl } from './urlState';
import type { Vec3 } from './types';

/** A JSON-safe props bag. Each definition owns the shape of its own props. */
export type PropsRecord = Record<string, unknown>;

/** The runtime type tag a prop is validated and coerced against. */
export type PropTypeTag = 'number' | 'string' | 'boolean' | 'vec3' | 'array' | 'object';

/**
 * Optional explicit schema: a type tag per prop key. When omitted, the tag of
 * each prop is inferred from the type of its default value.
 */
export type PropsSchema<P extends object> = Partial<Record<keyof P, PropTypeTag>>;

/**
 * Fetches render-time data. The default implementation calls the global
 * `fetch` and returns parsed JSON; tests inject a stub so they never touch the
 * network. This is the dependency-injection seam for {@link renderParametrized}.
 */
export type DataFetcher = (url: string, init?: RequestInit) => Promise<unknown>;

/** Scene config a {@link CalculateMetadata} hook may override before render. */
export interface SceneMetadata {
  /** Clip duration in seconds, for downstream export. Carried through as-is. */
  duration?: number;
  /** Render width in pixels. */
  width?: number;
  /** Render height in pixels. */
  height?: number;
  /** Target frame rate in fps. */
  fps?: number;
}

/** Context passed to {@link CalculateMetadata}: resolved props and the fetcher. */
export interface MetadataContext<P extends object> {
  /** The props resolved from defaults + input (input wins). */
  props: P;
  /** The injected data fetcher (see {@link DataFetcher}). */
  fetch: DataFetcher;
}

/**
 * What {@link CalculateMetadata} returns: optional scene-config overrides, an
 * optional patch of props (which wins over the input props), and the fetched
 * `data` that reaches {@link SceneBuilder}.
 */
export interface CalculateMetadataResult<P extends object, D> extends SceneMetadata {
  /** Props to override after the fetch (e.g. values computed from the data). */
  props?: Partial<P>;
  /** Data to pass to the build step. */
  data?: D;
}

/** The async pre-render hook. Runs once, before the scene is built. */
export type CalculateMetadata<P extends object, D> = (
  context: MetadataContext<P>,
) => CalculateMetadataResult<P, D> | Promise<CalculateMetadataResult<P, D>>;

/** Builds the scene from the resolved props and the fetched data. */
export type SceneBuilder<P extends object, D> = (
  scene: Scene,
  props: P,
  data: D | undefined,
) => void | Promise<void>;

/** A parametrized scene definition. See {@link defineParametrizedScene}. */
export interface ParametrizedSceneDefinition<P extends object, D = unknown> {
  /** Optional stable id for logging or registry use. */
  id?: string;
  /** The default props. Also the source of the inferred prop schema. */
  defaultProps: P;
  /** Optional explicit per-prop type tags; inferred from defaults when absent. */
  schema?: PropsSchema<P>;
  /** Optional async hook that fetches data and overrides scene config. */
  calculateMetadata?: CalculateMetadata<P, D>;
  /** Builds the scene from resolved props + data. */
  build: SceneBuilder<P, D>;
}

/** The resolved render metadata reported by {@link renderParametrized}. */
export interface ResolvedMetadata {
  /** Duration in seconds, as returned by the metadata hook (may be undefined). */
  duration?: number;
  /** The scene's actual render width in pixels. */
  width: number;
  /** The scene's actual render height in pixels. */
  height: number;
  /** The scene's actual target fps. */
  fps: number;
}

/** The result of {@link renderParametrized}. */
export interface ParametrizedRenderResult<P extends object, D> {
  /** The built scene. */
  scene: Scene;
  /** The fully resolved props (defaults + input + metadata patch). */
  props: P;
  /** The data returned by the metadata hook, or undefined. */
  data: D | undefined;
  /** The resolved render metadata. */
  metadata: ResolvedMetadata;
  /** A shareable, URL-safe hash of the resolved props (reuses the URL codec). */
  url: string;
}

/** Options for {@link renderParametrized}. */
export interface RenderParametrizedOptions {
  /** Build into this scene instead of a fresh headless one. */
  scene?: Scene;
  /** Scene options for the created scene when `scene` is not supplied. */
  sceneOptions?: SceneOptions;
  /** Injected data fetcher. Defaults to the global `fetch` + JSON parse. */
  fetch?: DataFetcher;
  /** Write the resolved props to the URL hash (no-op headless). Default false. */
  writeUrl?: boolean;
  /** Use `history.replaceState` when writing the URL. Default true. */
  urlReplace?: boolean;
}

/** True when `value` is a 3-element array of finite numbers. */
function isVec3Like(value: unknown): value is Vec3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

/** Infer the type tag of a default value, or `null` when it is unknown. */
function inferTag(value: unknown): PropTypeTag | null {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (isVec3Like(value)) return 'vec3';
  if (Array.isArray(value)) return 'array';
  if (isRecord(value)) return 'object';
  return null;
}

/** Coerce `value` to `tag`, returning `fallback` when it cannot be coerced. */
function coerceValue(value: unknown, tag: PropTypeTag, fallback: unknown): unknown {
  switch (tag) {
    case 'number': {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      if (typeof value === 'boolean') return value ? 1 : 0;
      return fallback;
    }
    case 'string': {
      if (typeof value === 'string') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      if (typeof value === 'boolean') return String(value);
      return fallback;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (typeof value === 'number' && Number.isFinite(value)) return value !== 0;
      return fallback;
    }
    case 'vec3':
      return readVec3(value, isVec3Like(fallback) ? fallback : [0, 0, 0]);
    case 'array':
      return Array.isArray(value) ? value : fallback;
    case 'object':
      return isRecord(value) ? value : fallback;
  }
}

/** Resolve one input value for `key` against its default and schema tag. */
function resolveOne<P extends object, D>(
  def: ParametrizedSceneDefinition<P, D>,
  key: string,
  value: unknown,
): unknown {
  const fallback = (def.defaultProps as PropsRecord)[key];
  const tag = def.schema?.[key as keyof P] ?? inferTag(fallback);
  if (tag === null) return value === undefined ? fallback : value;
  return coerceValue(value, tag, fallback);
}

/** Merge a patch of input props over `base`, coercing each known key. */
function mergeProps<P extends object, D>(
  def: ParametrizedSceneDefinition<P, D>,
  base: P,
  patch: PropsRecord | undefined,
): P {
  const result: PropsRecord = { ...(base as PropsRecord) };
  if (patch) {
    for (const key of Object.keys(patch)) {
      if (Object.prototype.hasOwnProperty.call(def.defaultProps, key)) {
        result[key] = resolveOne(def, key, patch[key]);
      }
    }
  }
  return result as unknown as P;
}

/**
 * Define a parametrized scene. This is a typed identity helper: it infers the
 * props and data generics from the definition and returns it unchanged.
 *
 * @param definition - The scene definition (defaults, optional schema, optional
 *   metadata hook, build function).
 * @returns The same definition, typed.
 *
 * @example
 * ```ts
 * const bar = defineParametrizedScene({
 *   defaultProps: { label: 'A', value: 1, color: '#58C4DD' },
 *   calculateMetadata: async ({ props, fetch }) => {
 *     const data = await fetch(`/api/series/${props.label}`);
 *     return { data, duration: 3, width: 1920, height: 1080, fps: 60 };
 *   },
 *   build: (scene, props, data) => {
 *     // ...assemble the scene from props + data
 *   },
 * });
 * ```
 */
export function defineParametrizedScene<P extends object, D = unknown>(
  definition: ParametrizedSceneDefinition<P, D>,
): ParametrizedSceneDefinition<P, D> {
  return definition;
}

/**
 * Resolve the effective props for a definition: a clone of the defaults with
 * the input props merged over them (input wins). Each input value is coerced to
 * the type of its default; an uncoercible or unknown key falls back to the
 * default. Reused by {@link renderParametrized} and {@link propsFromUrl}.
 *
 * @param definition - The parametrized scene definition.
 * @param inputProps - Partial input props (unknown keys are ignored).
 * @returns The fully resolved props.
 */
export function resolveProps<P extends object, D>(
  definition: ParametrizedSceneDefinition<P, D>,
  inputProps?: PropsRecord,
): P {
  return mergeProps(definition, { ...definition.defaultProps }, inputProps);
}

/** Read props from the current URL hash and resolve them against the defaults. */
export function propsFromUrl<P extends object, D>(
  definition: ParametrizedSceneDefinition<P, D>,
): P {
  const state = readStateFromUrl();
  const patch = isRecord(state) ? state : undefined;
  return resolveProps(definition, patch);
}

/** The default fetcher: global `fetch` + JSON parse. Throws when unavailable. */
const defaultFetcher: DataFetcher = async (url, init) => {
  if (typeof fetch !== 'function') {
    throw new Error(
      'renderParametrized: no global fetch available. Pass options.fetch to inject one.',
    );
  }
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`renderParametrized: fetch failed for ${url} (status ${response.status})`);
  }
  return response.json();
};

/** Apply the metadata size/fps overrides to a scene, in place. */
function applyMetadataToScene(scene: Scene, metadata: SceneMetadata): void {
  const width = metadata.width ?? scene.renderer.width;
  const height = metadata.height ?? scene.renderer.height;
  if (width !== scene.renderer.width || height !== scene.renderer.height) {
    scene.resize(width, height);
  }
  if (typeof metadata.fps === 'number' && Number.isFinite(metadata.fps)) {
    scene.setTargetFps(metadata.fps);
  }
}

/**
 * Render a parametrized scene: merge input props over defaults (input wins),
 * run `calculateMetadata` (which may fetch data and override size/fps/duration),
 * apply the metadata to the scene, build the scene, and expose the resolved
 * props as a shareable URL hash.
 *
 * Headless-safe: with no `scene` and no DOM it builds a headless scene and the
 * URL write is a no-op. The data fetch goes through the injectable
 * {@link DataFetcher} seam, so tests never touch the network.
 *
 * @param definition - The parametrized scene definition.
 * @param inputProps - Partial input props (merged over the defaults).
 * @param options - Scene, fetcher and URL-write options.
 * @returns The built scene, resolved props, data, metadata and shareable URL.
 */
export async function renderParametrized<P extends object, D = unknown>(
  definition: ParametrizedSceneDefinition<P, D>,
  inputProps?: PropsRecord,
  options: RenderParametrizedOptions = {},
): Promise<ParametrizedRenderResult<P, D>> {
  const fetcher = options.fetch ?? defaultFetcher;

  let props = resolveProps(definition, inputProps);
  let data: D | undefined;
  let metadata: SceneMetadata = {};

  if (definition.calculateMetadata) {
    const result = await definition.calculateMetadata({ props, fetch: fetcher });
    data = result.data;
    metadata = {
      duration: result.duration,
      width: result.width,
      height: result.height,
      fps: result.fps,
    };
    if (result.props) props = mergeProps(definition, props, result.props);
  }

  let scene = options.scene;
  if (!scene) {
    scene = Scene.createHeadless({
      ...options.sceneOptions,
      ...(metadata.width !== undefined ? { width: metadata.width } : {}),
      ...(metadata.height !== undefined ? { height: metadata.height } : {}),
      ...(metadata.fps !== undefined ? { targetFps: metadata.fps } : {}),
    });
  }
  applyMetadataToScene(scene, metadata);

  const url = encodeStateToHash(props);
  if (options.writeUrl) writeStateToUrl(props, { replace: options.urlReplace ?? true });

  await definition.build(scene, props, data);

  return {
    scene,
    props,
    data,
    metadata: {
      duration: metadata.duration,
      width: scene.renderer.width,
      height: scene.renderer.height,
      fps: scene.getTargetFps(),
    },
    url,
  };
}

/**
 * Toon shading options, presets, and the code that applies them to a Three.js
 * subtree.
 *
 * Two presets:
 * - `'manim'` (the default): the manim look carried into 3D. A smooth body a
 *   bit darker than the mobject colour, a soft highlight, and a bright rim
 *   stroke in a lighter shade of the mobject colour, for a dark background.
 * - `'cartoon'`: a flat illustration on a white page. Hard tone bands, a crisp
 *   highlight blob, and a dark ink outline in a darker shade of the colour.
 *
 * `Mobject3D.setToonShading()` stores the resolved options and calls
 * {@link applyToonToObject} after each sync. {@link applyToonShading} applies
 * the look to a whole mobject tree or to every mobject of a scene.
 */

import * as THREE from 'three';
import type { Mobject } from '../../core/Mobject';
import { patchToonMaterial, unpatchToonMaterial } from './toonMaterial';
import { attachOutline, detachOutline, type ToonOutlineColorMode } from './toonOutline';

export type { ToonOutlineColorMode } from './toonOutline';

/** Name of a built-in look. */
export type ToonPreset = 'manim' | 'cartoon';

/** Options for the specular highlight. */
export interface ToonHighlightOptions {
  /** Highlight colour. Default: the mobject colour mixed 60 % toward white. */
  color?: string;
  /** Relative size. 1 is a small blob, 3 is a large one. */
  size?: number;
  /** Strength from 0 (none) to 1 (solid). */
  intensity?: number;
  /** Edge softness from 0 (crisp blob) to 1 (soft gloss). */
  softness?: number;
}

/** Options for the outline (the rim stroke). */
export interface ToonOutlineOptions {
  /**
   * Colour mode: `'darker'` (dark ink), `'lighter'` (bright stroke), `'same'`
   * (the mobject colour) or `'color'` (the `color` option). Default: `'color'`
   * when `color` is set, else the preset mode.
   */
  mode?: ToonOutlineColorMode;
  /** Explicit outline colour (CSS colour). Sets the mode to `'color'` when `mode` is not given. */
  color?: string;
  /** Width of the rim in CSS pixels. */
  width?: number;
  /**
   * Opacity of the outline when the body is at rest. The outline fades with
   * the body: see `Mobject3D.setToonShading`.
   */
  opacity?: number;
}

/** Options for {@link applyToonShading} and `Mobject3D.setToonShading()`. */
export interface ToonShadingOptions {
  /** Base look. Every other option overrides one part of it. Default: `'manim'`. */
  preset?: ToonPreset;
  /** Number of tone bands, from 2 to 5. */
  steps?: number;
  /**
   * Where the tone bands split, from 0 to 1, as a wrapped-light level. Higher
   * puts more of the surface in shadow. Default: 0.5 (manim), 0.62 (cartoon).
   */
  threshold?: number;
  /** 0 gives hard flat bands; 1 gives a smooth gradient between the darkest and the lit tone. */
  softness?: number;
  /** Factor on the mobject colour for the lit tone. 1 is the exact colour. */
  brightness?: number;
  /** Colour of the darkest tone. Default: a darker shade of the mobject colour. */
  shadowColor?: string;
  /** How dark the derived shadow tone is, from 0 (none) to 1 (strong). */
  shadowStrength?: number;
  /**
   * Light direction source. `'view'` (default): one key light fixed to the
   * camera, upper left, so the look does not change when the camera orbits.
   * `'scene'`: the scene's directional, point and spot lights.
   */
  light?: 'view' | 'scene';
  /** Highlight. `false` turns it off. */
  highlight?: boolean | ToonHighlightOptions;
  /** Outline. `false` turns it off. */
  outline?: false | ToonOutlineOptions;
}

/** Fully resolved toon settings. */
export interface ResolvedToonShading {
  steps: number;
  threshold: number;
  softness: number;
  brightness: number;
  shadowColor: string | null;
  shadowStrength: number;
  light: 'view' | 'scene';
  highlight: { color: string | null; size: number; intensity: number; softness: number } | null;
  outline: {
    mode: ToonOutlineColorMode;
    color: string | null;
    width: number;
    opacity: number;
  } | null;
}

/** Default outline width in CSS pixels. */
export const DEFAULT_TOON_OUTLINE_WIDTH = 2;

const PRESETS: Record<ToonPreset, ResolvedToonShading> = {
  manim: {
    steps: 2,
    threshold: 0.5,
    softness: 1,
    brightness: 0.85,
    shadowColor: null,
    shadowStrength: 0.65,
    light: 'view',
    highlight: { color: null, size: 2, intensity: 0.35, softness: 1 },
    outline: { mode: 'lighter', color: null, width: DEFAULT_TOON_OUTLINE_WIDTH, opacity: 1 },
  },
  cartoon: {
    steps: 2,
    threshold: 0.62,
    softness: 0,
    brightness: 1,
    shadowColor: null,
    shadowStrength: 1,
    light: 'view',
    highlight: { color: null, size: 1, intensity: 1, softness: 0 },
    outline: { mode: 'darker', color: null, width: DEFAULT_TOON_OUTLINE_WIDTH, opacity: 1 },
  },
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

function resolveHighlight(
  option: boolean | ToonHighlightOptions | undefined,
  base: ResolvedToonShading['highlight'],
): ResolvedToonShading['highlight'] {
  if (option === false) return null;
  const fallback = base ?? PRESETS.manim.highlight;
  if (option === undefined || option === true) return fallback ? { ...fallback } : null;
  const b = fallback ?? { color: null, size: 1, intensity: 1, softness: 0 };
  return {
    color: option.color ?? b.color,
    size: Math.max(0, option.size ?? b.size),
    intensity: clamp01(option.intensity ?? b.intensity),
    softness: clamp01(option.softness ?? b.softness),
  };
}

function resolveOutline(
  option: false | ToonOutlineOptions | undefined,
  base: ResolvedToonShading['outline'],
): ResolvedToonShading['outline'] {
  if (option === false) return null;
  const b = base ?? PRESETS.manim.outline;
  if (!b) return null;
  if (option === undefined) return { ...b };
  const color = option.color ?? null;
  return {
    mode: option.mode ?? (color !== null ? 'color' : b.mode),
    color: color ?? b.color,
    width: Math.max(0, option.width ?? b.width),
    opacity: clamp01(option.opacity ?? b.opacity),
  };
}

/**
 * Fill the defaults of a toon option object from its preset.
 *
 * @post 2 <= result.steps && result.steps <= 5
 * @post options.outline === false => result.outline === null
 * @post options.highlight === false => result.highlight === null
 * @post options.outline?.color !== undefined && options.outline?.mode === undefined =>
 *         result.outline.mode === 'color'
 */
export function resolveToonOptions(
  options: ToonShadingOptions | ToonPreset = {},
): ResolvedToonShading {
  const opts: ToonShadingOptions = typeof options === 'string' ? { preset: options } : options;
  const base = PRESETS[opts.preset ?? 'manim'];
  return {
    steps: Math.min(5, Math.max(2, Math.round(opts.steps ?? base.steps))),
    threshold: clamp01(opts.threshold ?? base.threshold),
    softness: clamp01(opts.softness ?? base.softness),
    brightness: Math.max(0, opts.brightness ?? base.brightness),
    shadowColor: opts.shadowColor ?? base.shadowColor,
    shadowStrength: clamp01(opts.shadowStrength ?? base.shadowStrength),
    light: opts.light ?? base.light,
    highlight: resolveHighlight(opts.highlight, base.highlight),
    outline: resolveOutline(opts.outline, base.outline),
  };
}

function materialsOf(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

/** Write resolved settings into the uniforms of a material. */
function applyToonUniforms(material: THREE.Material, toon: ResolvedToonShading): void {
  const uniforms = patchToonMaterial(material);
  if (!uniforms) return;
  uniforms.uToonSteps.value = toon.steps;
  uniforms.uToonThreshold.value = toon.threshold;
  uniforms.uToonSoftness.value = toon.softness;
  uniforms.uToonBrightness.value = toon.brightness;
  uniforms.uToonShadowStrength.value = toon.shadowStrength;
  uniforms.uToonSceneLights.value = toon.light === 'scene' ? 1 : 0;
  uniforms.uToonHasShadowColor.value = toon.shadowColor === null ? 0 : 1;
  if (toon.shadowColor !== null) uniforms.uToonShadowColor.value.set(toon.shadowColor);
  const hi = toon.highlight;
  uniforms.uToonHighlightIntensity.value = hi ? hi.intensity : 0;
  uniforms.uToonHighlightSize.value = hi ? hi.size : 1;
  uniforms.uToonHighlightSoftness.value = hi ? hi.softness : 0;
  uniforms.uToonHasHighlightColor.value = hi && hi.color !== null ? 1 : 0;
  if (hi && hi.color !== null) uniforms.uToonHighlightColor.value.set(hi.color);
}

/** Whether a mesh is a helper this module or another pass owns. */
function isHelperMesh(mesh: THREE.Mesh): boolean {
  if (mesh.userData.toonOutline) return true;
  return materialsOf(mesh).some((m) => m.userData.depthPrepass === true || !m.colorWrite);
}

/**
 * Visit every mesh under `root`, but do not enter the subtrees in `skip`.
 * `skip` holds the Three.js objects of child mobjects: each child mobject
 * applies its own settings.
 */
export function forEachOwnMesh(
  root: THREE.Object3D,
  skip: ReadonlySet<THREE.Object3D>,
  fn: (mesh: THREE.Mesh) => void,
): void {
  const stack: THREE.Object3D[] = [root];
  while (stack.length > 0) {
    const node = stack.pop() as THREE.Object3D;
    if (node !== root && skip.has(node)) continue;
    if (node instanceof THREE.Mesh && !isHelperMesh(node)) fn(node);
    for (const child of node.children) stack.push(child);
  }
}

/**
 * Apply toon settings (or remove them, for `null`) to every mesh under `root`.
 * Idempotent: a repeat call with the same settings changes nothing visible.
 *
 * @param root - The Three.js object of one mobject.
 * @param toon - Resolved settings, or null to remove the look.
 * @param outlineOpacity - Read on every frame for the outline opacity.
 * @param skip - Three.js objects of child mobjects; their subtrees stay as they are.
 */
export function applyToonToObject(
  root: THREE.Object3D,
  toon: ResolvedToonShading | null,
  outlineOpacity: () => number = () => 1,
  skip: ReadonlySet<THREE.Object3D> = new Set(),
): void {
  forEachOwnMesh(root, skip, (mesh) => {
    for (const material of materialsOf(mesh)) {
      if (toon) applyToonUniforms(material, toon);
      else unpatchToonMaterial(material);
    }
    const outline = toon?.outline;
    if (outline && outline.width > 0) {
      attachOutline(mesh, {
        mode: outline.mode,
        color: outline.color,
        width: outline.width,
        opacity: outlineOpacity,
      });
    } else {
      detachOutline(mesh);
    }
  });
}

/** A mobject that supports toon shading (every `Mobject3D`). */
interface ToonCapable {
  setToonShading(options?: ToonShadingOptions | ToonPreset | false): unknown;
}

function isToonCapable(mobject: Mobject): mobject is Mobject & ToonCapable {
  return typeof (mobject as Partial<ToonCapable>).setToonShading === 'function';
}

/** Any target of {@link applyToonShading}. */
export type ToonShadingTarget =
  Mobject | Iterable<Mobject> | { readonly mobjects: Iterable<Mobject> };

function rootsOf(target: ToonShadingTarget): Iterable<Mobject> {
  if (Symbol.iterator in target) return target;
  if ('getFamily' in target) return [target];
  return target.mobjects;
}

/**
 * Apply the toon look (or remove it, for `false`) to every 3D mesh mobject in
 * a tree. Use it for a `Group` of 3D mobjects, or pass a scene to style every
 * mobject the scene holds now. Mobjects added later need their own call.
 *
 * @param target - A mobject, a list of mobjects, or a scene (anything with `mobjects`).
 * @param options - A preset name, toon options, or `false` to turn the look off.
 * @returns The number of 3D mobjects that changed.
 *
 * @example
 * ```ts
 * const scene = new ThreeDScene(container);
 * scene.add(new Sphere({ color: BLUE, opacity: 0.5 }), new Torus({ color: TEAL }));
 * applyToonShading(scene);                    // manim look
 * applyToonShading(scene, 'cartoon');         // flat illustration, dark ink
 * ```
 */
export function applyToonShading(
  target: ToonShadingTarget,
  options: ToonShadingOptions | ToonPreset | false = {},
): number {
  const seen = new Set<Mobject>();
  for (const root of rootsOf(target)) {
    for (const member of root.getFamily()) {
      if (seen.has(member) || !isToonCapable(member)) continue;
      seen.add(member);
      member.setToonShading(options);
    }
  }
  return seen.size;
}

/**
 * Apply the manim preset to a tree or a scene. Short form of
 * `applyToonShading(target, { ...overrides, preset: 'manim' })`.
 */
export function applyManimStyle3D(
  target: ToonShadingTarget,
  overrides: Omit<ToonShadingOptions, 'preset'> = {},
): number {
  return applyToonShading(target, { ...overrides, preset: 'manim' });
}

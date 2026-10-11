/**
 * Per-mobject blend modes.
 *
 * Maps a small, Manim-friendly set of named blend modes to Three.js material
 * blending state. The default is `'normal'`, which equals three.js's own
 * default (`NormalBlending`), so a mobject that never sets a blend mode renders
 * exactly as before.
 *
 * `'screen'` has no built-in three.js constant, so it uses `CustomBlending`
 * with the standard screen equation `src + dst*(1 - src)`.
 */

import * as THREE from 'three';

/**
 * Named blend mode for a mobject's rendered material(s).
 *
 * - `normal`: default alpha blending (three.js `NormalBlending`).
 * - `additive`: add source to destination (`AdditiveBlending`); good for glow.
 * - `multiply`: multiply source and destination (`MultiplyBlending`).
 * - `subtractive`: subtract source from destination (`SubtractiveBlending`).
 * - `screen`: screen blend via `CustomBlending` (`src + dst*(1 - src)`).
 */
export type BlendMode = 'normal' | 'additive' | 'multiply' | 'subtractive' | 'screen';

/** Every supported blend mode name, in a stable order. */
export const BLEND_MODES: readonly BlendMode[] = [
  'normal',
  'additive',
  'multiply',
  'subtractive',
  'screen',
];

/** Map a blend mode to the three.js `Blending` constant it primarily uses. */
export function blendModeToThree(mode: BlendMode): THREE.Blending {
  switch (mode) {
    case 'additive':
      return THREE.AdditiveBlending;
    case 'multiply':
      return THREE.MultiplyBlending;
    case 'subtractive':
      return THREE.SubtractiveBlending;
    case 'screen':
      return THREE.CustomBlending;
    case 'normal':
    default:
      return THREE.NormalBlending;
  }
}

/**
 * Apply a blend mode to a single three.js material in place.
 *
 * The material version only bumps (`needsUpdate`) when the blending constant
 * actually changes, so re-applying the same mode is cheap and idempotent. For
 * `'screen'` the custom blend equation and factors are set explicitly.
 *
 * @param material - The material to configure.
 * @param mode - The blend mode to apply.
 */
export function applyBlendMode(material: THREE.Material, mode: BlendMode): void {
  const next = blendModeToThree(mode);
  const changed = material.blending !== next;
  material.blending = next;

  if (mode === 'screen') {
    // Screen: result = src + dst*(1 - src). CustomBlending lets us express it.
    material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.OneFactor;
    material.blendDst = THREE.OneMinusSrcColorFactor;
  }

  if (changed) {
    material.needsUpdate = true;
  }
}

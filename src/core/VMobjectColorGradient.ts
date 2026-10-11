/**
 * Pure color-gradient helper for VMobject.setColorByGradient.
 *
 * Interpolates a list of reference colors into `count` evenly spaced colors,
 * porting Manim CE's `color_gradient`. Colors are parsed and interpolated in
 * RGB via THREE.Color and returned as `#rrggbb` hex strings.
 */

import * as THREE from 'three';

/**
 * Produce `count` colors evenly interpolated across the reference colors.
 *
 * Positions are `linspace(0, K-1, count)` over the K reference colors; each
 * output blends the two bracketing references. Matches Manim CE semantics,
 * including the fix for the final element.
 *
 * @param colors - Reference colors (any THREE-parsable string)
 * @param count - Number of output colors
 * @returns Array of `#rrggbb` strings (length `count`)
 */
export function colorGradient(colors: string[], count: number): string[] {
  if (count <= 0) return [];
  if (colors.length === 0) return [];
  if (colors.length === 1 || count === 1) {
    const c = new THREE.Color(colors[0]);
    return Array.from({ length: count }, () => `#${c.getHexString()}`);
  }

  const rgbs = colors.map((c) => new THREE.Color(c));
  const k = rgbs.length;
  const out: string[] = [];
  const scratch = new THREE.Color();

  for (let j = 0; j < count; j++) {
    const alpha = (j * (k - 1)) / (count - 1);
    let floor = Math.floor(alpha);
    let frac = alpha - floor;
    // CE's fix for the last element: keep the index in range.
    if (floor === k - 1) {
      floor = k - 2;
      frac = 1;
    }
    scratch.copy(rgbs[floor]).lerp(rgbs[floor + 1], frac);
    out.push(`#${scratch.getHexString()}`);
  }
  return out;
}

/**
 * Element radius tables for 3D molecule and drug-binding visualization.
 *
 * Two radii per element, both in angstrom: a covalent radius (used to size and
 * connect bonded atoms) and a van der Waals radius (used for space-filling /
 * surface models). The covalent values follow Cordero et al. (2008); the van
 * der Waals values follow Bondi (1964) with common extensions for the metals.
 *
 * The lookup mirrors cpkColors.ts: a canonical-case table, per-element
 * overrides, then a default fallback.
 */

import { normalizeElement } from '../chemistry/cpkColors';

/** Fallback covalent radius (angstrom) for an element not in the table. */
export const DEFAULT_COVALENT_RADIUS = 0.75;

/** Fallback van der Waals radius (angstrom) for an element not in the table. */
export const DEFAULT_VDW_RADIUS = 1.7;

/**
 * Covalent radius per element symbol, in angstrom.
 *
 * Covers the common bio / drug elements (H C N O P S F Cl Br I) plus a few
 * metals (Na K Mg Ca Zn Fe).
 */
export const COVALENT_RADII: Readonly<Record<string, number>> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  P: 1.07,
  S: 1.05,
  F: 0.57,
  Cl: 1.02,
  Br: 1.2,
  I: 1.39,
  Na: 1.66,
  K: 2.03,
  Mg: 1.41,
  Ca: 1.76,
  Zn: 1.22,
  Fe: 1.32,
};

/**
 * Van der Waals radius per element symbol, in angstrom.
 *
 * Covers the same elements as {@link COVALENT_RADII}.
 */
export const VDW_RADII: Readonly<Record<string, number>> = {
  H: 1.2,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  P: 1.8,
  S: 1.8,
  F: 1.47,
  Cl: 1.75,
  Br: 1.85,
  I: 1.98,
  Na: 2.27,
  K: 2.75,
  Mg: 1.73,
  Ca: 2.31,
  Zn: 1.39,
  Fe: 2.05,
};

/**
 * Resolve a radius from a table.
 *
 * The lookup order is caller overrides, then the table, then the default. An
 * override is matched first on the canonical symbol, then on the raw input.
 * @param element - The element symbol (any case).
 * @param table - The radius table to read.
 * @param fallback - The default radius.
 * @param overrides - Optional per-element radius overrides.
 * @returns The radius in angstrom.
 */
function resolveRadius(
  element: string,
  table: Readonly<Record<string, number>>,
  fallback: number,
  overrides?: Record<string, number>,
): number {
  const symbol = normalizeElement(element);
  if (overrides) {
    if (overrides[symbol] !== undefined) {
      return overrides[symbol];
    }
    if (overrides[element] !== undefined) {
      return overrides[element];
    }
  }
  return table[symbol] ?? fallback;
}

/**
 * Resolve the covalent radius for an element.
 * @param element - The element symbol (any case).
 * @param overrides - Optional per-element radius overrides.
 * @returns The covalent radius in angstrom.
 */
export function covalentRadius(element: string, overrides?: Record<string, number>): number {
  return resolveRadius(element, COVALENT_RADII, DEFAULT_COVALENT_RADIUS, overrides);
}

/**
 * Resolve the van der Waals radius for an element.
 * @param element - The element symbol (any case).
 * @param overrides - Optional per-element radius overrides.
 * @returns The van der Waals radius in angstrom.
 */
export function vdwRadius(element: string, overrides?: Record<string, number>): number {
  return resolveRadius(element, VDW_RADII, DEFAULT_VDW_RADIUS, overrides);
}

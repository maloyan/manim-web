/**
 * Color palettes for the biology mobjects.
 *
 * The DNA base palette gives each of the four bases a distinct teaching color,
 * in the style of the chemistry CPK palette. The organelle and residue
 * palettes name common cell parts and amino acids. Every lookup takes optional
 * caller overrides, which win over the palette.
 */

import type { BaseSymbol } from './biologyTypes';

/** Fallback color for an organelle or residue not in a palette. */
export const DEFAULT_BIOLOGY_COLOR = '#B0BEC5';

/** Teaching color for each DNA base. */
export const DNA_BASE_COLORS: Readonly<Record<BaseSymbol, string>> = {
  A: '#4CAF50',
  T: '#F44336',
  G: '#2196F3',
  C: '#FFC107',
};

/** Watson-Crick complement of each base: A-T and G-C. */
export const BASE_COMPLEMENT: Readonly<Record<BaseSymbol, BaseSymbol>> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G',
};

/**
 * Default color for common organelles, keyed by lowercase name.
 *
 * Both British and American spellings of mitochondria are included, and a few
 * short aliases (golgi) resolve to the full name's color.
 */
export const ORGANELLE_COLORS: Readonly<Record<string, string>> = {
  nucleus: '#7E57C2',
  nucleolus: '#5E35B1',
  mitochondrion: '#E8654A',
  mitochondria: '#E8654A',
  ribosome: '#9A7B6A',
  'golgi apparatus': '#2B9E8F',
  golgi: '#2B9E8F',
  'endoplasmic reticulum': '#E3A03B',
  lysosome: '#D6568F',
  vacuole: '#5BA8D6',
  chloroplast: '#5FB07A',
  centrosome: '#E0B03A',
  peroxisome: '#9A68C4',
};

/**
 * Normalize a base symbol to its uppercase letter.
 * @param base - The raw base symbol (any case).
 * @returns The uppercase base symbol.
 */
export function normalizeBase(base: string): BaseSymbol {
  return base.trim().toUpperCase() as BaseSymbol;
}

/**
 * Resolve the color for a DNA base.
 *
 * The lookup order is caller overrides, then the base palette. An unknown base
 * falls back to the default color.
 * @param base - The base symbol (any case).
 * @param overrides - Optional per-base color overrides.
 * @returns The hex color string.
 */
export function baseColor(base: string, overrides?: Partial<Record<BaseSymbol, string>>): string {
  const symbol = normalizeBase(base);
  if (overrides && overrides[symbol] !== undefined) {
    return overrides[symbol];
  }
  return DNA_BASE_COLORS[symbol] ?? DEFAULT_BIOLOGY_COLOR;
}

/**
 * The Watson-Crick complement of a base.
 * @param base - The base symbol (any case).
 * @returns The complementary base, or the input symbol if it is unknown.
 */
export function complementOf(base: string): BaseSymbol {
  const symbol = normalizeBase(base);
  return BASE_COMPLEMENT[symbol] ?? symbol;
}

/**
 * Resolve the color for an organelle.
 *
 * The lookup order is caller overrides, then the organelle palette, both by
 * lowercase name. An unknown organelle falls back to the default color.
 * @param name - The organelle name.
 * @param overrides - Optional per-name color overrides.
 * @returns The hex color string.
 */
export function organelleColor(name: string, overrides?: Record<string, string>): string {
  const key = name.trim().toLowerCase();
  if (overrides) {
    if (overrides[name] !== undefined) {
      return overrides[name];
    }
    if (overrides[key] !== undefined) {
      return overrides[key];
    }
  }
  return ORGANELLE_COLORS[key] ?? DEFAULT_BIOLOGY_COLOR;
}

/**
 * Color for an amino acid residue by its one-letter code, keyed uppercase.
 *
 * The grouping follows the common side-chain chemistry convention: nonpolar,
 * polar, acidic and basic residues share a hue.
 */
export const RESIDUE_COLORS: Readonly<Record<string, string>> = {
  G: '#9E9E9E',
  A: '#9E9E9E',
  V: '#9E9E9E',
  L: '#9E9E9E',
  I: '#9E9E9E',
  M: '#9E9E9E',
  F: '#7E57C2',
  W: '#7E57C2',
  Y: '#7E57C2',
  P: '#BDBDBD',
  S: '#26A69A',
  T: '#26A69A',
  N: '#26A69A',
  Q: '#26A69A',
  C: '#FFC107',
  D: '#EF5350',
  E: '#EF5350',
  K: '#2196F3',
  R: '#2196F3',
  H: '#2196F3',
};

/**
 * Resolve the color for an amino acid residue.
 *
 * The lookup order is caller overrides (by exact code, then uppercase), then
 * the residue palette by uppercase first letter. An unknown residue falls back
 * to the default color.
 * @param code - The residue code or name.
 * @param overrides - Optional per-code color overrides.
 * @returns The hex color string.
 */
export function residueColor(code: string, overrides?: Record<string, string>): string {
  const trimmed = code.trim();
  if (overrides) {
    if (overrides[code] !== undefined) {
      return overrides[code];
    }
    if (overrides[trimmed.toUpperCase()] !== undefined) {
      return overrides[trimmed.toUpperCase()];
    }
  }
  const key = trimmed.charAt(0).toUpperCase();
  return RESIDUE_COLORS[key] ?? DEFAULT_BIOLOGY_COLOR;
}

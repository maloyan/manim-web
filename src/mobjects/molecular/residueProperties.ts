/**
 * Residue physico-chemical property scales for property-based protein coloring.
 *
 * Two built-in per-residue scales, plus the default color ramps that map them:
 *  - Kyte-Doolittle hydropathy. Positive is hydrophobic (ILE +4.5), negative is
 *    hydrophilic (ARG -4.5). Source: Kyte J, Doolittle RF, "A simple method for
 *    displaying the hydropathic character of a protein", J Mol Biol 1982;
 *    157(1):105-132.
 *  - Formal side-chain charge at physiological pH: ARG / LYS / HIS are basic
 *    (+1), ASP / GLU are acidic (-1), every other residue is neutral (0).
 *
 * The functions accept a 1-letter code or a 3-letter residue name, any case.
 * These helpers are reusable: a {@link Protein} colors its backbone with them,
 * and any per-residue coloring (for a Molecule3D or a MolecularSurface) can too.
 */

import { threeToOneLetter } from './residues';

/** Kyte-Doolittle hydropathy index, keyed by 1-letter residue code. */
export const KYTE_DOOLITTLE_HYDROPATHY: Readonly<Record<string, number>> = {
  I: 4.5,
  V: 4.2,
  L: 3.8,
  F: 2.8,
  C: 2.5,
  M: 1.9,
  A: 1.8,
  G: -0.4,
  T: -0.7,
  S: -0.8,
  W: -0.9,
  Y: -1.3,
  P: -1.6,
  H: -3.2,
  E: -3.5,
  Q: -3.5,
  D: -3.5,
  N: -3.5,
  K: -3.9,
  R: -4.5,
};

/** The most hydrophilic value on the Kyte-Doolittle scale (ARG). */
export const HYDROPATHY_MIN = -4.5;
/** The most hydrophobic value on the Kyte-Doolittle scale (ILE). */
export const HYDROPATHY_MAX = 4.5;

/** Default hydropathy ramp: hydrophilic blue to hydrophobic red. */
export const DEFAULT_HYDROPATHY_COLORS = ['#2166ac', '#f7f7f7', '#f4a582', '#b2182b'];
/** Default B-factor ramp: low / rigid blue to high / flexible red. */
export const DEFAULT_BFACTOR_COLORS = ['#3b4cc0', '#dddddd', '#b40426'];
/** Default charge colors: basic blue, acidic red, neutral grey. */
export const DEFAULT_CHARGE_COLORS: Readonly<Record<'positive' | 'negative' | 'neutral', string>> =
  {
    positive: '#2b6cb0',
    negative: '#c53030',
    neutral: '#cbd5e0',
  };

/**
 * Default diverging ramp for a continuous charge or electrostatic surface, low
 * to high: negative blue, neutral white, positive red. This is the convention
 * {@link MolecularSurface} uses for `colorBy: 'charge' | 'electrostatic'`.
 *
 * Note: this matches the task convention (red is positive). Some molecular
 * viewers (PyMOL, APBS) use the opposite hue for potential; pass a custom
 * `colorRamp` to flip it.
 */
export const DEFAULT_ELECTROSTATIC_COLORS = ['#2166ac', '#f7f7f7', '#b2182b'];

/** 1-letter residue codes that carry a positive side-chain charge. */
const POSITIVE_RESIDUES = new Set(['R', 'K', 'H']);
/** 1-letter residue codes that carry a negative side-chain charge. */
const NEGATIVE_RESIDUES = new Set(['D', 'E']);

/** Normalize a residue code or 3-letter name to its uppercase 1-letter code. */
function oneLetterCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  return trimmed.length > 1 ? threeToOneLetter(trimmed) : trimmed;
}

/**
 * The Kyte-Doolittle hydropathy of a residue.
 * @param code - The 1-letter code or 3-letter name, any case.
 * @returns The hydropathy index, or 0 for an unknown residue.
 */
export function residueHydropathy(code: string): number {
  return KYTE_DOOLITTLE_HYDROPATHY[oneLetterCode(code)] ?? 0;
}

/**
 * The formal side-chain charge of a residue at physiological pH.
 * @param code - The 1-letter code or 3-letter name, any case.
 * @returns +1 (basic), -1 (acidic) or 0 (neutral).
 */
export function residueCharge(code: string): -1 | 0 | 1 {
  const key = oneLetterCode(code);
  if (POSITIVE_RESIDUES.has(key)) {
    return 1;
  }
  if (NEGATIVE_RESIDUES.has(key)) {
    return -1;
  }
  return 0;
}

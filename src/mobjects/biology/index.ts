/**
 * Biology mobjects for manim-web.
 *
 * Molecular-biology structures: a DNA double helix with base-pair rungs, a 2D
 * cell diagram with a membrane, nucleus and labeled organelles, and an amino
 * acid bead chain. The base, organelle and residue color palettes mirror the
 * chemistry CPK palette.
 */

export { DNAHelix } from './DNAHelix';
export { Cell } from './Cell';
export { AminoAcidChain } from './AminoAcidChain';
export {
  baseColor,
  complementOf,
  normalizeBase,
  organelleColor,
  residueColor,
  DNA_BASE_COLORS,
  BASE_COMPLEMENT,
  ORGANELLE_COLORS,
  RESIDUE_COLORS,
  DEFAULT_BIOLOGY_COLOR,
} from './biologyColors';
export {
  type BaseSymbol,
  type CellShape,
  type DNAHelixOptions,
  type BasePairRender,
  type OrganelleSpec,
  type CellOptions,
  type OrganelleRender,
  type AminoAcidChainOptions,
  type ResidueRender,
  type StrandPair,
} from './biologyTypes';

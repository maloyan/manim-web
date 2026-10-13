/**
 * Molecular mobjects and data for manim-web.
 *
 * Prerequisite building blocks for a 3D molecule / drug-binding module: element
 * radius tables (covalent and van der Waals, in angstrom) with case-insensitive
 * lookup and per-element overrides.
 */

export {
  COVALENT_RADII,
  VDW_RADII,
  DEFAULT_COVALENT_RADIUS,
  DEFAULT_VDW_RADIUS,
  covalentRadius,
  vdwRadius,
} from './elementRadii';

export { Molecule3D } from './Molecule3D';
export type {
  Atom3DSpec,
  Bond3DSpec,
  MoleculeStyle,
  Molecule3DOptions,
  Atom3DRender,
  Bond3DRender,
} from './Molecule3D';

export { parsePdb } from './pdb';
export type { ParsedStructure, ResidueCA, SecondaryStructure, ParsePdbOptions } from './pdb';

export { threeToOneLetter, THREE_TO_ONE_LETTER, UNKNOWN_RESIDUE_CODE } from './residues';

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

export { selectAtoms, bindingSiteSelection, DEFAULT_BINDING_SITE_RADIUS } from './selection';
export type { AtomSelectionOptions } from './selection';

export { threeToOneLetter, THREE_TO_ONE_LETTER, UNKNOWN_RESIDUE_CODE } from './residues';

export { Protein } from './Protein';
export type { ProteinOptions, ProteinRepresentation, ProteinColorMode } from './Protein';

export { BindingPocket } from './BindingPocket';
export type { BindingPocketOptions, BindingPocketStyle } from './BindingPocket';

export { MolecularSurface } from './MolecularSurface';
export type { MolecularSurfaceOptions, MolecularSurfaceKind } from './MolecularSurface';

export { OrbitalSurface } from './OrbitalSurface';
export type { OrbitalSurfaceOptions, OrbitalType } from './OrbitalSurface';

export { hydrogenBond, contact, distanceLabel, residueLabel } from './annotations';
export type {
  DashedAnnotationOptions,
  HydrogenBondOptions,
  ContactOptions,
  DistanceLabelOptions,
  ResidueLabelOptions,
} from './annotations';

export { dockLigand } from './dock';
export type { DockLigandOptions } from './dock';

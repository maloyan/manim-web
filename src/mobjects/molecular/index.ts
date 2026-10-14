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

export { parsePdb, parsePdbTrajectory } from './pdb';
export type {
  ParsedStructure,
  ResidueCA,
  SecondaryStructure,
  ParsePdbOptions,
  PdbTrajectory,
} from './pdb';

export { fetchPdb, setPdbFetcher, pdbUrl } from './pdbFetch';
export type { PdbTextFetcher, PdbSource, FetchPdbOptions } from './pdbFetch';

export { selectAtoms, bindingSiteSelection, DEFAULT_BINDING_SITE_RADIUS } from './selection';
export type { AtomSelectionOptions } from './selection';

export { threeToOneLetter, THREE_TO_ONE_LETTER, UNKNOWN_RESIDUE_CODE } from './residues';

export { Protein } from './Protein';
export type { ProteinOptions, ProteinRepresentation, ProteinColorMode } from './Protein';

export {
  dihedralDegrees,
  computeRamachandran,
  pointInPolygon,
  regionFor,
  RAMACHANDRAN_REGIONS,
} from './ramachandran';
export type { RamachandranPoint, RamachandranRegion } from './ramachandran';

export { RamachandranPlot } from './RamachandranPlot';
export type { RamachandranPlotOptions, RamachandranColorBy } from './RamachandranPlot';

export { BindingPocket } from './BindingPocket';
export type { BindingPocketOptions, BindingPocketStyle } from './BindingPocket';

export { MolecularSurface } from './MolecularSurface';
export type {
  MolecularSurfaceOptions,
  MolecularSurfaceKind,
  SurfaceColorBy,
} from './MolecularSurface';

export { OrbitalSurface } from './OrbitalSurface';
export type { OrbitalSurfaceOptions, OrbitalType } from './OrbitalSurface';

export { DensitySurface } from './DensitySurface';
export type { DensitySurfaceOptions, DensityGrid } from './DensitySurface';

export { hydrogenBond, contact, distanceLabel, residueLabel } from './annotations';
export { detectInteractions, drawInteractions } from './interactions';
export type {
  Interaction,
  InteractionType,
  DetectInteractionsOptions,
  DrawInteractionsOptions,
} from './interactions';
export type {
  DashedAnnotationOptions,
  HydrogenBondOptions,
  ContactOptions,
  DistanceLabelOptions,
  ResidueLabelOptions,
} from './annotations';

export { dockLigand } from './dock';
export type { DockLigandOptions } from './dock';

export { morphMolecule, MorphMolecule, playTrajectory, MoleculeTrajectory } from './MorphMolecule';
export type { Conformation, MorphMoleculeOptions, PlayTrajectoryOptions } from './MorphMolecule';

export {
  residueHydropathy,
  residueCharge,
  KYTE_DOOLITTLE_HYDROPATHY,
  HYDROPATHY_MIN,
  HYDROPATHY_MAX,
  DEFAULT_HYDROPATHY_COLORS,
  DEFAULT_BFACTOR_COLORS,
  DEFAULT_CHARGE_COLORS,
  DEFAULT_ELECTROSTATIC_COLORS,
} from './residueProperties';

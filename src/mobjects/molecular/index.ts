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

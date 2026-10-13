/**
 * Shared types for the biology mobjects.
 *
 * The biology mobjects are the companion to the chemistry mobjects. A
 * {@link DNAHelix} is a double helix built from two parametric backbone
 * strands and a set of base-pair rungs. A {@link Cell} is a 2D cell diagram
 * built from a membrane, a nucleus and labeled organelle shapes. An
 * {@link AminoAcidChain} is a bead chain of residues joined by peptide bonds.
 *
 * Like the chemistry types, the layout is explicit and deterministic so the
 * structures are easy to test.
 */

import type { Vector3Tuple } from '../../core/Mobject';
import type { VMobject } from '../../core/VMobject';
import type { Text } from '../text/Text';
import type { Line } from '../geometry/Line';
import type { Circle } from '../geometry/Circle';
import type { ParametricFunction } from '../graphing/ParametricFunction';

/** A DNA base symbol. */
export type BaseSymbol = 'A' | 'T' | 'G' | 'C';

/** The shape of a cell membrane or organelle. */
export type CellShape = 'circle' | 'ellipse';

/** Options for a {@link DNAHelix}. */
export interface DNAHelixOptions {
  /** Number of full turns of the helix. Default: 3. */
  turns?: number;
  /** Radius of each backbone strand. Default: 0.5. */
  radius?: number;
  /** Vertical rise of the helix per turn. Default: 1. */
  pitch?: number;
  /** Number of base-pair rungs. Default: 12. */
  basePairs?: number;
  /** Draw the helix in 3D. Default: false (2D schematic, z = 0). */
  threeD?: boolean;
  /** Color each rung by its base. Default: true. */
  colorByBase?: boolean;
  /**
   * The base sequence of the first strand, from bottom to top. The second
   * strand is the complement. If absent or shorter than basePairs, the default
   * order A, T, G, C repeats.
   */
  sequence?: BaseSymbol[];
  /** The two backbone strand colors. Default: a blue and an orange. */
  backboneColors?: [string, string];
  /** Per-base color overrides, merged over the default base palette. */
  baseColors?: Partial<Record<BaseSymbol, string>>;
  /** Rung color used when colorByBase is false. Default: a light gray. */
  rungColor?: string;
  /** Stroke width of the strands and rungs. Default: 4. */
  strokeWidth?: number;
  /** Samples taken per turn for each strand curve. Default: 48. */
  numSamplesPerTurn?: number;
  /**
   * Fake 3D depth by dimming and thinning the rungs and nucleotides that sit at
   * the back of each turn. Default: true.
   */
  depthCue?: boolean;
  /**
   * Draw a nucleotide bead where each rung meets a backbone. Default: true in
   * 2D, false in 3D. The beads are flat discs, so in a rotating 3D view they
   * turn edge-on and read as stray ticks; 3D helices look cleaner without them.
   */
  showNucleotides?: boolean;
  /** Radius of each nucleotide bead. Default: 0.14 * radius. */
  nucleotideRadius?: number;
  /** Stroke width of the two backbone strands. Default: 1.4 * strokeWidth. */
  backboneStrokeWidth?: number;
  /** Stroke width of the base-pair rungs. Default: 0.95 * strokeWidth. */
  rungStrokeWidth?: number;
}

/** A resolved base pair of a {@link DNAHelix}. */
export interface BasePairRender {
  /** Index of the base pair, from bottom to top. */
  index: number;
  /** The helix parameter at the rung, in turns. */
  t: number;
  /** The base on the first strand. */
  base: BaseSymbol;
  /** The base on the second strand (the complement). */
  complement: BaseSymbol;
  /** The rung endpoint on the first strand. */
  start: Vector3Tuple;
  /** The rung endpoint on the second strand. */
  end: Vector3Tuple;
  /** The line mobject that draws the rung. */
  line: Line;
  /** The resolved rung color. */
  color: string;
  /**
   * How far the rung sits toward the viewer, from 0 (back of a turn) to 1
   * (front). Drives the depth-cue dimming and thinning. 0.5 when depth cue is
   * off.
   */
  frontness: number;
  /** The nucleotide bead on the first strand, or null when beads are off. */
  startBead: Circle | null;
  /** The nucleotide bead on the second strand, or null when beads are off. */
  endBead: Circle | null;
}

/** One organelle in the input of a {@link Cell}. */
export interface OrganelleSpec {
  /** Organelle name, used for the label and the default color. */
  name: string;
  /** Display label. Default: the name. */
  label?: string;
  /** Position relative to the cell center. Default: auto on a ring. */
  position?: Vector3Tuple;
  /** Radius of a circle organelle. Default: derived from the cell radius. */
  radius?: number;
  /** Width of an ellipse organelle. */
  width?: number;
  /** Height of an ellipse organelle. */
  height?: number;
  /** Organelle shape. Default: 'circle'. */
  shape?: CellShape;
  /** Fill color override. */
  color?: string;
}

/** Options for a {@link Cell}. */
export interface CellOptions {
  /** Membrane radius (a circle) or half-width (an ellipse). Default: 2. */
  radius?: number;
  /** Membrane shape. Default: 'circle'. */
  shape?: CellShape;
  /** Membrane width for an ellipse membrane. Default: 2 * radius. */
  width?: number;
  /** Membrane height for an ellipse membrane. Default: 1.4 * radius. */
  height?: number;
  /** The organelles inside the cell. Default: []. */
  organelles?: OrganelleSpec[];
  /** Nucleus radius. Default: 0.35 * radius. */
  nucleusRadius?: number;
  /** Draw the nucleus. Default: true. */
  showNucleus?: boolean;
  /** Draw labels for the organelles. Default: true. */
  labels?: boolean;
  /** Font size for the labels. Default: 20. */
  labelFontSize?: number;
  /** Per-name color overrides, merged over the organelle palette. */
  colors?: Record<string, string>;
  /** Membrane stroke color. Default: a green. */
  membraneColor?: string;
  /** Nucleus fill color. Default: a purple. */
  nucleusColor?: string;
  /** Opacity of the soft cytoplasm fill inside the membrane. Default: 0.1. */
  cytoplasmOpacity?: number;
  /**
   * Draw organelles with no explicit `shape` as detailed, realistic composites
   * (a mitochondrion with cristae, a stacked golgi, and so on). When false,
   * every organelle is a plain filled circle. Default: true.
   */
  organelleDetail?: boolean;
}

/** A resolved organelle of a {@link Cell}. */
export interface OrganelleRender {
  /** Organelle name. */
  name: string;
  /** The shape mobject (a Circle or an Ellipse). */
  shape: VMobject;
  /** The label mobject, or null when labels are off or the label is empty. */
  label: Text | null;
  /** The resolved fill color. */
  color: string;
  /** The organelle center, relative to the cell center. */
  position: Vector3Tuple;
}

/** Options for an {@link AminoAcidChain}. */
export interface AminoAcidChainOptions {
  /** The residue codes or names, from the N terminus to the C terminus. */
  residues: string[];
  /** Radius of each residue bead. Default: 0.25. */
  beadRadius?: number;
  /** Distance between adjacent bead centers. Default: 0.7. */
  spacing?: number;
  /** Lay the chain out as a zigzag. Default: true (false draws a straight row). */
  zigzag?: boolean;
  /** Per-code color overrides, merged over the residue palette. */
  colors?: Record<string, string>;
  /** Draw a label on each bead. Default: true. */
  labels?: boolean;
  /** Font size for the labels. Default: 18. */
  labelFontSize?: number;
  /** Color of the peptide bond lines. Default: white. */
  bondColor?: string;
  /** Stroke width of the bonds and bead outlines. Default: 4. */
  strokeWidth?: number;
}

/** A resolved residue of an {@link AminoAcidChain}. */
export interface ResidueRender {
  /** The residue code or name, as given. */
  code: string;
  /** The bead mobject. */
  bead: Circle;
  /** The label mobject, or null when labels are off. */
  label: Text | null;
  /** The resolved bead color. */
  color: string;
  /** The bead center. */
  position: Vector3Tuple;
}

/** A resolved pair of backbone strands, first and second. */
export type StrandPair = [ParametricFunction, ParametricFunction];

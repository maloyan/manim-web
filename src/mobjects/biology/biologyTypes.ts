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
import type { VGroup } from '../../core/VGroup';
import type { Text } from '../text/Text';
import type { Line } from '../geometry/Line';
import type { Circle } from '../geometry/Circle';
import type { Dot } from '../geometry/Dot';
import type { PhyloNode } from './newick';
import type { Sphere } from '../three-d/Sphere';
import type { ParametricFunction } from '../graphing/ParametricFunction';
import type { TubeFromPoints } from '../three-d/TubeFromPoints';
import type { Bond3D } from '../three-d/Bond3D';

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
  /** Color of the hydrogen-bond markers in the center. Default: a neutral gray. */
  hBondColor?: string;
  /**
   * Fraction of the rung length left open in the center for the hydrogen bonds,
   * in [0, 1). The two nucleobase halves leave this gap between them. Default:
   * 0.3.
   */
  baseGap?: number;
  /** Stroke width of the strands and rungs. Default: 4. */
  strokeWidth?: number;
  /** Samples taken per turn for each strand curve. Default: 48. */
  numSamplesPerTurn?: number;
  /**
   * Fake 3D depth by dimming and thinning the rungs and nucleotides that sit at
   * the back of each turn. Default: true.
   */
  depthCue?: boolean;
  /** Draw a nucleotide bead where each rung meets a backbone. Default: true. */
  showNucleotides?: boolean;
  /** Radius of each nucleotide bead. Default: 0.14 * radius. */
  nucleotideRadius?: number;
  /** Stroke width of the two backbone strands. Default: the strokeWidth. */
  backboneStrokeWidth?: number;
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
  /** The base-pair endpoint on the first strand (strand-A backbone join). */
  start: Vector3Tuple;
  /** The base-pair endpoint on the second strand (strand-B backbone join). */
  end: Vector3Tuple;
  /**
   * The center of the base pair, on the helix axis: the midpoint of start and
   * end. The two nucleobase halves meet here across the hydrogen-bond gap.
   */
  center: Vector3Tuple;
  /**
   * The strand-A nucleobase half. It runs from the strand-A backbone (`start`)
   * inward toward `center` and is colored by {@link base}. A flat {@link Line}
   * in 2D schematic mode; a solid 3D {@link Bond3D} cylinder in 3D mode.
   */
  startBase: Line | Bond3D;
  /**
   * The strand-B (complementary) nucleobase half. It runs from the strand-B
   * backbone (`end`) inward toward `center` and is colored by
   * {@link complement}. A flat {@link Line} in 2D; a {@link Bond3D} in 3D.
   */
  endBase: Line | Bond3D;
  /**
   * The hydrogen-bond marker in the central gap: a {@link VGroup} of 3 thin
   * connectors for a G-C pair, or 2 for an A-T pair. Dashed {@link Line}s in
   * 2D; thin {@link Bond3D} cylinders in 3D. Null when the central gap is
   * closed (baseGap is 0) or the rung has no length.
   */
  hBond: VGroup | null;
  /** The resolved color of the strand-A half (the pair's primary color). */
  color: string;
  /**
   * How far the rung sits toward the viewer, from 0 (back of a turn) to 1
   * (front). Drives the depth-cue dimming and thinning. 0.5 when depth cue is
   * off.
   */
  frontness: number;
  /** The nucleotide bead on the first strand, or null when beads are off. */
  startBead: Circle | Sphere | null;
  /** The nucleotide bead on the second strand, or null when beads are off. */
  endBead: Circle | Sphere | null;
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

/**
 * One backbone strand. A flat {@link ParametricFunction} curve in 2D schematic
 * mode; a solid 3D {@link TubeFromPoints} in 3D mode.
 */
export type Strand = ParametricFunction | TubeFromPoints;

/** A resolved pair of backbone strands, first and second. */
export type StrandPair = [Strand, Strand];

/** The drawing style of a {@link PhylogeneticTree}. */
export type PhyloLayout = 'rectangular' | 'radial';

/**
 * The reading direction of a rectangular {@link PhylogeneticTree}. The root
 * sits on the opposite side from the leaves.
 */
export type PhyloOrientation = 'left-to-right' | 'right-to-left';

/** Options for a {@link PhylogeneticTree}. Supply `newick` or `root`. */
export interface PhylogeneticTreeOptions {
  /** A Newick string, parsed into the tree. Supply this or `root`. */
  newick?: string;
  /** An already-parsed tree. Supply this or `newick`. */
  root?: PhyloNode;
  /** Drawing style. Default: 'rectangular'. */
  layout?: PhyloLayout;
  /**
   * Use branch lengths to place nodes along the depth axis (a phylogram). When
   * false, or when the tree has no branch lengths, node depth (the number of
   * edges from the root) is used instead (a cladogram). Default: true.
   */
  useBranchLengths?: boolean;
  /** Width of the drawing along the depth axis. Default: 6. */
  width?: number;
  /** Height of the drawing along the leaf axis. Default: 4. */
  height?: number;
  /** Font size of the leaf labels. Default: 20. */
  labelFontSize?: number;
  /** Draw leaf labels. Default: true. */
  labels?: boolean;
  /** Color of the branch lines. Default: white. */
  lineColor?: string;
  /** Color of the leaf dots. Default: a blue. */
  leafColor?: string;
  /** Draw a dot at each leaf. Default: true. */
  showLeafDots?: boolean;
  /** Radius of each leaf dot. Default: 0.06. */
  leafDotRadius?: number;
  /** Stroke width of the branch lines. Default: 3. */
  strokeWidth?: number;
  /** Reading direction (rectangular layout only). Default: 'left-to-right'. */
  orientation?: PhyloOrientation;
}

/** A resolved node of a {@link PhylogeneticTree} after layout. */
export interface PhyloNodeRender {
  /** The source node from the parsed tree. */
  node: PhyloNode;
  /** The node name, or undefined for an unnamed internal node. */
  name?: string;
  /** The laid-out center of the node. */
  position: Vector3Tuple;
  /** The number of edges from the root (the root is depth 0). */
  depth: number;
  /** The summed branch length from the root to this node. */
  cumulativeLength: number;
  /** True when the node has no children. */
  isLeaf: boolean;
}

/** A resolved leaf of a {@link PhylogeneticTree}. */
export interface PhyloLeafRender {
  /** The leaf name, or an empty string for an unnamed leaf. */
  name: string;
  /** The leaf center. */
  position: Vector3Tuple;
  /** The leaf dot, or null when dots are off. */
  dot: Dot | null;
  /** The leaf label, or null when labels are off or the name is empty. */
  label: Text | null;
}

/** A resolved branch (a parent-to-child edge) of a {@link PhylogeneticTree}. */
export interface PhyloBranchRender {
  /** The parent node center. */
  start: Vector3Tuple;
  /** The child node center. */
  end: Vector3Tuple;
  /**
   * The line mobjects that draw the branch. A rectangular branch is an elbow of
   * a vertical then a horizontal {@link Line}; a radial branch is one line.
   */
  lines: Line[];
}

/** Which row of a {@link Membrane} bilayer a lipid belongs to. */
export type MembraneRow = 'upper' | 'lower';

/** An x range `[xMin, xMax]` in membrane coordinates (the membrane center is x = 0). */
export type MembraneGap = [number, number];

/** Options for a {@link Membrane}. */
export interface MembraneOptions {
  /** Length of the bilayer along x. Default: 8 */
  length?: number;
  /** Lipids per row. When set, it wins over spacing. Default: derived from spacing */
  numLipids?: number;
  /** Distance between neighbor lipids in a row, used when numLipids is not set. Default: 0.3 */
  spacing?: number;
  /** Radius of each round head. Default: 0.1 */
  headRadius?: number;
  /** Length of each tail. Default: 0.3 */
  tailLength?: number;
  /** Distance between the two inner tail ends of the two rows. Default: 0.1 */
  coreGap?: number;
  /** Head fill color. Default: '#F4B942' */
  headColor?: string;
  /** Tail stroke color. Default: '#F4B942' */
  tailColor?: string;
  /** Tail stroke width. Default: 2 */
  tailStrokeWidth?: number;
  /** x ranges (membrane coordinates) to leave empty, for embedded proteins. Default: none */
  gaps?: MembraneGap[];
  /** Center of the membrane. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/** One phospholipid of a {@link Membrane}: a round head and two tails. */
export interface LipidRender {
  /** The row the lipid belongs to. */
  row: MembraneRow;
  /** The lipid x in membrane coordinates (the membrane center is x = 0). */
  x: number;
  /** The round head. */
  head: Circle;
  /** The two tail lines. */
  tails: [Line, Line];
  /** The group that holds the head and the tails. */
  group: VGroup;
}

/** Body shape of a {@link ComplexBlob}. */
export type ComplexBlobShape = 'rounded' | 'ellipse';

/** Where a {@link ComplexBlob} puts its label. */
export type ComplexBlobLabelPosition = 'inside' | 'below' | 'above';

/** Options for a {@link ComplexBlob}. */
export interface ComplexBlobOptions {
  /** The label text. */
  label: string;
  /** Body width. Default: 1.2 */
  width?: number;
  /** Body height. Default: 1 */
  height?: number;
  /** Body shape. Default: 'rounded' */
  shape?: ComplexBlobShape;
  /** Base (edge) color of the gradient. Default: '#E57373' */
  color?: string;
  /** Number of concentric layers that fake the radial gradient. Default: 6 */
  layers?: number;
  /** Draw a soft glow behind the body. Default: true */
  glow?: boolean;
  /** Label font size. Default: 24 */
  fontSize?: number;
  /** Label color. Default: '#FFFFFF' */
  labelColor?: string;
  /** Label position. Default: 'inside' */
  labelPosition?: ComplexBlobLabelPosition;
  /** Center of the body. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

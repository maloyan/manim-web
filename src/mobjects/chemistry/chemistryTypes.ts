/**
 * Shared types for the chemistry mobjects.
 *
 * A molecule is a node-link structure: atoms are nodes with 2D coordinates,
 * bonds are edges between atom indices. The same idea drives the graph
 * mobjects, but the chemistry layout is explicit (the caller gives the
 * coordinates) so the structure stays deterministic and testable.
 */

import type { Vector3Tuple, Mobject } from '../../core/Mobject';
import type { Text } from '../text/Text';

/** Bond multiplicity. 1 = single, 2 = double, 3 = triple. */
export type BondOrder = 1 | 2 | 3;

/**
 * Bond drawing style.
 * - 'normal' draws plain parallel lines by order.
 * - 'wedge' draws a filled triangle (a bond toward the viewer).
 * - 'dash' draws a dashed line (a bond away from the viewer).
 */
export type BondStyle = 'normal' | 'wedge' | 'dash';

/** One atom in the input: an element symbol and 2D coordinates. */
export interface AtomSpec {
  /** Element symbol, e.g. 'C', 'O', 'Cl'. */
  element: string;
  /** X coordinate in bond-length units. */
  x: number;
  /** Y coordinate in bond-length units. */
  y: number;
}

/** One bond in the input: two atom indices and an optional order/style. */
export interface BondSpec {
  /** Index of the first atom in the atoms array. */
  from: number;
  /** Index of the second atom in the atoms array. */
  to: number;
  /** Bond order. Default: 1. */
  order?: BondOrder;
  /** Bond style. Default: 'normal'. */
  type?: BondStyle;
}

/** Options for a {@link MoleculeMobject}. */
export interface MoleculeOptions {
  /** The atoms of the molecule. */
  atoms: AtomSpec[];
  /** The bonds between atoms. Default: []. */
  bonds?: BondSpec[];
  /** Scale applied to every atom coordinate. Default: 1. */
  bondLength?: number;
  /** Per-element color overrides, e.g. { C: '#000000' }. Merged over the CPK palette. */
  colors?: Record<string, string>;
  /** Whether to draw a label on carbon atoms. Default: false (skeletal convention). */
  showCarbonLabels?: boolean;
  /** Font size for atom labels. Default: 28. */
  labelFontSize?: number;
  /** Color of the bond lines. Default: white. */
  bondColor?: string;
  /** Distance between the parallel lines of a double or triple bond. Default: 0.08. */
  bondSpacing?: number;
}

/** A resolved atom: its element, world position, color and optional label. */
export interface AtomRender {
  /** Element symbol. */
  element: string;
  /** Position after the bond-length scale. */
  position: Vector3Tuple;
  /** Resolved CPK (or overridden) color. */
  color: string;
  /** The label mobject, or null for an implicit (unlabeled) carbon. */
  label: Text | null;
}

/** A resolved bond: its endpoints, order, style and line mobjects. */
export interface BondRender {
  /** Index of the first atom. */
  from: number;
  /** Index of the second atom. */
  to: number;
  /** Bond order. */
  order: BondOrder;
  /** Bond style. */
  type: BondStyle;
  /**
   * The mobjects that draw this bond. A normal bond of order N has N line
   * mobjects; a wedge or dash bond has one. A bond that references a missing
   * atom has none.
   */
  lines: Mobject[];
}

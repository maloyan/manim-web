/**
 * MoleculeMobject - a 2D skeletal structure of a molecule.
 *
 * A molecule is a node-link structure: atoms are nodes placed at explicit 2D
 * coordinates, bonds are edges between atom indices. Atoms render as element
 * labels colored by the CPK palette (carbons may stay implicit, as in skeletal
 * drawings). Bonds render as single, double or triple lines, with optional
 * wedge and dash styles for stereochemistry.
 *
 * The molecule is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const mol = new MoleculeMobject({
 *   atoms: [
 *     { element: 'O', x: 0, y: 0 },
 *     { element: 'H', x: -0.8, y: -0.6 },
 *     { element: 'H', x: 0.8, y: -0.6 },
 *   ],
 *   bonds: [
 *     { from: 0, to: 1 },
 *     { from: 0, to: 2 },
 *   ],
 * });
 * scene.play(new Create(mol));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Line } from '../geometry/Line';
import { Polygon } from '../geometry/Polygon';
import { DashedLine } from '../geometry/DashedLine';
import { Text } from '../text/Text';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { cpkColor, normalizeElement } from './cpkColors';
import {
  AtomSpec,
  BondSpec,
  BondOrder,
  BondStyle,
  MoleculeOptions,
  AtomRender,
  BondRender,
} from './chemistryTypes';

/** Fraction of the bond length trimmed at a labeled atom so the line clears the label. */
const LABEL_GAP = 0.22;

export class MoleculeMobject extends VGroup {
  /** The atom specs as given, scaled to world coordinates. */
  protected _atomSpecs: AtomSpec[];
  /** The bond specs as given. */
  protected _bondSpecs: BondSpec[];
  /** Resolved atoms, parallel to _atomSpecs. */
  protected _atoms: AtomRender[] = [];
  /** Resolved bonds, parallel to _bondSpecs. */
  protected _bonds: BondRender[] = [];

  protected _bondLength: number;
  protected _colors: Record<string, string>;
  protected _showCarbonLabels: boolean;
  protected _labelFontSize: number;
  protected _bondColor: string;
  protected _bondSpacing: number;

  /** The bond line mobjects, drawn behind the atoms. */
  readonly bondsGroup: VGroup;
  /** The atom label mobjects, drawn in front of the bonds. */
  readonly atomsGroup: VGroup;

  constructor(options: MoleculeOptions) {
    super();

    const {
      atoms,
      bonds = [],
      bondLength = 1,
      colors = {},
      showCarbonLabels = false,
      labelFontSize = 28,
      bondColor = WHITE,
      bondSpacing = 0.08,
    } = options;

    this._atomSpecs = atoms.map((a) => ({ ...a }));
    this._bondSpecs = bonds.map((b) => ({ ...b }));
    this._bondLength = bondLength;
    this._colors = { ...colors };
    this._showCarbonLabels = showCarbonLabels;
    this._labelFontSize = labelFontSize;
    this._bondColor = bondColor;
    this._bondSpacing = bondSpacing;

    this.bondsGroup = new VGroup();
    this.atomsGroup = new VGroup();

    // Resolve atoms first so bond building can read their positions. Build
    // bonds before atom labels so the bonds render behind the labels.
    this._resolveAtoms();
    this._buildBonds();
    this._buildAtomLabels();

    this.add(this.bondsGroup);
    this.add(this.atomsGroup);
  }

  /** World position of an atom spec after the bond-length scale. */
  protected _atomPosition(spec: AtomSpec): Vector3Tuple {
    return [spec.x * this._bondLength, spec.y * this._bondLength, 0];
  }

  /** Whether an element should carry a label. Carbons are implicit by default. */
  protected _hasLabel(element: string): boolean {
    if (normalizeElement(element) === 'C') {
      return this._showCarbonLabels;
    }
    return true;
  }

  /** Resolve each atom spec into an AtomRender (position and color; label added later). */
  protected _resolveAtoms(): void {
    this._atoms = this._atomSpecs.map((spec) => ({
      element: spec.element,
      position: this._atomPosition(spec),
      color: cpkColor(spec.element, this._colors),
      label: null,
    }));
  }

  /** Create a label Text for every atom that needs one, and add it to atomsGroup. */
  protected _buildAtomLabels(): void {
    for (const atom of this._atoms) {
      if (!this._hasLabel(atom.element)) {
        continue;
      }
      const label = new Text({
        text: normalizeElement(atom.element),
        fontSize: this._labelFontSize,
        color: atom.color,
      });
      label.moveTo(atom.position);
      atom.label = label;
      this.atomsGroup.add(label);
    }
  }

  /** Build every bond and add its line mobjects to bondsGroup. */
  protected _buildBonds(): void {
    for (const spec of this._bondSpecs) {
      const order: BondOrder = spec.order ?? 1;
      const type: BondStyle = spec.type ?? 'normal';
      const lines = this._buildBondLines(spec, order, type);
      for (const line of lines) {
        this.bondsGroup.add(line);
      }
      this._bonds.push({ from: spec.from, to: spec.to, order, type, lines });
    }
  }

  /**
   * Build the line mobjects for one bond.
   *
   * A bond that references a missing atom produces no lines (handled
   * gracefully, no throw). A wedge or dash bond produces one mobject. A normal
   * bond produces `order` parallel lines.
   */
  protected _buildBondLines(spec: BondSpec, order: BondOrder, type: BondStyle): Mobject[] {
    const fromAtom = this._atoms[spec.from];
    const toAtom = this._atoms[spec.to];
    if (!fromAtom || !toAtom) {
      return [];
    }

    const [start, end] = this._trimForLabels(fromAtom, toAtom);

    if (type === 'wedge') {
      return [this._buildWedge(start, end)];
    }
    if (type === 'dash') {
      return [new DashedLine({ start, end, color: this._bondColor })];
    }
    return this._buildParallelLines(start, end, order);
  }

  /** Trim the bond endpoints inward at labeled atoms so the line clears the label. */
  protected _trimForLabels(fromAtom: AtomRender, toAtom: AtomRender): [Vector3Tuple, Vector3Tuple] {
    const p1 = fromAtom.position;
    const p2 = toAtom.position;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      return [p1, p2];
    }
    const gap = LABEL_GAP * this._bondLength;
    const ux = dx / len;
    const uy = dy / len;
    const startTrim = this._hasLabel(fromAtom.element) ? gap : 0;
    const endTrim = this._hasLabel(toAtom.element) ? gap : 0;
    // Do not let the trims cross; if the bond is shorter than the two gaps,
    // fall back to the raw endpoints.
    if (startTrim + endTrim >= len) {
      return [p1, p2];
    }
    const start: Vector3Tuple = [p1[0] + ux * startTrim, p1[1] + uy * startTrim, 0];
    const end: Vector3Tuple = [p2[0] - ux * endTrim, p2[1] - uy * endTrim, 0];
    return [start, end];
  }

  /** Unit perpendicular to the segment, in the XY plane. */
  protected _perpendicular(start: Vector3Tuple, end: Vector3Tuple): Vector3Tuple {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      return [0, 0, 0];
    }
    return [-dy / len, dx / len, 0];
  }

  /** Build `order` parallel lines, evenly offset about the bond axis. */
  protected _buildParallelLines(
    start: Vector3Tuple,
    end: Vector3Tuple,
    order: BondOrder,
  ): Mobject[] {
    const perp = this._perpendicular(start, end);
    const spacing = this._bondSpacing;
    // Offsets centered on 0: single -> [0]; double -> [-s/2, s/2]; triple -> [-s, 0, s].
    let offsets: number[];
    if (order === 2) {
      offsets = [-spacing / 2, spacing / 2];
    } else if (order === 3) {
      offsets = [-spacing, 0, spacing];
    } else {
      offsets = [0];
    }
    return offsets.map((offset) => {
      const s: Vector3Tuple = [start[0] + perp[0] * offset, start[1] + perp[1] * offset, 0];
      const e: Vector3Tuple = [end[0] + perp[0] * offset, end[1] + perp[1] * offset, 0];
      return new Line({
        start: s,
        end: e,
        color: this._bondColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
      });
    });
  }

  /** Build a filled triangle wedge from `start` (point) to `end` (wide base). */
  protected _buildWedge(start: Vector3Tuple, end: Vector3Tuple): Mobject {
    const perp = this._perpendicular(start, end);
    const half = this._bondSpacing * 1.6;
    const baseA: Vector3Tuple = [end[0] + perp[0] * half, end[1] + perp[1] * half, 0];
    const baseB: Vector3Tuple = [end[0] - perp[0] * half, end[1] - perp[1] * half, 0];
    return new Polygon({
      vertices: [start, baseA, baseB],
      color: this._bondColor,
      fillOpacity: 1,
      strokeWidth: 1,
    });
  }

  // ========== Accessors ==========

  /** Get all resolved atoms, in input order. */
  getAtoms(): AtomRender[] {
    return [...this._atoms];
  }

  /** Get all resolved bonds, in input order. */
  getBonds(): BondRender[] {
    return [...this._bonds];
  }

  /** Get the resolved atom at an index, or undefined. */
  getAtom(index: number): AtomRender | undefined {
    return this._atoms[index];
  }

  /** Get the resolved bond at an index, or undefined. */
  getBond(index: number): BondRender | undefined {
    return this._bonds[index];
  }

  /** The number of atoms. */
  get numAtoms(): number {
    return this._atoms.length;
  }

  /** The number of bonds. */
  get numBonds(): number {
    return this._bonds.length;
  }

  override copy(): MoleculeMobject {
    const copy = new MoleculeMobject({
      atoms: this._atomSpecs.map((a) => ({ ...a })),
      bonds: this._bondSpecs.map((b) => ({ ...b })),
      bondLength: this._bondLength,
      colors: { ...this._colors },
      showCarbonLabels: this._showCarbonLabels,
      labelFontSize: this._labelFontSize,
      bondColor: this._bondColor,
      bondSpacing: this._bondSpacing,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

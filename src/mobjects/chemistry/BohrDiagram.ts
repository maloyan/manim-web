/**
 * BohrDiagram - a 2D Bohr-model (electron-shell) diagram of an atom.
 *
 * A Bohr diagram shows a central nucleus and a set of concentric electron
 * shells. Each shell carries the number of electrons that textbook Bohr
 * diagrams place in it. The nucleus shows the element symbol and the proton
 * count.
 *
 * Shell filling has two rules, picked with the `shellRule` option:
 *
 * - `'school'` (the default): the 2, 8, 8, 2 rule that school textbooks draw
 *   for Z <= 20. Shell 3 takes 8 electrons before shell 4 starts, so potassium
 *   is [2, 8, 8, 1] and calcium is [2, 8, 8, 2]. For Z > 20 the school rule
 *   has no single convention, so it uses the `'capacity'` filling.
 * - `'capacity'`: the 2n^2 shell-capacity rule. Shell n holds up to 2n^2
 *   electrons (2, 8, 18, 32) and each shell fills before the next begins, so
 *   potassium is [2, 8, 9].
 *
 * Neither rule is the real (Aufbau) configuration of every element. Pass the
 * `shells` option to set the per-shell counts directly when an exact filling
 * is needed (for example scandium as [2, 8, 9, 2]).
 *
 * The diagram is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const carbon = new BohrDiagram({ element: 'C' });   // shells [2, 4]
 * const sodium = new BohrDiagram({ element: 'Na' });  // shells [2, 8, 1]
 * const potassium = new BohrDiagram({ element: 'K' }); // shells [2, 8, 8, 1]
 * scene.play(new Create(carbon));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { Circle } from '../geometry/Circle';
import { Dot } from '../geometry/Dot';
import { Text } from '../text/Text';
import { WHITE, YELLOW, RED } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { normalizeElement } from './cpkColors';

/**
 * How a {@link BohrDiagram} fills its shells from the atomic number.
 * `'school'` is the 2, 8, 8, 2 textbook rule for Z <= 20; `'capacity'` is the
 * 2n^2 shell-capacity rule. See the {@link BohrDiagram} class doc.
 */
export type BohrShellRule = 'school' | 'capacity';

/** Options for a {@link BohrDiagram}. */
export interface BohrDiagramOptions {
  /** Element symbol, e.g. 'C', 'Na', 'O'. Derives the proton count and filling. */
  element?: string;
  /** Atomic number (proton count) directly. The element wins if both are given. */
  protons?: number;
  /** Explicit per-shell electron counts. Overrides the computed filling. */
  shells?: number[];
  /** Rule that computes the filling when `shells` is not given. Default: 'school'. */
  shellRule?: BohrShellRule;
  /** Whether to label the nucleus with the symbol and proton count. Default: true. */
  showNucleusLabel?: boolean;
  /** Radius of the nucleus circle. Default: 0.4. */
  nucleusRadius?: number;
  /** Radial distance between consecutive shells. Default: 0.6. */
  shellSpacing?: number;
  /** Radius of each electron dot. Default: 0.08. */
  electronRadius?: number;
  /** Fill color of the nucleus circle. Default: a warm red. */
  nucleusColor?: string;
  /** Stroke color of the shell circles. Default: white. */
  shellColor?: string;
  /** Fill color of the electron dots. Default: yellow. */
  electronColor?: string;
}

/**
 * Element symbol to atomic number, hydrogen (1) through krypton (36).
 *
 * This covers every element whose textbook Bohr diagram is commonly drawn.
 * An element outside this range must be given by its `protons` count.
 */
const SYMBOL_TO_Z: Readonly<Record<string, number>> = {
  H: 1,
  He: 2,
  Li: 3,
  Be: 4,
  B: 5,
  C: 6,
  N: 7,
  O: 8,
  F: 9,
  Ne: 10,
  Na: 11,
  Mg: 12,
  Al: 13,
  Si: 14,
  P: 15,
  S: 16,
  Cl: 17,
  Ar: 18,
  K: 19,
  Ca: 20,
  Sc: 21,
  Ti: 22,
  V: 23,
  Cr: 24,
  Mn: 25,
  Fe: 26,
  Co: 27,
  Ni: 28,
  Cu: 29,
  Zn: 30,
  Ga: 31,
  Ge: 32,
  As: 33,
  Se: 34,
  Br: 35,
  Kr: 36,
};

/** Atomic number to element symbol, the inverse of {@link SYMBOL_TO_Z}. */
const Z_TO_SYMBOL: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(SYMBOL_TO_Z).map(([symbol, z]) => [z, symbol]),
);

/** Default nucleus fill color (warm red, so it reads against a dark scene). */
export const DEFAULT_NUCLEUS_COLOR = RED;

/** Highest atomic number that the 2, 8, 8, 2 school rule covers (calcium). */
const SCHOOL_RULE_MAX_Z = 20;

/** Shell capacities of the school rule, innermost first. */
const SCHOOL_RULE_CAPACITIES: readonly number[] = [2, 8, 8, 2];

/**
 * Fill the electron shells for an atomic number.
 *
 * With `'school'` (the default) and z <= 20, shells fill to 2, 8, 8, 2 in
 * order. Otherwise shell n holds up to 2n^2 electrons, and each shell fills
 * before the next one starts. See the class doc for why both rules simplify
 * real electron configurations.
 * @param z - The atomic number (a positive integer).
 * @param rule - The filling rule. Default: 'school'.
 * @returns The electron count per shell, innermost first.
 * @post result.reduce((a, b) => a + b, 0) === z
 * @post rule === 'school' && z <= 20 => result.every((c, i) => c <= [2, 8, 8, 2][i])
 */
export function fillShells(z: number, rule: BohrShellRule = 'school'): number[] {
  const useSchool = rule === 'school' && z <= SCHOOL_RULE_MAX_Z;
  const shells: number[] = [];
  let remaining = z;
  let n = 1;
  while (remaining > 0) {
    const capacity = useSchool ? SCHOOL_RULE_CAPACITIES[n - 1] : 2 * n * n;
    const inShell = Math.min(capacity, remaining);
    shells.push(inShell);
    remaining -= inShell;
    n += 1;
  }
  return shells;
}

export class BohrDiagram extends VGroup {
  protected _protons: number;
  protected _symbol: string | null;
  protected _shellCounts: number[];

  protected _showNucleusLabel: boolean;
  protected _nucleusRadius: number;
  protected _shellSpacing: number;
  protected _electronRadius: number;
  protected _nucleusColor: string;
  protected _shellColor: string;
  protected _electronColor: string;

  /** The nucleus circle and its label. */
  readonly nucleusGroup: VGroup;
  /** The concentric shell circles, innermost first. */
  readonly shellsGroup: VGroup;
  /** The electron dots, grouped shell by shell. */
  readonly electronsGroup: VGroup;

  protected _shellCircles: Circle[] = [];
  protected _electronDots: Dot[] = [];

  constructor(options: BohrDiagramOptions) {
    super();

    const {
      element,
      protons,
      shells,
      shellRule = 'school',
      showNucleusLabel = true,
      nucleusRadius = 0.4,
      shellSpacing = 0.6,
      electronRadius = 0.08,
      nucleusColor = DEFAULT_NUCLEUS_COLOR,
      shellColor = WHITE,
      electronColor = YELLOW,
    } = options;

    const resolved = BohrDiagram._resolveProtons(element, protons);
    this._protons = resolved.protons;
    this._symbol = resolved.symbol;
    this._shellCounts = shells ? [...shells] : fillShells(this._protons, shellRule);

    this._showNucleusLabel = showNucleusLabel;
    this._nucleusRadius = nucleusRadius;
    this._shellSpacing = shellSpacing;
    this._electronRadius = electronRadius;
    this._nucleusColor = nucleusColor;
    this._shellColor = shellColor;
    this._electronColor = electronColor;

    this.nucleusGroup = new VGroup();
    this.shellsGroup = new VGroup();
    this.electronsGroup = new VGroup();

    // Shells behind, then electrons, then the nucleus on top so its label is
    // never hidden by a shell circle that passes through the center.
    this._buildShells();
    this._buildElectrons();
    this._buildNucleus();

    this.add(this.shellsGroup);
    this.add(this.electronsGroup);
    this.add(this.nucleusGroup);
  }

  /**
   * Resolve the proton count and element symbol from the options.
   *
   * The element wins over an explicit proton count. An unknown element, a
   * missing identity, or a non-positive / non-integer proton count throws a
   * clear Error rather than drawing a wrong atom.
   */
  protected static _resolveProtons(
    element: string | undefined,
    protons: number | undefined,
  ): { protons: number; symbol: string | null } {
    if (element !== undefined) {
      const symbol = normalizeElement(element);
      const z = SYMBOL_TO_Z[symbol];
      if (z === undefined) {
        throw new Error(
          `BohrDiagram: unknown element "${element}". ` +
            `Supported elements are H (Z=1) through Kr (Z=36). ` +
            `For other atoms, pass "protons" directly.`,
        );
      }
      return { protons: z, symbol };
    }

    if (protons !== undefined) {
      if (!Number.isInteger(protons) || protons <= 0) {
        throw new Error(`BohrDiagram: "protons" must be a positive integer, got ${protons}.`);
      }
      return { protons, symbol: Z_TO_SYMBOL[protons] ?? null };
    }

    throw new Error('BohrDiagram: give an "element" symbol or a "protons" count to build an atom.');
  }

  /** Radius of the shell at a 1-based shell index. */
  protected _shellRadius(shellIndex: number): number {
    return this._nucleusRadius + this._shellSpacing * shellIndex;
  }

  /** Build one concentric circle per shell and add it to shellsGroup. */
  protected _buildShells(): void {
    this._shellCircles = this._shellCounts.map((_count, i) => {
      const circle = new Circle({
        radius: this._shellRadius(i + 1),
        color: this._shellColor,
        fillOpacity: 0,
        strokeWidth: DEFAULT_STROKE_WIDTH,
      });
      this.shellsGroup.add(circle);
      return circle;
    });
  }

  /** Build the electron dots for every shell and add them to electronsGroup. */
  protected _buildElectrons(): void {
    this._electronDots = [];
    this._shellCounts.forEach((count, i) => {
      const radius = this._shellRadius(i + 1);
      for (let k = 0; k < count; k += 1) {
        // Space the electrons evenly around the shell. Start each shell at the
        // top (+y) so small shells read symmetrically.
        const angle = Math.PI / 2 + (2 * Math.PI * k) / count;
        const position: Vector3Tuple = [radius * Math.cos(angle), radius * Math.sin(angle), 0];
        const dot = new Dot({
          point: position,
          radius: this._electronRadius,
          color: this._electronColor,
        });
        this._electronDots.push(dot);
        this.electronsGroup.add(dot);
      }
    });
  }

  /** Build the nucleus circle and its optional label, into nucleusGroup. */
  protected _buildNucleus(): void {
    const nucleus = new Circle({
      radius: this._nucleusRadius,
      color: this._nucleusColor,
      fillOpacity: 1,
      strokeWidth: DEFAULT_STROKE_WIDTH,
    });
    this.nucleusGroup.add(nucleus);

    if (this._showNucleusLabel) {
      const label = new Text({
        text: this._nucleusLabelText(),
        fontSize: 24,
        color: WHITE,
      });
      label.moveTo([0, 0, 0]);
      this.nucleusGroup.add(label);
    }
  }

  /** The nucleus label: the symbol (if known) above the proton count. */
  protected _nucleusLabelText(): string {
    const protonLine = `${this._protons}p+`;
    return this._symbol ? `${this._symbol}\n${protonLine}` : protonLine;
  }

  // ========== Accessors ==========

  /** The electron count per shell, innermost first. */
  getShellCounts(): number[] {
    return [...this._shellCounts];
  }

  /** The proton count (atomic number). */
  getProtons(): number {
    return this._protons;
  }

  /** The element symbol, or null when the atom was given only by proton count. */
  getSymbol(): string | null {
    return this._symbol;
  }

  /** The shell circle mobjects, innermost first. */
  getShellCircles(): Circle[] {
    return [...this._shellCircles];
  }

  /** The electron dot mobjects, grouped shell by shell. */
  getElectronDots(): Dot[] {
    return [...this._electronDots];
  }

  override copy(): BohrDiagram {
    const copy = new BohrDiagram({
      protons: this._protons,
      shells: [...this._shellCounts],
      showNucleusLabel: this._showNucleusLabel,
      nucleusRadius: this._nucleusRadius,
      shellSpacing: this._shellSpacing,
      electronRadius: this._electronRadius,
      nucleusColor: this._nucleusColor,
      shellColor: this._shellColor,
      electronColor: this._electronColor,
    });
    // Preserve the symbol even when this atom was built from an element: the
    // copy is reconstructed from the proton count, which resolves the symbol
    // identically for H..Kr, but keep the original to be safe for any override.
    copy._symbol = this._symbol;
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

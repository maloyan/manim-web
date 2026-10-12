/**
 * AminoAcidChain - a bead chain of amino acid residues.
 *
 * Each residue is a bead (a filled circle), joined to the next by a peptide
 * bond line. The chain runs left to right, in a straight row or a zigzag.
 * Beads can be colored by residue and labeled with their code.
 *
 * The chain is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const chain = new AminoAcidChain({ residues: ['M', 'A', 'G', 'K', 'D'] });
 * scene.play(new Create(chain));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { Circle } from '../geometry/Circle';
import { Line } from '../geometry/Line';
import { Text } from '../text/Text';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { residueColor } from './biologyColors';
import { AminoAcidChainOptions, ResidueRender } from './biologyTypes';

export class AminoAcidChain extends VGroup {
  protected _residueCodes: string[];
  protected _beadRadius: number;
  protected _spacing: number;
  protected _zigzag: boolean;
  protected _colors: Record<string, string>;
  protected _labels: boolean;
  protected _labelFontSize: number;
  protected _bondColor: string;
  protected _strokeWidth: number;

  /** The resolved residues, from the N terminus to the C terminus. */
  protected _residues: ResidueRender[] = [];
  /** The peptide bond line mobjects. */
  protected _bonds: Line[] = [];

  /** The peptide bond mobjects, drawn behind the beads. */
  readonly bondsGroup: VGroup;
  /** The residue bead mobjects. */
  readonly beadsGroup: VGroup;
  /** The residue label mobjects. */
  readonly labelsGroup: VGroup;

  constructor(options: AminoAcidChainOptions) {
    super();

    const {
      residues,
      beadRadius = 0.25,
      spacing = 0.7,
      zigzag = true,
      colors = {},
      labels = true,
      labelFontSize = 18,
      bondColor = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    this._residueCodes = residues.map((r) => r);
    this._beadRadius = beadRadius;
    this._spacing = spacing;
    this._zigzag = zigzag;
    this._colors = { ...colors };
    this._labels = labels;
    this._labelFontSize = labelFontSize;
    this._bondColor = bondColor;
    this._strokeWidth = strokeWidth;

    this.bondsGroup = new VGroup();
    this.beadsGroup = new VGroup();
    this.labelsGroup = new VGroup();

    this._buildResidues();
    this._buildBonds();

    // Bonds render behind the beads and labels.
    this.add(this.bondsGroup);
    this.add(this.beadsGroup);
    this.add(this.labelsGroup);
  }

  /** The bead center for the residue at an index, centered on the chain. */
  protected _beadPosition(index: number): Vector3Tuple {
    const count = this._residueCodes.length;
    const x = (index - (count - 1) / 2) * this._spacing;
    const y = this._zigzag ? (index % 2 === 0 ? 0 : this._spacing * 0.4) : 0;
    return [x, y, 0];
  }

  /** Build every residue bead and label, and add them to their groups. */
  protected _buildResidues(): void {
    this._residueCodes.forEach((code, i) => {
      const position = this._beadPosition(i);
      const color = residueColor(code, this._colors);
      const bead = new Circle({
        radius: this._beadRadius,
        color,
        fillOpacity: 0.85,
        strokeWidth: 2,
      });
      bead.moveTo(position);
      this.beadsGroup.add(bead);

      let label: Text | null = null;
      if (this._labels && code.length > 0) {
        label = new Text({ text: code, fontSize: this._labelFontSize });
        label.moveTo(position);
        this.labelsGroup.add(label);
      }
      this._residues.push({ code, bead, label, color, position });
    });
  }

  /** Build the peptide bond between every adjacent pair of beads. */
  protected _buildBonds(): void {
    for (let i = 0; i < this._residues.length - 1; i++) {
      const line = new Line({
        start: this._residues[i].position,
        end: this._residues[i + 1].position,
        color: this._bondColor,
        strokeWidth: this._strokeWidth,
      });
      this.bondsGroup.add(line);
      this._bonds.push(line);
    }
  }

  // ========== Accessors ==========

  /** Get all resolved residues, from the N terminus to the C terminus. */
  getResidues(): ResidueRender[] {
    return [...this._residues];
  }

  /** Get the resolved residue at an index, or undefined. */
  getResidue(index: number): ResidueRender | undefined {
    return this._residues[index];
  }

  /** Get the peptide bond line mobjects. */
  getBonds(): Line[] {
    return [...this._bonds];
  }

  /** The number of residues. */
  get numResidues(): number {
    return this._residues.length;
  }

  override copy(): AminoAcidChain {
    const clone = new AminoAcidChain({
      residues: [...this._residueCodes],
      beadRadius: this._beadRadius,
      spacing: this._spacing,
      zigzag: this._zigzag,
      colors: { ...this._colors },
      labels: this._labels,
      labelFontSize: this._labelFontSize,
      bondColor: this._bondColor,
      strokeWidth: this._strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}

/**
 * Cell - a simple 2D cell diagram.
 *
 * A cell is a membrane (a circle or an ellipse), an optional nucleus, and a
 * set of organelles. Each organelle is a small shape with an optional text
 * label, placed at an explicit position or auto-arranged on a ring between the
 * nucleus and the membrane.
 *
 * The cell is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const cell = new Cell({
 *   radius: 2,
 *   organelles: [
 *     { name: 'mitochondrion', shape: 'ellipse' },
 *     { name: 'ribosome' },
 *     { name: 'lysosome' },
 *   ],
 * });
 * scene.play(new Create(cell));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Circle } from '../geometry/Circle';
import { Ellipse } from '../geometry/Ellipse';
import { Text } from '../text/Text';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { organelleColor } from './biologyColors';
import { CellOptions, CellShape, OrganelleSpec, OrganelleRender } from './biologyTypes';

/** Default membrane stroke color (a green). */
const DEFAULT_MEMBRANE_COLOR = '#66BB6A';

/** Default nucleus fill color (a purple). */
const DEFAULT_NUCLEUS_COLOR = '#7E57C2';

export class Cell extends VGroup {
  protected _radius: number;
  protected _shape: CellShape;
  protected _width: number;
  protected _height: number;
  protected _organelleSpecs: OrganelleSpec[];
  protected _nucleusRadius: number;
  protected _showNucleus: boolean;
  protected _labels: boolean;
  protected _labelFontSize: number;
  protected _colors: Record<string, string>;
  protected _membraneColor: string;
  protected _nucleusColor: string;

  /** The resolved organelles, in input order. */
  protected _organelles: OrganelleRender[] = [];

  /** The membrane mobject (a Circle or an Ellipse). */
  readonly membrane: VMobject;
  /** The nucleus mobject, or null when showNucleus is false. */
  readonly nucleus: Circle | null;
  /** The organelle shape mobjects. */
  readonly organellesGroup: VGroup;
  /** The organelle label mobjects. */
  readonly labelsGroup: VGroup;

  constructor(options: CellOptions = {}) {
    super();

    const {
      radius = 2,
      shape = 'circle',
      width,
      height,
      organelles = [],
      nucleusRadius,
      showNucleus = true,
      labels = true,
      labelFontSize = 20,
      colors = {},
      membraneColor = DEFAULT_MEMBRANE_COLOR,
      nucleusColor = DEFAULT_NUCLEUS_COLOR,
    } = options;

    this._radius = radius;
    this._shape = shape;
    this._width = width ?? 2 * radius;
    this._height = height ?? 1.4 * radius;
    this._organelleSpecs = organelles.map((o) => ({ ...o }));
    this._nucleusRadius = nucleusRadius ?? 0.35 * radius;
    this._showNucleus = showNucleus;
    this._labels = labels;
    this._labelFontSize = labelFontSize;
    this._colors = { ...colors };
    this._membraneColor = membraneColor;
    this._nucleusColor = nucleusColor;

    this.organellesGroup = new VGroup();
    this.labelsGroup = new VGroup();

    this.membrane = this._buildMembrane();
    this.nucleus = this._buildNucleus();
    this._buildOrganelles();

    this.add(this.membrane);
    if (this.nucleus) {
      this.add(this.nucleus);
    }
    this.add(this.organellesGroup);
    this.add(this.labelsGroup);
  }

  /** Build the membrane as a circle or an ellipse. */
  protected _buildMembrane(): VMobject {
    if (this._shape === 'ellipse') {
      return new Ellipse({
        width: this._width,
        height: this._height,
        color: this._membraneColor,
        fillOpacity: 0.08,
        strokeWidth: DEFAULT_STROKE_WIDTH,
      });
    }
    return new Circle({
      radius: this._radius,
      color: this._membraneColor,
      fillOpacity: 0.08,
      strokeWidth: DEFAULT_STROKE_WIDTH,
    });
  }

  /** Build the nucleus, or null when it is turned off. */
  protected _buildNucleus(): Circle | null {
    if (!this._showNucleus) {
      return null;
    }
    return new Circle({
      radius: this._nucleusRadius,
      color: this._nucleusColor,
      fillOpacity: 0.5,
      strokeWidth: DEFAULT_STROKE_WIDTH,
    });
  }

  /** Auto position for an organelle on a ring between the nucleus and membrane. */
  protected _ringPosition(index: number, count: number): Vector3Tuple {
    if (count <= 0) {
      return [0, 0, 0];
    }
    const ringRadius = (this._nucleusRadius + this._radius) / 2;
    const angle = (2 * Math.PI * index) / count + Math.PI / 2;
    return [ringRadius * Math.cos(angle), ringRadius * Math.sin(angle), 0];
  }

  /** Build every organelle shape and label, and add them to their groups. */
  protected _buildOrganelles(): void {
    const count = this._organelleSpecs.length;
    this._organelleSpecs.forEach((spec, i) => {
      const position = spec.position ?? this._ringPosition(i, count);
      const color = spec.color ?? organelleColor(spec.name, this._colors);
      const shape = this._buildOrganelleShape(spec, color);
      shape.moveTo(position);
      this.organellesGroup.add(shape);

      const label = this._buildOrganelleLabel(spec, position);
      if (label) {
        this.labelsGroup.add(label);
      }
      this._organelles.push({ name: spec.name, shape, label, color, position });
    });
  }

  /** Build one organelle shape (a circle or an ellipse) at the origin. */
  protected _buildOrganelleShape(spec: OrganelleSpec, color: string): VMobject {
    const shapeKind = spec.shape ?? 'circle';
    if (shapeKind === 'ellipse') {
      return new Ellipse({
        width: spec.width ?? 0.5 * this._radius,
        height: spec.height ?? 0.25 * this._radius,
        color,
        fillOpacity: 0.7,
        strokeWidth: 2,
      });
    }
    return new Circle({
      radius: spec.radius ?? 0.2 * this._radius,
      color,
      fillOpacity: 0.7,
      strokeWidth: 2,
    });
  }

  /** Build the label for an organelle, or null when labels are off or empty. */
  protected _buildOrganelleLabel(spec: OrganelleSpec, position: Vector3Tuple): Text | null {
    if (!this._labels) {
      return null;
    }
    const text = spec.label ?? spec.name;
    if (text.length === 0) {
      return null;
    }
    const label = new Text({ text, fontSize: this._labelFontSize });
    label.moveTo(position);
    return label;
  }

  // ========== Accessors ==========

  /** Get the membrane mobject. */
  getMembrane(): VMobject {
    return this.membrane;
  }

  /** Get the nucleus mobject, or null when it is turned off. */
  getNucleus(): Circle | null {
    return this.nucleus;
  }

  /** Get all resolved organelles, in input order. */
  getOrganelles(): OrganelleRender[] {
    return [...this._organelles];
  }

  /** Get the resolved organelle at an index, or undefined. */
  getOrganelle(index: number): OrganelleRender | undefined {
    return this._organelles[index];
  }

  /** The number of organelles. */
  get numOrganelles(): number {
    return this._organelles.length;
  }

  override copy(): Cell {
    const clone = new Cell({
      radius: this._radius,
      shape: this._shape,
      width: this._width,
      height: this._height,
      organelles: this._organelleSpecs.map((o) => ({ ...o })),
      nucleusRadius: this._nucleusRadius,
      showNucleus: this._showNucleus,
      labels: this._labels,
      labelFontSize: this._labelFontSize,
      colors: { ...this._colors },
      membraneColor: this._membraneColor,
      nucleusColor: this._nucleusColor,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}

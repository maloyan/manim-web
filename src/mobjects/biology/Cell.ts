/**
 * Cell - a 2D cell diagram.
 *
 * A cell is a membrane (a circle or an ellipse with a phospholipid-bilayer
 * double outline and a soft cytoplasm fill), an optional nucleus (a tinted disc
 * with a nuclear-envelope ring and a nucleolus), and a set of organelles. Each
 * organelle is a realistic composite shape (a mitochondrion with cristae, a
 * stacked golgi, a ribosome cluster, and so on) with an optional text label.
 * Organelles are placed at an explicit position or auto-arranged on a ring
 * between the nucleus and the membrane.
 *
 * The cell is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const cell = new Cell({
 *   radius: 2,
 *   organelles: [
 *     { name: 'mitochondrion' },
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
import { Dot } from '../geometry/Dot';
import { Text } from '../text/Text';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { interpolateColor } from '../../utils/color';
import { organelleColor } from './biologyColors';
import { buildOrganelleByName } from './cellParts';
import { CellOptions, CellShape, OrganelleSpec, OrganelleRender } from './biologyTypes';

/** Default membrane stroke color (a green). */
const DEFAULT_MEMBRANE_COLOR = '#66BB6A';

/** Default nucleus fill color (a purple). */
const DEFAULT_NUCLEUS_COLOR = '#7E57C2';

/** Scale of the inner bilayer outline relative to the membrane. */
const BILAYER_INNER_SCALE = 0.955;

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
  protected _cytoplasmOpacity: number;
  protected _organelleDetail: boolean;

  /** The resolved organelles, in input order. */
  protected _organelles: OrganelleRender[] = [];

  /** The membrane mobject (a Circle or an Ellipse). */
  readonly membrane: VMobject;
  /** The inner phospholipid-bilayer outline, just inside the membrane. */
  readonly innerMembrane: VMobject;
  /** The nucleus disc, or null when showNucleus is false. */
  readonly nucleus: Circle | null;
  /** The nucleus envelope, tint and nucleolus, or null when showNucleus is false. */
  readonly nucleusGroup: VGroup | null;
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
      labelFontSize = 18,
      colors = {},
      membraneColor = DEFAULT_MEMBRANE_COLOR,
      nucleusColor = DEFAULT_NUCLEUS_COLOR,
      cytoplasmOpacity = 0.1,
      organelleDetail = true,
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
    this._cytoplasmOpacity = cytoplasmOpacity;
    this._organelleDetail = organelleDetail;

    this.organellesGroup = new VGroup();
    this.labelsGroup = new VGroup();

    this.membrane = this._buildMembrane();
    this.innerMembrane = this._buildInnerMembrane();
    const nucleus = this._buildNucleus();
    this.nucleus = nucleus.disc;
    this.nucleusGroup = nucleus.group;
    this._buildOrganelles();

    // Back to front: cytoplasm, bilayer, nucleus, organelles, labels.
    this.add(this.membrane);
    this.add(this.innerMembrane);
    if (this.nucleusGroup) {
      this.add(this.nucleusGroup);
    }
    this.add(this.organellesGroup);
    this.add(this.labelsGroup);
  }

  /** Build a membrane-shaped Circle or Ellipse at the given size scale. */
  protected _buildMembraneShape(scale: number, fillOpacity: number, strokeWidth: number): VMobject {
    if (this._shape === 'ellipse') {
      return new Ellipse({
        width: this._width * scale,
        height: this._height * scale,
        color: this._membraneColor,
        fillOpacity,
        strokeWidth,
      });
    }
    return new Circle({
      radius: this._radius * scale,
      color: this._membraneColor,
      fillOpacity,
      strokeWidth,
    });
  }

  /** Build the membrane: the outer boundary with a soft cytoplasm fill. */
  protected _buildMembrane(): VMobject {
    return this._buildMembraneShape(1, this._cytoplasmOpacity, DEFAULT_STROKE_WIDTH * 1.1);
  }

  /** Build the inner bilayer outline, a thinner ring just inside the membrane. */
  protected _buildInnerMembrane(): VMobject {
    const inner = this._buildMembraneShape(BILAYER_INNER_SCALE, 0, 2);
    inner.setStrokeOpacity(0.5);
    return inner;
  }

  /** Build the nucleus disc, envelope, tint and nucleolus, or nulls when off. */
  protected _buildNucleus(): { disc: Circle | null; group: VGroup | null } {
    if (!this._showNucleus) {
      return { disc: null, group: null };
    }
    const r = this._nucleusRadius;
    const disc = new Circle({
      radius: r,
      color: this._nucleusColor,
      fillOpacity: 0.32,
      strokeWidth: 0,
    });
    // A denser inner disc fakes a radial tint toward the center.
    const innerTint = new Circle({
      radius: 0.6 * r,
      color: this._nucleusColor,
      fillOpacity: 0.28,
      strokeWidth: 0,
    });
    const envelope = new Circle({
      radius: r,
      color: interpolateColor(this._nucleusColor, '#000000', 0.3),
      fillOpacity: 0,
      strokeWidth: 3,
    });
    const nucleolus = new Dot({
      radius: 0.26 * r,
      color: interpolateColor(this._nucleusColor, '#000000', 0.35),
      fillOpacity: 0.9,
    });
    nucleolus.moveTo([0.18 * r, 0.12 * r, 0]);
    const group = new VGroup(disc, innerTint, envelope, nucleolus);
    return { disc, group };
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

  /**
   * Build one organelle shape.
   *
   * An explicit `shape` makes a plain circle or ellipse (honored for backward
   * compatibility). Otherwise, when detail is on, the name picks a realistic
   * composite; when detail is off, a plain soft circle.
   */
  protected _buildOrganelleShape(spec: OrganelleSpec, color: string): VMobject {
    if (spec.shape !== undefined) {
      return this._buildPrimitiveOrganelle(spec, color);
    }
    if (!this._organelleDetail) {
      return this._buildPrimitiveOrganelle({ ...spec, shape: 'circle' }, color);
    }
    return buildOrganelleByName(spec.name, color, this._radius);
  }

  /** Build a plain circle or ellipse organelle at the origin. */
  protected _buildPrimitiveOrganelle(spec: OrganelleSpec, color: string): VMobject {
    const shapeKind = spec.shape ?? 'circle';
    const outline = interpolateColor(color, '#000000', 0.32);
    if (shapeKind === 'ellipse') {
      const ellipse = new Ellipse({
        width: spec.width ?? 0.6 * this._radius,
        height: spec.height ?? 0.3 * this._radius,
        color,
        fillOpacity: 0.6,
        strokeWidth: 2.5,
      });
      ellipse.strokeColor = outline;
      return ellipse;
    }
    const circle = new Circle({
      radius: spec.radius ?? 0.18 * this._radius,
      color,
      fillOpacity: 0.6,
      strokeWidth: 2.5,
    });
    circle.strokeColor = outline;
    return circle;
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
    // Sit the label just below the organelle so it does not cover the shape.
    const gap = 0.28 * this._radius;
    label.moveTo([position[0], position[1] - gap, position[2]]);
    return label;
  }

  // ========== Accessors ==========

  /** Get the membrane mobject. */
  getMembrane(): VMobject {
    return this.membrane;
  }

  /** Get the nucleus disc mobject, or null when it is turned off. */
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
      cytoplasmOpacity: this._cytoplasmOpacity,
      organelleDetail: this._organelleDetail,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}

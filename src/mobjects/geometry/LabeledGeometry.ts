/**
 * Labeled Geometry Mobjects
 *
 * Composite mobjects that combine basic geometry with text labels.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { Line, LineOptions } from './Line';
import { Arrow, ArrowOptions } from './Arrow';
import { Dot, DotOptions } from './Dot';
import { Circle } from './Circle';
import { Text } from '../text/Text';
import { BLUE, WHITE, YELLOW } from '../../constants';

/**
 * Direction constants for label positioning
 */
export type LabelDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UL' | 'UR' | 'DL' | 'DR';

/**
 * Convert direction string to vector
 */
function directionToVector(direction: LabelDirection): Vector3Tuple {
  switch (direction) {
    case 'UP': return [0, 1, 0];
    case 'DOWN': return [0, -1, 0];
    case 'LEFT': return [-1, 0, 0];
    case 'RIGHT': return [1, 0, 0];
    case 'UL': return [-0.707, 0.707, 0];
    case 'UR': return [0.707, 0.707, 0];
    case 'DL': return [-0.707, -0.707, 0];
    case 'DR': return [0.707, -0.707, 0];
  }
}

/**
 * Label orientation options for lines
 */
export type LabelOrientation = 'parallel' | 'perpendicular' | 'horizontal';

/**
 * Options for creating a LabeledLine
 */
export interface LabeledLineOptions extends Omit<LineOptions, 'start' | 'end'> {
  /** Start point of the line. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point of the line. Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /** Text label content */
  label: string;
  /** Position of label along line (0 = start, 0.5 = midpoint, 1 = end). Default: 0.5 */
  labelPosition?: number;
  /** Label orientation relative to line. Default: 'parallel' */
  labelOrientation?: LabelOrientation;
  /** Distance of label from line. Default: 0.2 */
  labelOffset?: number;
  /** Font size for label. Default: 36 */
  labelFontSize?: number;
  /** Color for label text. Default: same as line color */
  labelColor?: string;
}

/**
 * LabeledLine - A line with an attached text label
 *
 * Creates a line segment with a text label positioned at a specified point
 * along the line (default: midpoint). The label can be oriented parallel
 * or perpendicular to the line.
 *
 * @example
 * ```typescript
 * // Create a labeled line at midpoint
 * const line = new LabeledLine({
 *   start: [-2, 0, 0],
 *   end: [2, 0, 0],
 *   label: 'Distance = 4'
 * });
 *
 * // Label perpendicular to line
 * const perpLine = new LabeledLine({
 *   start: [0, -1, 0],
 *   end: [0, 2, 0],
 *   label: 'Height',
 *   labelOrientation: 'perpendicular',
 *   labelOffset: 0.3
 * });
 * ```
 */
export class LabeledLine extends VGroup {
  private _line: Line;
  private _label: Text;
  private _labelPosition: number;
  private _labelOrientation: LabelOrientation;
  private _labelOffset: number;

  constructor(options: LabeledLineOptions) {
    super();

    const {
      start = [0, 0, 0],
      end = [1, 0, 0],
      label,
      labelPosition = 0.5,
      labelOrientation = 'parallel',
      labelOffset = 0.2,
      labelFontSize = 36,
      labelColor,
      color = BLUE,
      strokeWidth,
    } = options;

    this._labelPosition = labelPosition;
    this._labelOrientation = labelOrientation;
    this._labelOffset = labelOffset;

    // Create the line
    this._line = new Line({
      start,
      end,
      color,
      strokeWidth,
    });

    // Create the label
    this._label = new Text({
      text: label,
      fontSize: labelFontSize,
      color: labelColor ?? color,
    });

    // Add to group
    this.add(this._line, this._label);

    // Position the label
    this._updateLabelPosition();
  }

  /**
   * Update the label position and orientation based on line geometry
   */
  private _updateLabelPosition(): void {
    // Get position along the line
    const point = this._line.pointAlongPath(this._labelPosition);

    // Get line direction and perpendicular
    const direction = this._line.getDirection();
    const perpendicular: Vector3Tuple = [-direction[1], direction[0], 0];

    // Calculate offset position
    const offsetPoint: Vector3Tuple = [
      point[0] + perpendicular[0] * this._labelOffset,
      point[1] + perpendicular[1] * this._labelOffset,
      point[2] + perpendicular[2] * this._labelOffset,
    ];

    // Position the label
    this._label.moveTo(offsetPoint);

    // Set rotation based on orientation
    const lineAngle = this._line.getAngle();
    switch (this._labelOrientation) {
      case 'parallel':
        // Keep text readable (flip if upside down)
        if (lineAngle > Math.PI / 2 || lineAngle < -Math.PI / 2) {
          this._label.rotation.z = lineAngle + Math.PI;
        } else {
          this._label.rotation.z = lineAngle;
        }
        break;
      case 'perpendicular':
        this._label.rotation.z = lineAngle + Math.PI / 2;
        // Keep text readable
        if (this._label.rotation.z > Math.PI / 2 || this._label.rotation.z < -Math.PI / 2) {
          this._label.rotation.z += Math.PI;
        }
        break;
      case 'horizontal':
        this._label.rotation.z = 0;
        break;
    }
  }

  /**
   * Get the underlying Line mobject
   */
  getLine(): Line {
    return this._line;
  }

  /**
   * Get the Text label mobject
   */
  getLabel(): Text {
    return this._label;
  }

  /**
   * Set the label text
   */
  setLabelText(text: string): this {
    this._label.setText(text);
    return this;
  }

  /**
   * Set the label position along the line
   */
  setLabelPosition(position: number): this {
    this._labelPosition = position;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Set the label offset from the line
   */
  setLabelOffset(offset: number): this {
    this._labelOffset = offset;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Update line endpoints and reposition label
   */
  setEndpoints(start: Vector3Tuple, end: Vector3Tuple): this {
    this._line.setStart(start);
    this._line.setEnd(end);
    this._updateLabelPosition();
    return this;
  }

  /**
   * Create a copy of this LabeledLine
   */
  protected override _createCopy(): LabeledLine {
    return new LabeledLine({
      start: this._line.getStart(),
      end: this._line.getEnd(),
      label: this._label.getText(),
      labelPosition: this._labelPosition,
      labelOrientation: this._labelOrientation,
      labelOffset: this._labelOffset,
      labelFontSize: this._label.getFontSize(),
      labelColor: this._label.color,
      color: this._line.color,
      strokeWidth: this._line.strokeWidth,
    });
  }
}

/**
 * Options for creating a LabeledArrow
 */
export interface LabeledArrowOptions extends Omit<ArrowOptions, 'start' | 'end'> {
  /** Start point of the arrow. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point of the arrow (where the tip points). Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /** Text label content */
  label: string;
  /** Position of label along arrow (0 = start, 0.5 = midpoint, 1 = end). Default: 0.5 */
  labelPosition?: number;
  /** Label orientation relative to arrow. Default: 'parallel' */
  labelOrientation?: LabelOrientation;
  /** Distance of label from arrow. Default: 0.25 */
  labelOffset?: number;
  /** Font size for label. Default: 36 */
  labelFontSize?: number;
  /** Color for label text. Default: same as arrow color */
  labelColor?: string;
}

/**
 * LabeledArrow - An arrow with an attached text label
 *
 * Creates an arrow with a text label positioned near the arrow body.
 *
 * @example
 * ```typescript
 * // Create a labeled arrow
 * const arrow = new LabeledArrow({
 *   start: [-2, 0, 0],
 *   end: [2, 0, 0],
 *   label: 'Force F'
 * });
 *
 * // Label near the tip
 * const tipArrow = new LabeledArrow({
 *   start: [0, 0, 0],
 *   end: [3, 1, 0],
 *   label: 'v',
 *   labelPosition: 0.7
 * });
 * ```
 */
export class LabeledArrow extends VGroup {
  private _arrow: Arrow;
  private _label: Text;
  private _labelPosition: number;
  private _labelOrientation: LabelOrientation;
  private _labelOffset: number;

  constructor(options: LabeledArrowOptions) {
    super();

    const {
      start = [0, 0, 0],
      end = [1, 0, 0],
      label,
      labelPosition = 0.5,
      labelOrientation = 'parallel',
      labelOffset = 0.25,
      labelFontSize = 36,
      labelColor,
      color = BLUE,
      strokeWidth,
      tipLength,
      tipWidth,
    } = options;

    this._labelPosition = labelPosition;
    this._labelOrientation = labelOrientation;
    this._labelOffset = labelOffset;

    // Create the arrow
    this._arrow = new Arrow({
      start,
      end,
      color,
      strokeWidth,
      tipLength,
      tipWidth,
    });

    // Create the label
    this._label = new Text({
      text: label,
      fontSize: labelFontSize,
      color: labelColor ?? color,
    });

    // Add to group
    this.add(this._arrow, this._label);

    // Position the label
    this._updateLabelPosition();
  }

  /**
   * Update the label position and orientation based on arrow geometry
   */
  private _updateLabelPosition(): void {
    const start = this._arrow.getStart();
    const end = this._arrow.getEnd();

    // Get position along the arrow (interpolate between start and end)
    const t = this._labelPosition;
    const point: Vector3Tuple = [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
      start[2] + (end[2] - start[2]) * t,
    ];

    // Get arrow direction and perpendicular
    const direction = this._arrow.getDirection();
    const perpendicular: Vector3Tuple = [-direction[1], direction[0], 0];

    // Calculate offset position
    const offsetPoint: Vector3Tuple = [
      point[0] + perpendicular[0] * this._labelOffset,
      point[1] + perpendicular[1] * this._labelOffset,
      point[2] + perpendicular[2] * this._labelOffset,
    ];

    // Position the label
    this._label.moveTo(offsetPoint);

    // Set rotation based on orientation
    const arrowAngle = this._arrow.getAngle();
    switch (this._labelOrientation) {
      case 'parallel':
        // Keep text readable (flip if upside down)
        if (arrowAngle > Math.PI / 2 || arrowAngle < -Math.PI / 2) {
          this._label.rotation.z = arrowAngle + Math.PI;
        } else {
          this._label.rotation.z = arrowAngle;
        }
        break;
      case 'perpendicular':
        this._label.rotation.z = arrowAngle + Math.PI / 2;
        // Keep text readable
        if (this._label.rotation.z > Math.PI / 2 || this._label.rotation.z < -Math.PI / 2) {
          this._label.rotation.z += Math.PI;
        }
        break;
      case 'horizontal':
        this._label.rotation.z = 0;
        break;
    }
  }

  /**
   * Get the underlying Arrow mobject
   */
  getArrow(): Arrow {
    return this._arrow;
  }

  /**
   * Get the Text label mobject
   */
  getLabel(): Text {
    return this._label;
  }

  /**
   * Set the label text
   */
  setLabelText(text: string): this {
    this._label.setText(text);
    return this;
  }

  /**
   * Set the label position along the arrow
   */
  setLabelPosition(position: number): this {
    this._labelPosition = position;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Set the label offset from the arrow
   */
  setLabelOffset(offset: number): this {
    this._labelOffset = offset;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Update arrow endpoints and reposition label
   */
  setEndpoints(start: Vector3Tuple, end: Vector3Tuple): this {
    this._arrow.setStart(start);
    this._arrow.setEnd(end);
    this._updateLabelPosition();
    return this;
  }

  /**
   * Create a copy of this LabeledArrow
   */
  protected override _createCopy(): LabeledArrow {
    return new LabeledArrow({
      start: this._arrow.getStart(),
      end: this._arrow.getEnd(),
      label: this._label.getText(),
      labelPosition: this._labelPosition,
      labelOrientation: this._labelOrientation,
      labelOffset: this._labelOffset,
      labelFontSize: this._label.getFontSize(),
      labelColor: this._label.color,
      color: this._arrow.color,
      strokeWidth: this._arrow.strokeWidth,
      tipLength: this._arrow.getTipLength(),
      tipWidth: this._arrow.getTipWidth(),
    });
  }
}

/**
 * Options for creating a LabeledDot
 */
export interface LabeledDotOptions extends Omit<DotOptions, 'point'> {
  /** Position of the dot. Default: [0, 0, 0] */
  point?: Vector3Tuple;
  /** Text label content */
  label: string;
  /** Direction of label relative to dot. Default: 'UP' */
  labelDirection?: LabelDirection;
  /** Distance of label from dot center. Default: 0.3 */
  labelOffset?: number;
  /** Font size for label. Default: 36 */
  labelFontSize?: number;
  /** Color for label text. Default: white */
  labelColor?: string;
}

/**
 * LabeledDot - A dot with an attached text label
 *
 * Creates a small filled circle (dot) with a text label positioned
 * in a specified direction relative to the dot.
 *
 * @example
 * ```typescript
 * // Create a labeled point
 * const pointA = new LabeledDot({
 *   point: [1, 2, 0],
 *   label: 'A',
 *   labelDirection: 'UR'
 * });
 *
 * // Label below the dot
 * const pointB = new LabeledDot({
 *   point: [-1, 0, 0],
 *   label: 'B',
 *   labelDirection: 'DOWN',
 *   labelOffset: 0.4
 * });
 * ```
 */
export class LabeledDot extends VGroup {
  private _dot: Dot;
  private _label: Text;
  private _labelDirection: LabelDirection;
  private _labelOffset: number;

  constructor(options: LabeledDotOptions) {
    super();

    const {
      point = [0, 0, 0],
      label,
      labelDirection = 'UP',
      labelOffset = 0.3,
      labelFontSize = 36,
      labelColor = WHITE,
      radius,
      color,
      fillOpacity,
      strokeWidth,
    } = options;

    this._labelDirection = labelDirection;
    this._labelOffset = labelOffset;

    // Create the dot
    this._dot = new Dot({
      point,
      radius,
      color,
      fillOpacity,
      strokeWidth,
    });

    // Create the label
    this._label = new Text({
      text: label,
      fontSize: labelFontSize,
      color: labelColor,
    });

    // Add to group
    this.add(this._dot, this._label);

    // Position the label
    this._updateLabelPosition();
  }

  /**
   * Update the label position based on dot position and direction
   */
  private _updateLabelPosition(): void {
    const center = this._dot.getCenter();
    const direction = directionToVector(this._labelDirection);

    // Calculate label position
    const labelPos: Vector3Tuple = [
      center[0] + direction[0] * this._labelOffset,
      center[1] + direction[1] * this._labelOffset,
      center[2] + direction[2] * this._labelOffset,
    ];

    this._label.moveTo(labelPos);
  }

  /**
   * Get the underlying Dot mobject
   */
  getDot(): Dot {
    return this._dot;
  }

  /**
   * Get the Text label mobject
   */
  getLabel(): Text {
    return this._label;
  }

  /**
   * Move the dot and label to a new position
   */
  moveTo(point: Vector3Tuple): this {
    this._dot.moveTo(point);
    this._updateLabelPosition();
    return this;
  }

  /**
   * Set the label text
   */
  setLabelText(text: string): this {
    this._label.setText(text);
    return this;
  }

  /**
   * Set the label direction
   */
  setLabelDirection(direction: LabelDirection): this {
    this._labelDirection = direction;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Set the label offset from the dot
   */
  setLabelOffset(offset: number): this {
    this._labelOffset = offset;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Get the position of the dot
   */
  getPoint(): Vector3Tuple {
    return this._dot.getPoint();
  }

  /**
   * Create a copy of this LabeledDot
   */
  protected override _createCopy(): LabeledDot {
    return new LabeledDot({
      point: this._dot.getPoint(),
      label: this._label.getText(),
      labelDirection: this._labelDirection,
      labelOffset: this._labelOffset,
      labelFontSize: this._label.getFontSize(),
      labelColor: this._label.color,
      radius: this._dot.getRadius(),
      color: this._dot.color,
      fillOpacity: this._dot.fillOpacity,
      strokeWidth: this._dot.strokeWidth,
    });
  }
}

/**
 * Options for creating an AnnotationDot
 */
export interface AnnotationDotOptions extends Omit<DotOptions, 'point'> {
  /** Position of the dot. Default: [0, 0, 0] */
  point?: Vector3Tuple;
  /** Optional text label content */
  label?: string;
  /** Direction of label relative to dot. Default: 'UR' */
  labelDirection?: LabelDirection;
  /** Distance of label from dot center. Default: 0.4 */
  labelOffset?: number;
  /** Font size for label. Default: 36 */
  labelFontSize?: number;
  /** Color for label text. Default: same as dot color */
  labelColor?: string;
  /** Whether to show outline/glow effect. Default: true */
  showOutline?: boolean;
  /** Color of the outline. Default: same as dot color with lower opacity */
  outlineColor?: string;
  /** Scale of the outline relative to dot. Default: 1.5 */
  outlineScale?: number;
  /** Opacity of the outline. Default: 0.3 */
  outlineOpacity?: number;
}

/**
 * AnnotationDot - A larger, more visible dot for annotations
 *
 * Creates a prominent dot with optional outline/glow effect and text label.
 * Useful for marking important points in visualizations.
 *
 * @example
 * ```typescript
 * // Create an annotation dot with glow
 * const annotDot = new AnnotationDot({
 *   point: [2, 1, 0],
 *   label: 'Critical Point',
 *   color: '#ff0000'
 * });
 *
 * // Without outline
 * const simpleAnnot = new AnnotationDot({
 *   point: [0, 0, 0],
 *   showOutline: false,
 *   label: 'Origin'
 * });
 * ```
 */
export class AnnotationDot extends VGroup {
  private _dot: Dot;
  private _outline: Circle | null = null;
  private _label: Text | null = null;
  private _labelDirection: LabelDirection;
  private _labelOffset: number;
  private _showOutline: boolean;

  constructor(options: AnnotationDotOptions = {}) {
    super();

    const {
      point = [0, 0, 0],
      label,
      labelDirection = 'UR',
      labelOffset = 0.4,
      labelFontSize = 36,
      labelColor,
      showOutline = true,
      outlineColor,
      outlineScale = 1.5,
      outlineOpacity = 0.3,
      radius = 0.12, // Larger default radius for annotation dots
      color = YELLOW,
      fillOpacity = 1,
      strokeWidth = 0,
    } = options;

    this._labelDirection = labelDirection;
    this._labelOffset = labelOffset;
    this._showOutline = showOutline;

    // Create outline first (behind the dot)
    if (showOutline) {
      this._outline = new Circle({
        radius: radius * outlineScale,
        color: outlineColor ?? color,
        fillOpacity: outlineOpacity,
        strokeWidth: 0,
        center: point,
      });
      this.add(this._outline);
    }

    // Create the main dot
    this._dot = new Dot({
      point,
      radius,
      color,
      fillOpacity,
      strokeWidth,
    });
    this.add(this._dot);

    // Create the label if provided
    if (label) {
      this._label = new Text({
        text: label,
        fontSize: labelFontSize,
        color: labelColor ?? color,
      });
      this.add(this._label);
      this._updateLabelPosition();
    }
  }

  /**
   * Update the label position based on dot position and direction
   */
  private _updateLabelPosition(): void {
    if (!this._label) return;

    const center = this._dot.getCenter();
    const direction = directionToVector(this._labelDirection);

    // Calculate label position
    const labelPos: Vector3Tuple = [
      center[0] + direction[0] * this._labelOffset,
      center[1] + direction[1] * this._labelOffset,
      center[2] + direction[2] * this._labelOffset,
    ];

    this._label.moveTo(labelPos);
  }

  /**
   * Get the underlying Dot mobject
   */
  getDot(): Dot {
    return this._dot;
  }

  /**
   * Get the outline Circle (if enabled)
   */
  getOutline(): Circle | null {
    return this._outline;
  }

  /**
   * Get the Text label mobject (if set)
   */
  getLabel(): Text | null {
    return this._label;
  }

  /**
   * Move the dot (and outline/label) to a new position
   */
  moveTo(point: Vector3Tuple): this {
    this._dot.moveTo(point);
    if (this._outline) {
      this._outline.setCircleCenter(point);
    }
    if (this._label) {
      this._updateLabelPosition();
    }
    return this;
  }

  /**
   * Set the label text
   */
  setLabelText(text: string): this {
    if (this._label) {
      this._label.setText(text);
    } else {
      // Create label if it doesn't exist
      this._label = new Text({
        text,
        fontSize: 36,
        color: this._dot.color,
      });
      this.add(this._label);
      this._updateLabelPosition();
    }
    return this;
  }

  /**
   * Set the label direction
   */
  setLabelDirection(direction: LabelDirection): this {
    this._labelDirection = direction;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Set the label offset from the dot
   */
  setLabelOffset(offset: number): this {
    this._labelOffset = offset;
    this._updateLabelPosition();
    return this;
  }

  /**
   * Get the position of the dot
   */
  getPoint(): Vector3Tuple {
    return this._dot.getPoint();
  }

  /**
   * Show or hide the outline
   */
  setShowOutline(show: boolean): this {
    if (show && !this._outline) {
      // Create outline
      this._outline = new Circle({
        radius: this._dot.getRadius() * 1.5,
        color: this._dot.color,
        fillOpacity: 0.3,
        strokeWidth: 0,
        center: this._dot.getPoint(),
      });
      // Insert at beginning (behind dot)
      this.children.unshift(this._outline);
    } else if (!show && this._outline) {
      // Remove outline
      this.remove(this._outline);
      this._outline = null;
    }
    this._showOutline = show;
    return this;
  }

  /**
   * Create a copy of this AnnotationDot
   */
  protected override _createCopy(): AnnotationDot {
    return new AnnotationDot({
      point: this._dot.getPoint(),
      label: this._label?.getText(),
      labelDirection: this._labelDirection,
      labelOffset: this._labelOffset,
      labelFontSize: this._label?.getFontSize() ?? 36,
      labelColor: this._label?.color,
      showOutline: this._showOutline,
      outlineColor: this._outline?.color,
      outlineScale: this._outline ? this._outline.getRadius() / this._dot.getRadius() : 1.5,
      outlineOpacity: this._outline?.fillOpacity ?? 0.3,
      radius: this._dot.getRadius(),
      color: this._dot.color,
      fillOpacity: this._dot.fillOpacity,
      strokeWidth: this._dot.strokeWidth,
    });
  }
}

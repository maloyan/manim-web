/**
 * Variable - A mobject that displays a variable name with its value
 *
 * Combines a label (typically a math symbol) with a DecimalNumber to show
 * something like "x = 5" that can be animated.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { DecimalNumber } from './DecimalNumber';
import { ValueTracker } from '../value-tracker';
import { MathTex } from './MathTex';

/**
 * Options for creating a Variable mobject
 */
export interface VariableOptions {
  /** The variable name/label (rendered as LaTeX). Example: 'x', '\\theta', 'time' */
  label: string;
  /** Initial numeric value. Default: 0 */
  value?: number;
  /** Options for the decimal number display */
  numDecimalPlaces?: number;
  /** Whether to show ellipsis after the value. Default: false */
  showEllipsis?: boolean;
  /** Whether to show + sign for positive values. Default: false */
  includeSign?: boolean;
  /** Color for the label. Default: '#ffffff' */
  labelColor?: string;
  /** Color for the value. Default: '#ffffff' */
  valueColor?: string;
  /** Font size for the value. Default: 48 */
  fontSize?: number;
  /** Buffer between label and equals sign. Default: 0.1 */
  labelBuff?: number;
  /** Buffer between equals sign and value. Default: 0.1 */
  valueBuff?: number;
}

/**
 * Variable - Displays a labeled variable with animatable value
 *
 * Creates a composite mobject showing "label = value" where the value
 * can be animated using a ValueTracker or direct setValue calls.
 *
 * @example
 * ```typescript
 * // Create a variable display
 * const x = new Variable({ label: 'x', value: 5 });
 *
 * // Create with LaTeX label
 * const theta = new Variable({
 *   label: '\\theta',
 *   value: Math.PI,
 *   numDecimalPlaces: 3
 * });
 *
 * // Animate value change using tracker
 * const tracker = x.tracker;
 * x.addUpdater(() => x.setValue(tracker.getValue()));
 * tracker.setValue(100); // Animate to 100
 *
 * // Direct value change
 * x.setValue(42);
 * ```
 */
export class Variable extends Mobject {
  protected _label: string;
  protected _value: number;
  protected _numDecimalPlaces: number;
  protected _showEllipsis: boolean;
  protected _includeSign: boolean;
  protected _labelColor: string;
  protected _valueColor: string;
  protected _fontSize: number;
  protected _labelBuff: number;
  protected _valueBuff: number;

  /** The label mobject (LaTeX rendered) */
  protected _labelMobject: MathTex;

  /** The equals sign mobject */
  protected _equalsMobject: MathTex;

  /** The value display mobject */
  protected _numberMobject: DecimalNumber;

  /** ValueTracker for animations */
  protected _tracker: ValueTracker;

  constructor(options: VariableOptions) {
    super();

    const {
      label,
      value = 0,
      numDecimalPlaces = 2,
      showEllipsis = false,
      includeSign = false,
      labelColor = '#ffffff',
      valueColor = '#ffffff',
      fontSize = 48,
      labelBuff = 0.1,
      valueBuff = 0.1,
    } = options;

    this._label = label;
    this._value = value;
    this._numDecimalPlaces = numDecimalPlaces;
    this._showEllipsis = showEllipsis;
    this._includeSign = includeSign;
    this._labelColor = labelColor;
    this._valueColor = valueColor;
    this._fontSize = fontSize;
    this._labelBuff = labelBuff;
    this._valueBuff = valueBuff;

    // Create the ValueTracker
    this._tracker = new ValueTracker(value);

    // Create label (rendered as LaTeX for proper math formatting)
    this._labelMobject = new MathTex({
      latex: label,
      color: labelColor,
      fontSize: fontSize,
    });

    // Create equals sign
    this._equalsMobject = new MathTex({
      latex: '=',
      color: labelColor,
      fontSize: fontSize,
    });

    // Create number display
    this._numberMobject = new DecimalNumber({
      value: value,
      numDecimalPlaces: numDecimalPlaces,
      showEllipsis: showEllipsis,
      includeSign: includeSign,
      color: valueColor,
      fontSize: fontSize,
      edgeToFix: 'left', // Keep value aligned when digits change
    });

    // Add submobjects
    this.add(this._labelMobject, this._equalsMobject, this._numberMobject);

    // Arrange horizontally (catch errors to avoid unhandled rejections
    // when rendering fails in non-browser environments)
    this._arrangeSubmobjects().catch(() => {});
  }

  /**
   * Arrange the label, equals sign, and value horizontally
   */
  protected async _arrangeSubmobjects(): Promise<void> {
    // Wait for LaTeX rendering to complete
    await this._labelMobject.waitForRender();
    await this._equalsMobject.waitForRender();

    // Get dimensions
    const labelDims = this._labelMobject.getDimensions();
    const equalsDims = this._equalsMobject.getDimensions();
    const numberWidth = this._numberMobject.getWidth();

    // Calculate total width
    const totalWidth = labelDims[0] + this._labelBuff + equalsDims[0] + this._valueBuff + numberWidth;

    // Position from left to right, centered at origin
    let currentX = -totalWidth / 2;

    // Position label
    this._labelMobject.position.x = currentX + labelDims[0] / 2;
    currentX += labelDims[0] + this._labelBuff;

    // Position equals sign
    this._equalsMobject.position.x = currentX + equalsDims[0] / 2;
    currentX += equalsDims[0] + this._valueBuff;

    // Position number
    this._numberMobject.position.x = currentX + numberWidth / 2;

    this._markDirty();
  }

  /**
   * Get the current value
   */
  getValue(): number {
    return this._value;
  }

  /**
   * Set the displayed value
   * @param value - New value to display
   * @returns this for chaining
   */
  setValue(value: number): this {
    this._value = value;
    this._tracker.setValue(value);
    this._numberMobject.setValue(value);
    this._markDirty();
    return this;
  }

  /**
   * Get the ValueTracker for this variable
   * Use this with animations to smoothly change the value
   */
  get tracker(): ValueTracker {
    return this._tracker;
  }

  /**
   * Get the label mobject
   */
  get labelMobject(): MathTex {
    return this._labelMobject;
  }

  /**
   * Get the equals sign mobject
   */
  get equalsMobject(): MathTex {
    return this._equalsMobject;
  }

  /**
   * Get the number mobject
   */
  get numberMobject(): DecimalNumber {
    return this._numberMobject;
  }

  /**
   * Set the label color
   * @param color - CSS color string
   * @returns this for chaining
   */
  setLabelColor(color: string): this {
    this._labelColor = color;
    this._labelMobject.setColor(color);
    this._equalsMobject.setColor(color);
    this._markDirty();
    return this;
  }

  /**
   * Set the value color
   * @param color - CSS color string
   * @returns this for chaining
   */
  setValueColor(color: string): this {
    this._valueColor = color;
    this._numberMobject.setColor(color);
    this._markDirty();
    return this;
  }

  /**
   * Set both label and value colors
   * @param color - CSS color string
   * @returns this for chaining
   */
  override setColor(color: string): this {
    this.setLabelColor(color);
    this.setValueColor(color);
    return this;
  }

  /**
   * Sync the displayed value with the tracker
   * Call this in an updater to animate the value
   */
  syncWithTracker(): this {
    const trackerValue = this._tracker.getValue();
    if (this._value !== trackerValue) {
      this._value = trackerValue;
      this._numberMobject.setValue(trackerValue);
      this._markDirty();
    }
    return this;
  }

  /**
   * Create the Three.js backing object
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Add child Three.js objects
    group.add(this._labelMobject.getThreeObject());
    group.add(this._equalsMobject.getThreeObject());
    group.add(this._numberMobject.getThreeObject());

    return group;
  }

  /**
   * Get the center of this Variable
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Wait for all submobjects to finish rendering
   */
  async waitForRender(): Promise<void> {
    await this._labelMobject.waitForRender();
    await this._equalsMobject.waitForRender();
    await this._arrangeSubmobjects();
  }

  /**
   * Create a copy of this Variable
   */
  protected _createCopy(): Variable {
    return new Variable({
      label: this._label,
      value: this._value,
      numDecimalPlaces: this._numDecimalPlaces,
      showEllipsis: this._showEllipsis,
      includeSign: this._includeSign,
      labelColor: this._labelColor,
      valueColor: this._valueColor,
      fontSize: this._fontSize,
      labelBuff: this._labelBuff,
      valueBuff: this._valueBuff,
    });
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    this._labelMobject.dispose();
    this._equalsMobject.dispose();
    this._numberMobject.dispose();
    super.dispose();
  }
}

export default Variable;

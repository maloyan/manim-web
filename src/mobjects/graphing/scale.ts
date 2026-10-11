import { MathTexImage } from '../text/MathTexImage';

/**
 * Scaling strategies for graphing, ported from ManimCE
 * (`manim/mobject/graphing/scale.py`).
 *
 * A scaling strategy maps axis values to scaled values (`function`) and back
 * (`inverseFunction`), and can emit custom axis labels (`getCustomLabels`).
 * `LinearBase` is the default. `LogBase` produces a logarithmic axis.
 */

/** Options accepted by {@link ScaleBase.getCustomLabels}. */
export interface GetCustomLabelsOptions {
  /** Number of decimal places shown in the exponent. Default: 0 */
  unitDecimalPlaces?: number;
  /** Font size for the label. Passed to {@link MathTexImage}. */
  fontSize?: number;
  /** Color for the label. Passed to {@link MathTexImage}. */
  color?: string;
}

/**
 * ScaleBase - base class for graphing scaling strategies.
 *
 * Mirrors ManimCE's `_ScaleBase`. Subclasses override {@link ScaleBase.function}
 * and {@link ScaleBase.inverseFunction}. Subclasses that set `customLabels`
 * override {@link ScaleBase.getCustomLabels}.
 */
export abstract class ScaleBase {
  /** Whether the strategy produces custom labels on a NumberLine. */
  readonly customLabels: boolean;

  constructor(customLabels = false) {
    this.customLabels = customLabels;
  }

  /** Scale a value. Must be implemented by a subclass. */
  abstract function(value: number): number;

  /** Inverse of {@link function}. Must be implemented by a subclass. */
  abstract inverseFunction(value: number): number;

  /**
   * Custom labels for the given tick values.
   *
   * Only strategies with `customLabels === true` implement this; the base
   * implementation throws, matching ManimCE's `NotImplementedError`.
   */
  getCustomLabels(_valRange: number[], _options: GetCustomLabelsOptions = {}): MathTexImage[] {
    throw new Error('getCustomLabels is not implemented for this scaling strategy');
  }
}

/**
 * LinearBase - the default scaling strategy.
 *
 * `function(value) = scaleFactor * value`, `inverseFunction(value) = value / scaleFactor`.
 */
export class LinearBase extends ScaleBase {
  /** The slope of the linear function. */
  readonly scaleFactor: number;

  constructor(scaleFactor = 1) {
    super(false);
    this.scaleFactor = scaleFactor;
  }

  function(value: number): number {
    return this.scaleFactor * value;
  }

  inverseFunction(value: number): number {
    return value / this.scaleFactor;
  }
}

/**
 * LogBase - logarithmic scaling strategy.
 *
 * `function(value) = base ** value`, `inverseFunction(value) = log_base(value)`.
 * For base 10: `function(2) === 100` and `inverseFunction(100) === 2`.
 */
export class LogBase extends ScaleBase {
  /** The base of the logarithm. */
  readonly base: number;

  constructor(base = 10, customLabels = true) {
    super(customLabels);
    this.base = base;
  }

  function(value: number): number {
    return this.base ** value;
  }

  inverseFunction(value: number): number {
    if (value <= 0) {
      throw new Error('log(0) is undefined. Make sure the value is in the domain of the function');
    }
    return Math.log(value) / Math.log(this.base);
  }

  /**
   * Produce labels of the form `base^{exponent}` (e.g. `10^{2}`), matching
   * ManimCE's `LogBase.get_custom_labels`.
   */
  override getCustomLabels(
    valRange: number[],
    options: GetCustomLabelsOptions = {},
  ): MathTexImage[] {
    const { unitDecimalPlaces = 0, fontSize, color } = options;
    return valRange.map((value) => {
      const exponent = this.inverseFunction(value).toFixed(unitDecimalPlaces);
      return new MathTexImage({
        latex: `${this.base}^{${exponent}}`,
        fontSize,
        color,
      });
    });
  }
}

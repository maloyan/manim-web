import { Group } from '../../core/Group';
import { Axes, AxesOptions } from './Axes';
import { Line } from '../geometry';

/**
 * Style configuration for background grid lines
 */
export interface BackgroundLineStyle {
  /** Stroke color for grid lines. Default: '#555555' */
  color?: string;
  /** Stroke width for grid lines. Default: 1 */
  strokeWidth?: number;
  /** Opacity for grid lines. Default: 0.5 */
  opacity?: number;
}

/**
 * Options for creating a NumberPlane
 */
export interface NumberPlaneOptions extends AxesOptions {
  /** Whether to include background grid lines. Default: true */
  includeBackgroundLines?: boolean;
  /** Style configuration for background grid lines */
  backgroundLineStyle?: BackgroundLineStyle;
  /** Fading factor for lines far from axes. Default: 1 (no fading) */
  fadingFactor?: number;
}

/**
 * NumberPlane - A coordinate system with a background grid
 *
 * Extends Axes to add a grid of background lines for better visualization
 * of the coordinate space.
 *
 * @example
 * ```typescript
 * // Create a simple number plane
 * const plane = new NumberPlane();
 *
 * // Create a number plane with custom grid styling
 * const styledPlane = new NumberPlane({
 *   xRange: [-5, 5, 1],
 *   yRange: [-3, 3, 1],
 *   backgroundLineStyle: {
 *     color: '#334455',
 *     strokeWidth: 0.5,
 *     opacity: 0.3
 *   }
 * });
 * ```
 */
export class NumberPlane extends Axes {
  private _includeBackgroundLines: boolean;
  private _backgroundLineStyle: BackgroundLineStyle;
  private _fadingFactor: number;
  private _backgroundLines: Group;

  constructor(options: NumberPlaneOptions = {}) {
    const {
      includeBackgroundLines = true,
      backgroundLineStyle = {},
      fadingFactor = 1,
      ...axesOptions
    } = options;

    super(axesOptions);

    this._includeBackgroundLines = includeBackgroundLines;
    this._backgroundLineStyle = {
      color: '#555555',
      strokeWidth: 1,
      opacity: 0.5,
      ...backgroundLineStyle,
    };
    this._fadingFactor = fadingFactor;
    this._backgroundLines = new Group();

    if (this._includeBackgroundLines) {
      this._generateBackgroundLines();
      // Insert background lines before axes
      this.children.unshift(this._backgroundLines);
      this._backgroundLines.parent = this;
    }
  }

  /**
   * Generate the background grid lines
   */
  private _generateBackgroundLines(): void {
    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;
    const { color, strokeWidth, opacity } = this._backgroundLineStyle;

    // Clear existing lines
    while (this._backgroundLines.children.length > 0) {
      this._backgroundLines.remove(this._backgroundLines.children[0]);
    }

    const epsilon = 0.0001;

    // Vertical lines (parallel to y-axis)
    if (xStep > 0) {
      for (let x = xMin; x <= xMax + epsilon; x += xStep) {
        const roundedX = Math.round(x / xStep) * xStep;
        const [visualX] = this.coordsToPoint(roundedX, 0);
        const localX = visualX - this.position.x;

        const line = new Line({
          start: [localX, -this._yLength / 2, 0],
          end: [localX, this._yLength / 2, 0],
          color: color!,
          strokeWidth: strokeWidth!,
        });
        line.setOpacity(this._calculateLineOpacity(roundedX, 0, opacity!));
        this._backgroundLines.add(line);
      }
    }

    // Horizontal lines (parallel to x-axis)
    if (yStep > 0) {
      for (let y = yMin; y <= yMax + epsilon; y += yStep) {
        const roundedY = Math.round(y / yStep) * yStep;
        const [, visualY] = this.coordsToPoint(0, roundedY);
        const localY = visualY - this.position.y;

        const line = new Line({
          start: [-this._xLength / 2, localY, 0],
          end: [this._xLength / 2, localY, 0],
          color: color!,
          strokeWidth: strokeWidth!,
        });
        line.setOpacity(this._calculateLineOpacity(0, roundedY, opacity!));
        this._backgroundLines.add(line);
      }
    }
  }

  /**
   * Calculate the opacity of a line based on its distance from the origin
   */
  private _calculateLineOpacity(x: number, y: number, baseOpacity: number): number {
    if (this._fadingFactor === 1) {
      return baseOpacity;
    }

    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    // Calculate normalized distance from center
    const xNorm = xMax !== xMin ? Math.abs(x) / Math.max(Math.abs(xMin), Math.abs(xMax)) : 0;
    const yNorm = yMax !== yMin ? Math.abs(y) / Math.max(Math.abs(yMin), Math.abs(yMax)) : 0;
    const distance = Math.max(xNorm, yNorm);

    // Apply fading
    const fadeFactor = Math.pow(1 - distance, this._fadingFactor);
    return baseOpacity * fadeFactor;
  }

  /**
   * Get the background lines Group
   * @returns Group containing all background grid lines
   */
  getBackgroundLines(): Group {
    return this._backgroundLines;
  }

  /**
   * Set whether to show background lines
   */
  setIncludeBackgroundLines(include: boolean): this {
    if (include === this._includeBackgroundLines) return this;

    this._includeBackgroundLines = include;

    if (include) {
      this._generateBackgroundLines();
      if (!this.children.includes(this._backgroundLines)) {
        this.children.unshift(this._backgroundLines);
        this._backgroundLines.parent = this;
      }
    } else {
      const index = this.children.indexOf(this._backgroundLines);
      if (index !== -1) {
        this.children.splice(index, 1);
        this._backgroundLines.parent = null;
      }
    }

    this._markDirty();
    return this;
  }

  /**
   * Set the background line style
   */
  setBackgroundLineStyle(style: Partial<BackgroundLineStyle>): this {
    this._backgroundLineStyle = { ...this._backgroundLineStyle, ...style };
    if (this._includeBackgroundLines) {
      this._generateBackgroundLines();
    }
    this._markDirty();
    return this;
  }

  /**
   * Get the background line style
   */
  getBackgroundLineStyle(): BackgroundLineStyle {
    return { ...this._backgroundLineStyle };
  }

  /**
   * Create a copy of this NumberPlane
   */
  protected override _createCopy(): NumberPlane {
    return new NumberPlane({
      xRange: this._xRange,
      yRange: this._yRange,
      xLength: this._xLength,
      yLength: this._yLength,
      tips: this._tips,
      tipLength: this._tipLength,
      includeBackgroundLines: this._includeBackgroundLines,
      backgroundLineStyle: this._backgroundLineStyle,
      fadingFactor: this._fadingFactor,
    });
  }
}

export default NumberPlane;

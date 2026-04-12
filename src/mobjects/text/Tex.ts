/**
 * Tex - Alias for MathTex for Manim compatibility
 *
 * In the original Manim library, Tex is used for LaTeX rendering.
 * This alias provides the same interface for users familiar with Manim.
 *
 * Uses SVG path-based rendering (MathTex), matching Python Manim's behavior.
 */

import { MathTex, MathTexOptions } from './MathTex';

/**
 * Options for creating a Tex object
 * (Same as MathTexOptions)
 */
export type TexOptions = MathTexOptions;

/**
 * Tex - LaTeX rendering for manimweb
 *
 * This is an alias for MathTex to provide Manim API compatibility.
 * Use this class when porting code from the original Manim library.
 *
 * @example
 * ```typescript
 * // Create a formula (Manim-style API)
 * const formula = new Tex({ latex: 'x^2 + y^2 = r^2' });
 *
 * // Create with options
 * const colored = new Tex({
 *   latex: '\\frac{d}{dx}\\sin(x) = \\cos(x)',
 *   color: '#ffff00',
 * });
 * ```
 */
export class Tex extends MathTex {
  /** Original unwrapped latex, used by _createCopy to avoid double-wrapping */
  private _originalLatex: string | string[];

  constructor(options: TexOptions) {
    // Wrap in \text{...} for text-mode rendering (upright serif, proper word spacing)
    // Split on \\ to handle line breaks, wrap each segment separately
    const latexStr = Array.isArray(options.latex) ? options.latex.join(' \\\\ ') : options.latex;
    const parts = latexStr.split('\\\\');
    const wrapped = parts.map((p: string) => `\\text{${p.trim()}}`).join(' \\\\ ');
    super({ ...options, latex: wrapped });
    this._originalLatex = options.latex;
  }

  /**
   * Create a copy of this Tex
   */
  protected override _createCopy(): Tex {
    return new Tex({
      latex: this._originalLatex,
      color: this._color,
      fontSize: this._fontSize,
      displayMode: this._displayMode,
      position: [this.position.x, this.position.y, this.position.z],
      strokeWidth: this._svgStrokeWidth,
      fillOpacity: this._svgFillOpacity,
      height: this._targetHeight,
      macros: this._macros,
    });
  }
}

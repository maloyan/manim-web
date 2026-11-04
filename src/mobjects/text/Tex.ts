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
 * Wrap in \text{...} for text-mode rendering (upright serif, proper word spacing).
 * Split on \\ to handle line breaks, wrap each segment separately.
 */
function wrapText(latex: string | string[]): string {
  const latexStr = Array.isArray(latex) ? latex.join(' \\\\ ') : latex;
  const parts = latexStr.split('\\\\');
  return parts.map((p: string) => `\\text{${p.trim()}}`).join(' \\\\ ');
}

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
  /** Original unwrapped latex, used by _copy to avoid double-wrapping */
  private _originalLatex: string | string[];

  constructor(options: TexOptions) {
    super({ ...options, latex: wrapText(options.latex) });
    this._originalLatex = options.latex;
  }

  /**
   * Replace the text and re-render in place, wrapping it in `\text{...}`
   * like the constructor does. See {@link MathTex.setLatex}.
   */
  override setLatex(latex: string | string[]): Promise<void> {
    this._originalLatex = latex;
    return super.setLatex(wrapText(latex));
  }

  override copy(): Tex {
    const copy = new Tex({
      latex: this._originalLatex,
      color: this._color,
      fontSize: this._fontSize,
      displayMode: this._displayMode,
      position: [this.position.x, this.position.y, this.position.z],
      strokeWidth: this._svgStrokeWidth,
      fillOpacity: this._svgFillOpacity,
      height: this._targetHeight,
      macros: this._macros,
      anchor: this._anchor,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

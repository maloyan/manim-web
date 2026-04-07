import { MathTex, MathTexOptions } from './MathTex';
import { VGroup } from '../../core/VGroup';

export type SingleStringMathTexOptions = Omit<MathTexOptions, 'latex'>;

/**
 * SingleStringMathTex - A variant of MathTex for single-string LaTeX
 *
 * Wraps MathTex but enforces that the LaTeX is treated as a single
 * indivisible expression (no part splitting).
 */
export class SingleStringMathTex extends MathTex {
  constructor(latex: string, options: SingleStringMathTexOptions = {}) {
    super({ ...options, latex });
  }

  /**
   * Get the LaTeX source string
   */
  getTexString(): string {
    return this.getLatex();
  }
}

export interface MathTexPartOptions {
  /** Color for this part */
  color?: string;
  /** Font size for this part */
  fontSize?: number;
}

/**
 * MathTexPart - Represents a selectable part of a MathTex expression
 *
 * Allows creating MathTex expressions with individually styleable/animatable parts.
 * Each part is a separate MathTex that can be colored or animated independently.
 *
 * @example
 * ```typescript
 * // Create an equation with independently colored parts
 * const equation = MathTexPart.fromParts(
 *   [
 *     { latex: 'x^2', color: RED },
 *     { latex: '+', color: WHITE },
 *     { latex: 'y^2', color: BLUE },
 *     { latex: '=', color: WHITE },
 *     { latex: 'r^2', color: GREEN },
 *   ]
 * );
 * ```
 */
export class MathTexPart extends VGroup {
  private _parts: MathTex[] = [];
  private _partStrings: string[] = [];

  constructor() {
    super();
  }

  /**
   * Create a MathTexPart from an array of part definitions
   */
  static fromParts(
    parts: Array<{ latex: string; color?: string; fontSize?: number }>,
    spacing: number = 0.1,
  ): MathTexPart {
    const result = new MathTexPart();
    let xOffset = 0;

    for (const partDef of parts) {
      const tex = new MathTex({
        latex: partDef.latex,
        color: partDef.color,
        fontSize: partDef.fontSize ?? 48,
      });
      tex.moveTo([xOffset, 0, 0]);

      result._parts.push(tex);
      result._partStrings.push(partDef.latex);
      result.add(tex);

      // Estimate width for positioning (rough estimate based on character count)
      xOffset += partDef.latex.length * 0.3 + spacing;
    }

    // Center the group
    if (result._parts.length > 0) {
      const totalWidth = xOffset - spacing;
      for (const part of result._parts) {
        const pos = part.getCenter();
        part.moveTo([pos[0] - totalWidth / 2, pos[1], pos[2]]);
      }
    }

    return result;
  }

  /**
   * Get a specific part by index
   */
  getPart(index: number): MathTex | undefined {
    return this._parts[index];
  }

  /**
   * Get all parts
   */
  getParts(): MathTex[] {
    return [...this._parts];
  }

  /**
   * Get the number of parts
   */
  getNumParts(): number {
    return this._parts.length;
  }

  /**
   * Set the color of a specific part
   */
  setPartColor(index: number, color: string): this {
    if (this._parts[index]) {
      this._parts[index].color = color;
    }
    return this;
  }

  /**
   * Get the LaTeX strings of all parts
   */
  getPartStrings(): string[] {
    return [...this._partStrings];
  }

  /**
   * Get the full combined LaTeX string
   */
  getFullLatex(): string {
    return this._partStrings.join(' ');
  }
}

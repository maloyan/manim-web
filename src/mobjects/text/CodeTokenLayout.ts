/**
 * Token layout for the Code mobject.
 *
 * Computes a flat list of tokens with their world-space positions from the
 * parsed lines of a Code block. The math mirrors the layout in Code.ts
 * (`getLineOfCode` and `_renderToCanvas`) but stays free of the 2D canvas, so
 * it works in a headless environment. Positions use a monospace assumption for
 * the horizontal advance, which is exact for the default monospace font and a
 * close estimate otherwise.
 *
 * `TransformMatchingCode` uses this to match unchanged tokens between two Code
 * blocks and animate only the difference.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { Token, TokenType } from './CodeHighlighting';
import { getTextResolutionScale } from './textTexture';

/** Scale factor: pixels to world units (mirrors Code.ts PIXEL_TO_WORLD). */
const PIXEL_TO_WORLD = 1 / 100;

/** Monospace advance as a fraction of the scaled font size. */
const CHAR_WIDTH_RATIO = 0.6;

/**
 * A single token of a Code block with its position.
 */
export interface CodeToken {
  /** The token text. */
  text: string;
  /** The syntax type of the token. */
  type: TokenType;
  /** Zero-based index of the line that holds the token. */
  line: number;
  /** Zero-based index of the token within its line. */
  tokenIndex: number;
  /** World-space position of the left edge of the token. */
  position: Vector3Tuple;
}

/**
 * Inputs for {@link computeCodeTokens}. These mirror the Code mobject fields.
 */
export interface CodeTokenLayoutParams {
  /** Parsed lines (tabs already expanded to spaces). */
  lines: string[];
  /** Tokens for each line. */
  tokenizedLines: Token[][];
  /** Font size in pixels. */
  fontSize: number;
  /** Line height multiplier. */
  lineHeight: number;
  /** Background padding in pixels. */
  backgroundPadding: number;
  /** Whether line numbers take horizontal space. */
  lineNumbers: boolean;
  /** World-space position (center) of the Code block. */
  position: Vector3Tuple;
}

/**
 * Compute the flat list of tokens with world-space positions.
 *
 * @param params - The Code block layout inputs.
 * @returns One {@link CodeToken} per token, in reading order.
 */
export function computeCodeTokens(params: CodeTokenLayoutParams): CodeToken[] {
  const { lines, tokenizedLines, fontSize, lineHeight, backgroundPadding, lineNumbers, position } =
    params;

  // The scale cancels in every world-space position below, so the output is the
  // same for any value. It is read here so this layout stays identical to the
  // Code mobject render, which uses the same device-pixel-ratio-aware scale.
  const RESOLUTION_SCALE = getTextResolutionScale();
  const scaledFontSize = fontSize * RESOLUTION_SCALE;
  const scaledLineHeight = scaledFontSize * lineHeight;
  const scaledPadding = backgroundPadding * RESOLUTION_SCALE;
  const charWidthPx = scaledFontSize * CHAR_WIDTH_RATIO;

  const lineNumberWidthPx = lineNumbers
    ? String(lines.length).length * charWidthPx + 20 * RESOLUTION_SCALE
    : 0;

  let maxLineWidthPx = 0;
  for (const line of lines) {
    maxLineWidthPx = Math.max(maxLineWidthPx, line.length * charWidthPx);
  }

  const totalWidthPx = lineNumberWidthPx + maxLineWidthPx + scaledPadding * 2;
  const totalHeightPx = lines.length * scaledLineHeight + scaledPadding * 2;
  const worldWidth = (totalWidthPx / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
  const worldHeight = (totalHeightPx / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

  const result: CodeToken[] = [];

  for (let i = 0; i < tokenizedLines.length; i++) {
    const yPx = scaledPadding + (i + 0.5) * scaledLineHeight;
    const worldY = worldHeight / 2 - (yPx / RESOLUTION_SCALE) * PIXEL_TO_WORLD + position[1];

    let xPx = lineNumberWidthPx + scaledPadding / 2;
    const tokens = tokenizedLines[i];

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      const worldX = (xPx / RESOLUTION_SCALE) * PIXEL_TO_WORLD - worldWidth / 2 + position[0];

      result.push({
        text: token.text,
        type: token.type,
        line: i,
        tokenIndex: t,
        position: [worldX, worldY, position[2]],
      });

      xPx += token.text.length * charWidthPx;
    }
  }

  return result;
}

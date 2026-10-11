/**
 * SVG `<text>` support for SVGMobject (best-manim enhancement).
 *
 * ManimCE drops `<text>` on SVG import (tracking issue #3709). This builds a
 * {@link Text} mobject for each `<text>` element, reusing the existing text
 * renderer, and positions it from the element's attributes.
 *
 * Approximations: the SVG `x`/`y` pair is the text baseline origin, while
 * {@link Text} positions by its center. We place the Text center at
 * `(x, -y)` (SVG y grows downward, scene y grows upward) and map
 * `text-anchor` to the Text alignment. Exact baseline and glyph metrics are not
 * reproduced.
 */

import { Text } from '../text/Text';

/** Default styling for `<text>` elements that omit their own. */
export interface SvgTextDefaults {
  /** Fill color used when the element has no usable `fill`. */
  color: string;
}

/** Map an SVG `text-anchor` to a Text horizontal alignment. */
function anchorToAlign(anchor: string | null): 'left' | 'center' | 'right' {
  if (anchor === 'middle') return 'center';
  if (anchor === 'end') return 'right';
  return 'left';
}

/**
 * Build one {@link Text} mobject per `<text>` element in the SVG.
 *
 * @param svg - The parsed `<svg>` root element.
 * @param defaults - Fallback styling (currently the default fill color).
 * @returns Text mobjects, in document order. Empty `<text>` nodes are skipped.
 */
export function buildSvgTextMobjects(svg: Element, defaults: SvgTextDefaults): Text[] {
  const result: Text[] = [];
  for (const el of svg.querySelectorAll('text')) {
    const content = (el.textContent ?? '').trim();
    if (!content) continue;

    const x = parseFloat(el.getAttribute('x') ?? '0') || 0;
    const y = parseFloat(el.getAttribute('y') ?? '0') || 0;

    const fontSizeRaw = el.getAttribute('font-size');
    const fontSize = fontSizeRaw ? parseFloat(fontSizeRaw) : undefined;

    const fill = el.getAttribute('fill');
    const color = fill && fill !== 'none' ? fill : defaults.color;

    const text = new Text({
      text: content,
      color,
      textAlign: anchorToAlign(el.getAttribute('text-anchor')),
      ...(fontSize && !Number.isNaN(fontSize) ? { fontSize } : {}),
    });

    // SVG y grows downward; scene y grows upward (paths are flipped the same way).
    text.moveTo([x, -y, 0]);
    result.push(text);
  }
  return result;
}

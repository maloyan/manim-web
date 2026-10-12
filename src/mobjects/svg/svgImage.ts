/**
 * SVG `<image>` support for SVGMobject (best-manim enhancement, best-effort).
 *
 * ManimCE drops `<image>` on SVG import (tracking issue #3709). This builds an
 * {@link ImageMobject} per `<image>` element from its `href` (or legacy
 * `xlink:href`) and places it at the element's box center.
 *
 * Scope: data URIs and absolute URLs load through the normal ImageMobject
 * texture path. Nested/clipped images and `preserveAspectRatio` are not
 * reproduced.
 */

import { ImageMobject } from '../image';
import { isRenderableSvgElement } from './svgFill';

/**
 * Read an `<image>` href, preferring SVG2 `href` and falling back to the
 * legacy `xlink:href`.
 */
function readHref(el: Element): string | null {
  return (
    el.getAttribute('href') ??
    el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ??
    el.getAttribute('xlink:href')
  );
}

/**
 * Build one {@link ImageMobject} per `<image>` element that has an href.
 *
 * @param svg - The parsed `<svg>` root element.
 * @returns Image mobjects, in document order. Elements without an href are skipped.
 */
export function buildSvgImageMobjects(svg: Element): ImageMobject[] {
  const result: ImageMobject[] = [];
  for (const el of svg.querySelectorAll('image')) {
    if (!isRenderableSvgElement(el)) continue;
    const href = readHref(el);
    if (!href) continue;

    const x = parseFloat(el.getAttribute('x') ?? '0') || 0;
    const y = parseFloat(el.getAttribute('y') ?? '0') || 0;
    const width = parseFloat(el.getAttribute('width') ?? '0') || 0;
    const height = parseFloat(el.getAttribute('height') ?? '0') || 0;

    // SVG y grows downward; scene y grows upward. Center the box.
    const center: [number, number, number] = [x + width / 2, -(y + height / 2), 0];

    result.push(
      new ImageMobject({
        source: href,
        center,
        ...(width > 0 ? { width } : {}),
        ...(height > 0 ? { height } : {}),
      }),
    );
  }
  return result;
}

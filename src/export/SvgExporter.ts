/**
 * SvgExporter - in-browser scene-to-SVG vector export for manim-web.
 *
 * Walks the scene's VMobjects and writes each one as an SVG `<path>` with the
 * correct fill (color, opacity, fill-rule) and stroke (color, width, opacity).
 * The output is a complete, standalone `<svg>` string with a `viewBox` that
 * matches the raster exporters' pixel aspect, so the vector result lines up
 * with a PNG of the same frame. Unlike GIF/Video/PNG/WebCodecs export, the
 * result is resolution-independent and editable in a vector tool.
 *
 * Scope: 2D VMobjects. The scene camera is treated as the orthographic 2D
 * frame, so each point maps through its world transform and then flattens onto
 * the x/y plane (z is dropped). True 3D mobjects (meshes such as Surface) are
 * not VMobjects and are skipped. A VMobject authored in a 3D/perspective scene
 * is projected with the same 2D frame mapping, which is only exact for the 2D
 * orthographic case.
 *
 * Three capture entry points are provided, mirroring FrameExporter:
 *  - `sceneToSVG` returns the SVG markup as a string.
 *  - `exportSVG` returns the SVG as a Blob.
 *  - `exportAndDownloadSVG` triggers a browser download (guards the DOM).
 */

import { VMobject } from '../core/VMobject';
import { isClosedPath } from '../core/VMobjectGeometry';
import { downloadBlob } from './FrameExporter';

/**
 * Duck-type interface for the scene camera the exporter needs.
 *
 * It matches Camera2D: a frame width/height in world units and a world-space
 * center position. The frame is the orthographic box the raster exporters use.
 */
export interface SvgExportableCamera {
  /** Frame width in world units. */
  frameWidth: number;
  /** Frame height in world units. */
  frameHeight: number;
  /** World-space camera center (only x and y are read). */
  position: { x: number; y: number };
}

/**
 * Duck-type interface for Scene, used to avoid a circular import.
 *
 * The exporter needs the pixel dimensions (to match the raster aspect), the
 * camera frame, and the top-level mobjects in draw order.
 */
export interface SvgExportableScene {
  /** Canvas width in pixels. */
  getWidth(): number;
  /** Canvas height in pixels. */
  getHeight(): number;
  /** The scene camera (orthographic 2D frame). */
  camera: SvgExportableCamera;
  /** Top-level mobjects, in insertion (draw) order. */
  mobjects: Iterable<{ getFamily(): unknown[]; userId?: string }>;
}

/** Options for an SVG export. */
export interface SvgExportOptions {
  /**
   * Decimal places for coordinates and numeric attributes. Defaults to 3.
   * Fewer places give smaller output; more give higher precision.
   */
  precision?: number;
  /**
   * Background color for the `<svg>` (a solid `<rect>` behind everything).
   * Omit for a transparent background.
   */
  background?: string;
}

/** A VMobject whose points are its own drawable geometry. */
export interface DrawableVMobject {
  getPoints(): number[][];
  getEffectiveSubpathLengths(): number[] | undefined;
  color: string;
  style: { fillColor?: string };
  fillOpacity: number;
  strokeWidth: number;
  opacity: number;
}

const DEFAULT_PRECISION = 3;

/**
 * Format a number for SVG output: round to `precision` decimals and drop any
 * trailing zeros and the sign on negative zero.
 */
export function formatNumber(value: number, precision: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Number(value.toFixed(precision));
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return String(normalized);
}

/** Escape a string for safe use inside an XML attribute value. */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build a world-to-pixel mapping from the camera frame and pixel size.
 *
 * The camera is orthographic and centered at `camera.position`. World x maps
 * left-to-right; world y is flipped because SVG y grows downward. The result
 * matches the raster exporters' pixel aspect.
 */
export function makeWorldToPixel(
  camera: SvgExportableCamera,
  pixelWidth: number,
  pixelHeight: number,
): (point: number[]) => [number, number] {
  const cx = camera.position.x;
  const cy = camera.position.y;
  const frameWidth = camera.frameWidth || 1;
  const frameHeight = camera.frameHeight || 1;
  return (point: number[]) => {
    const sx = ((point[0] - cx) / frameWidth) * pixelWidth + pixelWidth / 2;
    const sy = pixelHeight / 2 - ((point[1] - cy) / frameHeight) * pixelHeight;
    return [sx, sy];
  };
}

/**
 * Split a flat Bezier point list into per-subpath point lists.
 *
 * When `lengths` is given (compound paths such as a glyph with holes), the
 * points are split at those boundaries. Otherwise the whole list is one
 * subpath.
 */
function splitSubpaths(points: number[][], lengths: number[] | undefined): number[][][] {
  if (!lengths || lengths.length <= 1) return [points];
  const subpaths: number[][][] = [];
  let offset = 0;
  for (const len of lengths) {
    if (len <= 0 || offset + len > points.length) break;
    subpaths.push(points.slice(offset, offset + len));
    offset += len;
  }
  // Fall back to the whole list if the metadata did not cover every point.
  if (offset !== points.length) return [points];
  return subpaths;
}

/**
 * Convert one subpath's cubic Bezier points to an SVG path-data fragment.
 *
 * The point list is `anchor, handle, handle, anchor, ...` (consecutive curves
 * share an anchor). The result is `M a0 C h h a1 C h h a2 ...`, with a closing
 * `Z` when the subpath's first and last anchors coincide.
 */
function subpathToPathData(
  points: number[][],
  toPixel: (point: number[]) => [number, number],
  precision: number,
): string | null {
  if (points.length < 4) return null;
  const fmt = (p: number[]): string => {
    const [x, y] = toPixel(p);
    return `${formatNumber(x, precision)} ${formatNumber(y, precision)}`;
  };
  const commands: string[] = [`M ${fmt(points[0])}`];
  const numCurves = Math.floor((points.length - 1) / 3);
  for (let i = 0; i < numCurves; i++) {
    const h1 = points[3 * i + 1];
    const h2 = points[3 * i + 2];
    const anchor = points[3 * i + 3];
    commands.push(`C ${fmt(h1)} ${fmt(h2)} ${fmt(anchor)}`);
  }
  if (isClosedPath(points)) commands.push('Z');
  return commands.join(' ');
}

/** Resolve the fill color used at render time: `style.fillColor` or `color`. */
export function resolveFillColor(mob: DrawableVMobject): string {
  return mob.style.fillColor ?? mob.color;
}

/**
 * One manim stroke unit renders as this many SVG pixels (see VMobjectRendering).
 *
 * The scale keeps stroke widths matching the raster exporters' pixel aspect.
 */
export function computeStrokeScale(camera: SvgExportableCamera, pixelWidth: number): number {
  return (0.01 * pixelWidth) / (camera.frameWidth || 1);
}

/**
 * Build the SVG path-data (`d`) string for one VMobject, or null when it has no
 * drawable geometry.
 *
 * This is the geometry half of `vmobjectToPath`: it walks the VMobject's
 * subpaths and maps each world point to the pixel viewBox, but it does not read
 * any fill or stroke style. The animated (SMIL) exporter reuses it to sample a
 * mobject's path at each keyframe.
 */
export function buildVmobjectPathData(
  mob: DrawableVMobject,
  toPixel: (point: number[]) => [number, number],
  precision: number,
): string | null {
  const points = mob.getPoints();
  if (points.length < 4) return null;

  const subpaths = splitSubpaths(points, mob.getEffectiveSubpathLengths());
  const dataFragments: string[] = [];
  for (const subpath of subpaths) {
    const fragment = subpathToPathData(subpath, toPixel, precision);
    if (fragment) dataFragments.push(fragment);
  }
  if (dataFragments.length === 0) return null;
  return dataFragments.join(' ');
}

/**
 * Build the `<path>` element for one VMobject, or null when it draws nothing.
 *
 * Fill is drawn when `fillOpacity > 0`; stroke is drawn when `strokeWidth > 0`.
 * This mirrors VMobjectRendering. Compound paths (holes) become one `<path>`
 * with multiple subpaths so `fill-rule="nonzero"` carves the holes correctly.
 */
function vmobjectToPath(
  mob: DrawableVMobject,
  toPixel: (point: number[]) => [number, number],
  strokeScale: number,
  precision: number,
): string | null {
  const d = buildVmobjectPathData(mob, toPixel, precision);
  if (d === null) return null;

  const hasFill = mob.fillOpacity > 0;
  const hasStroke = mob.strokeWidth > 0;
  if (!hasFill && !hasStroke) return null;

  const attrs: string[] = [`d="${d}"`];

  if (hasFill) {
    attrs.push(`fill="${escapeAttr(resolveFillColor(mob))}"`);
    attrs.push('fill-rule="nonzero"');
    if (mob.fillOpacity < 1)
      attrs.push(`fill-opacity="${formatNumber(mob.fillOpacity, precision)}"`);
  } else {
    attrs.push('fill="none"');
  }

  if (hasStroke) {
    attrs.push(`stroke="${escapeAttr(mob.color)}"`);
    attrs.push(`stroke-width="${formatNumber(mob.strokeWidth * strokeScale, precision)}"`);
    attrs.push('stroke-linejoin="round"');
    attrs.push('stroke-linecap="round"');
    if (mob.opacity < 1) attrs.push(`stroke-opacity="${formatNumber(mob.opacity, precision)}"`);
  }

  return `<path ${attrs.join(' ')} />`;
}

/** Type guard: a VMobject that owns drawable points. */
export function isDrawableVMobject(member: unknown): member is DrawableVMobject {
  return member instanceof VMobject && member.getPoints().length >= 4;
}

/**
 * Convert a scene to a complete, standalone SVG string.
 *
 * Each top-level mobject becomes a `<g>` group holding the `<path>` elements of
 * its VMobject family, in draw order. World coordinates map to the pixel
 * viewBox through the camera frame, matching the raster exporters' aspect.
 * An empty scene yields a valid, empty `<svg>`.
 *
 * @param scene - The scene to export
 * @param options - Export options
 * @returns The SVG markup
 */
export function sceneToSVG(scene: SvgExportableScene, options?: SvgExportOptions): string {
  const precision = options?.precision ?? DEFAULT_PRECISION;
  const pixelWidth = scene.getWidth();
  const pixelHeight = scene.getHeight();
  const camera = scene.camera;
  const toPixel = makeWorldToPixel(camera, pixelWidth, pixelHeight);
  const strokeScale = computeStrokeScale(camera, pixelWidth);

  const groups: string[] = [];
  for (const topLevel of scene.mobjects) {
    const paths: string[] = [];
    for (const member of topLevel.getFamily()) {
      if (!isDrawableVMobject(member)) continue;
      const path = vmobjectToPath(member, toPixel, strokeScale, precision);
      if (path) paths.push(path);
    }
    if (paths.length === 0) continue;
    const idAttr = topLevel.userId ? ` data-mobject-id="${escapeAttr(topLevel.userId)}"` : '';
    groups.push(`  <g${idAttr}>\n    ${paths.join('\n    ')}\n  </g>`);
  }

  const w = formatNumber(pixelWidth, precision);
  const h = formatNumber(pixelHeight, precision);
  const header =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${w} ${h}">`;
  const bg = options?.background
    ? `\n  <rect x="0" y="0" width="${w}" height="${h}" fill="${escapeAttr(options.background)}" />`
    : '';
  const body = groups.length > 0 ? `\n${groups.join('\n')}\n` : '\n';
  return `${header}${bg}${body}</svg>`;
}

/**
 * Export a scene as an SVG Blob.
 *
 * @param scene - The scene to export
 * @param options - Export options
 * @returns A Blob of type `image/svg+xml`
 */
export function exportSVG(scene: SvgExportableScene, options?: SvgExportOptions): Blob {
  const svg = sceneToSVG(scene, options);
  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Convenience helper: export a scene as SVG and download it.
 *
 * Guards the DOM: it throws a clear error when no `document` is available
 * (for example in a worker or during server-side use).
 *
 * @param scene - The scene to export
 * @param filename - The target filename. Defaults to 'scene.svg'.
 * @param options - Export options
 */
export function exportAndDownloadSVG(
  scene: SvgExportableScene,
  filename: string = 'scene.svg',
  options?: SvgExportOptions,
): void {
  if (typeof document === 'undefined') {
    throw new Error('exportAndDownloadSVG requires a DOM (document is undefined)');
  }
  downloadBlob(exportSVG(scene, options), filename);
}

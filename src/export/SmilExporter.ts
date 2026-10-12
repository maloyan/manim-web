/**
 * SmilExporter - in-browser scene-to-animated-SVG export for manim-web.
 *
 * Where SvgExporter captures a single frame, this exporter samples the scene at
 * several keyframes over its animation and emits ONE standalone `<svg>` whose
 * elements carry SMIL `<animate>` / `<animateTransform>` tags. The result plays
 * on its own in any browser, with no JavaScript, and loops when asked.
 *
 * How it works:
 *  1. Seek the scene to each keyframe time and read every drawable VMobject's
 *     path (`d`), fill and stroke style, reusing SvgExporter's machinery.
 *  2. For each mobject, write a base `<path>` (the first keyframe) plus one
 *     `<animate>` per attribute that changes across keyframes.
 *
 * Path-morph limitation: SMIL can only interpolate a `d` attribute smoothly
 * when every keyframe has the same number and type of path commands. When the
 * point count changes (for example a circle turning into a square), the `d` is
 * NOT animated; the first keyframe's shape is shown instead. Motion that is a
 * pure translation can be emitted as an `<animateTransform type="translate">`
 * with the `preferTransform` option, which always interpolates cleanly.
 *
 * Scope matches SvgExporter: 2D VMobjects mapped through the orthographic frame.
 */

import {
  buildVmobjectPathData,
  computeStrokeScale,
  escapeAttr,
  formatNumber,
  isDrawableVMobject,
  makeWorldToPixel,
  resolveFillColor,
  type DrawableVMobject,
  type SvgExportableScene,
} from './SvgExporter';
import { downloadBlob } from './FrameExporter';

/** A scene that can be seeked to a time, so it can be sampled per keyframe. */
export interface SmilExportableScene extends SvgExportableScene {
  /** Seek the scene (and its mobjects) to time `t` in seconds. */
  seek(t: number): void;
  /** Optional total animation duration in seconds, read when not given. */
  getTimelineDuration?(): number;
}

/** An SVG attribute the exporter may animate. */
export type SmilAnimatableAttribute =
  'd' | 'fill' | 'fill-opacity' | 'stroke' | 'stroke-width' | 'stroke-opacity' | 'transform';

/** Options for an animated (SMIL) SVG export. */
export interface SmilExportOptions {
  /** Decimal places for numeric attributes. Defaults to 3. */
  precision?: number;
  /** Solid background color drawn behind everything. Omit for transparent. */
  background?: string;
  /** Total animation duration in seconds. Falls back to the scene timeline. */
  duration?: number;
  /** Keyframes per second used to pick the sample count. Defaults to 15. */
  fps?: number;
  /** Explicit number of keyframes (>= 2). Overrides `fps` when given. */
  keyframes?: number;
  /** Repeat forever (`repeatCount="indefinite"`). Defaults to true. */
  loop?: boolean;
  /** Which attributes may animate. Defaults to all of them. */
  attributes?: SmilAnimatableAttribute[];
  /**
   * Emit pure-translation motion as `<animateTransform type="translate">` with
   * a static path, instead of animating `d`. Defaults to false.
   */
  preferTransform?: boolean;
}

const DEFAULT_PRECISION = 3;
const DEFAULT_FPS = 15;
const DEFAULT_DURATION = 5;
const ALL_ATTRIBUTES: SmilAnimatableAttribute[] = [
  'd',
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'transform',
];

/** One mobject's rendered state at a single keyframe. */
interface Sample {
  d: string | null;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidthPx: number;
  strokeOpacity: number;
}

/** A top-level mobject and the per-member sample arrays it contributes. */
interface TopLevelEntry {
  order: number;
  userId?: string;
  members: Map<DrawableVMobject, Array<Sample | undefined>>;
}

/** Shared animation timing for every `<animate>` element in one export. */
interface AnimationConfig {
  dur: string;
  keyTimes: string;
  loop: boolean;
}

/** Read one drawable VMobject's full render state for the current frame. */
function sampleMobject(
  mob: DrawableVMobject,
  toPixel: (point: number[]) => [number, number],
  strokeScale: number,
  precision: number,
): Sample {
  return {
    d: buildVmobjectPathData(mob, toPixel, precision),
    fillColor: resolveFillColor(mob),
    fillOpacity: mob.fillOpacity,
    strokeColor: mob.color,
    strokeWidthPx: mob.strokeWidth * strokeScale,
    strokeOpacity: mob.opacity,
  };
}

/** Resolve the keyframe count from the options. */
function resolveKeyframeCount(options: SmilExportOptions | undefined, duration: number): number {
  if (options?.keyframes !== undefined) return Math.max(2, Math.floor(options.keyframes));
  const fps = options?.fps ?? DEFAULT_FPS;
  return Math.max(2, Math.round(duration * fps) + 1);
}

/** Collect a sample of every drawable mobject at every keyframe time. */
function collectEntries(
  scene: SmilExportableScene,
  count: number,
  duration: number,
  precision: number,
): TopLevelEntry[] {
  const pixelWidth = scene.getWidth();
  const pixelHeight = scene.getHeight();
  const topMap = new Map<object, TopLevelEntry>();
  let topOrder = 0;

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? (i / (count - 1)) * duration : 0;
    scene.seek(t);
    const camera = scene.camera;
    const toPixel = makeWorldToPixel(camera, pixelWidth, pixelHeight);
    const strokeScale = computeStrokeScale(camera, pixelWidth);

    for (const topLevel of scene.mobjects) {
      let entry = topMap.get(topLevel);
      if (!entry) {
        entry = { order: topOrder++, userId: topLevel.userId, members: new Map() };
        topMap.set(topLevel, entry);
      }
      for (const member of topLevel.getFamily()) {
        if (!isDrawableVMobject(member)) continue;
        let samples = entry.members.get(member);
        if (!samples) {
          samples = new Array<Sample | undefined>(count);
          entry.members.set(member, samples);
        }
        samples[i] = sampleMobject(member, toPixel, strokeScale, precision);
      }
    }
  }
  scene.seek(0);
  return [...topMap.values()].sort((a, b) => a.order - b.order);
}

/**
 * Fill gaps in a per-keyframe value list by holding the nearest known value.
 *
 * The input may be a sparse array (a mobject absent at some keyframes), so this
 * reads by index: `Array.prototype.map` skips holes, which would leak `undefined`.
 * Returns a dense array of length `values.length`, or null when nothing is known.
 */
function holdValues<T>(values: Array<T | undefined | null>): T[] | null {
  let first: T | null = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== undefined && v !== null) {
      first = v;
      break;
    }
  }
  if (first === null) return null;
  const out: T[] = [];
  let last = first;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== undefined && v !== null) last = v;
    out.push(last);
  }
  return out;
}

/** True when every entry in a list is equal to the first. */
function allEqual<T>(values: T[]): boolean {
  return values.every((v) => v === values[0]);
}

/** The command-letter signature of a path, ignoring the numbers. */
function pathSignature(d: string): string {
  return d.replace(/[^A-Za-z]/g, '');
}

/** The numeric coordinates of a path, in order. */
function pathCoords(d: string): number[] {
  const matches = d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi);
  return matches ? matches.map(Number) : [];
}

/**
 * When every keyframe's path is the first path shifted by a constant offset,
 * return the per-keyframe `[dx, dy]` offsets; otherwise return null.
 */
function translationOffsets(dValues: string[], precision: number): string[] | null {
  const base = pathCoords(dValues[0]);
  if (base.length === 0 || base.length % 2 !== 0) return null;
  // Coordinates are already rounded to `precision`, so each delta carries up to
  // one unit of rounding error; comparing two deltas tolerates up to three.
  const epsilon = 10 ** -precision * 3;
  const offsets: string[] = [];
  let moved = false;
  for (const d of dValues) {
    const coords = pathCoords(d);
    if (coords.length !== base.length) return null;
    const dx = coords[0] - base[0];
    const dy = coords[1] - base[1];
    for (let j = 0; j < coords.length; j += 2) {
      if (Math.abs(coords[j] - base[j] - dx) > epsilon) return null;
      if (Math.abs(coords[j + 1] - base[j + 1] - dy) > epsilon) return null;
    }
    if (Math.abs(dx) > epsilon || Math.abs(dy) > epsilon) moved = true;
    offsets.push(`${formatNumber(dx, precision)} ${formatNumber(dy, precision)}`);
  }
  return moved ? offsets : null;
}

/** Build one `<animate>` element string. */
function animateTag(attributeName: string, values: string[], cfg: AnimationConfig): string {
  const repeat = cfg.loop ? 'repeatCount="indefinite"' : 'fill="freeze"';
  return (
    `<animate attributeName="${attributeName}" dur="${cfg.dur}" ` +
    `keyTimes="${cfg.keyTimes}" values="${escapeAttr(values.join(';'))}" ` +
    `calcMode="linear" ${repeat} />`
  );
}

/** Build one `<animateTransform type="translate">` element string. */
function animateTransformTag(values: string[], cfg: AnimationConfig): string {
  const repeat = cfg.loop ? 'repeatCount="indefinite"' : 'fill="freeze"';
  return (
    `<animateTransform attributeName="transform" type="translate" additive="sum" ` +
    `dur="${cfg.dur}" keyTimes="${cfg.keyTimes}" ` +
    `values="${escapeAttr(values.join(';'))}" calcMode="linear" ${repeat} />`
  );
}

/** Context passed down when turning one mobject's samples into a `<path>`. */
interface PathContext {
  count: number;
  precision: number;
  attributes: Set<SmilAnimatableAttribute>;
  preferTransform: boolean;
  cfg: AnimationConfig;
}

/** Add the `d` / `transform` animation (or a static path) to an element. */
function appendGeometry(
  attrs: string[],
  children: string[],
  dValues: string[],
  ctx: PathContext,
): void {
  const canAnimate = ctx.count >= 2 && !allEqual(dValues);
  if (ctx.preferTransform && ctx.attributes.has('transform')) {
    const offsets = translationOffsets(dValues, ctx.precision);
    if (offsets) {
      attrs.push(`d="${dValues[0]}"`);
      if (canAnimate) children.push(animateTransformTag(offsets, ctx.cfg));
      return;
    }
  }
  attrs.push(`d="${dValues[0]}"`);
  if (canAnimate && ctx.attributes.has('d') && allEqual(dValues.map(pathSignature))) {
    children.push(animateTag('d', dValues, ctx.cfg));
  }
}

/** Add a `<animate>` for a color/opacity attribute when it changes. */
function appendStyleAnimation(
  children: string[],
  name: SmilAnimatableAttribute,
  values: string[],
  ctx: PathContext,
): void {
  if (ctx.count >= 2 && !allEqual(values) && ctx.attributes.has(name)) {
    children.push(animateTag(name, values, ctx.cfg));
  }
}

/** Build the `<path>` (with animation children) for one mobject, or null. */
function buildMemberPath(samples: Array<Sample | undefined>, ctx: PathContext): string | null {
  const dValues = holdValues(samples.map((s) => s?.d ?? null));
  if (!dValues) return null;

  const present = samples.filter((s): s is Sample => s !== undefined);
  const hasFill = present.some((s) => s.fillOpacity > 0);
  const hasStroke = present.some((s) => s.strokeWidthPx > 0);
  if (!hasFill && !hasStroke) return null;

  const base = present[0];
  const fmt = (v: number): string => formatNumber(v, ctx.precision);
  const attrs: string[] = [];
  const children: string[] = [];

  appendGeometry(attrs, children, dValues, ctx);

  if (hasFill) {
    attrs.push(`fill="${escapeAttr(base.fillColor)}"`);
    attrs.push('fill-rule="nonzero"');
    attrs.push(`fill-opacity="${fmt(base.fillOpacity)}"`);
    appendStyleAnimation(children, 'fill', holdValues(samples.map((s) => s?.fillColor)) ?? [], ctx);
    appendStyleAnimation(
      children,
      'fill-opacity',
      (holdValues(samples.map((s) => s?.fillOpacity)) ?? []).map(fmt),
      ctx,
    );
  } else {
    attrs.push('fill="none"');
  }

  if (hasStroke) {
    attrs.push(`stroke="${escapeAttr(base.strokeColor)}"`);
    attrs.push(`stroke-width="${fmt(base.strokeWidthPx)}"`);
    attrs.push('stroke-linejoin="round"');
    attrs.push('stroke-linecap="round"');
    attrs.push(`stroke-opacity="${fmt(base.strokeOpacity)}"`);
    appendStyleAnimation(
      children,
      'stroke',
      holdValues(samples.map((s) => s?.strokeColor)) ?? [],
      ctx,
    );
    appendStyleAnimation(
      children,
      'stroke-width',
      (holdValues(samples.map((s) => s?.strokeWidthPx)) ?? []).map(fmt),
      ctx,
    );
    appendStyleAnimation(
      children,
      'stroke-opacity',
      (holdValues(samples.map((s) => s?.strokeOpacity)) ?? []).map(fmt),
      ctx,
    );
  }

  if (children.length === 0) return `<path ${attrs.join(' ')} />`;
  return `<path ${attrs.join(' ')}>\n      ${children.join('\n      ')}\n    </path>`;
}

/**
 * Convert a scene to a complete, standalone animated SVG string (SMIL).
 *
 * The scene is seeked to each keyframe to read its state, then left at time 0.
 * An empty scene yields a valid, empty `<svg>` without throwing.
 *
 * @param scene - The scene to export; must support `seek`
 * @param options - Export options
 * @returns The animated SVG markup
 */
export function sceneToAnimatedSVG(
  scene: SmilExportableScene,
  options?: SmilExportOptions,
): string {
  const precision = options?.precision ?? DEFAULT_PRECISION;
  const duration = options?.duration ?? scene.getTimelineDuration?.() ?? DEFAULT_DURATION;
  const count = resolveKeyframeCount(options, duration);

  const entries = collectEntries(scene, count, duration, precision);

  const keyTimes = Array.from({ length: count }, (_, i) => formatNumber(i / (count - 1), 6)).join(
    ';',
  );
  const ctx: PathContext = {
    count,
    precision,
    attributes: new Set(options?.attributes ?? ALL_ATTRIBUTES),
    preferTransform: options?.preferTransform ?? false,
    cfg: { dur: `${formatNumber(duration, 6)}s`, keyTimes, loop: options?.loop ?? true },
  };

  const groups: string[] = [];
  for (const entry of entries) {
    const paths: string[] = [];
    for (const samples of entry.members.values()) {
      const path = buildMemberPath(samples, ctx);
      if (path) paths.push(path);
    }
    if (paths.length === 0) continue;
    const idAttr = entry.userId ? ` data-mobject-id="${escapeAttr(entry.userId)}"` : '';
    groups.push(`  <g${idAttr}>\n    ${paths.join('\n    ')}\n  </g>`);
  }

  const w = formatNumber(scene.getWidth(), precision);
  const h = formatNumber(scene.getHeight(), precision);
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
 * Export a scene as an animated SVG Blob.
 *
 * @param scene - The scene to export
 * @param options - Export options
 * @returns A Blob of type `image/svg+xml`
 */
export function exportAnimatedSVG(scene: SmilExportableScene, options?: SmilExportOptions): Blob {
  return new Blob([sceneToAnimatedSVG(scene, options)], { type: 'image/svg+xml' });
}

/**
 * Convenience helper: export a scene as an animated SVG and download it.
 *
 * Guards the DOM: it throws a clear error when no `document` is available.
 *
 * @param scene - The scene to export
 * @param filename - The target filename. Defaults to 'scene.svg'.
 * @param options - Export options
 */
export function exportAndDownloadAnimatedSVG(
  scene: SmilExportableScene,
  filename: string = 'scene.svg',
  options?: SmilExportOptions,
): void {
  if (typeof document === 'undefined') {
    throw new Error('exportAndDownloadAnimatedSVG requires a DOM (document is undefined)');
  }
  downloadBlob(exportAnimatedSVG(scene, options), filename);
}

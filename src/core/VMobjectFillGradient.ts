/**
 * Gradient fill support for VMobject (per-vertex colors).
 *
 * The fill geometry is a flat triangle list. A gradient is drawn by giving each
 * vertex a color and letting the GPU interpolate between vertices. The earcut
 * triangles only use boundary vertices, so the triangles are first subdivided.
 * This adds interior vertices, and a radial or multi-stop gradient then
 * resolves correctly.
 *
 * Colors are blended in sRGB space and stored in the three.js working color
 * space, so the stop colors show as written.
 */

import * as THREE from 'three';

/** One color stop of a fill gradient. */
export interface FillGradientStop {
  /** Position along the gradient, in [0, 1]. */
  offset: number;
  /** Stop color as a CSS color string. */
  color: string;
}

/** Linear gradient. The axis runs across the fill bounding box. */
export interface LinearFillGradient {
  type: 'linear';
  /** Ordered color stops. */
  stops: FillGradientStop[];
  /** Direction angle in radians. 0 runs left to right, PI/2 runs bottom to top. Default 0. */
  angle?: number;
}

/** Radial gradient. Center and radius use bounding box units (0 to 1). */
export interface RadialFillGradient {
  type: 'radial';
  /** Ordered color stops. */
  stops: FillGradientStop[];
  /** Center as [u, v] in the fill bounding box. Default [0.5, 0.5]. */
  center?: [number, number];
  /** Radius in bounding box units. Default 0.5, so the box edges reach the last stop. */
  radius?: number;
}

/** A fill gradient specification. */
export type FillGradientSpec = LinearFillGradient | RadialFillGradient;

/** Maximum triangle count after subdivision. */
const MAX_TRIANGLES = 30000;

/** Maximum subdivision levels. Each level splits one triangle into four. */
const MAX_SUBDIVISION_LEVELS = 5;

/**
 * Check and copy a gradient spec. Stops are sorted by offset.
 *
 * @param spec - The gradient to check.
 * @returns A deep copy with sorted, clamped stops.
 * @throws When the spec has no stops.
 */
export function normalizeFillGradient(spec: FillGradientSpec): FillGradientSpec {
  if (spec.stops.length === 0) {
    throw new Error('setFillGradient: at least one stop is required');
  }
  const stops = spec.stops
    .map((s) => ({ offset: Math.max(0, Math.min(1, s.offset)), color: s.color }))
    .sort((a, b) => a.offset - b.offset);
  if (spec.type === 'linear') {
    return { type: 'linear', stops, angle: spec.angle ?? 0 };
  }
  return {
    type: 'radial',
    stops,
    center: [spec.center?.[0] ?? 0.5, spec.center?.[1] ?? 0.5],
    radius: spec.radius ?? 0.5,
  };
}

/** Parse the stops into sRGB channel triples (0 to 1). */
function stopChannels(stops: FillGradientStop[]): number[][] {
  const out: THREE.Color = new THREE.Color();
  return stops.map((s) => {
    out.set(s.color);
    const rgb = { r: 0, g: 0, b: 0 };
    out.getRGB(rgb, THREE.SRGBColorSpace);
    return [rgb.r, rgb.g, rgb.b];
  });
}

/** Map a gradient parameter to an sRGB color by stop interpolation. */
function sampleStops(offsets: number[], channels: number[][], t: number): number[] {
  const last = offsets.length - 1;
  if (t <= offsets[0]) return channels[0];
  if (t >= offsets[last]) return channels[last];
  let i = 0;
  while (i < last - 1 && t > offsets[i + 1]) i++;
  const span = offsets[i + 1] - offsets[i];
  const k = span > 0 ? (t - offsets[i]) / span : 1;
  const a = channels[i];
  const b = channels[i + 1];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/**
 * Subdivide every triangle of a flat triangle list into four, repeatedly.
 * The level is the largest one that keeps the triangle count under the cap.
 *
 * @param positions - Flat xyz triangle list (9 floats per triangle).
 * @returns The subdivided triangle list. The input when no level fits.
 */
function subdivideTriangles(positions: Float32Array): Float32Array {
  const triangles = Math.floor(positions.length / 9);
  let level = 0;
  while (level < MAX_SUBDIVISION_LEVELS && triangles * 4 ** (level + 1) <= MAX_TRIANGLES) {
    level++;
  }
  let current = positions;
  for (let l = 0; l < level; l++) {
    current = subdivideOnce(current);
  }
  return current;
}

/** Split each triangle into four by its edge midpoints. */
function subdivideOnce(src: Float32Array): Float32Array {
  const count = Math.floor(src.length / 9);
  const dst = new Float32Array(count * 36);
  let o = 0;
  const push = (p: number[]): void => {
    dst[o++] = p[0];
    dst[o++] = p[1];
    dst[o++] = p[2];
  };
  for (let t = 0; t < count; t++) {
    const b = t * 9;
    const a = [src[b], src[b + 1], src[b + 2]];
    const c = [src[b + 3], src[b + 4], src[b + 5]];
    const d = [src[b + 6], src[b + 7], src[b + 8]];
    const ac = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
    const cd = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2, (c[2] + d[2]) / 2];
    const da = [(d[0] + a[0]) / 2, (d[1] + a[1]) / 2, (d[2] + a[2]) / 2];
    for (const p of [a, ac, da, ac, c, cd, da, cd, d, ac, cd, da]) push(p);
  }
  return dst;
}

/**
 * Compute one color per vertex for a gradient.
 *
 * @param positions - Flat xyz vertex positions.
 * @param spec - A normalized gradient spec.
 * @returns A flat rgb array (3 floats per vertex) in the working color space.
 */
function computeGradientColors(positions: Float32Array, spec: FillGradientSpec): Float32Array {
  const n = Math.floor(positions.length / 3);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, positions[i * 3]);
    maxX = Math.max(maxX, positions[i * 3]);
    minY = Math.min(minY, positions[i * 3 + 1]);
    maxY = Math.max(maxY, positions[i * 3 + 1]);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const offsets = spec.stops.map((s) => s.offset);
  const channels = stopChannels(spec.stops);
  const colors = new Float32Array(n * 3);
  const work = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const t = gradientParameter(spec, x - minX, y - minY, w, h);
    const rgb = sampleStops(offsets, channels, t);
    work.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
    colors[i * 3] = work.r;
    colors[i * 3 + 1] = work.g;
    colors[i * 3 + 2] = work.b;
  }
  return colors;
}

/** The gradient parameter t in [0, 1] for a point given relative to the box corner. */
function gradientParameter(
  spec: FillGradientSpec,
  dx: number,
  dy: number,
  w: number,
  h: number,
): number {
  if (spec.type === 'linear') {
    const cos = Math.cos(spec.angle ?? 0);
    const sin = Math.sin(spec.angle ?? 0);
    const length = w * Math.abs(cos) + h * Math.abs(sin);
    if (length < 1e-9) return 0;
    const proj = (dx - w / 2) * cos + (dy - h / 2) * sin;
    return Math.max(0, Math.min(1, proj / length + 0.5));
  }
  const u = w > 1e-9 ? dx / w : 0.5;
  const v = h > 1e-9 ? dy / h : 0.5;
  const radius = spec.radius ?? 0.5;
  if (radius <= 0) return 1;
  const cu = spec.center?.[0] ?? 0.5;
  const cv = spec.center?.[1] ?? 0.5;
  return Math.max(0, Math.min(1, Math.hypot(u - cu, v - cv) / radius));
}

/**
 * Replace a fill geometry with a subdivided copy that has a `color` attribute.
 *
 * @param geometry - Non-indexed triangle geometry. It is disposed.
 * @param spec - A normalized gradient spec.
 * @returns A new geometry with `position` and `color` attributes.
 */
export function buildGradientFillGeometry(
  geometry: THREE.BufferGeometry,
  spec: FillGradientSpec,
): THREE.BufferGeometry {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const attr = source.getAttribute('position');
  const flat = new Float32Array(attr.count * 3);
  for (let i = 0; i < attr.count; i++) {
    flat[i * 3] = attr.getX(i);
    flat[i * 3 + 1] = attr.getY(i);
    flat[i * 3 + 2] = attr.getZ(i);
  }
  const positions = subdivideTriangles(flat);
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  result.setAttribute(
    'color',
    new THREE.BufferAttribute(computeGradientColors(positions, spec), 3),
  );
  if (source !== geometry) source.dispose();
  geometry.dispose();
  return result;
}

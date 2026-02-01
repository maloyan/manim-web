/**
 * BezierRenderer - Converts VMobject cubic Bezier data into instanced Three.js
 * geometry for GPU-accelerated SDF curve rendering.
 *
 * Each cubic Bezier segment of a VMobject becomes one instance of a screen-aligned
 * quad. The BezierShaderMaterial's fragment shader evaluates the SDF per-pixel to
 * produce anti-aliased strokes with variable width and round caps.
 *
 * Usage:
 * ```ts
 * const renderer = new BezierRenderer({ resolution: [1920, 1080] });
 * const mesh = renderer.buildMesh(vmobject);
 * scene.add(mesh);
 *
 * // On resize:
 * renderer.updateResolution(newWidth, newHeight, pixelRatio);
 *
 * // When VMobject points change:
 * renderer.updateMesh(mesh, vmobject);
 * ```
 */

import * as THREE from 'three';
import {
  createBezierShaderMaterial,
  updateBezierMaterialResolution,
  type BezierShaderMaterialOptions,
} from './BezierShaderMaterial';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BezierRendererOptions {
  /** Renderer resolution [width, height] in CSS pixels. Default: [800, 450] */
  resolution?: [number, number];
  /** Device pixel ratio. Default: 1 */
  pixelRatio?: number;
  /** Additional material options */
  materialOptions?: BezierShaderMaterialOptions;
}

/**
 * Per-segment data extracted from a VMobject or provided directly.
 */
export interface BezierSegment {
  /** Control point 0 (start anchor) */
  p0: number[];
  /** Control point 1 */
  p1: number[];
  /** Control point 2 */
  p2: number[];
  /** Control point 3 (end anchor) */
  p3: number[];
  /** Stroke width at start of segment */
  widthStart: number;
  /** Stroke width at end of segment */
  widthEnd: number;
  /** RGBA color [r, g, b, a] where each channel is 0..1 */
  color: [number, number, number, number];
}

// ---------------------------------------------------------------------------
// Quad template
// ---------------------------------------------------------------------------

/**
 * 6 vertices forming 2 triangles for each quad instance.
 * UV coordinates map to bounding-box corners:
 *   (0,0), (1,0), (1,1),   // triangle 1
 *   (0,0), (1,1), (0,1)    // triangle 2
 */
const QUAD_UVS = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1,
]);

// ---------------------------------------------------------------------------
// BezierRenderer
// ---------------------------------------------------------------------------

export class BezierRenderer {
  private _material: THREE.ShaderMaterial;
  private _pixelRatio: number;

  constructor(options: BezierRendererOptions = {}) {
    const {
      resolution = [800, 450],
      pixelRatio = 1,
      materialOptions = {},
    } = options;

    this._pixelRatio = pixelRatio;

    this._material = createBezierShaderMaterial({
      ...materialOptions,
      pixelRatio,
      resolution,
    });
  }

  /** Access the underlying ShaderMaterial (e.g. to update uniforms). */
  get material(): THREE.ShaderMaterial {
    return this._material;
  }

  /**
   * Update renderer resolution. Call on window/canvas resize.
   */
  updateResolution(width: number, height: number, pixelRatio?: number): void {
    if (pixelRatio !== undefined) this._pixelRatio = pixelRatio;
    updateBezierMaterialResolution(this._material, width, height, this._pixelRatio);
  }

  // -----------------------------------------------------------------------
  // Segment extraction helpers
  // -----------------------------------------------------------------------

  /**
   * Extract cubic Bezier segments from a VMobject-like object.
   *
   * VMobject stores points as:
   *   [anchor0, handle0, handle1, anchor1, handle2, handle3, anchor2, ...]
   * Each group of 4 consecutive points (stepping by 3) is one cubic segment.
   *
   * @param points - The VMobject's 3D points array
   * @param strokeWidth - Uniform stroke width (or start width)
   * @param strokeWidthEnd - End stroke width for variable width. Defaults to strokeWidth.
   * @param color - CSS color string
   * @param opacity - Overall opacity 0..1
   * @returns Array of BezierSegment
   */
  static extractSegments(
    points: number[][],
    strokeWidth: number,
    strokeWidthEnd?: number,
    color: string = '#ffffff',
    opacity: number = 1,
  ): BezierSegment[] {
    const segments: BezierSegment[] = [];
    if (points.length < 4) return segments;

    // Parse color once
    const threeColor = new THREE.Color(color);
    const rgba: [number, number, number, number] = [
      threeColor.r,
      threeColor.g,
      threeColor.b,
      opacity,
    ];

    const numSegments = Math.floor((points.length - 1) / 3);
    const wEnd = strokeWidthEnd ?? strokeWidth;

    for (let i = 0; i < numSegments; i++) {
      const idx = i * 3;
      // Linearly interpolate stroke width across segments
      const t0 = numSegments > 1 ? i / (numSegments - 1) : 0;
      const t1 = numSegments > 1 ? (i + 1) / (numSegments - 1) : 1;
      // Clamp t1 because the last segment's end is at t=1
      const w0 = strokeWidth + (wEnd - strokeWidth) * t0;
      const w1 = strokeWidth + (wEnd - strokeWidth) * Math.min(t1, 1);

      segments.push({
        p0: points[idx],
        p1: points[idx + 1],
        p2: points[idx + 2],
        p3: points[idx + 3],
        widthStart: w0,
        widthEnd: w1,
        color: rgba,
      });
    }

    return segments;
  }

  // -----------------------------------------------------------------------
  // Geometry building
  // -----------------------------------------------------------------------

  /**
   * Build an InstancedMesh for the given Bezier segments.
   *
   * @param segments - Array of BezierSegment
   * @returns THREE.Mesh using InstancedBufferGeometry
   */
  buildMeshFromSegments(segments: BezierSegment[]): THREE.Mesh {
    const count = segments.length;
    if (count === 0) {
      // Return an empty mesh (hidden)
      const geo = new THREE.BufferGeometry();
      const mesh = new THREE.Mesh(geo, this._material);
      mesh.visible = false;
      return mesh;
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = count;

    // Per-vertex quad UVs (shared across all instances)
    geometry.setAttribute('aQuadUV', new THREE.BufferAttribute(QUAD_UVS, 2));

    // Per-instance attributes
    const p0 = new Float32Array(count * 3);
    const p1 = new Float32Array(count * 3);
    const p2 = new Float32Array(count * 3);
    const p3 = new Float32Array(count * 3);
    const wStart = new Float32Array(count);
    const wEnd = new Float32Array(count);
    const colors = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const seg = segments[i];
      const i3 = i * 3;
      const i4 = i * 4;

      p0[i3]     = seg.p0[0]; p0[i3 + 1] = seg.p0[1]; p0[i3 + 2] = seg.p0[2] ?? 0;
      p1[i3]     = seg.p1[0]; p1[i3 + 1] = seg.p1[1]; p1[i3 + 2] = seg.p1[2] ?? 0;
      p2[i3]     = seg.p2[0]; p2[i3 + 1] = seg.p2[1]; p2[i3 + 2] = seg.p2[2] ?? 0;
      p3[i3]     = seg.p3[0]; p3[i3 + 1] = seg.p3[1]; p3[i3 + 2] = seg.p3[2] ?? 0;

      wStart[i] = seg.widthStart;
      wEnd[i]   = seg.widthEnd;

      colors[i4]     = seg.color[0];
      colors[i4 + 1] = seg.color[1];
      colors[i4 + 2] = seg.color[2];
      colors[i4 + 3] = seg.color[3];
    }

    geometry.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 3));
    geometry.setAttribute('aP1', new THREE.InstancedBufferAttribute(p1, 3));
    geometry.setAttribute('aP2', new THREE.InstancedBufferAttribute(p2, 3));
    geometry.setAttribute('aP3', new THREE.InstancedBufferAttribute(p3, 3));
    geometry.setAttribute('aWidthStart', new THREE.InstancedBufferAttribute(wStart, 1));
    geometry.setAttribute('aWidthEnd', new THREE.InstancedBufferAttribute(wEnd, 1));
    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 4));

    const mesh = new THREE.Mesh(geometry, this._material);
    mesh.frustumCulled = false; // Bounds are computed in screen space by shader
    return mesh;
  }

  /**
   * Convenience: build a mesh directly from VMobject-style data.
   *
   * @param points - Cubic Bezier control points (from VMobject.getVisiblePoints3D())
   * @param strokeWidth - Stroke width
   * @param color - CSS color string
   * @param opacity - Opacity 0..1
   * @param strokeWidthEnd - End stroke width for tapering (optional)
   * @returns THREE.Mesh
   */
  buildMesh(
    points: number[][],
    strokeWidth: number,
    color: string = '#ffffff',
    opacity: number = 1,
    strokeWidthEnd?: number,
  ): THREE.Mesh {
    const segments = BezierRenderer.extractSegments(
      points, strokeWidth, strokeWidthEnd, color, opacity,
    );
    return this.buildMeshFromSegments(segments);
  }

  /**
   * Update an existing mesh's instance data without reallocating geometry
   * (when segment count is the same) or rebuild if count differs.
   *
   * @param mesh - Previously built mesh
   * @param segments - New segment data
   * @returns The (possibly new) mesh
   */
  updateMeshFromSegments(mesh: THREE.Mesh, segments: BezierSegment[]): THREE.Mesh {
    const geo = mesh.geometry as THREE.InstancedBufferGeometry;
    const count = segments.length;

    // If segment count changed, rebuild
    if (!geo.isInstancedBufferGeometry || geo.instanceCount !== count) {
      geo.dispose();
      const newMesh = this.buildMeshFromSegments(segments);
      // Preserve transform
      newMesh.position.copy(mesh.position);
      newMesh.rotation.copy(mesh.rotation);
      newMesh.scale.copy(mesh.scale);
      return newMesh;
    }

    if (count === 0) {
      mesh.visible = false;
      return mesh;
    }

    mesh.visible = true;

    // Update in-place
    const p0Attr = geo.getAttribute('aP0') as THREE.InstancedBufferAttribute;
    const p1Attr = geo.getAttribute('aP1') as THREE.InstancedBufferAttribute;
    const p2Attr = geo.getAttribute('aP2') as THREE.InstancedBufferAttribute;
    const p3Attr = geo.getAttribute('aP3') as THREE.InstancedBufferAttribute;
    const wStartAttr = geo.getAttribute('aWidthStart') as THREE.InstancedBufferAttribute;
    const wEndAttr = geo.getAttribute('aWidthEnd') as THREE.InstancedBufferAttribute;
    const colorAttr = geo.getAttribute('aColor') as THREE.InstancedBufferAttribute;

    for (let i = 0; i < count; i++) {
      const seg = segments[i];
      const i3 = i * 3;
      const i4 = i * 4;

      p0Attr.array[i3]     = seg.p0[0]; p0Attr.array[i3 + 1] = seg.p0[1]; p0Attr.array[i3 + 2] = seg.p0[2] ?? 0;
      p1Attr.array[i3]     = seg.p1[0]; p1Attr.array[i3 + 1] = seg.p1[1]; p1Attr.array[i3 + 2] = seg.p1[2] ?? 0;
      p2Attr.array[i3]     = seg.p2[0]; p2Attr.array[i3 + 1] = seg.p2[1]; p2Attr.array[i3 + 2] = seg.p2[2] ?? 0;
      p3Attr.array[i3]     = seg.p3[0]; p3Attr.array[i3 + 1] = seg.p3[1]; p3Attr.array[i3 + 2] = seg.p3[2] ?? 0;

      (wStartAttr.array as Float32Array)[i] = seg.widthStart;
      (wEndAttr.array as Float32Array)[i]   = seg.widthEnd;

      colorAttr.array[i4]     = seg.color[0];
      colorAttr.array[i4 + 1] = seg.color[1];
      colorAttr.array[i4 + 2] = seg.color[2];
      colorAttr.array[i4 + 3] = seg.color[3];
    }

    p0Attr.needsUpdate = true;
    p1Attr.needsUpdate = true;
    p2Attr.needsUpdate = true;
    p3Attr.needsUpdate = true;
    wStartAttr.needsUpdate = true;
    wEndAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    return mesh;
  }

  /**
   * Convenience: update from VMobject-style data.
   */
  updateMesh(
    mesh: THREE.Mesh,
    points: number[][],
    strokeWidth: number,
    color: string = '#ffffff',
    opacity: number = 1,
    strokeWidthEnd?: number,
  ): THREE.Mesh {
    const segments = BezierRenderer.extractSegments(
      points, strokeWidth, strokeWidthEnd, color, opacity,
    );
    return this.updateMeshFromSegments(mesh, segments);
  }

  /**
   * Dispose the shared material. Call when the renderer is no longer needed.
   */
  dispose(): void {
    this._material.dispose();
  }
}

/**
 * BezierShaderMaterial - ManimGL-quality Bezier curve rendering via Three.js ShaderMaterial.
 *
 * Uses GPU-evaluated signed distance fields (SDF) for cubic Bezier curves
 * to achieve pixel-perfect anti-aliasing, variable stroke width, and round
 * caps/joints -- the signature "ManimGL look."
 *
 * Each curve segment is a screen-aligned quad (two triangles) that bounds the
 * Bezier curve with padding for stroke width. The fragment shader computes the
 * exact closest-point distance to the cubic Bezier via iterative Newton refinement,
 * then applies smoothstep anti-aliasing.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// GLSL shader source
// ---------------------------------------------------------------------------

/**
 * Vertex shader.
 *
 * Per-instance attributes carry four cubic Bezier control points (p0..p3),
 * stroke width at start/end, and color + opacity.
 *
 * For each of the 6 vertices (2 triangles) we compute an oriented bounding
 * quad in clip-space that encloses the Bezier curve with sufficient padding
 * for the stroke width plus anti-aliasing margin.
 */
const vertexShader = /* glsl */ `
precision highp float;

// Per-instance attributes (one set per curve segment)
attribute vec3 aP0;
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute float aWidthStart;
attribute float aWidthEnd;
attribute vec4 aColor;       // (r, g, b, a)

// Per-vertex attribute: quad corner index encoded as (u, v)
// u in [-1, 1] across the quad width, v in [0, 1] along the curve
attribute vec2 aQuadUV;

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uPixelRatio;
uniform vec2 uResolution;

// Varyings passed to fragment shader
varying vec2 vUV;         // (u, v) of the quad corner
varying vec4 vColor;
varying float vWidthStart;
varying float vWidthEnd;
// Control points in *screen-pixel* space for fragment SDF evaluation
varying vec2 vP0;
varying vec2 vP1;
varying vec2 vP2;
varying vec2 vP3;
// Half-width in pixel space at start and end
varying float vHalfWidthPx0;
varying float vHalfWidthPx1;

// Convert a clip-space position to screen-pixel coordinates
vec2 clipToScreen(vec4 clip) {
  vec2 ndc = clip.xy / clip.w;               // [-1, 1]
  return (ndc * 0.5 + 0.5) * uResolution;    // [0, resolution]
}

void main() {
  // Transform control points to clip space
  vec4 cp0 = projectionMatrix * modelViewMatrix * vec4(aP0, 1.0);
  vec4 cp1 = projectionMatrix * modelViewMatrix * vec4(aP1, 1.0);
  vec4 cp2 = projectionMatrix * modelViewMatrix * vec4(aP2, 1.0);
  vec4 cp3 = projectionMatrix * modelViewMatrix * vec4(aP3, 1.0);

  // Screen-pixel positions
  vec2 sp0 = clipToScreen(cp0);
  vec2 sp1 = clipToScreen(cp1);
  vec2 sp2 = clipToScreen(cp2);
  vec2 sp3 = clipToScreen(cp3);

  // Pass to fragment
  vP0 = sp0;
  vP1 = sp1;
  vP2 = sp2;
  vP3 = sp3;
  vColor = aColor;
  vWidthStart = aWidthStart;
  vWidthEnd = aWidthEnd;

  // Compute half-width in pixels
  // strokeWidth is in world units; convert via approximate world->pixel scale
  // We estimate pixels-per-world-unit from the projection of a unit length
  vec4 originClip = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec4 unitClip   = projectionMatrix * modelViewMatrix * vec4(1.0, 0.0, 0.0, 1.0);
  vec2 originPx = clipToScreen(originClip);
  vec2 unitPx   = clipToScreen(unitClip);
  float pxPerUnit = length(unitPx - originPx);

  // Use pixel-based widths: strokeWidth already in approximate pixel units from Manim.
  // ManimGL uses stroke_width in pixel-like units. We convert by pxPerUnit so that
  // the visual result matches the requested strokeWidth.
  vHalfWidthPx0 = aWidthStart * 0.5 * uPixelRatio;
  vHalfWidthPx1 = aWidthEnd   * 0.5 * uPixelRatio;

  // Build bounding box of the 4 screen-space control points
  vec2 bmin = min(min(sp0, sp1), min(sp2, sp3));
  vec2 bmax = max(max(sp0, sp1), max(sp2, sp3));

  // Pad by maximum stroke half-width + AA margin
  float maxHalf = max(vHalfWidthPx0, vHalfWidthPx1);
  float pad = maxHalf + 4.0; // extra 4px for AA
  bmin -= pad;
  bmax += pad;

  // aQuadUV maps the 6 vertices of two triangles to the bounding quad corners:
  //   (0,0)=bottom-left, (1,0)=bottom-right, (1,1)=top-right,
  //   (0,0), (1,1), (0,1)=top-left
  vec2 screenPos = mix(bmin, bmax, aQuadUV);

  // Convert screen position back to clip space
  vec2 ndc = (screenPos / uResolution) * 2.0 - 1.0;

  // Interpolated w for depth — use average of control point clips
  float avgW = (cp0.w + cp1.w + cp2.w + cp3.w) * 0.25;
  // Average Z for depth ordering
  float avgZ = (cp0.z / cp0.w + cp1.z / cp1.w + cp2.z / cp2.w + cp3.z / cp3.w) * 0.25;

  gl_Position = vec4(ndc * avgW, avgZ * avgW, avgW);

  // Pass screen-space UV so the fragment knows its pixel position
  vUV = screenPos;
}
`;

/**
 * Fragment shader.
 *
 * For each pixel, compute the minimum distance to the cubic Bezier curve
 * B(t) defined by (vP0, vP1, vP2, vP3) in screen-pixel coordinates.
 * Apply stroke width (linearly interpolated along the curve parameter)
 * and anti-aliasing via smoothstep.
 */
const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUV;
varying vec4 vColor;
varying float vWidthStart;
varying float vWidthEnd;
varying vec2 vP0;
varying vec2 vP1;
varying vec2 vP2;
varying vec2 vP3;
varying float vHalfWidthPx0;
varying float vHalfWidthPx1;

// Evaluate cubic Bezier at parameter t
vec2 evalBezier(float t) {
  float s = 1.0 - t;
  float s2 = s * s;
  float s3 = s2 * s;
  float t2 = t * t;
  float t3 = t2 * t;
  return s3 * vP0 + 3.0 * s2 * t * vP1 + 3.0 * s * t2 * vP2 + t3 * vP3;
}

// Evaluate derivative of cubic Bezier at parameter t
vec2 evalBezierDeriv(float t) {
  float s = 1.0 - t;
  float s2 = s * s;
  float t2 = t * t;
  // B'(t) = 3(1-t)^2 (P1-P0) + 6(1-t)t (P2-P1) + 3t^2 (P3-P2)
  return 3.0 * s2 * (vP1 - vP0) + 6.0 * s * t * (vP2 - vP1) + 3.0 * t2 * (vP3 - vP2);
}

// Find closest parameter t on the cubic Bezier to point p.
// Uses coarse sampling followed by Newton refinement.
// Returns vec2(distance, t).
vec2 closestPointOnBezier(vec2 p) {
  // Coarse sampling
  float bestT = 0.0;
  float bestDist2 = 1e20;

  // Sample at 16 points along the curve
  for (int i = 0; i <= 16; i++) {
    float t = float(i) / 16.0;
    vec2 pt = evalBezier(t) - p;
    float d2 = dot(pt, pt);
    if (d2 < bestDist2) {
      bestDist2 = d2;
      bestT = t;
    }
  }

  // Newton-Raphson refinement (5 iterations)
  // Minimize f(t) = |B(t) - p|^2
  // f'(t) = 2 * dot(B(t) - p, B'(t))
  // f''(t) = 2 * (dot(B'(t), B'(t)) + dot(B(t) - p, B''(t)))
  // We use simplified Newton: t_new = t - f'(t) / f''(t)
  for (int i = 0; i < 5; i++) {
    vec2 diff = evalBezier(bestT) - p;
    vec2 deriv = evalBezierDeriv(bestT);

    float f1 = dot(diff, deriv);

    // Second derivative of the cubic Bezier
    float s = 1.0 - bestT;
    vec2 d2 = 6.0 * s * (vP2 - 2.0 * vP1 + vP0) + 6.0 * bestT * (vP3 - 2.0 * vP2 + vP1);
    float f2 = dot(deriv, deriv) + dot(diff, d2);

    if (abs(f2) > 1e-6) {
      bestT -= f1 / f2;
    }
    bestT = clamp(bestT, 0.0, 1.0);
  }

  vec2 closest = evalBezier(bestT) - p;
  return vec2(length(closest), bestT);
}

void main() {
  vec2 result = closestPointOnBezier(vUV);
  float dist = result.x;
  float t = result.y;

  // Interpolate half-width along the curve parameter
  float halfWidth = mix(vHalfWidthPx0, vHalfWidthPx1, t);

  // Anti-aliasing via smoothstep: 1.0px transition zone
  float aa = 1.0;
  float alpha = 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, dist);

  if (alpha < 0.001) discard;

  gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
}
`;

// ---------------------------------------------------------------------------
// Configuration interface
// ---------------------------------------------------------------------------

export interface BezierShaderMaterialOptions {
  /** Enable transparency. Default: true */
  transparent?: boolean;
  /** Depth test. Default: true */
  depthTest?: boolean;
  /** Depth write. Default: false (for proper alpha blending) */
  depthWrite?: boolean;
  /** Blending mode. Default: THREE.NormalBlending */
  blending?: THREE.Blending;
  /** Side to render. Default: THREE.DoubleSide */
  side?: THREE.Side;
  /** Device pixel ratio. Default: 1 */
  pixelRatio?: number;
  /** Renderer resolution [width, height] in CSS pixels */
  resolution?: [number, number];
}

// ---------------------------------------------------------------------------
// Material factory
// ---------------------------------------------------------------------------

/**
 * Create a Three.js ShaderMaterial configured for Bezier curve SDF rendering.
 *
 * The material expects instanced geometry where each instance carries:
 *   aP0, aP1, aP2, aP3  - cubic Bezier control points (vec3)
 *   aWidthStart, aWidthEnd - stroke width at t=0 and t=1 (float)
 *   aColor                 - RGBA color (vec4)
 *
 * And per-vertex:
 *   aQuadUV - quad corner coordinate (vec2)
 *
 * @param options - Material configuration
 * @returns Configured ShaderMaterial
 */
export function createBezierShaderMaterial(
  options: BezierShaderMaterialOptions = {}
): THREE.ShaderMaterial {
  const {
    transparent = true,
    depthTest = true,
    depthWrite = false,
    blending = THREE.NormalBlending,
    side = THREE.DoubleSide,
    pixelRatio = 1,
    resolution = [800, 450],
  } = options;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPixelRatio: { value: pixelRatio },
      uResolution: { value: new THREE.Vector2(resolution[0], resolution[1]) },
    },
    transparent,
    depthTest,
    depthWrite,
    blending,
    side,
  });
}

/**
 * Update the resolution uniform on a BezierShaderMaterial.
 * Call this when the renderer resizes.
 */
export function updateBezierMaterialResolution(
  material: THREE.ShaderMaterial,
  width: number,
  height: number,
  pixelRatio: number = 1
): void {
  if (material.uniforms.uResolution) {
    material.uniforms.uResolution.value.set(width, height);
  }
  if (material.uniforms.uPixelRatio) {
    material.uniforms.uPixelRatio.value = pixelRatio;
  }
}

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a MandelbrotSet visualization
 */
export interface MandelbrotSetOptions {
  /** Width of the render plane in world units. Default: 8 */
  width?: number;
  /** Height of the render plane in world units. Default: 6 */
  height?: number;
  /** Center of the view in the complex plane [re, im]. Default: [-0.5, 0] */
  center?: [number, number];
  /** Zoom level (higher = more zoomed in). Default: 1 */
  zoom?: number;
  /** Maximum iteration count. Default: 100 */
  maxIterations?: number;
  /** Saturation for HSL-based coloring (0-1). Default: 0.8 */
  saturation?: number;
  /** Lightness for HSL-based coloring (0-1). Default: 0.5 */
  lightness?: number;
  /** Opacity (0-1). Default: 1 */
  opacity?: number;
}

// ---------------------------------------------------------------------------
// Vertex shader (shared simple pass-through)
// ---------------------------------------------------------------------------
const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Fragment shader for the Mandelbrot set
// ---------------------------------------------------------------------------
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec2  u_center;
  uniform float u_zoom;
  uniform int   u_maxIter;
  uniform float u_saturation;
  uniform float u_lightness;
  uniform float u_aspectRatio;
  uniform float u_opacity;

  varying vec2 vUv;

  // HSL -> RGB conversion (attempt-free, standard formula)
  vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    float hue = h * 6.0;
    if      (hue < 1.0) rgb = vec3(c, x, 0.0);
    else if (hue < 2.0) rgb = vec3(x, c, 0.0);
    else if (hue < 3.0) rgb = vec3(0.0, c, x);
    else if (hue < 4.0) rgb = vec3(0.0, x, c);
    else if (hue < 5.0) rgb = vec3(x, 0.0, c);
    else                 rgb = vec3(c, 0.0, x);
    return rgb + m;
  }

  void main() {
    // Map UV [0,1] to complex plane, accounting for aspect ratio and zoom
    float scale = 3.5 / u_zoom;
    vec2 c = vec2(
      (vUv.x - 0.5) * scale * u_aspectRatio + u_center.x,
      (vUv.y - 0.5) * scale               + u_center.y
    );

    vec2 z = vec2(0.0);
    int iter = 0;

    // Main iteration loop
    for (int i = 0; i < 2000; i++) {
      if (i >= u_maxIter) break;
      if (dot(z, z) > 4.0) break;
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      iter = i + 1;
    }

    if (iter >= u_maxIter) {
      // Inside the set: black
      gl_FragColor = vec4(0.0, 0.0, 0.0, u_opacity);
    } else {
      // Smooth (continuous) iteration count for anti-banding
      float smoothIter = float(iter) - log2(log2(dot(z, z))) + 4.0;
      float hue = mod(smoothIter * 0.02 + 0.6, 1.0);
      vec3 rgb = hsl2rgb(hue, u_saturation, u_lightness);
      gl_FragColor = vec4(rgb, u_opacity);
    }
  }
`;

/**
 * MandelbrotSet -- GPU-accelerated Mandelbrot set visualisation.
 *
 * Renders the classic Mandelbrot fractal on a full-screen quad using a custom
 * GLSL fragment shader.  All view parameters (center, zoom, maxIterations)
 * are exposed as animatable uniforms so they can be driven by the Timeline.
 *
 * @example
 * ```typescript
 * const mandelbrot = new MandelbrotSet({
 *   width: 8,
 *   height: 6,
 *   center: [-0.5, 0],
 *   zoom: 1,
 *   maxIterations: 200,
 * });
 * scene.add(mandelbrot);
 *
 * // Animate a zoom into a region
 * mandelbrot.setCenter([-0.7435, 0.1314]);
 * mandelbrot.setZoom(500);
 * ```
 */
export class MandelbrotSet extends Mobject {
  private _width: number;
  private _height: number;
  private _center: [number, number];
  private _zoom: number;
  private _maxIterations: number;
  private _saturation: number;
  private _lightness: number;
  private _material: THREE.ShaderMaterial | null = null;

  constructor(options: MandelbrotSetOptions = {}) {
    super();

    const {
      width = 8,
      height = 6,
      center = [-0.5, 0],
      zoom = 1,
      maxIterations = 100,
      saturation = 0.8,
      lightness = 0.5,
      opacity = 1,
    } = options;

    this._width = width;
    this._height = height;
    this._center = [...center];
    this._zoom = zoom;
    this._maxIterations = maxIterations;
    this._saturation = saturation;
    this._lightness = lightness;
    this._opacity = opacity;
    this.fillOpacity = opacity;
  }

  // -----------------------------------------------------------------------
  // Three.js object creation
  // -----------------------------------------------------------------------

  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.PlaneGeometry(this._width, this._height);

    this._material = new THREE.ShaderMaterial({
      uniforms: {
        u_center:      { value: new THREE.Vector2(this._center[0], this._center[1]) },
        u_zoom:        { value: this._zoom },
        u_maxIter:     { value: this._maxIterations },
        u_saturation:  { value: this._saturation },
        u_lightness:   { value: this._lightness },
        u_aspectRatio: { value: this._width / this._height },
        u_opacity:     { value: this._opacity },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, this._material);
  }

  // -----------------------------------------------------------------------
  // Material sync
  // -----------------------------------------------------------------------

  protected override _syncMaterialToThree(): void {
    if (!this._material) return;

    const u = this._material.uniforms;
    u.u_center.value.set(this._center[0], this._center[1]);
    u.u_zoom.value        = this._zoom;
    u.u_maxIter.value     = this._maxIterations;
    u.u_saturation.value  = this._saturation;
    u.u_lightness.value   = this._lightness;
    u.u_aspectRatio.value = this._width / this._height;
    u.u_opacity.value     = this._opacity;
    this._material.transparent = this._opacity < 1;
    this._material.needsUpdate = true;
  }

  // -----------------------------------------------------------------------
  // Public API -- setters return `this` for chaining
  // -----------------------------------------------------------------------

  /** Set the center of the view in the complex plane. */
  setCenter(center: [number, number]): this {
    this._center = [...center];
    this._markDirty();
    return this;
  }

  /** Get the current view center. */
  override getCenter(): Vector3Tuple {
    return [this._center[0], this._center[1], 0];
  }

  /** Set the zoom level (higher = more zoomed in). */
  setZoom(zoom: number): this {
    this._zoom = zoom;
    this._markDirty();
    return this;
  }

  /** Get the current zoom level. */
  getZoom(): number {
    return this._zoom;
  }

  /** Set the maximum number of iterations. */
  setMaxIterations(maxIter: number): this {
    this._maxIterations = Math.max(1, Math.round(maxIter));
    this._markDirty();
    return this;
  }

  /** Get the maximum number of iterations. */
  getMaxIterations(): number {
    return this._maxIterations;
  }

  /** Set HSL saturation (0-1). */
  setSaturation(s: number): this {
    this._saturation = Math.max(0, Math.min(1, s));
    this._markDirty();
    return this;
  }

  /** Get HSL saturation. */
  getSaturation(): number {
    return this._saturation;
  }

  /** Set HSL lightness (0-1). */
  setLightness(l: number): this {
    this._lightness = Math.max(0, Math.min(1, l));
    this._markDirty();
    return this;
  }

  /** Get HSL lightness. */
  getLightness(): number {
    return this._lightness;
  }

  /** Set the display width in world units. */
  setWidth(w: number): this {
    this._width = w;
    this._markDirty();
    return this;
  }

  /** Get the display width. */
  getWidth(): number {
    return this._width;
  }

  /** Set the display height in world units. */
  setHeight(h: number): this {
    this._height = h;
    this._markDirty();
    return this;
  }

  /** Get the display height. */
  getHeight(): number {
    return this._height;
  }

  // -----------------------------------------------------------------------
  // Copy
  // -----------------------------------------------------------------------

  protected override _createCopy(): MandelbrotSet {
    return new MandelbrotSet({
      width: this._width,
      height: this._height,
      center: [...this._center],
      zoom: this._zoom,
      maxIterations: this._maxIterations,
      saturation: this._saturation,
      lightness: this._lightness,
      opacity: this._opacity,
    });
  }

  // -----------------------------------------------------------------------
  // Disposal
  // -----------------------------------------------------------------------

  /** Free GPU resources. */
  dispose(): void {
    if (this._material) {
      this._material.dispose();
      this._material = null;
    }
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
    }
  }
}

export default MandelbrotSet;

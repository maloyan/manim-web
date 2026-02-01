import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';

/**
 * Maximum number of polynomial coefficients supported by the shader.
 * The shader uses a fixed-length array; coefficients beyond this count
 * are silently ignored.
 */
const MAX_COEFF = 12;

/**
 * Options for creating a NewtonFractal visualization
 */
export interface NewtonFractalOptions {
  /** Width of the render plane in world units. Default: 8 */
  width?: number;
  /** Height of the render plane in world units. Default: 6 */
  height?: number;
  /** Center of the view in the complex plane [re, im]. Default: [0, 0] */
  center?: [number, number];
  /** Zoom level (higher = more zoomed in). Default: 1 */
  zoom?: number;
  /** Maximum iteration count. Default: 40 */
  maxIterations?: number;
  /**
   * Polynomial coefficients in ascending degree order.
   * e.g. [-1, 0, 0, 1] represents z^3 - 1  (coeff[0]*z^0 + ... + coeff[3]*z^3).
   * Default: [-1, 0, 0, 1]  (z^3 - 1)
   */
  coefficients?: number[];
  /** Convergence threshold. Default: 1e-6 */
  tolerance?: number;
  /** Root color saturation (0-1). Default: 0.85 */
  saturation?: number;
  /** Root color lightness (0-1). Default: 0.5 */
  lightness?: number;
  /** Opacity (0-1). Default: 1 */
  opacity?: number;
}

// ---------------------------------------------------------------------------
// Vertex shader
// ---------------------------------------------------------------------------
const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Fragment shader for Newton's method fractal
// ---------------------------------------------------------------------------
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  // View uniforms
  uniform vec2  u_center;
  uniform float u_zoom;
  uniform int   u_maxIter;
  uniform float u_aspectRatio;
  uniform float u_opacity;

  // Polynomial uniforms
  uniform vec2  u_coeffs[${MAX_COEFF}];  // complex coefficients (re, im)
  uniform int   u_numCoeffs;              // number of coefficients supplied
  uniform float u_tolerance;

  // Coloring
  uniform float u_saturation;
  uniform float u_lightness;

  varying vec2 vUv;

  // ---- complex arithmetic helpers ----
  vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  vec2 cdiv(vec2 a, vec2 b) {
    float denom = dot(b, b);
    return vec2(
      (a.x * b.x + a.y * b.y) / denom,
      (a.y * b.x - a.x * b.y) / denom
    );
  }

  // Evaluate polynomial and its derivative at z using Horner's method.
  // Coefficients are in ascending degree order: c0 + c1*z + c2*z^2 + ...
  void polyEval(vec2 z, out vec2 fz, out vec2 dfz) {
    // Horner evaluation from highest degree downward
    int deg = u_numCoeffs - 1;
    fz  = vec2(0.0);
    dfz = vec2(0.0);

    // We iterate from the highest coefficient to the lowest.
    for (int i = ${MAX_COEFF - 1}; i >= 0; i--) {
      if (i > deg) continue;
      // f(z) = f(z)*z + c_i
      fz = cmul(fz, z) + u_coeffs[i];
      // f'(z) = f'(z)*z + (partial result of f before adding c_i)
      // Using the recurrence: if we maintain f' via Horner too,
      // then at step i: fz_new = fz_old * z + c_i
      //                 dfz_new = dfz_old * z + fz_old   (chain rule)
      // We already updated fz above, so fz_old = (fz - c_i) / z ... messy.
      // Instead recalculate properly below.
    }

    // Recompute with proper dual Horner pass
    fz  = vec2(0.0);
    dfz = vec2(0.0);
    for (int i = ${MAX_COEFF - 1}; i >= 0; i--) {
      if (i > deg) continue;
      dfz = cmul(dfz, z) + fz;   // derivative accumulator
      fz  = cmul(fz, z) + u_coeffs[i];
    }
  }

  // HSL -> RGB
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
    float scale = 3.5 / u_zoom;
    vec2 z = vec2(
      (vUv.x - 0.5) * scale * u_aspectRatio + u_center.x,
      (vUv.y - 0.5) * scale                 + u_center.y
    );

    int iter = 0;
    float tol2 = u_tolerance * u_tolerance;

    for (int i = 0; i < 2000; i++) {
      if (i >= u_maxIter) break;

      vec2 fz, dfz;
      polyEval(z, fz, dfz);

      // Avoid division by near-zero derivative
      if (dot(dfz, dfz) < 1e-20) break;

      vec2 dz = cdiv(fz, dfz);
      z -= dz;
      iter = i + 1;

      if (dot(dz, dz) < tol2) break;
    }

    // Color by the angle of the converged root.
    // The angle in [0, 2pi) gives a natural hue assignment that distinguishes
    // different roots of the polynomial.
    float angle = atan(z.y, z.x);                   // [-pi, pi]
    float hue   = mod(angle / 6.2831853 + 1.0, 1.0); // [0, 1)

    // Darken by iteration count for shading depth
    float shade = 1.0 - float(iter) / float(u_maxIter) * 0.7;
    vec3 rgb = hsl2rgb(hue, u_saturation, u_lightness * shade);

    gl_FragColor = vec4(rgb, u_opacity);
  }
`;

/**
 * NewtonFractal -- GPU-accelerated Newton's-method fractal visualization.
 *
 * Renders a Newton fractal for an arbitrary polynomial in the complex plane.
 * For each pixel (treated as a complex number z), the shader iterates
 * Newton's root-finding method z <- z - f(z)/f'(z) and colours based on
 * which root the iteration converges to and how quickly.
 *
 * The default polynomial is z^3 - 1 which has three roots at the cube roots
 * of unity, producing the classic three-fold symmetric fractal.
 *
 * @example
 * ```typescript
 * // Default z^3 - 1 fractal
 * const newton = new NewtonFractal();
 * scene.add(newton);
 *
 * // Custom polynomial z^4 - 1
 * const quartic = new NewtonFractal({
 *   coefficients: [-1, 0, 0, 0, 1],
 *   maxIterations: 60,
 * });
 * scene.add(quartic);
 * ```
 */
export class NewtonFractal extends Mobject {
  private _width: number;
  private _height: number;
  private _center: [number, number];
  private _zoom: number;
  private _maxIterations: number;
  private _coefficients: number[];
  private _tolerance: number;
  private _saturation: number;
  private _lightness: number;
  private _material: THREE.ShaderMaterial | null = null;

  constructor(options: NewtonFractalOptions = {}) {
    super();

    const {
      width = 8,
      height = 6,
      center = [0, 0],
      zoom = 1,
      maxIterations = 40,
      coefficients = [-1, 0, 0, 1],
      tolerance = 1e-6,
      saturation = 0.85,
      lightness = 0.5,
      opacity = 1,
    } = options;

    this._width = width;
    this._height = height;
    this._center = [...center];
    this._zoom = zoom;
    this._maxIterations = maxIterations;
    this._coefficients = [...coefficients];
    this._tolerance = tolerance;
    this._saturation = saturation;
    this._lightness = lightness;
    this._opacity = opacity;
    this.fillOpacity = opacity;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Build the uniform array for polynomial coefficients.
   * Coefficients are stored as vec2 (re, im) for generality, but the public
   * API currently only accepts real coefficients.  We zero-pad to MAX_COEFF.
   */
  private _buildCoeffUniforms(): THREE.Vector2[] {
    const arr: THREE.Vector2[] = [];
    for (let i = 0; i < MAX_COEFF; i++) {
      const c = i < this._coefficients.length ? this._coefficients[i] : 0;
      arr.push(new THREE.Vector2(c, 0));
    }
    return arr;
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
        u_aspectRatio: { value: this._width / this._height },
        u_opacity:     { value: this._opacity },
        u_coeffs:      { value: this._buildCoeffUniforms() },
        u_numCoeffs:   { value: Math.min(this._coefficients.length, MAX_COEFF) },
        u_tolerance:   { value: this._tolerance },
        u_saturation:  { value: this._saturation },
        u_lightness:   { value: this._lightness },
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
    u.u_aspectRatio.value = this._width / this._height;
    u.u_opacity.value     = this._opacity;
    u.u_tolerance.value   = this._tolerance;
    u.u_saturation.value  = this._saturation;
    u.u_lightness.value   = this._lightness;

    // Rebuild coefficient array in-place
    const coeffArr = u.u_coeffs.value as THREE.Vector2[];
    for (let i = 0; i < MAX_COEFF; i++) {
      const c = i < this._coefficients.length ? this._coefficients[i] : 0;
      coeffArr[i].set(c, 0);
    }
    u.u_numCoeffs.value = Math.min(this._coefficients.length, MAX_COEFF);

    this._material.transparent = this._opacity < 1;
    this._material.needsUpdate = true;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Set the center of the view in the complex plane. */
  setCenter(center: [number, number]): this {
    this._center = [...center];
    this._markDirty();
    return this;
  }

  /** Get the current view center. */
  getCenter(): [number, number] {
    return [...this._center];
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

  /**
   * Set polynomial coefficients in ascending degree order.
   * e.g. `[-1, 0, 0, 1]` for z^3 - 1.
   */
  setCoefficients(coeffs: number[]): this {
    this._coefficients = [...coeffs];
    this._markDirty();
    return this;
  }

  /** Get the current polynomial coefficients. */
  getCoefficients(): number[] {
    return [...this._coefficients];
  }

  /** Set the convergence tolerance. */
  setTolerance(tol: number): this {
    this._tolerance = Math.max(1e-12, tol);
    this._markDirty();
    return this;
  }

  /** Get the convergence tolerance. */
  getTolerance(): number {
    return this._tolerance;
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

  protected override _createCopy(): NewtonFractal {
    return new NewtonFractal({
      width: this._width,
      height: this._height,
      center: [...this._center],
      zoom: this._zoom,
      maxIterations: this._maxIterations,
      coefficients: [...this._coefficients],
      tolerance: this._tolerance,
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

export default NewtonFractal;

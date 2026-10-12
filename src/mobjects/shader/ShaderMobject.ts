import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';

/**
 * Allowed value types for a ShaderMobject uniform.
 *
 * Floats map to GLSL `float`, vectors to `vecN`, `THREE.Color` to a `vec3`
 * (THREE uploads its `.r/.g/.b`), `THREE.Texture` to a `sampler2D`, and a
 * plain number array to the matching `vecN`/array uniform.
 */
export type ShaderUniformValue =
  | number
  | boolean
  | THREE.Vector2
  | THREE.Vector3
  | THREE.Vector4
  | THREE.Color
  | THREE.Texture
  | readonly number[];

/**
 * Options for a {@link ShaderMobject}.
 */
export interface ShaderMobjectOptions {
  /** The GLSL fragment shader source. Required. */
  fragmentShader: string;
  /** The GLSL vertex shader source. Default: a pass-through that exposes `vUv`. */
  vertexShader?: string;
  /** Plane width in world units. Default: 8 */
  width?: number;
  /** Plane height in world units. Default: 4.5 */
  height?: number;
  /** User-defined uniforms, keyed by GLSL name. */
  uniforms?: Record<string, ShaderUniformValue>;
  /** Expose the Shadertoy-style `iMouse` (vec4) uniform. Default: false */
  mouse?: boolean;
  /** Blending mode. Default: THREE.NormalBlending */
  blending?: THREE.Blending;
  /** Enable transparency. Default: true */
  transparent?: boolean;
  /** Opacity, stored on the mobject. Default: 1 */
  opacity?: number;
}

/**
 * Default vertex shader: a flat pass-through that forwards the plane UV as
 * `vUv`, so a Shadertoy-style fragment shader can sample `vUv` in [0, 1].
 */
const DEFAULT_VERTEX_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Names reserved for the built-in uniforms. */
const BUILTIN_NAMES = new Set(['iTime', 'iResolution', 'iMouse']);

/**
 * ShaderMobject -- a plane rendered with a user-supplied GLSL fragment shader.
 *
 * It mirrors the Shadertoy convention with built-in uniforms updated each
 * frame: `iTime` (seconds), `iResolution` (vec3 plane size), and an optional
 * `iMouse` (vec4). User uniforms (floats, vectors, colors, textures) pass
 * through an options map. A frame updater advances `iTime`, so animated
 * shaders run on the timeline.
 *
 * Construction never touches a WebGL context, so it is headless-safe; the
 * material is built lazily on the first {@link getThreeObject} call. Uniform
 * and time updates made before that point are stored and applied on build.
 *
 * @example
 * ```typescript
 * const shader = new ShaderMobject({
 *   fragmentShader: `
 *     precision highp float;
 *     uniform float iTime;
 *     varying vec2 vUv;
 *     void main() {
 *       gl_FragColor = vec4(vUv, 0.5 + 0.5 * sin(iTime), 1.0);
 *     }
 *   `,
 * });
 * scene.add(shader);
 * ```
 */
export class ShaderMobject extends Mobject {
  private _width: number;
  private _height: number;
  private _fragmentShader: string;
  private _vertexShader: string;
  private _mouse: boolean;
  private _blending: THREE.Blending;
  private _transparent: boolean;
  private _time = 0;
  private _resolution: [number, number] | null = null;
  private readonly _uniformValues = new Map<string, ShaderUniformValue>();
  private _material: THREE.ShaderMaterial | null = null;

  constructor(options: ShaderMobjectOptions) {
    super();

    const {
      fragmentShader,
      vertexShader = DEFAULT_VERTEX_SHADER,
      width = 8,
      height = 4.5,
      uniforms = {},
      mouse = false,
      blending = THREE.NormalBlending,
      transparent = true,
      opacity = 1,
    } = options;

    this._fragmentShader = fragmentShader;
    this._vertexShader = vertexShader;
    this._width = width;
    this._height = height;
    this._mouse = mouse;
    this._blending = blending;
    this._transparent = transparent;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    for (const [name, value] of Object.entries(uniforms)) {
      if (!BUILTIN_NAMES.has(name)) this._uniformValues.set(name, value);
    }

    // Advance iTime each frame so animated shaders run on the timeline.
    this.addUpdater((_mobject, dt) => {
      this.syncToTime(this._time + dt);
    });
  }

  // -----------------------------------------------------------------------
  // Three.js object creation
  // -----------------------------------------------------------------------

  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.PlaneGeometry(this._width, this._height);

    const uniforms: Record<string, THREE.IUniform> = {};
    for (const [name, value] of this._uniformValues) {
      uniforms[name] = { value };
    }
    const resWidth = this._resolution ? this._resolution[0] : this._width;
    const resHeight = this._resolution ? this._resolution[1] : this._height;
    uniforms.iTime = { value: this._time };
    uniforms.iResolution = { value: new THREE.Vector3(resWidth, resHeight, 1) };
    if (this._mouse) uniforms.iMouse = { value: new THREE.Vector4(0, 0, 0, 0) };

    this._material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: this._vertexShader,
      fragmentShader: this._fragmentShader,
      transparent: this._transparent,
      blending: this._blending,
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, this._material);
  }

  // -----------------------------------------------------------------------
  // Public API -- setters return `this` for chaining
  // -----------------------------------------------------------------------

  /** Set a uniform value, creating it if it was not declared. */
  setUniform(name: string, value: ShaderUniformValue): this {
    if (!BUILTIN_NAMES.has(name)) this._uniformValues.set(name, value);
    if (this._material) {
      const uniform = this._material.uniforms[name];
      if (uniform) uniform.value = value;
      else this._material.uniforms[name] = { value };
      this._material.needsUpdate = true;
    }
    return this;
  }

  /** Get a uniform value, or `undefined` if it is not set. */
  getUniform(name: string): ShaderUniformValue | undefined {
    return this._uniformValues.get(name);
  }

  /** Set the shader time `iTime` (seconds). */
  syncToTime(t: number): this {
    this._time = t;
    if (this._material && this._material.uniforms.iTime) {
      this._material.uniforms.iTime.value = t;
    }
    return this;
  }

  /** Get the current shader time in seconds. */
  getTime(): number {
    return this._time;
  }

  /** Set the `iResolution` uniform (in pixels or world units, caller's choice). */
  setResolution(width: number, height: number): this {
    this._resolution = [width, height];
    if (this._material && this._material.uniforms.iResolution) {
      (this._material.uniforms.iResolution.value as THREE.Vector3).set(width, height, 1);
    }
    return this;
  }

  /** Get the fragment shader source. */
  getFragmentShader(): string {
    return this._fragmentShader;
  }

  /** Get the vertex shader source. */
  getVertexShader(): string {
    return this._vertexShader;
  }

  /** Set the plane width in world units. */
  setWidth(width: number): this {
    this._width = width;
    this._markDirty();
    return this;
  }

  /** Get the plane width. */
  getWidth(): number {
    return this._width;
  }

  /** Set the plane height in world units. */
  setHeight(height: number): this {
    this._height = height;
    this._markDirty();
    return this;
  }

  /** Get the plane height. */
  getHeight(): number {
    return this._height;
  }

  /** Get the underlying ShaderMaterial, or `null` before the mesh is built. */
  getMaterial(): THREE.ShaderMaterial | null {
    return this._material;
  }

  // -----------------------------------------------------------------------
  // Flatten: shader-quad geometry can't bake into points, so absolutize.
  // -----------------------------------------------------------------------
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    return this._flattenAsMesh(worldMatrix);
  }

  // -----------------------------------------------------------------------
  // Copy
  // -----------------------------------------------------------------------
  override copy(): ShaderMobject {
    const uniforms: Record<string, ShaderUniformValue> = {};
    for (const [name, value] of this._uniformValues) uniforms[name] = value;

    const clone = new ShaderMobject({
      fragmentShader: this._fragmentShader,
      vertexShader: this._vertexShader,
      width: this._width,
      height: this._height,
      uniforms,
      mouse: this._mouse,
      blending: this._blending,
      transparent: this._transparent,
      opacity: this._opacity,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
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

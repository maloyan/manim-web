import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Surface3D, Surface3DOptions } from './Surface3D';

/**
 * Options for creating a TexturedSurface
 */
export interface TexturedSurfaceOptions {
  /** The parametric surface to apply the texture to */
  surface: Surface3D;
  /** URL of the primary texture image */
  textureUrl: string;
  /** Optional URL of a secondary (dark/night) texture for day/night blending */
  darkTextureUrl?: string;
  /** Light direction vector for day/night blending. Default: [1, 0, 0] (from +X) */
  lightDirection?: Vector3Tuple;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Texture repeat in [u, v]. Default: [1, 1] */
  textureRepeat?: [number, number];
  /** Texture offset in [u, v]. Default: [0, 0] */
  textureOffset?: [number, number];
  /** Whether to render both sides. Default: true */
  doubleSided?: boolean;
}

/**
 * Options for the texturedSphere convenience factory
 */
export interface TexturedSphereOptions {
  /** URL of the primary texture image */
  textureUrl: string;
  /** Optional URL of a secondary (dark/night) texture */
  darkTextureUrl?: string;
  /** Radius of the sphere. Default: 1 */
  radius?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Number of segments in each direction. Default: 64 */
  resolution?: number;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Light direction for day/night blending. Default: [1, 0, 0] */
  lightDirection?: Vector3Tuple;
  /** Texture repeat in [u, v]. Default: [1, 1] */
  textureRepeat?: [number, number];
  /** Texture offset in [u, v]. Default: [0, 0] */
  textureOffset?: [number, number];
}

/**
 * TexturedSurface - Apply texture images to 3D parametric surfaces
 *
 * Wraps a Surface3D and applies one or two textures using Three.js texture
 * mapping. UV coordinates are derived from the surface's parametric (u, v)
 * parameters, so the texture maps naturally to the surface shape.
 *
 * Supports single-texture mode (one image mapped to the surface) and
 * day/night mode (blending between two textures based on a light direction).
 *
 * The surface is displayed immediately with a placeholder color; textures
 * are applied asynchronously once loaded.
 *
 * @example
 * ```typescript
 * // Single texture on a sphere
 * const sphere = SurfacePresets.sphere(2);
 * const earth = new TexturedSurface({
 *   surface: sphere,
 *   textureUrl: '/textures/earth_day.jpg',
 * });
 *
 * // Day/night blending
 * const earthDayNight = new TexturedSurface({
 *   surface: sphere,
 *   textureUrl: '/textures/earth_day.jpg',
 *   darkTextureUrl: '/textures/earth_night.jpg',
 *   lightDirection: [1, 0.5, 0],
 * });
 *
 * // Convenience factory
 * const globe = texturedSphere({
 *   textureUrl: '/textures/earth_day.jpg',
 *   radius: 2,
 * });
 * ```
 */
export class TexturedSurface extends Mobject {
  /** The underlying parametric surface providing geometry */
  private _surface: Surface3D;

  /** Primary texture URL */
  private _textureUrl: string;

  /** Secondary (dark/night) texture URL */
  private _darkTextureUrl: string | null;

  /** Light direction for day/night blending (normalized) */
  private _lightDirection: THREE.Vector3;

  /** Whether double-sided rendering is enabled */
  private _doubleSided: boolean;

  /** Texture repeat factors */
  private _textureRepeat: [number, number];

  /** Texture offset */
  private _textureOffset: [number, number];

  /** Loaded primary texture (null until loaded) */
  private _texture: THREE.Texture | null = null;

  /** Loaded dark texture (null until loaded) */
  private _darkTexture: THREE.Texture | null = null;

  /** Whether textures have finished loading */
  private _texturesLoaded = false;

  /** Custom shader material for day/night blending */
  private _dayNightMaterial: THREE.ShaderMaterial | null = null;

  constructor(options: TexturedSurfaceOptions) {
    super();

    const {
      surface,
      textureUrl,
      darkTextureUrl,
      lightDirection = [1, 0, 0],
      opacity = 1,
      textureRepeat = [1, 1],
      textureOffset = [0, 0],
      doubleSided = true,
    } = options;

    this._surface = surface;
    this._textureUrl = textureUrl;
    this._darkTextureUrl = darkTextureUrl ?? null;
    this._lightDirection = new THREE.Vector3(
      lightDirection[0],
      lightDirection[1],
      lightDirection[2]
    ).normalize();
    this._doubleSided = doubleSided;
    this._textureRepeat = [...textureRepeat];
    this._textureOffset = [...textureOffset];

    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Copy position from the surface
    this.position.copy(surface.position);

    // Start loading textures asynchronously
    this._loadTextures();
  }

  /**
   * Load texture images asynchronously. The surface is shown with a
   * placeholder material until loading completes.
   */
  private _loadTextures(): void {
    const loader = new THREE.TextureLoader();
    const promises: Promise<void>[] = [];

    // Load primary texture
    promises.push(
      new Promise<void>((resolve, reject) => {
        loader.load(
          this._textureUrl,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(this._textureRepeat[0], this._textureRepeat[1]);
            texture.offset.set(this._textureOffset[0], this._textureOffset[1]);
            this._texture = texture;
            resolve();
          },
          undefined,
          (err) => {
            console.warn(`TexturedSurface: Failed to load texture "${this._textureUrl}"`, err);
            reject(err);
          }
        );
      })
    );

    // Load dark texture if provided
    if (this._darkTextureUrl) {
      promises.push(
        new Promise<void>((resolve, reject) => {
          loader.load(
            this._darkTextureUrl!,
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              texture.repeat.set(this._textureRepeat[0], this._textureRepeat[1]);
              texture.offset.set(this._textureOffset[0], this._textureOffset[1]);
              this._darkTexture = texture;
              resolve();
            },
            undefined,
            (err) => {
              console.warn(`TexturedSurface: Failed to load dark texture "${this._darkTextureUrl}"`, err);
              reject(err);
            }
          );
        })
      );
    }

    Promise.all(promises)
      .then(() => {
        this._texturesLoaded = true;
        this._applyTextures();
      })
      .catch(() => {
        // Textures failed to load; surface stays with placeholder material
      });
  }

  /**
   * Apply loaded textures to the mesh material. Called once textures finish
   * loading. Replaces the placeholder material with either a standard
   * textured material or a day/night shader material.
   */
  private _applyTextures(): void {
    if (!this._threeObject || !(this._threeObject instanceof THREE.Mesh)) return;
    if (!this._texture) return;

    const mesh = this._threeObject as THREE.Mesh;

    // Dispose old material
    const oldMaterial = mesh.material as THREE.Material;
    oldMaterial.dispose();

    if (this._darkTexture) {
      // Day/night blending via custom shader
      this._dayNightMaterial = this._createDayNightMaterial(
        this._texture,
        this._darkTexture,
        this._lightDirection
      );
      mesh.material = this._dayNightMaterial;
    } else {
      // Single texture mode
      const material = new THREE.MeshStandardMaterial({
        map: this._texture,
        opacity: this._opacity,
        transparent: this._opacity < 1,
        side: this._doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      });
      mesh.material = material;
    }

    this._markDirty();
  }

  /**
   * Create a ShaderMaterial that blends between a day and night texture
   * based on the dot product of surface normals with a light direction.
   */
  private _createDayNightMaterial(
    dayTexture: THREE.Texture,
    nightTexture: THREE.Texture,
    lightDir: THREE.Vector3
  ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayTexture },
        nightMap: { value: nightTexture },
        lightDirection: { value: lightDir.clone() },
        opacity: { value: this._opacity },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldNormal;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayMap;
        uniform sampler2D nightMap;
        uniform vec3 lightDirection;
        uniform float opacity;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldNormal;

        void main() {
          vec4 dayColor = texture2D(dayMap, vUv);
          vec4 nightColor = texture2D(nightMap, vUv);

          // Blend factor based on dot product of world normal with light direction
          // Smoothstep gives a gradual transition at the terminator
          float dotNL = dot(normalize(vWorldNormal), normalize(lightDirection));
          float blend = smoothstep(-0.1, 0.3, dotNL);

          vec4 color = mix(nightColor, dayColor, blend);
          gl_FragColor = vec4(color.rgb, color.a * opacity);
        }
      `,
      transparent: this._opacity < 1,
      side: this._doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });
  }

  /**
   * Build the Three.js mesh. Reuses the surface's parametric function to
   * create geometry with proper UV mapping, and starts with a placeholder
   * material until textures are loaded.
   */
  protected _createThreeObject(): THREE.Object3D {
    const surface = this._surface;
    const uRange = surface.getURange();
    const vRange = surface.getVRange();
    const uRes = surface.getUResolution();
    const vRes = surface.getVResolution();
    const func = surface.getFunc();

    const [uMin, uMax] = uRange;
    const [vMin, vMax] = vRange;
    const uSpan = uMax - uMin;
    const vSpan = vMax - vMin;

    // Three.js ParametricGeometry passes u, v in [0, 1]
    const paramFunc = (u: number, v: number, target: THREE.Vector3) => {
      const uActual = uMin + u * uSpan;
      const vActual = vMin + v * vSpan;
      const [x, y, z] = func(uActual, vActual);
      target.set(x, y, z);
    };

    const geometry = new ParametricGeometry(paramFunc, uRes, vRes);
    geometry.computeVertexNormals();

    // ParametricGeometry already generates UV coordinates from the [0,1]
    // u, v parameters, so the texture maps directly from parametric space.
    // We just need to ensure the UV attribute exists (it does by default).

    // Placeholder material shown while textures load
    const material = new THREE.MeshStandardMaterial({
      color: '#4488cc',
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: this._doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // If textures already loaded (e.g., from cache), apply immediately
    if (this._texturesLoaded && this._texture) {
      // Defer to next microtask so _threeObject is assigned first
      queueMicrotask(() => this._applyTextures());
    }

    return mesh;
  }

  /**
   * Sync material properties to the Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (!(this._threeObject instanceof THREE.Mesh)) return;

    const material = this._threeObject.material;

    if (material instanceof THREE.ShaderMaterial && this._dayNightMaterial) {
      // Day/night shader material
      this._dayNightMaterial.uniforms.opacity.value = this._opacity;
      this._dayNightMaterial.uniforms.lightDirection.value.copy(this._lightDirection);
      this._dayNightMaterial.transparent = this._opacity < 1;
      this._dayNightMaterial.side = this._doubleSided
        ? THREE.DoubleSide
        : THREE.FrontSide;
      this._dayNightMaterial.needsUpdate = true;
    } else if (material instanceof THREE.MeshStandardMaterial) {
      // Standard material (single texture or placeholder)
      material.opacity = this._opacity;
      material.transparent = this._opacity < 1;
      material.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
      material.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Get the underlying parametric surface
   */
  getSurface(): Surface3D {
    return this._surface;
  }

  /**
   * Get the primary texture URL
   */
  getTextureUrl(): string {
    return this._textureUrl;
  }

  /**
   * Get whether textures have finished loading
   */
  isTextureLoaded(): boolean {
    return this._texturesLoaded;
  }

  /**
   * Set the light direction for day/night blending
   */
  setLightDirection(dir: Vector3Tuple): this {
    this._lightDirection.set(dir[0], dir[1], dir[2]).normalize();
    this._markDirty();
    return this;
  }

  /**
   * Get the light direction as a tuple
   */
  getLightDirection(): Vector3Tuple {
    return [this._lightDirection.x, this._lightDirection.y, this._lightDirection.z];
  }

  /**
   * Set texture repeat
   */
  setTextureRepeat(repeat: [number, number]): this {
    this._textureRepeat = [...repeat];
    if (this._texture) {
      this._texture.repeat.set(repeat[0], repeat[1]);
      this._texture.needsUpdate = true;
    }
    if (this._darkTexture) {
      this._darkTexture.repeat.set(repeat[0], repeat[1]);
      this._darkTexture.needsUpdate = true;
    }
    this._markDirty();
    return this;
  }

  /**
   * Get the texture repeat
   */
  getTextureRepeat(): [number, number] {
    return [...this._textureRepeat];
  }

  /**
   * Set texture offset
   */
  setTextureOffset(offset: [number, number]): this {
    this._textureOffset = [...offset];
    if (this._texture) {
      this._texture.offset.set(offset[0], offset[1]);
      this._texture.needsUpdate = true;
    }
    if (this._darkTexture) {
      this._darkTexture.offset.set(offset[0], offset[1]);
      this._darkTexture.needsUpdate = true;
    }
    this._markDirty();
    return this;
  }

  /**
   * Get the texture offset
   */
  getTextureOffset(): [number, number] {
    return [...this._textureOffset];
  }

  /**
   * Set whether to render both sides of the surface
   */
  setDoubleSided(value: boolean): this {
    this._doubleSided = value;
    this._markDirty();
    return this;
  }

  /**
   * Get whether double-sided rendering is enabled
   */
  isDoubleSided(): boolean {
    return this._doubleSided;
  }

  /**
   * Dispose of loaded textures and materials to free GPU memory
   */
  dispose(): void {
    if (this._texture) {
      this._texture.dispose();
      this._texture = null;
    }
    if (this._darkTexture) {
      this._darkTexture.dispose();
      this._darkTexture = null;
    }
    if (this._dayNightMaterial) {
      this._dayNightMaterial.dispose();
      this._dayNightMaterial = null;
    }
    if (this._threeObject instanceof THREE.Mesh) {
      const mat = this._threeObject.material as THREE.Material;
      mat.dispose();
      this._threeObject.geometry.dispose();
    }
  }

  /**
   * Create a copy of this TexturedSurface.
   * Note: The copy will reload textures independently.
   */
  protected override _createCopy(): TexturedSurface {
    return new TexturedSurface({
      surface: this._surface,
      textureUrl: this._textureUrl,
      darkTextureUrl: this._darkTextureUrl ?? undefined,
      lightDirection: this.getLightDirection(),
      opacity: this._opacity,
      textureRepeat: this._textureRepeat,
      textureOffset: this._textureOffset,
      doubleSided: this._doubleSided,
    });
  }
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

/**
 * Create a textured sphere -- a common use case for Earth, Moon, etc.
 *
 * This builds a ParametricSurface sphere internally and wraps it with a
 * TexturedSurface, returning the ready-to-use mobject.
 *
 * @example
 * ```typescript
 * const earth = texturedSphere({
 *   textureUrl: '/textures/earth_day.jpg',
 *   darkTextureUrl: '/textures/earth_night.jpg',
 *   radius: 2,
 *   lightDirection: [1, 0.5, 0],
 * });
 * scene.add(earth);
 * ```
 */
export function texturedSphere(options: TexturedSphereOptions): TexturedSurface {
  const {
    textureUrl,
    darkTextureUrl,
    radius = 1,
    center = [0, 0, 0],
    resolution = 64,
    opacity = 1,
    lightDirection = [1, 0, 0],
    textureRepeat = [1, 1],
    textureOffset = [0, 0],
  } = options;

  // Build a parametric sphere surface
  // u -> longitude [0, 2PI], v -> latitude [0, PI]
  const surface = new Surface3D({
    func: (u: number, v: number): Vector3Tuple => {
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ];
    },
    uRange: [0, 1],
    vRange: [0, 1],
    uResolution: resolution,
    vResolution: resolution,
    center,
  });

  return new TexturedSurface({
    surface,
    textureUrl,
    darkTextureUrl,
    lightDirection,
    opacity,
    textureRepeat,
    textureOffset,
  });
}

export default TexturedSurface;

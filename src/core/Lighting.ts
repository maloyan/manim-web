import * as THREE from 'three';

/**
 * Options for configuring an ambient light.
 */
export interface AmbientLightOptions {
  /** Light color. Defaults to '#ffffff'. */
  color?: string;
  /** Light intensity. Defaults to 0.5. */
  intensity?: number;
}

/**
 * Options for configuring a directional light.
 */
export interface DirectionalLightOptions {
  /** Light color. Defaults to '#ffffff'. */
  color?: string;
  /** Light intensity. Defaults to 1. */
  intensity?: number;
  /** Light position [x, y, z]. Defaults to [5, 10, 7]. */
  position?: [number, number, number];
  /** Whether the light casts shadows. Defaults to false. */
  castShadow?: boolean;
}

/**
 * Options for configuring a point light.
 */
export interface PointLightOptions {
  /** Light color. Defaults to '#ffffff'. */
  color?: string;
  /** Light intensity. Defaults to 1. */
  intensity?: number;
  /** Light position [x, y, z]. Defaults to [0, 5, 0]. */
  position?: [number, number, number];
  /** Maximum range of the light. Defaults to 0 (no limit). */
  distance?: number;
  /** Light decay rate. Defaults to 2 (physically correct). */
  decay?: number;
  /** Whether the light casts shadows. Defaults to false. */
  castShadow?: boolean;
}

/**
 * Options for configuring a spot light.
 */
export interface SpotLightOptions {
  /** Light color. Defaults to '#ffffff'. */
  color?: string;
  /** Light intensity. Defaults to 1. */
  intensity?: number;
  /** Light position [x, y, z]. Defaults to [0, 10, 0]. */
  position?: [number, number, number];
  /** Maximum range of the light. Defaults to 0 (no limit). */
  distance?: number;
  /** Maximum angle of light dispersion from its direction (radians). Defaults to PI/3. */
  angle?: number;
  /** Percent of the cone attenuated due to penumbra. Defaults to 0. */
  penumbra?: number;
  /** Light decay rate. Defaults to 2 (physically correct). */
  decay?: number;
  /** Whether the light casts shadows. Defaults to false. */
  castShadow?: boolean;
  /** Target position for the light to point at [x, y, z]. Defaults to origin. */
  target?: [number, number, number];
}

/**
 * Lighting system for 3D manimweb scenes.
 * Manages multiple lights attached to a Three.js scene.
 */
export class Lighting {
  private _lights: THREE.Light[] = [];
  private _scene: THREE.Scene;

  /**
   * Create a new lighting system.
   * @param threeScene - The Three.js scene to add lights to
   */
  constructor(threeScene: THREE.Scene) {
    this._scene = threeScene;
  }

  /**
   * Add an ambient light to the scene.
   * Ambient lights illuminate all objects equally from all directions.
   * @param options - Light configuration options
   * @returns The created AmbientLight
   */
  addAmbient(options?: AmbientLightOptions): THREE.AmbientLight {
    const light = new THREE.AmbientLight(
      options?.color ?? '#ffffff',
      options?.intensity ?? 0.5
    );
    this._lights.push(light);
    this._scene.add(light);
    return light;
  }

  /**
   * Add a directional light to the scene.
   * Directional lights emit parallel rays, like sunlight.
   * @param options - Light configuration options
   * @returns The created DirectionalLight
   */
  addDirectional(options?: DirectionalLightOptions): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(
      options?.color ?? '#ffffff',
      options?.intensity ?? 1
    );
    const pos = options?.position ?? [5, 10, 7];
    light.position.set(...pos);
    light.castShadow = options?.castShadow ?? false;

    this._lights.push(light);
    this._scene.add(light);
    return light;
  }

  /**
   * Add a point light to the scene.
   * Point lights emit in all directions from a single point.
   * @param options - Light configuration options
   * @returns The created PointLight
   */
  addPoint(options?: PointLightOptions): THREE.PointLight {
    const light = new THREE.PointLight(
      options?.color ?? '#ffffff',
      options?.intensity ?? 1,
      options?.distance ?? 0,
      options?.decay ?? 2
    );
    const pos = options?.position ?? [0, 5, 0];
    light.position.set(...pos);
    light.castShadow = options?.castShadow ?? false;

    this._lights.push(light);
    this._scene.add(light);
    return light;
  }

  /**
   * Add a spot light to the scene.
   * Spot lights emit in a cone from a single point.
   * @param options - Light configuration options
   * @returns The created SpotLight
   */
  addSpot(options?: SpotLightOptions): THREE.SpotLight {
    const light = new THREE.SpotLight(
      options?.color ?? '#ffffff',
      options?.intensity ?? 1,
      options?.distance ?? 0,
      options?.angle ?? Math.PI / 3,
      options?.penumbra ?? 0,
      options?.decay ?? 2
    );
    const pos = options?.position ?? [0, 10, 0];
    light.position.set(...pos);
    light.castShadow = options?.castShadow ?? false;

    if (options?.target) {
      light.target.position.set(...options.target);
      this._scene.add(light.target);
    }

    this._lights.push(light);
    this._scene.add(light);
    return light;
  }

  /**
   * Set up default 3-point lighting.
   * Creates ambient light plus two directional lights for balanced illumination.
   */
  setupDefault(): void {
    this.addAmbient({ intensity: 0.4 });
    this.addDirectional({ position: [5, 10, 7], intensity: 0.8 });
    this.addDirectional({ position: [-5, 5, -5], intensity: 0.3 });
  }

  /**
   * Get all lights in the system.
   * @returns Array of all lights
   */
  getLights(): THREE.Light[] {
    return [...this._lights];
  }

  /**
   * Remove a specific light from the scene.
   * @param light - The light to remove
   */
  remove(light: THREE.Light): void {
    const index = this._lights.indexOf(light);
    if (index !== -1) {
      this._scene.remove(light);
      this._lights.splice(index, 1);
    }
  }

  /**
   * Remove all lights from the scene.
   */
  removeAll(): void {
    for (const light of this._lights) {
      this._scene.remove(light);
    }
    this._lights = [];
  }

  /**
   * Dispose of all lights and clean up resources.
   */
  dispose(): void {
    this.removeAll();
  }
}

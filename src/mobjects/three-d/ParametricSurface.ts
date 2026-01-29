import { Surface3D, Surface3DOptions } from './Surface3D';
import { Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a ParametricSurface
 * (Alias for Surface3DOptions for compatibility)
 */
export type ParametricSurfaceOptions = Surface3DOptions;

/**
 * ParametricSurface - Alias for Surface3D
 *
 * This class is provided for compatibility and naming consistency
 * with Manim's ParametricSurface class. It is functionally identical
 * to Surface3D.
 *
 * @example
 * ```typescript
 * // Create a mobius strip
 * const mobius = new ParametricSurface({
 *   func: (u, v) => {
 *     const theta = u * 2 * Math.PI;
 *     const w = 2 * v - 1;
 *     return [
 *       (1 + w / 2 * Math.cos(theta / 2)) * Math.cos(theta),
 *       (1 + w / 2 * Math.cos(theta / 2)) * Math.sin(theta),
 *       w / 2 * Math.sin(theta / 2)
 *     ];
 *   },
 *   uRange: [0, 1],
 *   vRange: [0, 1],
 *   uResolution: 64,
 *   vResolution: 16
 * });
 *
 * // Create a Klein bottle segment
 * const klein = new ParametricSurface({
 *   func: (u, v) => {
 *     const a = 2;
 *     const theta = u * Math.PI * 2;
 *     const phi = v * Math.PI * 2;
 *     const r = a * (1 - Math.cos(theta) / 2);
 *     return [
 *       r * Math.cos(theta),
 *       r * Math.sin(theta),
 *       Math.sin(phi)
 *     ];
 *   }
 * });
 * ```
 */
export class ParametricSurface extends Surface3D {
  constructor(options: ParametricSurfaceOptions) {
    super(options);
  }

  /**
   * Create a copy of this ParametricSurface
   */
  protected override _createCopy(): ParametricSurface {
    return new ParametricSurface({
      func: this._func,
      uRange: this._uRange,
      vRange: this._vRange,
      uResolution: this._uResolution,
      vResolution: this._vResolution,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      doubleSided: this._doubleSided,
    });
  }
}

/**
 * Helper function to create common parametric surfaces
 */
export const SurfacePresets = {
  /**
   * Create a sphere surface
   */
  sphere(radius: number = 1, options: Partial<Omit<Surface3DOptions, 'func'>> = {}): ParametricSurface {
    return new ParametricSurface({
      func: (u: number, v: number): Vector3Tuple => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        return [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ];
      },
      ...options
    });
  },

  /**
   * Create a torus surface
   */
  torus(majorRadius: number = 1, minorRadius: number = 0.3, options: Partial<Omit<Surface3DOptions, 'func'>> = {}): ParametricSurface {
    return new ParametricSurface({
      func: (u: number, v: number): Vector3Tuple => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI * 2;
        return [
          (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta),
          (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta),
          minorRadius * Math.sin(phi)
        ];
      },
      ...options
    });
  },

  /**
   * Create a mobius strip surface
   */
  mobiusStrip(radius: number = 1, width: number = 0.5, options: Partial<Omit<Surface3DOptions, 'func'>> = {}): ParametricSurface {
    return new ParametricSurface({
      func: (u: number, v: number): Vector3Tuple => {
        const theta = u * Math.PI * 2;
        const w = width * (2 * v - 1);
        return [
          (radius + w * Math.cos(theta / 2)) * Math.cos(theta),
          (radius + w * Math.cos(theta / 2)) * Math.sin(theta),
          w * Math.sin(theta / 2)
        ];
      },
      uResolution: 64,
      vResolution: 16,
      ...options
    });
  },

  /**
   * Create a paraboloid surface
   */
  paraboloid(scale: number = 1, options: Partial<Omit<Surface3DOptions, 'func'>> = {}): ParametricSurface {
    return new ParametricSurface({
      func: (u: number, v: number): Vector3Tuple => {
        const x = scale * (2 * u - 1);
        const y = scale * (2 * v - 1);
        return [x, y, (x * x + y * y) / scale];
      },
      ...options
    });
  },

  /**
   * Create a saddle surface (hyperbolic paraboloid)
   */
  saddle(scale: number = 1, options: Partial<Omit<Surface3DOptions, 'func'>> = {}): ParametricSurface {
    return new ParametricSurface({
      func: (u: number, v: number): Vector3Tuple => {
        const x = scale * (2 * u - 1);
        const y = scale * (2 * v - 1);
        return [x, y, (x * x - y * y) / scale];
      },
      ...options
    });
  },

  /**
   * Create a helicoid surface
   */
  helicoid(radius: number = 1, pitch: number = 0.5, options: Partial<Omit<Surface3DOptions, 'func'>> = {}): ParametricSurface {
    return new ParametricSurface({
      func: (u: number, v: number): Vector3Tuple => {
        const theta = u * Math.PI * 4;
        const r = radius * (2 * v - 1);
        return [
          r * Math.cos(theta),
          r * Math.sin(theta),
          pitch * theta
        ];
      },
      uResolution: 64,
      vResolution: 16,
      ...options
    });
  },
};

export default ParametricSurface;

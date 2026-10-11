import { ThreeDScene, type ThreeDSceneOptions } from './ThreeDScene';
import { DEGREES } from '../constants/parity';
import { ThreeDAxes, type ThreeDAxesOptions } from '../mobjects/three-d/ThreeDAxes';
import { Sphere, type SphereOptions } from '../mobjects/three-d/Sphere';

/**
 * Default angled camera position of CE's `SpecialThreeDScene`: phi = 70 degrees,
 * theta = -110 degrees. CE uses a Z-up frame and this port uses a Y-up frame, so
 * the angles map to this port's orbit convention rather than reproducing CE's
 * exact view direction.
 */
const DEFAULT_PHI = 70 * DEGREES;
const DEFAULT_THETA = -110 * DEGREES;

/** Default sphere radius of CE's `SpecialThreeDScene.sphere_config`. */
const DEFAULT_SPHERE_RADIUS = 2;

/**
 * Default sphere segment count. CE's `sphere_config` uses a `(24, 48)` (u, v)
 * resolution tuple; this port's `Sphere` takes a single segment count, so the
 * tuple collapses to its larger value.
 */
const DEFAULT_SPHERE_RESOLUTION = 48;

/**
 * Configuration for {@link SpecialThreeDScene}, extending the base 3D scene
 * options with CE's extra axes, sphere, and default-camera settings.
 */
export interface SpecialThreeDSceneOptions extends ThreeDSceneOptions {
  /**
   * Whether `getAxes()` cuts each axis at radius 1. CE builds the axis from
   * three line pieces to do this; this port's `ThreeDAxes` renders a single
   * continuous axis with no piece sub-structure, so the flag is stored but not
   * applied. Defaults to true.
   */
  cutAxesAtRadius?: boolean;
  /** Overrides merged over {@link getDefaultAxesConfig} when building axes. */
  threeDAxesConfig?: ThreeDAxesOptions;
  /** Overrides merged over {@link getDefaultSphereConfig} when building spheres. */
  sphereConfig?: SphereOptions;
  /** The default angled camera position, in radians. */
  defaultAngledCameraPosition?: { phi: number; theta: number };
}

/**
 * An extension of {@link ThreeDScene} with CE's `SpecialThreeDScene` defaults:
 * a higher-resolution sphere, a tick-marked axes config, and a default angled
 * camera position.
 *
 * CE config keys with no equivalent in this port are omitted:
 * - `camera_config` (`should_apply_shading`, `exponential_projection`): this
 *   port's camera has no per-scene shading or projection toggles.
 * - `three_d_axes_config` keys `num_axis_pieces`, `unit_size`,
 *   `numbers_with_elongated_ticks`, `stroke_width`: not exposed by
 *   {@link ThreeDAxesOptions}.
 * - `low_quality_config`: this port has no low-quality render path to override.
 */
export class SpecialThreeDScene extends ThreeDScene {
  readonly cutAxesAtRadius: boolean;
  private readonly _threeDAxesConfig: ThreeDAxesOptions;
  private readonly _sphereConfig: SphereOptions;
  private readonly _defaultAngledCameraPosition: { phi: number; theta: number };

  constructor(container: HTMLElement | null, options: SpecialThreeDSceneOptions = {}) {
    const {
      cutAxesAtRadius = true,
      threeDAxesConfig = {},
      sphereConfig = {},
      defaultAngledCameraPosition = { phi: DEFAULT_PHI, theta: DEFAULT_THETA },
      phi = defaultAngledCameraPosition.phi,
      theta = defaultAngledCameraPosition.theta,
      ...rest
    } = options;

    super(container, { ...rest, phi, theta });

    this.cutAxesAtRadius = cutAxesAtRadius;
    this._threeDAxesConfig = threeDAxesConfig;
    this._sphereConfig = sphereConfig;
    this._defaultAngledCameraPosition = defaultAngledCameraPosition;
  }

  /**
   * The default axes config. CE's `tick_frequency: 1` maps to a range step of
   * 1; the range is symmetric with ticks shown.
   */
  getDefaultAxesConfig(): ThreeDAxesOptions {
    return {
      xRange: [-6, 6, 1],
      yRange: [-6, 6, 1],
      zRange: [-6, 6, 1],
      showTicks: true,
    };
  }

  /** The default sphere config: CE's radius 2 at the collapsed resolution. */
  getDefaultSphereConfig(): SphereOptions {
    return {
      radius: DEFAULT_SPHERE_RADIUS,
      resolution: DEFAULT_SPHERE_RESOLUTION,
    };
  }

  /** Build a set of 3D axes from the default axes config and any overrides. */
  getAxes(): ThreeDAxes {
    return new ThreeDAxes({ ...this.getDefaultAxesConfig(), ...this._threeDAxesConfig });
  }

  /** Build a sphere from the default sphere config and any overrides. */
  getSphere(overrides: SphereOptions = {}): Sphere {
    return new Sphere({ ...this.getDefaultSphereConfig(), ...this._sphereConfig, ...overrides });
  }

  /** The default angled camera position, in radians. */
  getDefaultCameraPosition(): { phi: number; theta: number } {
    return { ...this._defaultAngledCameraPosition };
  }

  /** Set the camera to its default angled position. */
  setCameraToDefaultPosition(): this {
    const { phi, theta } = this._defaultAngledCameraPosition;
    return this.setCameraOrientation(phi, theta);
  }
}

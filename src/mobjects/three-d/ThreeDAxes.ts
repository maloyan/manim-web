import * as THREE from 'three';
import { Group } from '../../core/Group';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { MathTexImage } from '../text/MathTexImage';
import { Arrow3D } from './Arrow3D';
import { Line3D } from './Line3D';

/**
 * Options for creating ThreeDAxes
 */
export interface ThreeDAxesOptions {
  /** X-axis range as [min, max, step]. Default: [-6, 6, 1] */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Default: [-5, 5, 1] */
  yRange?: [number, number, number];
  /** Z-axis range as [min, max, step]. Default: [-4, 4, 1] */
  zRange?: [number, number, number];
  /** Default color for all axes. Default: '#ffffff' */
  axisColor?: string;
  /** Color for x-axis (overrides axisColor). Default: same as axisColor */
  xColor?: string;
  /** Color for y-axis (overrides axisColor). Default: same as axisColor */
  yColor?: string;
  /** Color for z-axis (overrides axisColor). Default: same as axisColor */
  zColor?: string;
  /** Whether to show axis labels (x, y, z). Default: false */
  showLabels?: boolean;
  /** Custom label text or Mobjects per axis. String entries become Text mobjects. Defaults: 'x', 'y', 'z' */
  labels?: {
    x?: string | Mobject;
    y?: string | Mobject;
    z?: string | Mobject;
  };
  /** Font size used when creating labels from strings (MathTexImage pixel size). Default: 32 */
  labelFontSize?: number;
  /** Offset in world units from each axis tip to its label. Default: 0.4 */
  labelBuffer?: number;
  /**
   * Whether axis labels rotate to always face the camera (Manim CE's
   * `add_fixed_orientation_mobjects` behavior). Default: true.
   */
  billboardLabels?: boolean;
  /** Whether to show tick marks. Default: true */
  showTicks?: boolean;
  /** Length of tick marks. Default: 0.15 */
  tickLength?: number;
  /** Tip length for arrows. Default: 0.2 */
  tipLength?: number;
  /** Tip radius for arrows. Default: 0.08 */
  tipRadius?: number;
  /** Shaft radius for arrows. Default: 0.01 */
  shaftRadius?: number;
}

/**
 * ThreeDAxes - A 3D coordinate system with x, y, and z axes
 *
 * Creates a 3D coordinate system with configurable ranges, colors,
 * and styling. Supports coordinate transformations between graph
 * space and visual space.
 *
 * @example
 * ```typescript
 * // Create default 3D axes
 * const axes = new ThreeDAxes();
 *
 * // Create axes with custom ranges
 * const customAxes = new ThreeDAxes({
 *   xRange: [0, 10, 1],
 *   yRange: [-1, 1, 0.5],
 *   zRange: [0, 5, 1]
 * });
 *
 * // Get a point in visual coordinates
 * const point = axes.coordsToPoint(3, 2, 1);
 *
 * // Create colored axes
 * const coloredAxes = new ThreeDAxes({
 *   xColor: '#ff0000',
 *   yColor: '#00ff00',
 *   zColor: '#0000ff'
 * });
 * ```
 */
export class ThreeDAxes extends Group {
  private _xAxis: Arrow3D;
  private _yAxis: Arrow3D;
  private _zAxis: Arrow3D;
  private _xRange!: [number, number, number];
  private _yRange!: [number, number, number];
  private _zRange!: [number, number, number];
  private _showTicks!: boolean;
  private _tickLength!: number;
  private _ticks: Line3D[] = [];
  private _showLabels!: boolean;
  private _labelFontSize!: number;
  private _labelBuffer!: number;
  private _billboardLabels!: boolean;
  private _xLabel: Mobject | null = null;
  private _yLabel: Mobject | null = null;
  private _zLabel: Mobject | null = null;
  private _labelGroup: Group | null = null;
  private _labelOptions: ThreeDAxesOptions['labels'];

  constructor(options: ThreeDAxesOptions = {}) {
    super();
    this._disableChildZLayering = true;

    const ranges = this._initRanges(options);
    this._initTickConfig(options);
    this._initLabelConfig(options);

    const colors = this._resolveAxisColors(options);
    const arrowCfg = this._resolveArrowConfig(options);

    this._xAxis = this._buildAxisArrow(
      [ranges.x[0], 0, 0],
      [ranges.x[1], 0, 0],
      colors.x,
      arrowCfg,
    );
    // Manim +Y maps to THREE -Z.
    this._yAxis = this._buildAxisArrow(
      [0, 0, -ranges.y[0]],
      [0, 0, -ranges.y[1]],
      colors.y,
      arrowCfg,
    );
    // Manim +Z maps to THREE +Y (up).
    this._zAxis = this._buildAxisArrow(
      [0, ranges.z[0], 0],
      [0, ranges.z[1], 0],
      colors.z,
      arrowCfg,
    );

    this.add(this._xAxis);
    this.add(this._yAxis);
    this.add(this._zAxis);

    if (this._showTicks) {
      this._createTicks(colors.x, colors.y, colors.z);
    }
    if (this._showLabels) {
      this._createLabels(colors.x, colors.y, colors.z);
    }
  }

  private _initRanges(options: ThreeDAxesOptions): {
    x: [number, number, number];
    y: [number, number, number];
    z: [number, number, number];
  } {
    const x: [number, number, number] = [...(options.xRange ?? [-6, 6, 1])];
    const y: [number, number, number] = [...(options.yRange ?? [-5, 5, 1])];
    const z: [number, number, number] = [...(options.zRange ?? [-4, 4, 1])];
    this._xRange = x;
    this._yRange = y;
    this._zRange = z;
    return { x, y, z };
  }

  private _initTickConfig(options: ThreeDAxesOptions): void {
    this._showTicks = options.showTicks ?? true;
    this._tickLength = options.tickLength ?? 0.15;
  }

  private _initLabelConfig(options: ThreeDAxesOptions): void {
    this._showLabels = options.showLabels ?? false;
    this._labelFontSize = options.labelFontSize ?? 32;
    this._labelBuffer = options.labelBuffer ?? 0.4;
    this._billboardLabels = options.billboardLabels ?? true;
    this._labelOptions = options.labels;
  }

  private _resolveAxisColors(options: ThreeDAxesOptions): { x: string; y: string; z: string } {
    const axisColor = options.axisColor ?? '#ffffff';
    return {
      x: options.xColor ?? axisColor,
      y: options.yColor ?? axisColor,
      z: options.zColor ?? axisColor,
    };
  }

  private _resolveArrowConfig(options: ThreeDAxesOptions): {
    tipLength: number;
    tipRadius: number;
    shaftRadius: number;
  } {
    return {
      tipLength: options.tipLength ?? 0.2,
      tipRadius: options.tipRadius ?? 0.08,
      shaftRadius: options.shaftRadius ?? 0.01,
    };
  }

  private _buildAxisArrow(
    start: [number, number, number],
    end: [number, number, number],
    color: string,
    arrow: { tipLength: number; tipRadius: number; shaftRadius: number },
  ): Arrow3D {
    return new Arrow3D({ start, end, color, ...arrow });
  }

  /**
   * Convert Manim coordinates (mx, my, mz) to THREE.js coordinates.
   * Manim: X right, Y forward, Z up → THREE.js: X right, Y up, Z backward
   */
  private _m2t(mx: number, my: number, mz: number): [number, number, number] {
    return [mx, mz, -my];
  }

  /**
   * Create tick marks for all axes using Manim→THREE.js coordinate mapping
   */
  private _createTicks(xColor: string, yColor: string, zColor: string): void {
    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;
    const [zMin, zMax, zStep] = this._zRange;
    const t = this._tickLength / 2;

    // X-axis ticks: single perpendicular mark in Manim Z direction (vertical)
    for (let x = xMin; x <= xMax; x += xStep) {
      if (Math.abs(x) < 0.001) continue;
      if (Math.abs(x - xMin) < 0.001 || Math.abs(x - xMax) < 0.001) continue;

      const tick = new Line3D({
        start: this._m2t(x, 0, -t),
        end: this._m2t(x, 0, t),
        color: xColor,
      });
      this._ticks.push(tick);
      this.add(tick);
    }

    // Y-axis ticks: single perpendicular mark in Manim Z direction (vertical)
    for (let y = yMin; y <= yMax; y += yStep) {
      if (Math.abs(y) < 0.001) continue;
      if (Math.abs(y - yMin) < 0.001 || Math.abs(y - yMax) < 0.001) continue;

      const tick = new Line3D({
        start: this._m2t(0, y, -t),
        end: this._m2t(0, y, t),
        color: yColor,
      });
      this._ticks.push(tick);
      this.add(tick);
    }

    // Z-axis ticks: single perpendicular mark in Manim X direction (horizontal)
    for (let z = zMin; z <= zMax; z += zStep) {
      if (Math.abs(z) < 0.001) continue;
      if (Math.abs(z - zMin) < 0.001 || Math.abs(z - zMax) < 0.001) continue;

      const tick = new Line3D({
        start: this._m2t(-t, 0, z),
        end: this._m2t(t, 0, z),
        color: zColor,
      });
      this._ticks.push(tick);
      this.add(tick);
    }
  }

  /**
   * Build label mobjects for each axis and place them just past each arrow
   * tip along the arrow direction.
   *
   * Note on Manim CE parity: Manim CE's `_get_axis_label` uses 2D screen
   * direction constants (UR = UP + RIGHT, etc.) which read nicely in 2D Axes
   * but map into arbitrary 3D offsets under a ThreeDScene camera — e.g. Manim
   * Y+ ("up" of UP+RIGHT) is scene depth in THREE's coord system, which
   * visually projects as "down-right of tip" under a phi≈75° camera. We
   * therefore offset along the axis direction, which keeps each label
   * visually adjacent to its arrow tip for any camera orientation. The
   * Manim CE `get_axis_labels(x, y, z)` overloaded entry point remains, so
   * users can also pass `next_to`-positioned mobjects explicitly.
   *
   * Manim CE's `rotate(PI/2, axis=RIGHT)` on the z-label is a no-op under
   * our Manim→THREE mapping: after the rotation the Manim-space normal would
   * map to +Z_THREE, which is already MathTexImage's default plane normal.
   */
  private _createLabels(xColor: string, yColor: string, zColor: string): void {
    const xInput = this._labelOptions?.x ?? 'x';
    const yInput = this._labelOptions?.y ?? 'y';
    const zInput = this._labelOptions?.z ?? 'z';

    this._xLabel = this._buildLabel(xInput, xColor);
    this._yLabel = this._buildLabel(yInput, yColor);
    this._zLabel = this._buildLabel(zInput, zColor);

    const buf = this._labelBuffer;
    const xMax = this._xRange[1];
    const yMax = this._yRange[1];
    const zMax = this._zRange[1];

    const xPos = this._m2t(xMax + buf, 0, 0);
    this._xLabel.position.set(xPos[0], xPos[1], xPos[2]);
    const yPos = this._m2t(0, yMax + buf, 0);
    this._yLabel.position.set(yPos[0], yPos[1], yPos[2]);
    // Z label: mirror Manim CE's `direction=RIGHT` convention — offset to
    // the side of the arrow tip (not directly above) so it doesn't sit
    // on top of the arrow shaft/cone.
    const zPos = this._m2t(buf, 0, zMax + buf * 0.3);
    this._zLabel.position.set(zPos[0], zPos[1], zPos[2]);

    // Labels live in a dedicated Group so `getAxisLabels()` can return the
    // same Group every time without re-parenting (which would remove the
    // labels from this axes' children).
    if (!this._labelGroup) {
      this._labelGroup = new Group();
      this.add(this._labelGroup);
    }
    this._labelGroup.add(this._xLabel);
    this._labelGroup.add(this._yLabel);
    this._labelGroup.add(this._zLabel);

    if (this._billboardLabels) {
      this._installBillboardHooks();
    }
  }

  /**
   * Attach an `onBeforeRender` hook to each label mesh that copies the
   * camera's quaternion at draw time, so labels always face the viewer
   * regardless of orbit/camera motion. Equivalent to Manim CE's
   * `add_fixed_orientation_mobjects` but without needing scene context.
   *
   * The hook is idempotent — calling this again replaces any prior hook.
   */
  private _installBillboardHooks(): void {
    for (const label of [this._xLabel, this._yLabel, this._zLabel]) {
      if (!label) continue;
      const root = label.getThreeObject();
      // `onBeforeRender` only fires on objects THREE actually rasterizes
      // (meshes/points/lines). MathTexImage wraps its Mesh inside a Group
      // from `_createThreeObject()`, so traverse and hook each descendant
      // Mesh. On each draw, align the mesh with the camera's world
      // quaternion so the label always faces the viewer. We compensate for
      // the ancestor chain by factoring out `parent.matrixWorld`'s rotation
      // so the final world rotation equals `camera.quaternion`.
      root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.onBeforeRender = (_renderer, _scene, camera) => {
          const parent = child.parent;
          if (parent) {
            parent.updateMatrixWorld(true);
            const parentWorldQuat = new THREE.Quaternion();
            parent.getWorldQuaternion(parentWorldQuat);
            child.quaternion.copy(parentWorldQuat.invert()).multiply(camera.quaternion);
          } else {
            child.quaternion.copy(camera.quaternion);
          }
          child.updateMatrix();
          child.updateMatrixWorld(true);
        };
      });
    }
  }

  /**
   * Turn a string into a MathTexImage mobject or pass through an existing Mobject.
   */
  private _buildLabel(input: string | Mobject, color: string): Mobject {
    if (typeof input === 'string') {
      return new MathTexImage({
        latex: input,
        fontSize: this._labelFontSize,
        color,
      });
    }
    return input;
  }

  /**
   * Convert graph coordinates (Manim space) to visual point coordinates (THREE.js space).
   * With unit_size=1, graph coordinates map directly to visual positions.
   * Applies Manim→THREE.js mapping: (mx, my, mz) → (mx, mz, -my)
   */
  coordsToPoint(x: number, y: number, z: number): Vector3Tuple {
    return [x + this.position.x, z + this.position.y, -y + this.position.z];
  }

  /**
   * Convert visual point coordinates (THREE.js space) to graph coordinates (Manim space).
   * Applies inverse THREE.js→Manim mapping: (tx, ty, tz) → (tx, -tz, ty)
   */
  pointToCoords(point: Vector3Tuple): Vector3Tuple {
    const tx = point[0] - this.position.x;
    const ty = point[1] - this.position.y;
    const tz = point[2] - this.position.z;
    return [tx, -tz, ty];
  }

  /**
   * Get the X-axis arrow
   */
  getXAxis(): Arrow3D {
    return this._xAxis;
  }

  /**
   * Get the Y-axis arrow
   */
  getYAxis(): Arrow3D {
    return this._yAxis;
  }

  /**
   * Get the Z-axis arrow
   */
  getZAxis(): Arrow3D {
    return this._zAxis;
  }

  /**
   * Get the X range
   */
  getXRange(): [number, number, number] {
    return [...this._xRange];
  }

  /**
   * Get the Y range
   */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /**
   * Get the Z range
   */
  getZRange(): [number, number, number] {
    return [...this._zRange];
  }

  /**
   * Get the visual X length (range span)
   */
  getXLength(): number {
    return this._xRange[1] - this._xRange[0];
  }

  /**
   * Get the visual Y length (range span)
   */
  getYLength(): number {
    return this._yRange[1] - this._yRange[0];
  }

  /**
   * Get the visual Z length (range span)
   */
  getZLength(): number {
    return this._zRange[1] - this._zRange[0];
  }

  /**
   * Get the origin point in visual coordinates
   */
  getOrigin(): Vector3Tuple {
    return this.coordsToPoint(0, 0, 0);
  }

  /**
   * Convert an x coordinate to visual x position
   */
  c2pX(x: number): number {
    return this.coordsToPoint(x, 0, 0)[0];
  }

  /**
   * Convert a y coordinate to visual y position
   */
  c2pY(y: number): number {
    return this.coordsToPoint(0, y, 0)[1];
  }

  /**
   * Convert a z coordinate to visual z position
   */
  c2pZ(z: number): number {
    return this.coordsToPoint(0, 0, z)[2];
  }

  /**
   * Manim CE's `shift_onto_screen` equivalent. Call once the scene/camera
   * exist (e.g. after `scene.add(axes)` and a first render). Projects each
   * axis label to normalized device coordinates using the supplied camera and,
   * if the label sits outside the [-1, 1] viewport box, shifts it back along
   * the vector to its axis tip until it lies inside.
   *
   * Requires runtime access to the camera, which `ThreeDAxes` has no handle
   * on at construction time — so this is an opt-in method rather than
   * automatic.
   *
   * @param camera - The camera the scene is rendering with (perspective/ortho).
   * @param margin - Fraction of NDC to keep as padding inside the viewport.
   *                 Default 0.05 (5% margin).
   */
  shiftLabelsOntoScreen(camera: THREE.Camera, margin: number = 0.05): this {
    camera.updateMatrixWorld();
    // Ensure every label's world matrix is current so projection uses the
    // live position, not a stale render-cached one.
    this.getThreeObject().updateMatrixWorld(true);

    const origin = new THREE.Vector3();
    this.getThreeObject().localToWorld(origin.set(0, 0, 0));
    const limit = 1 - margin;

    for (const label of [this._xLabel, this._yLabel, this._zLabel]) {
      if (!label) continue;
      const threeObj = label.getThreeObject();
      const worldPos = new THREE.Vector3();
      threeObj.getWorldPosition(worldPos);

      const ndc = worldPos.clone().project(camera);
      if (Math.abs(ndc.x) <= limit && Math.abs(ndc.y) <= limit) continue;

      // Bisect t ∈ [0, 1] along origin→label until the projected candidate
      // fits the viewport. t=1 keeps the original position; t=0 collapses
      // onto the axes origin.
      const dir = worldPos.clone().sub(origin);
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const candidate = origin.clone().add(dir.clone().multiplyScalar(mid));
        candidate.project(camera);
        if (Math.abs(candidate.x) <= limit && Math.abs(candidate.y) <= limit) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      const finalWorld = origin.clone().add(dir.clone().multiplyScalar(lo));
      const parent = threeObj.parent;
      if (parent) parent.worldToLocal(finalWorld);
      // Use moveTo so Mobject._markDirty fires and the next render syncs the
      // THREE object's position. Direct mutation of `position` would bypass
      // the dirty flag and leave the on-screen label at the original spot.
      label.moveTo([finalWorld.x, finalWorld.y, finalWorld.z]);
    }
    return this;
  }

  /**
   * Get the x-axis label mobject (null if showLabels was false)
   */
  getXLabel(): Mobject | null {
    return this._xLabel;
  }

  /**
   * Get the y-axis label mobject (null if showLabels was false)
   */
  getYLabel(): Mobject | null {
    return this._yLabel;
  }

  /**
   * Get the z-axis label mobject (null if showLabels was false)
   */
  getZLabel(): Mobject | null {
    return this._zLabel;
  }

  /**
   * Get all axis label mobjects as a Group.
   *
   * If no labels were created at construction time (showLabels was false)
   * or any of xLabel/yLabel/zLabel are supplied, labels are created/replaced
   * on demand and added to this group. Mirrors Manim CE's
   * `ThreeDAxes.get_axis_labels(x_label, y_label, z_label)`.
   *
   * @param xLabel - LaTeX string or Mobject for x-axis label. Default: 'x'
   * @param yLabel - LaTeX string or Mobject for y-axis label. Default: 'y'
   * @param zLabel - LaTeX string or Mobject for z-axis label. Default: 'z'
   */
  getAxisLabels(
    xLabel?: string | Mobject,
    yLabel?: string | Mobject,
    zLabel?: string | Mobject,
  ): Group {
    const hasOverride = xLabel !== undefined || yLabel !== undefined || zLabel !== undefined;
    if (hasOverride || !this._showLabels) {
      this._rebuildLabels(xLabel, yLabel, zLabel);
    }
    // Persistent internal Group; callers use it to animate/style labels
    // collectively. Labels remain parented to this axes.
    return this._labelGroup ?? new Group();
  }

  private _rebuildLabels(
    xLabel?: string | Mobject,
    yLabel?: string | Mobject,
    zLabel?: string | Mobject,
  ): void {
    this._labelOptions = {
      x: xLabel ?? this._labelOptions?.x,
      y: yLabel ?? this._labelOptions?.y,
      z: zLabel ?? this._labelOptions?.z,
    };
    this._showLabels = true;
    this._detachExistingLabels();
    this._createLabels(
      this._xAxis.color as string,
      this._yAxis.color as string,
      this._zAxis.color as string,
    );
  }

  private _detachExistingLabels(): void {
    if (!this._labelGroup) return;
    if (this._xLabel) this._labelGroup.remove(this._xLabel);
    if (this._yLabel) this._labelGroup.remove(this._yLabel);
    if (this._zLabel) this._labelGroup.remove(this._zLabel);
    this._xLabel = null;
    this._yLabel = null;
    this._zLabel = null;
  }

  /**
   * Create a copy of this ThreeDAxes
   */
  protected override _createCopy(): ThreeDAxes {
    return new ThreeDAxes({
      xRange: this._xRange,
      yRange: this._yRange,
      zRange: this._zRange,
      showTicks: this._showTicks,
      tickLength: this._tickLength,
      showLabels: this._showLabels,
      labels: this._labelOptions,
      labelFontSize: this._labelFontSize,
      labelBuffer: this._labelBuffer,
      billboardLabels: this._billboardLabels,
    });
  }
}

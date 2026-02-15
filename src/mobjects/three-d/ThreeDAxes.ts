import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
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
  /** Whether to show axis labels (X, Y, Z). Default: false */
  showLabels?: boolean;
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
  private _xRange: [number, number, number];
  private _yRange: [number, number, number];
  private _zRange: [number, number, number];
  private _showTicks: boolean;
  private _tickLength: number;
  private _ticks: Line3D[] = [];

  constructor(options: ThreeDAxesOptions = {}) {
    super();
    this._disableChildZLayering = true;

    const {
      xRange = [-6, 6, 1],
      yRange = [-5, 5, 1],
      zRange = [-4, 4, 1],
      axisColor = '#ffffff',
      xColor,
      yColor,
      zColor,
      showLabels: _showLabels = false,
      showTicks = true,
      tickLength = 0.15,
      tipLength = 0.2,
      tipRadius = 0.08,
      shaftRadius = 0.01,
    } = options;

    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._zRange = [...zRange];
    this._showTicks = showTicks;
    this._tickLength = tickLength;

    const effectiveXColor = xColor ?? axisColor;
    const effectiveYColor = yColor ?? axisColor;
    const effectiveZColor = zColor ?? axisColor;

    // Unit_size=1: graph coordinates map directly to visual positions (matching Python manim)
    // Manim→THREE.js coordinate mapping: (mx, my, mz) → (mx, mz, -my)

    // Create X-axis (Manim +X → THREE.js +X)
    this._xAxis = new Arrow3D({
      start: [xRange[0], 0, 0],
      end: [xRange[1], 0, 0],
      color: effectiveXColor,
      tipLength,
      tipRadius,
      shaftRadius,
    });

    // Create Y-axis (Manim +Y → THREE.js -Z)
    this._yAxis = new Arrow3D({
      start: [0, 0, -yRange[0]],
      end: [0, 0, -yRange[1]],
      color: effectiveYColor,
      tipLength,
      tipRadius,
      shaftRadius,
    });

    // Create Z-axis (Manim +Z → THREE.js +Y, up)
    this._zAxis = new Arrow3D({
      start: [0, zRange[0], 0],
      end: [0, zRange[1], 0],
      color: effectiveZColor,
      tipLength,
      tipRadius,
      shaftRadius,
    });

    this.add(this._xAxis);
    this.add(this._yAxis);
    this.add(this._zAxis);

    // Add tick marks if enabled
    if (showTicks) {
      this._createTicks(effectiveXColor, effectiveYColor, effectiveZColor);
    }
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
   * Create a copy of this ThreeDAxes
   */
  protected override _createCopy(): ThreeDAxes {
    return new ThreeDAxes({
      xRange: this._xRange,
      yRange: this._yRange,
      zRange: this._zRange,
      showTicks: this._showTicks,
      tickLength: this._tickLength,
    });
  }
}

export default ThreeDAxes;

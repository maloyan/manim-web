import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { Arrow3D } from './Arrow3D';
import { Line3D } from './Line3D';

/**
 * Options for creating ThreeDAxes
 */
export interface ThreeDAxesOptions {
  /** X-axis range as [min, max, step]. Default: [-5, 5, 1] */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Default: [-5, 5, 1] */
  yRange?: [number, number, number];
  /** Z-axis range as [min, max, step]. Default: [-5, 5, 1] */
  zRange?: [number, number, number];
  /** Visual length of the x-axis. Default: 10 */
  xLength?: number;
  /** Visual length of the y-axis. Default: 10 */
  yLength?: number;
  /** Visual length of the z-axis. Default: 10 */
  zLength?: number;
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
  /** Length of tick marks. Default: 0.1 */
  tickLength?: number;
  /** Tip length for arrows. Default: 0.2 */
  tipLength?: number;
  /** Tip radius for arrows. Default: 0.08 */
  tipRadius?: number;
  /** Shaft radius for arrows. Default: 0.02 */
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
  private _xLength: number;
  private _yLength: number;
  private _zLength: number;
  private _showTicks: boolean;
  private _tickLength: number;
  private _ticks: Line3D[] = [];

  constructor(options: ThreeDAxesOptions = {}) {
    super();

    const {
      xRange = [-5, 5, 1],
      yRange = [-5, 5, 1],
      zRange = [-5, 5, 1],
      xLength = 10,
      yLength = 10,
      zLength = 10,
      axisColor = '#ffffff',
      xColor,
      yColor,
      zColor,
      showLabels: _showLabels = false,
      showTicks = true,
      tickLength = 0.1,
      tipLength = 0.2,
      tipRadius = 0.08,
      shaftRadius = 0.02,
    } = options;

    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._zRange = [...zRange];
    this._xLength = xLength;
    this._yLength = yLength;
    this._zLength = zLength;
    this._showTicks = showTicks;
    this._tickLength = tickLength;

    const effectiveXColor = xColor ?? axisColor;
    const effectiveYColor = yColor ?? axisColor;
    const effectiveZColor = zColor ?? axisColor;

    // Calculate axis endpoints based on ranges and lengths
    // Manim→THREE.js coordinate mapping: (mx, my, mz) → (mx, mz, -my)
    // Manim X → THREE.js X, Manim Y → THREE.js -Z, Manim Z → THREE.js Y (up)
    const xHalf = xLength / 2;
    const yHalf = yLength / 2;
    const zHalf = zLength / 2;

    // Create X-axis (Manim +X → THREE.js +X)
    this._xAxis = new Arrow3D({
      start: [-xHalf, 0, 0],
      end: [xHalf, 0, 0],
      color: effectiveXColor,
      tipLength,
      tipRadius,
      shaftRadius,
    });

    // Create Y-axis (Manim +Y → THREE.js -Z)
    this._yAxis = new Arrow3D({
      start: [0, 0, yHalf],
      end: [0, 0, -yHalf],
      color: effectiveYColor,
      tipLength,
      tipRadius,
      shaftRadius,
    });

    // Create Z-axis (Manim +Z → THREE.js +Y, up)
    this._zAxis = new Arrow3D({
      start: [0, -zHalf, 0],
      end: [0, zHalf, 0],
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
    const xHalf = this._xLength / 2;
    const yHalf = this._yLength / 2;
    const zHalf = this._zLength / 2;

    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;
    const [zMin, zMax, zStep] = this._zRange;
    const t = this._tickLength / 2;

    // X-axis ticks (along Manim X; perpendicular ticks in Manim Y and Z)
    for (let x = xMin; x <= xMax; x += xStep) {
      if (Math.abs(x) < 0.001) continue;
      const vx = this._mapToVisual(x, xMin, xMax, -xHalf, xHalf);

      const tickY = new Line3D({
        start: this._m2t(vx, -t, 0),
        end: this._m2t(vx, t, 0),
        color: xColor,
      });
      this._ticks.push(tickY);
      this.add(tickY);

      const tickZ = new Line3D({
        start: this._m2t(vx, 0, -t),
        end: this._m2t(vx, 0, t),
        color: xColor,
      });
      this._ticks.push(tickZ);
      this.add(tickZ);
    }

    // Y-axis ticks (along Manim Y; perpendicular ticks in Manim X and Z)
    for (let y = yMin; y <= yMax; y += yStep) {
      if (Math.abs(y) < 0.001) continue;
      const vy = this._mapToVisual(y, yMin, yMax, -yHalf, yHalf);

      const tickX = new Line3D({
        start: this._m2t(-t, vy, 0),
        end: this._m2t(t, vy, 0),
        color: yColor,
      });
      this._ticks.push(tickX);
      this.add(tickX);

      const tickZ = new Line3D({
        start: this._m2t(0, vy, -t),
        end: this._m2t(0, vy, t),
        color: yColor,
      });
      this._ticks.push(tickZ);
      this.add(tickZ);
    }

    // Z-axis ticks (along Manim Z; perpendicular ticks in Manim X and Y)
    for (let z = zMin; z <= zMax; z += zStep) {
      if (Math.abs(z) < 0.001) continue;
      const vz = this._mapToVisual(z, zMin, zMax, -zHalf, zHalf);

      const tickX = new Line3D({
        start: this._m2t(-t, 0, vz),
        end: this._m2t(t, 0, vz),
        color: zColor,
      });
      this._ticks.push(tickX);
      this.add(tickX);

      const tickY = new Line3D({
        start: this._m2t(0, -t, vz),
        end: this._m2t(0, t, vz),
        color: zColor,
      });
      this._ticks.push(tickY);
      this.add(tickY);
    }
  }

  /**
   * Map a value from graph coordinates to visual coordinates
   */
  private _mapToVisual(
    value: number,
    graphMin: number,
    graphMax: number,
    visualMin: number,
    visualMax: number,
  ): number {
    if (graphMax === graphMin) return (visualMin + visualMax) / 2;
    const normalized = (value - graphMin) / (graphMax - graphMin);
    return visualMin + normalized * (visualMax - visualMin);
  }

  /**
   * Convert graph coordinates (Manim space) to visual point coordinates (THREE.js space).
   * Applies Manim→THREE.js mapping: (mx, my, mz) → (mx, mz, -my)
   * @param x X coordinate in graph space (Manim X)
   * @param y Y coordinate in graph space (Manim Y)
   * @param z Z coordinate in graph space (Manim Z)
   * @returns The visual point [x, y, z] in THREE.js space
   */
  coordsToPoint(x: number, y: number, z: number): Vector3Tuple {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;
    const [zMin, zMax] = this._zRange;

    const xHalf = this._xLength / 2;
    const yHalf = this._yLength / 2;
    const zHalf = this._zLength / 2;

    const manimX = this._mapToVisual(x, xMin, xMax, -xHalf, xHalf);
    const manimY = this._mapToVisual(y, yMin, yMax, -yHalf, yHalf);
    const manimZ = this._mapToVisual(z, zMin, zMax, -zHalf, zHalf);

    // Apply Manim→THREE.js: (mx, my, mz) → (mx, mz, -my)
    return [manimX + this.position.x, manimZ + this.position.y, -manimY + this.position.z];
  }

  /**
   * Convert visual point coordinates (THREE.js space) to graph coordinates (Manim space).
   * Applies inverse THREE.js→Manim mapping: (tx, ty, tz) → (tx, -tz, ty)
   * @param point Visual point [x, y, z] in THREE.js space
   * @returns The graph coordinates [x, y, z] in Manim space
   */
  pointToCoords(point: Vector3Tuple): Vector3Tuple {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;
    const [zMin, zMax] = this._zRange;

    const xHalf = this._xLength / 2;
    const yHalf = this._yLength / 2;
    const zHalf = this._zLength / 2;

    // Get local THREE.js coordinates
    const tx = point[0] - this.position.x;
    const ty = point[1] - this.position.y;
    const tz = point[2] - this.position.z;

    // Inverse mapping THREE.js→Manim: (tx, ty, tz) → (tx, -tz, ty)
    const graphX = this._mapToVisual(tx, -xHalf, xHalf, xMin, xMax);
    const graphY = this._mapToVisual(-tz, -yHalf, yHalf, yMin, yMax);
    const graphZ = this._mapToVisual(ty, -zHalf, zHalf, zMin, zMax);

    return [graphX, graphY, graphZ];
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
   * Get the visual X length
   */
  getXLength(): number {
    return this._xLength;
  }

  /**
   * Get the visual Y length
   */
  getYLength(): number {
    return this._yLength;
  }

  /**
   * Get the visual Z length
   */
  getZLength(): number {
    return this._zLength;
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
      xLength: this._xLength,
      yLength: this._yLength,
      zLength: this._zLength,
      showTicks: this._showTicks,
      tickLength: this._tickLength,
    });
  }
}

export default ThreeDAxes;

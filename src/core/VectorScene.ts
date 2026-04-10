import { Scene, SceneOptions } from './Scene';
import { Mobject, Vector3Tuple } from './Mobject';
import { Group } from './Group';
import { Line } from '../mobjects/geometry/Line';
import { Arrow } from '../mobjects/geometry/Arrow';
import {
  coordsToPoint as coordsToPointHelper,
  pointToCoords as pointToCoordsHelper,
} from '../utils/math';

/**
 * Options for configuring a VectorScene.
 */
export interface VectorSceneOptions extends SceneOptions {
  /** Whether to show the coordinate plane by default. Defaults to true. */
  showPlane?: boolean;
  /** X-axis range as [min, max, step]. Defaults to [-5, 5, 1]. */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Defaults to [-3, 3, 1]. */
  yRange?: [number, number, number];
  /** Visual length of the x-axis. Defaults to 10. */
  xLength?: number;
  /** Visual length of the y-axis. Defaults to 6. */
  yLength?: number;
  /** Color for the i basis vector. Defaults to green. */
  iColor?: string;
  /** Color for the j basis vector. Defaults to red. */
  jColor?: string;
  /** Whether to show basis vectors on creation. Defaults to false. */
  showBasisVectors?: boolean;
}

/**
 * Scene optimized for vector visualizations.
 * Provides a coordinate plane by default with easy vector addition.
 */
export class VectorScene extends Scene {
  private _plane: Mobject | null = null;
  private _planeVisible: boolean;
  private _xRange: [number, number, number];
  private _yRange: [number, number, number];
  private _xLength: number;
  private _yLength: number;
  private _iColor: string;
  private _jColor: string;
  private _vectors: Map<string, Mobject> = new Map();
  private _basisVectorsShown: boolean = false;

  /**
   * Create a new vector scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: VectorSceneOptions = {}) {
    super(container, options);

    const {
      showPlane = true,
      xRange = [-5, 5, 1],
      yRange = [-3, 3, 1],
      xLength = 10,
      yLength = 6,
      iColor = '#83C167', // GREEN
      jColor = '#FC6255', // RED
      showBasisVectors = false,
    } = options;

    this._planeVisible = showPlane;
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._xLength = xLength;
    this._yLength = yLength;
    this._iColor = iColor;
    this._jColor = jColor;

    if (showPlane) {
      this._setupPlane();
    }

    if (showBasisVectors) {
      this.showBasisVectors();
    }

    this.render();
  }

  /**
   * Set up the coordinate plane.
   */
  private _setupPlane(): void {
    const grid = new Group();
    const gridColor = '#555555';
    const axisColor = '#ffffff';

    // Background grid lines
    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;

    // Helper to convert coords to visual
    const c2p = (x: number, y: number): Vector3Tuple => {
      const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
      const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;
      return [(xNorm - 0.5) * this._xLength, (yNorm - 0.5) * this._yLength, 0];
    };

    // Vertical lines
    for (let x = xMin; x <= xMax; x += xStep) {
      const [vx] = c2p(x, 0);
      const isAxis = Math.abs(x) < 0.001;
      const line = new Line({
        start: [vx, -this._yLength / 2, 0] as Vector3Tuple,
        end: [vx, this._yLength / 2, 0] as Vector3Tuple,
        color: isAxis ? axisColor : gridColor,
        strokeWidth: isAxis ? 2 : 1,
      });
      if (!isAxis) line.setStrokeOpacity(0.5);
      grid.add(line);
    }

    // Horizontal lines
    for (let y = yMin; y <= yMax; y += yStep) {
      const [, vy] = c2p(0, y);
      const isAxis = Math.abs(y) < 0.001;
      const line = new Line({
        start: [-this._xLength / 2, vy, 0] as Vector3Tuple,
        end: [this._xLength / 2, vy, 0] as Vector3Tuple,
        color: isAxis ? axisColor : gridColor,
        strokeWidth: isAxis ? 2 : 1,
      });
      if (!isAxis) line.setStrokeOpacity(0.5);
      grid.add(line);
    }

    this._plane = grid;
    this.add(grid);
  }

  /**
   * Get the coordinate plane.
   */
  get plane(): Mobject | null {
    return this._plane;
  }

  /**
   * Convert graph coordinates to visual point coordinates.
   * @param x - X coordinate in graph space
   * @param y - Y coordinate in graph space
   * @returns The visual point [x, y, z]
   */
  coordsToPoint(x: number, y: number): Vector3Tuple {
    return coordsToPointHelper(x, y, this._xRange, this._yRange, this._xLength, this._yLength);
  }

  /**
   * Convert visual point to graph coordinates.
   * @param point - Visual point [x, y, z]
   * @returns Graph coordinates [x, y]
   */
  pointToCoords(point: Vector3Tuple): [number, number] {
    return pointToCoordsHelper(point, this._xRange, this._yRange, this._xLength, this._yLength);
  }

  /**
   * Check if the plane is visible.
   */
  get isPlaneVisible(): boolean {
    return this._planeVisible;
  }

  /**
   * Add a vector to the scene.
   * @param vector - Vector coordinates [x, y] or [x, y, z]
   * @param options - Optional configuration
   * @returns The created vector mobject
   */
  addVector(
    vector: [number, number] | Vector3Tuple,
    options: {
      color?: string;
      name?: string;
      startPoint?: Vector3Tuple;
    } = {},
  ): Mobject {
    const { color = '#58C4DD', name, startPoint } = options;

    const vx = vector[0];
    const vy = vector[1];
    const vz = vector.length > 2 ? (vector as Vector3Tuple)[2] : 0;

    // Convert to visual coordinates
    const start = startPoint ?? this.coordsToPoint(0, 0);
    const endCoords = startPoint
      ? [
          startPoint[0] + (this._xLength * vx) / (this._xRange[1] - this._xRange[0]),
          startPoint[1] + (this._yLength * vy) / (this._yRange[1] - this._yRange[0]),
          vz,
        ]
      : this.coordsToPoint(vx, vy);

    const arrow = new Arrow({
      start,
      end: endCoords as Vector3Tuple,
      color,
      tipLength: 0.2,
      tipWidth: 0.12,
    });

    if (name) {
      this._vectors.set(name, arrow);
    }

    this.add(arrow);
    return arrow;
  }

  /**
   * Get a named vector.
   * @param name - Name of the vector
   * @returns The vector mobject or undefined
   */
  getVector(name: string): Mobject | undefined {
    return this._vectors.get(name);
  }

  /**
   * Show the standard basis vectors i and j.
   * @returns this for chaining
   */
  showBasisVectors(): this {
    if (this._basisVectorsShown) return this;

    this.addVector([1, 0], { color: this._iColor, name: 'i' });
    this.addVector([0, 1], { color: this._jColor, name: 'j' });

    this._basisVectorsShown = true;
    this.render();
    return this;
  }

  /**
   * Hide the basis vectors.
   * @returns this for chaining
   */
  hideBasisVectors(): this {
    const iVec = this._vectors.get('i');
    const jVec = this._vectors.get('j');

    if (iVec) {
      this.remove(iVec);
      this._vectors.delete('i');
    }
    if (jVec) {
      this.remove(jVec);
      this._vectors.delete('j');
    }

    this._basisVectorsShown = false;
    this.render();
    return this;
  }

  /**
   * Get the origin point in visual coordinates.
   */
  getOrigin(): Vector3Tuple {
    return this.coordsToPoint(0, 0);
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this._vectors.clear();
    super.dispose();
  }
}

import * as THREE from 'three';
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
 * Options for configuring a LinearTransformationScene.
 */
export interface LinearTransformationSceneOptions extends SceneOptions {
  /** X-axis range as [min, max, step]. Defaults to [-5, 5, 1]. */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Defaults to [-5, 5, 1]. */
  yRange?: [number, number, number];
  /** Visual length of the x-axis. Defaults to 10. */
  xLength?: number;
  /** Visual length of the y-axis. Defaults to 10. */
  yLength?: number;
  /** Color for the i basis vector. Defaults to green. */
  iColor?: string;
  /** Color for the j basis vector. Defaults to red. */
  jColor?: string;
  /** Whether to show basis vectors by default. Defaults to true. */
  showBasisVectors?: boolean;
  /** Color for background grid lines. Defaults to '#555555'. */
  gridColor?: string;
}

/**
 * Matrix type for 2D linear transformations.
 * Represented as [[a, b], [c, d]] where the matrix is:
 * | a  b |
 * | c  d |
 */
export type Matrix2D = [[number, number], [number, number]];

/**
 * Scene for linear algebra visualizations.
 * Shows basis vectors and a grid that transforms with matrices.
 */
export class LinearTransformationScene extends Scene {
  private _xRange: [number, number, number];
  private _yRange: [number, number, number];
  private _xLength: number;
  private _yLength: number;
  private _iColor: string;
  private _jColor: string;
  private _gridColor: string;

  private _grid: Mobject | null = null;
  private _iVector: Mobject | null = null;
  private _jVector: Mobject | null = null;
  private _transformableObjects: Mobject[] = [];
  private _currentMatrix: Matrix2D = [
    [1, 0],
    [0, 1],
  ];
  private _showBasisVectors: boolean;

  /**
   * Create a new linear transformation scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: LinearTransformationSceneOptions = {}) {
    super(container, options);

    const {
      xRange = [-5, 5, 1],
      yRange = [-5, 5, 1],
      xLength = 10,
      yLength = 10,
      iColor = '#83C167', // GREEN
      jColor = '#FC6255', // RED
      showBasisVectors = true,
      gridColor = '#555555',
    } = options;

    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._xLength = xLength;
    this._yLength = yLength;
    this._iColor = iColor;
    this._jColor = jColor;
    this._showBasisVectors = showBasisVectors;
    this._gridColor = gridColor;

    this._setupGrid();

    if (showBasisVectors) {
      this._setupBasisVectors();
    }

    this.render();
  }

  /**
   * Set up the background grid.
   */
  private _setupGrid(): void {
    const grid = new Group();

    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;

    // Vertical lines
    for (let x = xMin; x <= xMax; x += xStep) {
      const vx = this._coordToVisualX(x);
      const line = new Line({
        start: [vx, -this._yLength / 2, 0] as Vector3Tuple,
        end: [vx, this._yLength / 2, 0] as Vector3Tuple,
        color: this._gridColor,
        strokeWidth: 1,
      });
      line.setStrokeOpacity(0.5);
      grid.add(line);
    }

    // Horizontal lines
    for (let y = yMin; y <= yMax; y += yStep) {
      const vy = this._coordToVisualY(y);
      const line = new Line({
        start: [-this._xLength / 2, vy, 0] as Vector3Tuple,
        end: [this._xLength / 2, vy, 0] as Vector3Tuple,
        color: this._gridColor,
        strokeWidth: 1,
      });
      line.setStrokeOpacity(0.5);
      grid.add(line);
    }

    this._grid = grid;
    this._transformableObjects.push(grid);
    this.add(grid);
  }

  /**
   * Set up the basis vectors.
   */
  private _setupBasisVectors(): void {
    const origin = this.coordsToPoint(0, 0);

    // i vector (1, 0)
    const iEnd = this.coordsToPoint(1, 0);
    this._iVector = new Arrow({
      start: origin,
      end: iEnd,
      color: this._iColor,
      tipLength: 0.2,
      tipWidth: 0.12,
      strokeWidth: 4,
    });
    this._transformableObjects.push(this._iVector);
    this.add(this._iVector);

    // j vector (0, 1)
    const jEnd = this.coordsToPoint(0, 1);
    this._jVector = new Arrow({
      start: origin,
      end: jEnd,
      color: this._jColor,
      tipLength: 0.2,
      tipWidth: 0.12,
      strokeWidth: 4,
    });
    this._transformableObjects.push(this._jVector);
    this.add(this._jVector);
  }

  /**
   * Convert x coordinate to visual x position.
   */
  private _coordToVisualX(x: number): number {
    const [xMin, xMax] = this._xRange;
    const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
    return (xNorm - 0.5) * this._xLength;
  }

  /**
   * Convert y coordinate to visual y position.
   */
  private _coordToVisualY(y: number): number {
    const [yMin, yMax] = this._yRange;
    const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;
    return (yNorm - 0.5) * this._yLength;
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
   * Get the i basis vector mobject.
   */
  get iVector(): Mobject | null {
    return this._iVector;
  }

  /**
   * Get the j basis vector mobject.
   */
  get jVector(): Mobject | null {
    return this._jVector;
  }

  /**
   * Get the background grid mobject.
   */
  get grid(): Mobject | null {
    return this._grid;
  }

  /**
   * Get the current transformation matrix.
   */
  get currentMatrix(): Matrix2D {
    return [[...this._currentMatrix[0]], [...this._currentMatrix[1]]];
  }

  /**
   * Apply a matrix transformation to all transformable objects.
   * @param matrix - 2D transformation matrix [[a, b], [c, d]]
   * @returns this for chaining
   */
  applyMatrix(matrix: Matrix2D): this {
    const [[a, b], [c, d]] = matrix;

    // Update current matrix by multiplying
    const [[a1, b1], [c1, d1]] = this._currentMatrix;
    this._currentMatrix = [
      [a * a1 + b * c1, a * b1 + b * d1],
      [c * a1 + d * c1, c * b1 + d * d1],
    ];

    // Apply transformation to all transformable objects
    // Create a THREE.js matrix for the transformation
    const threeMatrix = new THREE.Matrix4();
    threeMatrix.set(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

    for (const obj of this._transformableObjects) {
      const threeObj = obj.getThreeObject();
      threeObj.applyMatrix4(threeMatrix);
    }

    this.render();
    return this;
  }

  /**
   * Reset the transformation to identity.
   * @returns this for chaining
   */
  resetTransformation(): this {
    // Calculate inverse of current matrix
    const [[a, b], [c, d]] = this._currentMatrix;
    const det = a * d - b * c;

    if (Math.abs(det) < 0.0001) {
      // Matrix is singular, rebuild the scene
      this._rebuildScene();
      return this;
    }

    const invMatrix: Matrix2D = [
      [d / det, -b / det],
      [-c / det, a / det],
    ];

    // Apply inverse to reset
    const threeMatrix = new THREE.Matrix4();
    threeMatrix.set(
      invMatrix[0][0],
      invMatrix[0][1],
      0,
      0,
      invMatrix[1][0],
      invMatrix[1][1],
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    );

    for (const obj of this._transformableObjects) {
      const threeObj = obj.getThreeObject();
      threeObj.applyMatrix4(threeMatrix);
    }

    this._currentMatrix = [
      [1, 0],
      [0, 1],
    ];
    this.render();
    return this;
  }

  /**
   * Rebuild the scene from scratch.
   */
  private _rebuildScene(): void {
    // Remove old objects
    for (const obj of this._transformableObjects) {
      this.remove(obj);
    }
    this._transformableObjects = [];
    this._grid = null;
    this._iVector = null;
    this._jVector = null;

    // Reset matrix
    this._currentMatrix = [
      [1, 0],
      [0, 1],
    ];

    // Rebuild
    this._setupGrid();
    if (this._showBasisVectors) {
      this._setupBasisVectors();
    }

    this.render();
  }

  /**
   * Add a vector to the scene that will transform with the matrix.
   * @param vector - Vector coordinates [x, y]
   * @param options - Optional configuration
   * @returns The created vector mobject
   */
  addVector(
    vector: [number, number],
    options: {
      color?: string;
      addToTransformable?: boolean;
    } = {},
  ): Mobject {
    const { color = '#FFFF00', addToTransformable = true } = options;

    const origin = this.coordsToPoint(0, 0);
    const end = this.coordsToPoint(vector[0], vector[1]);

    const arrow = new Arrow({
      start: origin,
      end,
      color,
      tipLength: 0.2,
      tipWidth: 0.12,
      strokeWidth: 3,
    });

    if (addToTransformable) {
      this._transformableObjects.push(arrow);
    }

    this.add(arrow);
    return arrow;
  }

  /**
   * Add a mobject (such as a label or shape) that will transform with the matrix.
   * Use this to add any mobject that should participate in linear transformations.
   * @param mobject - The mobject to add
   * @param position - Optional position [x, y] in graph coordinates
   * @returns The added mobject
   */
  addTransformableLabel(mobject: Mobject, position?: [number, number]): Mobject {
    if (position) {
      const visualPos = this.coordsToPoint(position[0], position[1]);
      mobject.moveTo(visualPos);
    }

    this._transformableObjects.push(mobject);
    this.add(mobject);
    return mobject;
  }

  /**
   * Get the origin point in visual coordinates.
   */
  getOrigin(): Vector3Tuple {
    return this.coordsToPoint(0, 0);
  }

  /**
   * Show the basis vectors if hidden.
   * @returns this for chaining
   */
  showBasisVectors(): this {
    if (this._iVector && this._jVector) {
      return this;
    }
    this._setupBasisVectors();
    this._showBasisVectors = true;
    this.render();
    return this;
  }

  /**
   * Hide the basis vectors.
   * @returns this for chaining
   */
  hideBasisVectors(): this {
    if (this._iVector) {
      this.remove(this._iVector);
      const idx = this._transformableObjects.indexOf(this._iVector);
      if (idx !== -1) this._transformableObjects.splice(idx, 1);
      this._iVector = null;
    }
    if (this._jVector) {
      this.remove(this._jVector);
      const idx = this._transformableObjects.indexOf(this._jVector);
      if (idx !== -1) this._transformableObjects.splice(idx, 1);
      this._jVector = null;
    }
    this._showBasisVectors = false;
    this.render();
    return this;
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this._transformableObjects = [];
    super.dispose();
  }
}

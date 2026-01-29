import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a Polygon
 */
export interface PolygonOptions {
  /** Array of vertices defining the polygon. Required. */
  vertices: Vector3Tuple[];
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Whether to close the polygon. Default: true */
  closed?: boolean;
}

/**
 * Polygon - A polygonal VMobject defined by vertices
 *
 * Creates a polygon by connecting a series of vertices with line segments.
 *
 * @example
 * ```typescript
 * // Create a triangle
 * const triangle = new Polygon({
 *   vertices: [
 *     [0, 1, 0],
 *     [-1, -0.5, 0],
 *     [1, -0.5, 0]
 *   ]
 * });
 *
 * // Create an open path (not closed)
 * const path = new Polygon({
 *   vertices: [[0, 0, 0], [1, 1, 0], [2, 0, 0]],
 *   closed: false
 * });
 * ```
 */
export class Polygon extends VMobject {
  private _vertices: Vector3Tuple[];
  private _closed: boolean;

  constructor(options: PolygonOptions) {
    super();

    const {
      vertices,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      closed = true,
    } = options;

    if (!vertices || vertices.length < 2) {
      throw new Error('Polygon requires at least 2 vertices');
    }

    this._vertices = vertices.map((v) => [...v] as Vector3Tuple);
    this._closed = closed;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the polygon points from vertices as line segments
   */
  private _generatePoints(): void {
    const points: number[][] = [];

    // Helper to add a line segment as cubic Bezier
    const addLineSegment = (p0: Vector3Tuple, p1: Vector3Tuple, isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (isFirst) {
        // First segment includes starting anchor
        points.push([...p0]);
      }
      // Control points at 1/3 and 2/3
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    // Connect vertices with line segments
    for (let i = 0; i < this._vertices.length - 1; i++) {
      addLineSegment(this._vertices[i], this._vertices[i + 1], i === 0);
    }

    // Close the polygon if needed
    if (this._closed && this._vertices.length > 2) {
      addLineSegment(
        this._vertices[this._vertices.length - 1],
        this._vertices[0],
        false
      );
    }

    this.setPoints3D(points);
  }

  /**
   * Get the vertices of the polygon
   */
  getVertices(): Vector3Tuple[] {
    return this._vertices.map((v) => [...v] as Vector3Tuple);
  }

  /**
   * Set the vertices of the polygon
   */
  setVertices(vertices: Vector3Tuple[]): this {
    if (vertices.length < 2) {
      throw new Error('Polygon requires at least 2 vertices');
    }
    this._vertices = vertices.map((v) => [...v] as Vector3Tuple);
    this._generatePoints();
    return this;
  }

  /**
   * Get whether the polygon is closed
   */
  isClosed(): boolean {
    return this._closed;
  }

  /**
   * Set whether the polygon is closed
   */
  setClosed(value: boolean): this {
    this._closed = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the number of vertices
   */
  getVertexCount(): number {
    return this._vertices.length;
  }

  /**
   * Get a specific vertex by index
   */
  getVertex(index: number): Vector3Tuple {
    if (index < 0 || index >= this._vertices.length) {
      throw new Error(`Vertex index ${index} out of bounds`);
    }
    return [...this._vertices[index]];
  }

  /**
   * Set a specific vertex by index
   */
  setVertex(index: number, point: Vector3Tuple): this {
    if (index < 0 || index >= this._vertices.length) {
      throw new Error(`Vertex index ${index} out of bounds`);
    }
    this._vertices[index] = [...point];
    this._generatePoints();
    return this;
  }

  /**
   * Get the centroid of the polygon
   */
  getCentroid(): Vector3Tuple {
    if (this._vertices.length === 0) {
      return [0, 0, 0];
    }

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (const vertex of this._vertices) {
      sumX += vertex[0];
      sumY += vertex[1];
      sumZ += vertex[2];
    }

    return [
      sumX / this._vertices.length,
      sumY / this._vertices.length,
      sumZ / this._vertices.length,
    ];
  }

  /**
   * Calculate the area of the polygon using the Shoelace formula (2D, in XY plane)
   * Returns a positive value for counter-clockwise vertices, negative for clockwise
   */
  getSignedArea(): number {
    if (this._vertices.length < 3 || !this._closed) {
      return 0;
    }

    let area = 0;
    const n = this._vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this._vertices[i][0] * this._vertices[j][1];
      area -= this._vertices[j][0] * this._vertices[i][1];
    }

    return area / 2;
  }

  /**
   * Get the area of the polygon (absolute value)
   */
  getArea(): number {
    return Math.abs(this.getSignedArea());
  }

  /**
   * Get the perimeter of the polygon
   */
  getPerimeter(): number {
    if (this._vertices.length < 2) {
      return 0;
    }

    let perimeter = 0;
    const n = this._vertices.length;

    for (let i = 0; i < n; i++) {
      const j = this._closed ? (i + 1) % n : i + 1;
      if (j >= n) break;

      const dx = this._vertices[j][0] - this._vertices[i][0];
      const dy = this._vertices[j][1] - this._vertices[i][1];
      const dz = this._vertices[j][2] - this._vertices[i][2];
      perimeter += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    return perimeter;
  }

  /**
   * Create a copy of this Polygon
   */
  protected override _createCopy(): Polygon {
    return new Polygon({
      vertices: this._vertices,
      closed: this._closed,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Triangle - A polygon with exactly 3 vertices
 */
export class Triangle extends Polygon {
  constructor(
    options: Omit<PolygonOptions, 'vertices' | 'closed'> & {
      vertices?: [Vector3Tuple, Vector3Tuple, Vector3Tuple];
    } = {}
  ) {
    const {
      vertices = [
        [0, 1, 0],
        [-Math.sqrt(3) / 2, -0.5, 0],
        [Math.sqrt(3) / 2, -0.5, 0],
      ],
      ...rest
    } = options;

    super({ ...rest, vertices, closed: true });
  }
}

/**
 * RegularPolygon - A polygon with all sides equal and all angles equal
 */
export class RegularPolygon extends Polygon {
  private _numSides: number;
  private _radius: number;

  constructor(
    options: Omit<PolygonOptions, 'vertices' | 'closed'> & {
      numSides?: number;
      radius?: number;
      center?: Vector3Tuple;
      startAngle?: number;
    } = {}
  ) {
    const {
      numSides = 6,
      radius = 1,
      center = [0, 0, 0],
      startAngle = Math.PI / 2,
      ...rest
    } = options;

    const vertices = RegularPolygon._generateVertices(numSides, radius, center, startAngle);
    super({ ...rest, vertices, closed: true });

    this._numSides = numSides;
    this._radius = radius;
  }

  private static _generateVertices(
    numSides: number,
    radius: number,
    center: Vector3Tuple,
    startAngle: number
  ): Vector3Tuple[] {
    const vertices: Vector3Tuple[] = [];
    const angleStep = (2 * Math.PI) / numSides;

    for (let i = 0; i < numSides; i++) {
      const angle = startAngle + i * angleStep;
      vertices.push([
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle),
        center[2],
      ]);
    }

    return vertices;
  }

  /**
   * Get the number of sides
   */
  getNumSides(): number {
    return this._numSides;
  }

  /**
   * Get the radius (circumradius)
   */
  getPolygonRadius(): number {
    return this._radius;
  }

  /**
   * Get the apothem (inradius)
   */
  getApothem(): number {
    return this._radius * Math.cos(Math.PI / this._numSides);
  }

  /**
   * Get the side length
   */
  getSideLength(): number {
    return 2 * this._radius * Math.sin(Math.PI / this._numSides);
  }
}

/**
 * Hexagon - A regular hexagon (6 sides)
 */
export class Hexagon extends RegularPolygon {
  constructor(
    options: Omit<PolygonOptions, 'vertices' | 'closed'> & {
      radius?: number;
      center?: Vector3Tuple;
    } = {}
  ) {
    super({ ...options, numSides: 6 });
  }
}

/**
 * Pentagon - A regular pentagon (5 sides)
 */
export class Pentagon extends RegularPolygon {
  constructor(
    options: Omit<PolygonOptions, 'vertices' | 'closed'> & {
      radius?: number;
      center?: Vector3Tuple;
    } = {}
  ) {
    super({ ...options, numSides: 5 });
  }
}

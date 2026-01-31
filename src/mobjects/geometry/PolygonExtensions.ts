import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a RoundedRectangle
 */
export interface RoundedRectangleOptions {
  /** Width of the rectangle. Default: 2 */
  width?: number;
  /** Height of the rectangle. Default: 1 */
  height?: number;
  /** Corner radius. Default: 0.25 */
  cornerRadius?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * RoundedRectangle - A rectangle with rounded corners
 *
 * Creates a rectangle with circular arcs at each corner using cubic Bezier
 * approximation for the arcs.
 *
 * @example
 * ```typescript
 * // Create a rounded rectangle
 * const roundedRect = new RoundedRectangle({ width: 3, height: 2, cornerRadius: 0.5 });
 *
 * // Create a pill shape (corner radius = half height)
 * const pill = new RoundedRectangle({ width: 4, height: 1, cornerRadius: 0.5 });
 * ```
 */
export class RoundedRectangle extends VMobject {
  private _width: number;
  private _height: number;
  private _cornerRadius: number;
  private _centerPoint: Vector3Tuple;

  constructor(options: RoundedRectangleOptions = {}) {
    super();

    const {
      width = 2,
      height = 1,
      cornerRadius = 0.25,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
    } = options;

    this._width = width;
    this._height = height;
    // Clamp corner radius to not exceed half of smaller dimension
    this._cornerRadius = Math.min(cornerRadius, width / 2, height / 2);
    this._centerPoint = [...center];

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the rounded rectangle points
   */
  private _generatePoints(): void {
    const points: number[][] = [];
    const halfWidth = this._width / 2;
    const halfHeight = this._height / 2;
    const r = this._cornerRadius;
    const [cx, cy, cz] = this._centerPoint;

    // Kappa factor for 90-degree arc approximation
    const kappa = (4 / 3) * Math.tan(Math.PI / 8);

    // Helper to add a line segment as cubic Bezier
    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    // Helper to add a 90-degree arc at a corner
    // arcCenter: center of the arc circle
    // startAngle: starting angle in radians
    const addCornerArc = (arcCenterX: number, arcCenterY: number, startAngle: number) => {
      const theta1 = startAngle;
      const theta2 = startAngle + Math.PI / 2;

      // Start point
      const x0 = arcCenterX + r * Math.cos(theta1);
      const y0 = arcCenterY + r * Math.sin(theta1);

      // End point
      const x3 = arcCenterX + r * Math.cos(theta2);
      const y3 = arcCenterY + r * Math.sin(theta2);

      // Control points using kappa
      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * r * dx1;
      const y1 = y0 + kappa * r * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * r * dx2;
      const y2 = y3 - kappa * r * dy2;

      // Arc doesn't need first point (connected from previous segment)
      points.push([x1, y1, cz]);
      points.push([x2, y2, cz]);
      points.push([x3, y3, cz]);
    };

    // Start from top edge (after top-left corner arc ends)
    // Top-left corner arc center
    const tlX = cx - halfWidth + r;
    const tlY = cy + halfHeight - r;

    // Top-right corner arc center
    const trX = cx + halfWidth - r;
    const trY = cy + halfHeight - r;

    // Bottom-right corner arc center
    const brX = cx + halfWidth - r;
    const brY = cy - halfHeight + r;

    // Bottom-left corner arc center
    const blX = cx - halfWidth + r;
    const blY = cy - halfHeight + r;

    // Start at top-left corner (end of top-left arc = top of left edge)
    const startX = cx - halfWidth;
    const startY = cy + halfHeight - r;

    // Build path: top-left arc -> top edge -> top-right arc -> right edge ->
    // bottom-right arc -> bottom edge -> bottom-left arc -> left edge (close)

    // Top-left corner arc (starts at left, goes to top) - 180 to 270 degrees (or PI to 3PI/2)
    // Actually starts from left side going up: angle PI to PI/2
    const arcStart = Math.PI;

    // First point (start of top-left arc)
    points.push([startX, startY, cz]);

    // Top-left corner arc (from left going to top)
    addCornerArc(tlX, tlY, arcStart);

    // Top edge (from top-left corner end to top-right corner start)
    addLineSegment(
      [tlX, cy + halfHeight, cz],
      [trX, cy + halfHeight, cz],
      false
    );

    // Top-right corner arc (from top going to right)
    addCornerArc(trX, trY, Math.PI / 2);

    // Right edge
    addLineSegment(
      [cx + halfWidth, trY, cz],
      [cx + halfWidth, brY, cz],
      false
    );

    // Bottom-right corner arc (from right going to bottom)
    addCornerArc(brX, brY, 0);

    // Bottom edge
    addLineSegment(
      [brX, cy - halfHeight, cz],
      [blX, cy - halfHeight, cz],
      false
    );

    // Bottom-left corner arc (from bottom going to left)
    addCornerArc(blX, blY, -Math.PI / 2);

    // Left edge (closes the shape)
    addLineSegment(
      [cx - halfWidth, blY, cz],
      [cx - halfWidth, tlY, cz],
      false
    );

    this.setPoints3D(points);
  }

  /**
   * Get the width of the rounded rectangle
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Set the width of the rounded rectangle
   */
  setWidth(value: number): this {
    this._width = value;
    this._cornerRadius = Math.min(this._cornerRadius, value / 2, this._height / 2);
    this._generatePoints();
    return this;
  }

  /**
   * Get the height of the rounded rectangle
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the height of the rounded rectangle
   */
  setHeight(value: number): this {
    this._height = value;
    this._cornerRadius = Math.min(this._cornerRadius, this._width / 2, value / 2);
    this._generatePoints();
    return this;
  }

  /**
   * Get the corner radius
   */
  getCornerRadius(): number {
    return this._cornerRadius;
  }

  /**
   * Set the corner radius
   */
  setCornerRadius(value: number): this {
    this._cornerRadius = Math.min(value, this._width / 2, this._height / 2);
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the rounded rectangle
   */
  getRoundedRectCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Set the center of the rounded rectangle
   */
  setRoundedRectCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this RoundedRectangle
   */
  protected override _createCopy(): RoundedRectangle {
    return new RoundedRectangle({
      width: this._width,
      height: this._height,
      cornerRadius: this._cornerRadius,
      center: this._centerPoint,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a Star
 */
export interface StarOptions {
  /** Number of points on the star. Default: 5 */
  numPoints?: number;
  /** Outer radius (to the tips). Default: 1 */
  outerRadius?: number;
  /** Inner radius (to the inner vertices). Default: 0.4 */
  innerRadius?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Start angle in radians. Default: PI/2 (point up) */
  startAngle?: number;
}

/**
 * Star - A star shape with alternating outer and inner vertices
 *
 * Creates a star with a specified number of points, alternating between
 * outer and inner radii.
 *
 * @example
 * ```typescript
 * // Create a 5-pointed star
 * const star = new Star({ numPoints: 5 });
 *
 * // Create a 6-pointed star (Star of David style)
 * const sixStar = new Star({ numPoints: 6, innerRadius: 0.5 });
 * ```
 */
export class Star extends VMobject {
  private _numPoints: number;
  private _outerRadius: number;
  private _innerRadius: number;
  private _centerPoint: Vector3Tuple;
  private _startAngle: number;

  constructor(options: StarOptions = {}) {
    super();

    const {
      numPoints = 5,
      outerRadius = 1,
      innerRadius = 0.4,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      startAngle = Math.PI / 2,
    } = options;

    if (numPoints < 2) {
      throw new Error('Star requires at least 2 points');
    }

    this._numPoints = numPoints;
    this._outerRadius = outerRadius;
    this._innerRadius = innerRadius;
    this._centerPoint = [...center];
    this._startAngle = startAngle;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the star vertices and points
   */
  private _generatePoints(): void {
    const vertices: Vector3Tuple[] = [];
    const [cx, cy, cz] = this._centerPoint;
    const angleStep = Math.PI / this._numPoints; // Half of full step for alternating

    for (let i = 0; i < this._numPoints * 2; i++) {
      const angle = this._startAngle + i * angleStep;
      const radius = i % 2 === 0 ? this._outerRadius : this._innerRadius;
      vertices.push([
        cx + radius * Math.cos(angle),
        cy + radius * Math.sin(angle),
        cz,
      ]);
    }

    // Convert vertices to points
    const points: number[][] = [];

    const addLineSegment = (p0: Vector3Tuple, p1: Vector3Tuple, isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    for (let i = 0; i < vertices.length; i++) {
      addLineSegment(vertices[i], vertices[(i + 1) % vertices.length], i === 0);
    }

    this.setPoints3D(points);
  }

  /**
   * Get the number of points
   */
  getNumPoints(): number {
    return this._numPoints;
  }

  /**
   * Get the outer radius
   */
  getOuterRadius(): number {
    return this._outerRadius;
  }

  /**
   * Set the outer radius
   */
  setOuterRadius(value: number): this {
    this._outerRadius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the inner radius
   */
  getInnerRadius(): number {
    return this._innerRadius;
  }

  /**
   * Set the inner radius
   */
  setInnerRadius(value: number): this {
    this._innerRadius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the star
   */
  getStarCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Set the center of the star
   */
  setStarCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this Star
   */
  protected override _createCopy(): Star {
    return new Star({
      numPoints: this._numPoints,
      outerRadius: this._outerRadius,
      innerRadius: this._innerRadius,
      center: this._centerPoint,
      startAngle: this._startAngle,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Compute the greatest common divisor of two positive integers.
 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Options for creating a RegularPolygram
 */
export interface RegularPolygramOptions {
  /** Number of vertices on the circumscribed circle. Default: 5 */
  numVertices?: number;
  /**
   * Density (vertex step count), i.e. how many vertices to skip when
   * drawing each edge. Default: 2
   *
   * The Schlafli symbol {numVertices/density} describes the polygram.
   * For example {5/2} is a pentagram, {7/3} is a heptagram.
   *
   * When gcd(numVertices, density) > 1 the polygram decomposes into
   * multiple congruent regular polygon components. For instance {6/2}
   * simplifies to 2{3} -- two overlapping equilateral triangles.
   */
  density?: number;
  /** Radius from center to vertices. Default: 1 */
  radius?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Start angle in radians. Default: PI/2 (first vertex up) */
  startAngle?: number;
}

/**
 * RegularPolygram - A generalized star polygon {n/k}
 *
 * Creates a regular star polygon by placing n vertices equally spaced on a
 * circle and connecting every k-th vertex, where k is the density.
 *
 * When gcd(n, k) = 1 the result is a single continuous self-intersecting
 * path that winds k times around the center before closing (e.g. the
 * pentagram {5/2}).
 *
 * When gcd(n, k) > 1 the polygram decomposes into gcd(n,k) congruent
 * regular polygon components, each rendered as a separate child VMobject.
 * For example, a hexagram {6/2} becomes 2 equilateral triangles (2{3}).
 *
 * This matches the behavior of Python manim's RegularPolygram.
 *
 * @example
 * ```typescript
 * // Pentagram {5/2} -- single continuous star
 * const pentagram = new RegularPolygram({ numVertices: 5, density: 2 });
 *
 * // Hexagram {6/2} = 2{3} -- two overlapping triangles
 * const hexagram = new RegularPolygram({ numVertices: 6, density: 2 });
 *
 * // Heptagram {7/3}
 * const heptagram = new RegularPolygram({ numVertices: 7, density: 3 });
 *
 * // Octagram {8/3}
 * const octagram = new RegularPolygram({ numVertices: 8, density: 3 });
 * ```
 */
export class RegularPolygram extends VMobject {
  private _numVertices: number;
  private _density: number;
  private _radius: number;
  private _centerPoint: Vector3Tuple;
  private _startAngle: number;
  private _numComponents: number;

  constructor(options: RegularPolygramOptions = {}) {
    super();

    const {
      numVertices = 5,
      density = 2,
      radius = 1,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      startAngle = Math.PI / 2,
    } = options;

    if (numVertices < 3) {
      throw new Error('RegularPolygram requires at least 3 vertices');
    }
    if (density < 1) {
      throw new Error('Density must be at least 1');
    }
    // For even n, density = n/2 produces degenerate diameters, not a polygon.
    // For odd n, density can go up to floor(n/2).
    const maxDensity = numVertices % 2 === 0
      ? numVertices / 2 - 1
      : Math.floor(numVertices / 2);
    if (density > maxDensity) {
      throw new Error(
        `Density must be between 1 and ${maxDensity} for ${numVertices} vertices`
      );
    }

    this._numVertices = numVertices;
    this._density = density;
    this._radius = radius;
    this._centerPoint = [...center];
    this._startAngle = startAngle;
    this._numComponents = gcd(numVertices, density);

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the polygram geometry.
   *
   * If gcd(n,k) = 1 the polygram is a single continuous path stored
   * directly in this VMobject's points.
   *
   * If gcd(n,k) > 1 the polygram is composed of gcd(n,k) congruent
   * regular polygon components. Each component is a child VMobject so
   * that the rendering pipeline draws them as separate closed paths.
   */
  private _generatePoints(): void {
    // Remove any previous component children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    const [cx, cy, cz] = this._centerPoint;
    const n = this._numVertices;
    const k = this._density;
    const angleStep = (2 * Math.PI) / n;

    // Generate all n vertices on the circumscribed circle
    const allVertices: Vector3Tuple[] = [];
    for (let i = 0; i < n; i++) {
      const angle = this._startAngle + i * angleStep;
      allVertices.push([
        cx + this._radius * Math.cos(angle),
        cy + this._radius * Math.sin(angle),
        cz,
      ]);
    }

    const numGons = this._numComponents;

    // Helper: build cubic-Bezier line segments for a vertex sequence
    const buildPathPoints = (vertexIndices: number[]): number[][] => {
      const pts: number[][] = [];
      for (let i = 0; i < vertexIndices.length; i++) {
        const p0 = allVertices[vertexIndices[i]];
        const p1 = allVertices[vertexIndices[(i + 1) % vertexIndices.length]];
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const dz = p1[2] - p0[2];

        if (i === 0) {
          pts.push([...p0]);
        }
        pts.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
        pts.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
        pts.push([...p1]);
      }
      return pts;
    };

    if (numGons === 1) {
      // Single continuous path -- trace all n vertices stepping by k
      const vertexOrder: number[] = [];
      let idx = 0;
      for (let step = 0; step < n; step++) {
        vertexOrder.push(idx);
        idx = (idx + k) % n;
      }

      const points = buildPathPoints(vertexOrder);
      this.setPoints3D(points);
    } else {
      // Multiple components: gcd(n,k) separate regular polygons.
      // Each component has n/gcd vertices, stepping by k/gcd,
      // starting at vertex i for i in [0, gcd).
      //
      // The simplified step within each component is always 1 in terms of
      // the component's own vertex ordering, but we express it as indices
      // into the original n vertices for simplicity.
      this.clearPoints();

      for (let g = 0; g < numGons; g++) {
        const vertexOrder: number[] = [];
        let idx = g;
        const vertsPerComponent = n / numGons;
        for (let step = 0; step < vertsPerComponent; step++) {
          vertexOrder.push(idx);
          idx = (idx + k) % n;
        }

        const componentPoints = buildPathPoints(vertexOrder);

        // Create a child VMobject for this component
        const component = new VMobject();
        component.color = this.color;
        component.fillOpacity = this.fillOpacity;
        component.strokeWidth = this.strokeWidth;
        component.setPoints3D(componentPoints);

        this.add(component);
      }
    }
  }

  /**
   * Get the number of vertices (n in the Schlafli symbol {n/k})
   */
  getNumVertices(): number {
    return this._numVertices;
  }

  /**
   * Get the density (k in the Schlafli symbol {n/k})
   */
  getDensity(): number {
    return this._density;
  }

  /**
   * Get the number of disconnected polygon components.
   * Equal to gcd(numVertices, density).
   * When this is 1 the polygram is a single continuous path.
   */
  getNumComponents(): number {
    return this._numComponents;
  }

  /**
   * Get the Schlafli symbol as a string, e.g. "{5/2}"
   */
  getSchlafliSymbol(): string {
    if (this._density === 1) {
      return `{${this._numVertices}}`;
    }
    return `{${this._numVertices}/${this._density}}`;
  }

  /**
   * Get the radius
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius
   */
  setRadius(value: number): this {
    this._radius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the polygram
   */
  getPolygramCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Set the center of the polygram
   */
  setPolygramCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this RegularPolygram
   */
  protected override _createCopy(): RegularPolygram {
    return new RegularPolygram({
      numVertices: this._numVertices,
      density: this._density,
      radius: this._radius,
      center: this._centerPoint,
      startAngle: this._startAngle,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a Cutout
 */
export interface CutoutOptions {
  /** The outer shape (must be a VMobject). Required. */
  outerShape: VMobject;
  /** The inner shape (the hole, must be a VMobject). Required. */
  innerShape: VMobject;
  /** Stroke color as CSS color string. Default: inherits from outer shape */
  color?: string;
  /** Fill opacity from 0 to 1. Default: inherits from outer shape */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: inherits from outer shape */
  strokeWidth?: number;
}

/**
 * Cutout - A shape with a hole cut out
 *
 * Creates a compound path with an outer boundary and an inner hole.
 * Uses the even-odd fill rule to create the cutout effect.
 *
 * @example
 * ```typescript
 * import { Circle, Square, Cutout } from 'manimweb';
 *
 * // Create a circle with a square hole
 * const outer = new Circle({ radius: 2, fillOpacity: 0.5 });
 * const inner = new Square({ sideLength: 1.5 });
 * const cutout = new Cutout({ outerShape: outer, innerShape: inner });
 * ```
 */
export class Cutout extends VMobject {
  private _outerShape: VMobject;
  private _innerShape: VMobject;

  constructor(options: CutoutOptions) {
    super();

    const {
      outerShape,
      innerShape,
      color = outerShape.color,
      fillOpacity = outerShape.fillOpacity,
      strokeWidth = outerShape.strokeWidth,
    } = options;

    this._outerShape = outerShape;
    this._innerShape = innerShape;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the compound path by combining outer and inner shapes
   */
  private _generatePoints(): void {
    // Get points from both shapes
    const outerPoints = this._outerShape.getPoints();
    const innerPoints = this._innerShape.getPoints();

    // Reverse the inner path to create the cutout effect with even-odd fill rule
    const reversedInnerPoints = [...innerPoints].reverse();

    // Combine: outer path first, then reversed inner path
    // The SVG renderer will use even-odd fill rule to create the hole
    const combinedPoints = [...outerPoints, ...reversedInnerPoints];

    this.setPoints(combinedPoints);

    // Store subpath information for proper rendering
    this._subpaths = [outerPoints.length, reversedInnerPoints.length];
  }

  // Store subpath lengths for compound path rendering
  private _subpaths: number[] = [];

  /**
   * Get subpath information
   */
  getSubpaths(): number[] {
    return [...this._subpaths];
  }

  /**
   * Get the outer shape
   */
  getOuterShape(): VMobject {
    return this._outerShape;
  }

  /**
   * Get the inner shape
   */
  getInnerShape(): VMobject {
    return this._innerShape;
  }

  /**
   * Create a copy of this Cutout
   */
  protected override _createCopy(): Cutout {
    return new Cutout({
      outerShape: this._outerShape.copy() as VMobject,
      innerShape: this._innerShape.copy() as VMobject,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a ConvexHull
 */
export interface ConvexHullOptions {
  /** Array of points to compute convex hull from. Required. */
  points: Vector3Tuple[];
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
}

/**
 * ConvexHull - Convex hull of a set of points
 *
 * Computes and draws the convex hull of a given set of points using
 * the Graham scan algorithm.
 *
 * @example
 * ```typescript
 * // Create a convex hull from random points
 * const points: Vector3Tuple[] = [
 *   [0, 0, 0], [1, 2, 0], [2, 0, 0], [1.5, 1, 0], [0.5, 0.5, 0]
 * ];
 * const hull = new ConvexHull({ points });
 *
 * // The hull will only include the outer boundary points
 * ```
 */
export class ConvexHull extends VMobject {
  private _inputPoints: Vector3Tuple[];
  private _hullVertices: Vector3Tuple[];

  constructor(options: ConvexHullOptions) {
    super();

    const {
      points,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    if (!points || points.length < 3) {
      throw new Error('ConvexHull requires at least 3 points');
    }

    this._inputPoints = points.map((p) => [...p] as Vector3Tuple);
    this._hullVertices = [];

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._computeHull();
    this._generatePoints();
  }

  /**
   * Compute the convex hull using Graham scan algorithm
   */
  private _computeHull(): void {
    const points = this._inputPoints;

    // Find the bottom-most point (or left-most in case of tie)
    let lowestIdx = 0;
    for (let i = 1; i < points.length; i++) {
      if (
        points[i][1] < points[lowestIdx][1] ||
        (points[i][1] === points[lowestIdx][1] && points[i][0] < points[lowestIdx][0])
      ) {
        lowestIdx = i;
      }
    }

    const pivot = points[lowestIdx];

    // Sort points by polar angle with respect to pivot
    const sorted = points
      .filter((_, i) => i !== lowestIdx)
      .map((p) => ({
        point: p,
        angle: Math.atan2(p[1] - pivot[1], p[0] - pivot[0]),
        dist: Math.hypot(p[0] - pivot[0], p[1] - pivot[1]),
      }))
      .sort((a, b) => {
        if (Math.abs(a.angle - b.angle) < 1e-10) {
          return a.dist - b.dist; // Same angle: keep closer point first
        }
        return a.angle - b.angle;
      });

    // Remove points with same angle (keep farthest)
    const filtered: { point: Vector3Tuple; angle: number; dist: number }[] = [];
    for (const item of sorted) {
      if (filtered.length === 0) {
        filtered.push(item);
      } else {
        const last = filtered[filtered.length - 1];
        if (Math.abs(item.angle - last.angle) < 1e-10) {
          // Same angle, keep the farther one
          if (item.dist > last.dist) {
            filtered[filtered.length - 1] = item;
          }
        } else {
          filtered.push(item);
        }
      }
    }

    // Graham scan
    const hull: Vector3Tuple[] = [pivot];

    // Cross product to determine turn direction
    const cross = (o: Vector3Tuple, a: Vector3Tuple, b: Vector3Tuple): number => {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    };

    for (const item of filtered) {
      // Remove points that make clockwise turn
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], item.point) <= 0) {
        hull.pop();
      }
      hull.push(item.point);
    }

    this._hullVertices = hull;
  }

  /**
   * Generate the VMobject points from hull vertices
   */
  private _generatePoints(): void {
    if (this._hullVertices.length < 3) {
      return;
    }

    const points: number[][] = [];

    const addLineSegment = (p0: Vector3Tuple, p1: Vector3Tuple, isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    const vertices = this._hullVertices;
    for (let i = 0; i < vertices.length; i++) {
      addLineSegment(vertices[i], vertices[(i + 1) % vertices.length], i === 0);
    }

    this.setPoints3D(points);
  }

  /**
   * Get the hull vertices
   */
  getHullVertices(): Vector3Tuple[] {
    return this._hullVertices.map((v) => [...v] as Vector3Tuple);
  }

  /**
   * Get the original input points
   */
  getInputPoints(): Vector3Tuple[] {
    return this._inputPoints.map((p) => [...p] as Vector3Tuple);
  }

  /**
   * Get the number of vertices in the hull
   */
  getHullVertexCount(): number {
    return this._hullVertices.length;
  }

  /**
   * Get the area of the convex hull using the Shoelace formula
   */
  getArea(): number {
    if (this._hullVertices.length < 3) {
      return 0;
    }

    let area = 0;
    const n = this._hullVertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this._hullVertices[i][0] * this._hullVertices[j][1];
      area -= this._hullVertices[j][0] * this._hullVertices[i][1];
    }

    return Math.abs(area) / 2;
  }

  /**
   * Get the perimeter of the convex hull
   */
  getPerimeter(): number {
    if (this._hullVertices.length < 2) {
      return 0;
    }

    let perimeter = 0;
    const n = this._hullVertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = this._hullVertices[j][0] - this._hullVertices[i][0];
      const dy = this._hullVertices[j][1] - this._hullVertices[i][1];
      const dz = this._hullVertices[j][2] - this._hullVertices[i][2];
      perimeter += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    return perimeter;
  }

  /**
   * Check if a point is inside the convex hull
   */
  containsPoint(point: Vector3Tuple): boolean {
    if (this._hullVertices.length < 3) {
      return false;
    }

    // Use cross product to check if point is on the same side of all edges
    const n = this._hullVertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const edge = [
        this._hullVertices[j][0] - this._hullVertices[i][0],
        this._hullVertices[j][1] - this._hullVertices[i][1],
      ];
      const toPoint = [
        point[0] - this._hullVertices[i][0],
        point[1] - this._hullVertices[i][1],
      ];
      const cross = edge[0] * toPoint[1] - edge[1] * toPoint[0];

      // If the point is on the right side of any edge, it's outside
      if (cross < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a copy of this ConvexHull
   */
  protected override _createCopy(): ConvexHull {
    return new ConvexHull({
      points: this._inputPoints,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

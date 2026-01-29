/**
 * Boolean Operations for VMobject shapes
 *
 * Provides boolean operations (union, intersection, difference, exclusion)
 * for combining and manipulating 2D shapes.
 *
 * Uses the Sutherland-Hodgman algorithm for polygon clipping on convex shapes.
 */

import { VMobject } from '../../core/VMobject';

/**
 * 2D vertex for polygon clipping operations
 */
interface Vertex2D {
  x: number;
  y: number;
}

/**
 * Options for boolean operations
 */
export interface BooleanOperationOptions {
  /** Stroke color. Default: inherited from first shape */
  color?: string;
  /** Fill opacity. Default: inherited from first shape */
  fillOpacity?: number;
  /** Stroke width. Default: inherited from first shape */
  strokeWidth?: number;
  /** Number of samples per Bezier segment for polygon approximation. Default: 8 */
  samplesPerSegment?: number;
}

/**
 * Base class for boolean operation results
 */
export class BooleanResult extends VMobject {
  protected _resultVertices: Vertex2D[][] = [];

  constructor() {
    super();
  }

  /**
   * Get the result polygon vertices
   */
  getResultVertices(): Vertex2D[][] {
    return this._resultVertices.map(poly => poly.map(v => ({ ...v })));
  }
}

/**
 * Union - Boolean union of two shapes (combine)
 *
 * Creates a new shape that encompasses both input shapes.
 * For overlapping convex shapes, returns the convex hull of both.
 *
 * @example
 * ```typescript
 * const circle1 = new Circle({ radius: 1 });
 * const circle2 = new Circle({ radius: 1 }).shift([1, 0, 0]);
 * const combined = new Union(circle1, circle2);
 * ```
 */
export class Union extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = shape1.strokeWidth,
      samplesPerSegment = 8,
    } = options;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    // For union of two polygons, we compute the convex hull of all vertices
    // This is a simplification that works for convex shapes
    const allVertices = [...poly1, ...poly2];
    const hullVertices = computeConvexHull(allVertices);

    this._resultVertices = [hullVertices];
    this._setPointsFromVertices(hullVertices);
  }

  /**
   * Set VMobject points from vertices
   */
  private _setPointsFromVertices(vertices: Vertex2D[]): void {
    if (vertices.length < 3) return;

    const points: number[][] = [];

    // Convert vertices to cubic Bezier line segments
    for (let i = 0; i < vertices.length; i++) {
      const p0 = vertices[i];
      const p1 = vertices[(i + 1) % vertices.length];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;

      if (i === 0) {
        points.push([p0.x, p0.y, 0]);
      }
      // Control points at 1/3 and 2/3 for straight line
      points.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
      points.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
      points.push([p1.x, p1.y, 0]);
    }

    this.setPoints3D(points);
  }
}

/**
 * Intersection - Boolean intersection of two shapes (overlap area)
 *
 * Creates a new shape representing the overlapping region of both inputs.
 * Uses Sutherland-Hodgman algorithm for convex polygon clipping.
 *
 * @example
 * ```typescript
 * const square1 = new Square({ sideLength: 2 });
 * const square2 = new Square({ sideLength: 2 }).shift([1, 1, 0]);
 * const overlap = new Intersection(square1, square2);
 * ```
 */
export class Intersection extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = shape1.strokeWidth,
      samplesPerSegment = 8,
    } = options;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    // Use Sutherland-Hodgman for intersection
    const clippedVertices = sutherlandHodgmanClip(poly1, poly2);

    if (clippedVertices.length >= 3) {
      this._resultVertices = [clippedVertices];
      this._setPointsFromVertices(clippedVertices);
    }
  }

  /**
   * Set VMobject points from vertices
   */
  private _setPointsFromVertices(vertices: Vertex2D[]): void {
    if (vertices.length < 3) return;

    const points: number[][] = [];

    for (let i = 0; i < vertices.length; i++) {
      const p0 = vertices[i];
      const p1 = vertices[(i + 1) % vertices.length];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;

      if (i === 0) {
        points.push([p0.x, p0.y, 0]);
      }
      points.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
      points.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
      points.push([p1.x, p1.y, 0]);
    }

    this.setPoints3D(points);
  }
}

/**
 * Difference - Boolean difference of two shapes (subtract second from first)
 *
 * Creates a new shape representing the first shape with the second removed.
 * For convex shapes, this approximates by computing the visible boundary.
 *
 * @example
 * ```typescript
 * const bigCircle = new Circle({ radius: 2 });
 * const smallCircle = new Circle({ radius: 1 });
 * const donut = new Difference(bigCircle, smallCircle);
 * ```
 */
export class Difference extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = shape1.strokeWidth,
      samplesPerSegment = 8,
    } = options;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    // Compute the difference: poly1 - poly2
    // For convex polygons, we compute points of poly1 that are outside poly2
    // plus intersection points, forming the boundary
    const differenceVertices = computePolygonDifference(poly1, poly2);

    if (differenceVertices.length >= 3) {
      this._resultVertices = [differenceVertices];
      this._setPointsFromVertices(differenceVertices);
    } else {
      // If difference is empty or invalid, use original poly1
      this._resultVertices = [poly1];
      this._setPointsFromVertices(poly1);
    }
  }

  /**
   * Set VMobject points from vertices
   */
  private _setPointsFromVertices(vertices: Vertex2D[]): void {
    if (vertices.length < 3) return;

    const points: number[][] = [];

    for (let i = 0; i < vertices.length; i++) {
      const p0 = vertices[i];
      const p1 = vertices[(i + 1) % vertices.length];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;

      if (i === 0) {
        points.push([p0.x, p0.y, 0]);
      }
      points.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
      points.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
      points.push([p1.x, p1.y, 0]);
    }

    this.setPoints3D(points);
  }
}

/**
 * Exclusion - Boolean XOR of two shapes (non-overlapping areas)
 *
 * Creates shapes representing the areas that are in one shape but not both.
 * This is equivalent to (A union B) - (A intersection B).
 *
 * @example
 * ```typescript
 * const circle1 = new Circle({ radius: 1 });
 * const circle2 = new Circle({ radius: 1 }).shift([0.5, 0, 0]);
 * const xorShape = new Exclusion(circle1, circle2);
 * ```
 */
export class Exclusion extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = shape1.strokeWidth,
      samplesPerSegment = 8,
    } = options;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    // XOR = (A - B) union (B - A)
    // For visualization, we use the outer boundary of the combined shape
    // minus the intersection
    const exclusionVertices = computePolygonExclusion(poly1, poly2);

    if (exclusionVertices.length >= 3) {
      this._resultVertices = [exclusionVertices];
      this._setPointsFromVertices(exclusionVertices);
    } else {
      // Fallback to union if XOR computation fails
      const allVertices = [...poly1, ...poly2];
      const hullVertices = computeConvexHull(allVertices);
      this._resultVertices = [hullVertices];
      this._setPointsFromVertices(hullVertices);
    }
  }

  /**
   * Set VMobject points from vertices
   */
  private _setPointsFromVertices(vertices: Vertex2D[]): void {
    if (vertices.length < 3) return;

    const points: number[][] = [];

    for (let i = 0; i < vertices.length; i++) {
      const p0 = vertices[i];
      const p1 = vertices[(i + 1) % vertices.length];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;

      if (i === 0) {
        points.push([p0.x, p0.y, 0]);
      }
      points.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
      points.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
      points.push([p1.x, p1.y, 0]);
    }

    this.setPoints3D(points);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a boolean union of two shapes
 *
 * @param shape1 - First shape
 * @param shape2 - Second shape
 * @param options - Optional styling options
 * @returns New VMobject representing the union
 */
export function union(
  shape1: VMobject,
  shape2: VMobject,
  options?: BooleanOperationOptions
): Union {
  return new Union(shape1, shape2, options);
}

/**
 * Create a boolean intersection of two shapes
 *
 * @param shape1 - First shape
 * @param shape2 - Second shape
 * @param options - Optional styling options
 * @returns New VMobject representing the intersection
 */
export function intersection(
  shape1: VMobject,
  shape2: VMobject,
  options?: BooleanOperationOptions
): Intersection {
  return new Intersection(shape1, shape2, options);
}

/**
 * Create a boolean difference of two shapes (subtract second from first)
 *
 * @param shape1 - First shape (base)
 * @param shape2 - Second shape (to subtract)
 * @param options - Optional styling options
 * @returns New VMobject representing the difference
 */
export function difference(
  shape1: VMobject,
  shape2: VMobject,
  options?: BooleanOperationOptions
): Difference {
  return new Difference(shape1, shape2, options);
}

/**
 * Create a boolean exclusion (XOR) of two shapes
 *
 * @param shape1 - First shape
 * @param shape2 - Second shape
 * @param options - Optional styling options
 * @returns New VMobject representing the exclusion
 */
export function exclusion(
  shape1: VMobject,
  shape2: VMobject,
  options?: BooleanOperationOptions
): Exclusion {
  return new Exclusion(shape1, shape2, options);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sample a VMobject's path to get polygon vertices
 */
function sampleVMobjectToPolygon(vmobject: VMobject, samplesPerSegment: number): Vertex2D[] {
  const points3D = vmobject.getPoints();
  if (points3D.length === 0) return [];

  const vertices: Vertex2D[] = [];

  // Sample Bezier curves
  for (let i = 0; i + 3 < points3D.length; i += 3) {
    const p0 = points3D[i];
    const p1 = points3D[i + 1];
    const p2 = points3D[i + 2];
    const p3 = points3D[i + 3];

    for (let t = 0; t < samplesPerSegment; t++) {
      const u = t / samplesPerSegment;
      const pt = evalCubicBezier(p0, p1, p2, p3, u);
      vertices.push({ x: pt[0], y: pt[1] });
    }
  }

  // Add last point
  if (points3D.length > 0) {
    const lastPt = points3D[points3D.length - 1];
    vertices.push({ x: lastPt[0], y: lastPt[1] });
  }

  // Remove duplicate consecutive vertices
  return removeDuplicateVertices(vertices);
}

/**
 * Evaluate cubic Bezier at parameter t
 */
function evalCubicBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return [
    mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
    mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
    mt3 * p0[2] + 3 * mt2 * t * p1[2] + 3 * mt * t2 * p2[2] + t3 * p3[2],
  ];
}

/**
 * Remove duplicate consecutive vertices
 */
function removeDuplicateVertices(vertices: Vertex2D[], epsilon: number = 1e-6): Vertex2D[] {
  if (vertices.length === 0) return [];

  const result: Vertex2D[] = [vertices[0]];

  for (let i = 1; i < vertices.length; i++) {
    const prev = result[result.length - 1];
    const curr = vertices[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    if (dx * dx + dy * dy > epsilon * epsilon) {
      result.push(curr);
    }
  }

  // Also check if first and last are duplicates
  if (result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;

    if (dx * dx + dy * dy < epsilon * epsilon) {
      result.pop();
    }
  }

  return result;
}

/**
 * Sutherland-Hodgman polygon clipping algorithm
 * Clips subject polygon against clip polygon (both assumed convex)
 */
function sutherlandHodgmanClip(subject: Vertex2D[], clip: Vertex2D[]): Vertex2D[] {
  if (subject.length < 3 || clip.length < 3) return [];

  let output = [...subject];

  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) return [];

    const input = output;
    output = [];

    const edgeStart = clip[i];
    const edgeEnd = clip[(i + 1) % clip.length];

    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const next = input[(j + 1) % input.length];

      const currentInside = isLeftOfEdge(current, edgeStart, edgeEnd);
      const nextInside = isLeftOfEdge(next, edgeStart, edgeEnd);

      if (currentInside) {
        if (nextInside) {
          // Both inside - add next
          output.push(next);
        } else {
          // Leaving - add intersection
          const intersection = lineIntersection(current, next, edgeStart, edgeEnd);
          if (intersection) output.push(intersection);
        }
      } else if (nextInside) {
        // Entering - add intersection and next
        const intersection = lineIntersection(current, next, edgeStart, edgeEnd);
        if (intersection) output.push(intersection);
        output.push(next);
      }
    }
  }

  return output;
}

/**
 * Check if point is on the left side of edge (inside for CCW polygon)
 */
function isLeftOfEdge(point: Vertex2D, edgeStart: Vertex2D, edgeEnd: Vertex2D): boolean {
  return (edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y) -
         (edgeEnd.y - edgeStart.y) * (point.x - edgeStart.x) >= 0;
}

/**
 * Compute intersection of two line segments
 */
function lineIntersection(
  p1: Vertex2D,
  p2: Vertex2D,
  p3: Vertex2D,
  p4: Vertex2D
): Vertex2D | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;

  return {
    x: p1.x + t * d1x,
    y: p1.y + t * d1y,
  };
}

/**
 * Compute convex hull using Andrew's monotone chain algorithm
 */
function computeConvexHull(points: Vertex2D[]): Vertex2D[] {
  if (points.length < 3) return [...points];

  // Sort points lexicographically
  const sorted = [...points].sort((a, b) => {
    if (Math.abs(a.x - b.x) < 1e-10) return a.y - b.y;
    return a.x - b.x;
  });

  // Build lower hull
  const lower: Vertex2D[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build upper hull
  const upper: Vertex2D[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half because it's repeated
  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

/**
 * Cross product of vectors OA and OB
 */
function cross(o: Vertex2D, a: Vertex2D, b: Vertex2D): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Check if a point is inside a convex polygon
 */
function isPointInConvexPolygon(point: Vertex2D, polygon: Vertex2D[]): boolean {
  if (polygon.length < 3) return false;

  for (let i = 0; i < polygon.length; i++) {
    const edgeStart = polygon[i];
    const edgeEnd = polygon[(i + 1) % polygon.length];

    if (!isLeftOfEdge(point, edgeStart, edgeEnd)) {
      return false;
    }
  }

  return true;
}

/**
 * Compute polygon difference (poly1 - poly2)
 * Returns vertices of poly1 that are outside poly2, plus intersection boundary
 */
function computePolygonDifference(poly1: Vertex2D[], poly2: Vertex2D[]): Vertex2D[] {
  if (poly1.length < 3 || poly2.length < 3) return poly1;

  // Get intersection to understand the overlap
  const intersection = sutherlandHodgmanClip(poly1, poly2);

  // If no intersection, return poly1 as-is
  if (intersection.length < 3) {
    return poly1;
  }

  // Find vertices of poly1 that are outside poly2
  const outsideVertices: Vertex2D[] = [];
  for (const v of poly1) {
    if (!isPointInConvexPolygon(v, poly2)) {
      outsideVertices.push(v);
    }
  }

  // If all vertices are inside poly2, the result is empty
  if (outsideVertices.length === 0) {
    return [];
  }

  // Compute intersection points between poly1 edges and poly2 boundary
  const intersectionPoints: Vertex2D[] = [];
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];

    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j];
      const p4 = poly2[(j + 1) % poly2.length];

      const intersection = segmentIntersection(p1, p2, p3, p4);
      if (intersection) {
        intersectionPoints.push(intersection);
      }
    }
  }

  // Combine outside vertices and intersection points
  const combined = [...outsideVertices, ...intersectionPoints];

  // Return convex hull of combined points as approximation
  return computeConvexHull(combined);
}

/**
 * Compute intersection of two line segments (not infinite lines)
 */
function segmentIntersection(
  p1: Vertex2D,
  p2: Vertex2D,
  p3: Vertex2D,
  p4: Vertex2D
): Vertex2D | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;

  // Check if intersection is within both segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * d1x,
      y: p1.y + t * d1y,
    };
  }

  return null;
}

/**
 * Compute polygon exclusion (XOR = symmetric difference)
 */
function computePolygonExclusion(poly1: Vertex2D[], poly2: Vertex2D[]): Vertex2D[] {
  if (poly1.length < 3 || poly2.length < 3) {
    return poly1.length >= 3 ? poly1 : poly2;
  }

  // Get intersection
  const intersection = sutherlandHodgmanClip(poly1, poly2);

  // If no intersection, return union (convex hull)
  if (intersection.length < 3) {
    return computeConvexHull([...poly1, ...poly2]);
  }

  // Compute vertices outside the intersection from both polygons
  const outsideVertices: Vertex2D[] = [];

  // Vertices of poly1 outside poly2
  for (const v of poly1) {
    if (!isPointInConvexPolygon(v, poly2)) {
      outsideVertices.push(v);
    }
  }

  // Vertices of poly2 outside poly1
  for (const v of poly2) {
    if (!isPointInConvexPolygon(v, poly1)) {
      outsideVertices.push(v);
    }
  }

  // Add intersection boundary points
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];

    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j];
      const p4 = poly2[(j + 1) % poly2.length];

      const intersectionPoint = segmentIntersection(p1, p2, p3, p4);
      if (intersectionPoint) {
        outsideVertices.push(intersectionPoint);
      }
    }
  }

  // Return convex hull of all outside points as approximation
  if (outsideVertices.length >= 3) {
    return computeConvexHull(outsideVertices);
  }

  // Fallback to union
  return computeConvexHull([...poly1, ...poly2]);
}

/**
 * Boolean Operations for VMobject shapes
 *
 * Provides boolean operations (union, intersection, difference, exclusion)
 * for combining and manipulating 2D shapes.
 *
 * Uses the polygon-clipping library (Martinez-Rueda-Feito algorithm) for
 * robust polygon boolean operations. This handles:
 * - Convex and concave polygons
 * - Self-intersecting paths
 * - Coincident/collinear edges
 * - Holes and multi-polygon results
 * - Degenerate inputs (zero-area, collinear points)
 */

import { VMobject } from '../../core/VMobject';
// @ts-ignore - polygon-clipping .d.ts declares named exports but ESM bundle uses default export
import polygonClipping from 'polygon-clipping';

// Re-export types from polygon-clipping for internal use
type Pair = [number, number];
type Ring = Pair[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

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
  /** Fill color (separate from stroke). If set, overrides color for fill. */
  fillColor?: string;
  /** Fill opacity. Default: inherited from first shape */
  fillOpacity?: number;
  /** Stroke width. Default: 3 (thin outline) */
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

  /**
   * Re-center the VMobject: compute the centroid of all points,
   * subtract it from every point (making them local-space), and
   * set `this.position` to the centroid.  This ensures getCenter(),
   * nextTo(), and other layout helpers work correctly.
   */
  protected _centerOnPoints(): void {
    const pts = this.getPoints();
    if (pts.length === 0) return;

    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length;
    cy /= pts.length;

    // Shift all points so they are centered at local origin
    const shifted = pts.map(p => [p[0] - cx, p[1] - cy, p[2]]);
    this.setPoints3D(shifted);

    // Also shift children's points (stroke-only children for multi-polygon results)
    for (const child of this.children) {
      if (child instanceof VMobject) {
        const childPts = child.getPoints();
        const childShifted = childPts.map(p => [p[0] - cx, p[1] - cy, p[2]]);
        child.setPoints3D(childShifted);
      }
    }

    // Move the mobject's world position to the centroid
    this.position.set(cx, cy, 0);
  }

  /**
   * Set VMobject points from a single polygon's vertices.
   * Converts vertices to cubic Bezier line segments with 1/3 and 2/3 control points.
   */
  protected _setPointsFromVertices(vertices: Vertex2D[]): void {
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
      // Control points at 1/3 and 2/3 for straight line
      points.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
      points.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
      points.push([p1.x, p1.y, 0]);
    }

    this.setPoints3D(points);
  }

  /**
   * Set VMobject points from multiple polygons.
   *
   * The parent keeps bridge-connected points for fill rendering and layout
   * (the bridge is invisible in fill). Stroke-only child VMobjects are
   * created for each polygon so that no bridge line appears in the stroke.
   */
  protected _setPointsFromMultiplePolygons(polygons: Vertex2D[][]): void {
    const validPolygons = polygons.filter(p => p.length >= 3);
    if (validPolygons.length === 0) return;

    if (validPolygons.length === 1) {
      this._setPointsFromVertices(validPolygons[0]);
      return;
    }

    // --- Parent: bridge-connected points for fill + layout ---
    const points: number[][] = [];

    for (let polyIdx = 0; polyIdx < validPolygons.length; polyIdx++) {
      const vertices = validPolygons[polyIdx];

      if (polyIdx > 0) {
        const prevPoly = validPolygons[polyIdx - 1];
        const lastPt = prevPoly[0];
        const firstPt = vertices[0];

        const bdx = firstPt.x - lastPt.x;
        const bdy = firstPt.y - lastPt.y;

        points.push([lastPt.x + bdx / 3, lastPt.y + bdy / 3, 0]);
        points.push([lastPt.x + 2 * bdx / 3, lastPt.y + 2 * bdy / 3, 0]);
        points.push([firstPt.x, firstPt.y, 0]);
      }

      for (let i = 0; i < vertices.length; i++) {
        const p0 = vertices[i];
        const p1 = vertices[(i + 1) % vertices.length];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;

        if (i === 0 && polyIdx === 0) {
          points.push([p0.x, p0.y, 0]);
        }
        points.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
        points.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
        points.push([p1.x, p1.y, 0]);
      }
    }

    this.setPoints3D(points);

    // --- Children: one per polygon for stroke rendering (no bridge) ---
    const parentStrokeWidth = this.strokeWidth;
    this.strokeWidth = 0; // Parent renders fill only

    for (const poly of validPolygons) {
      const child = new VMobject();
      child.color = this.color;
      child.fillOpacity = 0;                // No fill on children
      child.strokeWidth = parentStrokeWidth; // Stroke on children
      child._opacity = this._opacity;

      const childPoints: number[][] = [];
      for (let i = 0; i < poly.length; i++) {
        const p0 = poly[i];
        const p1 = poly[(i + 1) % poly.length];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        if (i === 0) childPoints.push([p0.x, p0.y, 0]);
        childPoints.push([p0.x + dx / 3, p0.y + dy / 3, 0]);
        childPoints.push([p0.x + 2 * dx / 3, p0.y + 2 * dy / 3, 0]);
        childPoints.push([p1.x, p1.y, 0]);
      }
      child.setPoints3D(childPoints);

      child.parent = this;
      this.children.push(child);
    }
  }
}

// ============================================================================
// Core Boolean Operation via polygon-clipping (Martinez-Rueda-Feito)
// ============================================================================

/**
 * Perform a boolean operation using the polygon-clipping library.
 */
function performBooleanOp(
  polyA: Vertex2D[],
  polyB: Vertex2D[],
  operation: 'union' | 'intersection' | 'difference' | 'xor'
): Vertex2D[][] {
  if (polyA.length < 3 || polyB.length < 3) return [];

  const ringA: Ring = verticesToRing(polyA);
  const ringB: Ring = verticesToRing(polyB);

  const geomA: Polygon = [ringA];
  const geomB: Polygon = [ringB];

  let result: MultiPolygon;

  try {
    switch (operation) {
      case 'union':
        result = polygonClipping.union(geomA, geomB);
        break;
      case 'intersection':
        result = polygonClipping.intersection(geomA, geomB);
        break;
      case 'difference':
        result = polygonClipping.difference(geomA, geomB);
        break;
      case 'xor':
        result = polygonClipping.xor(geomA, geomB);
        break;
    }
  } catch (_e) {
    if (operation === 'union' || operation === 'difference') {
      return [polyA];
    }
    return [];
  }

  return multiPolygonToVertices(result);
}

/**
 * Convert Vertex2D[] to a polygon-clipping Ring (closed coordinate array).
 */
function verticesToRing(vertices: Vertex2D[]): Ring {
  const ring: Ring = vertices.map(v => [v.x, v.y] as Pair);

  // polygon-clipping expects rings to be closed (first == last point)
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (Math.abs(first[0] - last[0]) > 1e-10 || Math.abs(first[1] - last[1]) > 1e-10) {
      ring.push([first[0], first[1]]);
    }
  }

  return ring;
}

/**
 * Convert a polygon-clipping MultiPolygon result to Vertex2D[][] arrays.
 */
function multiPolygonToVertices(mp: MultiPolygon): Vertex2D[][] {
  const result: Vertex2D[][] = [];

  for (const polygon of mp) {
    for (const ring of polygon) {
      const vertices: Vertex2D[] = [];
      for (const pair of ring) {
        vertices.push({ x: pair[0], y: pair[1] });
      }

      // Remove closing point if it duplicates the first
      if (vertices.length > 1) {
        const first = vertices[0];
        const last = vertices[vertices.length - 1];
        if (Math.abs(first.x - last.x) < 1e-10 && Math.abs(first.y - last.y) < 1e-10) {
          vertices.pop();
        }
      }

      if (vertices.length >= 3) {
        result.push(vertices);
      }
    }
  }

  return result;
}

// ============================================================================
// Boolean Operation Classes
// ============================================================================

/**
 * Union - Boolean union of two shapes (combine)
 *
 * Creates a new shape that encompasses both input shapes.
 * Uses the Martinez-Rueda-Feito algorithm for robust handling of all polygon types.
 */
export class Union extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillColor,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = 3,
      samplesPerSegment = 8,
    } = options;

    this.color = fillColor || color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    const resultPolygons = performBooleanOp(poly1, poly2, 'union');

    if (resultPolygons.length > 0) {
      this._resultVertices = resultPolygons;
      this._setPointsFromMultiplePolygons(resultPolygons);
    } else {
      if (poly1.length >= 3 && poly2.length >= 3) {
        this._resultVertices = [poly1, poly2];
        this._setPointsFromMultiplePolygons([poly1, poly2]);
      } else if (poly1.length >= 3) {
        this._resultVertices = [poly1];
        this._setPointsFromVertices(poly1);
      } else if (poly2.length >= 3) {
        this._resultVertices = [poly2];
        this._setPointsFromVertices(poly2);
      }
    }
    this._centerOnPoints();
  }
}

/**
 * Intersection - Boolean intersection of two shapes (overlap area)
 *
 * Creates a new shape representing the overlapping region of both inputs.
 * Uses the Martinez-Rueda-Feito algorithm for robust handling of all polygon types.
 */
export class Intersection extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillColor,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = 3,
      samplesPerSegment = 8,
    } = options;

    this.color = fillColor || color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    const resultPolygons = performBooleanOp(poly1, poly2, 'intersection');

    if (resultPolygons.length > 0) {
      this._resultVertices = resultPolygons;
      this._setPointsFromMultiplePolygons(resultPolygons);
    }
    this._centerOnPoints();
  }
}

/**
 * Difference - Boolean difference of two shapes (subtract second from first)
 *
 * Creates a new shape representing the first shape with the second removed.
 * Uses the Martinez-Rueda-Feito algorithm for robust handling of all polygon types.
 */
export class Difference extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillColor,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = 3,
      samplesPerSegment = 8,
    } = options;

    this.color = fillColor || color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    const resultPolygons = performBooleanOp(poly1, poly2, 'difference');

    if (resultPolygons.length > 0) {
      this._resultVertices = resultPolygons;
      this._setPointsFromMultiplePolygons(resultPolygons);
    } else {
      if (poly1.length >= 3) {
        this._resultVertices = [poly1];
        this._setPointsFromVertices(poly1);
      }
    }
    this._centerOnPoints();
  }
}

/**
 * Exclusion - Boolean XOR of two shapes (non-overlapping areas)
 *
 * Creates shapes representing the areas that are in one shape but not both.
 * Uses the Martinez-Rueda-Feito algorithm for robust handling of all polygon types.
 */
export class Exclusion extends BooleanResult {
  constructor(shape1: VMobject, shape2: VMobject, options: BooleanOperationOptions = {}) {
    super();

    const {
      color = shape1.color,
      fillColor,
      fillOpacity = shape1.fillOpacity,
      strokeWidth = 3,
      samplesPerSegment = 8,
    } = options;

    this.color = fillColor || color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    const poly1 = sampleVMobjectToPolygon(shape1, samplesPerSegment);
    const poly2 = sampleVMobjectToPolygon(shape2, samplesPerSegment);

    const resultPolygons = performBooleanOp(poly1, poly2, 'xor');

    if (resultPolygons.length > 0) {
      this._resultVertices = resultPolygons;
      this._setPointsFromMultiplePolygons(resultPolygons);
    }
    this._centerOnPoints();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a boolean union of two shapes
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
 */
export function exclusion(
  shape1: VMobject,
  shape2: VMobject,
  options?: BooleanOperationOptions
): Exclusion {
  return new Exclusion(shape1, shape2, options);
}

// ============================================================================
// VMobject to Polygon Sampling
// ============================================================================

/**
 * Sample a VMobject's path to get polygon vertices.
 * Converts cubic Bezier curves to a polyline approximation.
 * Applies the mobject's world-space position offset so that shapes
 * moved via shift()/moveTo() are sampled at their actual on-screen location.
 */
function sampleVMobjectToPolygon(vmobject: VMobject, samplesPerSegment: number): Vertex2D[] {
  const points3D = vmobject.getPoints();
  if (points3D.length === 0) return [];

  // Apply the mobject's world-space position offset
  const ox = vmobject.position.x;
  const oy = vmobject.position.y;

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
      vertices.push({ x: pt[0] + ox, y: pt[1] + oy });
    }
  }

  // Add last point
  if (points3D.length > 0) {
    const lastPt = points3D[points3D.length - 1];
    vertices.push({ x: lastPt[0] + ox, y: lastPt[1] + oy });
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

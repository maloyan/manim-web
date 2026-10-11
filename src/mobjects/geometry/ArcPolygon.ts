import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { getNumCurvesFromPoints } from '../../core/VMobjectCurves';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';
import { Arc } from './Arc';

/**
 * Arc configuration for connecting vertices in ArcPolygon
 */
export interface ArcConfig {
  /** Arc angle for this edge. Default: 0 (straight line) */
  angle?: number;
  /** Number of Bezier segments. Default: 8 */
  numComponents?: number;
}

/**
 * Options for creating an ArcPolygon
 */
export interface ArcPolygonOptions {
  /** Array of vertices defining the polygon. Required. */
  vertices: Vector3Tuple[];
  /** Arc configurations for each edge. If not provided, straight lines are used. */
  arcConfigs?: ArcConfig[];
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
}

/**
 * ArcPolygon - A polygon with arc edges instead of straight lines
 *
 * Creates a polygon where edges can be curved arcs.
 *
 * @example
 * ```typescript
 * // Create a triangle with curved edges
 * const arcTriangle = new ArcPolygon({
 *   vertices: [
 *     [0, 1, 0],
 *     [-1, -0.5, 0],
 *     [1, -0.5, 0]
 *   ],
 *   arcConfigs: [
 *     { angle: Math.PI / 4 },
 *     { angle: -Math.PI / 4 },
 *     { angle: Math.PI / 4 }
 *   ]
 * });
 * ```
 */
export class ArcPolygon extends VMobject {
  private _vertices: Vector3Tuple[];
  private _arcConfigs: ArcConfig[];

  constructor(options: ArcPolygonOptions) {
    super();

    const {
      vertices,
      arcConfigs = [],
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    if (!vertices || vertices.length < 2) {
      throw new Error('ArcPolygon requires at least 2 vertices');
    }

    this._vertices = vertices.map((v) => [...v] as Vector3Tuple);
    // Extend arcConfigs to match number of edges
    this._arcConfigs = [];
    for (let i = 0; i < vertices.length; i++) {
      this._arcConfigs.push(arcConfigs[i] || { angle: 0 });
    }

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the arc polygon points.
   */
  private _generatePoints(): void {
    const points: number[][] = [];
    const n = this._vertices.length;

    for (let i = 0; i < n; i++) {
      const start = this._vertices[i];
      const end = this._vertices[(i + 1) % n];
      const config = this._arcConfigs[i];
      const angle = config.angle || 0;
      const numComponents = config.numComponents || 8;

      if (Math.abs(angle) < 1e-10) {
        // Straight line segment
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const dz = end[2] - start[2];

        if (i === 0) {
          points.push([...start]);
        }
        points.push([start[0] + dx / 3, start[1] + dy / 3, start[2] + dz / 3]);
        points.push([start[0] + (2 * dx) / 3, start[1] + (2 * dy) / 3, start[2] + (2 * dz) / 3]);
        points.push([...end]);
      } else {
        // Arc segment using ArcBetweenPoints logic
        const arcPoints = this._generateArcPoints(start, end, angle, numComponents);

        if (i === 0) {
          points.push(...arcPoints);
        } else {
          // Skip the first point (it's the end of the previous segment)
          points.push(...arcPoints.slice(1));
        }
      }
    }

    this.setPoints3D(points);
  }

  /**
   * Generate points for an arc between two points
   */
  private _generateArcPoints(
    start: Vector3Tuple,
    end: Vector3Tuple,
    angle: number,
    numComponents: number,
  ): number[][] {
    const points: number[][] = [];

    // Calculate arc parameters
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    const chordX = end[0] - start[0];
    const chordY = end[1] - start[1];
    const halfChord = Math.sqrt(chordX * chordX + chordY * chordY) / 2;

    if (halfChord < 1e-10) {
      points.push([...start]);
      return points;
    }

    const halfAngle = Math.abs(angle) / 2;
    const radius = halfChord / Math.sin(halfAngle);
    const distToCenter = radius * Math.cos(halfAngle);

    const chordLength = 2 * halfChord;
    let perpX = -chordY / chordLength;
    let perpY = chordX / chordLength;

    if (angle > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const centerX = midX + distToCenter * perpX;
    const centerY = midY + distToCenter * perpY;
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    // Generate arc points
    const numSegments = Math.max(
      1,
      Math.ceil((Math.abs(angle) / (Math.PI / 2)) * (numComponents / 4)),
    );
    const segmentAngle = angle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = startAngle + i * segmentAngle;
      const theta2 = startAngle + (i + 1) * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * radius * dx1;
      const y1 = y0 + kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * radius * dx2;
      const y2 = y3 - kappa * radius * dy2;

      if (i === 0) {
        points.push([x0, y0, midZ]);
      }
      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    return points;
  }

  /**
   * Get the vertices
   */
  getVertices(): Vector3Tuple[] {
    return this._vertices.map((v) => [...v] as Vector3Tuple);
  }

  /**
   * Get the arc configurations
   */
  getArcConfigs(): ArcConfig[] {
    return this._arcConfigs.map((c) => ({ ...c }));
  }

  /**
   * Create a copy of this ArcPolygon
   */
  override copy(): ArcPolygon {
    const clone = new ArcPolygon({
      vertices: this._vertices,
      arcConfigs: this._arcConfigs,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false, copyPosition: false });
    return clone;
  }
}

/** Euclidean distance between two 3D points (z defaults to 0). */
function pointDistance(a: Vector3Tuple, b: Vector3Tuple): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = (a[2] ?? 0) - (b[2] ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** A single straight cubic (shared-anchor, four points) between two points. */
function straightCubic(start: Vector3Tuple, end: Vector3Tuple): number[][] {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = (end[2] ?? 0) - (start[2] ?? 0);
  const sz = start[2] ?? 0;
  return [
    [start[0], start[1], sz],
    [start[0] + dx / 3, start[1] + dy / 3, sz + dz / 3],
    [start[0] + (2 * dx) / 3, start[1] + (2 * dy) / 3, sz + (2 * dz) / 3],
    [end[0], end[1], end[2] ?? 0],
  ];
}

/**
 * ArcPolygonFromArcs - a closed path stitched from pre-made {@link Arc} pieces.
 *
 * Port of Manim CE's `ArcPolygonFromArcs`. Each arc's points are appended in
 * order; between one arc's last point and the next arc's first point a
 * connecting straight segment is inserted, subdivided to roughly match the arc
 * resolution. The arcs are taken in cyclic order, so the final segment closes
 * the path back to the first arc's first point. Endpoints are read from the
 * arcs' actual geometry (first and last points), matching CE's `get_start`
 * and `get_end`. The arcs' endpoints are assumed to connect; when they do, the
 * connecting segments are degenerate and the result is one continuous path.
 *
 * Unlike CE this does not also add the arcs as child submobjects: the result is
 * only the stitched path, so the arcs are not drawn a second time.
 *
 * @example
 * ```typescript
 * const poly = new ArcPolygonFromArcs(arc1, arc2, arc3);
 * ```
 */
export class ArcPolygonFromArcs extends VMobject {
  /** The component arcs, in cyclic order. */
  readonly arcs: Arc[];

  constructor(...arcs: Arc[]) {
    super();
    if (arcs.length === 0) {
      throw new Error('ArcPolygonFromArcs requires at least one Arc');
    }
    this.arcs = [...arcs];
    this.fillOpacity = 0;

    const n = arcs.length;
    for (let i = 0; i < n; i++) {
      const arc1 = arcs[i];
      const arc2 = arcs[(i + 1) % n];
      const arc1Points = arc1.getLocalPoints();
      const arc2Points = arc2.getLocalPoints();
      this.appendPoints(arc1Points);

      // CE's get_end / get_start: the arc's actual last / first geometry point.
      const start = arc1Points[arc1Points.length - 1] as Vector3Tuple;
      const end = arc2Points[0] as Vector3Tuple;
      const lenRatio = pointDistance(start, end) / arc1.getArcLength();
      if (!Number.isFinite(lenRatio)) continue;

      const extraCurves = Math.trunc(getNumCurvesFromPoints(arc1Points) * lenRatio);
      this.appendPoints(this.insertNCurvesToPointList(extraCurves, straightCubic(start, end)));
    }
  }

  /**
   * Create a copy of this ArcPolygonFromArcs.
   */
  override copy(): ArcPolygonFromArcs {
    const clone = new ArcPolygonFromArcs(...this.arcs.map((arc) => arc.copy()));
    this._copyBaseAttributesInto(clone, { copyChildren: false, copyPosition: false });
    return clone;
  }
}

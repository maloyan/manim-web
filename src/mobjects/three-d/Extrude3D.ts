import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { logger } from '../../utils/logger';
import { orientation2D } from '../../utils/vectors';
import { edgeKey, refineTriangles } from './capTriangulation';
import {
  MeshBuilder,
  OrganicMesh3D,
  requireFinitePoints,
  requireNumber,
  type OrganicMeshOptions,
} from './organicMesh';

/** A 2D point [x, y]. */
export type Point2D = [number, number];

/** A closed 2D outline: a list of points, or a VMobject (its x, y are used). */
export type Outline2D = Point2D[] | VMobject;

/**
 * Bend of an extruded slab after it is built.
 *
 * - `'cylinder'`: the slab rolls around an axis parallel to local Y, so its
 *   x extent wraps onto an arc of the given radius (an ER sheet, a curved band).
 * - `'sphere'`: the slab wraps onto a sphere of the given radius (a golgi
 *   cisterna, a contact-lens disc).
 *
 * A positive radius curves the slab toward +Z, a negative radius toward -Z.
 * |radius| must exceed half the depth.
 */
export interface Extrude3DBend {
  /** Radius of curvature (signed, see above). */
  radius: number;
  /** Default: 'cylinder' */
  mode?: 'cylinder' | 'sphere';
}

/**
 * Options for creating an Extrude3D.
 */
export interface Extrude3DOptions extends OrganicMeshOptions {
  /** Outer outline in the XY plane. A VMobject uses its first subpath. */
  outline: Outline2D;
  /**
   * Holes inside the outline. A VMobject outline also contributes its other
   * subpaths as holes. Default: none
   */
  holes?: Outline2D[];
  /** Slab thickness along Z (centred on z = 0). Default: 0.2 */
  depth?: number;
  /**
   * Radius of the round edge (0 = sharp edge). Clamped below depth / 2, and
   * below the width at which it would fold the outline. Default: 0
   */
  bevel?: number;
  /** Rings in each quarter-round bevel. Default: 4 */
  bevelSegments?: number;
  /** Samples per cubic Bezier curve of a VMobject outline. Default: 8 */
  curveSegments?: number;
  /** Outline corners sharper than this angle (radians) get a hard edge. Default: PI / 6 */
  creaseAngle?: number;
  /** Optional bend applied after the extrusion. Default: none (flat) */
  bend?: Extrude3DBend;
  /** Color of the two flat faces (top and bottom). Default: the main color */
  capColor?: string;
}

/** Signed area of a closed 2D polygon (positive = counter-clockwise). */
function signedArea(points: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

/** Remove the closing duplicate and consecutive duplicates. */
function cleanLoop(points: Point2D[]): Point2D[] {
  const out: Point2D[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 1e-9) continue;
    out.push([p[0], p[1]]);
  }
  while (
    out.length > 1 &&
    Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-9
  ) {
    out.pop();
  }
  return out;
}

/**
 * Sample the subpaths of a VMobject as closed 2D loops.
 * Its points are cubic Bezier quadruples; a curve whose start differs from the
 * previous curve's end starts a new subpath.
 */
function vmobjectLoops(vmob: VMobject, curveSegments: number): Point2D[][] {
  const pts = vmob.getPoints();
  const loops: Point2D[][] = [];
  let current: Point2D[] = [];
  for (let i = 0; i + 3 < pts.length; i += 4) {
    const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    const prev = current[current.length - 1];
    if (prev && Math.hypot(prev[0] - p0[0], prev[1] - p0[1]) > 1e-6) {
      loops.push(current);
      current = [];
    }
    for (let k = current.length === 0 ? 0 : 1; k <= curveSegments; k++) {
      const t = k / curveSegments;
      const u = 1 - t;
      const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      current.push([
        w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0],
        w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1],
      ]);
    }
  }
  if (current.length > 0) loops.push(current);
  return loops.map(cleanLoop).filter((l) => l.length >= 3);
}

/** One contour vertex: position, inward bevel direction, and wall normal column(s). */
interface ContourVertex {
  p: Point2D;
  /** Unit inward offset direction scaled by the miter factor. */
  inset: Point2D;
  /** One normal (smooth vertex) or two (crease: incoming, outgoing). */
  normals: Point2D[];
}

/**
 * Prepare a contour whose material lies on its left side (outer CCW, hole CW).
 * The outward wall normal of an edge with direction (dx, dy) is (dy, -dx).
 */
function prepareContour(points: Point2D[], creaseAngle: number): ContourVertex[] {
  const n = points.length;
  const edgeNormal = (i: number): Point2D => {
    const a = points[i];
    const b = points[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  };
  const cosCrease = Math.cos(creaseAngle);
  return points.map((p, i) => {
    const nIn = edgeNormal((i - 1 + n) % n);
    const nOut = edgeNormal(i);
    let mx = nIn[0] + nOut[0];
    let my = nIn[1] + nOut[1];
    const ml = Math.hypot(mx, my);
    if (ml < 1e-9) {
      mx = nOut[0];
      my = nOut[1];
    } else {
      mx /= ml;
      my /= ml;
    }
    // Miter: offset the corner so both edges move by the same distance.
    const cosHalf = Math.max(0.35, mx * nIn[0] + my * nIn[1]);
    const inset: Point2D = [-mx / cosHalf, -my / cosHalf];
    const crease = nIn[0] * nOut[0] + nIn[1] * nOut[1] < cosCrease;
    return { p, inset, normals: crease ? [nIn, nOut] : [[mx, my]] };
  });
}

/**
 * Whether insetting every contour by `bevel` keeps the direction of each of
 * its edges (an edge that turns around means the bevel folds the outline).
 */
function bevelKeepsEdges(contours: ContourVertex[][], bevel: number): boolean {
  const a = new THREE.Vector2();
  const b = new THREE.Vector2();
  const before = new THREE.Vector2();
  return contours.every((c) =>
    c.every((cv, i) => {
      const next = c[(i + 1) % c.length];
      before.set(next.p[0] - cv.p[0], next.p[1] - cv.p[1]);
      a.set(cv.p[0], cv.p[1]).addScaledVector(new THREE.Vector2(...cv.inset), bevel);
      b.set(next.p[0], next.p[1]).addScaledVector(new THREE.Vector2(...next.inset), bevel);
      return b.sub(a).dot(before) > 0;
    }),
  );
}

/** The contour points moved by `bevel` along their offset directions. */
function insetRing(c: ContourVertex[], bevel: number): number[][] {
  return c.map((cv) => [cv.p[0] + cv.inset[0] * bevel, cv.p[1] + cv.inset[1] * bevel]);
}

/** Whether segments a-b and c-d cross at one inner point of both. */
function segmentsCross(a: number[], b: number[], c: number[], d: number[]): boolean {
  const o1 = orientation2D(a, b, c);
  const o2 = orientation2D(a, b, d);
  const o3 = orientation2D(c, d, a);
  const o4 = orientation2D(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

/** Even-odd test: whether `p` lies inside the closed ring. */
function insideRing(p: number[], ring: number[][]): boolean {
  let inside = false;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
    )
      inside = !inside;
  });
  return inside;
}

/**
 * Whether the inset rings of different contours stay apart: no two cross, and
 * every hole ring stays inside the outer ring.
 */
function bevelKeepsApart(contours: ContourVertex[][], bevel: number): boolean {
  if (contours.length < 2) return true;
  const rings = contours.map((c) => insetRing(c, bevel));
  for (let h = 1; h < rings.length; h++) {
    if (!insideRing(rings[h][0], rings[0])) return false;
    for (let o = 0; o < h; o++) {
      const [r, s2] = [rings[h], rings[o]];
      for (let i = 0; i < r.length; i++) {
        for (let j = 0; j < s2.length; j++) {
          if (segmentsCross(r[i], r[(i + 1) % r.length], s2[j], s2[(j + 1) % s2.length]))
            return false;
        }
      }
    }
  }
  return true;
}

/** Whether a bevel neither folds a contour nor pushes two contours across each other. */
function bevelFits(contours: ContourVertex[][], bevel: number): boolean {
  return bevelKeepsEdges(contours, bevel) && bevelKeepsApart(contours, bevel);
}

/**
 * The largest bevel up to `bevel` that fits (see {@link bevelFits}), with a 10%
 * margin when it must shrink.
 * @post result <= bevel && bevelFits(contours, result)
 */
function foldFreeBevel(contours: ContourVertex[][], bevel: number): number {
  if (bevel <= 0 || bevelFits(contours, bevel)) return bevel;
  let lo = 0;
  let hi = bevel;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bevelFits(contours, mid)) lo = mid;
    else hi = mid;
  }
  return 0.9 * lo;
}

/**
 * Insert evenly spaced vertices on every edge longer than `maxEdge`, so a bend
 * can curve the wall and the cap rim along that edge. A new vertex takes the
 * linear blend of the two end vertices for its point AND its bevel offset, so
 * the offset rings stay the straight, fold-free rings of the original edge
 * (a fresh miter on the short segments would fold under the chosen bevel).
 * @post result.length >= contour.length
 * @post bevelKeepsEdges([contour], b) => bevelKeepsEdges([result], b)
 */
function resampleContour(contour: ContourVertex[], maxEdge: number): ContourVertex[] {
  const out: ContourVertex[] = [];
  contour.forEach((a, i) => {
    const b = contour[(i + 1) % contour.length];
    out.push(a);
    const pa = new THREE.Vector2(...a.p);
    const pb = new THREE.Vector2(...b.p);
    const steps = Math.ceil(pa.distanceTo(pb) / maxEdge);
    const ia = new THREE.Vector2(...a.inset);
    const ib = new THREE.Vector2(...b.inset);
    const na = new THREE.Vector2(...a.normals[a.normals.length - 1]);
    const nb = new THREE.Vector2(...b.normals[0]);
    for (let k = 1; k < steps; k++) {
      const t = k / steps;
      const p = pa.clone().lerp(pb, t);
      const inset = ia.clone().lerp(ib, t);
      const n = na.clone().lerp(nb, t).normalize();
      out.push({ p: [p.x, p.y], inset: [inset.x, inset.y], normals: [[n.x, n.y]] });
    }
  });
  return out;
}

/**
 * Extrude3D - a 2D outline (with optional holes) extruded into a slab, with an
 * optional round bevel and an optional bend.
 *
 * The side wall is smooth along smooth parts of the outline and hard at sharp
 * corners (`creaseAngle`). Without a bevel the top and bottom faces meet the
 * wall at a hard edge; with a bevel the edge is a quarter round. The mesh is
 * closed and outward-wound. Material slots: 0 wall and bevel (`color`), 1 flat
 * faces (`capColor`).
 *
 * Principal axis for the build-up reveal: local +X (left to right).
 *
 * Use it for flat ER sheets (outline = long rounded band, `bend` cylinder),
 * golgi cisternae (rounded discs, `bend` sphere, stack several), and a
 * mitochondrion cross-section (stadium outline with a folded hole whose
 * fingers are the cristae).
 *
 * With `bend`, edges longer than about 6 degrees of arc are split and the
 * flat faces get inner vertices before the bend, so the slab curves smoothly.
 *
 * The bevel offsets the outline along its miter directions, so a bevel wider
 * than the narrowest part of the outline folds over itself. Keep the bevel
 * small against the feature size.
 *
 * @example
 * ```typescript
 * const disc = new Extrude3D({
 *   outline: new Circle({ radius: 1 }),
 *   depth: 0.15, bevel: 0.06, bend: { radius: 2.5, mode: 'sphere' },
 * });
 * ```
 */
export class Extrude3D extends OrganicMesh3D {
  private _outline: Point2D[];
  private _holes: Point2D[][];
  private _depth: number;
  private _bevel: number;
  private _bevelSegments: number;
  private _creaseAngle: number;
  private _bend: Extrude3DBend | undefined;
  private _capColor: string | undefined;

  constructor(options: Extrude3DOptions) {
    super(options, '#58c4dd');
    const {
      outline,
      holes = [],
      depth = 0.2,
      bevel = 0,
      bevelSegments = 4,
      curveSegments = 8,
      creaseAngle = Math.PI / 6,
      bend,
      capColor,
    } = options;
    requireNumber('Extrude3D', 'depth', depth, 0);
    requireNumber('Extrude3D', 'bevel', bevel, 0);
    if (bend) requireNumber('Extrude3D', 'bend.radius', bend.radius);
    const toLoops = (o: Outline2D): Point2D[][] => {
      const loops = o instanceof VMobject ? vmobjectLoops(o, curveSegments) : [cleanLoop(o)];
      loops.forEach((l, i) => requireFinitePoints('Extrude3D', `outline loop ${i}`, l));
      return loops;
    };
    const outerLoops = toLoops(outline);
    if (outerLoops.length === 0 || outerLoops[0].length < 3) {
      throw new Error('Extrude3D requires an outline with at least three distinct points.');
    }
    if (Math.abs(signedArea(outerLoops[0])) < 1e-12) {
      throw new Error('Extrude3D requires an outline that encloses an area (not collinear).');
    }
    // Outer CCW, holes CW: the material is always on the left of travel.
    const outer = outerLoops[0];
    this._outline = signedArea(outer) < 0 ? outer.reverse() : outer;
    this._holes = [...outerLoops.slice(1), ...holes.flatMap(toLoops)]
      .filter((h) => h.length >= 3)
      .map((h) => (signedArea(h) > 0 ? h.reverse() : h));
    this._depth = Math.max(1e-6, depth);
    const wanted = Math.max(0, Math.min(bevel, 0.49 * this._depth));
    const contours = [this._outline, ...this._holes].map((c) => prepareContour(c, creaseAngle));
    this._bevel = foldFreeBevel(contours, wanted);
    if (this._bevel < wanted)
      logger.debug(
        `Extrude3D: bevel ${wanted} folds the outline; it is reduced to ${this._bevel}.`,
      );
    this._bevelSegments = Math.max(1, Math.floor(bevelSegments));
    this._creaseAngle = creaseAngle;
    this._bend = bend;
    this._capColor = capColor;
    if (bend && Math.abs(bend.radius) <= this._depth / 2) {
      throw new Error('Extrude3D bend radius must exceed half the depth.');
    }
  }

  protected override _slotColors(): (string | undefined)[] {
    return this._capColor === undefined ? [] : [this._capColor];
  }

  /** Wall profile: (inset fraction of bevel, z, normal weight on the 2D normal, normal z). */
  private _profile(): { inset: number; z: number; nr: number; nz: number }[] {
    const d = this._depth / 2;
    const b = this._bevel;
    if (b === 0) {
      return [
        { inset: 0, z: -d, nr: 1, nz: 0 },
        { inset: 0, z: d, nr: 1, nz: 0 },
      ];
    }
    const rows: { inset: number; z: number; nr: number; nz: number }[] = [];
    const k = this._bevelSegments;
    for (let i = 0; i <= k; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / k);
      rows.push({
        inset: b * (1 - Math.cos(a)),
        z: -d + b + b * Math.sin(a),
        nr: Math.cos(a),
        nz: Math.sin(a),
      });
    }
    for (let i = 0; i <= k; i++) {
      const a = (Math.PI / 2) * (i / k);
      rows.push({
        inset: b * (1 - Math.cos(a)),
        z: d - b + b * Math.sin(a),
        nr: Math.cos(a),
        nz: Math.sin(a),
      });
    }
    return rows;
  }

  private _wall(builder: MeshBuilder, contour: ContourVertex[]): void {
    const profile = this._profile();
    // Columns: one per smooth vertex, two per crease vertex.
    const columns: { v: number; n: Point2D }[] = [];
    contour.forEach((cv, v) => cv.normals.forEach((n) => columns.push({ v, n })));
    const rings = profile.map((row) =>
      columns.map(({ v, n }) => {
        const cv = contour[v];
        const x = cv.p[0] + cv.inset[0] * row.inset;
        const y = cv.p[1] + cv.inset[1] * row.inset;
        return builder.vertex([x, y, row.z], [n[0] * row.nr, n[1] * row.nr, row.nz]);
      }),
    );
    const m = columns.length;
    for (let r = 0; r + 1 < rings.length; r++) {
      for (let c = 0; c < m; c++) {
        const c2 = (c + 1) % m;
        // Two columns of one crease vertex share positions: no face between them.
        if (columns[c].v === columns[c2].v) continue;
        builder.quad(rings[r][c], rings[r][c2], rings[r + 1][c2], rings[r + 1][c]);
      }
    }
  }

  private _caps(builder: MeshBuilder, contours: ContourVertex[][], maxEdge: number): void {
    const b = this._bevel;
    const insetLoop = (c: ContourVertex[]) =>
      c.map((cv) => new THREE.Vector2(cv.p[0] + cv.inset[0] * b, cv.p[1] + cv.inset[1] * b));
    const outer = insetLoop(contours[0]);
    const holes = contours.slice(1).map(insetLoop);
    let faces = THREE.ShapeUtils.triangulateShape(outer, holes);
    const all = [outer, ...holes].flat();
    if (Number.isFinite(maxEdge)) {
      // A bend curves only what has vertices: add cap interior points first.
      const rim = new Set<string>();
      let start = 0;
      for (const loop of [outer, ...holes]) {
        loop.forEach((_, i) => rim.add(edgeKey(start + i, start + ((i + 1) % loop.length))));
        start += loop.length;
      }
      faces = refineTriangles(all, faces, rim, maxEdge);
    }
    for (const sign of [1, -1]) {
      const z = (sign * this._depth) / 2;
      const ids = all.map((p) => builder.vertex([p.x, p.y, z], [0, 0, sign]));
      for (const f of faces) builder.triFacing(ids[f[0]], ids[f[1]], ids[f[2]], [0, 0, sign]);
    }
  }

  /**
   * Longest edge allowed before a bend: about 6 degrees of arc, but at least
   * 1/64 of the outline size, so a huge radius does not over-tessellate.
   */
  private _bendEdge(bend: Extrude3DBend): number {
    const box = new THREE.Box2().setFromPoints(this._outline.map((p) => new THREE.Vector2(...p)));
    const size = box.getSize(new THREE.Vector2());
    return Math.max((Math.abs(bend.radius) * Math.PI) / 30, Math.max(size.x, size.y) / 64);
  }

  protected _buildGeometry(): THREE.BufferGeometry {
    const builder = new MeshBuilder();
    // Only a bent slab needs inner vertices: a flat one keeps its low count.
    const maxEdge = this._bend ? this._bendEdge(this._bend) : Number.POSITIVE_INFINITY;
    const contours = [this._outline, ...this._holes]
      .map((c) => prepareContour(c, this._creaseAngle))
      .map((c) => (Number.isFinite(maxEdge) ? resampleContour(c, maxEdge) : c));
    builder.setGroup(0);
    for (const c of contours) this._wall(builder, c);
    builder.setGroup(1);
    this._caps(builder, contours, maxEdge);
    if (this._bend) this._applyBend(builder, this._bend);
    return builder.build([1, 0, 0]);
  }

  /** Bend positions and normals in place (normals by the inverse transpose). */
  private _applyBend(builder: MeshBuilder, bend: Extrude3DBend): void {
    const R = bend.radius;
    const P = builder.positions;
    const N = builder.normals;
    const sphere = bend.mode === 'sphere';
    for (let i = 0; i < P.length; i += 3) {
      const [x, y, z] = [P[i], P[i + 1], P[i + 2]];
      const [nx, ny, nz] = [N[i], N[i + 1], N[i + 2]];
      const rho = R - z;
      let p: THREE.Vector3;
      let n: THREE.Vector3;
      if (!sphere) {
        const a = x / R;
        const ex = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const ez = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
        p = new THREE.Vector3(rho * Math.sin(a), y, R - rho * Math.cos(a));
        n = ex
          .multiplyScalar((nx * R) / rho)
          .add(new THREE.Vector3(0, ny, 0))
          .add(ez.multiplyScalar(nz));
      } else {
        const r = Math.hypot(x, y);
        const psi = r > 1e-12 ? Math.atan2(y, x) : 0;
        const beta = r / R;
        const [cp, sp, cb, sb] = [Math.cos(psi), Math.sin(psi), Math.cos(beta), Math.sin(beta)];
        const eu = new THREE.Vector3(cb * cp, cb * sp, sb);
        const et = new THREE.Vector3(-sp, cp, 0);
        const ez = new THREE.Vector3(-sb * cp, -sb * sp, cb);
        const nr = nx * cp + ny * sp;
        const nt = -nx * sp + ny * cp;
        const tangentialScale = r > 1e-12 ? r / (rho * sb) : R / rho;
        p = new THREE.Vector3(rho * sb * cp, rho * sb * sp, R - rho * cb);
        n = eu
          .multiplyScalar((nr * R) / rho)
          .add(et.multiplyScalar(nt * tangentialScale))
          .add(ez.multiplyScalar(nz));
      }
      n.normalize();
      P[i] = p.x;
      P[i + 1] = p.y;
      P[i + 2] = p.z;
      N[i] = n.x;
      N[i + 1] = n.y;
      N[i + 2] = n.z;
    }
  }

  /** The slab thickness. */
  getDepth(): number {
    return this._depth;
  }

  override copy(): Extrude3D {
    const copy = new Extrude3D({
      outline: this._outline,
      holes: this._holes,
      depth: this._depth,
      bevel: this._bevel,
      bevelSegments: this._bevelSegments,
      creaseAngle: this._creaseAngle,
      bend: this._bend ? { ...this._bend } : undefined,
      capColor: this._capColor,
      color: this.color,
      opacity: this._opacity,
      center: this._centerPoint,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

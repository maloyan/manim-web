/**
 * Marching-cubes isosurface extraction for a 3D scalar field.
 *
 * The algorithm samples a scalar field `f(x, y, z)` on a regular grid and
 * extracts the triangle mesh of the level set `f = iso`. This module uses the
 * marching-tetrahedra variant: it splits every grid cube into six tetrahedra
 * that share the cube's main diagonal, then polygonises each tetrahedron. The
 * tetrahedral form needs no 256-entry lookup table, so it is compact and
 * watertight, at the cost of more triangles than classic marching cubes.
 *
 * The output is a non-indexed triangle soup as a flat `Float32Array`. Three.js
 * recomputes smooth normals from it, and manim-web renders the surface
 * double-sided, so triangle winding does not affect the shaded result.
 */

/** A scalar field sampled at a point in space. */
export type ScalarField3D = (x: number, y: number, z: number) => number;

/** Options that control how the grid is sampled. */
export interface MarchingCubesOptions {
  /** The scalar field to polygonise. */
  field: ScalarField3D;
  /** X range as [min, max]. */
  xRange: [number, number];
  /** Y range as [min, max]. */
  yRange: [number, number];
  /** Z range as [min, max]. */
  zRange: [number, number];
  /** Grid cells per axis. A higher value gives a finer surface. */
  resolution: number;
  /** The iso level of the extracted surface. */
  isoLevel: number;
}

/** The polygonised surface as a non-indexed triangle soup. */
export interface MarchingCubesResult {
  /** Flat vertex positions: `[x0, y0, z0, x1, y1, z1, ...]`. */
  positions: Float32Array;
  /** The number of triangles. */
  triangleCount: number;
}

// The six tetrahedra that tile one cube. Each row holds four corner indices.
// Every tetrahedron shares the cube diagonal from corner 0 to corner 6, so the
// decomposition is consistent across neighbouring cubes and leaves no cracks.
const CUBE_TETRAHEDRA: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 1, 2, 6],
  [0, 2, 3, 6],
  [0, 3, 7, 6],
  [0, 7, 4, 6],
  [0, 4, 5, 6],
  [0, 5, 1, 6],
];

// Corner offsets (unit cube), indexed to match CUBE_TETRAHEDRA. Corner 0 is the
// minimum corner and corner 6 is the maximum corner (the shared diagonal ends).
const CUBE_CORNER_OFFSETS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
];

type Vec3 = [number, number, number];

/** Linear interpolation of the iso crossing point on the edge from `pa` to `pb`. */
function interpEdge(pa: Vec3, va: number, pb: Vec3, vb: number, iso: number): Vec3 {
  const denom = vb - va;
  // A near-zero gradient along the edge places the crossing at the midpoint.
  const t = Math.abs(denom) < 1e-12 ? 0.5 : (iso - va) / denom;
  const tc = Math.max(0, Math.min(1, t));
  return [pa[0] + tc * (pb[0] - pa[0]), pa[1] + tc * (pb[1] - pa[1]), pa[2] + tc * (pb[2] - pa[2])];
}

/**
 * Polygonise one tetrahedron and append its triangles to `out`.
 *
 * A corner counts as inside when its value is below `iso`. The surface cuts the
 * edges that join an inside corner to an outside corner. One inside corner (or
 * one outside corner) gives a single triangle; a two-two split gives a quad,
 * emitted as two triangles ordered so the quad never self-intersects.
 */
function marchTetrahedron(
  p: [Vec3, Vec3, Vec3, Vec3],
  v: [number, number, number, number],
  iso: number,
  out: number[],
): void {
  const inside: number[] = [];
  const outside: number[] = [];
  for (let i = 0; i < 4; i++) {
    if (v[i] < iso) inside.push(i);
    else outside.push(i);
  }

  const push = (pt: Vec3): void => {
    out.push(pt[0], pt[1], pt[2]);
  };
  const edge = (a: number, b: number): Vec3 => interpEdge(p[a], v[a], p[b], v[b], iso);

  if (inside.length === 0 || inside.length === 4) {
    return;
  }

  if (inside.length === 1 || inside.length === 3) {
    // One lone corner on its own side of the surface: one triangle on its edges.
    const lone = inside.length === 1 ? inside[0] : outside[0];
    const others = inside.length === 1 ? outside : inside;
    push(edge(lone, others[0]));
    push(edge(lone, others[1]));
    push(edge(lone, others[2]));
    return;
  }

  // Two-two split: inside = {a, b}, outside = {c, d}. The four crossing points
  // ordered ac, ad, bd, bc walk the quad boundary without crossing.
  const [a, b] = inside;
  const [c, d] = outside;
  const ac = edge(a, c);
  const ad = edge(a, d);
  const bd = edge(b, d);
  const bc = edge(b, c);
  push(ac);
  push(ad);
  push(bd);
  push(ac);
  push(bd);
  push(bc);
}

/**
 * Extract the isosurface `field = isoLevel` over the sampled grid.
 *
 * The grid holds `resolution` cells per axis, so it samples
 * `(resolution + 1)^3` points. Field values are evaluated once per grid point
 * and cached, so the output is deterministic for a given input.
 */
export function marchingCubes(options: MarchingCubesOptions): MarchingCubesResult {
  const { field, xRange, yRange, zRange, isoLevel } = options;
  const res = Math.max(1, Math.floor(options.resolution));
  const nx = res;
  const ny = res;
  const nz = res;

  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const [zMin, zMax] = zRange;
  const dx = (xMax - xMin) / nx;
  const dy = (yMax - yMin) / ny;
  const dz = (zMax - zMin) / nz;

  const coordX = (ix: number): number => xMin + ix * dx;
  const coordY = (iy: number): number => yMin + iy * dy;
  const coordZ = (iz: number): number => zMin + iz * dz;

  // Sample the field once at every grid point. Index: ((ix*(ny+1))+iy)*(nz+1)+iz.
  const strideY = nz + 1;
  const strideX = (ny + 1) * strideY;
  const values = new Float64Array((nx + 1) * strideX);
  for (let ix = 0; ix <= nx; ix++) {
    const x = coordX(ix);
    for (let iy = 0; iy <= ny; iy++) {
      const y = coordY(iy);
      for (let iz = 0; iz <= nz; iz++) {
        values[ix * strideX + iy * strideY + iz] = field(x, y, coordZ(iz));
      }
    }
  }
  const valueAt = (ix: number, iy: number, iz: number): number =>
    values[ix * strideX + iy * strideY + iz];

  const out: number[] = [];
  const cornerPos: [Vec3, Vec3, Vec3, Vec3] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const cornerVal: [number, number, number, number] = [0, 0, 0, 0];

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        for (const tet of CUBE_TETRAHEDRA) {
          for (let k = 0; k < 4; k++) {
            const off = CUBE_CORNER_OFFSETS[tet[k]];
            const cix = ix + off[0];
            const ciy = iy + off[1];
            const ciz = iz + off[2];
            cornerPos[k] = [coordX(cix), coordY(ciy), coordZ(ciz)];
            cornerVal[k] = valueAt(cix, ciy, ciz);
          }
          marchTetrahedron(cornerPos, cornerVal, isoLevel, out);
        }
      }
    }
  }

  return { positions: new Float32Array(out), triangleCount: out.length / 9 };
}

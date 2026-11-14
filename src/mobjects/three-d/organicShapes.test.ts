/**
 * Tests for the organic 3D mobjects: Capsule3D, Blob3D, Shell3D, Extrude3D,
 * TubeNetwork3D, and the scatter helpers.
 *
 * The key property: every mesh is closed and consistently wound once
 * coincident positions are welded. Then each undirected edge has exactly two
 * triangles, one on each side, and the signed volume is positive (outward).
 * An inverted-hull ink outline needs exactly this.
 */
import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';
import { weldIds, REVEAL_ATTRIBUTE, SMOOTH_NORMAL_ATTRIBUTE } from './organicMesh';
import { TubeFromPoints } from './TubeFromPoints';
import { Capsule3D } from './Capsule3D';
import { Blob3D } from './Blob3D';
import { Shell3D } from './Shell3D';
import { Extrude3D } from './Extrude3D';
import { TubeNetwork3D } from './TubeNetwork3D';
import { scatterOnEllipsoid, scatterInVolume, scatterOnMesh, toInstances } from './scatter';
import { Group } from '../../core/Group';
import { GolgiApparatus3D } from '../biology/cell3d/GolgiApparatus3D';
import { RoughER3D } from '../biology/cell3d/RoughER3D';
import { Mitochondrion3D } from '../biology/cell3d/Mitochondrion3D';
import { NuclearPore3D } from '../biology/cell3d/NuclearPore3D';
import { Vesicle3D } from '../biology/cell3d/Vesicle3D';
import { logger } from '../../utils/logger';

interface Topology {
  /** Directed welded edges that do not appear exactly once. */
  badDirected: number;
  /** Directed welded edges with no reverse twin (holes). */
  open: number;
  /** Signed volume (positive = outward winding). */
  volume: number;
  /** Triangles whose stored normals disagree with the face winding. */
  flippedNormals: number;
}

function topology(geometry: THREE.BufferGeometry): Topology {
  const ids = weldIds(geometry);
  const pos = geometry.getAttribute('position');
  const nrm = geometry.getAttribute('normal');
  const index = geometry.getIndex()!;
  const directed = new Map<string, number>();
  let volume = 0;
  let flippedNormals = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let t = 0; t < index.count / 3; t++) {
    const v = [index.getX(3 * t), index.getX(3 * t + 1), index.getX(3 * t + 2)];
    const w = v.map((i) => ids[i]);
    if (w[0] === w[1] || w[1] === w[2] || w[2] === w[0]) continue; // degenerate
    for (let k = 0; k < 3; k++) {
      const key = `${w[k]}>${w[(k + 1) % 3]}`;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
    a.fromBufferAttribute(pos, v[0]);
    b.fromBufferAttribute(pos, v[1]);
    c.fromBufferAttribute(pos, v[2]);
    volume += a.dot(b.clone().cross(c)) / 6;
    const face = b.clone().sub(a).cross(c.clone().sub(a));
    n.set(0, 0, 0);
    for (const i of v) n.add(new THREE.Vector3().fromBufferAttribute(nrm, i));
    if (face.lengthSq() > 1e-14 && face.dot(n) < 0) flippedNormals++;
  }
  let badDirected = 0;
  let open = 0;
  for (const [key, count] of directed) {
    if (count !== 1) badDirected++;
    const [p, q] = key.split('>');
    if (!directed.has(`${q}>${p}`)) open++;
  }
  return { badDirected, open, volume, flippedNormals };
}

function expectClosed(geometry: THREE.BufferGeometry): void {
  const t = topology(geometry);
  expect(t.open).toBe(0);
  expect(t.badDirected).toBe(0);
  expect(t.volume).toBeGreaterThan(0);
  expect(t.flippedNormals).toBe(0);
  expect(geometry.getAttribute(SMOOTH_NORMAL_ATTRIBUTE)).toBeDefined();
}

describe('organic meshes are closed and outward-wound', () => {
  // MIGRATION: examples for the property
  //   ∀ organic mobject m, weld(m.getGeometry()) is a closed, consistently
  //   wound 2-manifold (each directed edge once, its reverse once) with
  //   positive signed volume and normals that agree with the winding.
  // Replace with a property test over generated options once the suite lands.
  it('Capsule3D (bent)', () => {
    expectClosed(new Capsule3D({ radius: 0.3, length: 1.2, bend: 1.2 }).getGeometry());
  });

  it('Blob3D', () => {
    expectClosed(new Blob3D({ lobes: 9, seed: 3, detail: 3 }).getGeometry());
  });

  it('Shell3D plane cut and wedge cut', () => {
    expectClosed(
      new Shell3D({
        scale: [1, 0.6, 1.2],
        cutDirection: [0.3, 1, 0.2],
        rimColor: '#fff',
      }).getGeometry(),
    );
    expectClosed(new Shell3D({ cut: 'wedge', segments: 32 }).getGeometry());
  });

  it('Extrude3D with a hole, bevel and bend', () => {
    const outline: [number, number][] = [];
    const hole: [number, number][] = [];
    for (let i = 0; i < 24; i++) {
      const a = (2 * Math.PI * i) / 24;
      outline.push([2 * Math.cos(a), Math.sin(a)]);
      hole.push([Math.cos(-a), 0.4 * Math.sin(-a)]);
    }
    expectClosed(
      new Extrude3D({
        outline,
        holes: [hole],
        depth: 0.3,
        bevel: 0.08,
        bend: { radius: 3 },
      }).getGeometry(),
    );
    // Sharp corners split normals (crease) but stay closed.
    expectClosed(
      new Extrude3D({
        outline: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      }).getGeometry(),
    );
  });

  it('TubeNetwork3D: every edge tube and joint is closed', () => {
    const net = TubeNetwork3D.lattice({ size: [2, 2, 0.5], spacing: 0.5, seed: 4 });
    expectClosed(new TubeNetwork3D({ ...net, radius: 0.05 }).getGeometry());
  });
});

describe('seeded shapes are deterministic', () => {
  // MIGRATION: example for the property
  //   ∀ seed s, ∀ options o: build(o, s) === build(o, s) and, generically,
  //   build(o, s) !== build(o, s + 1).
  it('Blob3D and the scatter helpers repeat per seed', () => {
    const p1 = new Blob3D({ seed: 5, detail: 2 }).getGeometry().getAttribute('position').array;
    const p2 = new Blob3D({ seed: 5, detail: 2 }).getGeometry().getAttribute('position').array;
    const p3 = new Blob3D({ seed: 6, detail: 2 }).getGeometry().getAttribute('position').array;
    expect(Array.from(p1)).toEqual(Array.from(p2));
    expect(Array.from(p1)).not.toEqual(Array.from(p3));

    const s1 = scatterOnEllipsoid({ count: 50, radii: [2, 1, 1], seed: 9, minDistance: 0.2 });
    const s2 = scatterOnEllipsoid({ count: 50, radii: [2, 1, 1], seed: 9, minDistance: 0.2 });
    expect(s1).toEqual(s2);
  });

  it('scatterInVolume keeps the minimum distance and stays inside', () => {
    const pts = scatterInVolume({
      count: 200,
      size: [2, 2, 2],
      shape: 'ellipsoid',
      seed: 1,
      minDistance: 0.15,
    });
    expect(pts.length).toBeGreaterThan(100);
    for (const p of pts) {
      expect(p[0] ** 2 + p[1] ** 2 + p[2] ** 2).toBeLessThanOrEqual(1 + 1e-9);
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
        expect(d).toBeGreaterThanOrEqual(0.15);
      }
    }
  });
});

describe('TubeFromPoints capped', () => {
  // MIGRATION: example for the property
  //   ∀ open curve c, TubeFromPoints({ points: c, capped: true }) is closed and
  //   its reveal attribute rises from 0 at the first point to 1 at the last.
  it('closes the tube ends and orders the reveal along the curve', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 1],
      ],
      capped: true,
    });
    const geometry = (tube.getThreeObject() as THREE.Mesh).geometry;
    expectClosed(geometry);
    const reveal = geometry.getAttribute(REVEAL_ATTRIBUTE);
    const index = geometry.getIndex()!;
    const first = reveal.getX(index.getX(0));
    const last = reveal.getX(index.getX(index.count - 1));
    expect(first).toBeLessThan(0.05);
    expect(last).toBeGreaterThan(0.95);
  });
});

describe('scatter helpers', () => {
  // MIGRATION: example for the property
  //   ∀ mesh m nested in groups g1 ⊃ g2 ⊃ m, ∀ transforms T of g1 or g2 (before any render):
  //   every scatterOnMesh(m) position p satisfies |p - m.getCenter()| <= radius of m.
  // Replace with a property test once the suite lands.
  it('scatterOnMesh samples in world space after an ancestor moves, before a render', () => {
    const blob = new Blob3D({ radius: 1, lumpiness: 0, detail: 2 });
    const inner = new Group(blob);
    const outer = new Group(inner);
    outer.getThreeObject();
    outer.shift([10, 0, 0]);
    inner.rotate(Math.PI / 2, { axis: [0, 0, 1] });
    inner.scale(2);
    const samples = scatterOnMesh(blob, { count: 40, seed: 2 });
    const center = blob.getCenter();
    expect(center[0]).toBeCloseTo(10, 6);
    expect(samples.length).toBe(40);
    for (const s of samples) {
      const d = Math.hypot(...s.position.map((v, i) => v - center[i]));
      expect(d).toBeGreaterThan(1.8);
      expect(d).toBeLessThan(2.2);
    }
  });

  // MIGRATION: example for the property
  //   ∀ scatter helper h, ∀ options o: h(o) terminates; it returns finite positions and
  //   unit normals, or throws an Error naming the bad option; an impossible minDistance
  //   returns fewer than o.count points and logs once at debug level.
  // Replace with a property test once the suite lands.
  it('give finite points or a clear error for degenerate options', () => {
    expect(() => scatterOnEllipsoid({ count: 1, radii: [0, 1, 1] })).toThrow(/radii/);
    expect(() => scatterOnEllipsoid({ count: 1, radii: Number.NaN })).toThrow(/radii/);
    expect(() => scatterInVolume({ count: 1, size: [-1, 1, 1] })).toThrow(/size/);
    expect(() => scatterInVolume({ count: Number.POSITIVE_INFINITY })).toThrow(/count/);
    expect(scatterOnEllipsoid({ count: 0 })).toEqual([]);
    expect(scatterInVolume({ count: 0 })).toEqual([]);
    expect(toInstances([])).toEqual([]);
    const flat = scatterInVolume({ count: 20, size: [1, 1, 0] });
    expect(flat.every((p) => p.every(Number.isFinite) && p[2] === 0)).toBe(true);
    const debug = vi.spyOn(logger, 'debug').mockImplementation(() => undefined);
    const crowded = scatterInVolume({ count: 50, size: [1, 1, 1], minDistance: 5 });
    expect(crowded.length).toBe(1);
    expect(debug).toHaveBeenCalledTimes(1);
    debug.mockRestore();
    for (const p of scatterOnEllipsoid({ count: 30, radii: [3, 1e-3, 1] })) {
      expect(p.position.every(Number.isFinite) && p.normal.every(Number.isFinite)).toBe(true);
    }
  });
});

/** Largest distance of a cap triangle centroid from the ideal bent surface. */
function capError(geometry: THREE.BufferGeometry, surface: (p: THREE.Vector3) => number): number {
  const cap = geometry.groups.find((g) => g.materialIndex === 1)!;
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex()!;
  let worst = 0;
  for (let t = cap.start; t < cap.start + cap.count; t += 3) {
    const c = new THREE.Vector3();
    for (let k = 0; k < 3; k++)
      c.add(new THREE.Vector3().fromBufferAttribute(pos, index.getX(t + k)));
    worst = Math.max(worst, surface(c.divideScalar(3)));
  }
  return worst;
}

describe('Extrude3D bend', () => {
  // MIGRATION: example for the property
  //   ∀ outline o, ∀ bend b: every cap triangle of Extrude3D({ outline: o, bend: b }) lies
  //   within a small tolerance of the bent cap surface, the mesh stays closed, and with no
  //   bend the caps keep the plain outline triangulation.
  // Replace with a property test once the suite lands.
  it('tessellates caps and long edges before a bend, and only then', () => {
    const square: [number, number][] = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    const depth = 0.2;
    const R = 2;
    const slab = new Extrude3D({ outline: square, depth, bevel: 0, bend: { radius: R } });
    const g = slab.getGeometry();
    expectClosed(g);
    // Cylinder axis: parallel to Y through (0, *, R); caps at R -+ depth / 2.
    const cyl = (p: THREE.Vector3) => {
      const rho = Math.hypot(p.x, p.z - R);
      return Math.min(Math.abs(rho - (R - depth / 2)), Math.abs(rho - (R + depth / 2)));
    };
    expect(capError(g, cyl)).toBeLessThan(0.01);

    const circle: [number, number][] = Array.from({ length: 32 }, (_, i) => {
      const a = (2 * Math.PI * i) / 32;
      return [Math.cos(a), Math.sin(a)];
    });
    const disc = new Extrude3D({
      outline: circle,
      depth,
      bevel: 0.05,
      bend: { radius: R, mode: 'sphere' },
    });
    const gd = disc.getGeometry();
    expectClosed(gd);
    const sph = (p: THREE.Vector3) => {
      const rho = p.distanceTo(new THREE.Vector3(0, 0, R));
      return Math.min(Math.abs(rho - (R - depth / 2)), Math.abs(rho - (R + depth / 2)));
    };
    expect(capError(gd, sph)).toBeLessThan(0.01);

    const flat = new Extrude3D({ outline: square, depth, bevel: 0 }).getGeometry();
    const flatCap = flat.groups.find((x) => x.materialIndex === 1)!;
    expect(flatCap.count).toBe(2 * 2 * 3);
  });
});

describe('organic shapes with degenerate options', () => {
  // MIGRATION: example for the property
  //   ∀ organic shape class C, ∀ options o (zero or negative sizes, NaN, empty or
  //   collinear outlines, oversized bevels, empty graphs): new C(o) throws an Error
  //   that names C, or its geometry has only finite positions and normals.
  // Replace with a property test once the suite lands.
  it('give a clear error or a finite mesh, never NaN', () => {
    const sq: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const makers: [string, () => { getGeometry(): THREE.BufferGeometry }][] = [
      ['capsule r 0', () => new Capsule3D({ radius: 0, length: 0, bend: 1 })],
      ['capsule r NaN', () => new Capsule3D({ radius: Number.NaN })],
      ['blob r 0', () => new Blob3D({ radius: 0, detail: 1 })],
      ['blob scale 0', () => new Blob3D({ scale: [0, 1, 1] })],
      ['shell t 0', () => new Shell3D({ thickness: 0 })],
      ['shell inner >= outer', () => new Shell3D({ outerRadius: 1, innerRadius: 2 })],
      ['shell scale 0', () => new Shell3D({ scale: [1, 0, 1] })],
      ['extrude empty', () => new Extrude3D({ outline: [] })],
      ['extrude 2 points', () => new Extrude3D({ outline: sq.slice(0, 2) })],
      [
        'extrude collinear',
        () =>
          new Extrude3D({
            outline: [
              [0, 0],
              [1, 0],
              [2, 0],
            ],
          }),
      ],
      [
        'extrude NaN point',
        () =>
          new Extrude3D({
            outline: [
              [0, 0],
              [1, Number.NaN],
              [1, 1],
            ],
          }),
      ],
      ['extrude bevel > shape', () => new Extrude3D({ outline: sq, depth: 3, bevel: 1.4 })],
      ['extrude depth 0', () => new Extrude3D({ outline: sq, depth: 0 })],
      ['extrude bend NaN', () => new Extrude3D({ outline: sq, bend: { radius: Number.NaN } })],
      ['tubes empty', () => new TubeNetwork3D({ nodes: [], edges: [] })],
      [
        'tubes NaN node',
        () =>
          new TubeNetwork3D({
            nodes: [
              [0, 0, 0],
              [1, Number.NaN, 0],
            ],
            edges: [[0, 1]],
          }),
      ],
      ['lattice spacing 0', () => new TubeNetwork3D(TubeNetwork3D.lattice({ spacing: 0 }))],
    ];
    for (const [name, make] of makers) {
      let geometry: THREE.BufferGeometry;
      try {
        geometry = make().getGeometry();
      } catch (err) {
        expect(String(err), name).toMatch(/^Error: (Capsule|Blob|Shell|Extrude|TubeNetwork)3D/);
        continue;
      }
      for (const attr of ['position', 'normal']) {
        const values = Array.from(geometry.getAttribute(attr)?.array ?? []);
        expect(values.every(Number.isFinite), `${name} ${attr}`).toBe(true);
      }
    }
    // An oversized bevel shrinks until the cap outline keeps its winding.
    expectClosed(new Extrude3D({ outline: sq, depth: 3, bevel: 1.4 }).getGeometry());
  });
});

describe('Extrude3D bevel and bend together', () => {
  // MIGRATION: example for the property
  //   ∀ outline o, ∀ bevel b in [0, 0.4 * half-width], ∀ bend (none, cylinder, sphere),
  //   ∀ depth d: weld(new Extrude3D({ outline: o, bevel: b, bend, depth: d }).getGeometry())
  //   is closed, consistently wound, with finite normals that agree with the winding.
  // Replace with a property test once the suite lands.
  it('stays watertight for every outline kind, bevel and bend', () => {
    const ring = (r: number, n: number, cw = false): [number, number][] =>
      Array.from({ length: n }, (_, i) => {
        const a = ((cw ? -2 : 2) * Math.PI * i) / n;
        return [r * Math.cos(a), r * Math.sin(a)];
      });
    const rounded: [number, number][] = [];
    for (const [cx, cy, a0] of [
      [0.7, 0.7, 0],
      [-0.7, 0.7, 0.5],
      [-0.7, -0.7, 1],
      [0.7, -0.7, 1.5],
    ]) {
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI * (a0 + k / 12);
        rounded.push([cx + 0.3 * Math.cos(a), cy + 0.3 * Math.sin(a)]);
      }
    }
    const outlines: [string, [number, number][], [number, number][][]][] = [
      [
        'square',
        [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ],
        [],
      ],
      ['rounded', rounded, []],
      ['circle', ring(1, 32), []],
      ['hole', ring(1, 32), [ring(0.45, 16, true)]],
      [
        'L',
        [
          [-1, -1],
          [1, -1],
          [1, 0],
          [0, 0],
          [0, 1],
          [-1, 1],
        ],
        [],
      ],
    ];
    const bends = [undefined, { radius: 2 }, { radius: 2.5, mode: 'sphere' as const }];
    for (const [name, outline, holes] of outlines) {
      for (const depth of [0.2, 1]) {
        for (const bevel of [0, 0.05, 0.4 * 0.5]) {
          for (const bend of bends) {
            const g = new Extrude3D({
              outline,
              holes,
              depth,
              bevel: bevel * (depth === 1 ? 2 : 1),
              bend,
            }).getGeometry();
            const t = topology(g);
            const label = `${name} d${depth} b${bevel} ${bend?.mode ?? (bend ? 'cyl' : 'flat')}`;
            expect([t.open, t.badDirected, t.flippedNormals], label).toEqual([0, 0, 0]);
            expect(t.volume, label).toBeGreaterThan(0);
            expect(Array.from(g.getAttribute('normal').array).every(Number.isFinite), label).toBe(
              true,
            );
          }
        }
      }
    }
    // The kit shapes built on Extrude3D (Golgi cisternae are bent), at every detail.
    const debug = vi.spyOn(logger, 'debug').mockImplementation(() => undefined);
    for (const detail of ['low', 'medium', 'high'] as const) {
      const kit = [
        new GolgiApparatus3D({ detail }),
        new RoughER3D({ detail, ribosomes: 0 }),
        new Mitochondrion3D({ detail, cutaway: true, lid: true }),
        new NuclearPore3D({ detail }),
        Vesicle3D.peroxisome({ detail }),
      ];
      for (const o of kit) {
        for (const part of o.getFamily()) {
          if (!(part instanceof Extrude3D)) continue;
          const t = topology(part.getGeometry());
          expect([t.open, t.badDirected, t.flippedNormals], `${o.kind} ${detail}`).toEqual([
            0, 0, 0,
          ]);
        }
      }
    }
    // No kit bevel is reduced, so the kit look is unchanged.
    expect(debug.mock.calls.filter((c) => String(c[0]).includes('bevel'))).toEqual([]);
    debug.mockRestore();
    // The reviewer's case: square [-1, 1], depth 1, bevel 0.4, cylinder radius 2.
    expectClosed(
      new Extrude3D({
        outline: outlines[0][1],
        depth: 1,
        bevel: 0.4,
        bend: { radius: 2 },
      }).getGeometry(),
    );
  });
});

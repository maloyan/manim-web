/**
 * Organic 3D shapes: the building blocks of a cutaway cell, one of each.
 *
 * Back row: a bent rod (Capsule3D), a lumpy nucleolus (Blob3D), a cut bowl
 * with a blob inside (Shell3D, plane cut), and a nucleus with a wedge cut and
 * bead-ring pores (Shell3D + InstancedMobject + beadRingGeometry).
 * Front row: a curved ER sheet dotted with ribosomes (Extrude3D +
 * scatterOnMesh), a golgi stack (Extrude3D with a sphere bend), a
 * mitochondrion slice with cristae folds (Extrude3D with a hole), a tube net
 * (TubeNetwork3D.lattice), and a capped filament (TubeFromPoints).
 *
 * URL options: `?opacity=0.4` makes every fill translucent, `?reveal=0.5`
 * draws only the first half of every organic mesh (its build-up order).
 */
import * as THREE from 'three';
import {
  ThreeDScene,
  Capsule3D,
  Blob3D,
  Shell3D,
  Extrude3D,
  TubeNetwork3D,
  TubeFromPoints,
  InstancedMobject,
  scatterOnMesh,
  scatterOnEllipsoid,
  toInstances,
  beadRingGeometry,
  BLUE_B,
  BLUE_D,
  TEAL_C,
  GREEN_C,
  YELLOW_D,
  GOLD_A,
  GOLD_C,
  GOLD_E,
  RED_A,
  RED_C,
  RED_D,
  MAROON_B,
  MAROON_C,
  PURPLE_A,
  PURPLE_C,
  PURPLE_E,
  type Mobject,
  type Point2D,
  type Vector3Tuple,
} from '../src/index.ts';

const params = new URLSearchParams(location.search);
const OPACITY = Number(params.get('opacity') ?? 1);
const REVEAL = params.has('reveal') ? Number(params.get('reveal')) : null;

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 1200,
  height: 675,
  phi: 58 * (Math.PI / 180),
  theta: -72 * (Math.PI / 180),
  distance: 15.5,
  fov: 32,
});
scene.lighting.addAmbient({ intensity: 0.5 });

// ---- back row -------------------------------------------------------------

const rod = new Capsule3D({
  radius: 0.32,
  length: 1.8,
  bend: Math.PI / 2.5,
  direction: [1, 0, 0.3],
  center: [-6, 2.2, 0.4],
  color: RED_C,
  opacity: OPACITY,
});

const nucleolus = new Blob3D({
  radius: 0.75,
  lobes: 16,
  lobeSize: 0.42,
  lumpiness: 0.2,
  seed: 7,
  center: [-3, 2.2, 0.75],
  color: MAROON_C,
  opacity: OPACITY,
});

const bowl = new Shell3D({
  outerRadius: 1.25,
  thickness: 0.14,
  scale: [1.2, 1, 0.75],
  cutOffset: 0.25,
  center: [0.2, 2.2, 0.8],
  color: GOLD_C,
  innerColor: GOLD_E,
  rimColor: GOLD_A,
  opacity: OPACITY,
});
const inside = new Blob3D({
  radius: 0.35,
  lobes: 3,
  seed: 2,
  center: [0.2, 2.2, 0.55],
  color: TEAL_C,
});

const NUCLEUS_CENTER: Vector3Tuple = [3.6, 2.2, 1];
const nucleus = new Shell3D({
  outerRadius: 1.1,
  thickness: 0.12,
  cut: 'wedge',
  wedgeStart: -Math.PI / 2 - 0.9,
  wedgeAngle: 1.8,
  center: NUCLEUS_CENTER,
  color: PURPLE_C,
  innerColor: PURPLE_E,
  rimColor: PURPLE_A,
  opacity: OPACITY,
});
const pores = new InstancedMobject({
  geometry: beadRingGeometry({ beads: 8, radius: 0.07, beadRadius: 0.028 }),
  material: new THREE.MeshStandardMaterial({ color: PURPLE_A }),
  instances: toInstances(
    scatterOnEllipsoid({
      count: 70,
      radii: 1.105,
      center: NUCLEUS_CENTER,
      seed: 5,
      minDistance: 0.3,
      // Skip the removed wedge: it opens toward -Y.
      filter: (p) => p.normal[1] > -0.45 || Math.abs(p.normal[0]) > 0.75,
    }),
  ),
});
const innerNucleolus = new Blob3D({
  radius: 0.4,
  lobes: 12,
  lobeSize: 0.4,
  seed: 11,
  center: NUCLEUS_CENTER,
  color: MAROON_C,
});

// ---- front row ------------------------------------------------------------

/** A rounded rectangle outline, centred on the origin. */
function roundedRect(w: number, h: number, r: number, steps = 6): Point2D[] {
  const pts: Point2D[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
    [w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (Math.PI / 2) * (i / steps);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return pts;
}

/** An ellipse outline. */
function ellipse(a: number, b: number, n = 48): Point2D[] {
  return Array.from({ length: n }, (_, i): Point2D => {
    const t = (2 * Math.PI * i) / n;
    return [a * Math.cos(t), b * Math.sin(t)];
  });
}

const erSheet = new Extrude3D({
  outline: roundedRect(2.6, 0.9, 0.35),
  depth: 0.16,
  bevel: 0.06,
  bend: { radius: 1.6 },
  center: [-6, -1.6, 0.2],
  color: BLUE_D,
  opacity: OPACITY,
});
erSheet.rotate(Math.PI / 2, { axis: [1, 0, 0] });
const ribosomes = new InstancedMobject({
  geometry: new THREE.SphereGeometry(0.035, 10, 8),
  material: new THREE.MeshStandardMaterial({ color: MAROON_B }),
  instances: toInstances(scatterOnMesh(erSheet, { count: 300, seed: 3, minDistance: 0.07 }), {
    scale: [0.8, 1.3],
  }),
});

const golgi: Mobject[] = [0, 1, 2, 3].map(
  (i) =>
    new Extrude3D({
      outline: ellipse(1.0 - 0.12 * i, 0.55 - 0.05 * i),
      depth: 0.09,
      bevel: 0.04,
      bend: { radius: -2, mode: 'sphere' },
      center: [-2.9, -1.6, 0.2 + 0.2 * i],
      color: i % 2 === 0 ? YELLOW_D : GOLD_C,
      opacity: OPACITY,
    }),
);

/** Lumen of a mitochondrion: an inner stadium with cristae folds poking in. */
function cristaeHole(a: number, b: number): Point2D[] {
  const pts: Point2D[] = [];
  const tooth = (x: number, y0: number, dir: 1 | -1, h: number, w: number) => {
    // A thin U-shaped fold from the wall at y0 into the lumen.
    const tipY = y0 + dir * h;
    pts.push([x - (dir * w) / 2, y0], [x - (dir * w) / 2, tipY - dir * (w / 2)]);
    for (let k = 1; k < 6; k++) {
      const t = Math.PI - (Math.PI * k) / 6;
      pts.push([
        x + dir * (w / 2) * Math.cos(t),
        tipY - dir * (w / 2) + dir * (w / 2) * Math.sin(t),
      ]);
    }
    pts.push([x + (dir * w) / 2, tipY - dir * (w / 2)], [x + (dir * w) / 2, y0]);
  };
  for (const x of [-1.05, -0.25, 0.55]) tooth(x, -b, 1, 0.55, 0.14);
  for (let k = 0; k <= 8; k++) {
    const t = -Math.PI / 2 + (Math.PI * k) / 8;
    pts.push([a + b * Math.cos(t), b * Math.sin(t)]);
  }
  for (const x of [0.95, 0.15, -0.65]) tooth(x, b, -1, 0.55, 0.14);
  for (let k = 0; k <= 8; k++) {
    const t = Math.PI / 2 + (Math.PI * k) / 8;
    pts.push([-a + b * Math.cos(t), b * Math.sin(t)]);
  }
  return pts;
}

/** A stadium (rounded-end rod) outline. */
function stadium(a: number, r: number): Point2D[] {
  const pts: Point2D[] = [];
  for (let k = 0; k <= 12; k++) {
    const t = -Math.PI / 2 + (Math.PI * k) / 12;
    pts.push([a + r * Math.cos(t), r * Math.sin(t)]);
  }
  for (let k = 0; k <= 12; k++) {
    const t = Math.PI / 2 + (Math.PI * k) / 12;
    pts.push([-a + r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
}

const mitochondrion = new Extrude3D({
  outline: stadium(1.35, 0.62),
  holes: [cristaeHole(1.35, 0.42)],
  depth: 0.45,
  bevel: 0.05,
  center: [0.4, -1.6, 0.3],
  color: RED_D,
  capColor: RED_A,
  opacity: OPACITY,
});

const net = new TubeNetwork3D({
  ...TubeNetwork3D.lattice({
    size: [2.4, 2, 0.5],
    spacing: 0.3,
    seed: 4,
    center: [3.6, -1.6, 0.3],
  }),
  radius: 0.04,
  color: BLUE_B,
  opacity: OPACITY,
});

const filament = new TubeFromPoints({
  points: Array.from({ length: 9 }, (_, i): Vector3Tuple => [
    5.6 + 0.2 * Math.sin(i),
    -2.6 + 0.45 * i,
    0.3 + 0.25 * Math.cos(1.3 * i),
  ]),
  radius: 0.05,
  capped: true,
  color: GREEN_C,
  opacity: OPACITY,
});

const all: Mobject[] = [
  rod,
  nucleolus,
  inside,
  bowl,
  innerNucleolus,
  nucleus,
  pores,
  erSheet,
  ribosomes,
  ...golgi,
  mitochondrion,
  net,
  filament,
];
scene.add(...all);

// Draw-range reveal check: each organic mesh shows its first REVEAL fraction.
if (REVEAL !== null) {
  for (const m of all) {
    m.getThreeObject().traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh) return;
      const index = o.geometry.getIndex();
      if (!index || !o.geometry.getAttribute('reveal')) return;
      o.geometry.setDrawRange(0, Math.floor((REVEAL * index.count) / 3) * 3);
    });
  }
}

scene.wait(Infinity);

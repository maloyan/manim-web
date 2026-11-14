/**
 * The organelles of the 3D cell kit, each one alone with its name.
 *
 * Every class is a group of named parts in the manim look (bright rim stroke
 * over a soft body), deterministic for its seed. Drag to orbit.
 *
 * URL options: `?only=<index>` shows one organelle at full size,
 * `?detail=low|medium|high`, `?build` plays every build-up.
 */
import {
  ThreeDScene,
  Text,
  LaggedStart,
  CellMembrane3D,
  Nucleus3D,
  NuclearPore3D,
  RoughER3D,
  SmoothER3D,
  GolgiApparatus3D,
  Mitochondrion3D,
  Ribosome3D,
  Vesicle3D,
  Centrosome3D,
  Cytoskeleton3D,
  type CellDetail,
  type Organelle3D,
  type Vector3Tuple,
} from '../src/index.ts';

const params = new URLSearchParams(location.search);
const detail = (params.get('detail') ?? 'medium') as CellDetail;
const only = params.has('only') ? Number(params.get('only')) : null;

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 1600,
  height: 1000,
  phi: 1.12,
  theta: -Math.PI / 2,
  distance: only === null ? 20 : 7,
  fov: 34,
  enableOrbitControls: true,
});
scene.lighting.addAmbient({ intensity: 0.55 });

/** The gallery: a factory per organelle, so `?only` builds just one. */
const entries: [string, (c: Vector3Tuple) => Organelle3D][] = [
  ['Cell membrane', (c) => new CellMembrane3D({ radius: 1.2, center: c, detail })],
  ['Nucleus', (c) => new Nucleus3D({ radius: 1.05, center: c, detail })],
  ['Nuclear pore', (c) => new NuclearPore3D({ size: 0.36, center: c, detail })],
  [
    'Rough ER',
    (c) => new RoughER3D({ innerRadius: 0.55, spacing: 0.24, height: 0.7, center: c, detail }),
  ],
  ['Smooth ER', (c) => new SmoothER3D({ size: [2.3, 1.5, 0.5], center: c, detail })],
  [
    'Golgi apparatus',
    (c) => new GolgiApparatus3D({ size: 1.7, direction: [1, -0.45, 0], center: c, detail }),
  ],
  [
    'Mitochondrion',
    (c) => new Mitochondrion3D({ length: 2.1, radius: 0.42, cutaway: true, center: c, detail }),
  ],
  ['Ribosome', (c) => new Ribosome3D({ size: 0.8, center: c, detail })],
  ['Lysosome', (c) => Vesicle3D.lysosome({ radius: 0.6, center: c, detail })],
  ['Peroxisome', (c) => Vesicle3D.peroxisome({ radius: 0.55, center: c, detail })],
  ['Centrosome', (c) => new Centrosome3D({ size: 0.9, center: c, detail })],
  [
    'Cytoskeleton',
    (c) =>
      new Cytoskeleton3D({ radii: [1.35, 1.15, 0.7], origin: [0.1, 0.1, 0], center: c, detail }),
  ],
];

const COLS = 4;
const shown = only === null ? entries : [entries[only]];
const organelles: Organelle3D[] = [];
shown.forEach(([name, make], i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const center: Vector3Tuple = only === null ? [(col - 1.5) * 3.7, 0, (1 - row) * 3.5] : [0, 0, 0];
  const organelle = make(center);
  organelles.push(organelle);
  scene.add(organelle);
  const label = new Text({ text: name, fontSize: only === null ? 22 : 30, color: '#ECEFF4' });
  label.moveTo([center[0], center[1], center[2] - (only === null ? 1.45 : 1.9)]);
  scene.add(label);
  scene.addFixedOrientationMobjects(label);
});

if (params.has('build')) {
  await scene.play(
    new LaggedStart(
      organelles.map((o) => o.buildAnimation()),
      { lagRatio: 0.15 },
    ),
  );
}

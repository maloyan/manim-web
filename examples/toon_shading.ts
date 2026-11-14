import {
  ThreeDScene,
  Sphere,
  Cube,
  Torus,
  Cylinder,
  TubeFromPoints,
  ParametricSurface,
  InstancedMobject,
  Group,
  LaggedStart,
  Create3D,
  GrowAlongPath3D,
  applyManimStyle3D,
  applyToonShading,
  BLUE,
  BLUE_B,
  TEAL,
  GOLD,
  RED,
  GREEN,
  PURPLE,
  YELLOW,
  MAROON,
} from '../src/index.ts';
import type { Mobject } from '../src/index.ts';

type Vec3 = [number, number, number];

const CAMERA = {
  width: 960,
  height: 400,
  phi: Math.PI / 2.4,
  theta: -Math.PI / 2,
  distance: 12,
  fov: 40,
  enableOrbitControls: true,
};

/** A wavy path for the tube, centred on `c`. */
function wave(c: Vec3): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push([c[0] - 0.9 + 1.8 * t, c[1] + 0.6 * Math.sin(t * Math.PI * 2), c[2] - 0.8 + 1.6 * t]);
  }
  return pts;
}

/** The five opaque primitives of one row. */
function primitives(z: number, colors: string[]): Mobject[] {
  const cube = new Cube({ sideLength: 1.4, center: [-2.8, 0, z], color: colors[1] });
  cube.rotation.set(0.5, 0.6, 0);
  const torus = new Torus({ radius: 0.75, tubeRadius: 0.3, center: [0, 0, z], color: colors[2] });
  torus.rotation.set(1.1, 0.3, 0);
  const cylinder = new Cylinder({
    radius: 0.6,
    height: 1.6,
    center: [2.8, 0, z],
    color: colors[3],
  });
  cylinder.rotation.set(0.35, 0, 0.3);
  return [
    new Sphere({ radius: 0.85, center: [-5.6, 0, z], color: colors[0] }),
    cube,
    torus,
    cylinder,
    new TubeFromPoints({ points: wave([5.6, 0, z]), radius: 0.22, color: colors[4], capped: true }),
  ];
}

// ── Manim preset, dark background ─────────────────────────────────────

const manimScene = new ThreeDScene(document.getElementById('manim')!, CAMERA);
const opaqueRow = primitives(1.3, [BLUE, TEAL, GOLD, RED, GREEN]);

// A translucent sphere with an opaque core.
const glass = new Sphere({ radius: 0.95, center: [-4.2, 0, -1.6], color: PURPLE, opacity: 0.4 });
const core = new Sphere({ radius: 0.4, center: [-4.2, 0, -1.6], color: YELLOW });

// A translucent cutaway shell (a sphere with a wedge removed) with a cube inside.
const shell = new ParametricSurface({
  func: (u: number, v: number): Vec3 => [
    0.95 * Math.sin(v) * Math.cos(u),
    0.95 * Math.sin(v) * Math.sin(u),
    -1.6 + 0.95 * Math.cos(v),
  ],
  uRange: [-Math.PI / 2 + 0.6, (3 * Math.PI) / 2 - 0.6],
  vRange: [0.05, Math.PI - 0.05],
  uResolution: 48,
  vResolution: 24,
  color: MAROON,
  opacity: 0.45,
});
shell.shift([-1.2, 0, 0]);
const inner = new Cube({ sideLength: 0.6, center: [-1.2, 0, -1.6], color: TEAL });
inner.rotation.set(0.4, 0.7, 0);

// A ring of instanced beads.
const beads = new InstancedMobject({
  template: new Sphere({ radius: 0.2, color: BLUE_B }),
  color: BLUE_B,
  instances: Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { position: [1.8 + 0.9 * Math.cos(a), 0, -1.6 + 0.9 * Math.sin(a)] as Vec3 };
  }),
});

const tube = new TubeFromPoints({
  points: Array.from({ length: 40 }, (_, i): Vec3 => {
    const t = i / 39;
    return [4.2 + 0.9 * Math.cos(t * 5), 0.9 * Math.sin(t * 5), -2.5 + 1.8 * t];
  }),
  radius: 0.14,
  color: YELLOW,
  capped: true,
});

const translucentRow = [glass, core, shell, inner, beads, tube];
manimScene.add(...opaqueRow, ...translucentRow);
applyManimStyle3D(manimScene);

async function buildUp(): Promise<void> {
  const button = document.getElementById('buildBtn') as HTMLButtonElement;
  button.disabled = true;
  await manimScene.play(
    new LaggedStart(
      [...opaqueRow, glass, core, shell, inner, beads].map(
        (m) => new Create3D(m, { duration: 1.6 }),
      ),
      { lagRatio: 0.15 },
    ),
    new GrowAlongPath3D(tube, { duration: 2.5 }),
  );
  button.disabled = false;
}

document.getElementById('buildBtn')!.addEventListener('click', () => void buildUp());

// ── Cartoon preset, white page ────────────────────────────────────────

const cartoonScene = new ThreeDScene(document.getElementById('cartoon')!, {
  ...CAMERA,
  height: 260,
  backgroundColor: '#ffffff',
});
const cartoonRow = new Group(
  ...primitives(0, ['#f2a36b', '#5b6ee1', '#e8603c', '#d94f8c', '#79c7e8']),
);
cartoonScene.add(cartoonRow);
applyToonShading(cartoonRow, 'cartoon');

manimScene.wait(Infinity);
cartoonScene.wait(Infinity);

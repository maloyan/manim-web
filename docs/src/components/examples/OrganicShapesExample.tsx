// Hand-maintained (see HAND_MAINTAINED_STEMS in scripts/generate-example-docs.mjs).
// A shorter version of examples/organic_shapes.ts (no mitochondrion slice, no
// bead-ring pores, no URL options) that builds the shapes up with Create3D on
// each pass of the docs <ManimExample> loop. The full source is below.
import React from 'react';
import ManimExample from '../ManimExample';

type Vec3 = [number, number, number];
type Pt = [number, number];

async function animate(scene: any) {
  const {
    Capsule3D,
    Blob3D,
    Shell3D,
    Extrude3D,
    TubeNetwork3D,
    TubeFromPoints,
    InstancedMobject,
    Sphere,
    LaggedStart,
    Create3D,
    scatterOnMesh,
    scatterOnEllipsoid,
    toInstances,
    BLUE_B,
    BLUE_D,
    TEAL_C,
    GREEN_C,
    YELLOW_D,
    GOLD_A,
    GOLD_C,
    GOLD_E,
    RED_C,
    MAROON_B,
    MAROON_C,
    PURPLE_A,
    PURPLE_C,
    PURPLE_E,
  } = await import('manim-web');

  scene.setCameraOrientation(58 * (Math.PI / 180), -72 * (Math.PI / 180), 15.5);

  // Back row: a bent rod, a lumpy blob, a cut bowl with a blob inside, and a
  // nucleus with a wedge cut and pores scattered on its surface.
  const rod = new Capsule3D({
    radius: 0.32,
    length: 1.8,
    bend: Math.PI / 2.5,
    direction: [1, 0, 0.3],
    center: [-6, 2.2, 0.4],
    color: RED_C,
  });
  const nucleolus = new Blob3D({
    radius: 0.75,
    lobes: 16,
    lobeSize: 0.42,
    lumpiness: 0.2,
    seed: 7,
    center: [-3, 2.2, 0.75],
    color: MAROON_C,
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
  });
  const inside = new Blob3D({
    radius: 0.35,
    lobes: 3,
    seed: 2,
    center: [0.2, 2.2, 0.55],
    color: TEAL_C,
  });
  const nucleusCenter: Vec3 = [3.6, 2.2, 1];
  const nucleus = new Shell3D({
    outerRadius: 1.1,
    thickness: 0.12,
    cut: 'wedge',
    wedgeStart: -Math.PI / 2 - 0.9,
    wedgeAngle: 1.8,
    center: nucleusCenter,
    color: PURPLE_C,
    innerColor: PURPLE_E,
    rimColor: PURPLE_A,
  });
  const pores = new InstancedMobject({
    template: new Sphere({ radius: 0.06, color: PURPLE_A }),
    color: PURPLE_A,
    instances: toInstances(
      scatterOnEllipsoid({
        count: 70,
        radii: 1.105,
        center: nucleusCenter,
        seed: 5,
        minDistance: 0.3,
        // Skip the removed wedge: it opens toward -Y.
        filter: (p: { normal: Vec3 }) => p.normal[1] > -0.45 || Math.abs(p.normal[0]) > 0.75,
      }),
    ),
  });

  // Front row: a bent ER sheet with ribosomes on it, a golgi stack, a tube
  // net, and a capped filament.
  const roundedRect = (w: number, h: number, r: number): Pt[] => {
    const pts: Pt[] = [];
    const corners: Vec3[] = [
      [w / 2 - r, h / 2 - r, 0],
      [-w / 2 + r, h / 2 - r, Math.PI / 2],
      [-w / 2 + r, -h / 2 + r, Math.PI],
      [w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2],
    ];
    for (const [cx, cy, a0] of corners) {
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (Math.PI / 2) * (i / 6);
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    }
    return pts;
  };
  const ellipse = (a: number, b: number): Pt[] =>
    Array.from({ length: 48 }, (_, i): Pt => {
      const t = (2 * Math.PI * i) / 48;
      return [a * Math.cos(t), b * Math.sin(t)];
    });

  const erSheet = new Extrude3D({
    outline: roundedRect(2.6, 0.9, 0.35),
    depth: 0.16,
    bevel: 0.06,
    bend: { radius: 1.6 },
    center: [-6, -1.6, 0.2],
    color: BLUE_D,
  });
  erSheet.rotate(Math.PI / 2, { axis: [1, 0, 0] });
  const ribosomes = new InstancedMobject({
    template: new Sphere({ radius: 0.035, color: MAROON_B }),
    color: MAROON_B,
    instances: toInstances(scatterOnMesh(erSheet, { count: 300, seed: 3, minDistance: 0.07 }), {
      scale: [0.8, 1.3],
    }),
  });
  const golgi = [0, 1, 2, 3].map(
    (i) =>
      new Extrude3D({
        outline: ellipse(1.0 - 0.12 * i, 0.55 - 0.05 * i),
        depth: 0.09,
        bevel: 0.04,
        bend: { radius: -2, mode: 'sphere' },
        center: [-2.9, -1.6, 0.2 + 0.2 * i],
        color: i % 2 === 0 ? YELLOW_D : GOLD_C,
      }),
  );
  const net = new TubeNetwork3D({
    ...TubeNetwork3D.lattice({
      size: [2.4, 2, 0.5],
      spacing: 0.3,
      seed: 4,
      center: [1.2, -1.6, 0.3],
    }),
    radius: 0.04,
    color: BLUE_B,
  });
  const filament = new TubeFromPoints({
    points: Array.from({ length: 9 }, (_, i): Vec3 => [
      4.6 + 0.2 * Math.sin(i),
      -2.6 + 0.45 * i,
      0.3 + 0.25 * Math.cos(1.3 * i),
    ]),
    radius: 0.05,
    capped: true,
    color: GREEN_C,
  });

  const all = [
    rod,
    nucleolus,
    bowl,
    inside,
    nucleus,
    pores,
    erSheet,
    ribosomes,
    ...golgi,
    net,
    filament,
  ];
  scene.add(...all);
  await scene.play(
    new LaggedStart(
      all.map((m) => new Create3D(m, { duration: 1.4 })),
      { lagRatio: 0.12 },
    ),
  );
  await scene.wait(3);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  const scene = new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 58 * (Math.PI / 180),
    theta: -72 * (Math.PI / 180),
    distance: 15.5,
    fov: 32,
  });
  scene.lighting.addAmbient({ intensity: 0.5 });
  return scene;
}

export default function OrganicShapesExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}

// Hand-maintained (see HAND_MAINTAINED_STEMS in scripts/generate-example-docs.mjs).
// The gallery of examples/organelles_3d.ts (every organelle class with its
// name), playing every build-up on each pass of the docs <ManimExample> loop.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
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
  } = await import('manim-web');

  scene.setCameraOrientation(1.12, -Math.PI / 2, 20);
  const detail = 'medium';

  // One factory per organelle; each takes the centre of its grid cell.
  const entries: [string, (c: [number, number, number]) => any][] = [
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

  const organelles: any[] = [];
  entries.forEach(([name, make], i) => {
    const center: [number, number, number] = [
      ((i % 4) - 1.5) * 3.7,
      0,
      (1 - Math.floor(i / 4)) * 3.5,
    ];
    const organelle = make(center);
    organelles.push(organelle);
    scene.add(organelle);
    const label = new Text({ text: name, fontSize: 22, color: '#ECEFF4' });
    label.moveTo([center[0], center[1], center[2] - 1.45]);
    scene.add(label);
    scene.addFixedOrientationMobjects(label);
  });

  await scene.play(
    new LaggedStart(
      organelles.map((o) => o.buildAnimation()),
      { lagRatio: 0.15 },
    ),
  );
  await scene.wait(3);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  const scene = new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 1.12,
    theta: -Math.PI / 2,
    distance: 20,
    fov: 34,
  });
  scene.lighting.addAmbient({ intensity: 0.55 });
  return scene;
}

export default function Organelles3dExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}

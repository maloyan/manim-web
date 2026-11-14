// Hand-maintained (see HAND_MAINTAINED_STEMS in scripts/generate-example-docs.mjs).
// examples/toon_shading.ts drives two scenes (manim preset, cartoon preset) and
// a Build button. This is the manim-preset scene as one auto-playing animation
// so it runs inside the docs <ManimExample> wrapper.
import React from 'react';
import ManimExample from '../ManimExample';

type Vec3 = [number, number, number];

async function animate(scene: any) {
  const {
    Sphere,
    Cube,
    Torus,
    Cylinder,
    TubeFromPoints,
    InstancedMobject,
    LaggedStart,
    Create3D,
    GrowAlongPath3D,
    applyManimStyle3D,
    BLUE,
    BLUE_B,
    TEAL,
    GOLD,
    RED,
    GREEN,
    PURPLE,
    YELLOW,
  } = await import('manim-web');

  scene.setCameraOrientation(Math.PI / 2.4, -Math.PI / 2, 12);

  // Opaque row: five primitives.
  const cube = new Cube({ sideLength: 1.4, center: [-2.8, 0, 1.3], color: TEAL });
  cube.rotation.set(0.5, 0.6, 0);
  const torus = new Torus({ radius: 0.75, tubeRadius: 0.3, center: [0, 0, 1.3], color: GOLD });
  torus.rotation.set(1.1, 0.3, 0);
  const cylinder = new Cylinder({ radius: 0.6, height: 1.6, center: [2.8, 0, 1.3], color: RED });
  cylinder.rotation.set(0.35, 0, 0.3);
  const wave: Vec3[] = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return [4.7 + 1.8 * t, 0.6 * Math.sin(t * Math.PI * 2), 0.5 + 1.6 * t];
  });
  const opaqueRow = [
    new Sphere({ radius: 0.85, center: [-5.6, 0, 1.3], color: BLUE }),
    cube,
    torus,
    cylinder,
    new TubeFromPoints({ points: wave, radius: 0.22, color: GREEN, capped: true }),
  ];

  // Translucent row: a glass sphere with an opaque core, a bead ring, a tube.
  const glass = new Sphere({ radius: 0.95, center: [-4.2, 0, -1.6], color: PURPLE, opacity: 0.4 });
  const core = new Sphere({ radius: 0.4, center: [-4.2, 0, -1.6], color: YELLOW });
  const beads = new InstancedMobject({
    template: new Sphere({ radius: 0.2, color: BLUE_B }),
    color: BLUE_B,
    instances: Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return { position: [0.6 + 0.9 * Math.cos(a), 0, -1.6 + 0.9 * Math.sin(a)] as Vec3 };
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

  scene.add(...opaqueRow, glass, core, beads, tube);
  // The manim look on everything the scene holds now.
  applyManimStyle3D(scene);

  // Build-up: outline first, then body. Create3D keeps translucent bodies
  // translucent (FadeIn would end at opacity 1). The tube grows along its path.
  const solids = [...opaqueRow.slice(0, 4), glass, core, beads];
  await scene.play(
    new LaggedStart(
      solids.map((m) => new Create3D(m, { duration: 1.6 })),
      { lagRatio: 0.15 },
    ),
    new GrowAlongPath3D(opaqueRow[4], { duration: 2.5 }),
    new GrowAlongPath3D(tube, { duration: 2.5 }),
  );
  await scene.wait(3);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: Math.PI / 2.4,
    theta: -Math.PI / 2,
    distance: 12,
    fov: 40,
  });
}

export default function ToonShadingExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}

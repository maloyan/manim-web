// Live example for the 0.37 molecular module: the headline ligand-docking
// story. A protein helix fades in, a translucent binding pocket grows beside
// it, a small ligand flies in and settles in the pocket center while the camera
// orbits, then a hydrogen bond and a binding-energy label are drawn.
import React from 'react';
import ManimExample from '../ManimExample';

// Same ideal alpha helix as the Protein example: 18 residues up the Z axis.
const RESIDUE_CODES = ['A', 'L', 'V', 'G', 'K', 'E', 'S'];
const N = 18;
const residues = Array.from({ length: N }, (_, i) => {
  const t = i * ((100 * Math.PI) / 180);
  return {
    code: RESIDUE_CODES[i % RESIDUE_CODES.length],
    ca: [2.3 * Math.cos(t), 2.3 * Math.sin(t), i * 1.5 - ((N - 1) * 1.5) / 2] as [
      number,
      number,
      number,
    ],
    ss: 'helix' as const,
  };
});

// A compact 4-atom ligand (a carbonyl fragment): grey C, red O double-bonded,
// blue N and a second O. Spans ~2 angstrom, so it sits inside the pocket.
const ligandAtoms: { element: string; position: [number, number, number] }[] = [
  { element: 'C', position: [0, 0, 0] },
  { element: 'O', position: [1.3, 0.2, 0] },
  { element: 'N', position: [-0.8, 1.1, 0] },
  { element: 'O', position: [-0.4, -1.2, 0.3] },
];
const ligandBonds = [
  { from: 0, to: 1, order: 2 as const },
  { from: 0, to: 2, order: 1 as const },
  { from: 0, to: 3, order: 1 as const },
];

// The pocket center, offset in +X from the helix axis so the ligand reads as
// binding in a site on the protein surface near the middle of the helix.
const POCKET_CENTER: [number, number, number] = [3.8, 0, 0];

async function animate(scene: any) {
  const {
    Molecule3D,
    Protein,
    BindingPocket,
    dockLigand,
    hydrogenBond,
    residueLabel,
    FadeIn,
    GrowFromCenter,
    Create,
  } = await import('manim-web');

  // 1. The protein fades in.
  const protein = new Protein({
    residues,
    representation: 'tube',
    colorMode: 'secondary-structure',
    tubeRadius: 0.35,
    smoothing: 8,
  });
  scene.add(protein);
  await scene.play(new FadeIn(protein, { duration: 1 }));

  // 2. The binding pocket grows beside the helix.
  const pocket = new BindingPocket({
    center: POCKET_CENTER,
    radius: 2.8,
    style: 'translucent-surface',
    color: '#66ccff',
    opacity: 0.25,
  });
  scene.add(pocket);
  await scene.play(new GrowFromCenter(pocket, { duration: 1 }));

  // 3. The ligand flies in from above and docks in the pocket center while the
  //    camera orbits. dockLigand places the ligand at target + startOffset.
  const ligand = new Molecule3D({
    atoms: ligandAtoms,
    bonds: ligandBonds,
    style: 'ball-and-stick',
  });
  scene.add(ligand);
  scene.beginAmbientCameraRotation(0.25);
  await scene.play(
    dockLigand({ ligand, target: pocket.getCenter(), startOffset: [0, 0, 10], runTime: 2.5 }),
  );

  // 4. Draw the binding story: a hydrogen bond from a nearby backbone CA to the
  //    docked ligand, a binding-energy label, and a residue tag.
  const donor = protein.getCAPoints()[9]; // a CA near the pocket, mid-helix
  const target = pocket.getCenter();

  // A single green dashed hydrogen bond from the backbone to the docked ligand.
  const hb = hydrogenBond(donor, target, { color: '#9fe2bf' });
  scene.add(hb);
  await scene.play(new Create(hb, { duration: 0.8 }));

  // The binding energy as a floating label beside the pocket (not a second line
  // over the hydrogen bond), and a residue tag above it. Both billboard to face
  // the camera.
  const energy = residueLabel([target[0], target[1] - 4, target[2] + 0.5], 'ΔG = -9.2 kcal/mol', {
    color: '#ffe066',
    fontSize: 38,
  });
  scene.add(energy);
  scene.addFixedOrientationMobjects(energy);

  const tag = residueLabel([target[0], target[1], target[2] + 3.4], 'LYS-128', {
    color: '#ffffff',
    fontSize: 34,
  });
  scene.add(tag);
  scene.addFixedOrientationMobjects(tag);

  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 78 * (Math.PI / 180),
    theta: -40 * (Math.PI / 180),
    // Closer in than the original 26 so the docking labels are readable.
    distance: 21,
    fov: 45,
    orbitControlsUp: 'z',
  });
}

export default function LigandDockingExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}

/**
 * Caffeine in 3D: a ball-and-stick model that inflates to space-filling.
 *
 * The scene builds caffeine (C8H10N4O2) with Molecule3D, draws it while the
 * camera orbits, then grows every atom from its ball-and-stick radius to its
 * van der Waals radius, so the stick model becomes the space-filling model.
 * The formula is set in LaTeX with MathTex and pinned to the frame.
 */
import {
  ThreeDScene,
  Molecule3D,
  MathTex,
  Create,
  FadeIn,
  FadeOut,
  ScaleInPlace,
  covalentRadius,
  vdwRadius,
  type Atom3DSpec,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 38 * (Math.PI / 180),
  theta: -70 * (Math.PI / 180),
  distance: 11.5,
  fov: 45,
});

// Caffeine heavy atoms in the purine plane (angstrom), then the nine methyl
// hydrogens, which leave the plane at tetrahedral angles.
const atoms: Atom3DSpec[] = [
  { element: 'N', position: [-1.95, 0.54, 0] }, // 0  N1
  { element: 'C', position: [-1.95, -0.86, 0] }, // 1  C2
  { element: 'N', position: [-0.74, -1.56, 0] }, // 2  N3
  { element: 'C', position: [0.47, -0.86, 0] }, // 3  C4
  { element: 'C', position: [0.47, 0.54, 0] }, // 4  C5
  { element: 'C', position: [-0.74, 1.24, 0] }, // 5  C6
  { element: 'N', position: [1.8, 0.97, 0] }, // 6  N7
  { element: 'C', position: [2.62, -0.16, 0] }, // 7  C8
  { element: 'N', position: [1.8, -1.29, 0] }, // 8  N9
  { element: 'O', position: [-3.02, -1.48, 0] }, // 9  O on C2
  { element: 'O', position: [-0.74, 2.47, 0] }, // 10 O on C6
  { element: 'C', position: [-3.23, 1.27, 0] }, // 11 methyl on N1
  { element: 'C', position: [-0.74, -3.03, 0] }, // 12 methyl on N3
  { element: 'C', position: [2.26, 2.37, 0] }, // 13 methyl on N7
  { element: 'H', position: [3.7, -0.16, 0] }, // 14 H on C8
  { element: 'H', position: [-3.54, 1.46, 1.03] },
  { element: 'H', position: [-3.1, 2.23, -0.51] },
  { element: 'H', position: [-3.99, 0.69, -0.51] },
  { element: 'H', position: [-0.74, -3.39, 1.03] },
  { element: 'H', position: [-1.63, -3.39, -0.51] },
  { element: 'H', position: [0.15, -3.39, -0.51] },
  { element: 'H', position: [2.37, 2.72, 1.03] },
  { element: 'H', position: [3.21, 2.44, -0.51] },
  { element: 'H', position: [1.52, 2.99, -0.51] },
];

const bonds = [
  // Six-membered ring
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4, order: 2 as const },
  { from: 4, to: 5 },
  { from: 5, to: 0 },
  // Five-membered ring
  { from: 4, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8, order: 2 as const },
  { from: 8, to: 3 },
  // Carbonyls, methyls, C8-H
  { from: 1, to: 9, order: 2 as const },
  { from: 5, to: 10, order: 2 as const },
  { from: 0, to: 11 },
  { from: 2, to: 12 },
  { from: 6, to: 13 },
  { from: 7, to: 14 },
  ...[15, 16, 17].map((h) => ({ from: 11, to: h })),
  ...[18, 19, 20].map((h) => ({ from: 12, to: h })),
  ...[21, 22, 23].map((h) => ({ from: 13, to: h })),
];

// Ball-and-stick draws each atom at 0.25 x its covalent radius; space-filling
// uses the full van der Waals radius. This factor grows one into the other.
const BALL_SCALE = 0.25;
// Space-filling at 0.7 x vdW keeps the atoms readable and inside the frame.
const SPACE_FILL = 0.7;
const inflateFactor = (element: string) =>
  vdwRadius(element) / (covalentRadius(element) * BALL_SCALE);

// The formula renders once, at load, so each run starts on the first frame.
const formula = new MathTex({ latex: '\\mathrm{C_8H_{10}N_4O_2}', fontSize: 52 });
const ready = formula.waitForRender();

async function caffeineMolecule(scene: ThreeDScene) {
  await ready;
  const molecule = new Molecule3D({
    atoms,
    bonds,
    style: 'ball-and-stick',
    radiusScale: BALL_SCALE,
  });
  molecule.scale(0.85);
  molecule.shift([0, 0, 0.9]);

  scene.addFixedInFrameMobjects(formula);
  formula.moveTo([0, -3.3, 0]);
  scene.add(formula);

  scene.add(molecule);
  scene.beginAmbientCameraRotation(0.3);
  await scene.play(new Create(molecule, { duration: 0.8 }));

  // Ball-and-stick -> space-filling: every atom grows toward its vdW radius and
  // the sticks fade, then the morph runs back.
  const inflate = (inverse: boolean) =>
    molecule.getAtoms().map((atom) => {
      const k = SPACE_FILL * inflateFactor(atom.element);
      return new ScaleInPlace(atom.sphere, { scaleFactor: inverse ? 1 / k : k, duration: 0.7 });
    });
  await scene.play(...inflate(false), new FadeOut(molecule.bondsGroup, { duration: 0.5 }));
  await scene.wait(0.3);
  await scene.play(...inflate(true), new FadeIn(molecule.bondsGroup, { duration: 0.7 }));
  await scene.wait(0.2);
  await scene.play(new FadeOut(molecule, { duration: 0.4 }));
  scene.stopAmbientCameraRotation();
}

let isAnimating = false;

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  playBtn.disabled = true;

  scene.clear();
  await caffeineMolecule(scene);

  isAnimating = false;
  playBtn.disabled = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls, autoplay, and loop.
if (new URLSearchParams(window.location.search).has('embed')) {
  setTimeout(() => playBtn.click(), 500);
  new MutationObserver(() => {
    if (!playBtn.disabled) setTimeout(() => playBtn.click(), 300);
  }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
}

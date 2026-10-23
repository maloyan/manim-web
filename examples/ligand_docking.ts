/**
 * Ligand docking: a drug-like ligand binds in a protein pocket.
 *
 * Two alpha helices (Protein, tube style) frame a binding pocket. Four polar
 * side chains (Molecule3D) point into it. The ligand flies in with dockLigand
 * and settles in the pocket. detectInteractions then finds the hydrogen bonds
 * between the ligand and the side chains, and drawInteractions draws them as
 * dashed lines. The binding energy is set in LaTeX with MathTex.
 */
import {
  ThreeDScene,
  Protein,
  Molecule3D,
  MathTex,
  FadeIn,
  FadeOut,
  Create,
  LaggedStart,
  dockLigand,
  detectInteractions,
  drawInteractions,
  type Atom3DSpec,
  type ResidueCA,
} from '../src/index.ts';

type Vec3 = [number, number, number];

// The whole complex sits a little low in the frame, above the label.
const DOWN: Vec3 = [0, 0, -1.8];

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 72 * (Math.PI / 180),
  theta: -105 * (Math.PI / 180),
  distance: 20,
  fov: 45,
});

// --- Receptor: helix up on the left, a loop over the top, helix down on the right.
const RISE = 1.5;
const TURN = (100 * Math.PI) / 180;
function helix(axisX: number, up: boolean, n: number): ResidueCA[] {
  return Array.from({ length: n }, (_, i) => {
    const z = (up ? i : n - 1 - i) * RISE - ((n - 1) * RISE) / 2;
    const t = i * TURN;
    return {
      code: 'A',
      ca: [axisX + 2.3 * Math.cos(t), 3 + 2.3 * Math.sin(t), z] as Vec3,
      ss: 'helix' as const,
    };
  });
}
const left = helix(-7, true, 7);
const right = helix(7, false, 7);
const loop: ResidueCA[] = [-3.5, 0, 3.5].map((x) => ({
  code: 'G',
  ca: [x, 4, 6.3 - Math.abs(x) * 0.3] as Vec3,
  ss: 'coil' as const,
}));
const residues = [...left, ...loop, ...right];

// --- Ligand in its docked pose: a benzene ring with a carboxyl, a hydroxyl and
// an amine. The ring lies in the x-z plane, facing the camera.
const ring = (deg: number, r: number): Vec3 => [
  r * Math.cos((deg * Math.PI) / 180),
  0,
  r * Math.sin((deg * Math.PI) / 180),
];
const ligandAtoms: Atom3DSpec[] = [
  ...[0, 60, 120, 180, 240, 300].map((d) => ({ element: 'C', position: ring(d, 1.4) })),
  { element: 'C', position: ring(0, 2.9) }, // 6  carboxyl C
  { element: 'O', position: [3.55, 0, 1.1] }, // 7  carboxyl O
  { element: 'O', position: [3.55, 0, -1.1] }, // 8  carboxyl O
  { element: 'O', position: ring(180, 2.76) }, // 9  hydroxyl O
  { element: 'N', position: ring(120, 2.8) }, // 10 amine N
  { element: 'H', position: ring(60, 2.48) },
  { element: 'H', position: ring(240, 2.48) },
  { element: 'H', position: ring(300, 2.48) },
];
const ligandBonds = [
  { from: 0, to: 1, order: 2 as const },
  { from: 1, to: 2 },
  { from: 2, to: 3, order: 2 as const },
  { from: 3, to: 4 },
  { from: 4, to: 5, order: 2 as const },
  { from: 5, to: 0 },
  { from: 0, to: 6 },
  { from: 6, to: 7, order: 2 as const },
  { from: 6, to: 8 },
  { from: 3, to: 9 },
  { from: 2, to: 10 },
  { from: 1, to: 11 },
  { from: 4, to: 12 },
  { from: 5, to: 13 },
];

// --- Polar side chains: each H-bond partner sits ~2.8 angstrom from a ligand
// atom, joined to the nearest helix CA by two carbons.
const partners: { element: string; position: Vec3 }[] = [
  { element: 'O', position: [-5.55, 0, 0.4] }, // Ser OG  ... ligand OH
  { element: 'N', position: [6.3, 0, 1.7] }, // Lys NZ  ... carboxyl O
  { element: 'N', position: [6.3, 0, -1.7] }, // Arg NH  ... carboxyl O
  { element: 'O', position: [-2.6, 0, 4.9] }, // Asp OD  ... amine N
];

function sideChains(protein: Protein): Molecule3D {
  const cas = protein.getCAPoints();
  const atoms: Atom3DSpec[] = [];
  const bonds: { from: number; to: number }[] = [];
  for (const p of partners) {
    const anchor = cas.reduce((best, ca) =>
      Math.hypot(ca[0] - p.position[0], ca[1] - p.position[1], ca[2] - p.position[2]) <
      Math.hypot(best[0] - p.position[0], best[1] - p.position[1], best[2] - p.position[2])
        ? ca
        : best,
    );
    const lerp = (t: number): Vec3 => [
      p.position[0] + (anchor[0] - p.position[0]) * t,
      p.position[1] + (anchor[1] - p.position[1]) * t,
      p.position[2] + (anchor[2] - p.position[2]) * t,
    ];
    const base = atoms.length;
    atoms.push(p, { element: 'C', position: lerp(0.35) }, { element: 'C', position: lerp(0.7) });
    bonds.push({ from: base, to: base + 1 }, { from: base + 1, to: base + 2 });
  }
  return new Molecule3D({
    atoms,
    bonds,
    style: 'ball-and-stick',
    radiusScale: 0.4,
    bondRadius: 0.13,
    colors: { C: '#b0b0b0' },
  });
}

// Render the binding-energy label once at load, so each run starts at once.
const energy = new MathTex({
  latex: '\\Delta G = -9.2\\ \\mathrm{kcal\\,mol^{-1}}',
  fontSize: 48,
  color: '#ffe066',
});
const ready = energy.waitForRender();

async function ligandDocking(scene: ThreeDScene) {
  await ready;
  const protein = new Protein({
    residues,
    representation: 'tube',
    colorMode: 'secondary-structure',
    tubeRadius: 0.45,
    smoothing: 8,
  });
  const chains = sideChains(protein);
  protein.shift(DOWN);
  chains.shift(DOWN);
  scene.add(protein, chains);

  const ligand = new Molecule3D({
    atoms: ligandAtoms,
    bonds: ligandBonds,
    style: 'ball-and-stick',
    radiusScale: 0.42,
    bondRadius: 0.12,
    // Light carbons so the ligand reads against the dark background.
    colors: { C: '#e0e0e0' },
  });
  // The docked pose is the ligand's own coordinates, moved down with the receptor.
  const home = ligand.getCenter();
  const target: Vec3 = [home[0] + DOWN[0], home[1] + DOWN[1], home[2] + DOWN[2]];
  scene.add(ligand);
  await scene.play(dockLigand({ ligand, target, startOffset: [-3, -9, 3], runTime: 1.3 }));

  // Hydrogen bonds between the polar side chains and the docked ligand.
  const found = detectInteractions(partners, ligandAtoms, { contactCutoff: 0 });
  const hBonds = drawInteractions(found, { hBondColor: '#7CFFB2' });
  hBonds.shift(DOWN);
  scene.add(hBonds);
  scene.addFixedInFrameMobjects(energy);
  energy.moveTo([0, -3.3, 0]);
  await scene.play(
    new LaggedStart(
      hBonds.children.map((hb) => new Create(hb, { duration: 0.4 })),
      { lagRatio: 0.3 },
    ),
    new FadeIn(energy, { duration: 0.6 }),
  );
  await scene.wait(0.8);
  await scene.play(
    new FadeOut(ligand, { duration: 0.4 }),
    new FadeOut(hBonds, { duration: 0.4 }),
    new FadeOut(energy, { duration: 0.4 }),
  );
}

let isAnimating = false;

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  playBtn.disabled = true;

  scene.clear();
  await ligandDocking(scene);

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

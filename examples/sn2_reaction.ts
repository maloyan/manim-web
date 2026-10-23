/**
 * SN2 reaction: hydroxide attacks bromomethane and bromide leaves.
 *
 * Two MoleculeMobject frames hold the same atoms in the same order: the
 * reactants and the products. Curved electron-pushing arrows show the attack
 * and the bond that breaks. Then the C-Br bond breaks, the O-C bond forms, and
 * the three hydrogens flip like an umbrella (Walden inversion). Every atom
 * label and the reaction equation are set in LaTeX with MathTex.
 */
import {
  Scene,
  MoleculeMobject,
  MathTex,
  ElectronPushingArrow,
  arrowBetweenAtoms,
  Create,
  FadeIn,
  FadeOut,
  Transform,
  VGroup,
  type AtomSpec,
  type BondSpec,
  type Animation,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

// One atom order for both frames: O, H (on O), C, H, H, H, Br.
const reactantAtoms: AtomSpec[] = [
  { element: 'O', x: -2.9, y: 0.3 },
  { element: 'H', x: -3.7, y: 0.75 },
  { element: 'C', x: 0, y: 0.3 },
  { element: 'H', x: -0.5, y: 1.25 },
  { element: 'H', x: -0.5, y: -0.65 },
  { element: 'H', x: -0.95, y: 0 },
  { element: 'Br', x: 1.75, y: 0.3 },
];
const productAtoms: AtomSpec[] = [
  { element: 'O', x: -1.45, y: 0.3 },
  { element: 'H', x: -2.3, y: 0.75 },
  { element: 'C', x: 0, y: 0.3 },
  { element: 'H', x: 0.5, y: 1.25 },
  { element: 'H', x: 0.5, y: -0.65 },
  { element: 'H', x: 0.95, y: 0 },
  { element: 'Br', x: 3.2, y: 0.3 },
];
// The first four bonds persist; the last one breaks (C-Br) or forms (O-C).
const keptBonds: BondSpec[] = [
  { from: 0, to: 1 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 2, to: 5, type: 'wedge' },
];
const reactantBonds = [...keptBonds, { from: 2, to: 6 }];
const productBonds = [...keptBonds, { from: 0, to: 2 }];

const COLORS = { C: '#f0f0f0', H: '#cfd8dc', O: '#ff5252', Br: '#ff9e40' };
const BOND_LENGTH = 1.8;
const LABEL_SIZE = 60;

const equation = new MathTex({
  latex: '\\mathrm{HO^{-}} + \\mathrm{CH_3Br} \\longrightarrow \\mathrm{HOCH_3} + \\mathrm{Br^{-}}',
  fontSize: 56,
});

/** A molecule frame whose element labels are MathTex instead of plain text. */
async function texMolecule(atoms: AtomSpec[], bonds: BondSpec[]) {
  const molecule = new MoleculeMobject({
    atoms,
    bonds,
    bondLength: BOND_LENGTH,
    showCarbonLabels: true,
    colors: COLORS,
  });
  const labels = await Promise.all(
    molecule.getAtoms().map(async (atom) => {
      if (atom.label) molecule.atomsGroup.remove(atom.label);
      const label = new MathTex({
        latex: `\\mathrm{${atom.element}}`,
        fontSize: LABEL_SIZE,
        color: atom.color,
      });
      await label.waitForRender();
      label.moveTo(atom.position);
      return label;
    }),
  );
  return { molecule, labels };
}

/** A TeX negative charge at the upper right of an atom. */
async function charge(at: [number, number, number], color: string) {
  const minus = new MathTex({ latex: '-', fontSize: 44, color });
  await minus.waitForRender();
  minus.moveTo([at[0] + 0.42, at[1] + 0.3, 0]);
  return minus;
}
/** Render every TeX piece once, at load, so each run starts on the first frame. */
async function prepare() {
  await equation.waitForRender();
  equation.moveTo([0, -3.1, 0]);
  const reactant = await texMolecule(reactantAtoms, reactantBonds);
  const product = await texMolecule(productAtoms, productBonds);
  // The charge moves from O (reactant) to Br (product).
  const oCharge = await charge(reactant.molecule.getAtoms()[0].position, COLORS.O);
  const brCharge = await charge(product.molecule.getAtoms()[6].position, COLORS.Br);
  return { reactant, product, oCharge, brCharge };
}
const ready = prepare();

/** The bond lines of a frame, one VGroup per bond, in bond order. */
const bondGroups = (m: MoleculeMobject) => m.getBonds().map((b) => new VGroup(...b.lines));

async function sn2Reaction(scene: Scene) {
  const { reactant, product, oCharge, brCharge } = await ready;
  // Fresh copies each run, so a loop restarts from the same reactant frame.
  const r = reactant.molecule.copy() as MoleculeMobject;
  const rLabels = reactant.labels.map((l) => l.copy() as MathTex);
  const rBonds = bondGroups(r);
  const pBonds = bondGroups(product.molecule.copy() as MoleculeMobject);
  const pLabels = product.labels.map((l) => l.copy() as MathTex);

  const oMinus = oCharge.copy() as MathTex;
  const brMinus = brCharge.copy() as MathTex;
  scene.add(...rBonds, ...rLabels, oMinus, equation);

  // Electron pushing: the O lone pair attacks C; the C-Br pair leaves onto Br.
  const atoms = r.getAtoms();
  const attack = arrowBetweenAtoms(r, 0, 2, {
    bulge: 0.3,
    direction: 'ccw',
    color: '#ff6fae',
  });
  const cBr: [number, number, number] = [
    (atoms[2].position[0] + atoms[6].position[0]) / 2,
    atoms[2].position[1] + 0.05,
    0,
  ];
  const leave = new ElectronPushingArrow({
    from: cBr,
    to: [atoms[6].position[0] + 0.2, atoms[6].position[1] - 0.35, 0],
    bulge: 0.5,
    direction: 'cw',
    color: '#ff6fae',
  });
  await scene.play(new Create(attack, { duration: 0.7 }), new Create(leave, { duration: 0.7 }));

  // The reaction: kept bonds and labels move, C-Br breaks, O-C forms.
  const moves: Animation[] = [];
  for (let i = 0; i < keptBonds.length; i++) {
    moves.push(new Transform(rBonds[i], pBonds[i], { duration: 1.1 }));
  }
  rLabels.forEach((label, i) => moves.push(new Transform(label, pLabels[i], { duration: 1.1 })));
  await scene.play(
    ...moves,
    new FadeOut(rBonds[4], { duration: 0.5 }),
    new Create(pBonds[4], { duration: 1.1 }),
    new FadeOut(attack, { duration: 0.4 }),
    new FadeOut(oMinus, { duration: 0.5 }),
    new FadeIn(brMinus, { duration: 1.1 }),
    new FadeOut(leave, { duration: 0.4 }),
  );
  await scene.wait(0.8);

  // Cross-fade back to the reactants for a seamless loop.
  const next = [...bondGroups(reactant.molecule.copy() as MoleculeMobject)];
  const nextLabels = reactant.labels.map((l) => l.copy() as MathTex);
  await scene.play(
    ...[...rBonds.slice(0, 4), pBonds[4], ...rLabels, brMinus].map(
      (m) => new FadeOut(m, { duration: 0.5 }),
    ),
    ...[...next, ...nextLabels, oCharge.copy()].map((m) => new FadeIn(m, { duration: 0.5 })),
  );
}

let isAnimating = false;

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  playBtn.disabled = true;

  scene.clear();
  await sn2Reaction(scene);

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

/**
 * SN2 reaction: hydroxide attacks bromomethane and bromide leaves.
 *
 * One progress value runs from the reactants (0) through the transition state
 * (0.5) to the products (1). Every frame, the atoms are placed for that value
 * and the bonds are moved: the C-Br bond fades to a dashed partial bond and
 * breaks, the O-C bond grows from a dashed partial bond to a full bond, and the
 * three hydrogens pass through a plane and flip like an umbrella (Walden
 * inversion). Curved electron-pushing arrows show the attack. Every atom label,
 * charge and the reaction equation are set in LaTeX with MathTex.
 */
import {
  Scene,
  MathTex,
  ElectronPushingArrow,
  Line,
  DashedLine,
  Polygon,
  Group,
  ValueTracker,
  Create,
  FadeIn,
  FadeOut,
} from '../src/index.ts';

type Vec3 = [number, number, number];

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

const SCALE = 1.8;
const Y0 = 0.55;
const COLORS = { C: '#f0f0f0', H: '#cfd8dc', O: '#ff5252', Br: '#ff9e40' };
const ARROW = '#ff6fae';
const ATOMS = ['O', 'H', 'C', 'H', 'H', 'H', 'Br'] as const;

// Atom positions (bond-length units) at the reactants, the transition state
// and the products. At the transition state O...C...Br is one line and the
// three hydrogens stand in the plane through C, perpendicular to it.
const REACTANT: [number, number][] = [
  [-2.9, 0],
  [-3.7, 0.45],
  [0, 0],
  [-0.5, 0.95],
  [-0.5, -0.95],
  [-0.95, -0.3],
  [1.75, 0],
];
const TRANSITION: [number, number][] = [
  [-1.95, 0],
  [-2.75, 0.45],
  [0, 0],
  [0, 1.05],
  [-0.35, -0.9],
  [0.35, -0.9],
  [2.1, 0],
];
const PRODUCT: [number, number][] = [
  [-1.45, 0],
  [-2.25, 0.45],
  [0, 0],
  [0.5, 0.95],
  [0.5, -0.95],
  [0.95, -0.3],
  [3.2, 0],
];

/** Atom positions in scene units at progress s in [0, 1]. */
function positions(s: number): Vec3[] {
  const [from, to, t] = s < 0.5 ? [REACTANT, TRANSITION, s * 2] : [TRANSITION, PRODUCT, s * 2 - 1];
  return from.map(([x0, y0], i) => {
    const [x1, y1] = to[i];
    return [(x0 + (x1 - x0) * t) * SCALE, (y0 + (y1 - y0) * t) * SCALE + Y0, 0];
  });
}

/** 0 outside [a, b], rising to 1 at the middle of [a, b]. */
const bump = (s: number, a: number, b: number) =>
  s <= a || s >= b ? 0 : Math.sin((Math.PI * (s - a)) / (b - a));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The segment from p to q, trimmed at both ends so it clears the labels. */
function trimmed(p: Vec3, q: Vec3, gap = 0.3): [Vec3, Vec3] {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = (dx / len) * gap;
  const uy = (dy / len) * gap;
  return [
    [p[0] + ux, p[1] + uy, 0],
    [q[0] - ux, q[1] - uy, 0],
  ];
}

/** The wedge triangle (toward the viewer): narrow at C, wide at H. */
function wedgeVertices(p: Vec3, q: Vec3): Vec3[] {
  const [a, b] = trimmed(p, q);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const w = 0.11;
  const nx = (-dy / len) * w;
  const ny = (dx / len) * w;
  return [a, [b[0] + nx, b[1] + ny, 0], [b[0] - nx, b[1] - ny, 0]];
}

/**
 * The bonds, built once. `update(s, alpha)` moves them to progress s and sets
 * their opacity; alpha fades the whole molecule in and out.
 */
function makeBonds() {
  const line = () => new Line({ color: '#ffffff', strokeWidth: 4 });
  const dashed = () => new DashedLine({ color: '#ffffff', dashLength: 0.2, strokeWidth: 4 });
  const oh = line();
  const ch1 = line();
  const ch2 = line();
  const ch3 = new Polygon({
    vertices: wedgeVertices([0, 0, 0], [1, 0, 0]),
    color: '#ffffff',
    fillOpacity: 1,
    strokeWidth: 0,
  });
  const cBr = line();
  const oc = line();
  const cBrPartial = dashed();
  const ocPartial = dashed();
  const set = (m: Line | DashedLine, p: Vec3, q: Vec3, opacity: number) => {
    const [a, b] = trimmed(p, q);
    m.setStart(a);
    m.setEnd(b);
    m.setStrokeOpacity(opacity);
  };
  const update = (s: number, alpha: number) => {
    const [O, HO, C, H1, H2, H3, Br] = positions(s);
    set(oh, O, HO, alpha);
    set(ch1, C, H1, alpha);
    set(ch2, C, H2, alpha);
    ch3.setVertices(wedgeVertices(C, H3));
    ch3.setFill('#ffffff', alpha);
    // C-Br: full bond -> dashed partial bond (transition state) -> broken.
    // O-C: none -> dashed partial bond -> full bond.
    const partialAlpha = bump(s, 0.15, 0.85);
    set(cBr, C, Br, alpha * clamp01(1 - s / 0.4));
    set(oc, O, C, alpha * clamp01((s - 0.6) / 0.4));
    set(cBrPartial, C, Br, alpha * partialAlpha);
    set(ocPartial, O, C, alpha * partialAlpha);
  };
  return { all: [oh, ch1, ch2, ch3, cBr, oc, cBrPartial, ocPartial], update };
}

const tex = (latex: string, color: string, fontSize = 60) =>
  new MathTex({ latex, color, fontSize });

const labels = ATOMS.map((el) => tex(`\\mathrm{${el}}`, COLORS[el]));
const oMinus = tex('-', COLORS.O, 44);
const brMinus = tex('-', COLORS.Br, 44);
const oDelta = tex('\\delta^{-}', COLORS.O, 40);
const brDelta = tex('\\delta^{-}', COLORS.Br, 40);
const dagger = tex('\\ddagger', '#ffffff', 56);
const equation = new MathTex({
  latex: '\\mathrm{HO^{-}} + \\mathrm{CH_3Br} \\longrightarrow \\mathrm{HOCH_3} + \\mathrm{Br^{-}}',
  fontSize: 56,
});
const ready = Promise.all(
  [...labels, oMinus, brMinus, oDelta, brDelta, dagger, equation].map((m) => m.waitForRender()),
);

async function sn2Reaction(scene: Scene) {
  await ready;
  const progress = new ValueTracker(0);

  // Bonds are redrawn every frame; labels and charges follow their atoms.
  const alpha = new ValueTracker(0);
  const bonds = makeBonds();
  bonds.update(0, 0);
  const bondLayer = new Group(...bonds.all);
  bondLayer.addUpdater(() => bonds.update(progress.getValue(), alpha.getValue()));
  const place = () => {
    const p = positions(progress.getValue());
    labels.forEach((label, i) => label.moveTo(p[i]));
    oMinus.moveTo([p[0][0] + 0.42, p[0][1] + 0.32, 0]);
    brMinus.moveTo([p[6][0] + 0.5, p[6][1] + 0.32, 0]);
    oDelta.moveTo([p[0][0], p[0][1] - 0.55, 0]);
    brDelta.moveTo([p[6][0], p[6][1] - 0.55, 0]);
    dagger.moveTo([p[6][0] + 0.75, p[3][1] + 0.1, 0]);
  };
  place();
  const labelLayer = new Group(...labels);
  labelLayer.addUpdater(place);
  equation.moveTo([0, -3.1, 0]);

  const molecule = [labelLayer, oMinus];
  scene.add(equation, bondLayer);
  await scene.play(
    alpha.animateTo(1, { duration: 0.35 }),
    ...molecule.map((m) => new FadeIn(m, { duration: 0.35 })),
  );

  // Electron pushing: the O lone pair attacks C; the C-Br pair leaves onto Br.
  const p0 = positions(0);
  const attack = new ElectronPushingArrow({
    from: [p0[0][0] + 0.25, p0[0][1] + 0.3, 0],
    to: [p0[2][0] - 0.3, p0[2][1] + 0.15, 0],
    bulge: 0.3,
    direction: 'ccw',
    color: ARROW,
  });
  const leave = new ElectronPushingArrow({
    from: [(p0[2][0] + p0[6][0]) / 2, p0[2][1] - 0.1, 0],
    to: [p0[6][0] + 0.1, p0[6][1] - 0.4, 0],
    bulge: 0.5,
    direction: 'cw',
    color: ARROW,
  });
  await scene.play(new Create(attack, { duration: 0.6 }), new Create(leave, { duration: 0.6 }));

  // Into the transition state: partial bonds, partial charges, the double dagger.
  await scene.play(
    progress.animateTo(0.5, { duration: 0.9 }),
    new FadeOut(attack, { duration: 0.3 }),
    new FadeOut(leave, { duration: 0.3 }),
    new FadeOut(oMinus, { duration: 0.6 }),
    new FadeIn(oDelta, { duration: 0.9 }),
    new FadeIn(brDelta, { duration: 0.9 }),
    new FadeIn(dagger, { duration: 0.9 }),
  );
  await scene.wait(0.5);

  // Out to the inverted product; the charge lands on bromide.
  await scene.play(
    progress.animateTo(1, { duration: 0.9 }),
    new FadeOut(oDelta, { duration: 0.6 }),
    new FadeOut(brDelta, { duration: 0.6 }),
    new FadeOut(dagger, { duration: 0.6 }),
    new FadeIn(brMinus, { duration: 0.9 }),
  );
  await scene.wait(0.7);

  // A clean fade to black (the equation stays), then the loop restarts.
  await scene.play(
    alpha.animateTo(0, { duration: 0.4 }),
    ...[...molecule, brMinus].map((m) => new FadeOut(m, { duration: 0.4 })),
  );
  bondLayer.clearUpdaters();
  labelLayer.clearUpdaters();
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

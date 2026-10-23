/**
 * DNA base pairing: a 3D double helix zips up, pair by pair, then unzips.
 *
 * A DNAHelix (threeD) lies on its side and rocks about its own axis. Its base
 * pairs fade in from left to right, each rung colored by base (A-T, G-C) with
 * the hydrogen bonds in the middle, then fade out again so the loop restarts.
 * The pairing rule is set in LaTeX with MathTex.
 */
import {
  ThreeDScene,
  DNAHelix,
  MathTex,
  FadeIn,
  FadeOut,
  LaggedStart,
  type Mobject,
  type BaseSymbol,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 75 * (Math.PI / 180),
  theta: -90 * (Math.PI / 180),
  distance: 9.5,
  fov: 45,
});
// A little extra ambient light, so the colors stay saturated on black.
scene.lighting.addAmbient({ intensity: 0.7 });

const SEQUENCE: BaseSymbol[] = ['A', 'T', 'G', 'C', 'G', 'A', 'T', 'C', 'G', 'A', 'T', 'G'];

// Full-saturation base colors, shared by the rungs and the TeX rule.
const BASE_COLORS: Record<BaseSymbol, string> = {
  A: '#00e676',
  T: '#ff1744',
  G: '#2979ff',
  C: '#ffd600',
};

// The pairing rule, each base in its rung color: A=T (2 H-bonds), G≡C (3).
const RULE: string[] = ['A', '=', 'T', '\\qquad', 'G', '\\equiv', 'C'];
const rule = new MathTex({
  latex: RULE.map((t) => (t in BASE_COLORS ? `\\mathrm{${t}}` : t)),
  fontSize: 60,
});
// Parts exist only after rendering, so color them once the render is done.
const ready = rule.waitForRender().then(() => {
  RULE.forEach((t, i) => {
    if (t in BASE_COLORS) rule.getPart(i).setColor(BASE_COLORS[t as BaseSymbol]);
  });
});

// One cycle: the pairs zip in, hold, zip out. The helix rocks about its axis
// with the same period, so back-to-back cycles join without a jump.
const PAIR_TIME = 0.4;
const LAG = 0.25;
const ZIP = PAIR_TIME * (1 + LAG * (SEQUENCE.length - 1));
const HOLD_IN = 1.2;
const HOLD_OUT = 0.2;
const CYCLE = 2 * ZIP + HOLD_IN + HOLD_OUT;
const ROCK = 0.55; // radians either way
const AXIS_Z = 0.25;

async function dnaBasePairing(scene: ThreeDScene, cycles: number) {
  await ready;
  const dna = new DNAHelix({
    threeD: true,
    turns: 2,
    basePairs: SEQUENCE.length,
    pitch: 4.2,
    radius: 1.3,
    sequence: SEQUENCE,
    // No beads: smooth backbones and solid rungs read cleaner. The tube and
    // rung radii scale with nucleotideRadius, so it sets their thickness.
    showNucleotides: false,
    nucleotideRadius: 0.26,
    backboneColors: ['#40c4ff', '#ff9100'],
    baseColors: BASE_COLORS,
    hBondColor: '#ffffff',
  });
  // Lay the helix on its side (axis along x).
  dna.rotate(Math.PI / 2, { axis: [0, 1, 0] });
  dna.moveTo([0, 0, AXIS_Z]);
  // Rock gently about its own (local z) axis, so the double helix reads as 3D.
  let time = 0;
  let angle = 0;
  dna.addUpdater((m: Mobject, dt: number) => {
    time += dt;
    const next = ROCK * Math.sin((2 * Math.PI * time) / CYCLE);
    m.rotate(next - angle, { axis: [0, 0, 1], aboutPoint: [0, 0, AXIS_Z] });
    angle = next;
  });

  scene.addFixedInFrameMobjects(rule);
  rule.moveTo([0, -3.25, 0]);
  scene.add(dna, rule);

  // The rung parts of every base pair, left to right.
  const pairs = dna
    .getBasePairs()
    .map((bp) =>
      [bp.startBase, bp.endBase, bp.hBond].filter((m): m is NonNullable<typeof m> => m !== null),
    );
  const zip = (out: boolean) =>
    new LaggedStart(
      pairs.map(
        (parts) =>
          new LaggedStart(
            parts.map((p) =>
              out
                ? new FadeOut(p, { duration: PAIR_TIME })
                : new FadeIn(p, { duration: PAIR_TIME }),
            ),
            { lagRatio: 0 },
          ),
      ),
      { lagRatio: LAG },
    );
  for (let i = 0; i < cycles; i++) {
    await scene.play(zip(false));
    await scene.wait(HOLD_IN);
    await scene.play(zip(true));
    await scene.wait(HOLD_OUT);
  }
}

const embed = new URLSearchParams(window.location.search).has('embed');

let isAnimating = false;

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  playBtn.disabled = true;

  scene.clear();
  await dnaBasePairing(scene, embed ? Infinity : 1);

  isAnimating = false;
  playBtn.disabled = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls and autoplay; the cycles repeat forever.
if (embed) {
  setTimeout(() => playBtn.click(), 500);
}

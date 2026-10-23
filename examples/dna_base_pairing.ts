/**
 * DNA base pairing: a 3D double helix zips up, pair by pair, then unzips.
 *
 * A DNAHelix (threeD) lies on its side and turns about its own axis. Its base
 * pairs fade in from left to right, each rung colored by base (A-T, G-C) with
 * the hydrogen bonds in the middle, then fade out again so the loop restarts.
 * The pairing rule is set in LaTeX with MathTex.
 */
import {
  ThreeDScene,
  DNAHelix,
  DNA_BASE_COLORS,
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

const SEQUENCE: BaseSymbol[] = [
  'A',
  'T',
  'G',
  'C',
  'G',
  'A',
  'T',
  'T',
  'C',
  'G',
  'A',
  'C',
  'G',
  'T',
];

// The pairing rule, each base in its rung color: A=T (2 H-bonds), G≡C (3).
const RULE: (BaseSymbol | string)[] = ['A', '=', 'T', '\\qquad', 'G', '\\equiv', 'C'];
const rule = new MathTex({
  latex: RULE.map((t) => (t.length === 1 && t !== '=' ? `\\mathrm{${t}}` : t)),
  fontSize: 60,
});
// Parts exist only after rendering, so color them once the render is done.
const ready = rule.waitForRender().then(() => {
  RULE.forEach((t, i) => {
    if (t in DNA_BASE_COLORS) rule.getPart(i).setColor(DNA_BASE_COLORS[t as BaseSymbol]);
  });
});

// One zip-unzip cycle lasts CYCLE seconds, and the helix turns once per cycle,
// so back-to-back cycles join without a jump.
const PAIR_TIME = 0.4;
const LAG = 0.2;
const HOLD = 0.56;
const CYCLE = 2 * (PAIR_TIME * (1 + LAG * (SEQUENCE.length - 1)) + HOLD);

async function dnaBasePairing(scene: ThreeDScene, cycles: number) {
  await ready;
  const dna = new DNAHelix({
    threeD: true,
    turns: 2.5,
    basePairs: SEQUENCE.length,
    pitch: 3.6,
    radius: 1.25,
    sequence: SEQUENCE,
    backboneStrokeWidth: 7,
    // Bright strands so the helix reads on black.
    backboneColors: ['#4fc3f7', '#ff8a65'],
  });
  // Lay the helix on its side (axis along x) and center it a little high.
  dna.rotate(Math.PI / 2, { axis: [0, 1, 0] });
  dna.moveTo([0, 0, 0.25]);
  // Spin about its own axis, so the double helix reads as 3D.
  dna.addUpdater((m: Mobject, dt: number) => {
    m.rotate((dt * 2 * Math.PI) / CYCLE, { axis: [0, 0, 1], aboutPoint: [0, 0, 0.25] });
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
    await scene.wait(HOLD);
    await scene.play(zip(true));
    await scene.wait(HOLD);
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

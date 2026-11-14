/**
 * Data of the `cell_tour_3d` example: the per-stop text and staging (captions,
 * callouts, camera framing), and two set pieces, the scale overlay and the
 * tissue field. The scene file adds the targets and the process animations.
 * The narration text is in `audio/cell_tour/lines.json`.
 */
import {
  Brace,
  Blob3D,
  Circle,
  Dot,
  InstancedMobject,
  MathTex,
  Membrane,
  NumberLine,
  Rectangle,
  Text,
  kitColor,
  linear,
  UpdateFromAlphaFunc,
  type Mobject,
  type TourStop,
  type Vector3Tuple,
} from '../src/index.ts';

export const BG = '#0E1117';
export const TEXT = '#ECEFF4';
export const DIM_TEXT = '#A9B1C1';

/** A line of manim text, centred at frame point (x, y). */
export const txt = (text: string, fontSize: number, x: number, y: number, color = TEXT) =>
  new Text({ text, fontSize, color }).moveTo([x, y, 0]);

/** The plain part of each stop, by narration id. The scene adds target, keep and onEnter. */
export const STOPS: Record<string, Partial<TourStop>> = {
  // The camera move is short and every caption row comes with it, so the
  // close-up inset is on screen early and for most of the stop.
  membrane: { reveal: 'all' },
  nucleus: {
    // A long move from the membrane: give it time.
    framing: { runTime: 3.2 },
    callouts: [
      { label: 'nucleolus', anchor: 'nucleolus', direction: [1, 0.6] },
      { label: 'DNA (chromatin)', anchor: 'chromatin', direction: [-1, 0.7] },
    ],
  },
  pores: {
    reveal: 'all',
    caption: {
      title: 'Nuclear pores',
      swatch: kitColor('nuclear pore'),
      body: 'Gates in the nuclear envelope. Messenger RNA leaves through them.',
    },
  },
  ribosome: { reveal: 'all' },
  rough_er: {
    callouts: [{ label: 'bound ribosomes', anchor: 'ribosome', direction: [-1, 0.7] }],
  },
  smooth_er: { callouts: [{ label: 'tubes', anchor: 'tube', direction: [1, 0.7] }] },
  golgi: {
    reveal: 'all',
    callouts: [
      { label: 'entry side', anchor: 'entrySide', direction: [-1, 0.6] },
      { label: 'exit side', anchor: 'exitSide', direction: [1, 0.6] },
    ],
  },
  mitochondria: {
    framing: { fill: 0.24, phi: 0.75 },
    callouts: [{ label: 'outer membrane', anchor: 'end', direction: [1, -0.5], distance: 3 }],
  },
  cristae: {
    framing: { fill: 0.85, phi: 0.6 },
    reveal: 'all',
    caption: {
      title: 'Cristae',
      swatch: kitColor('mitochondrion'),
      body: 'The folded inner membrane. More folds, more room to make ATP.',
    },
    callouts: [
      { label: 'cristae', anchor: 'cristae', direction: [0.6, 1], distance: 3.6 },
      { label: 'ATP is made here', anchor: 'matrix', direction: [-0.7, -1], distance: 3.4 },
    ],
  },
  lysosomes: {
    framing: { fill: 0.2, phi: 0.45 },
    reveal: 'all',
    callouts: [
      { label: 'acid inside, pH 5', anchor: 'lumen', direction: [-0.8, 0.8], distance: 3.2 },
    ],
  },
  peroxisomes: {
    // A long move from the lysosome: give it time.
    framing: { fill: 0.22, phi: 0.45, runTime: 3.2 },
    reveal: 'all',
  },
  centrosome: {
    callouts: [
      { label: 'centriole', anchor: 'mother', direction: [-1, 0.7] },
      { label: 'centriole', anchor: 'daughter', direction: [1, 0.7] },
    ],
  },
  // The legend card is driven by hand: each row appears with its filaments.
  microtubules: {
    framing: { fill: 0.78, phi: 0.75, theta: -1.35, screenOffset: [0, 1.1] },
    caption: null,
  },
  filaments: { framing: { fill: 0.78, phi: 0.75, theta: -1.1, screenOffset: [0, 1.1] } },
  crowded: {
    dim: false,
    framing: { fill: 0.72, phi: 0.95, theta: -1.25, screenOffset: [0, 0.9] },
    caption: {
      title: 'Packed, in real life',
      body: 'Billions of proteins fill the space between the organelles.',
    },
  },
};

/** The legend of the cytoskeleton stops: one row per filament kind. */
export const LEGEND = {
  title: 'Cytoskeleton',
  rows: [
    { color: kitColor('microtubule'), text: 'Microtubules: rails for motor proteins' },
    { color: kitColor('actin'), text: 'Actin: a mesh under the membrane' },
    { color: kitColor('intermediate filament'), text: 'Intermediate filaments: tough cables' },
  ],
};

/**
 * The membrane close-up of the inset: the bilayer with a protein channel, a
 * brace with its thickness, `outside` / `inside` labels, and three particles
 * waiting above the channel. `passThrough(duration)` moves them through it,
 * one after the other. Async: it waits for the MathTex label.
 */
export async function bilayerCloseUp() {
  const bilayer = new Membrane({ length: 4.2, spacing: 0.35, gaps: [[-0.42, 0.42]] });
  const h = bilayer.getTopY() - bilayer.getBottomY();
  const channel = [-0.27, 0.27].map((x) =>
    new Rectangle({ width: 0.24, height: h + 0.3, color: '#58C4DD', fillOpacity: 0.55 }).moveTo([
      x,
      0,
      0,
    ]),
  );
  const brace = new Brace(bilayer, { direction: [1, 0, 0], color: TEXT });
  const nm = new MathTex({ latex: '\\approx 5\\,\\text{nm}', color: TEXT, fontSize: 64 });
  await nm.waitForRender(); // the inset fits its content to the box: it needs the size
  const tip = brace.getTip();
  nm.moveTo([tip[0] + 1.1, tip[1], 0]);
  const outside = txt('outside', 30, -1.5, h / 2 + 0.45, DIM_TEXT);
  const inside = txt('inside', 30, -1.5, -h / 2 - 0.45, DIM_TEXT);
  const starts: Vector3Tuple[] = [
    [0, h / 2 + 0.45, 0],
    [0.55, h / 2 + 0.75, 0],
    [-0.5, h / 2 + 0.95, 0],
  ];
  const particles = starts.map((p) => new Dot({ point: p, radius: 0.1, color: '#9CDB43' }));
  const content: Mobject[] = [bilayer, ...channel, brace, nm, outside, inside, ...particles];
  // Paths are read on the first frame, after the inset has scaled the content.
  const passThrough = (duration: number) => {
    let paths: Vector3Tuple[][] | null = null;
    return new UpdateFromAlphaFunc(
      particles[0],
      (_m, alpha) => {
        if (alpha <= 0) return;
        if (!paths) {
          const c = channel[0].getCenter();
          const x = (c[0] + channel[1].getCenter()[0]) / 2;
          const drop = 1.3 * (particles[0].getCenter()[1] - c[1]);
          paths = particles.map((d) => {
            const p = d.getCenter();
            return [p, [x, p[1], 0], [x, c[1] - drop, 0]];
          });
        }
        paths.forEach((path, i) => {
          const t = Math.min(1, Math.max(0, (alpha - 0.25 * i) / 0.5));
          const e = t * t * (3 - 2 * t);
          const [a, b, c] = path;
          const p = e < 0.3 ? lerp(a, b, e / 0.3) : lerp(b, c, (e - 0.3) / 0.7);
          particles[i].moveTo(p);
        });
      },
      { duration, rateFunc: linear },
    );
  };
  return { content, passThrough };
}

const lerp = (a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Frame units per micrometre, and the height of the row of cells, in the scale overlay. */
export const UM = 0.1;
export const ROW = 0.6;

/**
 * The scale overlay (async: it waits for its MathTex label): a hair 100 µm wide with a ruler, and the outlines of
 * cells 2 to 5 across it. Slot 0 stays empty: the 3D cell lands there.
 */
export async function scaleOverlay() {
  const hair = new Rectangle({ width: 100 * UM, height: 2.6, color: '#8D6E63', fillOpacity: 0.35 });
  hair.moveTo([0, ROW, 0]);
  const ruler = new NumberLine({
    xRange: [0, 100, 20],
    length: 100 * UM,
    color: TEXT,
    includeNumbers: true,
    numberFontSize: 60,
  }).moveTo([0, 2.7, 0]);
  const slot = (i: number) =>
    new Circle({ radius: 10 * UM, color: kitColor('cell membrane'), fillOpacity: 0.3 }).moveTo([
      (-40 + 20 * i) * UM,
      ROW,
      0,
    ]);
  const cells = [1, 2, 3, 4].map(slot);
  // Brace and TeX label are placed by hand: BraceLabel drops a MathTex label in the HUD.
  const brace = new Brace(slot(0), { direction: [0, -1, 0], buff: 0.45, color: TEXT });
  const size = new MathTex({ latex: '\\approx 20\\,\\mu\\text{m}', color: TEXT, fontSize: 64 });
  await size.waitForRender();
  const tip = brace.getTip();
  size.moveTo([tip[0] + 0.4, tip[1] - 0.55, 0]);
  const unit = txt('µm', 56, 6.35, 2.4);
  const label = txt('a hair, about 100 µm wide', 50, 2.4, -1.35, '#D7CCC8');
  const all: Mobject[] = [hair, ruler, unit, ...cells, brace, size, label];
  return { hair, ruler, unit, cells, brace, size, label, all };
}

/**
 * A field of closed cells round the origin, one instanced crowd, nearest first,
 * and `grow(duration)`: each cell scales up from nothing in that order. (A
 * clip-based grow would cut each organic cell open while it builds.)
 */
export function tissueField() {
  // A seeded jitter, so the field is not a perfect grid and stays the same each run.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const spots: { p: Vector3Tuple; k: number }[] = [];
  for (let row = -7; row <= 7; row++)
    for (let col = -8; col <= 8; col++) {
      const p: Vector3Tuple = [
        col * 9.8 + (row % 2) * 4.9 + (rand() - 0.5) * 2.2,
        row * 8.6 + (rand() - 0.5) * 2.2,
        (rand() - 0.5) * 1.2,
      ];
      if (Math.hypot(p[0], p[1]) > 6) spots.push({ p, k: rand() });
    }
  spots.sort((a, b) => Math.hypot(a.p[0], a.p[1]) - Math.hypot(b.p[0], b.p[1]));
  const size = (k: number) => 0.86 + 0.22 * k;
  const field = new InstancedMobject({
    template: new Blob3D({ radius: 4, lobes: 5, lumpiness: 0.05, scale: [1.12, 0.98, 0.55] }),
    instances: spots.map(({ p, k }) => ({
      position: p,
      rotation: [0, 0, k * 6.28] as Vector3Tuple,
      scale: 1e-4,
      color: k < 0.35 ? '#E8A06A' : kitColor('cell membrane'),
    })),
  });
  field.setToonShading({ preset: 'manim', shadowStrength: 0.8, outline: { width: 2.5 } });
  const n = spots.length;
  const grow = (duration: number) =>
    new UpdateFromAlphaFunc(
      field,
      (_m, alpha) => {
        spots.forEach(({ k }, i) => {
          const t = Math.min(1, Math.max(0, (alpha - (0.7 * i) / n) / 0.3));
          const e = t * t * (3 - 2 * t);
          field.setInstanceTransform(i, { scale: Math.max(1e-4, e * size(k)) });
        });
      },
      { duration, rateFunc: linear },
    );
  return { field, grow };
}

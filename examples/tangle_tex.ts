import {
  Scene,
  NumberPlane,
  Arrow,
  Rectangle,
  TangleTex,
  makeTangle,
  makeMatrixTracker,
  applyMatrixLive,
  BLACK,
  BLUE,
  GREEN,
  YELLOW,
  TEAL,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

type Matrix2 = [[number, number], [number, number]];
const rotation = (k: number, t: number): Matrix2 => [
  [k * Math.cos(t), -k * Math.sin(t)],
  [k * Math.sin(t), k * Math.cos(t)],
];
const apply = (m: number[][], [x1, x2]: number[]) => [
  m[0][0] * x1 + m[0][1] * x2,
  m[1][0] * x1 + m[1][1] * x2,
];

// r = R x, with R a scaled rotation. Rest the mouse on R or x to expand it,
// drag any number left/right, or click a number to type it. r1 and r2 are
// read-only: they show the result and follow the other numbers.
const k0 = 1.5;
const t0 = 0.5;
const x0 = [1, 0.5];
const r0 = apply(rotation(k0, t0), x0);
const formula = new TangleTex({
  latex: String.raw`\vec r = \tanglematrix{R}\tanglematrix{X} = \begin{bmatrix}\tangle{r1} \\ \tangle{r2}\end{bmatrix}`,
  fontSize: 40,
  anchor: 'left',
  parameters: {
    k: { value: k0, min: 0, max: 3, step: 0.1, color: YELLOW, label: 'scale k' },
    t: {
      value: t0,
      min: -3.14,
      max: 3.14,
      step: 0.05,
      display: 'symbol',
      symbol: '\\theta',
      color: TEAL,
      label: 'angle theta',
    },
    r1: { value: r0[0], step: 0.01, color: GREEN, readOnly: true },
    r2: { value: r0[1], step: 0.01, color: GREEN, readOnly: true },
  },
  matrices: {
    R: {
      color: GREEN,
      entries: [
        [String.raw`\tangle{k}\cos\tangle{t}`, String.raw`-\tangle{k}\sin\tangle{t}`],
        [String.raw`\tangle{k}\sin\tangle{t}`, String.raw`\tangle{k}\cos\tangle{t}`],
      ],
      evaluate: ({ k, t }) => rotation(k, t),
    },
    // Number cells become parameters X_1_1 and X_2_1.
    X: {
      symbol: '\\vec x',
      entries: [[x0[0]], [x0[1]]],
      color: BLUE,
      cell: { min: -3, max: 3, step: 0.1 },
    },
  },
});

// A plane larger than the frame, so its edges stay out of view as it turns.
const plane = new NumberPlane({
  xRange: [-12, 12, 1],
  yRange: [-8, 8, 1],
  xLength: 24,
  yLength: 16,
});
const tracker = makeMatrixTracker(rotation(k0, t0));
const binding = applyMatrixLive(plane, tracker);
const result = new Arrow({
  start: [0, 0, 0],
  end: [r0[0], r0[1], 0],
  color: GREEN,
  strokeWidth: 6,
});

const pad = 0.25;
const backdrop = new Rectangle({ color: BLACK, fillOpacity: 0.85, strokeWidth: 0 });

/** Wrap the backdrop around the formula as it is now, so the plane's lines never cross it. */
function fitBackdrop(): void {
  backdrop.setWidth(formula.getWidth() + 2 * pad).setHeight(formula.getHeight() + 2 * pad);
  backdrop.moveTo(formula.getCenter());
}
// While a matrix animates open or closed, follow the formula every frame.
backdrop.addUpdater(fitBackdrop);

function update(): void {
  const R = formula.getMatrix('R') as Matrix2;
  const [[x1], [x2]] = formula.getMatrix('X');
  const r = apply(R, [x1, x2]);
  formula.setValue('r1', r[0]).setValue('r2', r[1]);
  tracker.setMatrix(R);
  binding.update();
  // Arrow.become() does not update an Arrow, so move its ends instead.
  result.putStartAndEndOn([0, 0, 0], [r[0], r[1], 0]);
  // makeTangle renders once the new glyphs are in; onBeforeRender refits the backdrop.
}

// Place the formula so that even fully expanded (both matrices open) it
// stays inside the frame: left edge fixed (anchor: 'left'), vertical center
// half the tallest height below the top.
const tallest = formula.copy().setExpanded('R', true).setExpanded('X', true);
await Promise.all([formula.waitForRender(), tallest.waitForRender()]);
const left = -6.9;
const top = 3.8;
formula.moveTo([left + pad, top - pad - tallest.getHeight() / 2, 0], [-1, 0, 0]);
fitBackdrop();

scene.add(plane, result, backdrop, formula);
makeTangle(formula, scene, { onChange: update, onBeforeRender: fitBackdrop });
scene.render();

// Embed mode: strip chrome and fill the viewport.
if (new URLSearchParams(window.location.search).has('embed')) {
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const cont = document.getElementById('container');
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
}

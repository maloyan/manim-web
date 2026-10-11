// Curated snippets for the playground example picker.
//
// Each snippet is self-contained manim-web scene code. It may use `import`
// statements and TypeScript syntax — the playground strips both before running
// (see prepare.ts) — and it receives a ready DOM element named `container`.

export interface PlaygroundExample {
  /** Stable id used in the picker and for lookups. */
  id: string;
  /** Human-readable label shown in the dropdown. */
  title: string;
  /** True when the snippet showcases a feature new to manim-web. */
  isNew: boolean;
  /** The scene source code. */
  code: string;
}

const squareToCircle = `import { Scene, Circle, Square, Create, Transform, FadeOut, BLUE, YELLOW } from 'manim-web';

const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
});

const square = new Square({ sideLength: 2, color: BLUE, strokeWidth: 4 });
await scene.play(new Create(square));
await scene.wait(0.3);

const circle = new Circle({ radius: 1.2, color: YELLOW, strokeWidth: 4 });
await scene.play(new Transform(square, circle));
await scene.wait(0.3);
await scene.play(new FadeOut(square));
`;

const sinePlot = `import { Scene, Axes, Create, BLUE, RED, WHITE } from 'manim-web';

const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#0d1117',
});

const axes = new Axes({
  xRange: [-5, 5, 1],
  yRange: [-1.5, 1.5, 1],
  tips: false,
  axisConfig: { color: WHITE },
});

const sine = axes.plot((x: number) => Math.sin(x), { color: BLUE });
const cosine = axes.plot((x: number) => Math.cos(x), { color: RED });

await scene.play(new Create(axes));
await scene.play(new Create(sine));
await scene.play(new Create(cosine));
`;

// NEW feature: additive blend mode makes overlapping shapes glow.
const blendModeGlow = `import { Scene, Circle, FadeIn, RED, GREEN, BLUE } from 'manim-web';

const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

const colors = [RED, GREEN, BLUE];
const anglesDeg = [90, 210, 330];

const circles = colors.map((color, i) => {
  const a = (anglesDeg[i] * Math.PI) / 180;
  const c = new Circle({ radius: 1.6, color, fillOpacity: 1, strokeWidth: 0 });
  // Additive blending: where the circles overlap, the colors add up and glow.
  c.setBlendMode('additive');
  c.moveTo([Math.cos(a), Math.sin(a), 0]);
  return c;
});

await scene.play(...circles.map((c) => new FadeIn(c)));
await scene.wait(0.5);
`;

// NEW feature: a draggable MovablePoint and a Slider drive a live graph.
const interactive = `import { Scene, Axes, Line, DecimalNumber, MovablePoint, Slider, ValueTracker, BLUE, YELLOW, WHITE } from 'manim-web';

const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

// y = amp * sin(x). The slider drives amp, the point drives the sample x.
const ampTracker = new ValueTracker(2);
const xTracker = new ValueTracker(1);
const graphFn = (x: number): number => ampTracker.getValue() * Math.sin(x);

const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1], tips: false });
let curve = axes.plot(graphFn, { color: BLUE });

const stem = new Line({ start: [0, 0, 0], end: [0, 0, 0], color: YELLOW });
stem.addUpdater(() => {
  const x = xTracker.getValue();
  stem.setStart(axes.c2p(x, 0));
  stem.setEnd(axes.c2p(x, graphFn(x)));
});

const readout = new DecimalNumber({ value: graphFn(1), numDecimalPlaces: 2, color: WHITE });
readout.addUpdater(() => {
  const x = xTracker.getValue();
  readout.setValue(graphFn(x));
  const p = axes.c2p(x, graphFn(x));
  readout.moveTo([p[0] + 0.6, p[1] + 0.4, 0]);
});

const syncDependents = () => {
  stem.update(0);
  readout.update(0);
  scene.render();
};

const point = new MovablePoint(scene, {
  point: axes.c2p(1, graphFn(1)),
  color: YELLOW,
  onChange: (pos) => {
    xTracker.setValue(axes.pointToCoords(pos)[0]);
    syncDependents();
  },
});
point.constrainToFunction((worldX: number) => {
  const coords = axes.pointToCoords([worldX, 0, 0]);
  return axes.c2p(coords[0], graphFn(coords[0]))[1];
});

const slider = new Slider(scene, {
  min: 0,
  max: 3,
  step: 0.1,
  value: 2,
  length: 4,
  center: [0, -2.6, 0],
  tracker: ampTracker,
  showLabel: true,
  color: BLUE,
  onChange: () => {
    curve.become(axes.plot(graphFn, { color: BLUE }));
    syncDependents();
  },
});

scene.add(axes, curve, stem, readout, point, slider);
scene.render();
syncDependents();
`;

export const examples: PlaygroundExample[] = [
  { id: 'square-to-circle', title: 'Square to circle', isNew: false, code: squareToCircle },
  { id: 'sine-plot', title: 'Plot sin & cos', isNew: false, code: sinePlot },
  { id: 'blend-glow', title: 'Blend mode glow (new)', isNew: true, code: blendModeGlow },
  {
    id: 'interactive',
    title: 'Interactive point + slider (new)',
    isNew: true,
    code: interactive,
  },
];

/** The snippet shown when the playground opens with no shared code. */
export const DEFAULT_EXAMPLE_ID = 'square-to-circle';

/** Find a snippet by id. */
export function getExampleById(id: string): PlaygroundExample | undefined {
  return examples.find((example) => example.id === id);
}

/** The default snippet's source code. */
export function defaultCode(): string {
  return getExampleById(DEFAULT_EXAMPLE_ID)?.code ?? examples[0].code;
}

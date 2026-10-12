---
name: manim-web
description: Write manim-web scenes (the browser/TypeScript port of Manim). Use when creating, editing, or debugging manim-web animations in HTML or TS. Covers the API differences from Python Manim, snippet patterns (geometry, Tex, graphs, 3D, updaters, interactivity, export), and a live edit→reload dev loop via watch.js.
---

# manim-web

manim-web is a TypeScript + WebGL (Three.js) + KaTeX port of Manim that runs in
the browser. There is no Python, no CLI, and no render-to-file step. A scene
mounts into a DOM element and animates live.

This file is a snippet-dense quick-reference. For depth (build commands, the
gauntlet, commit rules, geometry conventions) read **`AGENTS.md`** and
**`ARCHITECTURE.md`** at the repo root. For the full exported API, the single
source of truth is **`src/index.ts`** — every symbol below is exported there.

## Import and bundle

- npm (bundler): `import { Scene, Circle, Create } from 'manim-web';`
- Browser, no build: import the browser bundle from a CDN —
  `import { Scene, Circle, Create } from 'https://cdn.jsdelivr.net/npm/manim-web@latest/dist/manim-web.browser.js';`
- Subpath entries: `manim-web/react`, `manim-web/vue`, `manim-web/element`,
  `manim-web/browser`.

Colors (`BLUE`, `RED`, `GREEN`, `YELLOW`, `WHITE`, `BLACK`, ...), directions
(`UP`, `DOWN`, `LEFT`, `RIGHT`, `ORIGIN`, `IN`, `OUT`), and constants (`PI`,
`TAU`, `DEGREES`) are named exports — import them, do not use `np`-style or
module-qualified access.

## Differences from Python Manim — read first

1. **No `class MyScene(Scene)` with a `construct` method.** You create a
   `Scene` instance bound to a DOM element and call methods on it:
   `const scene = new Scene(container, { width, height, backgroundColor });`
2. **A scene needs a container.** Pass an `HTMLElement` (or `null` for a
   headless/Null render). Output size is `width`/`height` in pixels.
3. **camelCase everywhere.** `fillOpacity` not `fill_opacity`, `strokeWidth`
   not `stroke_width`, `sideLength` not `side_length`, `numDecimalPlaces` not
   `num_decimal_places`, `setColor` not `set_color`, `moveTo` not `move_to`.
4. **Options are a single object, not positional kwargs.**
   `new Circle({ radius: 1.5, color: BLUE, fillOpacity: 0.8 })`.
5. **`scene.play` / `scene.wait` are `async` — always `await` them.**
   `await scene.play(new Create(circle)); await scene.wait(1);`
6. **Tex/Text render asynchronously.** KaTeX/SVG and font-glyph extraction are
   async. Create the mobject, then `await mobject.waitForRender()` (Tex family)
   or `await mobject.loadGlyphs()` (Text stroke-draw) **before** you animate it.
7. **No CLI, no `-pql`, no file written to disk by default.** Export is a
   runtime call that produces a Blob / triggers a browser download
   (`scene.export(...)`, `exportAndDownloadPNG(...)`).
8. **`.animate` is a proxy you chain, then pass to `play`.**
   `await scene.play(circle.animate.shift([3, 0, 0]).scale(1.5));`
   Set per-animation duration with `.withDuration(sec)`.
9. **Updaters run only inside the `play`/`wait` loop.** Outside a loop (for
   example after a drag) call `mobject.update(0)` then `scene.render()`
   yourself, or rebuild the dependent mobject with `mobject.become(next)`.
10. **Logging goes through the logger, surfaced via `onLog`** — not
    `console.log`. See the live dev loop below.

## Snippets

### A scene in a container

```ts
import { Scene, Circle, Square, Create, Transform, FadeOut, BLUE } from 'manim-web';

const scene = new Scene(document.getElementById('container'), {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

const square = new Square({ sideLength: 3, color: BLUE, fillOpacity: 0.5 });
const circle = new Circle({ radius: 1.5 });

await scene.play(new Create(square));
await scene.play(new Transform(square, circle));
await scene.play(new FadeOut(square));
```

`scene.add(...mobjects)` places mobjects without animating. `scene.render()`
draws the current frame. `scene.clear()` removes everything. `scene.play`
accepts several animations at once: `await scene.play(new Create(a), new Create(b));`

### Animations: Create / Write / FadeIn / Transform / .animate

```ts
import { Create, Write, FadeIn, FadeOut, Transform, Text, WHITE } from 'manim-web';

const label = new Text({ text: 'Hello', fontSize: 48, color: WHITE });
await label.loadGlyphs();                 // needed before Write draws the outlines
await scene.play(new Write(label));
await scene.play(label.animate.shift([0, 1, 0]).setColor('#00ff88').withDuration(0.8));
await scene.play(new FadeOut(label));
```

### MathTex / Tex (async render)

```ts
import { MathTex, Tex, Write, ReplacementTransform } from 'manim-web';

// MathTex renders math via KaTeX to SVG vectors (the default, like Python Manim).
const eq = new MathTex({ latex: 'd(p, q) = \\sqrt{\\sum_{i=1}^n (q_i - p_i)^2}', fontSize: 48 });
await eq.waitForRender();                 // MUST await before animating
await scene.play(new Write(eq));

// Tex renders a text-mode LaTeX string.
const caption = new Tex({ latex: 'x^2 + y^2 = r^2' });
await caption.waitForRender();
await scene.play(new ReplacementTransform(eq, caption));
```

`MathTexImage` is a rasterized (texture) alternative with the same
`waitForRender()` contract. For LaTeX KaTeX cannot handle, the MathJax path
(`renderLatexToSVG`, `preloadMathJax`) and `Typst` / `MathTypst` are available.

### Graphing: Axes and plot

```ts
import { Axes, BLUE } from 'manim-web';

const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1], tips: false });
const curve = axes.plot((x) => Math.sin(x), { color: BLUE });
scene.add(axes, curve);
scene.render();

// Map data coords <-> world points:
const p = axes.c2p(1, Math.sin(1));       // coords -> world point [x, y, z]
const c = axes.pointToCoords(p);          // world point -> coords
```

Related graphing exports: `NumberPlane`, `ParametricFunction`,
`FunctionGraph`, `BarChart`, `VectorField`, `ComplexPlane`, `PolarPlane`.

### 3D: ThreeDScene + Surface

```ts
import { ThreeDScene, Surface, ThreeDAxes, WHITE } from 'manim-web';

const scene = new ThreeDScene(container, {
  width: 600,
  height: 400,
  backgroundColor: '#191919',
  phi: 75 * (Math.PI / 180),              // polar angle
  theta: -45 * (Math.PI / 180),           // azimuthal angle
  distance: 18,
  enableOrbitControls: true,
});

// `Surface` is the export alias of `Surface3D`.
const surface = new Surface({
  func: (u, v) => [u, v, Math.sin(u) * Math.cos(v)],
  uRange: [-3, 3],
  vRange: [-3, 3],
  uResolution: 32,
  vResolution: 32,
  color: WHITE,
  opacity: 0.8,
});
scene.add(new ThreeDAxes({}), surface);
scene.render();
```

Other 3D mobjects: `Sphere`, `Cube`, `Cylinder`, `Cone`, `Torus`, `Line3D`,
`Arrow3D`, `ParametricSurface`.

### Updaters and ValueTracker

```ts
import { Axes, ValueTracker, DecimalNumber, Line, YELLOW, WHITE } from 'manim-web';

const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1] });
const t = new ValueTracker(1);            // drives a sampled x

const stem = new Line({ start: [0, 0, 0], end: [0, 0, 0], color: YELLOW });
stem.addUpdater(() => {
  const x = t.getValue();
  stem.setStart(axes.c2p(x, 0));
  stem.setEnd(axes.c2p(x, Math.sin(x)));
});

const readout = new DecimalNumber({ value: 0, numDecimalPlaces: 2, color: WHITE });
readout.addUpdater(() => readout.setValue(Math.sin(t.getValue())));

scene.add(axes, stem, readout);
// Animate the tracker; updaters run each frame inside play().
await scene.play(t.animateTo(4, { duration: 2 }));
```

### Interactivity: Draggable, MovablePoint, Slider

```ts
import { makeDraggable, MovablePoint, Slider, ValueTracker, Circle, BLUE } from 'manim-web';

const circle = new Circle({ radius: 0.5, color: BLUE, fillOpacity: 0.8 });
scene.add(circle);
scene.render();

// Drag; constrain / snap optionally. onDrag fires after each move.
makeDraggable(circle, scene, {
  snapToGrid: 0.5,
  constrainY: [1, 1],                     // lock to y = 1
  onDrag: () => scene.render(),
});

// A point you can drag, reporting its world position.
const point = new MovablePoint(scene, { point: [1, 0, 0], color: BLUE, onChange: (pos) => { /* ... */ } });

// An in-scene slider bound to a ValueTracker.
const amp = new ValueTracker(2);
const slider = new Slider(scene, {
  min: 0, max: 3, step: 0.1, value: 2, length: 4, center: [0, -2.6, 0],
  tracker: amp, onChange: () => scene.render(),
});
```

### Export: PNG and video

```ts
import { exportAndDownloadPNG } from 'manim-web';

// Current frame to a PNG download (transparent optional).
await exportAndDownloadPNG(scene, 'frame.png', { transparent: true });

// Animated export (GIF / WebM) off the scene timeline.
await scene.export('animation.gif', { fps: 15, quality: 10, duration: 3, onProgress: (p) => {} });
await scene.export('animation.webm', { fps: 30, duration: 3 });
```

`exportFramePNG(scene, opts)` returns a `Blob` instead of downloading.
`WebCodecsExporter`, `sceneToSVG`, and `exportSlidesToPDF` cover other targets.

## Live dev loop (edit → reload) with watch.js

`watch.js` (next to this file) is a zero-dependency Node server for a tight
edit→reload loop with browser-log capture. Run `node watch.js` in a directory
with an `index.html` (it writes a starter `index.html` if none exists), open
`http://localhost:3000`, and every save to the file reloads the open page.

The page forwards manim-web logs to the server, so you can read them without a
headless browser:

```html
<script>
  new EventSource('/__reload').onmessage = () => location.reload();
</script>
<script type="module">
  import { Scene, Circle, Create, onLog } from 'https://cdn.jsdelivr.net/npm/manim-web@latest/dist/manim-web.browser.js';
  onLog((entry) => fetch('/__log', { method: 'POST', body: JSON.stringify(entry) }));
  const scene = new Scene(document.getElementById('container'), { width: 600, height: 360 });
  await scene.play(new Create(new Circle({ radius: 1.5 })));
</script>
```

Read captured logs with `curl http://localhost:3000/__logs` — each entry is
`{ level, message, timestamp }`, JSON-serializable and sanitized (tokens, keys,
and emails redacted). This is the loop to use when iterating on a scene: edit
the file, let the page reload, then check `/__logs` for errors.

## Looking up the API

- Public exports: **`src/index.ts`** (grep it for a class or function name
  before using it — do not guess names).
- How a mobject behaves: its source under `src/mobjects/`, `src/animation/`,
  `src/core/`. Each option interface (for example `CircleOptions`,
  `AxesOptions`, `Surface3DOptions`) sits beside its class.
- Runnable patterns: the `examples/` directory (paired `.html` + `.ts`).
- When installed from npm, the same files are under
  `node_modules/manim-web/dist` (types in `*.d.ts`).

## Style and reporting

- Follow **`AGENTS.md`**: camelCase, no `eslint-disable` (CI fails on any), no
  `any`, use the `logger` utility instead of raw `console.*` in `src/`.
- Run the gauntlet before a PR (`npm run typecheck && npm test && npm run lint
  && npm run format:check && npm run lint:no-disable && npm run knip && npm run
  build`). `main` is protected — open a PR from a branch.
- Conventional Commits; scope is the issue number (`feat(#381): ...`).
- Report a bug as a GitHub issue on `maloyan/manim-web` with a minimal
  reproduction (an `index.html` that runs through `watch.js` is ideal) and the
  relevant `/__logs` output.

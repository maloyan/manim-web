# Architecture

This is a map of how manim-web is built. It is a V1: it covers the main flow and
the core invariants. It is not exhaustive.

Each topic has two parts:

- **Invariants** — rules the code must keep. Breaking one is a bug.
- **Implementation** — how the current code keeps the invariant. This can change.

manim-web renders mathematical animations in the browser with WebGL, through
[Three.js](https://threejs.org/). It is a TypeScript port of Python
[Manim](https://www.manim.community/). There is no Python and no server.

## The big picture

```
Mobject ── add() ──▶ Scene ── play() ──▶ Timeline ──▶ Renderer ──▶ WebGL canvas
  │                    │                    │             │
  shape data       owns the           schedules       draws Three.js
  + transform      mobject set        animations       objects
```

- A **Mobject** is a thing on screen: a shape, text, a graph, or a group.
- A **Scene** owns a set of mobjects, a camera, and a renderer.
- A **Timeline** schedules animations over time and drives each frame.
- A **Renderer** draws the Three.js objects to the canvas.

## Scene, add, and play

Files: `src/core/Scene.ts`, `src/animation/Timeline.ts`,
`src/animation/MasterTimeline.ts`.

### Invariants

- `add(mobject)` makes a mobject part of the scene. It does **not** animate.
- `play(...animations)` advances time. It renders every frame until the
  animations finish, then resolves its promise.
- `wait(duration)` holds the current frame for `duration` seconds. It renders
  per frame only when an updater needs it; otherwise it renders once.
- `play()` and `wait()` are `async`. Code that runs animations in order must
  `await` each call.
- One frame renders the scene at one point in time. Frame order never goes
  backward during `play()`.

### Implementation

- `add()` does not draw at once. It schedules one render through a microtask
  (`_pendingRender`). A following `play()` sets `_suppressAutoRender` and drops
  that pending render, so the viewer never sees a flash of the pre-animation
  state (issue #317).
- `play()` builds a `Timeline`, adds the animations in parallel, then runs a
  `requestAnimationFrame` loop. Each tick computes `dt`, calls
  `timeline.update(dt)`, and calls `render()`.
- `MasterTimeline` is the timeline used for presentation playback. It supports
  `seek(time)` to jump to any point. On seek it resets all animations and
  re-applies them from the start, so a backward jump is correct.
- The frame rate is capped by `targetFps` (default 60).

## Mobject taxonomy

Files: `src/core/Mobject.ts`, `src/core/VMobject.ts`, `src/core/Group.ts`,
`src/core/VGroup.ts`.

Each class below says what you are allowed to put in it.

| Class      | Extends      | Holds                       | Use it for                                             |
| ---------- | ------------ | --------------------------- | ------------------------------------------------------ |
| `Mobject`  | — (abstract) | a transform and children    | a base class, or any non-vector object (3D meshes)     |
| `VMobject` | `Mobject`    | cubic Bezier points + style | any 2D vector shape: circle, polygon, path, text glyph |
| `Group`    | `Mobject`    | child mobjects of any kind  | grouping mixed objects; moves them together            |
| `VGroup`   | `VMobject`   | child **VMobjects** only    | grouping vector shapes; shares stroke/fill operations  |

Rules:

- Put a vector shape in a `VMobject` subclass. Its geometry is a list of cubic
  Bezier points, not a mesh.
- Put a mix of objects (a 3D mesh plus a label) in a `Group`.
- Put only `VMobject`s in a `VGroup`. A `VGroup` assumes its children have
  points and stroke/fill style.
- A mobject has one parent at a time. Adding it to a second group removes it
  from the first.

## The dirty flag and synchronization

Files: `src/core/Mobject.ts`, `src/core/MobjectState.ts`.

### Invariants

- A mobject's world matrix and its Three.js object must match the mobject's
  logical state before a render reads them.
- A change to a parent transform must reach every descendant.

### Implementation

- A change marks the mobject dirty with `_markDirty()`. This flag walks
  **upward** so an ancestor knows a subtree changed, and lets a sync pass skip
  clean subtrees. Reverting `_markDirty` to mark only self silently breaks the
  root-sync invariant (see the long comment in `Mobject.ts`).
- There are two kinds of change:
  - A **transform** change (move, rotate, scale) only updates matrices.
  - A **geometry** change (new points) also rebuilds the Three.js object.
- `_syncWorldMatrices()` / `_syncToThree()` run before a render and push the
  logical state into Three.js. They recurse only into dirty subtrees.

## Rendering a VMobject

Files: `src/core/VMobjectRendering.ts`, `src/rendering/BezierRenderer.ts`,
`src/rendering/BezierShaderMaterial.ts`.

A `VMobject` is a set of cubic Bezier curves with a stroke and a fill. There are
two stroke paths:

- **Line2** (`three/examples/jsm/lines/Line2.js`) — the default. The curve is
  sampled into points and drawn as a thick polyline with `LineMaterial`. Line2
  is cached and updated in place so a geometry change does not dispose and
  recreate the mesh.
- **BezierRenderer** — a GPU path. Each cubic Bezier segment becomes one
  instance of a screen-aligned quad. A fragment shader evaluates a signed
  distance field per pixel, giving anti-aliased strokes with round caps. The
  `BezierRenderer` is shared and lazy-initialized.

Both paths need the canvas resolution to size strokes in pixels. The Scene sets
the resolution and updates it on resize.

The fill is triangulated from the curve outline (see `src/utils/`, `earcut`,
`polygon-clipping`) and drawn as a mesh.

## Animations and rate functions

Files: `src/animation/Animation.ts`, `src/rate-functions/index.ts`, and the
folders `src/animation/creation`, `fading`, `movement`, `composition`,
`growing`, `indication`.

### Invariants

- An animation maps a progress value `alpha` in `[0, 1]` to a mobject state.
- `begin()` runs once before the first frame and snapshots the start state.
- `interpolate(alpha)` is pure in `alpha`: the same `alpha` gives the same
  state. It does not read wall-clock time.
- `finish()` runs once after the last frame and leaves the mobject in its exact
  end state.

### Implementation

- `Animation.update(rawAlpha)` is the per-frame entry point. It calls `begin()`
  on the first frame, maps raw progress through the rate function
  (`alpha = rateFunc(rawAlpha)`), calls `interpolate(alpha)`, and calls
  `finish()` at the end.
- A **rate function** shapes time: `linear`, `smooth` (the default),
  `easeInOut`, `thereAndBack`, and more live in `src/rate-functions/index.ts`.
  `rushInto`, `reverse(fn)`, and `compose(a, b)` build new ones.
- `AnimationGroup` and `LaggedStart` run several animations together, with an
  optional lag between their starts.

## The presentation timeline and opacity

File: `src/animation/MasterTimeline.ts`.

### Invariants

- A mobject that an animation has not yet introduced is hidden (opacity 0).
- Seeking to any time shows the correct frame, including each mobject's correct
  opacity.

### Implementation

- `MasterTimeline` saves each mobject's original opacity when its segment is
  added, before any seek hides it.
- `seek(time)` restores every saved opacity, replays from the start, then hides
  mobjects whose introducing segment starts after `time`.
- `update(dt)` restores the original opacity of a mobject at the moment its
  segment begins, so the animation does not multiply by a stale `opacity = 0`.

This opacity bookkeeping is the subtlest part of playback. Change it with a
test that seeks forward and backward across a segment boundary.

## Text and MathTex

Files: `src/mobjects/text/`.

- `Text` renders with a font (via `opentype.js`) into VMobject glyph outlines.
- `MathTex` / `Tex` render LaTeX with KaTeX, then convert the output to shapes.
- Font and LaTeX setup is **async**. The glyphs are not ready on the frame the
  mobject is constructed. The Scene handles async mobjects: it waits for them to
  resolve, then renders. If an async load fails, the logger reports it and the
  frame renders without that mobject rather than throwing.

## Camera and 3D

Files: `src/core/Camera.ts`, `src/core/Camera2DFrame.ts`,
`src/core/ThreeDScene.ts`, `src/mobjects/three-d/`.

- The default camera is 2D (`Camera2D`). The frame is 14 by 8 world units, the
  Manim standard. The Scene maps these units to the canvas size.
- 3D scenes (`ThreeDScene`, `SpecialThreeDScene`) use a perspective camera and
  support orbit controls.
- 3D mobjects (`Sphere`, `Cube`, `Surface3D`, ...) are `Mobject`s backed by
  real Three.js meshes, not Bezier curves.

## Interaction

Files: `src/interaction/`.

- `Draggable`, `Hoverable`, `Clickable` wrap a mobject and attach pointer
  handlers. `OrbitControls` rotate a 3D camera. `Slider` and `MovablePoint` are
  interactive controls.
- A manual interaction renders on demand. The Scene gates these renders with
  `isRenderLoopActive` so a manual render does not fight the `play()` loop
  (issue #419).

## Export

Files: `src/export/`.

- `GifExporter` records frames and encodes a GIF (`gif.js`).
- `WebCodecsExporter` / `VideoExporter` encode MP4 or WebM (`mp4-muxer`,
  `webm-muxer`) through the browser WebCodecs API.
- `FrameExporter` captures single frames.
- Export drives the scene frame by frame, off the real-time clock, so the output
  frame rate is exact.

## The Player

Files: `src/player/`.

`Player` wraps a `Scene` with a presentation UI: play/pause, previous/next
segment, timeline scrubbing, keyboard shortcuts, speed control, and fullscreen.
Build a scene inside `player.sequence(async (scene) => { ... })`. The Player
records the segments so the viewer can scrub and replay.

## Mobjects layout

`src/mobjects/` groups mobjects by kind:

| Folder                                                 | Holds                                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| `geometry`                                             | Circle, Square, Polygon, Arc, Arrow, Line, Star |
| `graphing`                                             | Axes, NumberPlane, FunctionGraph, VectorField   |
| `graph`                                                | network graphs (nodes and edges)                |
| `text`                                                 | Text, MathTex, Tex, Paragraph                   |
| `three-d`                                              | Sphere, Cube, Cylinder, Torus, Surface3D        |
| `table`                                                | Table                                           |
| `matrix`                                               | Matrix                                          |
| `probability`                                          | bar charts and probability shapes               |
| `svg`                                                  | SVG import to VMobject                          |
| `value-tracker`                                        | ValueTracker for animated numbers               |
| `image`, `video`, `frame`, `fractals`, `logo`, `point` | the rest                                        |

## Integrations

Files: `src/integrations/`.

- `react.tsx` — the `ManimScene` component and hooks (`useScene`, `useMobject`,
  `useAnimation`, `useUpdater`). Build the scene in the `onSceneReady` callback.
- `vue.ts` — the `ManimScene` component and composables. Build the scene in the
  `ready` event handler.
- `webcomponent.ts` — the `<manim-scene>` custom element. It loads a scene from
  a module that default-exports a factory `(container) => Scene`. It is
  import-safe in Node/SSR; call `registerManimElement()` in the browser to
  define the tag.

## Utilities

File tree: `src/utils/`.

Math and geometry helpers live here. Before writing vector math, check this
folder. `vectors.ts` holds the low-level 3-vector operations; `math.ts` holds
plane and basis helpers built on top. See `AGENTS.md` -> "Geometry
conventions" for the rules on using them.

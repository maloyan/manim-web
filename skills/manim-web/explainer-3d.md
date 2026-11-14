# Recipe: narrated 3D explainer video

Use this when the task is "make a 3D explainer / tour / narrated video" with
manim-web (a cell, an engine, a molecule, any 3D model). The output is a page
that plays live in the browser and renders to mp4 from the command line.

Guides with every option: `docs/docs/3d-explainer-videos.mdx` and
`docs/docs/biology-3d-cell.mdx`. Working examples: `examples/explainer_direction.ts`
(tour over plain solids), `examples/cell_3d.ts` (cell build-up + tour),
`examples/narrated_export.ts` (narration + render), `examples/cell_tour_3d.ts`
(the full narrated cell tour).

## Call order

1. `new ThreeDScene(container, { width, height, phi, theta, distance, fov, backgroundColor })`,
   then `scene.lighting.addAmbient({ intensity: 0.5 })`.
2. Build every mobject once: shapes (`Capsule3D`, `Blob3D`, `Shell3D`, `Extrude3D`,
   `TubeNetwork3D`, `TubeFromPoints`, `Sphere`, ...) or a kit (`new Cell3D({ preset: 'animal' })`).
3. `scene.add(...)`, then `applyManimStyle3D(scene)` (a `Cell3D` already has the look).
4. Build-up: `scene.play(new Create3D(m))`, `new GrowAlongPath3D(tube)`, or `cell.buildAnimation()`.
5. Tour: `const tour = new ExplainerTour(scene)`; per stop start the clip with
   `narrate(scene, url, { wait: false })`, then `tour.playStop({ target, caption, callouts, narration: clip.duration })`.
6. `await tour.finish(); tour.dispose();`
   For a `Cell3D`, use `new CellTour(scene, cell)`: it also clears the free
   ribosomes in front of each focused organelle.
7. `registerRender(scene, { construct })` with steps 4 to 6 inside `construct`.
8. Put the page at `examples/<name>.html` + `examples/<name>.ts` and run
   `npm run render -- <name> --width 1080 --height 1080 --fps 30 --bitrate 6000000 --out <name>.mp4`.

## Smallest working scene

`examples/my_tour.html` holds `<div id="container"></div>` and
`<script type="module" src="./my_tour.ts"></script>`. `examples/my_tour.ts`:

```ts
import {
  ThreeDScene,
  Blob3D,
  Shell3D,
  Create3D,
  LaggedStart,
  ExplainerTour,
  applyManimStyle3D,
  narrate,
  registerRender,
  MAROON_C,
  GOLD_C,
} from '../src/index.ts'; // 'manim-web' outside this repo

const scene = new ThreeDScene(document.getElementById('container')!, {
  width: 1080,
  height: 1080,
  backgroundColor: '#11131A',
  phi: 1.1,
  theta: -1.2,
  distance: 12,
  fov: 35,
});
scene.lighting.addAmbient({ intensity: 0.5 });

const shell = new Shell3D({
  outerRadius: 2,
  thickness: 0.15,
  cutOffset: 0.3,
  color: GOLD_C,
  opacity: 0.45,
});
const core = new Blob3D({ radius: 0.8, lobes: 10, seed: 3, color: MAROON_C }); // opaque inside translucent
scene.add(shell, core);
applyManimStyle3D(scene);

async function construct(s: ThreeDScene): Promise<void> {
  await s.play(
    new LaggedStart(
      [shell, core].map((m) => new Create3D(m)),
      { lagRatio: 0.3 },
    ),
  );
  const tour = new ExplainerTour(s);
  const clip = await narrate(s, './audio/my_tour/core.mp3', { wait: false });
  await tour.playStop({
    target: core,
    caption: { title: 'Core', body: 'Ten lobes around one centre.', swatch: MAROON_C },
    callouts: [{ label: 'lobe', direction: [1, 0.7] }],
    narration: clip.duration,
  });
  await tour.finish();
  tour.dispose();
}

registerRender(scene, { construct });
if (new URLSearchParams(location.search).has('embed')) void construct(scene);
```

Make the clips before the render, from a recorded voice or a local TTS. On macOS:
`say -o core.aiff "The core." && ffmpeg -i core.aiff examples/audio/my_tour/core.mp3`.
For a natural voice, copy `examples/audio/cell_tour/generate.mjs` (Kokoro-82M, local,
Apache-2.0; text in `lines.json`, optional `speak` field per line for abbreviations). Check names with `src/index.ts` (or the MCP server in
`mcp/`) before you use them.

## Traps

- Camera: use `scene.focusOn(target, opts)` or `new CameraFocus(scene, target, opts)`.
  `moveCamera` runs its own loop: the Player cannot seek it and the mp4 does not show it.
- Translucent parts: build them up with `Create3D`. `FadeIn` ends at opacity 1 and makes them opaque.
- Keep inner parts opaque inside a translucent shell. A translucent mesh inside
  another translucent mesh can vanish.
- Build mobjects once, then move them (in an updater or an animation). Do not
  create mobjects inside an updater: they do not render reliably.
- Narration must be audio files (`narrate`, `audioManager.addSound`). Browser
  text-to-speech (`Voiceover` + `speechSynthesis`) is not captured in the export.
- `applyManimStyle3D(scene)` styles only what the scene holds now. Mobjects added
  later need `applyManimStyle3D(m)` or `m.setToonShading()`.
- To mark a 3D mesh use `FocusRing` or `Indicate`. `Circumscribe` and `Flash` do not frame 3D meshes.
- Play your own animations inside a tour stop through the `player` argument of
  `onEnter(scene, stop, player)`, so they land on the tour timeline.
- `InsetPanel` does not clip its content by default; scale the content to fit the box.
- `Cell3D` layout is tuned for `cutaway: 'bowl'`. With `'wedge'` some contents float.
  An organelle with no free spot is left out: read ids from `cell.organelleIds`.
- Call `dispose()` on a tour (or on callouts and rings you made by hand) when it is done:
  until then they follow their anchors every frame.
- `FadeOut` fades the root only. For a `NumberLine` (or any group whose parts
  keep their own opacity) fade each member: `m.getFamily().map((x) => new FadeOut(x))`.
- The default render bitrate gives about 115 MB for 136 s at 1080x1080; pass
  `--bitrate 6000000` (or lower) for a smaller file.
- `MathTex` `fontSize` is in points (default 48), not a scale factor.
- `BraceLabel` with a `MathTex` label does not show in the fixed-in-frame layer and
  blanks an `InsetPanel`. Place a `Brace` and a `MathTex` by hand.
- `FocusDim` mutes neighbour rims by default (`mute: 0.9`). Pass
  `occlusion: { target, camera: () => focusCamera(scene, target, framing) }` to hide
  what stands in front of the target (`CellTour` does this for you).
- Width and height of the render must be even. Without Google Chrome the
  script writes WebM and prints the `ffmpeg` command for mp4.

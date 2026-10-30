# Frame-time benchmark

Measures how much work each animation frame costs, in a real browser, through
the real `Scene.play()` path.

```bash
npm run bench -- --label before                 # writes bench/results/before.json
# ...make a change...
npm run bench -- --label after
npm run bench -- --compare bench/results/before.json bench/results/after.json
```

`--compare` prints the timing deltas and a per-pixel diff of the mid and end
frames of every scene, so a performance change can show that it renders the
same image.

| Flag           | Meaning                                                        |
| -------------- | -------------------------------------------------------------- |
| `--label NAME` | Result file name. Default `current`.                           |
| `--runs N`     | Timed runs per scene, after one warm-up. Medians are reported. |
| `--throttle X` | CDP CPU throttling, e.g. `4` to approximate a low-end laptop.  |
| `--scene NAME` | Run only this scene. Repeatable.                               |
| `--profile`    | Print the top self-time functions from a CPU profile.          |
| `--headed`     | Show the browser window.                                       |

## How it measures

- `requestAnimationFrame` and `performance.now()` are replaced with a virtual
  60 fps clock. Every run steps the same frames with the same `dt`, so frames
  are pixel-identical between runs of the same code.
- Each frame is timed twice: `cpu` is the rAF callback (timeline update,
  updaters, render submit); `total` adds `gl.finish()` so queued GPU work is
  counted.
- Draw calls and triangles come from `renderer.info` and are the per-frame
  maximum. `heapDeltaMB` is the JS heap growth across the animation (GC
  pressure).
- Chromium runs headless with the real GPU where available (`--use-angle=d3d11`
  on Windows). The GPU string is stored in the result file; compare results
  only from the same machine.

## Scenes

Defined in `scenes.ts`. Each targets a different cost:

| Scene                   | Stresses                                                 |
| ----------------------- | -------------------------------------------------------- |
| `transform-shapes`      | 50 `Transform`s: per-frame point interpolation + rebuild |
| `numberplane-pointwise` | `ApplyPointwiseFunction` on a `NumberPlane`              |
| `mathtex-transform`     | `TransformMatchingTex` on glyph fills                    |
| `create-curves`         | `Create` on 40 dense `ParametricFunction`s               |
| `updaters`              | 300 mobjects with per-frame updaters                     |
| `animate-shift`         | 100 `.animate.shift().rotate()` (rigid motion)           |

# ManimCE visual parity harness

Renders the same scenes with ManimCE and with manim-web and compares them
frame by frame, so parity is measured on what the viewer sees, not on symbol
names.

```bash
pip install manim==0.22.0        # plus a LaTeX install for MathTex
MANIMCE_PYTHON=python npm run parity
npm run parity -- --scene CreateCircle --every 2
```

Output in `parity/results/`:

- `report.md` / `report.json`: per scene, mean and minimum SSIM, the time of
  the worst frame, and both scene lengths in frames.
- `<Scene>-worst.png`: the worst frame side by side
  (ManimCE | manim-web | difference ×3).

## How it compares

- `scenes.py` holds ManimCE scenes; `scenes.ts` holds manim-web twins with the
  same names, mobjects, options and run times. Where manim-web supports the
  ManimCE idiom (`x.animate.set_value(...)`), the twin uses it, so the harness
  also checks that the idiom works.
- ManimCE renders at 720p30 (cached until `scenes.py` changes) and ffmpeg
  extracts every frame.
- The twin runs in Chromium under a **virtual 30 fps clock**:
  `requestAnimationFrame`, `setTimeout`/`setInterval` and `performance.now()`
  all read virtual time. Frame `i` is captured at virtual time `i / 30`, the
  same timestamp as ManimCE's frame `i`.
- Each captured frame is scored with SSIM on 1/4-scale grayscale, **counting
  only windows with content** in either image. On a mostly-black frame plain
  SSIM is dominated by the empty background and hides real differences.
- Each frame is matched against ManimCE frames `i-1`, `i`, `i+1`, and the best
  match counts, so a one-frame scheduling offset is not reported.
- A scene passes when its minimum SSIM is at least `--threshold` (default 0.8).

Both sides use a black background (`#000000`), so the theme default
(`#1C1C1C`) does not dominate the score.

## Adding a scene

Add a `Scene` subclass to `scenes.py` and a function with the same name to
`SCENES` in `scenes.ts`. Keep them in lockstep. Prefer scenes from the ManimCE
tutorial and example gallery: they are what users port first.

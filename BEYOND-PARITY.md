# Beyond ManimCE Parity

manim-web reached 100% feasible API parity with ManimCE 0.22.0 (see `PARITY.md`).
This document records the next step: the capabilities that ManimCE **lacks** and that
a browser port can add, driven by a survey of what users say they miss.

## Method

In 2026-10 we surveyed user demand from Reddit, Hacker News, the ManimCommunity and
3b1b GitHub issues/discussions, and competing animation tools (Motion Canvas, Theatre.js,
Remotion, GSAP, Rive, Desmos). We ranked the pain points, kept the ones a browser port can
solve or exceed, and shipped them. Each row below cites the pain and the manim-web response.

## Top ManimCE pain points and the manim-web response

| ManimCE pain (source) | manim-web response | Since | Code |
| --- | --- | --- | --- |
| Slow edit→render loop; no instant preview (HN 31637740, slama.dev) | Live WebGL render + `Player` scrub/seek + in-browser **Playground** (type → run → share link) | 0.12.0 + playground | `examples/playground/`, `src/player/Player.ts` |
| Heavy install: Python + ffmpeg + Cairo + full LaTeX (HN 47155375) | Zero install; runs in a tab. **`<manim-scene>` web component** = one HTML tag, no build | 0.11.0 | `src/integrations/webcomponent.ts` |
| Output is a dead mp4; no interactivity (3b1b #1002, HN 44994071) | **MovablePoint** + in-scene **Slider** bound to `ValueTracker` (drag → dependents update) | 0.12.0 | `src/interaction/MovablePoint.ts`, `Slider.ts` |
| No 3D model import; "OBJ Support" request (GitHub) | **`ModelMobject.fromUrl()`** — glTF/GLB/OBJ via lazy Three.js loaders | 0.11.0 | `src/mobjects/three-d/ModelMobject.ts` |
| "video as a movable object" (ManimCommunity suggestions) | **VideoMobject** — HTML video as a textured, timeline-synced mobject | 0.11.0 | `src/mobjects/video/` |
| Blending modes (top-engagement suggestion) | Per-mobject **`setBlendMode()`** (normal/additive/multiply/subtractive/screen) | 0.12.0 | `src/rendering/blendModes.ts` |
| Custom themes (top-voted suggestion) | **ThemeManager** (default/dark/light/3b1b) + `Scene.backgroundColor` | 0.12.0 | `src/utils/ThemeManager.ts` |
| manim-voiceover is a bolt-on; narration sync is fiddly | **Voiceover** — browser TTS + `<bookmark>`/`waitForMark`, or pre-recorded audio | 0.12.0 | `src/audio/` |
| SVG import drops gradients/`<text>`/`<image>`; no URL load (#3709) | **`SVGMobject.fromUrl()`** + linear/radial gradients + `<text>`/`<image>` | 0.12.0 | `src/mobjects/svg/` |
| Export needs ffmpeg; no PNG/frame export; GIF/MP4 from assets | **`exportFramePNG`/`exportPNGSequence`** + **WebCodecsExporter** (deterministic mp4/webm) | 0.11.0 | `src/export/FrameExporter.ts`, `WebCodecsExporter.ts` |
| 3D depth/z-order bugs in Cairo (#4336, #2032) | True WebGL depth buffer; transparent-surface depth prepass | prior | `src/mobjects/three-d/Surface3D.ts` |
| Thin docs; must read source (HN 44994071) | Docs pages + runnable examples for every new feature | wave 3 | `docs/docs/examples/`, `examples/` |

## What a browser port still trades away (honest)

- **Offline high-bitrate batch export** — the Python + ffmpeg path still wins for long,
  high-quality renders. The browser path (MediaRecorder / WebCodecs) is for in-tab export
  and sharing.
- **Full LaTeX/TikZ fidelity** — math works via MathJax/KaTeX and Typst (WASM); arbitrary
  TikZ is out of scope, as the native Cairo/OpenGL renderers are (see `PARITY.md`).
- **Exact CPython RNG sequences** — `RandomColorGenerator` is deterministic per seed but
  uses mulberry32, not CPython's Mersenne Twister.

## Next

See `thoughts/ledgers/CONTINUITY_CLAUDE-best-manim-library.md` for the backlog
(spring/CustomEase easing, animated code-block diff, OBJ/MTL textures, SVG patterns).

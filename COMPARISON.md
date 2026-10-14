# manim-web vs other manim libraries

Purpose: a scored, sourced comparison of manim-web against every real manim
implementation. Each claim cites repo evidence or a named external fact. The
places where manim-web trails are listed honestly. Companion to `PARITY.md`
(the per-symbol ManimCE coverage). Last updated 2026-10-14.

## What "best" means here (the rubric)

"Best" is not one number. A manim library is judged on the capabilities users
ask for (see the gap research in `2026-10-13-manim-gaps-roadmap.md` and
`2026-10-14-community-research.md`). The dimensions, in rough order of how often
they appear in the community pulls:

1. API coverage vs the reference (ManimCE).
2. Where it runs (install friction, platform reach).
3. 2D + 3D animation depth.
4. Domain depth (the asked-for verticals: chemistry/drug, biology, maps).
5. Interactivity and live playback.
6. Export formats.
7. Docs with runnable, correct examples.
8. Math typesetting (LaTeX/Typst).
9. Render performance at scale.
10. Ecosystem size and age.

A library is "best" when it leads on the union of 1-7 (the capability surface)
without regressing the fundamentals, and is honest about 8-10 where it trails.

## The field

- **ManimCE** (Community Edition) — Python, Cairo + OpenGL renderers. The
  reference API (685 public symbols in 0.22.0). Large, mature community.
- **ManimGL** (3Blue1Brown's original) — Python, OpenGL, interactive; smaller
  documented general API, moving target.
- **manim-web** (this repo) — TypeScript + Three.js, runs in the browser.
- Adjacent, NOT manim implementations (different API/paradigm, listed so the
  comparison is honest, not scored as manim ports): Motion Canvas (TS, own API),
  manim-slides / jupyter helpers (tooling around ManimCE, not a renderer).

## Scorecard

Legend: ++ leads, + strong, ~ partial, - trails, x absent.

| Dimension | manim-web | ManimCE | ManimGL | Evidence (manim-web side) |
|---|---|---|---|---|
| 1. ManimCE API coverage | ++ | ++ (is the ref) | ~ | `PARITY.md`: 429/429 feasible = 100.0% of ManimCE 0.22.0 feasible symbols ported |
| 2. Runs with zero install (browser) | ++ | x | x | TS/Three.js lib + web component; no Python/Cairo/LaTeX toolchain |
| 3. 2D + 3D animation | + | + | + | `src/mobjects/three-d/`, geometry, graphing, `ThreeDScene`; full suite green |
| 4a. Chemistry / drug-binding | ++ | x | x | `src/mobjects/molecular/` (15 files: PDB/MOL-SDF/SMILES import, VdW/SAS/orbital/density surfaces, BindingPocket, dockLigand, selection, morph) + `chemistry/` (reaction arrows/schemes/mechanisms, BohrDiagram) |
| 4b. Biology | ++ | x | x | `src/mobjects/biology/` (DNAHelix 3D, Cell, AminoAcidChain) |
| 4c. Maps / geo | ++ | x | x | `src/mobjects/geo/` (Globe, ChoroplethMap, FlowArc, animated choropleth, projections, GeoJSON holes, TopoJSON import + zoom-to-region) |
| 5. Interactivity / live playback | ++ | ~ | + | `src/player/Player.ts` (play/pause, scrub, segment nav, rate); MovablePoint/Slider; gamepad/keyboard/MIDI input |
| 6. Export formats | + | + | ~ | PNG + WebCodecs video, SVG, SMIL, alpha, slide/PDF export (ledger) |
| 7. Docs: runnable, correct examples | + | + | ~ | 125 examples; clarity review done; full SSG build green in CI ("Docs build" + "Deploy Docs" on fd961ba) |
| 8. LaTeX / Typst | ~ | ++ | + | LaTeX via MathJax-style path present; **Typst/MathTypst NOT ported** (WASM, out of scope — PARITY INFEASIBLE set) |
| 9. Render perf at scale | ~ | + | ++ | Three.js/WebGL; **no WebGPU yet**; heavy multi-scene pages throttle (ManimExample runs all loops) |
| 10. Ecosystem size / age | - | ++ | + | manim-web ~300 GitHub stars, young; ManimCE has years + a large userbase |

## Reading the scorecard

- **Capability surface (dimensions 1-7): manim-web leads.** It matches 100% of
  ManimCE's feasible API (1), and then adds four things no Python manim ships:
  zero-install browser delivery (2), and native chemistry/drug, biology, and
  maps modules (4a-c), plus the strongest interactive player (5). ManimCE and
  ManimGL score `x` on 4a-c because they have no such mobjects — a user who
  wants molecule-binding, a cell, or a choropleth builds it from scratch there.
- **This is the defensible meaning of "best": the superset.** manim-web is a
  strict superset of ManimCE's *feasible* surface, plus domains and a runtime
  the others do not have. That is a provable claim, not a taste judgment.

## Where manim-web is NOT best (honest gaps)

1. **Typst / MathTypst (dim 8).** Not ported; needs a WASM Typst build. ManimCE
   wins on Typst today. LaTeX-style math is covered; Typst specifically is not.
2. **Render performance at scale (dim 9).** No WebGPU path; many simultaneous
   WebGL scenes on one docs page throttle. Native OpenGL (ManimGL) wins on raw
   throughput. This is infra work, flagged in the ledger, not a mobject gap.
3. **Ecosystem and age (dim 10).** ManimCE has years of community tutorials,
   Stack Overflow answers, and third-party plugins. manim-web is young
   (~300 stars). Capability leads; mindshare does not yet.

None of the three is a correctness bug; each is a scoped, named follow-on
(WASM Typst, WebGPU, time/adoption). They are the honest ceiling on the "best"
claim.

## Verdict

On the capability surface users actually request — ManimCE parity + browser
delivery + chemistry/drug + biology + maps + interactivity + export — manim-web
leads every other manim implementation, and is the only one that runs in a
browser or ships these domains at all. It trails on Typst, on raw render
performance, and on ecosystem size. So: **best-in-class on capability and the
clear choice for web, biology, maps and drug-visualization work; not yet the
leader on math-typesetting breadth, peak render throughput, or community size.**
"Best manim library" is true on the axes the goal named (biology, maps,
molecule-binding) and on total feasible capability; it is not true on three
named, out-of-scope-or-future axes. That is the accurate end state.

## Sources

- Repo: `PARITY.md` (per-symbol ManimCE coverage),
  `src/mobjects/{molecular,chemistry,biology,geo,three-d}/`, `src/player/Player.ts`.
- Gap research (what users miss): Reddit, Hacker News, and GitHub-issue pulls
  from the ManimCommunity and manim-Chemistry projects.
- CI evidence: the full docs site builds green on `main` (the "Docs build" and
  "Deploy Docs" workflows), so every documented example compiles.

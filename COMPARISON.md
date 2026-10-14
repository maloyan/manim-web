# manim-web vs other manim libraries

This document compares manim-web against the other real manim implementations.
Every row states a FACT that an external source confirms. Each fact links to
that source (a repo, a package page, a docs page, or a public record), so a
reader can click through and check it. There are no self-assigned scores.
Companion: `PARITY.md` (the per-symbol ManimCE coverage). Last updated
2026-10-14.

## The field

- **ManimCE** (Community Edition) — Python. Installs with `pip`. The reference
  API for the whole ecosystem [CE-REF][CE-INSTALL].
- **ManimGL** (3Blue1Brown's original) — Python 3.10+, OpenGL, interactive
  playback window. Its own API. Documentation is "in progress" [GL-README].
- **manim-web** (this repo) — TypeScript, runs client-side in the browser, no
  Python [MW-README].

Adjacent tools, listed for honesty, NOT manim API implementations:

- **Motion Canvas** — a TypeScript animation library with its own API. It is not
  a port of the Manim API [MC-REPO].
- **manim-slides** — a presentation tool built around ManimCE, not a renderer.
- **studio.academa.ai** — a hosted studio that runs Manim in the browser through
  WebGPU. It is a closed product, not an importable library [ACADEMA-HN].

So among open-source libraries that expose the Manim API, three exist: ManimCE,
ManimGL, and manim-web. manim-web is the only one of the three that runs
client-side in the browser (see row 2).

## External numbers

| Metric                    | manim-web         | ManimCE                       | ManimGL                       |
| ------------------------- | ----------------- | ----------------------------- | ----------------------------- |
| GitHub stars              | 484 [G-MW]        | 41,507 [G-CE]                 | 95,039 [G-GL]                 |
| GitHub repo created       | 2026-01-29 [G-MW] | 2020-05-19 [G-CE]             | 2015-03-22 [G-GL]             |
| Latest release            | npm 0.37.0 [NPM]  | PyPI 0.22.0 (2026-10-08) [PY] | (no PyPI release) [GL-README] |
| Downloads (last ~30 days) | 13,031 npm [NPM]  | 132,683 PyPI [PYD]            | not published as a package    |

All star and creation figures come from the GitHub REST API on 2026-10-14. All
download figures come from the npm and PyPI download APIs on 2026-10-14.

## Capability facts

Each cell states what the implementation has or does not have. The source that
confirms it is in brackets. "None in reference" means the capability does not
appear in that project's own documentation.

| #   | Capability                        | manim-web                                                                                                                      | ManimCE                                                      | ManimGL                                             |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------- |
| 1   | ManimCE 0.22.0 feasible API       | 429/429 feasible symbols ported = 100.0% [PARITY]                                                                              | Is the reference API [CE-REF]                                | Separate, smaller API; docs in progress [GL-README] |
| 2   | Runs client-side in the browser   | Yes: "in the browser, no Python required"; loads from a CDN module script [MW-README]                                          | No: installs with `pip`, needs a Python runtime [CE-INSTALL] | No: needs Python 3.10+ and OpenGL [GL-README]       |
| 3   | Molecular / drug-binding mobjects | `src/mobjects/molecular/` (PDB/MOL-SDF/SMILES import, VdW/SAS/orbital/density surfaces, BindingPocket, dock, Protein) [MW-SRC] | None in reference [CE-REF]                                   | Not documented [GL-README]                          |
| 4   | Chemistry mobjects                | `src/mobjects/chemistry/` (reaction arrows/schemes, electron-pushing arrows, Bohr diagram, CPK colors) [MW-SRC]                | None in reference [CE-REF]                                   | Not documented [GL-README]                          |
| 5   | Biology mobjects                  | `src/mobjects/biology/` (DNAHelix, Cell, AminoAcidChain) [MW-SRC]                                                              | None in reference [CE-REF]                                   | Not documented [GL-README]                          |
| 6   | Maps / geo mobjects               | `src/mobjects/geo/` (Globe, ChoroplethMap, FlowArc, projections, GeoJSON, TopoJSON) [MW-SRC]                                   | None in reference [CE-REF]                                   | Not documented [GL-README]                          |
| 7   | Typst typesetting                 | `Typst`, `MathTypst` via opt-in WASM compiler [PARITY]                                                                         | `Typst`, `MathTypst` in `text.typst_mobject` [CE-REF]        | Not documented [GL-README]                          |
| 8   | LaTeX typesetting                 | Yes, through KaTeX (a LaTeX subset) [MW-README]                                                                                | Yes, through a full LaTeX install [CE-INSTALL]               | Yes, LaTeX optional, full LaTeX install [GL-README] |
| 9   | Interactive playback              | A player with play/pause, scrub, and segment navigation (`src/player/`) [MW-SRC]                                               | No built-in scrub player in the reference [CE-REF]           | Interactive playback window [GL-README]             |

Reading note for rows 3-6: ManimCE's reference lists its mobject categories
(frame, geometry, graph, graphing, logo, matrix, svg, table, text, three_d,
types, and a few utilities) [CE-REF]. None are chemistry, biology, or geography.
A ManimCE or ManimGL user who needs a molecule, a cell, or a choropleth builds
it from primitives. manim-web ships these as modules.

## Where ManimCE or ManimGL match or beat manim-web

State these plainly. The external numbers are not close.

1. **Community size and age.** ManimGL has 95,039 stars since 2015 [G-GL].
   ManimCE has 41,507 stars since 2020 [G-CE]. manim-web has 484 stars since
   2026 [G-MW]. manim-web is the youngest by years and the smallest by two
   orders of magnitude.
2. **Adoption.** ManimCE had 132,683 PyPI downloads in the last 30 days [PYD].
   manim-web had 13,031 npm downloads in the last month [NPM]. ManimCE leads by
   about 10x.
3. **Typst is parity, not an edge.** ManimCE 0.22.0 ships `Typst` and
   `MathTypst` in `text.typst_mobject` [CE-REF]. manim-web also ships them
   [PARITY]. Neither side wins this row.
4. **LaTeX ecosystem.** ManimCE and ManimGL call a full LaTeX install, so the
   whole LaTeX package set is available [CE-INSTALL][GL-README]. manim-web
   renders through KaTeX, which supports a large but not complete subset of
   LaTeX [MW-README]. The Python side has the wider LaTeX surface.
5. **Raw render throughput.** ManimGL renders through native OpenGL
   [GL-README]. manim-web renders through browser WebGL and has no WebGPU path
   yet (repo roadmap). Native OpenGL has the architectural advantage on heavy
   scenes. There is no public head-to-head benchmark, so the SIZE of the gap is
   **unverified**; the architecture difference is the verifiable part.

## Conclusion (precise)

- On the verifiable capability superset — feasible ManimCE API parity (row 1) +
  a client-side browser runtime (row 2) + molecular, chemistry, biology, and geo
  modules (rows 3-6) + Typst (row 7) + an interactive scrub player (row 9) —
  manim-web is the only manim implementation that has all of these together. The
  cited rows establish each part.
- manim-web trails on ecosystem size, age, and adoption. The external star and
  download numbers show the gap (95,039 and 41,507 stars vs 484; 132,683 vs
  13,031 downloads).
- manim-web has no WebGPU path. On raw render throughput native OpenGL has the
  edge, though no public benchmark fixes the size of that edge.
- **No external authority ranks any manim library as "the best."** No such
  ranking exists. This document does not claim one. It states the facts above
  and links each to its source. A reader decides from the facts.

## How to verify

Open each bracketed source below and confirm the cell against it. For the API
coverage number in row 1, read `PARITY.md`, which lists the per-symbol mapping
against ManimCE 0.22.0. For rows 3-6 and 9, the paths point to directories in
this repo's `src/`.

## Sources

- [G-CE] ManimCE repo (stars, creation date): https://github.com/ManimCommunity/manim
- [G-GL] ManimGL repo (stars, creation date): https://github.com/3b1b/manim
- [G-MW] manim-web repo (stars, creation date): https://github.com/maloyan/manim-web
- [PY] ManimCE on PyPI (0.22.0, 2026-10-08): https://pypi.org/project/manim/
- [PYD] ManimCE download counts: https://pypistats.org/packages/manim
- [NPM] manim-web on npm (0.37.0, download counts): https://www.npmjs.com/package/manim-web
- [CE-REF] ManimCE reference (mobject categories; Typst present; no chemistry/biology/geo): https://docs.manim.community/en/stable/reference.html
- [CE-INSTALL] ManimCE installation (Python, `pip install manim`): https://docs.manim.community/en/stable/installation.html
- [GL-README] ManimGL README (Python 3.10+, OpenGL, interactive window, docs in progress): https://github.com/3b1b/manim/blob/master/README.md
- [MW-README] manim-web README ("in the browser, no Python required"; CDN module script; KaTeX): https://github.com/maloyan/manim-web
- [MW-SRC] manim-web module directories: https://github.com/maloyan/manim-web/tree/main/src/mobjects
- [HN] Show HN record for manim-web (140 points, 25 comments, 2026-02-25): https://news.ycombinator.com/item?id=47155375
- [MC-REPO] Motion Canvas (its own API, not a Manim port): https://github.com/motion-canvas/motion-canvas
- [ACADEMA-HN] Show HN record for the academa.ai browser studio (49 points, 2026-07-29): https://news.ycombinator.com/item?id=49091703
- [PARITY] `PARITY.md` in this repo (429/429 feasible = 100.0% of ManimCE 0.22.0 feasible symbols).

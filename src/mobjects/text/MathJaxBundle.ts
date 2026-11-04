/**
 * MathJaxBundle - single import surface for all `@mathjax/src` modules.
 *
 * Why this file exists:
 *   `MathJaxRenderer.ts` used to call `await import('@mathjax/src/js/...')`
 *   for five separate submodules (mathjax, tex, svg, liteAdaptor, html) plus
 *   side-effect imports for the AMS / Newcommand / ConfigMacros TeX packages.
 *   Vite/Rollup chunks them with a shared `mathjax-*.js` chunk so the
 *   `mathjax` singleton (which holds the global `HandlerList`) stays unique.
 *
 *   Some downstream bundlers (most notably esm.sh) re-bundle every emitted
 *   `.mjs` independently and re-inline the `mathjax` source into each chunk.
 *   That produces two parallel `mathjax` singletons:
 *     - `RegisterHTMLHandler(adaptor)` writes to the singleton living inside
 *       `handlers/html.js`'s chunk.
 *     - `mathjax.document(...)` reads the singleton living inside
 *       `mathjax.js`'s chunk.
 *   Result: an empty handler list and the runtime error
 *   `Can't find handler for document` (issue #396).
 *
 *   Collapsing every `@mathjax/src` access into this single module gives the
 *   downstream bundler a single chunk to ship. The shared `mathjax` singleton
 *   is then unambiguous: there is only one place it can live.
 *
 *   IMPORTANT: keep this file as the ONLY runtime surface that imports from
 *   `@mathjax/src`. Side-effect imports for the TeX packages must stay here
 *   (they register themselves on import) and must not be tree-shaken; rollup
 *   keeps bare imports for side effects by default.
 */

import { mathjax } from '@mathjax/src/js/mathjax.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { SVG } from '@mathjax/src/js/output/svg.js';
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js';
import '@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
// `\class`, `\cssId`, `\data`, `\style`, `\href`: `\class` tags the SVG
// group around a sub-expression, which svgToVMobjects records per glyph.
import '@mathjax/src/js/input/tex/html/HtmlConfiguration.js';

// ---------------------------------------------------------------------------
// NewCM font dynamic character data.
//
// The SVG output's font (MathJaxNewcmFont) splits most of its character
// data into per-range "dynamic" files that MathJax normally loads on
// demand through `mathjax.asyncLoad`. A bundled library provides no
// asyncLoad, so the first glyph from an unloaded range -- e.g. the
// double-struck capitals behind `\mathbb`, the fraktur letters behind
// `\mathfrak`, the script letters behind `\mathcal` -- makes the
// conversion throw "MathJax retry" and the render fails.
//
// Each dynamic file registers its data with the font class on import
// (it calls `MathJaxNewcmFont.dynamicSetup`), so importing the font's
// full declared set here -- the same side-effect registration pattern
// as the TeX configurations above -- makes every glyph the font knows
// available at render time. Registration is only half of the
// mechanism: `loadMathJax` in MathJaxRenderer also installs a no-op
// `asyncLoad` (the files are already here) and conversions run through
// `mathjax.handleRetriesFor`, so the first glyph from a range pauses,
// applies the registered data, and retries instead of throwing.
// The list mirrors the font's own declaration
// (`MathJaxNewcmFont.dynamicFiles`); it is deliberately the complete
// set, not a subset picked for today's commands, so no glyph family
// is special-cased. Keep these imports in this module only, like every
// other `@mathjax` surface, so the font class stays a single instance.
// ---------------------------------------------------------------------------
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/PUA.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/accents.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/accents-b-i.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/arabic.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/arrows.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/braille.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/braille-d.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/calligraphic.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/cherokee.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/cyrillic.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/cyrillic-ss.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/devanagari.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/double-struck.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/fraktur.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/greek.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/greek-ss.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/hebrew.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/latin.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/latin-b.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/latin-bi.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/latin-i.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/marrows.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/math.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/monospace.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/monospace-ex.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/monospace-l.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/mshapes.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/phonetics.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/phonetics-ss.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-b.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-bi.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-ex.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-i.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-r.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/script.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/shapes.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/symbols.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/symbols-b-i.js';
import '@mathjax/mathjax-newcm-font/js/svg/dynamic/variants.js';

export { mathjax, TeX, SVG, liteAdaptor, RegisterHTMLHandler };

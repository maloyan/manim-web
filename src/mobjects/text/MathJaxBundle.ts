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

export { mathjax, TeX, SVG, liteAdaptor, RegisterHTMLHandler };

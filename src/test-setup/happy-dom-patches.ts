/**
 * happy-dom test patches.
 *
 * Runs once per worker before any test file imports modules.
 * Skips when document is unavailable (node-env tests).
 *
 * Force standards mode so KaTeX does not permanently override `render()`
 * to throw `KaTeX doesn't work in quirks mode.` at module-load time
 * (see node_modules/katex/dist/katex.mjs check on `document.compatMode`).
 */

if (typeof document !== 'undefined' && document.compatMode !== 'CSS1Compat') {
  Object.defineProperty(document, 'compatMode', {
    value: 'CSS1Compat',
    configurable: true,
  });
}

// happy-dom does not implement the FontFaceSet API. Stub `document.fonts.load`
// so consumers that probe font availability (e.g. MathTexImage) resolve cleanly
// in tests instead of throwing "Cannot read properties of undefined (reading
// 'load')". Production code paths through real browsers are unaffected.
if (typeof document !== 'undefined' && !(document as { fonts?: unknown }).fonts) {
  Object.defineProperty(document, 'fonts', {
    value: {
      load: () => Promise.resolve([]),
      ready: Promise.resolve(),
      check: () => true,
    },
    configurable: true,
    writable: true,
  });
}

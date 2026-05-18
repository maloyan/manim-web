/**
 * Vitest setup file.
 *
 * Runs once per worker before any test file imports modules. Skips
 * environment-dependent patches when the corresponding API is unavailable
 * (e.g. node-env tests don't have `document`).
 *
 * Two concerns live here:
 *   1. happy-dom polyfills for browser APIs the emulator doesn't implement.
 *   2. A strict console policy that fails tests on unexpected warn/error.
 *
 * Both are idempotent: the file may run more than once per realm if a
 * future config disables worker isolation, and we don't want shims to stack.
 */

const SETUP_MARKER = Symbol.for('manimweb.vitest.setupApplied');
type SetupGlobal = typeof globalThis & { [SETUP_MARKER]?: boolean };
const setupGlobal = globalThis as SetupGlobal;

if (!setupGlobal[SETUP_MARKER]) {
  setupGlobal[SETUP_MARKER] = true;

  /**
   * Why patch `document.compatMode`:
   * happy-dom does not implement `compatMode` at all — it returns `undefined`,
   * regardless of doctype. In real browsers an HTML5 document is always
   * `CSS1Compat`. KaTeX (`node_modules/katex/dist/katex.mjs`) checks the value
   * once at module load and permanently overrides `render()` to throw
   * `KaTeX doesn't work in quirks mode.` if it is not `CSS1Compat`. Defining
   * the property here aligns the test environment with the production browser
   * contract — this is a polyfill for a missing API, not a workaround for
   * product behavior.
   */
  if (typeof document !== 'undefined' && document.compatMode !== 'CSS1Compat') {
    Object.defineProperty(document, 'compatMode', {
      value: 'CSS1Compat',
      configurable: true,
    });
  }

  /**
   * Strict console policy.
   *
   * `console.warn` and `console.error` are reserved for problems that need
   * attention. Tests must either:
   *   - fix the warning at its source, or
   *   - opt in to silence it via
   *     `vi.spyOn(console, 'warn'|'error').mockImplementation(...)`
   *     scoped to the specific path that intentionally triggers it.
   *
   * Anything else fails the test, so noisy CI logs stay noisy.
   *
   * Set `STRICT_CONSOLE=0` in the environment to fall back to the lenient
   * behavior (useful when bisecting a flaky test locally).
   */
  if (process.env.STRICT_CONSOLE !== '0') {
    const STRICT_METHODS = ['warn', 'error'] as const;
    for (const method of STRICT_METHODS) {
      const original = console[method].bind(console);
      console[method] = (...args: unknown[]): void => {
        original(...args);
        throw new Error(
          `Unexpected console.${method} during test. Spy on console.${method} ` +
            `with vi.spyOn(...).mockImplementation(...) if this is intentional, ` +
            `or fix the source.\nMessage: ${args.map((a) => String(a)).join(' ')}`,
        );
      };
    }
  }
}

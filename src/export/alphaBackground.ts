/**
 * Shared helpers for transparent / alpha background export.
 *
 * Both the PNG frame exporter and the WebCodecs video exporter can render the
 * scene with a transparent background, so the exported frames carry a real
 * alpha channel instead of the opaque background color. The pixels are
 * transparent where nothing is drawn, so the result composites over other
 * footage.
 *
 * A transparent export has two requirements:
 *  1. The WebGL context was created with an alpha channel. The Scene enables it
 *     with `{ alpha: true }` (or `backgroundOpacity < 1`). Without it the canvas
 *     has no alpha to export, so a transparent export would silently produce an
 *     opaque image. This module detects that and throws a clear error instead.
 *  2. The renderer clears to a transparent color while it captures the frames.
 *     `withTransparentClear` sets the clear alpha to 0 for the capture, then
 *     restores the previous clear alpha, so normal rendering is unchanged.
 */

/**
 * Minimal duck-type of `THREE.WebGLRenderer`, limited to the alpha controls the
 * exporters need. It avoids a direct dependency on three.js in the exporters.
 */
export interface AlphaRenderer {
  /** Get the current clear alpha (0 = transparent, 1 = opaque). */
  getClearAlpha(): number;
  /** Set the clear alpha used on the next render. */
  setClearAlpha(alpha: number): void;
  /** Get the WebGL context, used to read its context attributes. */
  getContext(): { getContextAttributes(): WebGLContextAttributes | null };
}

/**
 * Minimal duck-type of a Scene that can expose its WebGL renderer for alpha
 * export. The real Scene satisfies this through its `renderer` getter.
 */
export interface AlphaCapableScene {
  renderer?: { getThreeRenderer(): AlphaRenderer } | null;
}

/** Error message when the WebGL context has no alpha channel to export. */
export const ALPHA_CONTEXT_ERROR =
  'Transparent export needs a WebGL context created with an alpha channel. ' +
  'Create the Scene with { alpha: true } (or backgroundOpacity < 1) so the ' +
  'canvas carries a real alpha channel to export.';

/** Error message when the scene does not expose a WebGL renderer. */
export const ALPHA_RENDERER_ERROR =
  'Transparent export needs access to the WebGL renderer, but the scene did ' + 'not expose one.';

/**
 * Resolve the underlying WebGL renderer from a scene.
 * @param scene - The scene to read the renderer from
 * @returns The WebGL renderer, or null when the scene exposes none
 */
export function resolveAlphaRenderer(scene: AlphaCapableScene): AlphaRenderer | null {
  const renderer = scene.renderer;
  if (!renderer || typeof renderer.getThreeRenderer !== 'function') {
    return null;
  }
  return renderer.getThreeRenderer() ?? null;
}

/**
 * Report whether the WebGL context was created with an alpha channel.
 * @param renderer - The WebGL renderer to inspect
 * @returns True when the context has an alpha channel
 */
export function hasAlphaChannel(renderer: AlphaRenderer): boolean {
  const attributes = renderer.getContext().getContextAttributes();
  return attributes?.alpha === true;
}

/**
 * Resolve the WebGL renderer for a transparent export, or throw a clear error.
 *
 * @param scene - The scene to export
 * @returns The WebGL renderer, ready for a transparent capture
 * @throws Error when the scene exposes no renderer, or the context has no alpha
 */
export function requireAlphaRenderer(scene: AlphaCapableScene): AlphaRenderer {
  const renderer = resolveAlphaRenderer(scene);
  if (!renderer) {
    throw new Error(ALPHA_RENDERER_ERROR);
  }
  if (!hasAlphaChannel(renderer)) {
    throw new Error(ALPHA_CONTEXT_ERROR);
  }
  return renderer;
}

/**
 * Run a capture with a transparent clear color, then restore the previous one.
 *
 * The clear alpha is set to 0 for the duration of `fn`, so frames rendered
 * inside it clear to transparent. The previous clear alpha is restored even
 * when `fn` throws, so normal rendering is unchanged after the export.
 *
 * @param renderer - The WebGL renderer to control
 * @param fn - The capture function to run under a transparent clear
 * @returns The value `fn` resolves to
 */
export async function withTransparentClear<T>(
  renderer: AlphaRenderer,
  fn: () => Promise<T> | T,
): Promise<T> {
  const previousClearAlpha = renderer.getClearAlpha();
  renderer.setClearAlpha(0);
  try {
    return await fn();
  } finally {
    renderer.setClearAlpha(previousClearAlpha);
  }
}

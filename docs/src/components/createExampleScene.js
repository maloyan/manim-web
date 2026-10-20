// Plain JS (not TS) so the root vitest run can test it without docs deps;
// see createExampleScene.test.js.

/**
 * Build the scene for a docs example at the container's measured size.
 *
 * Generated `createScene` factories copy the example source verbatim, which
 * usually pins `width: 800, height: 450`. On a narrow screen (phones) that
 * canvas overflows the example box, which clips it with `overflow: hidden`, so
 * only the top-left part shows and the origin looks off-center (#838). Resize
 * any scene that does not match the box so the camera frames the whole view.
 *
 * @param {HTMLElement} container - Example box the canvas is appended to
 * @param {any} manim - The imported `manim-web` module
 * @param {{ width: number, height: number }} dims - Measured box size in CSS px
 * @param {(container: HTMLElement, manim: any, dims: { width: number, height: number }) => any} [createScene]
 *   Optional factory for a custom scene type (e.g. ThreeDScene)
 * @returns {Promise<any>} The created scene
 */
export async function createExampleScene(container, manim, dims, createScene) {
  const { width, height } = dims;
  const scene = createScene
    ? await createScene(container, manim, dims)
    : new manim.Scene(container, { width, height, backgroundColor: '#000000' });

  const renderer = scene.renderer;
  if (renderer && (renderer.width !== width || renderer.height !== height)) {
    scene.resize(width, height);
  }
  return scene;
}

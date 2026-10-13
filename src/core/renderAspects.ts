/**
 * renderAspects - render one authored scene at several aspect ratios.
 *
 * This is the "one scene, four outputs" convenience from the r/manim request
 * (thread 1vyfrrx). Give it a scene factory, a build function (the single
 * authored content) and a list of targets; it creates the scene for each
 * target, applies the optional theme, switches the frame aspect with
 * {@link Scene.setFrameAspect} and runs the build. The caller then drives the
 * EXISTING exporters (VideoExporter, exportPNG, ...) once per returned scene.
 *
 * Targets run sequentially because {@link setTheme} changes global defaults.
 */

import { Scene } from './Scene';
import { setTheme } from '../utils/ThemeManager';

/**
 * One output target: a pixel size plus an optional theme and label.
 */
export interface AspectTarget {
  /** Render width in pixels. Must be positive. */
  width: number;
  /** Render height in pixels. Must be positive. */
  height: number;
  /**
   * Optional registered theme name applied via {@link setTheme} before the
   * build runs (e.g. `'dark'`, `'light'`).
   */
  theme?: string;
  /** Optional caller-facing label (e.g. `'youtube'`, `'reels'`). */
  name?: string;
}

/**
 * A built scene paired with the target it was produced for.
 */
export interface RenderedAspect {
  /** The target this scene was built for. */
  target: AspectTarget;
  /** The scene, built at the target's aspect (and theme). */
  scene: Scene;
}

/**
 * Build the same content at each target aspect.
 *
 * @param createScene - Factory that returns a fresh scene per target.
 * @param build - Fills a scene with the authored content. May be async.
 * @param targets - The output targets to produce.
 * @returns One {@link RenderedAspect} per target, in order.
 */
export async function renderAspects(
  createScene: () => Scene,
  build: (scene: Scene) => void | Promise<void>,
  targets: readonly AspectTarget[],
): Promise<RenderedAspect[]> {
  const results: RenderedAspect[] = [];
  for (const target of targets) {
    const scene = createScene();
    if (target.theme !== undefined) {
      setTheme(target.theme, { scene });
    }
    scene.setFrameAspect(target.width, target.height);
    await build(scene);
    results.push({ target, scene });
  }
  return results;
}

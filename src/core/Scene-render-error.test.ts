import { describe, it, expect, vi, afterEach } from 'vitest';
import { Scene } from './Scene';
import { Circle } from '../mobjects/geometry/Circle';
import { FadeIn } from '../animation/fading/FadeIn';
import { logger } from '../utils/logger';

/**
 * Regression tests: a render error during an animation frame must not freeze
 * the scene. Before the fix, if `_render()` threw inside `_tickFrame()`, the
 * subsequent `_checkFinished()` was skipped, so `_playPromiseResolve` was never
 * called and `await scene.play(...)` hung forever (silent frozen scene).
 *
 * The contract: on a render error the animation still completes timeline-wise,
 * the error is logged once per play, and `play()` settles (resolves, not
 * rejects) so call sites that don't `.catch()` keep working.
 */

type SceneInternals = { _render: () => void };

const flushMicrotasks = (): Promise<void> => new Promise<void>((r) => queueMicrotask(r));

/**
 * Await `play()` but never hang the test: resolve with a sentinel if the play
 * promise does not settle within `ms`.
 */
async function playOrTimeout(
  playPromise: Promise<void>,
  ms: number,
): Promise<'settled' | 'timeout'> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  const settled = playPromise.then((): 'settled' => 'settled');
  const result = await Promise.race([settled, timeout]);
  clearTimeout(timer!);
  return result;
}

describe('Scene render error does not freeze play()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('settles play() and logs once when _render throws every frame', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    await flushMicrotasks();

    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    vi.spyOn(scene as unknown as SceneInternals, '_render').mockImplementation(() => {
      throw new Error('render boom');
    });

    const result = await playOrTimeout(scene.play(new FadeIn(circle, { duration: 0.1 })), 2000);

    expect(result).toBe('settled');
    expect(errorSpy).toHaveBeenCalledTimes(1);

    scene.dispose();
  });

  it('normal play() resolves and logs no error', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    await flushMicrotasks();

    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    const result = await playOrTimeout(scene.play(new FadeIn(circle, { duration: 0.1 })), 2000);

    expect(result).toBe('settled');
    expect(errorSpy).not.toHaveBeenCalled();

    scene.dispose();
  });

  it('resets the error flag between plays so each play logs at most once', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    await flushMicrotasks();

    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    vi.spyOn(scene as unknown as SceneInternals, '_render').mockImplementation(() => {
      throw new Error('render boom');
    });

    const first = await playOrTimeout(scene.play(new FadeIn(circle, { duration: 0.1 })), 2000);
    expect(first).toBe('settled');
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const second = await playOrTimeout(scene.play(new FadeIn(circle, { duration: 0.1 })), 2000);
    expect(second).toBe('settled');
    // Flag reset at the start of the second play: one more log, not zero.
    expect(errorSpy).toHaveBeenCalledTimes(2);

    scene.dispose();
  });
});

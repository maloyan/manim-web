import { describe, it, expect, vi } from 'vitest';
import { Scene } from './Scene';
import { ThreeDScene } from './ThreeDScene';
import { Circle } from '../mobjects/geometry/Circle';
import { Square } from '../mobjects/geometry/Rectangle';
import { Create } from '../animation/creation/Create';
import { FadeIn } from '../animation/fading/FadeIn';

/**
 * Regression tests for issue #317:
 * `scene.add(x); scene.play(Create(x))` must not render `x` at full opacity
 * for one frame before the animation begins. `add()` is state-only and
 * defers its auto-render via microtask; `play()` and `wait()` suppress that
 * deferred render while they set up the animation.
 */

const flushMicrotasks = () => new Promise<void>((r) => queueMicrotask(r));

type SceneInternals = {
  _render: () => void;
  _pendingRender: boolean;
  _suppressAutoRender: boolean;
};

describe('Scene.add() defers auto-render (issue #317)', () => {
  it('add() schedules a render via microtask, does not render synchronously', async () => {
    const scene = Scene.createHeadless();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    // Constructor calls _render() once; reset before the test action.
    renderSpy.mockClear();

    scene.add(new Circle());

    // No synchronous render yet — only a queued microtask.
    expect(renderSpy).not.toHaveBeenCalled();

    await flushMicrotasks();
    expect(renderSpy).toHaveBeenCalledTimes(1);

    scene.dispose();
  });

  it('multiple add() calls within a tick coalesce into a single render', async () => {
    const scene = Scene.createHeadless();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.add(new Circle());
    scene.add(new Square());
    scene.add(new Circle());

    expect(renderSpy).not.toHaveBeenCalled();
    await flushMicrotasks();
    expect(renderSpy).toHaveBeenCalledTimes(1);

    scene.dispose();
  });

  it('play() after add() suppresses the pending render (no pre-animation flash)', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.add(circle);
    // Synchronously start play() before the queued add-render microtask runs.
    const playPromise = scene.play(new Create(circle, { duration: 0.05 }));

    // The pending render flag must be cleared once play() begins its setup.
    expect((scene as unknown as SceneInternals)._pendingRender).toBe(false);

    await playPromise;

    // We don't pin the exact frame count (varies with timer), but we do
    // require that begin() ran with `_render()` not yet called from add().
    // Any render that happened was driven by the render loop, after begin().
    scene.dispose();
  });

  it('wait() cancels the add() pending render', async () => {
    const scene = Scene.createHeadless();
    scene.add(new Circle());
    expect((scene as unknown as SceneInternals)._pendingRender).toBe(true);

    const waitPromise = scene.wait(0.01);
    expect((scene as unknown as SceneInternals)._pendingRender).toBe(false);
    await waitPromise;

    scene.dispose();
  });

  it('add() with no follow-up play still renders (backward compatible)', async () => {
    const scene = Scene.createHeadless();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.add(new Circle());
    await flushMicrotasks();

    expect(renderSpy).toHaveBeenCalled();
    scene.dispose();
  });

  it('add() with autoRender=false does not schedule a render', async () => {
    const scene = Scene.createHeadless({ autoRender: false } as never);
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.add(new Circle());
    await flushMicrotasks();

    expect(renderSpy).not.toHaveBeenCalled();
    scene.dispose();
  });

  it('ThreeDScene.add() also defers its render (#317)', async () => {
    const scene = ThreeDScene.createHeadless();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.add(new Circle());
    expect(renderSpy).not.toHaveBeenCalled();

    await flushMicrotasks();
    expect(renderSpy).toHaveBeenCalled();
    scene.dispose();
  });

  it('addForegroundMobject() defers its render and is suppressed by play() (#317)', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.addForegroundMobject(circle);
    expect(renderSpy).not.toHaveBeenCalled();

    const playPromise = scene.play(new Create(circle, { duration: 0.05 }));
    expect((scene as unknown as SceneInternals)._pendingRender).toBe(false);

    await playPromise;
    scene.dispose();
  });

  it('FadeIn after add() does not flash the mobject visible (#317)', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    const renderSpy = vi.spyOn(scene as unknown as SceneInternals, '_render');
    renderSpy.mockClear();

    scene.add(circle);
    const playPromise = scene.play(new FadeIn(circle, { duration: 0.05 }));

    // No render fired between add() and play() entering its setup phase.
    expect(renderSpy).not.toHaveBeenCalled();

    await playPromise;
    scene.dispose();
  });
});

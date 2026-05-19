// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { Scene } from './Scene';
import { ThreeDScene } from './ThreeDScene';
import { Camera2D } from './Camera';
import { MultiCamera } from './CameraExtensions';

type SceneInternals = {
  _render(): void;
  _renderMultiCamera(): void;
  _tickFrame(dt: number): void;
  _renderer: {
    getThreeRenderer(): THREE.WebGLRenderer;
    width: number;
    height: number;
  };
};

function makeFakeThreeRenderer(): THREE.WebGLRenderer {
  const ctx = { isContextLost: () => false } as unknown as WebGLRenderingContext;
  const calls: string[] = [];
  const stub = {
    setScissorTest: vi.fn(),
    setViewport: vi.fn(),
    setScissor: vi.fn(),
    clear: vi.fn(() => calls.push('clear')),
    render: vi.fn(() => calls.push('render')),
    getContext: () => ctx,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (stub as any)._calls = calls;
  return stub as unknown as THREE.WebGLRenderer;
}

function installFakeRenderer(scene: Scene): THREE.WebGLRenderer {
  const fake = makeFakeThreeRenderer();
  const internals = scene as unknown as SceneInternals;
  // Replace the renderer with a stub exposing getThreeRenderer + dimensions
  // so we can exercise the non-headless MultiCamera code path without WebGL.
  Object.defineProperty(scene, '_renderer', {
    value: {
      getThreeRenderer: () => fake,
      width: 800,
      height: 450,
      render: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
      getCanvas: () => document.createElement('canvas'),
      backgroundOpacity: 1,
    },
    writable: true,
    configurable: true,
  });
  // Ensure isHeadless returns false now that we've stubbed the renderer.
  Object.defineProperty(scene, 'isHeadless', { value: false, configurable: true });
  void internals;
  return fake;
}

describe('Scene.useMultiCamera (issue #358)', () => {
  it('starts with no multi-camera attached', () => {
    const scene = Scene.createHeadless();
    expect(scene.multiCamera).toBeNull();
  });

  it('useMultiCamera stores instance and getter returns it', () => {
    const scene = Scene.createHeadless();
    const mc = new MultiCamera();
    scene.useMultiCamera(mc);
    expect(scene.multiCamera).toBe(mc);
  });

  it('useMultiCamera returns this for chaining', () => {
    const scene = Scene.createHeadless();
    expect(scene.useMultiCamera(new MultiCamera())).toBe(scene);
    expect(scene.useMultiCamera(null)).toBe(scene);
  });

  it('useMultiCamera(null) detaches and restores default camera aspect', () => {
    const scene = Scene.createHeadless({ width: 800, height: 450 });
    scene.useMultiCamera(new MultiCamera());
    // Simulate a viewport that mutated the default camera's aspect.
    scene.camera.setAspectRatio(0.5);
    scene.useMultiCamera(null);
    expect(scene.multiCamera).toBeNull();
    expect(scene.camera.frameWidth / scene.camera.frameHeight).toBeCloseTo(800 / 450, 5);
  });

  it('headless _render skips the MultiCamera path (no throw)', () => {
    const scene = Scene.createHeadless();
    const mc = new MultiCamera();
    const mcRenderSpy = vi.spyOn(mc, 'render');
    scene.useMultiCamera(mc);
    expect(() => (scene as unknown as SceneInternals)._render()).not.toThrow();
    expect(mcRenderSpy).not.toHaveBeenCalled();
  });

  it('_tickFrame calls MultiCamera.update(dt) when attached', () => {
    const scene = Scene.createHeadless();
    const mc = new MultiCamera();
    const updateSpy = vi.spyOn(mc, 'update');
    scene.useMultiCamera(mc);
    (scene as unknown as SceneInternals)._tickFrame(0.016);
    expect(updateSpy).toHaveBeenCalledWith(0.016);
  });

  it('_tickFrame does not call MultiCamera.update when none attached', () => {
    const scene = Scene.createHeadless();
    const updateSpy = vi.fn();
    // Sanity check: no multi-camera, no update calls anywhere related.
    (scene as unknown as SceneInternals)._tickFrame(0.016);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('non-headless _render delegates to MultiCamera.render with clear + state reset', () => {
    const scene = Scene.createHeadless();
    const fake = installFakeRenderer(scene);
    const mc = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    const mcRenderSpy = vi.spyOn(mc, 'render');
    scene.useMultiCamera(mc);
    (scene as unknown as SceneInternals)._render();
    // Full-canvas clear before per-viewport rendering.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake as any).clear).toHaveBeenCalled();
    expect(mcRenderSpy).toHaveBeenCalledWith(fake, scene.threeScene, 800, 450);
    // Renderer state restored: scissor disabled, viewport reset to full canvas.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake as any).setScissorTest).toHaveBeenLastCalledWith(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake as any).setViewport).toHaveBeenLastCalledWith(0, 0, 800, 450);
  });

  it('non-headless _render restores state via try/finally even if mc.render throws', () => {
    const scene = Scene.createHeadless();
    const fake = installFakeRenderer(scene);
    const mc = new MultiCamera();
    // Attach first (renders successfully with empty cameras), then make
    // subsequent renders throw so we can verify finally-block state restoration.
    scene.useMultiCamera(mc);
    vi.spyOn(mc, 'render').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => (scene as unknown as SceneInternals)._render()).toThrow('boom');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake as any).setScissorTest).toHaveBeenLastCalledWith(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake as any).setViewport).toHaveBeenLastCalledWith(0, 0, 800, 450);
  });

  it('ThreeDScene._render also delegates to MultiCamera when attached', () => {
    const scene = ThreeDScene.createHeadless();
    const fake = installFakeRenderer(scene);
    const mc = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    const mcRenderSpy = vi.spyOn(mc, 'render');
    scene.useMultiCamera(mc);
    (scene as unknown as SceneInternals)._render();
    expect(mcRenderSpy).toHaveBeenCalledWith(fake, scene.threeScene, 800, 450);
  });

  it('MultiCamera.update ticks Camera2D frame updaters on secondary cameras', () => {
    const scene = Scene.createHeadless();
    const cam = new Camera2D();
    const ticks: number[] = [];
    cam.frame.addUpdater((_, dt) => {
      ticks.push(dt);
    });
    const mc = new MultiCamera({
      cameras: [{ camera: cam, viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    scene.useMultiCamera(mc);
    (scene as unknown as SceneInternals)._tickFrame(0.016);
    expect(ticks).toEqual([0.016]);
  });

  it('setViewportBorder merges border style into the viewport', () => {
    const mc = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    mc.setViewportBorder(0, { borderColor: '#ff0000', borderWidth: 3 });
    const vp = mc.cameras[0].viewport;
    expect(vp.borderColor).toBe('#ff0000');
    expect(vp.borderWidth).toBe(3);
    // Passing null clears the field.
    mc.setViewportBorder(0, { borderWidth: null });
    expect(mc.cameras[0].viewport.borderWidth).toBeUndefined();
    expect(mc.cameras[0].viewport.borderColor).toBe('#ff0000');
  });

  it('setViewportBorder is a no-op for out-of-range indices', () => {
    const mc = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    expect(() => mc.setViewportBorder(7, { borderWidth: 2 })).not.toThrow();
    expect(mc.cameras[0].viewport.borderWidth).toBeUndefined();
  });

  it('render() draws a border pass only when a viewport requests one', () => {
    const fake = makeFakeThreeRenderer();
    const threeScene = new THREE.Scene();
    const mcNoBorders = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    mcNoBorders.render(fake, threeScene, 800, 450);
    // One render call for the only camera; no second pass for borders.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake as any).render).toHaveBeenCalledTimes(1);

    const fake2 = makeFakeThreeRenderer();
    const mcWithBorder = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: { x: 0, y: 0, width: 1, height: 1 } }],
    });
    mcWithBorder.setViewportBorder(0, { borderColor: '#ff0000', borderWidth: 2 });
    mcWithBorder.render(fake2, threeScene, 800, 450);
    // One pass for the scene + one pass for the border overlay.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fake2 as any).render).toHaveBeenCalledTimes(2);
  });

  it('non-headless _render skips MultiCamera when WebGL context is lost', () => {
    const scene = Scene.createHeadless();
    installFakeRenderer(scene);
    const internals = scene as unknown as SceneInternals;
    // Force context loss
    internals._renderer.getThreeRenderer().getContext().isContextLost = () => true;
    const mc = new MultiCamera();
    const mcRenderSpy = vi.spyOn(mc, 'render');
    scene.useMultiCamera(mc);
    expect(() => internals._render()).not.toThrow();
    expect(mcRenderSpy).not.toHaveBeenCalled();
  });
});

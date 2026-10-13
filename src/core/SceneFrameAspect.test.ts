import { describe, it, expect } from 'vitest';
import { Scene } from './Scene';
import { Square } from '../mobjects/geometry/Rectangle';
import { Dot } from '../mobjects/geometry/Dot';

/**
 * Tests for Scene.setFrameAspect — runtime aspect reconfiguration.
 *
 * The Reddit request (r/manim thread 1vyfrrx) is "one scene, four outputs":
 * author once, then render landscape (16:9) and portrait (9:16) from the
 * same source. setFrameAspect reconfigures the camera frame, the renderer
 * and the logical coordinate frame together, reusing the existing resize
 * path, so world coordinates stay sensible after the switch.
 */
describe('Scene.setFrameAspect', () => {
  it('keeps the frame height invariant and recomputes width for a portrait aspect', () => {
    const scene = Scene.createHeadless();

    scene.setFrameAspect(1080, 1920); // 9:16 portrait

    // Manim/fill convention: height stays, width tracks the aspect.
    expect(scene.camera.frameHeight).toBeCloseTo(8, 6);
    expect(scene.camera.frameWidth).toBeCloseTo(8 * (1080 / 1920), 6);
    // Renderer pixel dimensions follow the requested target.
    expect(scene.renderer.width).toBe(1080);
    expect(scene.renderer.height).toBe(1920);
  });

  it('recomputes width for a landscape aspect', () => {
    const scene = Scene.createHeadless();

    scene.setFrameAspect(1920, 1080); // 16:9 landscape

    expect(scene.camera.frameHeight).toBeCloseTo(8, 6);
    expect(scene.camera.frameWidth).toBeCloseTo(8 * (1920 / 1080), 6);
  });

  it('keeps a centered mobject centered across an aspect switch', () => {
    const scene = Scene.createHeadless();
    const dot = new Dot();
    dot.moveTo([0, 0, 0]);
    scene.add(dot);

    scene.setFrameAspect(1080, 1920);

    const c = dot.getCenter();
    expect(c[0]).toBeCloseTo(0, 6);
    expect(c[1]).toBeCloseTo(0, 6);
  });

  it('leaves world positions of off-center mobjects unchanged', () => {
    const scene = Scene.createHeadless();
    const square = new Square({ sideLength: 1 });
    square.moveTo([2, 1, 0]);
    scene.add(square);

    scene.setFrameAspect(1080, 1920);

    const c = square.getCenter();
    expect(c[0]).toBeCloseTo(2, 6);
    expect(c[1]).toBeCloseTo(1, 6);
  });

  it('is chainable and switches back to the default 16:9 cleanly', () => {
    const scene = Scene.createHeadless();

    const returned = scene.setFrameAspect(1080, 1920).setFrameAspect(1920, 1080);

    expect(returned).toBe(scene);
    expect(scene.camera.frameWidth / scene.camera.frameHeight).toBeCloseTo(16 / 9, 6);
  });

  it('rejects non-positive dimensions', () => {
    const scene = Scene.createHeadless();
    expect(() => scene.setFrameAspect(0, 1080)).toThrow();
    expect(() => scene.setFrameAspect(1920, -1)).toThrow();
  });
});

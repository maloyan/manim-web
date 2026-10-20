// @vitest-environment happy-dom
// Plain JS on purpose: files under docs/ resolve docs/tsconfig.json, which
// extends @docusaurus/tsconfig, and the root CI job does not install docs deps.
import { describe, it, expect, vi } from 'vitest';

// Mock three's WebGLRenderer so scenes can be constructed without real WebGL.
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  const MockWebGLRenderer = vi.fn().mockImplementation(function () {
    const canvas = document.createElement('canvas');
    return {
      setSize: vi.fn((w, h) => {
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      domElement: canvas,
      dispose: vi.fn(),
      render: vi.fn(),
    };
  });
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});

import * as manim from '../../../src/index';
import { createExampleScene } from './createExampleScene.js';

/**
 * Regression tests for issue #838: on a phone the docs example box is ~380px
 * wide, but the generated 3D factories hardcode `width: 800, height: 450`.
 * The canvas then overflowed the box (which clips with overflow: hidden), so
 * only its top-left part showed and the origin looked off-center.
 */
describe('createExampleScene (#838)', () => {
  const dims = { width: 380, height: 214 };

  // Mirrors the generated factories in docs/src/components/examples/.
  const fixedSizeFactory = (container, m) =>
    new m.ThreeDScene(container, {
      width: 800,
      height: 450,
      phi: 75 * (Math.PI / 180),
      theta: -45 * (Math.PI / 180),
      distance: 20,
      fov: 30,
    });

  it('fits a fixed-size 3D scene to the measured container', async () => {
    const container = document.createElement('div');
    const scene = await createExampleScene(container, manim, dims, fixedSizeFactory);

    expect(scene.renderer.width).toBe(dims.width);
    expect(scene.renderer.height).toBe(dims.height);
    const canvas = scene.getCanvas();
    expect(canvas.style.width).toBe(`${dims.width}px`);
    expect(canvas.style.height).toBe(`${dims.height}px`);
    expect(scene.camera3D.getCamera().aspect).toBeCloseTo(dims.width / dims.height);
    scene.dispose();
  });

  it('builds a default 2D scene at the measured size', async () => {
    const container = document.createElement('div');
    const scene = await createExampleScene(container, manim, dims);
    expect(scene.renderer.width).toBe(dims.width);
    expect(scene.renderer.height).toBe(dims.height);
    scene.dispose();
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock three's WebGLRenderer so Scene can be constructed without real WebGL.
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  const MockWebGLRenderer = vi.fn().mockImplementation(function () {
    return {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      domElement: document.createElement('canvas'),
      dispose: vi.fn(),
      render: vi.fn(),
    };
  });
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});

import { Scene } from './Scene';
import { VisibilityGate } from './VisibilityGate';
import { Circle } from '../mobjects/geometry';

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let fireIntersection: IOCallback = () => {};
const disconnect = vi.fn();

class MockIntersectionObserver {
  constructor(cb: IOCallback) {
    fireIntersection = cb;
  }
  observe() {}
  disconnect() {
    disconnect();
  }
}

const originalIO = globalThis.IntersectionObserver;

beforeEach(() => {
  disconnect.mockClear();
  (globalThis as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  (globalThis as { IntersectionObserver: unknown }).IntersectionObserver = originalIO;
});

describe('VisibilityGate', () => {
  // MIGRATION: example for the property
  //   ∀ sequences of (markStale | scroll out | scroll in): onShow fires exactly once per
  //   transition to visible that follows at least one markStale(), and never otherwise.
  // Replace with a property test once the suite lands.
  it('reports visibility and redraws once when shown after a skipped frame', () => {
    const onShow = vi.fn();
    const gate = new VisibilityGate(document.createElement('div'), onShow);
    expect(gate.isVisible).toBe(true);

    fireIntersection([{ isIntersecting: false }]);
    expect(gate.isVisible).toBe(false);
    fireIntersection([{ isIntersecting: true }]);
    expect(onShow).not.toHaveBeenCalled(); // nothing was skipped

    fireIntersection([{ isIntersecting: false }]);
    gate.markStale();
    gate.markStale();
    fireIntersection([{ isIntersecting: true }]);
    expect(onShow).toHaveBeenCalledTimes(1);

    gate.dispose();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('Scene pauseRenderingWhenHidden', () => {
  const tick = (scene: Scene) =>
    (scene as unknown as { _tickFrame(dt: number): void })._tickFrame(1 / 60);

  // MIGRATION: example for the property
  //   ∀ scenes, while hidden: animation frames advance mobject state but issue no
  //   renderer.render(); the first frame after becoming visible draws the current state.
  it('advances state without drawing while offscreen, then draws on return', () => {
    const scene = new Scene(document.createElement('div'), { width: 100, height: 100 });
    const render = vi.mocked(scene.renderer.getThreeRenderer().render);
    const circle = new Circle();
    let x = 0;
    circle.addUpdater((m) => m.moveTo([(x += 1), 0, 0]));
    scene.add(circle);

    fireIntersection([{ isIntersecting: false }]);
    render.mockClear();
    tick(scene);
    tick(scene);
    expect(render).not.toHaveBeenCalled();
    expect(circle.getCenter()[0]).toBeCloseTo(2);

    fireIntersection([{ isIntersecting: true }]);
    expect(render).toHaveBeenCalledTimes(1);
    tick(scene);
    expect(render).toHaveBeenCalledTimes(2);
    scene.dispose();
  });

  it('always draws when the option is off', () => {
    const scene = new Scene(document.createElement('div'), {
      width: 100,
      height: 100,
      pauseRenderingWhenHidden: false,
    });
    const render = vi.mocked(scene.renderer.getThreeRenderer().render);
    fireIntersection([{ isIntersecting: false }]);
    render.mockClear();
    tick(scene);
    expect(render).toHaveBeenCalledTimes(1);
    scene.dispose();
  });
});

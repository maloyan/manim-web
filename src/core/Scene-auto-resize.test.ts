// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock three's WebGLRenderer so Scene can be constructed without real WebGL.
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  const MockWebGLRenderer = vi.fn().mockImplementation(function () {
    const canvas = document.createElement('canvas');
    return {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      domElement: canvas,
      dispose: vi.fn(),
      render: vi.fn(),
    };
  });
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});

import { Scene } from './Scene';

/**
 * Regression tests for issue #360:
 * Canvas must resize on container/window changes (mobile rotation, browser
 * resize) instead of staying frozen at construction-time dimensions.
 */

// Capturable ResizeObserver so tests can fire observations on demand.
type ROCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
let lastObserver: { cb: ROCallback; targets: Element[]; disconnect: () => void } | null = null;

class MockResizeObserver {
  private _cb: ROCallback;
  private _targets: Element[] = [];
  constructor(cb: ROCallback) {
    this._cb = cb;
    lastObserver = {
      cb,
      targets: this._targets,
      disconnect: () => this.disconnect(),
    };
  }
  observe(el: Element) {
    this._targets.push(el);
  }
  unobserve(el: Element) {
    this._targets = this._targets.filter((t) => t !== el);
  }
  disconnect() {
    this._targets.length = 0;
  }
}

function fireResize() {
  if (!lastObserver) throw new Error('No ResizeObserver was installed');
  lastObserver.cb([], {} as ResizeObserver);
}

function flushRaf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function makeContainer(w: number, h: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientWidth', { value: w, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: h, configurable: true });
  document.body.appendChild(el);
  return el;
}

function setSize(el: HTMLElement, w: number, h: number) {
  Object.defineProperty(el, 'clientWidth', { value: w, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: h, configurable: true });
}

const originalRO = globalThis.ResizeObserver;

describe('Scene auto-resize (issue #360)', () => {
  beforeEach(() => {
    lastObserver = null;
    (globalThis as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    (globalThis as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = originalRO;
    document.body.innerHTML = '';
  });

  it('installs ResizeObserver on container when no explicit dimensions are passed', () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    expect(lastObserver).not.toBeNull();
    expect(lastObserver!.targets).toContain(container);
    scene.dispose();
  });

  it('does not install ResizeObserver when width and height are pinned', () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container, { width: 800, height: 450 });
    expect(lastObserver).toBeNull();
    scene.dispose();
  });

  it('does not install ResizeObserver when only width is pinned', () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container, { width: 800 });
    expect(lastObserver).toBeNull();
    scene.dispose();
  });

  it('does not install ResizeObserver when only height is pinned', () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container, { height: 450 });
    expect(lastObserver).toBeNull();
    scene.dispose();
  });

  it('does not install ResizeObserver when autoResize is false', () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container, { autoResize: false });
    expect(lastObserver).toBeNull();
    scene.dispose();
  });

  it('resizes renderer + camera when the container changes size', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const resizeSpy = vi.spyOn(scene, 'resize');
    const aspectSpy = vi.spyOn(scene.camera, 'setAspectRatio');

    setSize(container, 1200, 700);
    fireResize();
    await flushRaf();

    expect(resizeSpy).toHaveBeenCalledWith(1200, 700);
    expect(aspectSpy).toHaveBeenLastCalledWith(1200 / 700);

    scene.dispose();
  });

  it('coalesces rapid resize events into a single resize per frame', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const resizeSpy = vi.spyOn(scene, 'resize');

    setSize(container, 1000, 500);
    fireResize();
    fireResize();
    fireResize();
    await flushRaf();

    expect(resizeSpy).toHaveBeenCalledTimes(1);
    scene.dispose();
  });

  it('skips resize when container reports zero size (detached / hidden)', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const resizeSpy = vi.spyOn(scene, 'resize');

    setSize(container, 0, 0);
    fireResize();
    await flushRaf();

    expect(resizeSpy).not.toHaveBeenCalled();
    scene.dispose();
  });

  it('skips resize when dimensions are unchanged', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const resizeSpy = vi.spyOn(scene, 'resize');

    // Same size as construction.
    fireResize();
    await flushRaf();

    expect(resizeSpy).not.toHaveBeenCalled();
    scene.dispose();
  });

  it('responds to window resize as a fallback (no-RO browsers / orientation)', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const resizeSpy = vi.spyOn(scene, 'resize');

    setSize(container, 600, 800);
    window.dispatchEvent(new Event('resize'));
    await flushRaf();

    expect(resizeSpy).toHaveBeenCalledWith(600, 800);
    scene.dispose();
  });

  it('responds to orientationchange as a mobile fallback', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const resizeSpy = vi.spyOn(scene, 'resize');

    setSize(container, 480, 800);
    window.dispatchEvent(new Event('orientationchange'));
    await flushRaf();

    expect(resizeSpy).toHaveBeenCalledWith(480, 800);
    scene.dispose();
  });

  it('detaches observer + listeners on dispose', async () => {
    const container = makeContainer(800, 450);
    const scene = new Scene(container);
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const resizeSpy = vi.spyOn(scene, 'resize');

    scene.dispose();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    // Post-dispose events must not throw or trigger resize.
    setSize(container, 100, 100);
    window.dispatchEvent(new Event('resize'));
    fireResize();
    await flushRaf();
    expect(resizeSpy).not.toHaveBeenCalled();
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock three's WebGLRenderer so a Scene can be constructed without real WebGL.
// Each renderer owns a fresh canvas that it appends to / removes from the DOM,
// mirroring the production Renderer lifecycle the notebook helper relies on.
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

import { Scene } from '../core/Scene';
import { embedScene, observableScene, toHTMLElement } from './notebook';

function makeContainer(w = 640, h = 360): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientWidth', { value: w, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: h, configurable: true });
  document.body.appendChild(el);
  return el;
}

describe('embedScene', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a canvas inside the provided container', () => {
    const container = makeContainer();
    const { scene, element } = embedScene(container);
    expect(element).toBe(container);
    expect(container.querySelector('canvas')).toBeInstanceOf(HTMLCanvasElement);
    expect(scene).toBeInstanceOf(Scene);
    scene.dispose();
  });

  it('runs setup with the scene instance', () => {
    const container = makeContainer();
    const setup = vi.fn();
    const { scene, dispose } = embedScene(container, setup);
    expect(setup).toHaveBeenCalledTimes(1);
    expect(setup).toHaveBeenCalledWith(scene);
    dispose();
  });

  it('resolves ready after an async setup finishes', async () => {
    const container = makeContainer();
    const order: string[] = [];
    const { dispose, ready } = embedScene(container, async (scene) => {
      expect(scene).toBeInstanceOf(Scene);
      await Promise.resolve();
      order.push('setup');
    });
    await ready;
    order.push('after');
    expect(order).toEqual(['setup', 'after']);
    dispose();
  });

  it('creates its own container element when none is passed', () => {
    const { element, scene } = embedScene();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.querySelector('canvas')).toBeInstanceOf(HTMLCanvasElement);
    // A self-created node is detached until the caller inserts it.
    expect(element.parentNode).toBeNull();
    scene.dispose();
  });

  it('applies width/height sizing options to the Scene', () => {
    const container = makeContainer();
    const { scene, dispose } = embedScene(container, undefined, { width: 320, height: 200 });
    expect(scene.getWidth()).toBe(320);
    expect(scene.getHeight()).toBe(200);
    dispose();
  });

  it('derives height from width and aspect', () => {
    const { scene, dispose } = embedScene(undefined, undefined, { width: 400, aspect: 2 });
    expect(scene.getWidth()).toBe(400);
    expect(scene.getHeight()).toBe(200);
    dispose();
  });

  it('derives width from height and aspect', () => {
    const { scene, dispose } = embedScene(undefined, undefined, { height: 150, aspect: 16 / 9 });
    expect(scene.getHeight()).toBe(150);
    expect(scene.getWidth()).toBe(Math.round(150 * (16 / 9)));
    dispose();
  });

  it('sizes a self-created element from the resolved dimensions', () => {
    const { element, dispose } = embedScene(undefined, undefined, { width: 320, height: 240 });
    expect(element.style.width).toBe('320px');
    expect(element.style.height).toBe('240px');
    dispose();
  });

  it('adds className tokens to the element', () => {
    const container = makeContainer();
    const { dispose } = embedScene(container, undefined, { className: 'a b' });
    expect(container.classList.contains('a')).toBe(true);
    expect(container.classList.contains('b')).toBe(true);
    dispose();
  });

  it('dispose removes a self-created element and is safe to call twice', () => {
    const { element, scene, dispose } = embedScene();
    document.body.appendChild(element);
    const disposeSpy = vi.spyOn(scene, 'dispose');
    dispose();
    dispose();
    expect(element.parentNode).toBeNull();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('dispose keeps a caller-owned container but tears down the scene', () => {
    const container = makeContainer();
    const { dispose } = embedScene(container);
    dispose();
    // The caller owns the container, so the helper must not detach it.
    expect(container.parentNode).toBe(document.body);
    expect(container.querySelector('canvas')).toBeNull();
  });
});

describe('observableScene', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an element containing the canvas with the scene attached', () => {
    const node = observableScene((scene) => {
      expect(scene).toBeInstanceOf(Scene);
    });
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.querySelector('canvas')).toBeInstanceOf(HTMLCanvasElement);
    expect(node.scene).toBeInstanceOf(Scene);
    node.dispose();
  });

  it('disposes when the invalidation promise resolves', async () => {
    let invalidate!: () => void;
    const invalidation = new Promise<void>((resolve) => {
      invalidate = resolve;
    });
    const node = observableScene(undefined, { invalidation });
    const disposeSpy = vi.spyOn(node.scene, 'dispose');
    invalidate();
    await invalidation;
    await Promise.resolve();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('node.dispose is idempotent', () => {
    const node = observableScene();
    const disposeSpy = vi.spyOn(node.scene, 'dispose');
    node.dispose();
    node.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('toHTMLElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the container for a scene', () => {
    const container = makeContainer();
    const { scene, dispose } = embedScene(container);
    expect(toHTMLElement(scene)).toBe(container);
    dispose();
  });

  it('returns the element for an embedded result', () => {
    const embedded = embedScene();
    expect(toHTMLElement(embedded)).toBe(embedded.element);
    embedded.dispose();
  });
});

describe('headless guards', () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    // Simulate a Node / SSR environment with no document.
    Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true });
  });

  it('embedScene without a container throws a clear error', () => {
    expect(() => embedScene()).toThrow(/document/i);
  });

  it('observableScene throws a clear error', () => {
    expect(() => observableScene()).toThrow(/document/i);
  });
});

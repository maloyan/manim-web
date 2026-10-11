// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ManimSceneElement,
  registerManimElement,
  manimElementInternals,
  type ManimSceneFactory,
  type ManimSceneInstance,
} from './webcomponent';

// PlaybackControls is heavy (real DOM panel + requestAnimationFrame loop).
// Mock it so the element's control wiring can be asserted in isolation.
const mocks = vi.hoisted(() => ({
  constructedWith: [] as unknown[],
  disposeSpy: vi.fn(),
}));

vi.mock('../interaction/PlaybackControls', () => {
  class MockPlaybackControls {
    scene: unknown;
    dispose: () => void;
    constructor(scene: unknown) {
      this.scene = scene;
      this.dispose = mocks.disposeSpy;
      mocks.constructedWith.push(scene);
    }
  }
  return { PlaybackControls: MockPlaybackControls };
});

const TAG = 'manim-scene';

interface SceneMock {
  isPlaying: boolean;
  resume: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  timeline: null;
  getContainer: () => HTMLElement;
}

interface PlayerMock {
  isPlaying: boolean;
  loop: boolean;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  togglePlayPause: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  scene: { resize: ReturnType<typeof vi.fn> };
}

function makeSceneMock(): SceneMock {
  return {
    isPlaying: false,
    resume: vi.fn(),
    pause: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    timeline: null,
    getContainer: () => document.createElement('div'),
  };
}

function makePlayerMock(): PlayerMock {
  return {
    isPlaying: false,
    loop: false,
    play: vi.fn(),
    pause: vi.fn(),
    togglePlayPause: vi.fn(),
    dispose: vi.fn(),
    scene: { resize: vi.fn() },
  };
}

function asInstance(mock: SceneMock | PlayerMock): ManimSceneInstance {
  return mock as unknown as ManimSceneInstance;
}

function createElement(): ManimSceneElement {
  return document.createElement(TAG) as ManimSceneElement;
}

/** Flush a macrotask so queued custom-element reactions run. */
function flush(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

registerManimElement(TAG);

beforeEach(() => {
  mocks.constructedWith.length = 0;
  mocks.disposeSpy.mockClear();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('registerManimElement', () => {
  it('defines the custom element', () => {
    expect(customElements.get(TAG)).toBe(ManimSceneElement);
  });

  it('is idempotent and does not throw when called twice', () => {
    expect(() => {
      registerManimElement(TAG);
      registerManimElement(TAG);
    }).not.toThrow();
  });
});

describe('container', () => {
  it('builds a container div at the requested size on connect', async () => {
    const el = createElement();
    el.setAttribute('width', '640');
    el.setAttribute('height', '360');
    el.setAttribute('background', '#102030');
    document.body.appendChild(el);
    await el.whenReady();

    const container = el.firstElementChild as HTMLElement;
    expect(container).toBeInstanceOf(HTMLElement);
    expect(container.style.width).toBe('640px');
    expect(container.style.height).toBe('360px');
    expect(container.style.position).toBe('relative');
    expect(container.style.background).toBe('#102030');
  });

  it('falls back to default dimensions when attributes are absent', async () => {
    const el = createElement();
    document.body.appendChild(el);
    await el.whenReady();
    const container = el.firstElementChild as HTMLElement;
    expect(container.style.width).toBe('800px');
    expect(container.style.height).toBe('450px');
  });
});

describe('scene factory invocation', () => {
  it('invokes the factory set via the `scene` property with the container', async () => {
    const scene = makeSceneMock();
    const factory = vi.fn<ManimSceneFactory>(() => asInstance(scene));
    const el = createElement();
    el.scene = factory;
    document.body.appendChild(el);
    await el.whenReady();

    expect(factory).toHaveBeenCalledTimes(1);
    const container = el.firstElementChild as HTMLElement;
    expect(factory).toHaveBeenCalledWith(container);
  });

  it('supports an async factory', async () => {
    const scene = makeSceneMock();
    const factory = vi.fn<ManimSceneFactory>(() => Promise.resolve(asInstance(scene)));
    const el = createElement();
    el.scene = factory;
    document.body.appendChild(el);
    await el.whenReady();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('invokes the default export from a dynamically imported module (`src`)', async () => {
    const scene = makeSceneMock();
    const factory = vi.fn<ManimSceneFactory>(() => asInstance(scene));
    const importSpy = vi
      .spyOn(manimElementInternals, 'importModule')
      .mockResolvedValue({ default: factory });

    const el = createElement();
    el.setAttribute('src', './scene.js');
    document.body.appendChild(el);
    await el.whenReady();

    expect(importSpy).toHaveBeenCalledWith('./scene.js');
    expect(factory).toHaveBeenCalledTimes(1);
    const container = el.firstElementChild as HTMLElement;
    expect(factory).toHaveBeenCalledWith(container);
  });

  it('does nothing when neither `src` nor the `scene` property is set', async () => {
    const el = createElement();
    document.body.appendChild(el);
    await el.whenReady();
    // No instance, no controls — just the empty container.
    expect(mocks.constructedWith).toHaveLength(0);
    expect(el.firstElementChild).toBeInstanceOf(HTMLElement);
  });
});

describe('playback wiring', () => {
  it('autoplays a Scene via resume()', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.setAttribute('autoplay', '');
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();
    expect(scene.resume).toHaveBeenCalledTimes(1);
  });

  it('autoplays a Player via play() and sets loop', async () => {
    const player = makePlayerMock();
    const el = createElement();
    el.setAttribute('autoplay', '');
    el.setAttribute('loop', '');
    el.scene = () => asInstance(player);
    document.body.appendChild(el);
    await el.whenReady();
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.loop).toBe(true);
  });

  it('leaves loop false on a Player when the attribute is absent', async () => {
    const player = makePlayerMock();
    const el = createElement();
    el.scene = () => asInstance(player);
    document.body.appendChild(el);
    await el.whenReady();
    expect(player.loop).toBe(false);
    expect(player.play).not.toHaveBeenCalled();
  });

  it('does not autoplay when already playing', async () => {
    const scene = makeSceneMock();
    scene.isPlaying = true;
    const el = createElement();
    el.setAttribute('autoplay', '');
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();
    expect(scene.resume).not.toHaveBeenCalled();
  });
});

describe('controls', () => {
  it('attaches PlaybackControls to a bare Scene when `controls` is set', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.setAttribute('controls', '');
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();
    expect(mocks.constructedWith).toHaveLength(1);
    expect(mocks.constructedWith[0]).toBe(scene);
  });

  it('does not attach PlaybackControls to a Player (it has its own)', async () => {
    const player = makePlayerMock();
    const el = createElement();
    el.setAttribute('controls', '');
    el.scene = () => asInstance(player);
    document.body.appendChild(el);
    await el.whenReady();
    expect(mocks.constructedWith).toHaveLength(0);
  });

  it('does not attach controls when the attribute is absent', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();
    expect(mocks.constructedWith).toHaveLength(0);
  });
});

describe('resize on attribute change', () => {
  it('resizes the scene when width/height change', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.setAttribute('width', '800');
    el.setAttribute('height', '450');
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();

    el.setAttribute('width', '640');
    await flush();
    expect(scene.resize).toHaveBeenCalledWith(640, 450);
  });

  it('skips resize when a dimension is not numeric', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.setAttribute('width', '800');
    el.setAttribute('height', '450');
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();

    el.setAttribute('width', '100%');
    await flush();
    expect(scene.resize).not.toHaveBeenCalled();
  });
});

describe('cleanup on disconnect', () => {
  it('disposes the instance when removed from the DOM', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();

    el.remove();
    expect(scene.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes attached controls on disconnect', async () => {
    const scene = makeSceneMock();
    const el = createElement();
    el.setAttribute('controls', '');
    el.scene = () => asInstance(scene);
    document.body.appendChild(el);
    await el.whenReady();

    el.remove();
    expect(mocks.disposeSpy).toHaveBeenCalledTimes(1);
    expect(scene.dispose).toHaveBeenCalledTimes(1);
  });

  it('drops a mount whose factory resolves after disconnect', async () => {
    const scene = makeSceneMock();
    let resolveFactory: (value: ManimSceneInstance) => void = () => {};
    const factory = vi.fn<ManimSceneFactory>(
      () =>
        new Promise<ManimSceneInstance>((resolve) => {
          resolveFactory = resolve;
        }),
    );
    const el = createElement();
    el.scene = factory;
    document.body.appendChild(el);

    // Wait until the factory is actually invoked (and parked on its promise).
    await vi.waitFor(() => expect(factory).toHaveBeenCalledTimes(1));

    el.remove(); // disconnect before the factory resolves
    resolveFactory(asInstance(scene));
    await el.whenReady();

    // The superseded instance is disposed and never retained.
    expect(scene.dispose).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Renderer } from './Renderer';

const mockCanvas = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  parentElement: null,
  style: {},
};

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  // Must use function() (not arrow) so it can be called with `new`
  const MockWebGLRenderer = vi.fn().mockImplementation(function () {
    return {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      domElement: mockCanvas,
      dispose: vi.fn(),
      render: vi.fn(),
    };
  });
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});

function createContainer(): HTMLElement {
  return {
    clientWidth: 800,
    clientHeight: 450,
    appendChild: vi.fn(),
  } as unknown as HTMLElement;
}

describe('Renderer backgroundOpacity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults backgroundOpacity to 1', () => {
    const renderer = new Renderer(createContainer());
    expect(renderer.backgroundOpacity).toBe(1);
  });

  it('accepts backgroundOpacity in options', () => {
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 0.5 });
    expect(renderer.backgroundOpacity).toBe(0.5);
  });

  it('clamps backgroundOpacity to [0, 1] on construction', () => {
    const over = new Renderer(createContainer(), { backgroundOpacity: 2 });
    expect(over.backgroundOpacity).toBe(1);

    const under = new Renderer(createContainer(), { backgroundOpacity: -0.5 });
    expect(under.backgroundOpacity).toBe(0);
  });

  it('clamps backgroundOpacity to [0, 1] via setter', () => {
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 0 });
    renderer.backgroundOpacity = 5;
    expect(renderer.backgroundOpacity).toBe(1);

    renderer.backgroundOpacity = -1;
    expect(renderer.backgroundOpacity).toBe(0);
  });

  it('auto-enables alpha when backgroundOpacity < 1', () => {
    new Renderer(createContainer(), { backgroundOpacity: 0.5 });
    const ctorCall = (THREE.WebGLRenderer as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(ctorCall.alpha).toBe(true);
  });

  it('does not enable alpha when backgroundOpacity is 1', () => {
    new Renderer(createContainer(), { backgroundOpacity: 1 });
    const ctorCall = (THREE.WebGLRenderer as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(ctorCall.alpha).toBe(false);
  });

  it('respects explicit alpha=true even when backgroundOpacity is 1', () => {
    new Renderer(createContainer(), { alpha: true, backgroundOpacity: 1 });
    const ctorCall = (THREE.WebGLRenderer as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(ctorCall.alpha).toBe(true);
  });

  it('passes backgroundOpacity to setClearColor on construction', () => {
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 0.3 });
    const mockRenderer = (renderer as any)._renderer;
    expect(mockRenderer.setClearColor).toHaveBeenCalledWith(expect.any(THREE.Color), 0.3);
  });

  it('passes backgroundOpacity to setClearColor when setter is used', () => {
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 0 });
    const mockRenderer = (renderer as any)._renderer;
    mockRenderer.setClearColor.mockClear();

    renderer.backgroundOpacity = 0.7;
    expect(mockRenderer.setClearColor).toHaveBeenCalledWith(expect.any(THREE.Color), 0.7);
  });

  it('warns when setting opacity < 1 on non-alpha context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 1 });

    renderer.backgroundOpacity = 0.5;
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('backgroundOpacity < 1 has no effect'),
    );

    warnSpy.mockRestore();
  });

  it('does not warn when setting opacity < 1 on alpha context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 0 });

    renderer.backgroundOpacity = 0.5;
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('updates setClearColor when backgroundColor is changed', () => {
    const renderer = new Renderer(createContainer(), { backgroundOpacity: 0.4 });
    const mockRenderer = (renderer as any)._renderer;
    mockRenderer.setClearColor.mockClear();

    renderer.backgroundColor = '#ff0000';
    expect(mockRenderer.setClearColor).toHaveBeenCalledWith(expect.any(THREE.Color), 0.4);
  });
});

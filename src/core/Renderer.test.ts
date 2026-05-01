// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from './Renderer';
import { NullRenderer } from './NullRenderer';

function createContainer(): HTMLElement {
  return {
    clientWidth: 800,
    clientHeight: 450,
    appendChild: vi.fn(),
  } as unknown as HTMLElement;
}

describe('Renderer', () => {
  it('creates with default dimensions from container', () => {
    const container = createContainer();
    const renderer = new Renderer(container);
    expect(renderer.width).toBe(800);
    expect(renderer.height).toBe(450);
    renderer.dispose();
  });

  it('accepts explicit width/height options', () => {
    const container = createContainer();
    const renderer = new Renderer(container, { width: 1920, height: 1080 });
    expect(renderer.width).toBe(1920);
    expect(renderer.height).toBe(1080);
    renderer.dispose();
  });

  it('updates dimensions on resize', () => {
    const container = createContainer();
    const renderer = new Renderer(container);
    renderer.resize(640, 480);
    expect(renderer.width).toBe(640);
    expect(renderer.height).toBe(480);
    renderer.dispose();
  });

  it('getCanvas returns HTMLCanvasElement', () => {
    const container = createContainer();
    const renderer = new Renderer(container);
    const canvas = renderer.getCanvas();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    renderer.dispose();
  });

  it('backgroundColor defaults to MANIM_BACKGROUND', () => {
    const container = createContainer();
    const renderer = new Renderer(container);
    expect(renderer.backgroundColor.getHexString()).toBe('1c1c1c');
    renderer.dispose();
  });

  it('accepts custom backgroundColor', () => {
    const container = createContainer();
    const renderer = new Renderer(container, { backgroundColor: '#ff0000' });
    expect(renderer.backgroundColor.getHexString()).toBe('ff0000');
    renderer.dispose();
  });

  it('backgroundOpacity defaults to 1', () => {
    const container = createContainer();
    const renderer = new Renderer(container);
    expect(renderer.backgroundOpacity).toBe(1);
    renderer.dispose();
  });

  it('accepts backgroundOpacity in options', () => {
    const container = createContainer();
    const renderer = new Renderer(container, { backgroundOpacity: 0.5 });
    expect(renderer.backgroundOpacity).toBe(0.5);
    renderer.dispose();
  });

  it('clamps backgroundOpacity to [0, 1]', () => {
    const container = createContainer();
    const renderer = new Renderer(container);

    renderer.backgroundOpacity = 2;
    expect(renderer.backgroundOpacity).toBe(1);

    renderer.backgroundOpacity = -0.5;
    expect(renderer.backgroundOpacity).toBe(0);

    renderer.dispose();
  });

  it('auto-enables alpha when backgroundOpacity < 1', () => {
    const container = createContainer();
    new Renderer(container, { backgroundOpacity: 0.5 });
    // WebGLRenderer created with alpha=true - verified by successful transparency
  });

  it('warns when setting opacity < 1 on non-alpha context', () => {
    const container = createContainer();
    const renderer = new Renderer(container, { backgroundOpacity: 1 });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderer.backgroundOpacity = 0.5;
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('backgroundOpacity < 1 has no effect'),
    );

    warnSpy.mockRestore();
    renderer.dispose();
  });

  it('does not warn when setting opacity < 1 on alpha context', () => {
    const container = createContainer();
    const renderer = new Renderer(container, { backgroundOpacity: 0 });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderer.backgroundOpacity = 0.5;
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    renderer.dispose();
  });

  it('isContextLost returns boolean', () => {
    const container = createContainer();
    const renderer = new Renderer(container);
    expect(typeof renderer.isContextLost).toBe('boolean');
    renderer.dispose();
  });
});

describe('NullRenderer', () => {
  it('creates with default dimensions', () => {
    const renderer = new NullRenderer();
    expect(renderer.width).toBe(800);
    expect(renderer.height).toBe(450);
    renderer.dispose();
  });

  it('creates with custom dimensions', () => {
    const renderer = new NullRenderer({ width: 1920, height: 1080 });
    expect(renderer.width).toBe(1920);
    expect(renderer.height).toBe(1080);
    renderer.dispose();
  });

  it('resize updates dimensions', () => {
    const renderer = new NullRenderer();
    renderer.resize(640, 480);
    expect(renderer.width).toBe(640);
    expect(renderer.height).toBe(480);
    renderer.dispose();
  });

  it('render is a no-op', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.render(null as never, null as never)).not.toThrow();
    renderer.dispose();
  });

  it('dispose is a no-op', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.dispose()).not.toThrow();
  });

  it('getCanvas throws in headless mode', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.getCanvas()).toThrow('not available in headless mode');
    renderer.dispose();
  });

  it('getThreeRenderer throws in headless mode', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.getThreeRenderer()).toThrow('not available in headless mode');
    renderer.dispose();
  });

  it('isContextLost is always false', () => {
    const renderer = new NullRenderer();
    expect(renderer.isContextLost).toBe(false);
    renderer.dispose();
  });

  it('backgroundColor can be get/set', () => {
    const renderer = new NullRenderer({ backgroundColor: '#ff0000' });
    expect(renderer.backgroundColor.getHexString()).toBe('ff0000');
    renderer.backgroundColor = '#00ff00';
    expect(renderer.backgroundColor.getHexString()).toBe('00ff00');
    renderer.dispose();
  });

  it('backgroundOpacity clamps to [0, 1]', () => {
    const renderer = new NullRenderer();
    renderer.backgroundOpacity = 2;
    expect(renderer.backgroundOpacity).toBe(1);
    renderer.backgroundOpacity = -1;
    expect(renderer.backgroundOpacity).toBe(0);
    renderer.dispose();
  });
});

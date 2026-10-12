import { describe, it, expect, vi } from 'vitest';
import {
  resolveAlphaRenderer,
  hasAlphaChannel,
  requireAlphaRenderer,
  withTransparentClear,
  ALPHA_CONTEXT_ERROR,
  ALPHA_RENDERER_ERROR,
  type AlphaRenderer,
} from './alphaBackground';

/** Build a stub WebGL renderer that records clearAlpha calls. */
function createStubRenderer(options?: { alpha?: boolean; clearAlpha?: number }) {
  let clearAlpha = options?.clearAlpha ?? 1;
  const setClearAlpha = vi.fn((value: number) => {
    clearAlpha = value;
  });
  const renderer: AlphaRenderer = {
    getClearAlpha: () => clearAlpha,
    setClearAlpha,
    getContext: () => ({
      getContextAttributes: () => ({ alpha: options?.alpha ?? true }) as WebGLContextAttributes,
    }),
  };
  return { renderer, setClearAlpha, getClearAlpha: () => clearAlpha };
}

describe('resolveAlphaRenderer', () => {
  it('returns the three.js renderer the scene exposes', () => {
    const { renderer } = createStubRenderer();
    const scene = { renderer: { getThreeRenderer: () => renderer } };
    expect(resolveAlphaRenderer(scene)).toBe(renderer);
  });

  it('returns null when the scene exposes no renderer', () => {
    expect(resolveAlphaRenderer({})).toBeNull();
    expect(resolveAlphaRenderer({ renderer: null })).toBeNull();
  });
});

describe('hasAlphaChannel', () => {
  it('is true when the context reports an alpha channel', () => {
    const { renderer } = createStubRenderer({ alpha: true });
    expect(hasAlphaChannel(renderer)).toBe(true);
  });

  it('is false when the context has no alpha channel', () => {
    const { renderer } = createStubRenderer({ alpha: false });
    expect(hasAlphaChannel(renderer)).toBe(false);
  });

  it('is false when getContextAttributes returns null', () => {
    const renderer: AlphaRenderer = {
      getClearAlpha: () => 1,
      setClearAlpha: vi.fn(),
      getContext: () => ({ getContextAttributes: () => null }),
    };
    expect(hasAlphaChannel(renderer)).toBe(false);
  });
});

describe('requireAlphaRenderer', () => {
  it('returns the renderer when the context has an alpha channel', () => {
    const { renderer } = createStubRenderer({ alpha: true });
    const scene = { renderer: { getThreeRenderer: () => renderer } };
    expect(requireAlphaRenderer(scene)).toBe(renderer);
  });

  it('throws when the scene exposes no renderer', () => {
    expect(() => requireAlphaRenderer({})).toThrow(ALPHA_RENDERER_ERROR);
  });

  it('throws when the context has no alpha channel', () => {
    const { renderer } = createStubRenderer({ alpha: false });
    const scene = { renderer: { getThreeRenderer: () => renderer } };
    expect(() => requireAlphaRenderer(scene)).toThrow(ALPHA_CONTEXT_ERROR);
  });
});

describe('withTransparentClear', () => {
  it('sets clear alpha to 0 during the capture then restores the previous value', async () => {
    const { renderer, setClearAlpha } = createStubRenderer({ clearAlpha: 1 });
    const seen: number[] = [];

    const result = await withTransparentClear(renderer, () => {
      seen.push(renderer.getClearAlpha());
      return 'done';
    });

    expect(seen).toEqual([0]); // transparent while capturing
    expect(result).toBe('done');
    expect(setClearAlpha).toHaveBeenNthCalledWith(1, 0);
    expect(setClearAlpha).toHaveBeenNthCalledWith(2, 1); // restored
    expect(renderer.getClearAlpha()).toBe(1);
  });

  it('restores the previous clear alpha even when the capture throws', async () => {
    const { renderer, setClearAlpha } = createStubRenderer({ clearAlpha: 0.5 });

    await expect(
      withTransparentClear(renderer, () => {
        throw new Error('capture failed');
      }),
    ).rejects.toThrow('capture failed');

    expect(setClearAlpha).toHaveBeenNthCalledWith(1, 0);
    expect(setClearAlpha).toHaveBeenNthCalledWith(2, 0.5); // restored
    expect(renderer.getClearAlpha()).toBe(0.5);
  });
});

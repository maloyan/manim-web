import { describe, it, expect, vi, afterEach } from 'vitest';
import { registerFont } from './registerFont';

/**
 * Tests for `registerFont` (Manim CE `register_font`). This file runs in the
 * default Node environment (no `// @vitest-environment` directive), so the CSS
 * Font Loading API is absent until it is stubbed.
 */
describe('registerFont', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when the CSS Font Loading API is unavailable', () => {
    expect(registerFont('Inter', 'https://example.com/Inter.woff2')).toBe(false);
  });

  it('adds a FontFace to document.fonts when the API is available', () => {
    const add = vi.fn();
    class FakeFontFace {
      family: string;
      source: string | BufferSource;
      constructor(family: string, source: string | BufferSource) {
        this.family = family;
        this.source = source;
      }
    }
    vi.stubGlobal('FontFace', FakeFontFace);
    vi.stubGlobal('document', { fonts: { add } });

    const result = registerFont('Inter', 'https://example.com/Inter.woff2');

    expect(result).toBe(true);
    expect(add).toHaveBeenCalledTimes(1);
    const added = add.mock.calls[0][0] as FakeFontFace;
    expect(added).toBeInstanceOf(FakeFontFace);
    expect(added.family).toBe('Inter');
    // A bare URL is wrapped as a CSS url() source.
    expect(added.source).toBe('url("https://example.com/Inter.woff2")');
  });

  it('passes an explicit CSS source through unchanged', () => {
    const add = vi.fn();
    class FakeFontFace {
      source: string | BufferSource;
      constructor(_family: string, source: string | BufferSource) {
        this.source = source;
      }
    }
    vi.stubGlobal('FontFace', FakeFontFace);
    vi.stubGlobal('document', { fonts: { add } });

    registerFont('Inter', 'local("Inter")');

    const added = add.mock.calls[0][0] as FakeFontFace;
    expect(added.source).toBe('local("Inter")');
  });
});

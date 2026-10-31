// @vitest-environment happy-dom
/**
 * Write on texture Text (no loaded glyph outlines) reveals it glyph by glyph
 * with Manim CE's lag (min(4 / glyphs, 0.2)) and linear timing, instead of
 * fading the whole text in at once.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { Text } from '../../mobjects/text/Text';
import { Write } from './Create';

function mockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((text: string) => ({
      width: text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 10,
    })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('Write on texture Text', () => {
  afterEach(() => vi.restoreAllMocks());

  // MIGRATION: example for the property
  //   ∀ Text with n visible glyphs, linear time t: under Write, glyph i is
  //   revealed by its own lag window (r = min(4/n, 0.2)); glyphs are monotone
  //   non-increasing in reading order, and finish() removes the mask.
  // Replace with a property test once the suite lands.
  it('reveals glyphs in reading order and clears the mask at the end', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((id: string) =>
      id === '2d' ? mockCtx() : null,
    );
    const text = new Text({ text: 'Hi there' });
    const rects = text.getGlyphRects();
    expect(rects).toHaveLength(7); // whitespace has no glyph

    const reveal = vi.spyOn(text, 'setGlyphRevealAlphas');
    const anim = new Write(text, { duration: 1 });
    anim.update(0, 0);
    anim.update(0, 0.3);

    const alphas = reveal.mock.calls[reveal.mock.calls.length - 1][0] as number[];
    expect(alphas).toHaveLength(7);
    expect(alphas[0]).toBeGreaterThan(0);
    expect(alphas[6]).toBe(0);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]).toBeLessThanOrEqual(alphas[i - 1]);
    const material = text.getTextureMesh()?.material as THREE.MeshBasicMaterial;
    expect(material.alphaMap).not.toBeNull();

    anim.finish();
    expect(reveal).toHaveBeenLastCalledWith(null);
    expect(material.alphaMap).toBeNull();
  });
});

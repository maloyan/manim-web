// @vitest-environment happy-dom
/**
 * Text uses Manim CE's Text em size: at font size 48 one em is 2/3 of a
 * world unit (Manim CE: `Text('—', font='Arial').width` is 0.667), not the
 * 0.5 that MathTex uses.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Text } from './Text';
import { TEXT_FONT_SIZE_IN_WORLD_SPACE } from '../../constants/fontRender';

/** A 2D context whose glyphs are exactly one em wide. */
function emWideCtx(): CanvasRenderingContext2D {
  const ctx = {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((text: string) => {
      // Text sets the canvas font in pt; 1pt = 4/3 canvas px.
      const px = (Number(/([\d.]+)pt/.exec(ctx.font)?.[1] ?? 10) * 4) / 3;
      const width = text.length * px;
      return {
        width,
        actualBoundingBoxAscent: px * 0.7,
        actualBoundingBoxDescent: px * 0.2,
        fontBoundingBoxAscent: px * 0.8,
        fontBoundingBoxDescent: px * 0.2,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: width,
      };
    }),
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
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

describe('Text em size', () => {
  afterEach(() => vi.restoreAllMocks());

  // MIGRATION: example for the property
  //   ∀ font size f, ∀ string s of n one-em glyphs:
  //   Text(s, f) is n · TEXT_FONT_SIZE_IN_WORLD_SPACE · f / 48 wide (plus padding).
  // Replace with a property test once the suite lands.
  it('is 2/3 of a world unit per em at font size 48, scaling with font size', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((id: string) =>
      id === '2d' ? emWideCtx() : null,
    );
    const one = new Text({ text: '—', fontSize: 48 }).getWidth();
    const eleven = new Text({ text: '—'.repeat(11), fontSize: 48 }).getWidth();
    const big = new Text({ text: '—'.repeat(11), fontSize: 96 }).getWidth();

    // Padding cancels in the difference: ten extra glyphs, ten extra ems.
    expect((eleven - one) / 10).toBeCloseTo(TEXT_FONT_SIZE_IN_WORLD_SPACE, 3);
    expect(TEXT_FONT_SIZE_IN_WORLD_SPACE).toBeCloseTo(2 / 3, 6);
    expect(big / eleven).toBeCloseTo(2, 2);
  });
});

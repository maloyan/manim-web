// @vitest-environment happy-dom
/**
 * Regression: `copy()` of a scaled+normalized textured mobject must retain its
 * visual size (no shrink).
 *
 * `Mobject.copy()` only copies `scaleVector`, while the textured `_createCopy`
 * rebuilds from text/latex+fontSize. After `normalizeTransform()` a scaled
 * mobject has `scaleVector` reset to 1 and its scale folded into the persistent
 * size (`_worldWidth/_worldHeight` for Text; `_renderState.width/height` for
 * MathTexImage). Without carrying that size the copy re-measures to the UNSCALED
 * size and shrinks — visible when `copy()` is used by animation snapshot /
 * Transform / saveState-restore infra.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { Text } from './Text';
import { MarkupText } from './MarkupText';
import { Paragraph } from './Paragraph';
import { MathTexImage } from './MathTexImage';

function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((_text: string) => ({
      width: _text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: _text.length * 10,
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

const widthOf = (m: { getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } }): number => {
  const b = m.getBounds();
  return b.max.x - b.min.x;
};
const heightOf = (m: { getBounds(): { min: THREE.Vector3; max: THREE.Vector3 } }): number => {
  const b = m.getBounds();
  return b.max.y - b.min.y;
};

describe('copy() retains visual size after scale + normalize', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((id: string) =>
      id === '2d' ? createMockCtx() : null,
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('Text copy keeps width/height (no shrink)', () => {
    const t = new Text({ text: 'Hello' });
    t.scale(2);
    t.normalizeTransform();
    const wBefore = widthOf(t);
    const hBefore = heightOf(t);

    const copy = t.copy() as Text;
    expect(widthOf(copy)).toBeCloseTo(wBefore, 5);
    expect(heightOf(copy)).toBeCloseTo(hBefore, 5);
  });

  it('Text copy of an UNSCALED Text is unchanged (robust regardless of normalize)', () => {
    const t = new Text({ text: 'Plain' });
    const wBefore = widthOf(t);
    const copy = t.copy() as Text;
    expect(widthOf(copy)).toBeCloseTo(wBefore, 5);
  });

  it('MarkupText copy keeps width', () => {
    const t = new MarkupText({ text: 'Hi' });
    t.scale(3);
    t.normalizeTransform();
    const wBefore = widthOf(t);
    const copy = t.copy() as MarkupText;
    expect(widthOf(copy)).toBeCloseTo(wBefore, 5);
  });

  it('Paragraph copy keeps width', () => {
    const t = new Paragraph({ text: 'a\nb' });
    t.scale(2.5);
    t.normalizeTransform();
    const wBefore = widthOf(t);
    const copy = t.copy() as Paragraph;
    expect(widthOf(copy)).toBeCloseTo(wBefore, 5);
  });
});

describe('MathTexImage copy retains visual size after scale + normalize', () => {
  beforeEach(() => {
    // happy-dom has no 2D canvas; stub the async render so `_renderState` size is
    // not overwritten by a real render. We drive size explicitly to mimic a
    // post-`waitForRender()` scaled+normalized instance.
    vi.spyOn(
      MathTexImage.prototype as unknown as { _renderLatex(): Promise<void> },
      '_renderLatex',
    ).mockResolvedValue(undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  const makeSized = (w: number, h: number): MathTexImage => {
    const tex = new MathTexImage({ latex: 'M' });
    const rs = (tex as unknown as { _renderState: { width: number; height: number } })._renderState;
    rs.width = w;
    rs.height = h;
    tex.getThreeObject();
    tex.applyVisualSize(w, h);
    return tex;
  };
  const planeSize = (tex: MathTexImage): { w: number; h: number } => {
    const mesh = tex.getDisplayMeshes()[0];
    const p = (mesh.geometry as THREE.PlaneGeometry).parameters;
    return { w: p.width, h: p.height };
  };

  it('single-part copy keeps the baked size (no shrink)', async () => {
    const tex = makeSized(1, 0.5);
    tex.scale(7);
    tex.normalizeTransform();
    const before = planeSize(tex);
    expect(before.w).toBeCloseTo(7, 4); // sanity: scale was baked

    const copy = tex.copy() as MathTexImage;
    // Eager apply: size correct before the async re-render settles.
    expect(planeSize(copy).w).toBeCloseTo(before.w, 4);
    expect(planeSize(copy).h).toBeCloseTo(before.h, 4);

    // After the (stubbed) re-render settles, the override re-applies the size and
    // is cleared — still no shrink.
    await copy.waitForRender();
    expect(planeSize(copy).w).toBeCloseTo(before.w, 4);
    expect(planeSize(copy).h).toBeCloseTo(before.h, 4);
  });

  it('override is consumed once (cleared after render settles)', async () => {
    const tex = makeSized(1, 0.5);
    tex.scale(4);
    tex.normalizeTransform();
    const copy = tex.copy() as MathTexImage;
    await copy.waitForRender();
    const override = (copy as unknown as { _visualSizeOverride: unknown })._visualSizeOverride;
    expect(override).toBeNull();
  });
});

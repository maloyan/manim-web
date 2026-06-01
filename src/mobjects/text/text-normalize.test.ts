// @vitest-environment happy-dom
/**
 * Issue 1 regression: a scaled `Text` must survive `normalizeTransform()`.
 *
 * Before the fix, `Text` inherited `TexturedMobject`'s default
 * `_currentVisualSize() => null`, so `_bakeOwnGeometry` skipped scale-baking
 * while the base `normalizeTransform` still reset `scaleVector` to 1 — a scaled
 * Text shrank back to its unscaled size (visible inside a VGroup, which
 * normalizes on construction). The fix folds the scale into the persistent
 * `_worldWidth`/`_worldHeight` (used by the plane geometry) so `getBounds()`
 * stays unchanged across normalize.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Text } from './Text';

/** Mock 2D context — happy-dom has no canvas 2d support. */
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

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') return createMockCtx();
    return null;
  });
});

describe('Text scale survives normalizeTransform (Issue 1)', () => {
  it('folds scale into the persistent size so bounds are unchanged across normalize', () => {
    const t = new Text({ text: 'Hello' });

    t.scale(2);
    const before = t.getBounds();
    const wBefore = before.max.x - before.min.x;
    const hBefore = before.max.y - before.min.y;

    t.normalizeTransform();

    // Transform is now identity; the scale lives in the geometry size.
    expect(t.scaleVector.x).toBeCloseTo(1, 6);
    expect(t.scaleVector.y).toBeCloseTo(1, 6);

    const after = t.getBounds();
    const wAfter = after.max.x - after.min.x;
    const hAfter = after.max.y - after.min.y;

    // No shrink: bounds must be preserved.
    expect(wAfter).toBeCloseTo(wBefore, 5);
    expect(hAfter).toBeCloseTo(hBefore, 5);
  });

  it('mesh is not shrunk — its local scale stays at 1 after baking', () => {
    const t = new Text({ text: 'World' });
    t.scale(3);
    t.normalizeTransform();

    const mesh = t.getDisplayMeshes()[0];
    expect(mesh.scale.x).toBeCloseTo(1, 6);
    expect(mesh.scale.y).toBeCloseTo(1, 6);
  });

  it('baked size matches the original scaled bounds (no double-application)', () => {
    const a = new Text({ text: 'Same' });
    const b = new Text({ text: 'Same' });

    const baseline = a.getBounds();
    const wBaseline = baseline.max.x - baseline.min.x;

    b.scale(2);
    b.normalizeTransform();
    const baked = b.getBounds();
    const wBaked = baked.max.x - baked.min.x;

    expect(wBaked).toBeCloseTo(wBaseline * 2, 5);
  });
});

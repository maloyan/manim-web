// @vitest-environment happy-dom
/**
 * Regression tests for the DURABLE fallback bake in TexturedMobject._bakeFallbackScale,
 * as overridden by Text. Covers the cases the size-bake path cannot handle:
 *  - scaling + normalizing BEFORE the canvas produced dimensions (no 2D context yet)
 *  - a later applyVisualSize must compose with / override the fallback, not lose it
 *
 * Before the fix, the pre-render scale went into mesh.scale and was lost when a
 * later applyVisualSize() reset mesh.scale to 1 (the MEDIUM finding).
 */
import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';
import { Text } from './Text';

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
  } as unknown as CanvasRenderingContext2D;
}

describe('Text pre-render scale survives via durable fallback', () => {
  it('scale before canvas dims (size unmeasured) is preserved once the canvas renders', () => {
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((contextId: string) => (contextId === '2d' ? createMockCtx() : null));

    try {
      const t = new Text({ text: 'Hello' });

      // Simulate the headless / not-yet-measured state: no world dims yet, so
      // _currentVisualSize() returns null and the durable fallback path is taken.
      const tt = t as unknown as {
        _worldWidth: number;
        _worldHeight: number;
        _currentVisualSize(): unknown;
        _canvasDirty: boolean;
        _renderToCanvas(): void;
        _updateMesh(): void;
      };
      tt._worldWidth = 0;
      tt._worldHeight = 0;
      // _currentVisualSize() calls getThreeObject() which re-renders; null only if
      // measurement yields 0. With a real ctx it remeasures, so assert the bake
      // path directly by stubbing the size getter to null for this scale.
      const sizeSpy = vi.spyOn(tt, '_currentVisualSize').mockReturnValue(null);

      t.scale(2);
      t.normalizeTransform();
      expect(t.scaleVector.x).toBeCloseTo(1, 6);
      sizeSpy.mockRestore();

      // Now the canvas re-renders (recomputing _worldWidth/Height) and rebuilds.
      tt._canvasDirty = true;
      tt._renderToCanvas();
      tt._updateMesh();

      const geom = t.getDisplayMeshes()[0].geometry as THREE.PlaneGeometry;
      const baseW = tt._worldWidth;
      const baseH = tt._worldHeight;

      // Geometry must reflect the baked 2x factor over the freshly measured size,
      // i.e. the pre-render scale was NOT lost by the re-render.
      expect(baseW).toBeGreaterThan(0);
      expect(geom.parameters.width).toBeCloseTo(baseW * 2, 4);
      expect(geom.parameters.height).toBeCloseTo(baseH * 2, 4);
    } finally {
      ctxSpy.mockRestore();
    }
  });

  it('a later applyVisualSize overrides the fallback factor (no double-apply, no loss)', () => {
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((contextId: string) => (contextId === '2d' ? createMockCtx() : null));

    try {
      const t = new Text({ text: 'World' });
      // Force the fallback even though dims exist, by calling it directly with a
      // factor (simulates the non-uniform-rotated unsupported path).
      (t as unknown as { _bakeFallbackScale(x: number, y: number): void })._bakeFallbackScale(2, 2);

      const geomBefore = t.getDisplayMeshes()[0].geometry as THREE.PlaneGeometry;
      const baseW = (t as unknown as { _worldWidth: number })._worldWidth;
      expect(geomBefore.parameters.width).toBeCloseTo(baseW * 2, 4);

      // Explicit size carries the full scale; the fallback factor must be dropped.
      t.applyVisualSize(4, 3);
      const geomAfter = t.getDisplayMeshes()[0].geometry as THREE.PlaneGeometry;
      expect(geomAfter.parameters.width).toBeCloseTo(4, 4);
      expect(geomAfter.parameters.height).toBeCloseTo(3, 4);
      expect(t.getDisplayMeshes()[0].scale.x).toBeCloseTo(1, 6);
    } finally {
      ctxSpy.mockRestore();
    }
  });

  it('the supported post-render uniform-scale path still bakes into size (unchanged)', () => {
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((contextId: string) => (contextId === '2d' ? createMockCtx() : null));

    try {
      const t = new Text({ text: 'Same' });
      const baseline = t.getBounds();
      const w0 = baseline.max.x - baseline.min.x;

      t.scale(2);
      t.normalizeTransform();
      const after = t.getBounds();
      expect(after.max.x - after.min.x).toBeCloseTo(w0 * 2, 5);
      // Uniform post-render path uses the size bake, leaving the fallback factor at 1.
      expect((t as unknown as { _bakedScaleX: number })._bakedScaleX).toBeCloseTo(1, 6);
    } finally {
      ctxSpy.mockRestore();
    }
  });
});

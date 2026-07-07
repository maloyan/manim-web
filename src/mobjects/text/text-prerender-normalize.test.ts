// @vitest-environment happy-dom
/**
 * Pre-render scale durability for Text.
 *
 * MIGRATION (absolutize): the pre-render scale is no longer routed through a
 * durable `_bakeFallbackScale` factor that the size-bake path could not handle.
 * normalize simply retains the scale on `scaleVector` (which lives on the display
 * group, not the plane mesh), so a scale applied BEFORE the canvas produced
 * dimensions survives the later canvas render automatically — the render rebuilds
 * the plane geometry but never touches the Mobject transform.
 */
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { Text } from "./Text";

function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: "",
    textBaseline: "top",
    textAlign: "center",
    fillStyle: "",
    strokeStyle: "",
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

describe("Text pre-render scale survives via absolutized scaleVector", () => {
  it("scale before canvas dims (size unmeasured) is preserved once the canvas renders", () => {
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((
        contextId: string,
      ) => (contextId === "2d" ? createMockCtx() : null));

    try {
      const t = new Text({ text: "Hello" });

      // Simulate the headless / not-yet-measured state: no world dims yet.
      const tt = t as unknown as {
        _worldWidth: number;
        _worldHeight: number;
        _canvasDirty: boolean;
        _renderToCanvas(): void;
        _updateMesh(): void;
      };
      tt._worldWidth = 0;
      tt._worldHeight = 0;

      t.scale(2);
      t.normalizeTransform();
      // MIGRATION: scale is retained on scaleVector (absolutized), not folded into
      // a `_bakedScale` fallback. It lives on the display group and survives the
      // later canvas render below.
      expect(t.scaleVector.x).toBeCloseTo(2, 6);

      // Now the canvas re-renders (recomputing _worldWidth/Height) and rebuilds.
      tt._canvasDirty = true;
      tt._renderToCanvas();
      tt._updateMesh();

      const geom = t.getDisplayMeshes()[0].geometry as THREE.PlaneGeometry;
      const baseW = tt._worldWidth;
      const baseH = tt._worldHeight;

      // The plane geometry is the freshly measured *base* size (scale is not folded
      // into geometry)...
      expect(baseW).toBeGreaterThan(0);
      expect(geom.parameters.width).toBeCloseTo(baseW, 4);
      expect(geom.parameters.height).toBeCloseTo(baseH, 4);

      // ...while the retained 2x scale still applies, so world bounds are 2x base.
      expect(t.scaleVector.x).toBeCloseTo(2, 6);
      const b = t.getBounds();
      expect(b.max.x - b.min.x).toBeCloseTo(baseW * 2, 4);
      expect(b.max.y - b.min.y).toBeCloseTo(baseH * 2, 4);
    } finally {
      ctxSpy.mockRestore();
    }
  });

  it("applyVisualSize sets the explicit base geometry size (mesh.scale stays 1)", () => {
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((
        contextId: string,
      ) => (contextId === "2d" ? createMockCtx() : null));

    try {
      const t = new Text({ text: "World" });
      t.getThreeObject(); // create the mesh first (as in the live mid-morph flow)

      // MIGRATION (absolutize): applyVisualSize sets the base plane geometry to the
      // requested size and leaves mesh.scale at 1; any transform scale lives on
      // scaleVector (the display group), not folded into the mesh.
      t.applyVisualSize(4, 3);
      const geom = t.getDisplayMeshes()[0].geometry as THREE.PlaneGeometry;
      expect(geom.parameters.width).toBeCloseTo(4, 4);
      expect(geom.parameters.height).toBeCloseTo(3, 4);
      expect(t.getDisplayMeshes()[0].scale.x).toBeCloseTo(1, 6);
    } finally {
      ctxSpy.mockRestore();
    }
  });

  it("a uniform scale survives normalize with world bounds preserved", () => {
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((
        contextId: string,
      ) => (contextId === "2d" ? createMockCtx() : null));

    try {
      const t = new Text({ text: "Same" });
      const baseline = t.getBounds();
      const w0 = baseline.max.x - baseline.min.x;

      t.scale(2);
      t.normalizeTransform();
      const after = t.getBounds();
      expect(after.max.x - after.min.x).toBeCloseTo(w0 * 2, 5);
      // MIGRATION: scale retained on scaleVector (absolutized), not folded into geometry.
      expect(t.scaleVector.x).toBeCloseTo(2, 6);
    } finally {
      ctxSpy.mockRestore();
    }
  });
});

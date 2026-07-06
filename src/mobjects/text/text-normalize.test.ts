// @vitest-environment happy-dom
/**
 * Issue 1 regression: a scaled `Text` must survive `normalizeTransform()`.
 *
 * MIGRATION (absolutize): `normalizeTransform()` no longer resets `scaleVector`
 * to 1 and folds the scale into the plane geometry. It now *absolutizes* — the
 * scale stays on `scaleVector` (re-applied to the display group every sync) and
 * `getBounds()`/`getBoundingBox()` both incorporate it. So a scaled Text still
 * renders at the scaled size across normalize; the scale simply lives on the
 * transform instead of in `_worldWidth`/`_worldHeight`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Text } from "./Text";

/** Mock 2D context — happy-dom has no canvas 2d support. */
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
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (contextId: string) => {
      if (contextId === "2d") return createMockCtx();
      return null;
    },
  );
});

describe("Text scale survives normalizeTransform (Issue 1)", () => {
  it("absolutizes scale onto the transform so bounds are unchanged across normalize", () => {
    const t = new Text({ text: "Hello" });

    t.scale(2);
    const before = t.getBounds();
    const wBefore = before.max.x - before.min.x;
    const hBefore = before.max.y - before.min.y;

    t.normalizeTransform();

    // MIGRATION: scale is retained on scaleVector (absolutized), not reset to 1.
    expect(t.scaleVector.x).toBeCloseTo(2, 6);
    expect(t.scaleVector.y).toBeCloseTo(2, 6);

    const after = t.getBounds();
    const wAfter = after.max.x - after.min.x;
    const hAfter = after.max.y - after.min.y;

    // No shrink: bounds must be preserved.
    expect(wAfter).toBeCloseTo(wBefore, 5);
    expect(hAfter).toBeCloseTo(hBefore, 5);
  });

  it("mesh is not shrunk — its local scale stays at 1 after baking", () => {
    const t = new Text({ text: "World" });
    t.scale(3);
    t.normalizeTransform();

    const mesh = t.getDisplayMeshes()[0];
    expect(mesh.scale.x).toBeCloseTo(1, 6);
    expect(mesh.scale.y).toBeCloseTo(1, 6);
  });

  it("baked size matches the original scaled bounds (no double-application)", () => {
    const a = new Text({ text: "Same" });
    const b = new Text({ text: "Same" });

    const baseline = a.getBounds();
    const wBaseline = baseline.max.x - baseline.min.x;

    b.scale(2);
    b.normalizeTransform();
    const baked = b.getBounds();
    const wBaked = baked.max.x - baked.min.x;

    expect(wBaked).toBeCloseTo(wBaseline * 2, 5);
  });
});

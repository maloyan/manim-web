// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { ImageMobject } from './index';

// Regression: ImageMobject keeps its translation on `position` (it is a textured
// mesh, not a points-baked VMobject). copy() must carry the live position, not
// reset it to the construction-time center — otherwise Transform reads a stale
// start/target position from its copies and translation never animates.
function mockCanvas() {
  const ctx = {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low' as const,
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    putImageData: () => {},
    drawImage: () => {},
    getImageData: (x: number, y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
  };
  const orig = document.createElement.bind(document);
  return vi.spyOn(document, 'createElement').mockImplementation((tag: string): HTMLElement => {
    const el = orig(tag);
    if (tag.toLowerCase() === 'canvas') {
      (el as HTMLCanvasElement).getContext = ((t: string) =>
        t === '2d' ? ctx : null) as HTMLCanvasElement['getContext'];
    }
    return el;
  });
}

describe('ImageMobject.copy() position', () => {
  it('preserves a shifted position', async () => {
    const spy = mockCanvas();
    try {
      const image = new ImageMobject({
        pixelData: [
          [0, 255],
          [255, 0],
        ],
        height: 2,
      });
      await image.waitForLoad();
      image.shift([3, 0, 0]);

      const copy = image.copy();

      expect(copy.position.x).toBeCloseTo(3, 6);
      expect(copy.getCenter()[0]).toBeCloseTo(3, 6);
    } finally {
      spy.mockRestore();
    }
  });
});

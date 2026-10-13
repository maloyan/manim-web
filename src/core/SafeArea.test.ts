import { describe, it, expect } from 'vitest';
import { SafeArea, intersectFrames, type AspectFrameSize } from './SafeArea';
import { Square } from '../mobjects/geometry/Rectangle';

/**
 * Tests for the SafeArea responsive-layout helper.
 *
 * The safe area is the rectangle visible in EVERY target aspect. Content
 * anchored to it "reflows" when the author switches aspect instead of being
 * clipped. The frame model mirrors the camera's fill mode: every target frame
 * shares a reference height, so the width is the only limiting dimension.
 */
describe('intersectFrames', () => {
  it('returns the min width and min height, centered at origin', () => {
    const frames: AspectFrameSize[] = [
      { width: 14, height: 8 },
      { width: 4.5, height: 8 },
      { width: 8, height: 8 },
    ];
    const rect = intersectFrames(frames);
    expect(rect.width).toBeCloseTo(4.5, 6);
    expect(rect.height).toBeCloseTo(8, 6);
  });

  it('limits both dimensions when frames differ in width and height', () => {
    const rect = intersectFrames([
      { width: 10, height: 6 },
      { width: 4, height: 9 },
    ]);
    expect(rect.width).toBeCloseTo(4, 6);
    expect(rect.height).toBeCloseTo(6, 6);
  });

  it('throws on an empty frame list', () => {
    expect(() => intersectFrames([])).toThrow();
  });
});

describe('SafeArea.fromAspectRatios', () => {
  it('computes the common rectangle for [16/9, 9/16, 1/1] at reference height 8', () => {
    const safe = SafeArea.fromAspectRatios([16 / 9, 9 / 16, 1 / 1]);
    // Narrowest frame is the 9:16 portrait: width 8 * 9/16 = 4.5.
    expect(safe.width).toBeCloseTo(4.5, 6);
    expect(safe.height).toBeCloseTo(8, 6);
    expect(safe.halfWidth).toBeCloseTo(2.25, 6);
    expect(safe.halfHeight).toBeCloseTo(4, 6);
  });

  it('honours a custom reference height', () => {
    const safe = SafeArea.fromAspectRatios([16 / 9, 9 / 16], { referenceHeight: 4 });
    expect(safe.height).toBeCloseTo(4, 6);
    expect(safe.width).toBeCloseTo(4 * (9 / 16), 6);
  });

  it('exposes the per-aspect frames it was built from', () => {
    const safe = SafeArea.fromAspectRatios([16 / 9, 1 / 1]);
    expect(safe.frames).toHaveLength(2);
    expect(safe.frames[0].width).toBeCloseTo(8 * (16 / 9), 6);
    expect(safe.frames[1].width).toBeCloseTo(8, 6);
  });

  it('throws on an empty aspect list', () => {
    expect(() => SafeArea.fromAspectRatios([])).toThrow();
  });
});

describe('SafeArea.anchorPoint', () => {
  const safe = SafeArea.fromAspectRatios([16 / 9, 9 / 16, 1 / 1]); // 4.5 x 8

  it('returns origin for the center anchor', () => {
    expect(safe.anchorPoint('center')).toEqual([0, 0, 0]);
  });

  it('insets edge anchors by the buffer', () => {
    expect(safe.anchorPoint('top', 0.5)).toEqual([0, 4 - 0.5, 0]);
    expect(safe.anchorPoint('bottom', 0.5)).toEqual([0, -(4 - 0.5), 0]);
    expect(safe.anchorPoint('left', 0.5)).toEqual([-(2.25 - 0.5), 0, 0]);
    expect(safe.anchorPoint('right', 0.5)).toEqual([2.25 - 0.5, 0, 0]);
  });

  it('insets corner anchors on both axes', () => {
    expect(safe.anchorPoint('topRight', 0.25)).toEqual([2.25 - 0.25, 4 - 0.25, 0]);
    expect(safe.anchorPoint('bottomLeft', 0.25)).toEqual([-(2.25 - 0.25), -(4 - 0.25), 0]);
  });
});

describe('SafeArea.place', () => {
  const aspects = [16 / 9, 9 / 16, 1 / 1];
  const safe = SafeArea.fromAspectRatios(aspects); // 4.5 x 8

  /** Assert a mobject's bounding box fits inside a frame centered at origin. */
  function fitsInFrame(mob: Square, frame: AspectFrameSize): boolean {
    const eps = 1e-6;
    return (
      mob.getLeft()[0] >= -frame.width / 2 - eps &&
      mob.getRight()[0] <= frame.width / 2 + eps &&
      mob.getBottom()[1] >= -frame.height / 2 - eps &&
      mob.getTop()[1] <= frame.height / 2 + eps
    );
  }

  it('centers a mobject on the center anchor', () => {
    const sq = new Square({ sideLength: 1 });
    safe.place(sq, 'center');
    const c = sq.getCenter();
    expect(c[0]).toBeCloseTo(0, 6);
    expect(c[1]).toBeCloseTo(0, 6);
  });

  it('aligns the top edge to the safe-area top with a buffer', () => {
    const sq = new Square({ sideLength: 1 });
    safe.place(sq, 'top', 0.5);
    expect(sq.getTop()[1]).toBeCloseTo(4 - 0.5, 6);
  });

  it('keeps anchored content inside every target frame (reflow guarantee)', () => {
    const anchors = ['center', 'top', 'bottom', 'left', 'right', 'topRight', 'bottomLeft'] as const;
    for (const anchor of anchors) {
      const sq = new Square({ sideLength: 1 });
      safe.place(sq, anchor, 0.2);
      for (const aspect of aspects) {
        const frame: AspectFrameSize = { width: 8 * aspect, height: 8 };
        expect(fitsInFrame(sq, frame)).toBe(true);
      }
    }
  });

  it('is returned for chaining', () => {
    const sq = new Square({ sideLength: 1 });
    expect(safe.place(sq, 'center')).toBe(sq);
  });
});

describe('SafeArea.contains', () => {
  const safe = SafeArea.fromAspectRatios([16 / 9, 9 / 16, 1 / 1]); // 4.5 x 8

  it('reports a mobject fully inside as contained', () => {
    const sq = new Square({ sideLength: 1 });
    sq.moveTo([0, 0, 0]);
    expect(safe.contains(sq)).toBe(true);
  });

  it('reports a mobject past the horizontal edge as not contained', () => {
    const sq = new Square({ sideLength: 1 });
    sq.moveTo([3, 0, 0]); // beyond halfWidth 2.25
    expect(safe.contains(sq)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { Square } from './Rectangle';

/**
 * MRE: scale() pivots about `position`, not the visual center.
 *
 * normalizeTransform() bakes a node's transform into its points and resets the
 * carrier position to the origin. That makes `position` diverge from the visual
 * center for ANY mobject (not just Arrow). scale() then pivots about `position`
 * (== origin here) instead of the center, so the shape drifts.
 */
describe('scale after normalizeTransform (MRE)', () => {
  it('keeps the visual center fixed when scaling (manim semantics)', () => {
    const sq = new Square(); // sideLength 2, centered at origin

    sq.shift([3, 0, 0]);
    expect(sq.getCenter()).toEqual([3, 0, 0]); // sanity: center followed the shift

    sq.normalizeTransform(); // bakes [3,0,0] into points; position resets to origin
    expect(sq.getCenter()).toEqual([3, 0, 0]); // center unchanged by normalization
    expect([sq.position.x, sq.position.y, sq.position.z]).toEqual([0, 0, 0]); // ...but position is now origin

    sq.scale(2); // manim: scale about center -> center stays [3,0,0]

    // BUG: current code pivots about position ([0,0,0]) -> center jumps to [6,0,0]
    expect(sq.getCenter()).toEqual([3, 0, 0]);
  });
});

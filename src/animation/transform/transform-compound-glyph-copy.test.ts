// @vitest-environment happy-dom
/**
 * Regression tests for GitHub issue #853.
 *
 * Transform(MathTex('A'), MathTex('\begin{bmatrix}...\end{bmatrix}')) showed
 * stray lines during and after the morph. A glyph such as "A" or "0" is one
 * VMobject with several contours (outer + hole), recorded as base subpath
 * lengths. VMobject.copy() dropped that metadata. The leaf pairing copies
 * leaves (the normalized target, the duplicates that pad the shorter family),
 * so those copies drew their contours as one path: a segment bridged the
 * outer contour and the hole, and the fill covered the hole.
 */

import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { MathTex } from '../../mobjects/text/MathTex';
import { Transform } from './Transform';

/** The largest distance between the first and last point of any subpath. */
function maxOpenSubpathGap(root: VMobject): number {
  let worst = 0;
  for (const leaf of root.familyMembersWithPoints() as VMobject[]) {
    const pts = leaf.getLocalPoints();
    const lengths = leaf.getEffectiveSubpathLengths() ?? [pts.length];
    let offset = 0;
    for (const len of lengths) {
      const first = pts[offset];
      const last = pts[offset + len - 1];
      worst = Math.max(worst, Math.hypot(first[0] - last[0], first[1] - last[1]));
      offset += len;
    }
  }
  return worst;
}

function leafTopology(root: VMobject): Array<number[] | undefined> {
  return (root.familyMembersWithPoints() as VMobject[]).map((leaf) =>
    leaf.getEffectiveSubpathLengths(),
  );
}

describe('Transform keeps compound glyph contours closed (#853)', () => {
  it('VMobject.copy() keeps the base subpath lengths of its points', () => {
    // MIGRATION: example for the property
    //   ∀ VMobject v, v.copy().getEffectiveSubpathLengths() === v.getEffectiveSubpathLengths().
    // Replace with a property test once the suite lands.
    const square = (x: number, s: number): number[][] => [
      [x, 0, 0],
      [x + s, 0, 0],
      [x + s, s, 0],
      [x, s, 0],
      [x, 0, 0],
    ];
    const v = new VMobject();
    v.setPoints([...square(0, 4), ...square(1, 2)]);
    v.setBaseSubpathLengths([5, 5]);

    expect(v.copy().getEffectiveSubpathLengths()).toEqual([5, 5]);
  });

  it('MathTex A -> bmatrix -> A has no open contour at any alpha', async () => {
    // MIGRATION: example for the property
    //   ∀ closed-contour VMobjects s, t, ∀ alpha ∈ [0, 1]:
    //   every subpath of Transform(s, t) at alpha is closed, and after finish()
    //   the leaf topology of s === the leaf topology of t.
    // Replace with a property test once the suite lands.
    const matrix = String.raw`\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}`;
    const tex = new MathTex({ latex: 'A', fontSize: 96 });
    await tex.waitForRender();

    for (const latex of [matrix, 'A']) {
      const target = new MathTex({ latex, fontSize: 96 });
      await target.waitForRender();
      const anim = new Transform(tex, target);
      anim.begin();
      for (const alpha of [0, 0.5, 1]) {
        anim.interpolate(alpha);
        expect(maxOpenSubpathGap(tex)).toBeLessThan(1e-6);
      }
      anim.finish();

      expect(maxOpenSubpathGap(tex)).toBeLessThan(1e-6);
      if (latex === matrix) expect(leafTopology(tex)).toEqual(leafTopology(target));
    }
  });
});

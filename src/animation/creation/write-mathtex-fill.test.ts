// @vitest-environment happy-dom
/**
 * Regression test for GitHub issue #905: Write on a vector MathTex only
 * animated the stroke, so the glyph fill was visible from the first frame.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MathTex } from '../../mobjects/text/MathTex';
import { VMobject } from '../../core/VMobject';
import { Write } from './Create';

/** Opacity of every visible fill mesh under the mobject. */
function visibleFillOpacities(m: VMobject): number[] {
  const out: number[] = [];
  m.getThreeObject().traverse((o) => {
    if (o instanceof THREE.Mesh && o.visible) {
      const mat = o.material as THREE.Material;
      if (mat.visible !== false) out.push(mat.opacity);
    }
  });
  return out;
}

describe('Write on a vector MathTex (#905)', () => {
  // MIGRATION: example for the property
  //   ∀ filled VMobject m: after new Write(m).begin(), interpolate(0) leaves
  //   every family member with fillOpacity === 0, and finish() restores it.
  // Replace with a property test once the suite lands.
  it('hides the fill at the start and restores it at the end', async () => {
    const tex = new MathTex({ latex: '\\sum_{n=0}^{3} x^n' });
    await tex.waitForRender();
    const members = tex.familyMembersWithPoints() as VMobject[];
    expect(members.length).toBeGreaterThan(0);
    const before = members.map((m) => m.fillOpacity);
    expect(Math.max(...before)).toBeGreaterThan(0);

    const write = new Write(tex);
    write.begin();
    write.interpolate(0);
    expect(members.every((m) => m.fillOpacity === 0)).toBe(true);
    expect(visibleFillOpacities(tex).every((o) => o === 0)).toBe(true);

    write.finish();
    expect(members.map((m) => m.fillOpacity)).toEqual(before);
  }, 20000);
});

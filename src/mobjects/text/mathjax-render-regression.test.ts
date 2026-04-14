// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { renderLatexToSVG } from './MathJaxRenderer';

function getRawHeightFromVmobjectGroup(group: { children: unknown[] }): number {
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const child of group.children) {
    if (!(child instanceof VMobject)) continue;
    for (const p of child.getPoints()) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
  }

  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
    throw new Error('No VMobject points found in MathJax render result');
  }

  return maxY - minY;
}

describe('MathJaxRenderer regression (real MathJax)', () => {
  it('renders x at about 453 raw MathJax units', async () => {
    const result = await renderLatexToSVG('x');
    const rawHeight = getRawHeightFromVmobjectGroup(result.vmobjectGroup);

    // MathJax path coordinates are in internal font units (about 1000 per em),
    // not CSS pixels. Lowercase x has x-height around 0.45em -> ~450 units.
    expect(rawHeight).toBeGreaterThan(440);
    expect(rawHeight).toBeLessThan(470);
  });
});

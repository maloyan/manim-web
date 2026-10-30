// @vitest-environment happy-dom
/**
 * Create staggers family members like Manim CE's get_sub_alpha: each
 * member's lag window is cut from linear time and eased on its own, instead
 * of easing the whole animation and then splitting it linearly.
 */
import { describe, it, expect } from 'vitest';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Line } from '../../mobjects/geometry/Line';
import { VGroup } from '../../core/VGroup';
import { smooth } from '../../rate-functions';
import { Create, getLine2TotalLength } from './Create';

function revealed(line: Line): number {
  const stroke = line.getOwnStrokeLines()[0];
  if (!stroke.visible) return 0;
  return (stroke.material as LineMaterial).dashSize / getLine2TotalLength(stroke);
}

describe('Create per-member rate function', () => {
  // MIGRATION: example for the property
  //   ∀ family of n members, lagRatio r, linear time t ∈ [0, 1]:
  //   member i of Create at time t is revealed to
  //   rateFunc(clamp(t * ((n - 1) * r + 1) - i * r, 0, 1)).
  // Replace with a property test once the suite lands.
  it('eases each member inside its own lag window', () => {
    const lines = [0, 1, 2].map((y) => new Line({ start: [-1, y, 0], end: [1, y, 0] }));
    const group = new VGroup(...lines);
    const anim = new Create(group, { duration: 3 });

    // Linear t = 1/6 with three members and lagRatio 1 is halfway through
    // the first member's window.
    anim.update(0, 0);
    anim.update(0, 0.5);
    expect(revealed(lines[0])).toBeCloseTo(smooth(0.5), 3);
    expect(revealed(lines[1])).toBeCloseTo(0, 6);

    // t = 1/2: first done, second halfway, third not started.
    anim.update(0, 1.5);
    expect(revealed(lines[0])).toBeCloseTo(1, 3);
    expect(revealed(lines[1])).toBeCloseTo(smooth(0.5), 3);
    expect(revealed(lines[2])).toBeCloseTo(0, 6);
  });
});

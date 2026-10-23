// @vitest-environment happy-dom
/**
 * Regression test: Indicate must color a leaf mobject through the leaf's own
 * setColor(). Text overrides setColor() to redraw its canvas texture, so a
 * plain `color` field write would leave the drawn text unchanged, and a
 * reset or finish would leave the indicate color on the texture.
 */
import { describe, it, expect, vi } from 'vitest';
import { Circle } from '../../mobjects/geometry/Circle';
import { VGroup } from '../../core/VGroup';
import { Indicate } from './index';

describe('Indicate on leaf mobjects', () => {
  // MIGRATION: example for the property
  //   ∀ leaf m in family(target), Indicate(target) changes m's color only
  //   through m.setColor(), and finish()/reset() call m.setColor(original).
  it('calls setColor on each leaf during interpolate, finish and reset', () => {
    const a = new Circle({ color: '#ff0000' });
    const b = new Circle({ color: '#0000ff' });
    const group = new VGroup(a, b);
    const spyA = vi.spyOn(a, 'setColor');
    const spyB = vi.spyOn(b, 'setColor');

    const anim = new Indicate(group);
    anim.begin();
    anim.interpolate(0.5);
    expect(spyA).toHaveBeenCalled();
    expect(spyB).toHaveBeenCalled();

    anim.finish();
    expect(spyA).toHaveBeenLastCalledWith('#ff0000');
    expect(spyB).toHaveBeenLastCalledWith('#0000ff');

    anim.reset();
    expect(a.color).toBe('#ff0000');
    expect(b.color).toBe('#0000ff');
    expect(spyA).toHaveBeenLastCalledWith('#ff0000');
  });
});

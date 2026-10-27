// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { VMobject } from './VMobject';

describe('VMobject geometry build', () => {
  // MIGRATION: example for the property
  //   ∀ VMobject v with points: creating its Three.js object and then
  //   syncing it once builds the geometry exactly once.
  // Replace with a property test once the suite lands.
  it('does not rebuild the geometry it just built on the first sync', () => {
    const v = new VMobject();
    v.setPoints3D([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    v.fillOpacity = 1;
    const spy = vi.spyOn(v as unknown as { _updateGeometry: () => void }, '_updateGeometry');
    v.getThreeObject();
    v._syncToThree();
    expect(spy).toHaveBeenCalledTimes(1);
    v.setPoints3D([
      [0, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [0, 2, 0],
    ]);
    v._syncToThree();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

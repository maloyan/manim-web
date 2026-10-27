import { describe, it, expect } from 'vitest';
import { ThreeDScene } from './ThreeDScene';
import { Circle } from '../mobjects/geometry';

describe('ThreeDScene fixed-in-frame queries', () => {
  it('reports pinned mobjects and the HUD frame they are drawn in', () => {
    const scene = ThreeDScene.createHeadless();
    const pinned = new Circle();
    const free = new Circle();
    scene.addFixedInFrameMobjects(pinned);
    scene.add(free);

    expect(scene.isFixedInFrame(pinned)).toBe(true);
    expect(scene.isFixedInFrame(free)).toBe(false);
    expect(scene.fixedInFrameSize).toEqual({ width: 14, height: 8 });
    scene.removeFixedInFrameMobjects(pinned);
    expect(scene.isFixedInFrame(pinned)).toBe(false);
    scene.dispose();
  });
});

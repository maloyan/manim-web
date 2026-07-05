import { describe, it, expect } from 'vitest';
import { ThreeDScene } from './ThreeDScene';
import { Circle } from '../mobjects/geometry/Circle';

// Regression test for #505: addFixedInFrameMobjects() must not be silently
// undone when the mobject is (re-)added afterwards — e.g. via Scene.play()'s
// own internal "add if not yet tracked" step for an animation target. This
// matches real Manim's call order: add_fixed_in_frame_mobjects(mob) is called
// before self.play(...), and since Manim's Scene.add() is a plain idempotent
// list append (no scene-graph reparenting), that order never matters there.
describe('addFixedInFrameMobjects survives a later scene.add()', () => {
  it('stays parked in the HUD scene, not reparented into the main scene', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();

    // Pin BEFORE the mobject is ever added — the order real Manim uses.
    scene.addFixedInFrameMobjects(circle);
    scene.add(circle);

    const threeObj = circle.getThreeObject();
    let current = threeObj.parent;
    let inMainScene = false;
    while (current) {
      if (current === scene.threeScene) inMainScene = true;
      current = current.parent;
    }
    expect(inMainScene).toBe(false);

    scene.dispose();
  });

  it('also survives scene.play() re-adding it as an animation target', async () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    circle.moveTo([-2.2, 1.3, 0]);

    // Exactly Manim's own call order — no manual scene.add() anywhere:
    //   self.add_fixed_in_frame_mobjects(mob); self.play(Create(mob))
    scene.addFixedInFrameMobjects(circle);
    const { Create } = await import('../animation/creation/Create');
    await scene.play(new Create(circle, { duration: 0.01 }));

    const threeObj = circle.getThreeObject();
    let current = threeObj.parent;
    let inMainScene = false;
    while (current) {
      if (current === scene.threeScene) inMainScene = true;
      current = current.parent;
    }
    expect(inMainScene).toBe(false);

    scene.dispose();
  });
});

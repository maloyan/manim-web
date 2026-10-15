import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ThreeDScene } from './ThreeDScene';
import { Circle } from '../mobjects/geometry/Circle';
import { Text } from '../mobjects/text/Text';
import { UL } from './MobjectTypes';

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

// Regression test for the FixedInFrameMobjectTest example: a mobject pinned with
// addFixedInFrameMobjects() and then positioned with toCorner(), with NO separate
// scene.add() and no intro animation, must still render. Real Manim's
// add_fixed_in_frame_mobjects() calls self.add(*mobjects), so the pinned mobject
// is always on stage. The deferred-placement optimization must not leave a mobject
// that is pinned-but-never-otherwise-added invisible forever.
describe('addFixedInFrameMobjects alone (no later add) still renders the mobject', () => {
  function isUnder(obj: THREE.Object3D, ancestor: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = obj.parent;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }

  it('lands the pinned+toCorner(UL) text in the HUD overlay within frame bounds', () => {
    const scene = ThreeDScene.createHeadless({ frameWidth: 14, frameHeight: 8 });
    const text = new Text({ text: 'This is a 3D text' });

    // Exactly the example's order: pin, then toCorner, no scene.add(text).
    scene.addFixedInFrameMobjects(text);
    text.toCorner(UL);

    // 1. The scene must track it as a fixed-in-frame (HUD) mobject.
    const fixed = (scene as unknown as { _fixedMobjects: Set<unknown> })._fixedMobjects;
    expect(fixed.has(text)).toBe(true);

    // 2. Its three.js object must live under the HUD overlay scene, not the main 3D scene.
    const hudScene = (scene as unknown as { _hudScene: THREE.Scene })._hudScene;
    const threeObj = text.getThreeObject();
    expect(isUnder(threeObj, hudScene)).toBe(true);
    expect(isUnder(threeObj, scene.threeScene)).toBe(false);

    // 3. toCorner(UL) must leave it inside the frame (not off-screen).
    const center = text.getCenter();
    expect(center[0]).toBeGreaterThanOrEqual(-7);
    expect(center[0]).toBeLessThanOrEqual(7);
    expect(center[1]).toBeGreaterThanOrEqual(-4);
    expect(center[1]).toBeLessThanOrEqual(4);
    // Upper-left: x negative, y positive.
    expect(center[0]).toBeLessThan(0);
    expect(center[1]).toBeGreaterThan(0);

    scene.dispose();
  });
});

// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { Scene } from '../../src/core/Scene';
import { ThreeDScene } from '../../src/core/ThreeDScene';
import { Circle, Square, Line, Rectangle } from '../../src/mobjects/geometry';
import { VGroup } from '../../src/core/VGroup';
import { Create } from '../../src/animation/creation/Create';
import { FadeIn } from '../../src/animation/fading/FadeIn';
import { FadeOut } from '../../src/animation/fading/FadeOut';
import { Transform } from '../../src/animation/transform/Transform';

describe('Headless scene lifecycle', () => {
  it('creates and disposes', () => {
    const scene = Scene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it('accepts mobjects', () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });

  it('clears mobjects', () => {
    const scene = Scene.createHeadless();
    scene.add(new Circle(), new Square());
    scene.clear();
    expect(scene.mobjects.size).toBe(0);
    scene.dispose();
  });
});

describe('Headless animations', () => {
  it('plays FadeIn', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    await scene.play(new FadeIn(circle, { duration: 0.01 }));
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });

  it('plays Create', async () => {
    const scene = Scene.createHeadless();
    const square = new Square();
    await scene.play(new Create(square, { duration: 0.01 }));
    expect(scene.mobjects).toContain(square);
    scene.dispose();
  });

  it('plays FadeOut and removes', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    await scene.play(new FadeOut(circle, { duration: 0.01 }));
    expect(scene.mobjects).not.toContain(circle);
    scene.dispose();
  });

  it('plays Transform', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    const square = new Square();
    scene.add(circle);
    await scene.play(new Transform(circle, square, { duration: 0.01 }));
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });

  it('waits', async () => {
    const scene = Scene.createHeadless();
    await scene.wait(0.01);
    scene.dispose();
  });

  it('plays multiple animations in sequence', async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    const square = new Square();
    await scene.play(new FadeIn(circle, { duration: 0.01 }));
    await scene.play(new FadeIn(square, { duration: 0.01 }));
    await scene.wait(0.01);
    await scene.play(new FadeOut(circle, { duration: 0.01 }));
    expect(scene.mobjects).not.toContain(circle);
    expect(scene.mobjects).toContain(square);
    scene.dispose();
  });
});

describe('Headless VGroup', () => {
  it('handles VGroup with children', async () => {
    const scene = Scene.createHeadless();
    const group = new VGroup(new Circle(), new Square());
    await scene.play(new Create(group, { duration: 0.01 }));
    expect(scene.mobjects).toContain(group);
    scene.dispose();
  });
});

describe('Headless 3D scene', () => {
  it('creates and disposes', () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    expect(scene.orbitControls).toBeNull();
    scene.dispose();
  });

  it('plays animations', async () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    await scene.play(new FadeIn(circle, { duration: 0.01 }));
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });
});

describe('Headless geometry', () => {
  it('creates various shapes', () => {
    const scene = Scene.createHeadless();
    const shapes = [
      new Circle({ radius: 2 }),
      new Square({ sideLength: 3 }),
      new Rectangle({ width: 4, height: 2 }),
      new Line([0, 0, 0], [1, 1, 0]),
    ];
    scene.add(...shapes);
    expect(scene.mobjects.size).toBe(4);
    scene.dispose();
  });
});

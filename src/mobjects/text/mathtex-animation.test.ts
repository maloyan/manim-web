// @vitest-environment happy-dom
/**
 * Focused regression tests for GitHub issue #251.
 *
 * Problem: animate.shift() on MathTex/VGroup failed when transforms were
 * captured only on direct children (missing nested leaf VMobjects).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MathTex } from './MathTex';
import { Scene } from '../../core/Scene';
import { RIGHT } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Circle } from '../geometry';
import '../../core/AnimateProxy';

function createTestScene(): { scene: Scene; container: HTMLDivElement } {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  const scene = new Scene(container, { width: 800, height: 600, headless: true });
  return { scene, container };
}

describe('MathTex animate.shift() regression (issue #251)', () => {
  let scene: Scene;
  let container: HTMLDivElement;

  beforeEach(() => {
    const ctx = createTestScene();
    scene = ctx.scene;
    container = ctx.container;
  });

  afterEach(() => {
    scene.dispose();
    container.remove();
  });

  it('animates shift on simple MathTex', async () => {
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    await tex.waitForRender();

    scene.add(tex);
    const initialCenter = tex.getCenter();

    await scene.play(tex.animate.shift(RIGHT));

    expect(tex.getCenter()[0]).toBeCloseTo(initialCenter[0] + RIGHT[0], 2);
  });

  it('animates shift on multipart MathTex (nested VGroups)', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();

    scene.add(tex);

    const initialPartCenters = [
      tex.getPart(0).getCenter(),
      tex.getPart(1).getCenter(),
      tex.getPart(2).getCenter(),
    ];

    await scene.play(tex.animate.shift(RIGHT));

    const finalPartCenters = [
      tex.getPart(0).getCenter(),
      tex.getPart(1).getCenter(),
      tex.getPart(2).getCenter(),
    ];

    for (let i = 0; i < initialPartCenters.length; i++) {
      expect(finalPartCenters[i][0]).toBeCloseTo(initialPartCenters[i][0] + RIGHT[0], 2);
    }
  });

  it('accumulates consecutive animate.shift calls', async () => {
    const tex = new MathTex({ latex: 'x', fontSize: 1 });
    await tex.waitForRender();

    scene.add(tex);
    const initialCenter = tex.getCenter();

    await scene.play(tex.animate.shift(RIGHT));
    await scene.play(tex.animate.shift(RIGHT));

    expect(tex.getCenter()[0]).toBeCloseTo(initialCenter[0] + 2 * RIGHT[0], 2);
  });

  it('animates shift for VGroup leaves where child shift uses position (VMobject)', async () => {
    const vm = new VMobject();
    vm.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const group = new VGroup(vm);

    scene.add(group);
    const initialCenter = group.getCenter();

    await scene.play(group.animate.shift(RIGHT));

    expect(group.getCenter()[0]).toBeCloseTo(initialCenter[0] + RIGHT[0], 2);
  });

  it('animates shift for mixed VGroup (MathTex + shape)', async () => {
    const tex = new MathTex({ latex: 'r', fontSize: 0.5 });
    await tex.waitForRender();

    const circle = new Circle({ radius: 0.3 });
    circle.moveTo([2, 0, 0]);

    const group = new VGroup(tex, circle);
    scene.add(group);

    const initialGroupCenter = group.getCenter();
    const initialTexCenter = tex.getCenter();
    const initialCircleCenter = circle.getCenter();

    await scene.play(group.animate.shift(RIGHT));

    expect(group.getCenter()[0]).toBeCloseTo(initialGroupCenter[0] + RIGHT[0], 2);
    expect(tex.getCenter()[0]).toBeCloseTo(initialTexCenter[0] + RIGHT[0], 2);
    expect(circle.getCenter()[0]).toBeCloseTo(initialCircleCenter[0] + RIGHT[0], 2);
  });
});

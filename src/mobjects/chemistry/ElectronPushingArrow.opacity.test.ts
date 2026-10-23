// @vitest-environment happy-dom
/**
 * Regression tests for #855: the head of an ElectronPushingArrow is a child of
 * a VMobject, and VMobject opacity setters do not reach children. The head
 * stayed visible before Create started and after FadeOut ended.
 */
import { describe, it, expect } from 'vitest';
import { Player } from '../../player/Player';
import { Create } from '../../animation/creation/Create';
import { FadeOut } from '../../animation/fading/FadeOut';
import { VMobject } from '../../core/VMobject';
import { ElectronPushingArrow } from './ElectronPushingArrow';

/** Highest material opacity among the visible three.js nodes of the head. */
function renderedHeadOpacity(tip: VMobject): number {
  let max = 0;
  tip.getThreeObject().traverse((node) => {
    const material = (node as { material?: { opacity: number } }).material;
    if (material && node.visible) max = Math.max(max, material.opacity);
  });
  return max;
}

describe('ElectronPushingArrow head opacity (#855)', () => {
  // MIGRATION: example for the property
  //   ∀ arrow a with a.getTip() !== null, ∀ v ∈ [0, 1]:
  //   (a.opacity = v) => a.getTip().opacity === v, and
  //   a.setFillOpacity(v) => a.getTip().fillOpacity === v,
  //   and a.copy() keeps the head opacities.
  // Replace with a property test once the suite lands.
  it('passes the opacity setters on to the head', () => {
    const arrow = new ElectronPushingArrow({ from: [-2, 0, 0], to: [2, 0, 0] });
    arrow.opacity = 0.25;
    expect(arrow.getTip()!.opacity).toBe(0.25);
    arrow.setFillOpacity(0);
    expect(arrow.getTip()!.fillOpacity).toBe(0);
    expect(arrow.copy().getTip()!.opacity).toBe(0.25);
  });

  it('hides the head before Create and after FadeOut when the Player seeks', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const player = new Player(container, { width: 800, height: 450, headless: true });
    const arrow = new ElectronPushingArrow({ from: [-2, 0, 0], to: [2, 0, 0] });
    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.play(new Create(arrow));
      await scene.play(new FadeOut(arrow));
      await scene.wait(1);
    });
    const tip = arrow.getTip()!;

    player.seek(0.5);
    expect(renderedHeadOpacity(tip)).toBe(0);
    player.seek(2.9);
    expect(renderedHeadOpacity(tip)).toBeGreaterThan(0);
    player.seek(4.5);
    expect(renderedHeadOpacity(tip)).toBe(0);
  });
});

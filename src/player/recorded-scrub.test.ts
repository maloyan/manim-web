// @vitest-environment happy-dom
/**
 * Regression tests: Player scrub (MasterTimeline.seek) must reproduce the
 * state that plain playback shows at the same time.
 *
 * - #854: a mobject shown with GrowFromCenter and animated again later
 *   (Indicate) kept scale 0 after any seek. RecordingScene.play() calls
 *   begin() at record time, so Indicate snapshots the scale-0 state left by
 *   GrowFromCenter.begin(). seek() reset segments first-to-last, so that
 *   later snapshot won and GrowFromCenter re-captured scale 0 as its target.
 * - #856: Indicate on a VGroup recolored every child to the group color,
 *   and reset() restored only the group's own color, so a scrub left all
 *   children in the group color.
 * - #861: mobjects animated inside LaggedStart / AnimationGroup were never
 *   registered as "introduced" (shown from t = 0), and a child of a group
 *   that was already on screen was registered again by its first own
 *   animation (hidden after a scrub until that animation).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Player } from './Player';
import { Circle } from '../mobjects/geometry/Circle';
import { Dot } from '../mobjects/geometry/Dot';
import { VGroup } from '../core/VGroup';
import { FadeIn } from '../animation/fading/index';
import { GrowFromCenter } from '../animation/movement/index';
import { Indicate } from '../animation/indication/index';
import { LaggedStart } from '../animation/LaggedStart';

function createPlayer(): { player: Player; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const player = new Player(container, { width: 800, height: 450, headless: true });
  return { player, container };
}

describe('Player scrub regressions', () => {
  let player: Player;
  let container: HTMLElement;

  afterEach(() => {
    player?.dispose();
    container?.remove();
  });

  // MIGRATION: example for the property
  //   ∀ recorded sequence S, ∀ times t1, t2: seek(t1); seek(t2) leaves every
  //   mobject in the state that seek(t2) from a fresh recording produces.
  // Replace with a property test once the suite lands.
  it('#854: GrowFromCenter then Indicate stays visible after a seek', async () => {
    ({ player, container } = createPlayer());
    const c = new Circle({ radius: 1, fillOpacity: 1 });
    await player.sequence(async (scene) => {
      await scene.play(new GrowFromCenter(c));
      await scene.play(new Indicate(c));
    });

    player.timeline.seek(1.5);
    // Indicate at t = 1.5 is at its peak (thereAndBack(0.5) = 1).
    expect(c.scaleVector.x).toBeGreaterThan(1);
    player.timeline.seek(2);
    expect(c.scaleVector.x).toBeCloseTo(1, 6);
    player.timeline.seek(0.5);
    expect(c.scaleVector.x).toBeGreaterThan(0);
  });

  // MIGRATION: example for the property
  //   ∀ group g, ∀ color-changing animation A on g, ∀ child c of g:
  //   the color of c after a seek to a time before A equals c's own color.
  // Replace with a property test once the suite lands.
  it('#856: scrub after Indicate on a VGroup keeps each child color', async () => {
    ({ player, container } = createPlayer());
    const red = new Circle({ radius: 0.5, color: '#ff4d4d', fillOpacity: 1 });
    const blue = new Circle({ radius: 0.5, color: '#4d7cff', fillOpacity: 1 });
    blue.shift([1.5, 0, 0]);
    const g = new VGroup(red, blue);
    await player.sequence(async (scene) => {
      await scene.play(new FadeIn(g));
      await scene.play(new Indicate(g));
    });

    player.timeline.seek(2);
    expect(red.color).toBe('#ff4d4d');
    expect(blue.color).toBe('#4d7cff');
    player.timeline.seek(0.5);
    expect(red.color).toBe('#ff4d4d');
    expect(blue.color).toBe('#4d7cff');
  });

  // MIGRATION: example for the property
  //   ∀ mobject m, ∀ time t: after seek(t), m is hidden iff t is before the
  //   first segment that animates m or an ancestor of m (at any nesting
  //   depth), and m was not added with scene.add().
  // Replace with a property test once the suite lands.
  it('#861: nested LaggedStart mobjects hide until their segment; group parts stay visible', async () => {
    ({ player, container } = createPlayer());
    const a = new Circle({ radius: 0.5 });
    const b = new Circle({ radius: 0.5 });
    b.shift([2, 0, 0]);
    const group = new VGroup(a, b);
    const dots = [0, 1, 2].map((i) => new Dot({ point: [i - 1, 2, 0] }));
    await player.sequence(async (scene) => {
      await scene.play(new FadeIn(group)); // 0-1 s
      await scene.wait(2); // 1-3 s
      await scene.play(new LaggedStart(dots.map((d) => new GrowFromCenter(d)))); // 3-4 s
      await scene.play(new Indicate(b)); // 4-5 s
    });

    player.timeline.seek(2);
    expect(b.opacity).toBeGreaterThan(0);
    for (const d of dots) expect(d.opacity).toBe(0);

    player.timeline.seek(5);
    for (const d of dots) expect(d.opacity).toBeGreaterThan(0);
  });
});

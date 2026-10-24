// @vitest-environment happy-dom
/**
 * Regression tests: Player-recorded Create/Write/FadeIn on a vector MathTex.
 *
 * Bug: recording any of these animations on a MathTex made
 * `Player.sequence()` throw
 *   "VGroup.setPoints: expected N points (sum of children's point counts),
 *    got 2N. A VGroup holds no points of its own; ..."
 * Root cause: `MathTex.copy()` deep-copied the source's glyph children AND
 * left the copy's own constructor-started async render running; when that
 * render landed it appended a second set of glyphs, doubling the copy.
 * `Animation.begin()` snapshots the animated mobject with copy(), and
 * `MasterTimeline.seek()` (called at the end of sequence()) restores the
 * snapshot via `Animation.reset()` -> setPoints(), which then saw 2N points
 * against the live group's N. Fix: a copy of an already-rendered MathTex
 * starts no render of its own; its geometry is the deep copy (see
 * MathTex.copy()).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Player } from './Player';
import { MathTex } from '../mobjects/text/MathTex';
import { VMobject } from '../core/VMobject';
import { Create, Write } from '../animation/creation/Create';
import { FadeIn } from '../animation/fading/FadeIn';
import { Transform } from '../animation/transform/Transform';
import { Square, Circle } from '../mobjects/geometry';

function createPlayer(): { player: Player; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const player = new Player(container, { width: 800, height: 450, headless: true });
  return { player, container };
}

async function createRenderedTex(): Promise<MathTex> {
  const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
  await tex.waitForRender();
  return tex;
}

describe('Player-recorded MathTex animations', () => {
  let player: Player;
  let container: HTMLElement;

  afterEach(() => {
    player?.dispose();
    container?.remove();
  });

  it('records Create on a MathTex without throwing', async () => {
    ({ player, container } = createPlayer());
    const tex = await createRenderedTex();
    const pointCount = tex.getLocalPoints().length;
    expect(pointCount).toBeGreaterThan(0);

    await player.sequence(async (scene) => {
      await scene.play(new Create(tex));
    });

    expect(player.timeline.getDuration()).toBeGreaterThan(0);
    expect(tex.getLocalPoints().length).toBe(pointCount);
  });

  it('records Write on a MathTex without throwing', async () => {
    ({ player, container } = createPlayer());
    const tex = await createRenderedTex();
    const pointCount = tex.getLocalPoints().length;

    await player.sequence(async (scene) => {
      await scene.play(new Write(tex));
    });

    expect(player.timeline.getDuration()).toBeGreaterThan(0);
    expect(tex.getLocalPoints().length).toBe(pointCount);
  });

  it('records FadeIn on a MathTex without throwing', async () => {
    ({ player, container } = createPlayer());
    const tex = await createRenderedTex();
    const pointCount = tex.getLocalPoints().length;

    await player.sequence(async (scene) => {
      await scene.play(new FadeIn(tex));
    });

    expect(player.timeline.getDuration()).toBeGreaterThan(0);
    expect(tex.getLocalPoints().length).toBe(pointCount);
  });

  it('keeps MathTex point counts stable across seek round-trips', async () => {
    ({ player, container } = createPlayer());
    const tex = await createRenderedTex();
    const pointCount = tex.getLocalPoints().length;

    await player.sequence(async (scene) => {
      await scene.play(new Create(tex));
    });

    player.timeline.seek(player.timeline.getDuration());
    expect(tex.getLocalPoints().length).toBe(pointCount);
    player.timeline.seek(0);
    expect(tex.getLocalPoints().length).toBe(pointCount);
  });

  it('records a mixed scene: Write on MathTex + Create/Transform on shapes', async () => {
    ({ player, container } = createPlayer());
    const tex = await createRenderedTex();
    const texPointCount = tex.getLocalPoints().length;
    const square = new Square();
    const circle = new Circle();

    await player.sequence(async (scene) => {
      await scene.play(new Write(tex));
      await scene.play(new Create(square));
      await scene.play(new Transform(square, circle));
    });

    expect(player.timeline.getDuration()).toBeGreaterThan(0);
    player.timeline.seek(0);
    expect(tex.getLocalPoints().length).toBe(texPointCount);
    player.timeline.seek(player.timeline.getDuration());
    expect(tex.getLocalPoints().length).toBe(texPointCount);
  });
});

describe('MathTex.copy() glyph duplication (root cause)', () => {
  it('copy of a rendered MathTex keeps the same point count after its render settles', async () => {
    const tex = await createRenderedTex();
    const copy = tex.copy();
    // Settle the copy: before the original fix, the copy's own render
    // landed here and appended a duplicate set of glyphs. (A copy of a
    // rendered MathTex now starts no render, so this resolves at once.)
    await copy.waitForRender();

    expect(copy.children.length).toBe(tex.children.length);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
  });

  it('copy of a multi-part MathTex keeps its parts and point count', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();
    const copy = tex.copy();
    await copy.waitForRender();

    expect(copy.children.length).toBe(tex.children.length);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
    expect(copy.getPartCount()).toBe(3);
    expect(copy.getPart(0).getLocalPoints().length).toBe(tex.getPart(0).getLocalPoints().length);
    expect(copy.getPart(2).getLocalPoints().length).toBe(tex.getPart(2).getLocalPoints().length);
  });

  it('copy of a not-yet-rendered MathTex still receives its glyphs from its own render', async () => {
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    const copy = tex.copy();
    await copy.waitForRender();
    await tex.waitForRender();

    expect(copy.getLocalPoints().length).toBeGreaterThan(0);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
  });

  // A1 (review repair): copy() used to rebuild the multi-part latex from
  // this._parts, which is EMPTY until the source's render lands — so a
  // pre-render multi-part copy was constructed with latex: [] and stayed
  // permanently empty. The parts must come from the list retained at
  // construction time.
  it('copy of a not-yet-rendered multi-part MathTex keeps its parts and points after settle', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    // Synchronous copy: neither render can have landed yet.
    const copy = tex.copy();
    await copy.waitForRender();
    await tex.waitForRender();

    expect(copy.getLocalPoints().length).toBeGreaterThan(0);
    expect(copy.getPartCount()).toBe(3);
    expect(copy.children.length).toBe(tex.children.length);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
    expect(copy.getPart(0).getLocalPoints().length).toBe(tex.getPart(0).getLocalPoints().length);
    expect(copy.getPart(2).getLocalPoints().length).toBe(tex.getPart(2).getLocalPoints().length);
  });

  // A3 (review repair): the no-render decision keys on a real
  // _renderCompleted flag; a copy must present itself as rendered so a
  // copy OF the copy also starts no render instead of doubling its
  // glyphs with a second render.
  it('multi-part copy of a copy keeps its parts and point count', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();
    const copy1 = tex.copy();
    await copy1.waitForRender();
    const copy2 = copy1.copy();
    await copy2.waitForRender();

    expect(copy2.getPartCount()).toBe(3);
    expect(copy2.children.length).toBe(tex.children.length);
    expect(copy2.getLocalPoints().length).toBe(tex.getLocalPoints().length);
    expect(copy2.getPart(1).getLocalPoints().length).toBe(tex.getPart(1).getLocalPoints().length);
  });

  // A3 discriminating case (round-2 repair): the ONLY scenario where
  // the flag and the round-1 children.length proxy genuinely diverge —
  // a child added by hand to an UNRENDERED MathTex: children exist, but
  // no render has completed. The proxy concluded "already rendered" and
  // had the copy drop its render's glyphs, silently losing them; the flag
  // keeps the render, so the copy ends with the manual child AND the
  // glyphs. (The shipped A3 test above cannot tell the two mechanisms
  // apart: under the proxy it passes too.)
  function manualChild(): VMobject {
    const m = new VMobject();
    m.setPoints([
      [0, 0, 0],
      [0.3, 0, 0],
      [0.3, 0.3, 0],
      [0, 0.3, 0],
    ]);
    return m;
  }

  it('copy of an unrendered MathTex with a manually added child keeps the child AND the glyphs (A3)', async () => {
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    // Synchronous add: the constructor's render cannot have landed yet.
    tex.add(manualChild());
    const copy = tex.copy();
    await copy.waitForRender();
    await tex.waitForRender();

    expect(copy.children.length).toBe(tex.children.length);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
    // More than just the manual child's 4 points: the glyphs arrived.
    expect(copy.getLocalPoints().length).toBeGreaterThan(4);
  });

  it('copy of an unrendered multi-part MathTex with a manually added child keeps the child AND the glyphs (A3)', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    tex.add(manualChild());
    const copy = tex.copy();
    await copy.waitForRender();
    await tex.waitForRender();

    expect(copy.getPartCount()).toBe(3);
    expect(copy.children.length).toBe(tex.children.length);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
    expect(copy.getLocalPoints().length).toBeGreaterThan(4);
  });
});

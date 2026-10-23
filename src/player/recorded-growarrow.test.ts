// @vitest-environment happy-dom
/**
 * Regression tests: GrowArrow on an Arrow inside a recorded (Player)
 * scene must actually draw the arrow — during playback, at the segment
 * end, and at every seeked time.
 *
 * Bug: GrowArrow captured its target state (shaft/tip end positions,
 * end scales, end centers) from the live arrow on EVERY begin() call.
 * The recording Player resets every animation and re-begins it on each
 * seek (MasterTimeline.seek; Player.sequence() itself ends with a
 * seek(0)), and Animation.reset() restores points and the ROOT
 * transform but not child transforms — so at re-begin the shaft/tip
 * still sat in the collapsed interpolate(0) state (scale 0, centers on
 * the arrow's start point), and begin() re-captured THAT as the
 * target. The arrow stayed a single point at its start forever:
 * invisible during play, at rest, and at every seek — while FadeIn
 * and Create on the same Arrow rendered fine. Fix: GrowArrow captures
 * its end state on the first begin() only, the base class's own
 * once-only snapshot contract (Animation._preAnimationState).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Player } from './Player';
import { Arrow } from '../mobjects/geometry/Arrow';
import { VMobject } from '../core/VMobject';
import { GrowArrow } from '../animation/growing/index';

const START: [number, number, number] = [0, 0, 0];
const END: [number, number, number] = [2, 0, 0];

function createPlayer(): { player: Player; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const player = new Player(container, { width: 800, height: 450, headless: true });
  return { player, container };
}

function makeArrow(): Arrow {
  return new Arrow({ start: START, end: END });
}

/** Points of each Arrow child (shaft, tip) in the arrow's parent frame. */
function childPoints(arrow: Arrow): number[][][] {
  return arrow.children.map((c) => (c as VMobject).getPoints().map((p) => [...p]));
}

/** Coordinate span of a point set along one axis. */
function span(pts: number[][], axis: number): number {
  const vals = pts.map((p) => p[axis]);
  return Math.max(...vals) - Math.min(...vals);
}

function expectSamePoints(actual: Arrow, expected: Arrow): void {
  const a = childPoints(actual);
  const e = childPoints(expected);
  expect(a.length).toBe(e.length);
  for (let i = 0; i < e.length; i++) {
    expect(a[i].length).toBe(e[i].length);
    for (let j = 0; j < e[i].length; j++) {
      for (let k = 0; k < 3; k++) {
        expect(a[i][j][k]).toBeCloseTo(e[i][j][k], 6);
      }
    }
  }
}

async function recordGrowArrow(player: Player, arrow: Arrow): Promise<void> {
  await player.sequence(async (scene) => {
    await scene.play(new GrowArrow(arrow));
  });
}

function playTo(player: Player, t: number): void {
  player.timeline.seek(0);
  player.timeline.play();
  const step = 1 / 60;
  let now = 0;
  while (now < t - 1e-9) {
    player.timeline.update(step);
    now += step;
  }
}

describe('Player-recorded GrowArrow on an Arrow', () => {
  let player: Player;
  let container: HTMLElement;

  afterEach(() => {
    player?.dispose();
    container?.remove();
  });

  it('draws the full arrow at the segment end after seek(0) + play', async () => {
    ({ player, container } = createPlayer());
    const arrow = makeArrow();
    const reference = makeArrow();
    await recordGrowArrow(player, arrow);

    playTo(player, 1);

    // End state is point-for-point the plainly authored Arrow's.
    expectSamePoints(arrow, reference);
    // The tip is a real triangle, not a collapsed point: authored
    // tipLength 0.3 along x, 2 * tipWidth 0.2 along y.
    const tipPts = childPoints(arrow)[1];
    expect(span(tipPts, 0)).toBeCloseTo(0.3, 3);
    expect(span(tipPts, 1)).toBeCloseTo(0.2, 3);
  });

  it('seek(1) directly lands on the same end state', async () => {
    ({ player, container } = createPlayer());
    const arrow = makeArrow();
    const reference = makeArrow();
    await recordGrowArrow(player, arrow);

    player.timeline.seek(1);

    expectSamePoints(arrow, reference);
  });

  it('mid-segment seek is half-grown; seek(0) collapses onto the start point', async () => {
    ({ player, container } = createPlayer());
    const arrow = makeArrow();
    await recordGrowArrow(player, arrow);

    player.timeline.seek(0.5);
    // smooth(0.5) = 0.5: half of the authored length 2, centered
    // halfway between the start point and the full midpoint.
    expect(arrow.getWidth()).toBeCloseTo(1, 3);
    expect(arrow.getCenter()[0]).toBeCloseTo(0.5, 3);

    player.timeline.seek(0);
    expect(arrow.getWidth()).toBeCloseTo(0, 3);
    expect(arrow.getCenter()[0]).toBeCloseTo(START[0], 3);
    expect(arrow.getCenter()[1]).toBeCloseTo(START[1], 3);
  });

  it('repeated seek/play cycles do not degrade the end state', async () => {
    ({ player, container } = createPlayer());
    const arrow = makeArrow();
    const reference = makeArrow();
    await recordGrowArrow(player, arrow);

    playTo(player, 1);
    expectSamePoints(arrow, reference);
    playTo(player, 1);
    expectSamePoints(arrow, reference);
    player.timeline.seek(1);
    expectSamePoints(arrow, reference);
  });
});

describe('GrowArrow without the recorder', () => {
  it('pin: begin/interpolate(1)/finish ends at the authored points', () => {
    const arrow = makeArrow();
    const reference = makeArrow();
    const anim = new GrowArrow(arrow);
    anim.begin();
    anim.interpolate(1);
    anim.finish();
    expectSamePoints(arrow, reference);
  });

  it('reset() + re-begin (the recorder cycle) still ends at the authored points', () => {
    const arrow = makeArrow();
    const reference = makeArrow();
    const anim = new GrowArrow(arrow);
    anim.begin();
    // The recorder leaves the mobject in the begin() (alpha = 0) state,
    // resets, and re-begins on seek — the cycle that used to recapture
    // the collapsed state as the target.
    anim.reset();
    anim.begin();
    anim.interpolate(1);
    anim.finish();
    expectSamePoints(arrow, reference);
  });
});

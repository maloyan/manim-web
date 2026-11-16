// @vitest-environment happy-dom
/**
 * Regression tests: Player-recorded Transform / FadeTransform between
 * VGroups (MathTex included).
 *
 * Bugs (both threw during `Player.sequence()`):
 * 1. FadeTransform on a group threw in begin():
 *      "alignVmobjectPair: alignPoints fallback produced mismatched
 *       point counts (158 vs 173)"
 *    A group's own `_points3D` is empty, so `getEffectiveSubpathLengths()`
 *    yields no compound metadata and the fallback `VMobject.alignPoints`
 *    aligned two empty point lists — a no-op that left the raw counts.
 * 2. Transform on a group threw at the end of sequence(), in
 *    `MasterTimeline.seek()` -> `Animation.reset()`:
 *      "VGroup.setPoints: expected 173 points (sum of children's point
 *       counts), got 158"
 *    The morph strategy's begin() resamples the live leaves to the
 *    aligned counts (and pads the child list with duplicates when the
 *    target has more leaves); reset() then tried to restore the
 *    pre-animation snapshot with one flat setPoints(), which a VGroup
 *    partitions by the children's CURRENT (aligned) counts.
 *
 * Fixes: `VMobject.alignPoints` aligns containers recursively (pad the
 * shorter child list by duplicating its own children, then align each
 * pair); `FadeTransform.begin` aligns the live container against a
 * target copy; `Animation.reset` restores points structure-aware
 * (per node, rebuilding a level whose child count diverged).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Player } from './Player';
import { MathTex } from '../mobjects/text/MathTex';
import { VMobject } from '../core/VMobject';
import { VGroup } from '../core/VGroup';
import { Transform } from '../animation/transform/Transform';
import { FadeTransform, FadeTransformPieces } from '../animation/transform/FadeTransforms';
import {
  alignVmobjectPair,
  pairLeafSnapshotsByIndex,
} from '../animation/transform/TransformPairing';
import { collectLeafVMobjectSnapshots } from '../core/MobjectTraversal';
import { Square, Circle } from '../mobjects/geometry';
import { RED } from '../constants/colors';

function createPlayer(): { player: Player; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const player = new Player(container, { width: 800, height: 450, headless: true });
  return { player, container };
}

async function createRenderedTex(latex: string): Promise<MathTex> {
  const tex = new MathTex({ latex, fontSize: 1 });
  await tex.waitForRender();
  return tex;
}

function vmWithPoints(count: number): VMobject {
  const vm = new VMobject();
  const pts: number[][] = [];
  for (let i = 0; i < count; i++) pts.push([i * 0.1, (i % 3) * 0.1, 0]);
  vm.setPoints(pts);
  return vm;
}

/** VMobject-children counts at every level, for structural comparison. */
function childCountTree(m: VMobject): number[] {
  const counts: number[] = [];
  const walk = (node: VMobject): void => {
    const kids = node.children.filter((c): c is VMobject => c instanceof VMobject);
    counts.push(kids.length);
    for (const kid of kids) walk(kid);
  };
  walk(m);
  return counts;
}

function pointsApproxEqual(a: number[][], b: number[][], eps = 1e-4): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let k = 0; k < 3; k++) {
      if (Math.abs((a[i][k] ?? 0) - (b[i][k] ?? 0)) > eps) return false;
    }
  }
  return true;
}

/**
 * Assert every leaf of `source` now sits exactly on some leaf of `target`
 * (world-space points). This is the correct end-state invariant for a
 * group Transform: when the target side had to be padded, a source leaf
 * legitimately lands on a duplicate of a target leaf (Manim CE
 * add_n_more_submobjects semantics), so totals can exceed the target's —
 * but no source leaf may end up anywhere except on target geometry.
 */
function expectLeavesOnTarget(source: VMobject, target: VMobject): void {
  const targetLeafPoints = collectLeafVMobjectSnapshots(target).map((s) => s.leaf.getPoints());
  const sourceLeaves = collectLeafVMobjectSnapshots(source);
  expect(sourceLeaves.length).toBeGreaterThan(0);
  for (const s of sourceLeaves) {
    const pts = s.leaf.getPoints();
    expect(targetLeafPoints.some((t) => pointsApproxEqual(pts, t))).toBe(true);
  }
}

/**
 * Assert every leaf of `source` ends on `target` geometry, comparing
 * world-space centroids. A resampled curve keeps its centroid (the
 * subdivision is exact), while exact point arrays legitimately differ
 * after alignment resampling — so for fade/piece morphs, centroids are
 * the honest end-state invariant, not point totals or exact arrays.
 */
function leafCentroid(leaf: VMobject): number[] {
  const pts = leaf.getPoints();
  const c = [0, 0, 0];
  for (const p of pts) {
    c[0] += p[0];
    c[1] += p[1];
    c[2] += p[2] ?? 0;
  }
  return c.map((v) => v / pts.length);
}

function expectLeafCentroidsOnTarget(source: VMobject, target: VMobject, tol = 0.1): void {
  const targetCentroids = collectLeafVMobjectSnapshots(target).map((s) => leafCentroid(s.leaf));
  const sourceLeaves = collectLeafVMobjectSnapshots(source);
  expect(sourceLeaves.length).toBeGreaterThan(0);
  for (const s of sourceLeaves) {
    const c = leafCentroid(s.leaf);
    const best = Math.min(
      ...targetCentroids.map((t) => Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2])),
    );
    expect(best).toBeLessThan(tol);
  }
}

async function createMultiPartTex(parts: string[]): Promise<MathTex> {
  const tex = new MathTex({ latex: parts, fontSize: 1 });
  await tex.waitForRender();
  return tex;
}

describe('group alignment (alignPoints / alignVmobjectPair)', () => {
  it('alignPoints pads the shorter child list and equalizes totals', () => {
    const source = new VGroup(vmWithPoints(5), vmWithPoints(8));
    const target = new VGroup(vmWithPoints(10));

    source.alignPoints(target);

    expect(source.children.length).toBe(2);
    expect(target.children.length).toBe(2);
    expect(source.getLocalPoints().length).toBe(target.getLocalPoints().length);
    expect(childCountTree(source)).toEqual(childCountTree(target));
  });

  it('alignPoints recurses into nested groups with differing child counts', () => {
    const source = new VGroup(
      new VGroup(vmWithPoints(5), vmWithPoints(8)),
      new VGroup(vmWithPoints(6)),
    );
    const target = new VGroup(
      new VGroup(vmWithPoints(9)),
      new VGroup(vmWithPoints(4), vmWithPoints(7), vmWithPoints(5)),
    );

    source.alignPoints(target);

    expect(source.getLocalPoints().length).toBe(target.getLocalPoints().length);
    expect(childCountTree(source)).toEqual(childCountTree(target));
  });

  it('alignVmobjectPair returns equal-length arrays for two MathTex', async () => {
    const a = await createRenderedTex('x^2');
    const b = await createRenderedTex('x^3');

    const aligned = alignVmobjectPair(a, b);

    expect(aligned.startPoints.length).toBeGreaterThan(0);
    expect(aligned.startPoints.length).toBe(aligned.targetPoints.length);
  });

  /** A leaf shaped as a small closed loop centered at (cx, 0). */
  function leafAt(cx: number): VMobject {
    const vm = new VMobject();
    vm.setPoints([
      [cx - 0.1, -0.1, 0],
      [cx + 0.1, -0.1, 0],
      [cx + 0.1, 0.1, 0],
      [cx - 0.1, 0.1, 0],
    ]);
    return vm;
  }

  function centerX(m: VMobject): number {
    const pts = m.getLocalPoints();
    let sum = 0;
    for (const p of pts) sum += p[0];
    return Math.round((sum / pts.length) * 1e6) / 1e6;
  }

  // B4 (review repair): the padding distribution must follow the CE
  // repeat-index rule over the FULL padded range — each duplicate sits
  // immediately after the child it copies ([A, A', B, B']) — not appended
  // at the end ([A, B, B', B'']), which pairs the last source glyph with
  // most of the target.
  it('alignPoints distributes padding duplicates immediately after their source (B4)', () => {
    const source = new VGroup(leafAt(0), leafAt(10));
    const target = new VGroup(leafAt(0), leafAt(3), leafAt(6), leafAt(9));

    source.alignPoints(target);

    expect(source.children.length).toBe(4);
    expect(source.children.map((c) => centerX(c as VMobject))).toEqual([0, 0, 10, 10]);
    expect(source.getLocalPoints().length).toBe(target.getLocalPoints().length);
  });

  // B4 (review repair): the group branch must pair the same leaves that
  // Transform's leaf pairing (pairLeafSnapshotsByIndex / padByDuplication)
  // pairs for the same input — one distribution rule, not two.
  it('alignPoints padding pairs the same leaves as pairLeafSnapshotsByIndex (B4)', () => {
    const s1 = new VGroup(leafAt(0), leafAt(10));
    const t1 = new VGroup(leafAt(0), leafAt(3), leafAt(6), leafAt(9));
    const pairCenters = pairLeafSnapshotsByIndex(s1, t1).map((p) => centerX(p.source.leaf));

    const s2 = new VGroup(leafAt(0), leafAt(10));
    const t2 = new VGroup(leafAt(0), leafAt(3), leafAt(6), leafAt(9));
    s2.alignPoints(t2);
    const alignedCenters = s2.children.map((c) => centerX(c as VMobject));

    expect(alignedCenters).toEqual([0, 0, 10, 10]);
    expect(alignedCenters).toEqual(pairCenters);
  });

  // B5 (review repair): alignment must never fabricate own points on a
  // container. The leaf path used to write interpolated ORIGIN points
  // into a point-less container's _points3D, flipping hasOwnPoints() to
  // true and adding a phantom member to familyMembersWithPoints() —
  // corruption that survived reset (VGroup.setPoints never touches it).
  it('alignPoints never writes own points into a container (B5)', () => {
    const empty = new VGroup();
    empty.alignPoints(new Square());
    expect(empty.hasOwnPoints()).toBe(false);
    expect(empty.familyMembersWithPoints()).toHaveLength(0);

    const square = new Square();
    const emptyTarget = new VGroup();
    square.alignPoints(emptyTarget);
    expect(emptyTarget.hasOwnPoints()).toBe(false);
    expect(emptyTarget.familyMembersWithPoints()).toHaveLength(0);

    const withChild = new VGroup(new Circle());
    const familyBefore = withChild.familyMembersWithPoints().length;
    withChild.alignPoints(new Square());
    expect(withChild.hasOwnPoints()).toBe(false);
    expect(withChild.familyMembersWithPoints()).toHaveLength(familyBefore);
  });
});

describe('Player-recorded group transforms', () => {
  let player: Player;
  let container: HTMLElement;

  afterEach(() => {
    player?.dispose();
    container?.remove();
  });

  it('records Transform MathTex x^2 -> x^3 and seeks cleanly', async () => {
    ({ player, container } = createPlayer());
    const a = await createRenderedTex('x^2');
    const b = await createRenderedTex('x^3');
    const targetPoints = b.getLocalPoints();

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);

    // End state is the target's exact geometry.
    player.timeline.seek(duration);
    expect(a.getLocalPoints()).toEqual(targetPoints);

    // Mid and start seeks re-run the morph without throwing, at the
    // aligned point total.
    player.timeline.seek(duration / 2);
    const midCount = a.getLocalPoints().length;
    expect(midCount).toBeGreaterThan(0);
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBe(midCount);
  });

  it('records Transform with different child counts (x^2 -> x^2+1)', async () => {
    ({ player, container } = createPlayer());
    const a = await createRenderedTex('x^2');
    const b = await createRenderedTex('x^2+1');

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
    });

    const duration = player.timeline.getDuration();
    player.timeline.seek(duration);
    expectLeavesOnTarget(a, b);

    // Seeking back to the start re-runs begin() from the restored
    // snapshot without throwing (the reset path that used to crash).
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeavesOnTarget(a, b);
  });

  it('records FadeTransform MathTex x^2 -> x^3', async () => {
    ({ player, container } = createPlayer());
    const a = await createRenderedTex('x^2');
    const b = await createRenderedTex('x^3');
    const targetCount = b.getLocalPoints().length;

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransform(a, b));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);

    player.timeline.seek(duration);
    expect(a.getLocalPoints().length).toBe(targetCount);
    expect(a.opacity).toBe(1);

    player.timeline.seek(duration / 2);
    expect(a.getLocalPoints().length).toBe(targetCount);
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBe(targetCount);
  });

  // B1 (review repair): restorePointsFromSnapshot used to rebuild any
  // level whose child count diverged out of snapshot COPIES, detaching
  // the mobject's real children. The only divergence producers append
  // fabricated duplicates, so reset must drop the extras and restore the
  // surviving originals pairwise — identity preserved. (Pinned here via
  // a direct begin/reset pair: a Player seek re-begins the animation
  // afterwards, which legitimately re-pads — see the recorded tests.)
  it('Transform begin/reset restores the exact pre-animation children (B1)', async () => {
    const a = await createRenderedTex('x^2');
    const b = await createRenderedTex('x^2+1');
    const originals = [...a.children];

    const anim = new Transform(a, b);
    anim.begin();
    expect(a.children.length).toBeGreaterThan(originals.length);

    anim.reset();
    expect(a.children.length).toBe(originals.length);
    for (let i = 0; i < originals.length; i++) {
      expect(a.children[i]).toBe(originals[i]);
    }
  });

  it('recorded Transform + seek(0) keeps the original children in place (B1)', async () => {
    ({ player, container } = createPlayer());
    const a = await createRenderedTex('x^2');
    const b = await createRenderedTex('x^2+1');
    const originals = [...a.children];

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
    });

    player.timeline.seek(0);
    // The seek re-begins the morph (duplicates re-appended at the end),
    // but the originals must still be the children at their own indices —
    // before the fix, reset had replaced them with snapshot copies.
    for (let i = 0; i < originals.length; i++) {
      expect(a.children[i]).toBe(originals[i]);
    }
  });

  // B1 outcome test (review repair): after a count-changing morph of a
  // multi-part MathTex and a seek back to 0, getPart(i) must still BE
  // children[i], and setColorByTex must recolor the LIVE formula (before
  // the fix it silently recolored detached snapshot copies).
  it('Transform + seek(0) preserves MathTex parts; setColorByTex recolors live (B1)', async () => {
    ({ player, container } = createPlayer());
    const a = new MathTex({ latex: ['x^2', '+1'], fontSize: 1 });
    await a.waitForRender();
    const b = new MathTex({ latex: ['y^3', '+1', '+y'], fontSize: 1 });
    await b.waitForRender();
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
    });

    player.timeline.seek(0);
    expect(a.children[0]).toBe(part0);
    expect(a.children[1]).toBe(part1);
    expect(a.getPart(0)).toBe(part0);
    expect(a.getPart(1)).toBe(part1);

    a.setColorByTex('x^2', RED);
    expect((a.children[0] as VMobject).color).toBe(RED);
    expect((a.children[1] as VMobject).color).not.toBe(RED);
  });

  // B2 (review repair): FadeTransformPieces paired children on COPIES via
  // alignVmobjectPair but applied the flat arrays to the LIVE children;
  // for group children (multi-part MathTex parts) the live counts were
  // never aligned and setPoints threw the original partition error.
  it('records FadeTransformPieces between multi-part MathTex, one part (B2)', async () => {
    ({ player, container } = createPlayer());
    const a = new MathTex({ latex: ['x^2'], fontSize: 1 });
    await a.waitForRender();
    const b = new MathTex({ latex: ['x^3'], fontSize: 1 });
    await b.waitForRender();

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransformPieces(a, b));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeafCentroidsOnTarget(a, b);
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBeGreaterThan(0);
  });

  it('records FadeTransformPieces between multi-part MathTex, two parts (B2)', async () => {
    ({ player, container } = createPlayer());
    const a = new MathTex({ latex: ['x^2', '+1'], fontSize: 1 });
    await a.waitForRender();
    const b = new MathTex({ latex: ['x^3', '+1'], fontSize: 1 });
    await b.waitForRender();

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransformPieces(a, b));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeafCentroidsOnTarget(a, b);
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBeGreaterThan(0);
  });

  // B2 residual (round-2 repair): with DIFFERING part counts the piece
  // loop clamped indices (Math.min(i, len - 1)), so piece 2 reused
  // piece 1's live child and aligned it a second time, invalidating
  // piece 1's stored partition — the original crash returned verbatim
  // ("VGroup.setPoints: expected 134, got 98" inside interpolate).
  // Manim CE's FadeTransformPieces.begin() calls align_submobjects
  // first: the shorter side's structure is padded (duplicating its own
  // submobjects) so pieces pair by index over EQUAL lists. Mirror that.
  it('records FadeTransformPieces with differing part counts, 2 -> 3 (B2 residual)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^2', '+1']);
    const b = await createMultiPartTex(['x^3', '+1', '+y']);
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransformPieces(a, b));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeafCentroidsOnTarget(a, b);
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBeGreaterThan(0);
    // The fabricated third part is a duplicate, pruned/rebuilt around
    // the originals — the original parts survive as members.
    expect(a.children).toContain(part0);
    expect(a.children).toContain(part1);
  });

  it('records FadeTransformPieces with differing part counts, 3 -> 2 (B2 residual)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^3', '+1', '+y']);
    const b = await createMultiPartTex(['x^2', '+1']);

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransformPieces(a, b));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeafCentroidsOnTarget(a, b);
    player.timeline.seek(0);
    expect(a.getLocalPoints().length).toBeGreaterThan(0);
  });

  // B1 redesign (round-2 repair): reset bookkeeping is per-animation.
  // Animation.begin() records the mobject's child identity lists; reset
  // removes exactly the children that animation added and restores the
  // survivors by begin index. Round 1 instead kept ONE record on the
  // mobject (_alignmentPaddedChildren), overwritten by every alignment —
  // a second morph of the same formula corrupted it, the second reset
  // fell into the copy-rebuild branch, and the original parts detached.
  it('two sequential Transforms + seek(0) keep the original parts in place (B1 redesign)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^2', '+1']);
    const b = await createMultiPartTex(['x^3', '+1', '+y']);
    const c = await createMultiPartTex(['z^2', '-1']);
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
      await scene.play(new Transform(a, c));
    });

    player.timeline.seek(0);
    // Transform's strategy appends its fabricated leaves at the END of
    // the root, so the originals stay at their own indices — across
    // BOTH morphs, not just the first.
    expect(a.children[0]).toBe(part0);
    expect(a.children[1]).toBe(part1);
    expect(a.getPart(0)).toBe(part0);
    expect(a.getPart(1)).toBe(part1);

    a.setColorByTex('x^2', RED);
    expect(part0.color).toBe(RED);
  });

  it('two sequential FadeTransforms + seek(0) keep the original parts as members (B1 redesign)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^2', '+1']);
    const b = await createMultiPartTex(['x^3', '+1', '+y']);
    const c = await createMultiPartTex(['z^2', '-1', '+w']);
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransform(a, b));
      await scene.play(new FadeTransform(a, c));
    });

    player.timeline.seek(0);
    // FadeTransform's alignment INTERLEAVES its fabricated duplicates
    // after their sources, so the guarantee is membership (and _parts
    // identity), NOT indices — see the contract note in FIX_NOTES.
    expect(a.children).toContain(part0);
    expect(a.children).toContain(part1);
    expect(a.getPart(0)).toBe(part0);
    expect(a.getPart(1)).toBe(part1);

    a.setColorByTex('x^2', RED);
    expect(part0.color).toBe(RED);
  });

  it('Transform + repeated seek cycles keep the original children in place (B1 redesign)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^2', '+1']);
    const b = await createMultiPartTex(['x^3', '+1', '+y']);
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
    });

    const duration = player.timeline.getDuration();
    player.timeline.seek(duration / 2);
    player.timeline.seek(0);
    player.timeline.seek(duration / 2);
    player.timeline.seek(0);
    expect(a.children[0]).toBe(part0);
    expect(a.children[1]).toBe(part1);
    expect(a.getPart(0)).toBe(part0);
    expect(a.getPart(1)).toBe(part1);
  });

  // B-mixed (round-2 repair): a morph leaves the live mobject carrying
  // fabricated structure (Transform appends duplicate leaves at the
  // root; FadeTransform interleaves duplicates inside the parts). A
  // second morph of a DIFFERENT kind must treat that as a legitimate
  // input. Pre-fix, Transform -> FadeTransform threw at the second
  // begin(): "alignPoints produced mismatched point counts (448 vs
  // 585)" — the root's stray leaves cannot pair level-by-level with
  // the target's part groups, so alignment now falls back to pairing
  // the two leaf families (CE add_n_more_submobjects over the family).
  it('Transform then FadeTransform on one multi-part MathTex plays end-to-end (B-mixed)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^2', '+1']);
    const b = await createMultiPartTex(['x^3', '+1', '+y']);
    const c = await createMultiPartTex(['z^2', '-1']);
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new Transform(a, b));
      await scene.play(new FadeTransform(a, c));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeafCentroidsOnTarget(a, c);

    player.timeline.seek(0);
    expect(a.children[0]).toBe(part0);
    expect(a.children[1]).toBe(part1);
  });

  it('FadeTransform then Transform on one multi-part MathTex plays end-to-end (B-mixed)', async () => {
    ({ player, container } = createPlayer());
    const a = await createMultiPartTex(['x^2', '+1']);
    const b = await createMultiPartTex(['x^3', '+1', '+y']);
    const c = await createMultiPartTex(['z^2', '-1']);
    const part0 = a.getPart(0);
    const part1 = a.getPart(1);

    await player.sequence(async (scene) => {
      await scene.play(new FadeTransform(a, b));
      await scene.play(new Transform(a, c));
    });

    const duration = player.timeline.getDuration();
    expect(duration).toBeGreaterThan(0);
    player.timeline.seek(duration);
    expectLeavesOnTarget(a, c);

    player.timeline.seek(0);
    // The animation re-begun at t=0 is the FadeTransform (interleaved
    // padding): membership, not indices.
    expect(a.children).toContain(part0);
    expect(a.children).toContain(part1);
    expect(a.getPart(0)).toBe(part0);
    expect(a.getPart(1)).toBe(part1);
  });
});

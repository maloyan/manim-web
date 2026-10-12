// @vitest-environment happy-dom
/**
 * Regression tests for a pre-existing crash that broke several docs animation
 * examples (black render). The console error was:
 *
 *   Animation error: Error: alignCompoundPathsForTransform: source subpath
 *   lengths sum (0) does not match source point count (73)
 *
 * Root cause: `_transformSubpathLengths` is a transient Transform-time override
 * set together with a matching point array. A later operation can replace the
 * points without clearing it (`become`, a second Transform to a target with a
 * different topology, a stale finish override). The stored lengths then no
 * longer sum to the live point count. The transform aligner validated the stale
 * lengths against the new points and threw, aborting the animation.
 *
 * Fix: `VMobject.getEffectiveSubpathLengths()` returns undefined when the stored
 * lengths do not sum to the current point count, so callers and the renderer
 * fall back to a single full-length subpath instead of crashing.
 */
import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { Scene } from '../../core/Scene';
import { Transform } from './Transform';
import { alignVmobjectPair } from './TransformPairing';

/** Build a VMobject with two subpaths so it carries compound base lengths. */
function compound(seed: number, n1: number, n2: number): VMobject {
  const pts: number[][] = [];
  const ring = (count: number, cx: number): void => {
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      pts.push([cx + Math.cos(t + seed), Math.sin(t + seed), 0]);
    }
  };
  ring(n1, 0);
  ring(n2, 3);
  const vm = new VMobject();
  vm.setPoints(pts);
  vm.setBaseSubpathLengths([n1, n2]);
  return vm;
}

function headlessScene(): Scene {
  return new Scene(null, { width: 800, height: 600, headless: true });
}

describe('VMobject.getEffectiveSubpathLengths stale-metadata guard', () => {
  it('returns matching subpath lengths unchanged', () => {
    const vm = compound(0, 40, 33); // 73 points, [40, 33]
    expect(vm.getEffectiveSubpathLengths()).toEqual([40, 33]);
  });

  it('returns undefined for an empty transform override (sum 0 != points)', () => {
    const vm = compound(0, 40, 33); // 73 points
    vm.setTransformSubpathLengths([]);
    expect(vm.getEffectiveSubpathLengths()).toBeUndefined();
  });

  it('returns undefined when a transform override no longer sums to the point count', () => {
    const vm = compound(0, 40, 33); // 73 points
    vm.setTransformSubpathLengths([30, 30]); // sum 60 != 73
    expect(vm.getEffectiveSubpathLengths()).toBeUndefined();
  });

  it('returns undefined when base lengths no longer sum to the point count', () => {
    const vm = compound(0, 40, 33); // base [40, 33], sum 73
    vm.setPoints(Array.from({ length: 50 }, (_, i) => [i * 0.01, 0, 0])); // 50 points now
    expect(vm.getEffectiveSubpathLengths()).toBeUndefined();
  });
});

describe('Transform does not crash on stale subpath lengths', () => {
  it('alignVmobjectPair with an empty stale override does not throw the production error', () => {
    const source = compound(0, 40, 33); // 73 points
    source.setTransformSubpathLengths([]); // the exact "sum (0) ... (73)" trigger
    const target = compound(1, 30, 30);
    expect(() => alignVmobjectPair(source, target)).not.toThrow();
  });

  it('alignVmobjectPair with a mismatched stale override does not throw', () => {
    const source = compound(0, 40, 33); // 73 points
    source.setTransformSubpathLengths([30, 30]); // sum 60 != 73
    const target = compound(1, 25, 25);
    expect(() => alignVmobjectPair(source, target)).not.toThrow();
  });
});

describe('Transform animation end-to-end (loop / re-run)', () => {
  it('transform, then become (point-count change), then transform again does not crash', async () => {
    const scene = headlessScene();
    const a = compound(0, 40, 33);
    const b = compound(1, 30, 30);
    scene.add(a);

    await scene.play(new Transform(a, b, { duration: 0.01 }));

    // A non-transform op replaces the points without touching subpath metadata,
    // leaving the Transform-time override stale.
    const simple = new VMobject();
    simple.setPoints(Array.from({ length: 73 }, (_, i) => [i * 0.01, 0, 0]));
    a.become(simple);

    const d = compound(2, 25, 25);
    await expect(scene.play(new Transform(a, d, { duration: 0.01 }))).resolves.toBeUndefined();

    scene.dispose();
  }, 30000);

  it('re-running the same Transform pair across loop iterations does not crash', async () => {
    const scene = headlessScene();
    for (let iter = 0; iter < 3; iter++) {
      const a = compound(0, 40, 33);
      const b = compound(1, 30, 30);
      scene.add(a);
      await expect(scene.play(new Transform(a, b, { duration: 0.01 }))).resolves.toBeUndefined();
      scene.clear({ render: false });
    }
    scene.dispose();
  }, 30000);
});

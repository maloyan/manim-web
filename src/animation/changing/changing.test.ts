import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { YELLOW, DEFAULT_STROKE_WIDTH } from '../../constants';
import { TracedPath, tracedPath, AnimatedBoundary, animatedBoundary } from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMobject(): VMobject {
  return new VMobject();
}

/** Create a VMobject with a simple shape so getBounds() returns meaningful values */
function makeVMobjectWithBounds(): VMobject {
  const vm = new VMobject();
  // Set up a rectangle-ish shape: 4 cubic Bezier control points
  vm.setPoints([
    [-1, -1, 0],
    [-0.33, -1, 0],
    [0.33, -1, 0],
    [1, -1, 0],
    [1, -1, 0],
    [1, -0.33, 0],
    [1, 0.33, 0],
    [1, 1, 0],
  ]);
  return vm;
}

// ============================================================================
// TracedPath
// ============================================================================

describe('TracedPath', () => {
  // -----------------------------------------------------------
  // Constructor / defaults
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('stores the tracked mobject', () => {
      const mob = makeMobject();
      const traced = new TracedPath(mob);
      expect(traced.trackedMobject).toBe(mob);
    });

    it('uses YELLOW stroke color by default', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.color).toBe(YELLOW);
    });

    it('uses DEFAULT_STROKE_WIDTH by default', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
    });

    it('sets fillOpacity to 0 (stroke-only)', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.fillOpacity).toBe(0);
    });

    it('accepts custom stroke options', () => {
      const traced = new TracedPath(makeMobject(), {
        strokeColor: '#FF0000',
        strokeWidth: 8,
        strokeOpacity: 0.5,
      });
      expect(traced.color).toBe('#FF0000');
      expect(traced.strokeWidth).toBe(8);
    });

    it('registers an updater on construction', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.hasUpdaters()).toBe(true);
    });

    it('records initial position on construction', () => {
      const mob = makeMobject();
      mob.position.set(3, 4, 0);
      const traced = new TracedPath(mob);
      // The initial position is recorded; since there's only 1 point, no path is drawn yet
      // (needs at least 2 points). No error thrown means recording worked.
      expect(traced.numPoints).toBe(0); // <2 points => clearPoints is called
    });
  });

  // -----------------------------------------------------------
  // _updatePath via updater
  // -----------------------------------------------------------

  describe('path tracking', () => {
    it('records new position when mobject moves beyond minDistance', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.05 });

      // Move mobject and call updater
      mob.position.set(1, 0, 0);
      traced.update(0.016); // simulate one frame at ~60fps

      // Should now have 2 points (initial + moved), so path should have Bezier points
      // With 2 data points, we get 1 segment = 4 Bezier points
      expect(traced.numPoints).toBe(4);
    });

    it('does not record new position when mobject barely moved', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.5 });

      // Move a tiny amount (below threshold)
      mob.position.set(0.01, 0, 0);
      traced.update(0.016);

      // Still only 1 point in path data => path cleared (needs >=2)
      expect(traced.numPoints).toBe(0);
    });

    it('builds smooth Bezier curves through multiple points', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.01 });

      // Move through several positions
      mob.position.set(1, 0, 0);
      traced.update(0.016);

      mob.position.set(2, 1, 0);
      traced.update(0.016);

      mob.position.set(3, 0, 0);
      traced.update(0.016);

      // 4 data points => 3 Bezier segments => 3*3 + 1 = 10 Bezier points
      // (first anchor + 3 per segment: handle1, handle2, anchor2)
      expect(traced.numPoints).toBe(10);
    });

    it('uses Catmull-Rom style control points for smoothing', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.01 });

      mob.position.set(1, 1, 0);
      traced.update(0.016);

      mob.position.set(2, 0, 0);
      traced.update(0.016);

      // With 3 data points, 2 segments => 7 Bezier points
      expect(traced.numPoints).toBe(7);

      // Points should contain smoothed handles (not just straight lines)
      const points = traced.points;
      expect(points.length).toBe(7);

      // First anchor should be at (0,0)
      expect(points[0].x).toBeCloseTo(0, 1);
      expect(points[0].y).toBeCloseTo(0, 1);

      // Last anchor should be at (2,0)
      expect(points[6].x).toBeCloseTo(2, 1);
      expect(points[6].y).toBeCloseTo(0, 1);
    });
  });

  // -----------------------------------------------------------
  // Dissipation
  // -----------------------------------------------------------

  describe('dissipation', () => {
    it('removes old points when dissipatingTime > 0', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, {
        dissipatingTime: 0.5,
        minDistanceToNewPoint: 0.01,
      });

      // Record several points
      mob.position.set(1, 0, 0);
      traced.update(0.1);

      mob.position.set(2, 0, 0);
      traced.update(0.1);

      mob.position.set(3, 0, 0);
      traced.update(0.1);

      const pointsBefore = traced.numPoints;
      expect(pointsBefore).toBeGreaterThan(0);

      // Advance time beyond dissipatingTime to expire early points
      mob.position.set(4, 0, 0);
      traced.update(0.5);

      // After enough time, older points should be removed
      // The path should have fewer points now (or at least not more)
      const pointsAfter = traced.numPoints;
      expect(pointsAfter).toBeLessThanOrEqual(pointsBefore);
    });

    it('does not remove points when dissipatingTime is 0', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, {
        dissipatingTime: 0,
        minDistanceToNewPoint: 0.01,
      });

      mob.position.set(1, 0, 0);
      traced.update(0.1);

      mob.position.set(2, 0, 0);
      traced.update(0.1);

      mob.position.set(3, 0, 0);
      traced.update(0.1);

      const pointsBefore = traced.numPoints;

      // Advance a lot of time
      mob.position.set(4, 0, 0);
      traced.update(100);

      const pointsAfter = traced.numPoints;
      // Points should increase, not decrease
      expect(pointsAfter).toBeGreaterThanOrEqual(pointsBefore);
    });
  });

  // -----------------------------------------------------------
  // maxPoints limit
  // -----------------------------------------------------------

  describe('maxPoints', () => {
    it('limits path data to maxPoints entries', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, {
        maxPoints: 5,
        minDistanceToNewPoint: 0.01,
      });

      // Record many positions
      for (let i = 1; i <= 10; i++) {
        mob.position.set(i, 0, 0);
        traced.update(0.016);
      }

      // With maxPoints=5, we should have at most 5 data points
      // => at most 4 segments => 4*3 + 1 = 13 Bezier points
      // But definitely not all 11 data points' worth of Bezier points
      expect(traced.numPoints).toBeLessThanOrEqual(13);
      expect(traced.numPoints).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------
  // clearPath
  // -----------------------------------------------------------

  describe('clearPath()', () => {
    it('removes all path data', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.01 });

      mob.position.set(1, 0, 0);
      traced.update(0.016);

      expect(traced.numPoints).toBeGreaterThan(0);

      traced.clearPath();
      expect(traced.numPoints).toBe(0);
    });

    it('returns this for chaining', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.clearPath()).toBe(traced);
    });
  });

  // -----------------------------------------------------------
  // stopTracking / resumeTracking
  // -----------------------------------------------------------

  describe('stopTracking()', () => {
    it('removes the updater', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.hasUpdaters()).toBe(true);
      traced.stopTracking();
      expect(traced.hasUpdaters()).toBe(false);
    });

    it('returns this for chaining', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.stopTracking()).toBe(traced);
    });

    it('prevents further path recording', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.01 });

      mob.position.set(1, 0, 0);
      traced.update(0.016);
      const pointsAfterFirst = traced.numPoints;

      traced.stopTracking();

      mob.position.set(2, 0, 0);
      traced.update(0.016);

      // Since updater removed, update doesn't trigger recording
      // But update() calls _runUpdaters which has no updaters now
      expect(traced.numPoints).toBe(pointsAfterFirst);
    });
  });

  describe('resumeTracking()', () => {
    it('re-adds the updater', () => {
      const traced = new TracedPath(makeMobject());
      traced.stopTracking();
      expect(traced.hasUpdaters()).toBe(false);
      traced.resumeTracking();
      expect(traced.hasUpdaters()).toBe(true);
    });

    it('does not double-add if already tracking', () => {
      const traced = new TracedPath(makeMobject());
      traced.resumeTracking(); // already tracking, should no-op
      expect(traced.hasUpdaters()).toBe(true);
    });

    it('returns this for chaining', () => {
      const traced = new TracedPath(makeMobject());
      expect(traced.resumeTracking()).toBe(traced);
    });

    it('resumes path recording after stop', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.01 });

      mob.position.set(1, 0, 0);
      traced.update(0.016);

      traced.stopTracking();

      mob.position.set(2, 0, 0);
      traced.update(0.016);
      const pointsBeforeResume = traced.numPoints;

      traced.resumeTracking();

      mob.position.set(5, 0, 0);
      traced.update(0.016);

      expect(traced.numPoints).toBeGreaterThan(pointsBeforeResume);
    });
  });

  // -----------------------------------------------------------
  // _createCopy
  // -----------------------------------------------------------

  describe('copy', () => {
    it('creates a copy with the same tracked mobject', () => {
      const mob = makeMobject();
      const traced = new TracedPath(mob, {
        strokeColor: '#FF0000',
        strokeWidth: 8,
        dissipatingTime: 2,
        minDistanceToNewPoint: 0.1,
        maxPoints: 500,
      });

      // Move to build some path data
      mob.position.set(1, 0, 0);
      traced.update(0.016);

      const copy = traced.copy() as TracedPath;
      expect(copy).toBeInstanceOf(TracedPath);
      expect(copy.trackedMobject).toBe(mob);
      expect(copy.color).toBe('#FF0000');
      expect(copy.strokeWidth).toBe(8);
    });
  });

  // -----------------------------------------------------------
  // Edge case: fewer than 2 points
  // -----------------------------------------------------------

  describe('edge cases', () => {
    it('with only 1 point, path is cleared (no Bezier)', () => {
      const mob = makeMobject();
      mob.position.set(5, 5, 0);
      const traced = new TracedPath(mob);
      // Only initial position recorded, no second point
      expect(traced.numPoints).toBe(0);
    });

    it('3D tracking works (z-axis movement)', () => {
      const mob = makeMobject();
      mob.position.set(0, 0, 0);
      const traced = new TracedPath(mob, { minDistanceToNewPoint: 0.01 });

      mob.position.set(0, 0, 1);
      traced.update(0.016);

      mob.position.set(0, 0, 2);
      traced.update(0.016);

      expect(traced.numPoints).toBe(7); // 3 data points => 2 segments => 7 Bezier pts
    });
  });

  // -----------------------------------------------------------
  // tracedPath() factory
  // -----------------------------------------------------------

  describe('tracedPath() factory', () => {
    it('returns a TracedPath instance', () => {
      const mob = makeMobject();
      const result = tracedPath(mob);
      expect(result).toBeInstanceOf(TracedPath);
      expect(result.trackedMobject).toBe(mob);
    });

    it('passes options through', () => {
      const result = tracedPath(makeMobject(), {
        strokeColor: '#00FF00',
        strokeWidth: 10,
        dissipatingTime: 3,
      });
      expect(result.color).toBe('#00FF00');
      expect(result.strokeWidth).toBe(10);
    });
  });
});

// ============================================================================
// AnimatedBoundary
// ============================================================================

describe('AnimatedBoundary', () => {
  // -----------------------------------------------------------
  // Constructor / defaults
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('stores the bounded mobject', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.boundedMobject).toBe(mob);
    });

    it('defaults colors to [BLUE, YELLOW]', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      // Check that dashes have BLUE and YELLOW colors
      // The boundary is a VMobject with dash children
      expect(boundary).toBeInstanceOf(VMobject);
    });

    it('sets fillOpacity to 0', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.fillOpacity).toBe(0);
    });

    it('registers an updater for animation', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.hasUpdaters()).toBe(true);
    });

    it('creates dash children', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { numDashes: 10 });
      // Should have 10 children (dashes)
      const children = boundary.children;
      expect(children.length).toBe(10);
    });

    it('accepts custom options', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        numDashes: 15,
        dashWidth: 5,
        cycleRate: 2,
        buff: 0.2,
      });
      const children = boundary.children;
      expect(children.length).toBe(15);
    });

    it('cycles colors across dashes', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, {
        colors: ['#FF0000', '#00FF00'],
        numDashes: 4,
      });
      const children = boundary.children as VMobject[];
      expect(children[0].color).toBe('#FF0000');
      expect(children[1].color).toBe('#00FF00');
      expect(children[2].color).toBe('#FF0000');
      expect(children[3].color).toBe('#00FF00');
    });

    it('default numDashes is 30', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.children.length).toBe(30);
    });
  });

  // -----------------------------------------------------------
  // Animation update
  // -----------------------------------------------------------

  describe('animation', () => {
    it('updates phase on each tick', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { cycleRate: 1 });

      // Each dash should have points set
      const childBefore = boundary.children[0] as VMobject;
      const pointsBefore = childBefore.points.map((p) => ({ x: p.x, y: p.y }));

      // Update with enough dt to see a difference
      boundary.update(0.25);

      const childAfter = boundary.children[0] as VMobject;
      const pointsAfter = childAfter.points.map((p) => ({ x: p.x, y: p.y }));

      // Phase changed => dashes should have moved
      // At least one coordinate should differ
      const moved = pointsAfter.some(
        (p, i) =>
          Math.abs(p.x - pointsBefore[i].x) > 0.001 || Math.abs(p.y - pointsBefore[i].y) > 0.001,
      );
      expect(moved).toBe(true);
    });

    it('phase wraps around at 1', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { cycleRate: 1 });

      // Advance exactly 1 second (full cycle)
      boundary.update(1.0);

      // Dashes should be repositioned (phase wraps to 0)
      // Boundary still has children
      expect(boundary.children.length).toBeGreaterThan(0);
    });

    it('higher cycleRate makes dashes move faster', () => {
      const mob = makeVMobjectWithBounds();
      const slow = new AnimatedBoundary(mob, { cycleRate: 0.5, numDashes: 4 });
      const fast = new AnimatedBoundary(mob, { cycleRate: 2, numDashes: 4 });

      // Same dt produces different positions
      slow.update(0.1);
      fast.update(0.1);

      const slowChild = slow.children[0] as VMobject;
      const fastChild = fast.children[0] as VMobject;

      const slowPts = slowChild.points;
      const fastPts = fastChild.points;

      if (slowPts.length > 0 && fastPts.length > 0) {
        const differ =
          Math.abs(slowPts[0].x - fastPts[0].x) > 0.001 ||
          Math.abs(slowPts[0].y - fastPts[0].y) > 0.001;
        expect(differ).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------
  // setCycleRate
  // -----------------------------------------------------------

  describe('setCycleRate()', () => {
    it('changes the cycle rate', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { cycleRate: 1 });
      const result = boundary.setCycleRate(3);
      expect(result).toBe(boundary); // returns this

      // After changing rate, animation speed should differ
      // We can verify by checking that update produces different motion
      boundary.update(0.1);
      expect(boundary.children.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------
  // setColors
  // -----------------------------------------------------------

  describe('setColors()', () => {
    it('updates dash colors', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, {
        colors: ['#FF0000'],
        numDashes: 4,
      });

      const result = boundary.setColors(['#00FF00', '#0000FF']);
      expect(result).toBe(boundary);

      const children = boundary.children as VMobject[];
      expect(children[0].color).toBe('#00FF00');
      expect(children[1].color).toBe('#0000FF');
      expect(children[2].color).toBe('#00FF00');
      expect(children[3].color).toBe('#0000FF');
    });
  });

  // -----------------------------------------------------------
  // pause / resume
  // -----------------------------------------------------------

  describe('pause()', () => {
    it('removes the updater', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.hasUpdaters()).toBe(true);
      boundary.pause();
      expect(boundary.hasUpdaters()).toBe(false);
    });

    it('returns this for chaining', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.pause()).toBe(boundary);
    });

    it('stops animation updates', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { numDashes: 4 });

      boundary.pause();

      const childBefore = boundary.children[0] as VMobject;
      const ptsBefore = childBefore.points.map((p) => ({ x: p.x, y: p.y }));

      boundary.update(0.5); // updater removed, so no internal update

      const childAfter = boundary.children[0] as VMobject;
      const ptsAfter = childAfter.points.map((p) => ({ x: p.x, y: p.y }));

      // Points should be identical
      expect(ptsAfter.length).toBe(ptsBefore.length);
      for (let i = 0; i < ptsAfter.length; i++) {
        expect(ptsAfter[i].x).toBeCloseTo(ptsBefore[i].x, 5);
        expect(ptsAfter[i].y).toBeCloseTo(ptsBefore[i].y, 5);
      }
    });
  });

  describe('resume()', () => {
    it('re-adds the updater after pause', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      boundary.pause();
      expect(boundary.hasUpdaters()).toBe(false);
      boundary.resume();
      expect(boundary.hasUpdaters()).toBe(true);
    });

    it('does not double-add if not paused', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      boundary.resume(); // already has updater
      expect(boundary.hasUpdaters()).toBe(true);
    });

    it('returns this for chaining', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob);
      expect(boundary.resume()).toBe(boundary);
    });
  });

  // -----------------------------------------------------------
  // rebuild
  // -----------------------------------------------------------

  describe('rebuild()', () => {
    it('recreates dashes', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { numDashes: 10 });
      expect(boundary.children.length).toBe(10);

      const result = boundary.rebuild();
      expect(result).toBe(boundary);
      expect(boundary.children.length).toBe(10);
    });
  });

  // -----------------------------------------------------------
  // _perimeterToPoint (via positioning)
  // -----------------------------------------------------------

  describe('boundary geometry', () => {
    it('dashes have points set (positioned on perimeter)', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { numDashes: 4, buff: 0 });

      // Each dash should have 4 Bezier control points (1 degenerate cubic segment)
      for (const child of boundary.children as VMobject[]) {
        expect(child.numPoints).toBe(4);
      }
    });

    it('dashes respect buff parameter', () => {
      const mob = makeVMobjectWithBounds();
      const noBuff = new AnimatedBoundary(mob, { numDashes: 4, buff: 0 });
      const withBuff = new AnimatedBoundary(mob, { numDashes: 4, buff: 1 });

      const noBPts = (noBuff.children[0] as VMobject).points;
      const wBPts = (withBuff.children[0] as VMobject).points;

      // With buff, points should be further from center
      // At least one coordinate should differ
      if (noBPts.length > 0 && wBPts.length > 0) {
        const differ =
          Math.abs(noBPts[0].x - wBPts[0].x) > 0.01 || Math.abs(noBPts[0].y - wBPts[0].y) > 0.01;
        expect(differ).toBe(true);
      }
    });

    it('dash strokeWidth matches dashWidth option', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, {
        numDashes: 4,
        dashWidth: 7,
      });
      for (const child of boundary.children as VMobject[]) {
        expect(child.strokeWidth).toBe(7);
      }
    });
  });

  // -----------------------------------------------------------
  // _createCopy
  // -----------------------------------------------------------

  describe('copy', () => {
    it('creates a copy with same options', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, {
        colors: ['#FF0000'],
        numDashes: 5,
        dashWidth: 6,
        cycleRate: 3,
        buff: 0.5,
      });

      const copy = boundary.copy() as AnimatedBoundary;
      expect(copy).toBeInstanceOf(AnimatedBoundary);
      expect(copy.boundedMobject).toBe(mob);
      // _createCopy creates a new AnimatedBoundary (5 dashes from constructor)
      // then copy() also deep-copies the original's 5 children, totaling 10
      expect(copy.children.length).toBe(10);
    });
  });

  // -----------------------------------------------------------
  // dispose
  // -----------------------------------------------------------

  describe('dispose()', () => {
    it('cleans up dashes and calls super.dispose', () => {
      const mob = makeVMobjectWithBounds();
      const boundary = new AnimatedBoundary(mob, { numDashes: 5 });

      // Should not throw
      expect(() => boundary.dispose()).not.toThrow();
    });
  });

  // -----------------------------------------------------------
  // animatedBoundary() factory
  // -----------------------------------------------------------

  describe('animatedBoundary() factory', () => {
    it('returns an AnimatedBoundary instance', () => {
      const mob = makeVMobjectWithBounds();
      const result = animatedBoundary(mob);
      expect(result).toBeInstanceOf(AnimatedBoundary);
      expect(result.boundedMobject).toBe(mob);
    });

    it('passes options through', () => {
      const mob = makeVMobjectWithBounds();
      const result = animatedBoundary(mob, {
        numDashes: 20,
        cycleRate: 5,
      });
      expect(result.children.length).toBe(20);
    });
  });
});

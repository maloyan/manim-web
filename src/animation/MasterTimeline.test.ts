import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Mobject } from '../core/Mobject';
import { Animation, AnimationOptions } from './Animation';
import { MasterTimeline, Segment } from './MasterTimeline';
import { linear } from '../rate-functions';

// =============================================================================
// Test helpers
// =============================================================================

/** Minimal concrete Mobject for testing. */
class TestMobject extends Mobject {
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Object3D();
  }
  protected _syncToThree(): void {}
}

/** Concrete Animation that tracks interpolation calls. */
class TestAnimation extends Animation {
  lastAlpha: number | null = null;
  interpolateCallCount = 0;
  resetCallCount = 0;

  constructor(mobject: Mobject, options?: AnimationOptions) {
    super(mobject, { rateFunc: linear, ...options });
  }

  interpolate(alpha: number): void {
    this.lastAlpha = alpha;
    this.interpolateCallCount++;
  }

  override reset(): void {
    this.resetCallCount++;
    super.reset();
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('MasterTimeline', () => {
  let tl: MasterTimeline;

  beforeEach(() => {
    tl = new MasterTimeline();
  });

  // ---------------------------------------------------------------------------
  // addSegment
  // ---------------------------------------------------------------------------
  describe('addSegment', () => {
    it('creates a segment with correct timing from a single animation', () => {
      const mob = new TestMobject();
      const anim = new TestAnimation(mob, { duration: 2 });
      const seg = tl.addSegment([anim]);

      expect(seg.index).toBe(0);
      expect(seg.startTime).toBe(0);
      expect(seg.endTime).toBe(2);
      expect(seg.animations).toEqual([anim]);
      expect(seg.isWait).toBe(false);
    });

    it('uses the max duration of parallel animations', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 1 });
      const anim2 = new TestAnimation(mob2, { duration: 3 });
      const seg = tl.addSegment([anim1, anim2]);

      expect(seg.endTime).toBe(3);
    });

    it('appends segments sequentially', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 2 });
      const anim2 = new TestAnimation(mob2, { duration: 1 });

      const seg1 = tl.addSegment([anim1]);
      const seg2 = tl.addSegment([anim2]);

      expect(seg1.index).toBe(0);
      expect(seg2.index).toBe(1);
      expect(seg2.startTime).toBe(2);
      expect(seg2.endTime).toBe(3);
    });

    it('tracks mobject first-segment for each unique mobject', () => {
      const mob = new TestMobject();
      const anim1 = new TestAnimation(mob, { duration: 1 });
      const anim2 = new TestAnimation(mob, { duration: 1 });

      tl.addSegment([anim1]); // segment 0 — first appearance
      tl.addSegment([anim2]); // segment 1 — same mobject, should not override

      // Verify by seeking before segment 0: mobject should be hidden
      tl.seek(0);
      // mobject opacity should NOT be 0 at time 0 since segment 0 starts at 0
      expect(mob.opacity).toBe(1);
    });

    it('registers animations on the underlying timeline', () => {
      const mob = new TestMobject();
      const anim = new TestAnimation(mob, { duration: 1 });
      tl.addSegment([anim]);

      expect(tl.getDuration()).toBe(1);
      expect(tl.length).toBe(1); // one scheduled animation on base Timeline
    });
  });

  // ---------------------------------------------------------------------------
  // addWaitSegment
  // ---------------------------------------------------------------------------
  describe('addWaitSegment', () => {
    it('creates a wait segment with empty animations', () => {
      const seg = tl.addWaitSegment(1.5);

      expect(seg.index).toBe(0);
      expect(seg.startTime).toBe(0);
      expect(seg.endTime).toBe(1.5);
      expect(seg.animations).toEqual([]);
      expect(seg.isWait).toBe(true);
    });

    it('advances timeline duration', () => {
      tl.addWaitSegment(2);
      expect(tl.getDuration()).toBe(2);
    });

    it('chains correctly after an animation segment', () => {
      const mob = new TestMobject();
      const anim = new TestAnimation(mob, { duration: 1 });
      tl.addSegment([anim]);
      const waitSeg = tl.addWaitSegment(0.5);

      expect(waitSeg.startTime).toBe(1);
      expect(waitSeg.endTime).toBe(1.5);
      expect(tl.getDuration()).toBe(1.5);
    });
  });

  // ---------------------------------------------------------------------------
  // getSegments / segmentCount
  // ---------------------------------------------------------------------------
  describe('getSegments / segmentCount', () => {
    it('returns empty array when no segments', () => {
      expect(tl.getSegments()).toEqual([]);
      expect(tl.segmentCount).toBe(0);
    });

    it('returns all segments in order', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addWaitSegment(0.5);
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      const segs = tl.getSegments();
      expect(segs.length).toBe(3);
      expect(tl.segmentCount).toBe(3);
      expect(segs[0].isWait).toBe(false);
      expect(segs[1].isWait).toBe(true);
      expect(segs[2].isWait).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getSegmentAtTime
  // ---------------------------------------------------------------------------
  describe('getSegmentAtTime', () => {
    it('returns null when no segments exist', () => {
      expect(tl.getSegmentAtTime(0)).toBeNull();
    });

    it('returns the first segment for time 0', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addWaitSegment(1);

      const seg = tl.getSegmentAtTime(0);
      expect(seg).not.toBeNull();
      expect(seg!.index).toBe(0);
    });

    it('returns the correct segment for mid-timeline time', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]); // 0-1
      tl.addWaitSegment(1); // 1-2
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]); // 2-3

      expect(tl.getSegmentAtTime(0.5)!.index).toBe(0);
      expect(tl.getSegmentAtTime(1.0)!.index).toBe(1);
      expect(tl.getSegmentAtTime(1.5)!.index).toBe(1);
      expect(tl.getSegmentAtTime(2.0)!.index).toBe(2);
      expect(tl.getSegmentAtTime(2.5)!.index).toBe(2);
    });

    it('returns the last segment for time past duration', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      const seg = tl.getSegmentAtTime(10);
      expect(seg!.index).toBe(0);
    });

    it('returns the first segment when time is before all segments', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      // time 0 is exactly at segment start, so it returns segment 0
      const seg = tl.getSegmentAtTime(0);
      expect(seg!.index).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentSegment
  // ---------------------------------------------------------------------------
  describe('getCurrentSegment', () => {
    it('returns the segment matching the current playback time', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.seek(0.5);
      expect(tl.getCurrentSegment()!.index).toBe(0);

      tl.seek(1.5);
      expect(tl.getCurrentSegment()!.index).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // play / pause / update
  // ---------------------------------------------------------------------------
  describe('play / pause / update', () => {
    it('does not advance time when paused', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.update(0.5);
      expect(tl.getCurrentTime()).toBe(0);
    });

    it('advances time when playing', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.play();
      tl.update(0.5);
      expect(tl.getCurrentTime()).toBeCloseTo(0.5);
    });

    it('clamps time at duration and stops playing', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.play();
      tl.update(5);
      expect(tl.getCurrentTime()).toBe(1);
      expect(tl.isPlaying()).toBe(false);
      expect(tl.isFinished()).toBe(true);
    });

    it('can be paused and resumed', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.play();
      tl.update(0.5);
      tl.pause();
      tl.update(0.5);
      expect(tl.getCurrentTime()).toBeCloseTo(0.5); // didn't advance while paused

      tl.play();
      tl.update(0.3);
      expect(tl.getCurrentTime()).toBeCloseTo(0.8);
    });
  });

  // ---------------------------------------------------------------------------
  // seek (MasterTimeline override)
  // ---------------------------------------------------------------------------
  describe('seek', () => {
    it('updates currentTime', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.seek(1);
      expect(tl.getCurrentTime()).toBe(1);
    });

    it('resets all segment animations before re-applying', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 1 });
      const anim2 = new TestAnimation(mob2, { duration: 1 });

      tl.addSegment([anim1]);
      tl.addSegment([anim2]);

      // Play forward to ensure animations have begun
      tl.play();
      tl.update(2);

      // Reset counts so we can track the seek resets
      anim1.resetCallCount = 0;
      anim2.resetCallCount = 0;

      tl.seek(0.5);

      // Both animations should have been reset
      expect(anim1.resetCallCount).toBeGreaterThanOrEqual(1);
      expect(anim2.resetCallCount).toBeGreaterThanOrEqual(1);
    });

    it('clears _startedAnimations so updates re-begin animations', () => {
      const mob = new TestMobject();
      const anim = new TestAnimation(mob, { duration: 1 });
      tl.addSegment([anim]);

      // Play to the end
      tl.play();
      tl.update(1);
      expect(anim.isFinished()).toBe(true);

      // Seek back to start — animation should be "unfinished" and re-playable
      tl.seek(0);
      tl.play();
      tl.update(0.5);
      expect(anim.isFinished()).toBe(false);
    });

    it('hides mobjects whose introducing segment has not started yet', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 1 });
      const anim2 = new TestAnimation(mob2, { duration: 1 });

      tl.addSegment([anim1]); // segment 0: 0-1
      tl.addSegment([anim2]); // segment 1: 1-2

      // Seek to before segment 1 starts
      tl.seek(0.5);
      // mob2 should be hidden (opacity 0) since its segment hasn't started
      expect(mob2.opacity).toBe(0);
      // mob1 should still be visible
      expect(mob1.opacity).toBeGreaterThan(0);
    });

    it('does not hide mobjects whose segment has started', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 1 });
      const anim2 = new TestAnimation(mob2, { duration: 1 });

      tl.addSegment([anim1]); // segment 0: 0-1
      tl.addSegment([anim2]); // segment 1: 1-2

      // Seek to after segment 1 starts
      tl.seek(1.5);
      // mob2 should be visible since we're past its start time
      expect(mob2.opacity).toBeGreaterThan(0);
    });

    it('seek returns this for chaining', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      const result = tl.seek(0.5);
      expect(result).toBe(tl);
    });
  });

  // ---------------------------------------------------------------------------
  // reset (MasterTimeline override)
  // ---------------------------------------------------------------------------
  describe('reset', () => {
    it('seeks to time 0 and pauses', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.play();
      tl.update(0.5);
      expect(tl.isPlaying()).toBe(true);

      tl.reset();
      expect(tl.getCurrentTime()).toBe(0);
      expect(tl.isPlaying()).toBe(false);
    });

    it('returns this for chaining', () => {
      const result = tl.reset();
      expect(result).toBe(tl);
    });

    it('hides mobjects in future segments after reset', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 1 });
      const anim2 = new TestAnimation(mob2, { duration: 1 });

      tl.addSegment([anim1]); // 0-1
      tl.addSegment([anim2]); // 1-2

      // Play everything through
      tl.play();
      tl.update(2);

      // Reset should hide mob2 (future) while mob1 at segment start
      tl.reset();
      expect(mob2.opacity).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // nextSegment
  // ---------------------------------------------------------------------------
  describe('nextSegment', () => {
    it('returns null when no segments exist', () => {
      expect(tl.nextSegment()).toBeNull();
    });

    it('seeks to the next segment and returns it', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.seek(0);
      const next = tl.nextSegment();
      expect(next).not.toBeNull();
      expect(next!.index).toBe(1);
      expect(tl.getCurrentTime()).toBe(1);
    });

    it('returns null when already at the last segment', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.seek(1.5); // In segment 1 (the last one)
      const next = tl.nextSegment();
      expect(next).toBeNull();
    });

    it('advances through all segments sequentially', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.seek(0);
      expect(tl.nextSegment()!.index).toBe(1);
      expect(tl.nextSegment()!.index).toBe(2);
      expect(tl.nextSegment()).toBeNull(); // no more segments
    });
  });

  // ---------------------------------------------------------------------------
  // prevSegment
  // ---------------------------------------------------------------------------
  describe('prevSegment', () => {
    it('returns null when no segments exist', () => {
      expect(tl.prevSegment()).toBeNull();
    });

    it('seeks to current segment start when more than 0.5s in', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.seek(2.8); // 0.8s into segment 1
      const prev = tl.prevSegment();
      expect(prev).not.toBeNull();
      expect(prev!.index).toBe(1); // returns current segment
      expect(tl.getCurrentTime()).toBe(2); // seeked to segment 1 start
    });

    it('seeks to previous segment when less than 0.5s into current', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.seek(2.3); // 0.3s into segment 1
      const prev = tl.prevSegment();
      expect(prev).not.toBeNull();
      expect(prev!.index).toBe(0); // returns previous segment
      expect(tl.getCurrentTime()).toBe(0); // seeked to segment 0 start
    });

    it('seeks to time 0 when at the first segment with less than 0.5s elapsed', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      tl.seek(0.3); // 0.3s into first segment
      const prev = tl.prevSegment();
      expect(prev).not.toBeNull();
      expect(prev!.index).toBe(0); // returns current (first) segment
      expect(tl.getCurrentTime()).toBe(0); // seeked to beginning
    });

    it('seeks to current segment start at exactly 0.5s boundary', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      // At exactly 0.5s into segment 1 => elapsed <= 0.5, goes to previous
      tl.seek(2.5);
      const prev = tl.prevSegment();
      expect(prev).not.toBeNull();
      expect(prev!.index).toBe(0);
    });

    it('navigates back through multiple segments', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.seek(2.1); // in segment 2, 0.1s in
      expect(tl.prevSegment()!.index).toBe(1); // < 0.5s: go to prev
      // Now at start of segment 1 (time=1), 0s elapsed
      expect(tl.prevSegment()!.index).toBe(0); // 0s elapsed: go to prev
      // Now at start of segment 0 (time=0), 0s elapsed
      expect(tl.prevSegment()!.index).toBe(0); // at first, seeks to 0
      expect(tl.getCurrentTime()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentTime / getDuration / isFinished
  // ---------------------------------------------------------------------------
  describe('getCurrentTime / getDuration / isFinished', () => {
    it('returns 0 duration for empty timeline', () => {
      expect(tl.getDuration()).toBe(0);
      expect(tl.getCurrentTime()).toBe(0);
    });

    it('returns correct duration after adding segments', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addWaitSegment(0.5);
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      expect(tl.getDuration()).toBe(3.5); // 1 + 0.5 + 2
    });

    it('isFinished returns false initially', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      expect(tl.isFinished()).toBe(false);
    });

    it('isFinished returns true after playing to the end', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.play();
      tl.update(2);
      expect(tl.isFinished()).toBe(true);
    });

    it('isFinished returns true for empty timeline', () => {
      // duration is 0, currentTime is 0, so 0 >= 0 => true
      expect(tl.isFinished()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Segment boundary tracking across operations
  // ---------------------------------------------------------------------------
  describe('segment boundary tracking', () => {
    it('maintains consistent indices across mixed segment types', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]); // 0
      tl.addWaitSegment(0.5); // 1
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]); // 2
      tl.addWaitSegment(1); // 3

      const segs = tl.getSegments();
      expect(segs[0].index).toBe(0);
      expect(segs[1].index).toBe(1);
      expect(segs[2].index).toBe(2);
      expect(segs[3].index).toBe(3);
    });

    it('segment times form a contiguous chain', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addWaitSegment(0.5);
      tl.addSegment([new TestAnimation(mob, { duration: 2 })]);

      const segs = tl.getSegments();
      for (let i = 1; i < segs.length; i++) {
        expect(segs[i].startTime).toBe(segs[i - 1].endTime);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // _mobjectFirstSegment visibility logic
  // ---------------------------------------------------------------------------
  describe('mobject first-segment visibility logic', () => {
    it('hides a mobject introduced in segment 2 when seeking to segment 0', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const mob3 = new TestMobject();

      tl.addSegment([new TestAnimation(mob1, { duration: 1 })]); // seg 0: 0-1
      tl.addSegment([new TestAnimation(mob2, { duration: 1 })]); // seg 1: 1-2
      tl.addSegment([new TestAnimation(mob3, { duration: 1 })]); // seg 2: 2-3

      tl.seek(0.5);
      expect(mob2.opacity).toBe(0);
      expect(mob3.opacity).toBe(0);
    });

    it('shows all mobjects when seeking past all segments', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();

      tl.addSegment([new TestAnimation(mob1, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob2, { duration: 1 })]);

      tl.seek(2); // past everything
      // mob2's segment starts at 1, and time >= 1 so it should not be hidden
      expect(mob2.opacity).toBeGreaterThan(0);
    });

    it('does not re-register a mobject that appears in multiple segments', () => {
      const mob = new TestMobject();

      tl.addSegment([new TestAnimation(mob, { duration: 1 })]); // seg 0
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]); // seg 1

      // Seeking before seg 0 — mob should be hidden based on seg 0 start time (0)
      // Since seg 0 starts at 0, and seeking to 0 means time >= seg.startTime,
      // the mob should NOT be hidden
      tl.seek(0);
      expect(mob.opacity).toBeGreaterThan(0);
    });

    it('handles multiple mobjects in the same segment', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();

      // Both mobjects first appear in segment 0
      tl.addSegment([
        new TestAnimation(mob1, { duration: 1 }),
        new TestAnimation(mob2, { duration: 1 }),
      ]);
      tl.addSegment([new TestAnimation(new TestMobject(), { duration: 1 })]);

      // At time 0, segment 0 has started, so both should be visible
      tl.seek(0);
      expect(mob1.opacity).toBeGreaterThan(0);
      expect(mob2.opacity).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // WaitAnimation (implicitly tested through addWaitSegment)
  // ---------------------------------------------------------------------------
  describe('WaitAnimation behavior', () => {
    it('advances timeline time without affecting any mobject', () => {
      const mob = new TestMobject();
      mob.opacity = 1;

      tl.addWaitSegment(2);
      tl.play();
      tl.update(1);

      // The dummy mobject of the WaitAnimation should not interfere
      expect(tl.getCurrentTime()).toBe(1);
    });

    it('WaitAnimation finishes after its duration', () => {
      tl.addWaitSegment(1);
      tl.play();
      tl.update(1.5);

      expect(tl.isFinished()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Integration: full playback and seek workflow
  // ---------------------------------------------------------------------------
  describe('integration: full workflow', () => {
    it('plays through segments, seeks back, and plays again', () => {
      const mob1 = new TestMobject();
      const mob2 = new TestMobject();
      const anim1 = new TestAnimation(mob1, { duration: 1 });
      const anim2 = new TestAnimation(mob2, { duration: 1 });

      tl.addSegment([anim1]); // 0-1
      tl.addWaitSegment(0.5); // 1-1.5
      tl.addSegment([anim2]); // 1.5-2.5

      // Play through first segment
      tl.play();
      tl.update(0.5);
      expect(anim1.interpolateCallCount).toBeGreaterThan(0);

      // Continue into wait
      tl.update(0.7);
      expect(tl.getCurrentTime()).toBeCloseTo(1.2);

      // Seek back to start
      tl.seek(0);
      expect(tl.getCurrentTime()).toBe(0);
      expect(mob2.opacity).toBe(0); // not yet introduced

      // Play forward again
      tl.play();
      tl.update(2);
      expect(tl.getCurrentTime()).toBeCloseTo(2);
    });

    it('nextSegment and prevSegment navigate correctly', () => {
      const mob = new TestMobject();
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);
      tl.addSegment([new TestAnimation(mob, { duration: 1 })]);

      tl.seek(0);

      // Navigate forward
      expect(tl.nextSegment()!.index).toBe(1);
      expect(tl.getCurrentTime()).toBe(1);

      expect(tl.nextSegment()!.index).toBe(2);
      expect(tl.getCurrentTime()).toBe(2);

      // At last segment, can't go further
      expect(tl.nextSegment()).toBeNull();

      // Navigate backward (we're at time 2, 0s into segment 2)
      const prev = tl.prevSegment();
      expect(prev!.index).toBe(1);
      expect(tl.getCurrentTime()).toBe(1);
    });
  });
});

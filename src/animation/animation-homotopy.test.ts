import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { linear } from '../rate-functions';
import { WiggleOutThenIn, wiggleOutThenIn } from './indication/WiggleOutThenIn';
import {
  ShowCreationThenDestruction,
  showCreationThenDestruction,
} from './indication/ShowCreationThenDestruction';
import { ShowPassingFlash, showPassingFlash } from './indication/ShowPassingFlash';
import {
  ShowPassingFlashWithThinningStrokeWidth,
  showPassingFlashWithThinningStrokeWidth,
} from './indication/ShowPassingFlashWithThinningStrokeWidth';
import {
  TransformMatchingShapes,
  transformMatchingShapes,
  TransformMatchingTex,
  transformMatchingTex,
} from './transform/TransformMatching';
import { ApplyPointwiseFunction, applyPointwiseFunction } from './transform/ApplyPointwiseFunction';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMobject(): Mobject {
  return new Mobject();
}

function makeVMobject(pts?: number[][]): VMobject {
  const vm = new VMobject();
  if (pts) vm.setPoints(pts);
  return vm;
}

// simple triangle-ish shape
function trianglePoints(): number[][] {
  return [
    [0, 0, 0],
    [0.33, 0.33, 0],
    [0.66, 0.66, 0],
    [1, 1, 0],
    [1, 1, 0],
    [0.83, 0.66, 0],
    [0.66, 0.33, 0],
    [0.5, 0, 0],
  ];
}

// ============================================================================
// WiggleOutThenIn
// ============================================================================

describe('WiggleOutThenIn', () => {
  describe('constructor defaults', () => {
    it('scaleValue=1.1, nWiggles=6, duration=2, rateFunc=linear', () => {
      const anim = new WiggleOutThenIn(makeMobject());
      expect(anim.scaleValue).toBe(1.1);
      expect(anim.nWiggles).toBe(6);
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(linear);
      expect(anim.rotationAxis).toEqual([0, 0, 1]);
    });

    it('rotationAngle defaults to 0.01 * TAU', () => {
      const anim = new WiggleOutThenIn(makeMobject());
      expect(anim.rotationAngle).toBeCloseTo(0.01 * 2 * Math.PI, 5);
    });
  });

  describe('custom options', () => {
    it('accepts custom scaleValue, nWiggles, rotationAngle', () => {
      const anim = new WiggleOutThenIn(makeMobject(), {
        scaleValue: 2.0,
        nWiggles: 3,
        rotationAngle: 0.5,
        rotationAxis: [1, 0, 0],
      });
      expect(anim.scaleValue).toBe(2.0);
      expect(anim.nWiggles).toBe(3);
      expect(anim.rotationAngle).toBe(0.5);
      expect(anim.rotationAxis).toEqual([1, 0, 0]);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 scale is original (thereAndBackSmooth(0) = 0)', () => {
      const m = makeVMobject(trianglePoints());
      const origScale = m.scaleVector.clone();
      const anim = new WiggleOutThenIn(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 3);
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 3);
    });

    it('at alpha=0.5 scale peaks at scaleValue factor', () => {
      const m = makeVMobject(trianglePoints());
      const anim = new WiggleOutThenIn(m, { scaleValue: 1.5 });
      anim.begin();
      anim.interpolate(0.5);
      // thereAndBackSmooth(0.5) = smoothstep(1) = 1, so scaleFactor = 1.5
      expect(m.scaleVector.x).toBeCloseTo(1.5, 2);
    });

    it('at alpha=1 scale returns to original', () => {
      const m = makeVMobject(trianglePoints());
      const origScale = m.scaleVector.clone();
      const anim = new WiggleOutThenIn(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 3);
      expect(m.scaleVector.y).toBeCloseTo(origScale.y, 3);
    });
  });

  describe('finish()', () => {
    it('restores original scale, rotation, and position', () => {
      const m = makeVMobject(trianglePoints());
      m.position.set(1, 2, 0);
      const origPos = m.position.clone();
      const origScale = m.scaleVector.clone();
      const origRot = m.rotation.clone();
      const anim = new WiggleOutThenIn(m);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(origScale.x, 5);
      expect(m.position.x).toBeCloseTo(origPos.x, 5);
      expect(m.position.y).toBeCloseTo(origPos.y, 5);
      expect(m.rotation.x).toBeCloseTo(origRot.x, 3);
      expect(m.rotation.y).toBeCloseTo(origRot.y, 3);
      expect(m.rotation.z).toBeCloseTo(origRot.z, 3);
    });
  });

  describe('wiggleOutThenIn() factory', () => {
    it('returns WiggleOutThenIn instance', () => {
      const anim = wiggleOutThenIn(makeMobject(), { nWiggles: 4 });
      expect(anim).toBeInstanceOf(WiggleOutThenIn);
      expect(anim.nWiggles).toBe(4);
    });
  });
});

// ============================================================================
// ShowCreationThenDestruction (constructor + factory only; begin/interpolate need Line2)
// ============================================================================

describe('ShowCreationThenDestruction', () => {
  describe('constructor defaults', () => {
    it('duration=2, rateFunc=linear', () => {
      const m = makeMobject();
      const anim = new ShowCreationThenDestruction(m);
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('custom options', () => {
    it('accepts custom duration', () => {
      const anim = new ShowCreationThenDestruction(makeMobject(), { duration: 5 });
      expect(anim.duration).toBe(5);
    });
  });

  describe('with non-VMobject (opacity fallback)', () => {
    it('begin sets opacity to 0, finish sets opacity to 0', () => {
      const m = makeMobject();
      const anim = new ShowCreationThenDestruction(m);
      anim.begin();
      // Non-VMobject fallback: start invisible
      expect(m.opacity).toBe(0);
      anim.finish();
      // End invisible (fully erased)
      expect(m.opacity).toBe(0);
    });

    it('interpolate at alpha=0.25 sets opacity to 0.5 (first half ramp)', () => {
      const m = makeMobject();
      const anim = new ShowCreationThenDestruction(m);
      anim.begin();
      // effectiveAlpha = 2 * 0.25 = 0.5
      anim.interpolate(0.25);
      expect(m.opacity).toBeCloseTo(0.5, 2);
    });

    it('interpolate at alpha=0.5 sets opacity to 1 (peak)', () => {
      const m = makeMobject();
      const anim = new ShowCreationThenDestruction(m);
      anim.begin();
      anim.interpolate(0.5);
      expect(m.opacity).toBeCloseTo(1, 2);
    });

    it('interpolate at alpha=0.75 sets opacity to 0.5 (second half decline)', () => {
      const m = makeMobject();
      const anim = new ShowCreationThenDestruction(m);
      anim.begin();
      // effectiveAlpha = 2 * (1 - 0.75) = 0.5
      anim.interpolate(0.75);
      expect(m.opacity).toBeCloseTo(0.5, 2);
    });
  });

  describe('showCreationThenDestruction() factory', () => {
    it('returns ShowCreationThenDestruction instance', () => {
      const anim = showCreationThenDestruction(makeMobject());
      expect(anim).toBeInstanceOf(ShowCreationThenDestruction);
    });
  });
});

// ============================================================================
// ShowPassingFlash (constructor + factory; interpolate needs Line2/window)
// ============================================================================

describe('ShowPassingFlash', () => {
  describe('constructor defaults', () => {
    it('duration=1, rateFunc=linear, timeWidth=0.2', () => {
      const m = makeMobject();
      const anim = new ShowPassingFlash(m);
      expect(anim.duration).toBe(1);
      expect(anim.rateFunc).toBe(linear);
      expect(anim.timeWidth).toBe(0.2);
    });

    it('flashStrokeWidth defaults to DEFAULT_STROKE_WIDTH * 1.5', () => {
      const anim = new ShowPassingFlash(makeMobject());
      // DEFAULT_STROKE_WIDTH is 4 in constants
      expect(anim.flashStrokeWidth).toBeCloseTo(6, 1);
    });
  });

  describe('custom options', () => {
    it('accepts custom color, timeWidth, strokeWidth', () => {
      const anim = new ShowPassingFlash(makeMobject(), {
        color: '#ff0000',
        timeWidth: 0.5,
        strokeWidth: 10,
        duration: 3,
      });
      expect(anim.flashColor).toBe('#ff0000');
      expect(anim.timeWidth).toBe(0.5);
      expect(anim.flashStrokeWidth).toBe(10);
      expect(anim.duration).toBe(3);
    });
  });

  describe('showPassingFlash() factory', () => {
    it('returns ShowPassingFlash instance', () => {
      const anim = showPassingFlash(makeMobject());
      expect(anim).toBeInstanceOf(ShowPassingFlash);
    });
  });
});

// ============================================================================
// ShowPassingFlashWithThinningStrokeWidth (constructor + factory)
// ============================================================================

describe('ShowPassingFlashWithThinningStrokeWidth', () => {
  describe('constructor defaults', () => {
    it('minStrokeWidthRatio defaults to 0.1', () => {
      const anim = new ShowPassingFlashWithThinningStrokeWidth(makeMobject());
      expect(anim.minStrokeWidthRatio).toBe(0.1);
    });

    it('inherits ShowPassingFlash defaults', () => {
      const anim = new ShowPassingFlashWithThinningStrokeWidth(makeMobject());
      expect(anim.timeWidth).toBe(0.2);
      expect(anim.duration).toBe(1);
    });
  });

  describe('custom options', () => {
    it('accepts custom minStrokeWidthRatio', () => {
      const anim = new ShowPassingFlashWithThinningStrokeWidth(makeMobject(), {
        minStrokeWidthRatio: 0.5,
      });
      expect(anim.minStrokeWidthRatio).toBe(0.5);
    });
  });

  describe('showPassingFlashWithThinningStrokeWidth() factory', () => {
    it('returns correct instance', () => {
      const anim = showPassingFlashWithThinningStrokeWidth(makeMobject());
      expect(anim).toBeInstanceOf(ShowPassingFlashWithThinningStrokeWidth);
      expect(anim).toBeInstanceOf(ShowPassingFlash);
    });
  });
});

// ============================================================================
// TransformMatchingShapes (constructor + factory + basic properties)
// ============================================================================

describe('TransformMatchingShapes', () => {
  describe('constructor defaults', () => {
    it('matchThreshold=0.5, fadeRatio=0.25, keyFunc=undefined', () => {
      const src = makeVMobject(trianglePoints());
      const tgt = makeVMobject(trianglePoints());
      const anim = new TransformMatchingShapes(src, tgt);
      expect(anim.matchThreshold).toBe(0.5);
      expect(anim.fadeRatio).toBe(0.25);
      expect(anim.keyFunc).toBeUndefined();
      expect(anim.target).toBe(tgt);
      expect(anim.mobject).toBe(src);
    });
  });

  describe('custom options', () => {
    it('accepts matchThreshold and keyFunc', () => {
      const keyFn = (_vm: VMobject) => 'key';
      const anim = new TransformMatchingShapes(
        makeVMobject(trianglePoints()),
        makeVMobject(trianglePoints()),
        { matchThreshold: 0.8, keyFunc: keyFn, fadeRatio: 0.4 },
      );
      expect(anim.matchThreshold).toBe(0.8);
      expect(anim.keyFunc).toBe(keyFn);
      expect(anim.fadeRatio).toBe(0.4);
    });

    it('clamps fadeRatio to [0, 0.5]', () => {
      const anim = new TransformMatchingShapes(
        makeVMobject(trianglePoints()),
        makeVMobject(trianglePoints()),
        { fadeRatio: 0.9 },
      );
      expect(anim.fadeRatio).toBe(0.5);

      const anim2 = new TransformMatchingShapes(
        makeVMobject(trianglePoints()),
        makeVMobject(trianglePoints()),
        { fadeRatio: -1 },
      );
      expect(anim2.fadeRatio).toBe(0);
    });
  });

  describe('transformMatchingShapes() factory', () => {
    it('returns TransformMatchingShapes instance', () => {
      const src = makeVMobject(trianglePoints());
      const tgt = makeVMobject(trianglePoints());
      const anim = transformMatchingShapes(src, tgt);
      expect(anim).toBeInstanceOf(TransformMatchingShapes);
      expect(anim.target).toBe(tgt);
    });
  });
});

// ============================================================================
// TransformMatchingTex (constructor + factory + basic properties)
// ============================================================================

describe('TransformMatchingTex', () => {
  describe('constructor defaults', () => {
    it('fadeRatio=0.25, transformMismatches=false', () => {
      const src = makeVMobject(trianglePoints());
      const tgt = makeVMobject(trianglePoints());
      const anim = new TransformMatchingTex(src, tgt);
      expect(anim.fadeRatio).toBe(0.25);
      expect(anim.transformMismatches).toBe(false);
      expect(anim.target).toBe(tgt);
      expect(anim.keyFunc).toBeTypeOf('function');
    });
  });

  describe('custom options', () => {
    it('accepts custom keyFunc and transformMismatches', () => {
      const keyFn = (_vm: VMobject) => 'custom';
      const anim = new TransformMatchingTex(
        makeVMobject(trianglePoints()),
        makeVMobject(trianglePoints()),
        { keyFunc: keyFn, transformMismatches: true, fadeRatio: 0.1 },
      );
      expect(anim.keyFunc).toBe(keyFn);
      expect(anim.transformMismatches).toBe(true);
      expect(anim.fadeRatio).toBeCloseTo(0.1, 5);
    });
  });

  describe('transformMatchingTex() factory', () => {
    it('returns TransformMatchingTex instance', () => {
      const src = makeVMobject(trianglePoints());
      const tgt = makeVMobject(trianglePoints());
      const anim = transformMatchingTex(src, tgt);
      expect(anim).toBeInstanceOf(TransformMatchingTex);
    });
  });
});

// ============================================================================
// ApplyPointwiseFunction
// ============================================================================

describe('ApplyPointwiseFunction', () => {
  describe('constructor', () => {
    it('stores the function', () => {
      const fn = (p: number[]) => [p[0] * 2, p[1] * 2, p[2]];
      const m = makeVMobject(trianglePoints());
      const anim = new ApplyPointwiseFunction(m, fn);
      expect(anim.func).toBe(fn);
      expect(anim.mobject).toBe(m);
    });

    it('defaults to duration=1', () => {
      const fn = (p: number[]) => p;
      const anim = new ApplyPointwiseFunction(makeVMobject(trianglePoints()), fn);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const fn = (p: number[]) => p;
      const anim = new ApplyPointwiseFunction(makeVMobject(trianglePoints()), fn, { duration: 4 });
      expect(anim.duration).toBe(4);
    });
  });

  describe('begin()', () => {
    it('captures snapshots for VMobject descendants', () => {
      const vm = makeVMobject(trianglePoints());
      const fn = (p: number[]) => [p[0] + 1, p[1], p[2]];
      const anim = new ApplyPointwiseFunction(vm, fn);
      anim.begin();
      // After begin, the snapshots are created internally.
      // We verify by interpolating that points change.
      const pointsBefore = vm.getPoints();
      anim.interpolate(0);
      const pointsAt0 = vm.getPoints();
      // At alpha=0 points should be the same as start
      for (let i = 0; i < pointsBefore.length; i++) {
        expect(pointsAt0[i][0]).toBeCloseTo(pointsBefore[i][0], 3);
        expect(pointsAt0[i][1]).toBeCloseTo(pointsBefore[i][1], 3);
      }
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0.5 points are halfway between start and target', () => {
      // Simple translation: move all x by +2
      const fn = (p: number[]) => [p[0] + 2, p[1], p[2]];
      const vm = makeVMobject([
        [0, 0, 0],
        [0.33, 0.33, 0],
        [0.66, 0.66, 0],
        [1, 1, 0],
      ]);
      const origPts = vm.getPoints();
      const anim = new ApplyPointwiseFunction(vm, fn);
      anim.begin();
      anim.interpolate(0.5);
      const pts = vm.getPoints();
      // Each x should be start_x + 0.5 * 2 = start_x + 1
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] + 1, 2);
        expect(pts[i][1]).toBeCloseTo(origPts[i][1], 2);
      }
    });

    it('at alpha=1 points match the function output', () => {
      const fn = (p: number[]) => [p[0] * 3, p[1] * 3, p[2]];
      const vm = makeVMobject([
        [1, 1, 0],
        [1.33, 1, 0],
        [1.66, 1, 0],
        [2, 1, 0],
      ]);
      const origPts = vm.getPoints();
      const anim = new ApplyPointwiseFunction(vm, fn);
      anim.begin();
      anim.interpolate(1);
      const pts = vm.getPoints();
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] * 3, 2);
        expect(pts[i][1]).toBeCloseTo(origPts[i][1] * 3, 2);
      }
    });
  });

  describe('finish()', () => {
    it('sets points to final target values', () => {
      const fn = (p: number[]) => [p[0] + 5, p[1] - 3, p[2]];
      const vm = makeVMobject([
        [0, 0, 0],
        [1, 1, 0],
        [2, 2, 0],
        [3, 3, 0],
      ]);
      const origPts = vm.getPoints();
      const anim = new ApplyPointwiseFunction(vm, fn);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      const pts = vm.getPoints();
      for (let i = 0; i < origPts.length; i++) {
        expect(pts[i][0]).toBeCloseTo(origPts[i][0] + 5, 2);
        expect(pts[i][1]).toBeCloseTo(origPts[i][1] - 3, 2);
      }
    });
  });
});

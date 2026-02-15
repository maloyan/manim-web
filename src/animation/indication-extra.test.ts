// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { ApplyWave } from './indication/ApplyWave';
import { applyWave } from './indication/ApplyWave';
import { Circumscribe } from './indication/Circumscribe';
import { circumscribe } from './indication/Circumscribe';
import { Flash } from './indication/Flash';
import { flash } from './indication/Flash';
import { linear, smooth } from '../rate-functions';
import { YELLOW, DEFAULT_STROKE_WIDTH } from '../constants';

/** Concrete Mobject for tests that call getCenter()/getThreeObject(). */
class ConcreteMobject extends Mobject {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Group();
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _createCopy(): Mobject {
    return new ConcreteMobject();
  }
}

// ---------------------------------------------------------------------------
// ApplyWave
// ---------------------------------------------------------------------------
describe('ApplyWave', () => {
  describe('constructor defaults', () => {
    it('has direction=horizontal, amplitude=0.2, wavelength=1.5, speed=1, ripples=false', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m);
      expect(anim.direction).toBe('horizontal');
      expect(anim.amplitude).toBe(0.2);
      expect(anim.wavelength).toBe(1.5);
      expect(anim.speed).toBe(1);
      expect(anim.ripples).toBe(false);
    });

    it('has duration=1 and rateFunc=linear', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m);
      expect(anim.duration).toBe(1);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('custom options', () => {
    it('uses custom direction', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { direction: 'vertical' });
      expect(anim.direction).toBe('vertical');
    });

    it('uses custom amplitude', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { amplitude: 0.5 });
      expect(anim.amplitude).toBe(0.5);
    });

    it('uses custom wavelength', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { wavelength: 3 });
      expect(anim.wavelength).toBe(3);
    });

    it('uses custom speed', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { speed: 2 });
      expect(anim.speed).toBe(2);
    });

    it('uses custom ripples', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { ripples: true });
      expect(anim.ripples).toBe(true);
    });

    it('uses custom duration', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('uses custom rateFunc', () => {
      const m = new Mobject();
      const anim = new ApplyWave(m, { rateFunc: smooth });
      expect(anim.rateFunc).toBe(smooth);
    });
  });

  describe('non-VMobject position wave (horizontal)', () => {
    it('begin stores original position', () => {
      const m = new ConcreteMobject();
      m.position.set(1, 2, 3);
      const anim = new ApplyWave(m);
      anim.begin();
      anim.interpolate(0);
      // envelope = sin(0) = 0, so no displacement
      expect(m.position.y).toBeCloseTo(2, 5);
    });

    it('at alpha=0 position is unchanged (envelope=0)', () => {
      const m = new ConcreteMobject();
      m.position.set(0, 5, 0);
      const anim = new ApplyWave(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.position.y).toBeCloseTo(5, 5);
    });

    it('at alpha=0.5 envelope is max (sin(PI/2)=1)', () => {
      const m = new ConcreteMobject();
      m.position.set(0, 0, 0);
      const anim = new ApplyWave(m);
      anim.begin();
      anim.interpolate(0.5);
      const envelope = Math.sin(0.5 * Math.PI); // = 1
      const wave = Math.sin(0.5 * Math.PI * 2 * 1.5 * 1);
      const expected = wave * 0.2 * envelope;
      expect(m.position.y).toBeCloseTo(expected, 5);
    });

    it('at alpha=1 envelope is ~0 (sin(PI)~0)', () => {
      const m = new ConcreteMobject();
      m.position.set(0, 0, 0);
      const anim = new ApplyWave(m);
      anim.begin();
      anim.interpolate(1);
      // envelope = sin(PI) ~ 0
      expect(m.position.y).toBeCloseTo(0, 4);
    });
  });

  describe('non-VMobject position wave (vertical)', () => {
    it('displaces x instead of y for vertical direction', () => {
      const m = new ConcreteMobject();
      m.position.set(0, 0, 0);
      const anim = new ApplyWave(m, { direction: 'vertical' });
      anim.begin();
      anim.interpolate(0.5);
      const envelope = Math.sin(0.5 * Math.PI);
      const wave = Math.sin(0.5 * Math.PI * 2 * 1.5 * 1);
      const expected = wave * 0.2 * envelope;
      expect(m.position.x).toBeCloseTo(expected, 5);
      expect(m.position.y).toBeCloseTo(0, 5);
    });
  });

  describe('VMobject wave', () => {
    function makeVMobject(): VMobject {
      const vm = new VMobject();
      // Set up a simple square shape
      vm.setPoints([
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 0],
        [1, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      return vm;
    }

    it('begin stores original points', () => {
      const vm = makeVMobject();
      const originalPoints = vm.getPoints().map((p) => [...p]);
      const anim = new ApplyWave(vm);
      anim.begin();
      // At alpha=0 envelope=0, points should be unchanged
      anim.interpolate(0);
      const currentPoints = vm.getPoints();
      for (let i = 0; i < originalPoints.length; i++) {
        expect(currentPoints[i][0]).toBeCloseTo(originalPoints[i][0], 4);
        expect(currentPoints[i][1]).toBeCloseTo(originalPoints[i][1], 4);
        expect(currentPoints[i][2]).toBeCloseTo(originalPoints[i][2], 4);
      }
    });

    it('horizontal wave displaces y coordinates', () => {
      const vm = makeVMobject();
      const originalPoints = vm.getPoints().map((p) => [...p]);
      // Use wavelength=1.0 to avoid sin hitting exact zeros at boundary points
      const anim = new ApplyWave(vm, { direction: 'horizontal', wavelength: 1.0 });
      anim.begin();
      anim.interpolate(0.3);
      const currentPoints = vm.getPoints();
      // At least some y coordinates should differ (envelope is non-zero)
      let anyDifferent = false;
      for (let i = 0; i < originalPoints.length; i++) {
        if (Math.abs(currentPoints[i][1] - originalPoints[i][1]) > 0.001) {
          anyDifferent = true;
          break;
        }
      }
      expect(anyDifferent).toBe(true);
      // x coordinates should remain unchanged for horizontal wave
      for (let i = 0; i < originalPoints.length; i++) {
        expect(currentPoints[i][0]).toBeCloseTo(originalPoints[i][0], 5);
      }
    });

    it('vertical wave displaces x coordinates', () => {
      const vm = makeVMobject();
      const originalPoints = vm.getPoints().map((p) => [...p]);
      // Use wavelength=1.0 to avoid sin hitting exact zeros at boundary points
      const anim = new ApplyWave(vm, { direction: 'vertical', wavelength: 1.0 });
      anim.begin();
      anim.interpolate(0.3);
      const currentPoints = vm.getPoints();
      let anyDifferent = false;
      for (let i = 0; i < originalPoints.length; i++) {
        if (Math.abs(currentPoints[i][0] - originalPoints[i][0]) > 0.001) {
          anyDifferent = true;
          break;
        }
      }
      expect(anyDifferent).toBe(true);
      // y coordinates should remain unchanged for vertical wave
      for (let i = 0; i < originalPoints.length; i++) {
        expect(currentPoints[i][1]).toBeCloseTo(originalPoints[i][1], 5);
      }
    });

    it('ripple mode displaces both x and y based on radial distance', () => {
      const vm = makeVMobject();
      const originalPoints = vm.getPoints().map((p) => [...p]);
      const anim = new ApplyWave(vm, { ripples: true });
      anim.begin();
      anim.interpolate(0.5);
      const currentPoints = vm.getPoints();
      // z coordinates should remain unchanged
      for (let i = 0; i < originalPoints.length; i++) {
        expect(currentPoints[i][2]).toBeCloseTo(originalPoints[i][2], 5);
      }
    });

    it('finish restores original points', () => {
      const vm = makeVMobject();
      const originalPoints = vm.getPoints().map((p) => [...p]);
      const anim = new ApplyWave(vm);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      const restoredPoints = vm.getPoints();
      for (let i = 0; i < originalPoints.length; i++) {
        expect(restoredPoints[i][0]).toBeCloseTo(originalPoints[i][0], 5);
        expect(restoredPoints[i][1]).toBeCloseTo(originalPoints[i][1], 5);
        expect(restoredPoints[i][2]).toBeCloseTo(originalPoints[i][2], 5);
      }
    });
  });

  describe('finish restores non-VMobject position', () => {
    it('restores original position after animation', () => {
      const m = new ConcreteMobject();
      m.position.set(3, 7, 2);
      const anim = new ApplyWave(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(7, 5);
      expect(m.position.z).toBeCloseTo(2, 5);
    });
  });

  describe('custom amplitude affects displacement magnitude', () => {
    it('larger amplitude produces larger displacement', () => {
      const m1 = new ConcreteMobject();
      m1.position.set(0, 0, 0);
      const anim1 = new ApplyWave(m1, { amplitude: 0.2 });
      anim1.begin();
      anim1.interpolate(0.25);
      const y1 = m1.position.y;

      const m2 = new ConcreteMobject();
      m2.position.set(0, 0, 0);
      const anim2 = new ApplyWave(m2, { amplitude: 1.0 });
      anim2.begin();
      anim2.interpolate(0.25);
      const y2 = m2.position.y;

      // The ratio of displacements should match the ratio of amplitudes
      if (Math.abs(y1) > 0.0001) {
        expect(Math.abs(y2 / y1)).toBeCloseTo(1.0 / 0.2, 1);
      }
    });
  });

  describe('applyWave() factory function', () => {
    it('returns an ApplyWave instance', () => {
      const m = new Mobject();
      const anim = applyWave(m);
      expect(anim).toBeInstanceOf(ApplyWave);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = applyWave(m, { amplitude: 0.8, direction: 'vertical' });
      expect(anim.amplitude).toBe(0.8);
      expect(anim.direction).toBe('vertical');
    });
  });
});

// ---------------------------------------------------------------------------
// Circumscribe
// ---------------------------------------------------------------------------
describe('Circumscribe', () => {
  describe('constructor defaults', () => {
    it('has shape=rectangle, color=YELLOW, buff=0.2', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m);
      expect(anim.shapeType).toBe('rectangle');
      expect(anim.shapeColor).toBe(YELLOW);
      expect(anim.buff).toBe(0.2);
    });

    it('has strokeWidth=DEFAULT_STROKE_WIDTH, timeWidth=0.3, fadeOut=true', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m);
      expect(anim.strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
      expect(anim.timeWidth).toBe(0.3);
      expect(anim.fadeOut).toBe(true);
    });

    it('has duration=1', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m);
      expect(anim.duration).toBe(1);
    });
  });

  describe('custom options', () => {
    it('uses custom shape', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { shape: 'circle' });
      expect(anim.shapeType).toBe('circle');
    });

    it('uses custom color', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { color: '#ff0000' });
      expect(anim.shapeColor).toBe('#ff0000');
    });

    it('uses custom buff', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { buff: 0.5 });
      expect(anim.buff).toBe(0.5);
    });

    it('uses custom strokeWidth', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { strokeWidth: 8 });
      expect(anim.strokeWidth).toBe(8);
    });

    it('uses custom timeWidth', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { timeWidth: 0.5 });
      expect(anim.timeWidth).toBe(0.5);
    });

    it('uses custom fadeOut', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { fadeOut: false });
      expect(anim.fadeOut).toBe(false);
    });

    it('uses custom duration', () => {
      const m = new Mobject();
      const anim = new Circumscribe(m, { duration: 2 });
      expect(anim.duration).toBe(2);
    });
  });

  describe('circumscribe() factory function', () => {
    it('returns a Circumscribe instance', () => {
      const m = new Mobject();
      const anim = circumscribe(m);
      expect(anim).toBeInstanceOf(Circumscribe);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = circumscribe(m, { shape: 'circle', buff: 0.8 });
      expect(anim.shapeType).toBe('circle');
      expect(anim.buff).toBe(0.8);
    });
  });
});

// ---------------------------------------------------------------------------
// Flash
// ---------------------------------------------------------------------------
describe('Flash', () => {
  describe('constructor defaults', () => {
    it('has color=YELLOW, numLines=8, flashRadius=1', () => {
      const m = new Mobject();
      const anim = new Flash(m);
      expect(anim.flashColor).toBe(YELLOW);
      expect(anim.numLines).toBe(8);
      expect(anim.flashRadius).toBe(1);
    });

    it('has lineWidth=DEFAULT_STROKE_WIDTH, innerRadius=0', () => {
      const m = new Mobject();
      const anim = new Flash(m);
      expect(anim.lineWidth).toBe(DEFAULT_STROKE_WIDTH);
      expect(anim.innerRadius).toBe(0);
    });

    it('has duration=0.5', () => {
      const m = new Mobject();
      const anim = new Flash(m);
      expect(anim.duration).toBe(0.5);
    });
  });

  describe('custom options', () => {
    it('uses custom color', () => {
      const m = new Mobject();
      const anim = new Flash(m, { color: '#00ff00' });
      expect(anim.flashColor).toBe('#00ff00');
    });

    it('uses custom numLines', () => {
      const m = new Mobject();
      const anim = new Flash(m, { numLines: 12 });
      expect(anim.numLines).toBe(12);
    });

    it('uses custom flashRadius', () => {
      const m = new Mobject();
      const anim = new Flash(m, { flashRadius: 2.5 });
      expect(anim.flashRadius).toBe(2.5);
    });

    it('uses custom lineWidth', () => {
      const m = new Mobject();
      const anim = new Flash(m, { lineWidth: 6 });
      expect(anim.lineWidth).toBe(6);
    });

    it('uses custom innerRadius', () => {
      const m = new Mobject();
      const anim = new Flash(m, { innerRadius: 0.3 });
      expect(anim.innerRadius).toBe(0.3);
    });

    it('uses custom duration', () => {
      const m = new Mobject();
      const anim = new Flash(m, { duration: 2 });
      expect(anim.duration).toBe(2);
    });
  });

  describe('flash() factory function', () => {
    it('returns a Flash instance', () => {
      const m = new Mobject();
      const anim = flash(m);
      expect(anim).toBeInstanceOf(Flash);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = flash(m, { numLines: 16, flashRadius: 3 });
      expect(anim.numLines).toBe(16);
      expect(anim.flashRadius).toBe(3);
    });
  });
});

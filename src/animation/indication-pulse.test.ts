import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { FocusOn, Pulse } from './indication/FocusOn';
import { focusOn, pulse } from './indication/FocusOn';
import { linear, smooth } from '../rate-functions';
import { GRAY, DEFAULT_STROKE_WIDTH } from '../constants';

// ---------------------------------------------------------------------------
// FocusOn
// ---------------------------------------------------------------------------
describe('FocusOn', () => {
  describe('constructor defaults', () => {
    it('has color=GRAY, startRadius=2, endRadius=0', () => {
      const m = new Mobject();
      const anim = new FocusOn(m);
      expect(anim.focusColor).toBe(GRAY);
      expect(anim.startRadius).toBe(2);
      expect(anim.endRadius).toBe(0);
    });

    it('has numRings=5, strokeWidth=DEFAULT_STROKE_WIDTH, opacity=0.5', () => {
      const m = new Mobject();
      const anim = new FocusOn(m);
      expect(anim.numRings).toBe(5);
      expect(anim.strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
      expect(anim.ringOpacity).toBe(0.5);
    });

    it('has duration=0.5 and rateFunc=smooth', () => {
      const m = new Mobject();
      const anim = new FocusOn(m);
      expect(anim.duration).toBe(0.5);
      expect(anim.rateFunc).toBe(smooth);
    });
  });

  describe('custom options', () => {
    it('uses custom color', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { color: '#ff0000' });
      expect(anim.focusColor).toBe('#ff0000');
    });

    it('uses custom startRadius', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { startRadius: 5 });
      expect(anim.startRadius).toBe(5);
    });

    it('uses custom endRadius', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { endRadius: 0.5 });
      expect(anim.endRadius).toBe(0.5);
    });

    it('uses custom numRings', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { numRings: 10 });
      expect(anim.numRings).toBe(10);
    });

    it('uses custom strokeWidth', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { strokeWidth: 8 });
      expect(anim.strokeWidth).toBe(8);
    });

    it('uses custom opacity', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { opacity: 0.8 });
      expect(anim.ringOpacity).toBe(0.8);
    });

    it('uses custom duration', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('uses custom rateFunc', () => {
      const m = new Mobject();
      const anim = new FocusOn(m, { rateFunc: linear });
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('focusOn() factory function', () => {
    it('returns a FocusOn instance', () => {
      const m = new Mobject();
      const anim = focusOn(m);
      expect(anim).toBeInstanceOf(FocusOn);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = focusOn(m, { startRadius: 4, numRings: 8 });
      expect(anim.startRadius).toBe(4);
      expect(anim.numRings).toBe(8);
    });
  });
});

// ---------------------------------------------------------------------------
// Pulse
// ---------------------------------------------------------------------------
describe('Pulse', () => {
  describe('constructor defaults', () => {
    it('has scaleFactor=1.2, nPulses=1', () => {
      const m = new Mobject();
      const anim = new Pulse(m);
      expect(anim.scaleFactor).toBe(1.2);
      expect(anim.nPulses).toBe(1);
    });

    it('has duration=0.5 and rateFunc=smooth', () => {
      const m = new Mobject();
      const anim = new Pulse(m);
      expect(anim.duration).toBe(0.5);
      expect(anim.rateFunc).toBe(smooth);
    });
  });

  describe('begin()', () => {
    it('stores original scale', () => {
      const m = new Mobject();
      m.scaleVector.set(2, 3, 4);
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(2, 5);
      expect(m.scaleVector.y).toBeCloseTo(3, 5);
      expect(m.scaleVector.z).toBeCloseTo(4, 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 scale is original (sin(0)=0)', () => {
      const m = new Mobject();
      m.scaleVector.set(1, 1, 1);
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1, 5);
    });

    it('at alpha=0.25 scale peaks (sin(PI/2)=1)', () => {
      const m = new Mobject();
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0.25);
      expect(m.scaleVector.x).toBeCloseTo(1.2, 5);
      expect(m.scaleVector.y).toBeCloseTo(1.2, 5);
      expect(m.scaleVector.z).toBeCloseTo(1.2, 5);
    });

    it('at alpha=0.5 scale is original (sin(PI)~0)', () => {
      const m = new Mobject();
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0.5);
      expect(m.scaleVector.x).toBeCloseTo(1, 4);
      expect(m.scaleVector.y).toBeCloseTo(1, 4);
      expect(m.scaleVector.z).toBeCloseTo(1, 4);
    });

    it('at alpha=0.75 scale peaks again (abs(sin(3PI/2))=1)', () => {
      const m = new Mobject();
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0.75);
      expect(m.scaleVector.x).toBeCloseTo(1.2, 5);
      expect(m.scaleVector.y).toBeCloseTo(1.2, 5);
      expect(m.scaleVector.z).toBeCloseTo(1.2, 5);
    });

    it('at alpha=1 scale is original (sin(2PI)~0)', () => {
      const m = new Mobject();
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(1, 4);
      expect(m.scaleVector.y).toBeCloseTo(1, 4);
      expect(m.scaleVector.z).toBeCloseTo(1, 4);
    });

    it('works with non-unit initial scale', () => {
      const m = new Mobject();
      m.scaleVector.set(3, 3, 3);
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0.25);
      expect(m.scaleVector.x).toBeCloseTo(3.6, 5);
      expect(m.scaleVector.y).toBeCloseTo(3.6, 5);
      expect(m.scaleVector.z).toBeCloseTo(3.6, 5);
    });

    it('custom nPulses produces more oscillations', () => {
      const m = new Mobject();
      const anim = new Pulse(m, { nPulses: 2 });
      anim.begin();
      anim.interpolate(0.125);
      expect(m.scaleVector.x).toBeCloseTo(1.2, 5);
    });

    it('custom scaleFactor changes peak scale', () => {
      const m = new Mobject();
      const anim = new Pulse(m, { scaleFactor: 2.0 });
      anim.begin();
      anim.interpolate(0.25);
      expect(m.scaleVector.x).toBeCloseTo(2.0, 5);
      expect(m.scaleVector.y).toBeCloseTo(2.0, 5);
    });
  });

  describe('finish()', () => {
    it('restores original scale', () => {
      const m = new Mobject();
      m.scaleVector.set(5, 5, 5);
      const anim = new Pulse(m);
      anim.begin();
      anim.interpolate(0.25);
      expect(m.scaleVector.x).toBeCloseTo(6.0, 5);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(5, 5);
      expect(m.scaleVector.y).toBeCloseTo(5, 5);
      expect(m.scaleVector.z).toBeCloseTo(5, 5);
    });
  });

  describe('pulse() factory function', () => {
    it('returns a Pulse instance', () => {
      const m = new Mobject();
      const anim = pulse(m);
      expect(anim).toBeInstanceOf(Pulse);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = pulse(m, { scaleFactor: 1.5, nPulses: 3 });
      expect(anim.scaleFactor).toBe(1.5);
      expect(anim.nPulses).toBe(3);
    });
  });
});

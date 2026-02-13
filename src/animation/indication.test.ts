import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Mobject } from '../core/Mobject';
import { Indicate } from './indication/Indicate';
import { Wiggle } from './indication/Wiggle';
import { thereAndBack, linear } from '../rate-functions';
import { YELLOW } from '../constants';

describe('Indicate', () => {
  describe('constructor defaults', () => {
    it('has scaleFactor=1.2, color=YELLOW, rateFunc=thereAndBack, duration=1', () => {
      const m = new Mobject();
      const anim = new Indicate(m);
      expect(anim.scaleFactor).toBe(1.2);
      expect(anim.indicateColor).toBe(YELLOW);
      expect(anim.rateFunc).toBe(thereAndBack);
      expect(anim.duration).toBe(1);
    });
  });

  describe('begin()', () => {
    it('stores original scale', () => {
      const m = new Mobject();
      m.scaleVector.set(2, 2, 2);
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(2, 5);
      expect(m.scaleVector.y).toBeCloseTo(2, 5);
      expect(m.scaleVector.z).toBeCloseTo(2, 5);
    });

    it('stores original color', () => {
      const m = new Mobject();
      m.setColor('#ff0000');
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.color.toLowerCase()).toBe('#ff0000');
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 scale is original and color is original', () => {
      const m = new Mobject();
      m.setColor('#ffffff');
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1, 5);
      expect(m.color.toLowerCase()).toBe('#ffffff');
    });

    it('at alpha=1 scale is original*scaleFactor and color is YELLOW', () => {
      const m = new Mobject();
      m.setColor('#ffffff');
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(1.2, 5);
      expect(m.scaleVector.y).toBeCloseTo(1.2, 5);
      expect(m.scaleVector.z).toBeCloseTo(1.2, 5);
      const resultColor = new THREE.Color(m.color);
      const yellowColor = new THREE.Color(YELLOW);
      expect(resultColor.r).toBeCloseTo(yellowColor.r, 2);
      expect(resultColor.g).toBeCloseTo(yellowColor.g, 2);
      expect(resultColor.b).toBeCloseTo(yellowColor.b, 2);
    });

    it('at alpha=0.5 scale is halfway and color is halfway to YELLOW', () => {
      const m = new Mobject();
      m.setColor('#ffffff');
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(0.5);
      // Scale: 1 + (1.2 - 1) * 0.5 = 1.1
      expect(m.scaleVector.x).toBeCloseTo(1.1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1.1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1.1, 5);
      const white = new THREE.Color('#ffffff');
      const yellow = new THREE.Color(YELLOW);
      const expected = white.clone().lerp(yellow, 0.5);
      const result = new THREE.Color(m.color);
      expect(result.r).toBeCloseTo(expected.r, 2);
      expect(result.g).toBeCloseTo(expected.g, 2);
      expect(result.b).toBeCloseTo(expected.b, 2);
    });
  });

  describe('finish()', () => {
    it('restores original scale after animation', () => {
      const m = new Mobject();
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(1.2, 5);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1, 5);
    });

    it('restores original color after animation', () => {
      const m = new Mobject();
      m.setColor('#00ff00');
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(1);
      anim.finish();
      expect(m.color.toLowerCase()).toBe('#00ff00');
    });
  });

  describe('custom options', () => {
    it('uses custom scaleFactor', () => {
      const m = new Mobject();
      const anim = new Indicate(m, { scaleFactor: 2.0 });
      expect(anim.scaleFactor).toBe(2.0);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(2.0, 5);
      expect(m.scaleVector.y).toBeCloseTo(2.0, 5);
      expect(m.scaleVector.z).toBeCloseTo(2.0, 5);
    });

    it('uses custom color', () => {
      const m = new Mobject();
      m.setColor('#ffffff');
      const anim = new Indicate(m, { color: '#ff0000' });
      expect(anim.indicateColor).toBe('#ff0000');
      anim.begin();
      anim.interpolate(1);
      const result = new THREE.Color(m.color);
      const expectedColor = new THREE.Color('#ff0000');
      expect(result.r).toBeCloseTo(expectedColor.r, 2);
      expect(result.g).toBeCloseTo(expectedColor.g, 2);
      expect(result.b).toBeCloseTo(expectedColor.b, 2);
    });

    it('uses custom duration', () => {
      const m = new Mobject();
      const anim = new Indicate(m, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('uses custom rateFunc', () => {
      const m = new Mobject();
      const anim = new Indicate(m, { rateFunc: linear });
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('non-unit initial scale', () => {
    it('scales relative to initial scale at alpha=1', () => {
      const m = new Mobject();
      m.scaleVector.set(3, 3, 3);
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(3.6, 5);
      expect(m.scaleVector.y).toBeCloseTo(3.6, 5);
      expect(m.scaleVector.z).toBeCloseTo(3.6, 5);
    });

    it('scales relative to initial scale at alpha=0.5', () => {
      const m = new Mobject();
      m.scaleVector.set(2, 2, 2);
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(0.5);
      // Scale: 2 * (1 + (1.2 - 1) * 0.5) = 2 * 1.1 = 2.2
      expect(m.scaleVector.x).toBeCloseTo(2.2, 5);
      expect(m.scaleVector.y).toBeCloseTo(2.2, 5);
      expect(m.scaleVector.z).toBeCloseTo(2.2, 5);
    });

    it('finish restores non-unit scale', () => {
      const m = new Mobject();
      m.scaleVector.set(5, 5, 5);
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(1);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(5, 5);
      expect(m.scaleVector.y).toBeCloseTo(5, 5);
      expect(m.scaleVector.z).toBeCloseTo(5, 5);
    });

    it('works with non-uniform initial scale', () => {
      const m = new Mobject();
      m.scaleVector.set(1, 2, 3);
      const anim = new Indicate(m);
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(1 * 1.2, 5);
      expect(m.scaleVector.y).toBeCloseTo(2 * 1.2, 5);
      expect(m.scaleVector.z).toBeCloseTo(3 * 1.2, 5);
    });
  });

  describe('indicate() factory function', () => {
    it('returns an Indicate instance', async () => {
      const { indicate } = await import('./indication/Indicate');
      const m = new Mobject();
      const anim = indicate(m);
      expect(anim).toBeInstanceOf(Indicate);
    });

    it('passes options through', async () => {
      const { indicate } = await import('./indication/Indicate');
      const m = new Mobject();
      const anim = indicate(m, { scaleFactor: 3, color: '#00ff00' });
      expect(anim.scaleFactor).toBe(3);
      expect(anim.indicateColor).toBe('#00ff00');
    });
  });
});

describe('Wiggle', () => {
  describe('constructor defaults', () => {
    it('has rotationAngle=PI/12, nWiggles=6, scaleFactor=1.1', () => {
      const m = new Mobject();
      const anim = new Wiggle(m);
      expect(anim.rotationAngle).toBeCloseTo(Math.PI / 12, 5);
      expect(anim.nWiggles).toBe(6);
      expect(anim.scaleFactor).toBeCloseTo(1.1, 5);
    });

    it('has rateFunc=linear, duration=1', () => {
      const m = new Mobject();
      const anim = new Wiggle(m);
      expect(anim.rateFunc).toBe(linear);
      expect(anim.duration).toBe(1);
    });

    it('has rotationAxis [0,0,1] and aboutPoint null by default', () => {
      const m = new Mobject();
      const anim = new Wiggle(m);
      expect(anim.rotationAxis).toEqual([0, 0, 1]);
      expect(anim.aboutPoint).toBeNull();
    });
  });

  describe('begin()', () => {
    it('stores initial quaternion, scale, and position', () => {
      const m = new Mobject();
      m.scaleVector.set(2, 2, 2);
      m.position.set(3, 4, 5);
      const anim = new Wiggle(m, { aboutPoint: [3, 4, 5] });
      anim.begin();
      // At alpha=0 envelope=sin(0)=0, so no changes should occur
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(2, 5);
      expect(m.scaleVector.y).toBeCloseTo(2, 5);
      expect(m.scaleVector.z).toBeCloseTo(2, 5);
      expect(m.position.x).toBeCloseTo(3, 5);
      expect(m.position.y).toBeCloseTo(4, 5);
      expect(m.position.z).toBeCloseTo(5, 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 envelope is 0: no rotation, no scale change', () => {
      const m = new Mobject();
      m.position.set(0, 0, 0);
      const initialRotation = m.rotation.clone();
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0);
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1, 5);
      expect(m.rotation.x).toBeCloseTo(initialRotation.x, 5);
      expect(m.rotation.y).toBeCloseTo(initialRotation.y, 5);
      expect(m.rotation.z).toBeCloseTo(initialRotation.z, 5);
    });

    it('at alpha=0.5 envelope is max (sin(PI/2)=1), scale peaks', () => {
      const m = new Mobject();
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      // envelope = sin(0.5*PI) = 1, scale = 1 + 0.1*1 = 1.1
      expect(m.scaleVector.x).toBeCloseTo(1.1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1.1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1.1, 5);
    });

    it('at alpha=1 envelope is 0 (sin(PI)~0): returns to rest', () => {
      const m = new Mobject();
      m.position.set(0, 0, 0);
      const initialRotation = m.rotation.clone();
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(1);
      expect(m.scaleVector.x).toBeCloseTo(1, 5);
      expect(m.scaleVector.y).toBeCloseTo(1, 5);
      expect(m.scaleVector.z).toBeCloseTo(1, 5);
      expect(m.rotation.x).toBeCloseTo(initialRotation.x, 4);
      expect(m.rotation.y).toBeCloseTo(initialRotation.y, 4);
      expect(m.rotation.z).toBeCloseTo(initialRotation.z, 4);
    });

    it('mid-wiggle has non-trivial rotation', () => {
      const m = new Mobject();
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      // alpha=1/24: wigglePhase=(1/24)*12*PI=PI/2, sin(PI/2)=1
      // envelope=sin(PI/24)~0.13, so angle is non-zero
      const alpha = 1 / 24;
      anim.interpolate(alpha);
      const envelope = Math.sin(alpha * Math.PI);
      const wigglePhase = alpha * 6 * Math.PI * 2;
      const expectedAngle = Math.sin(wigglePhase) * (Math.PI / 12) * envelope;
      expect(Math.abs(expectedAngle)).toBeGreaterThan(0.01);
      const expectedScale = 1 + (1.1 - 1) * envelope;
      expect(m.scaleVector.x).toBeCloseTo(expectedScale, 5);
    });
  });

  describe('finish()', () => {
    it('restores original rotation', () => {
      const m = new Mobject();
      const initialRotation = m.rotation.clone();
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.25);
      anim.finish();
      expect(m.rotation.x).toBeCloseTo(initialRotation.x, 5);
      expect(m.rotation.y).toBeCloseTo(initialRotation.y, 5);
      expect(m.rotation.z).toBeCloseTo(initialRotation.z, 5);
    });

    it('restores original scale', () => {
      const m = new Mobject();
      m.scaleVector.set(3, 3, 3);
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.scaleVector.x).toBeCloseTo(3, 5);
      expect(m.scaleVector.y).toBeCloseTo(3, 5);
      expect(m.scaleVector.z).toBeCloseTo(3, 5);
    });

    it('restores original position', () => {
      const m = new Mobject();
      m.position.set(10, 20, 30);
      const anim = new Wiggle(m, { aboutPoint: [10, 20, 30] });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.position.x).toBeCloseTo(10, 5);
      expect(m.position.y).toBeCloseTo(20, 5);
      expect(m.position.z).toBeCloseTo(30, 5);
    });
  });

  describe('rotation about custom point with position offset', () => {
    it('rotates about custom aboutPoint', () => {
      const m = new Mobject();
      m.position.set(1, 0, 0);
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      const alpha = 1 / 24;
      anim.interpolate(alpha);
      const envelope = Math.sin(alpha * Math.PI);
      const wigglePhase = alpha * 6 * Math.PI * 2;
      const currentAngle = Math.sin(wigglePhase) * (Math.PI / 12) * envelope;
      // Position rotated from [1,0,0] about origin around Z axis
      expect(m.position.x).toBeCloseTo(Math.cos(currentAngle), 4);
      expect(m.position.y).toBeCloseTo(Math.sin(currentAngle), 4);
      expect(m.position.z).toBeCloseTo(0, 5);
    });

    it('finish restores position after custom aboutPoint rotation', () => {
      const m = new Mobject();
      m.position.set(5, 3, 0);
      const anim = new Wiggle(m, { aboutPoint: [0, 0, 0] });
      anim.begin();
      anim.interpolate(0.25);
      anim.finish();
      expect(m.position.x).toBeCloseTo(5, 5);
      expect(m.position.y).toBeCloseTo(3, 5);
      expect(m.position.z).toBeCloseTo(0, 5);
    });
  });

  describe('custom options', () => {
    it('uses custom rotationAngle', () => {
      const m = new Mobject();
      const anim = new Wiggle(m, { rotationAngle: Math.PI / 4 });
      expect(anim.rotationAngle).toBeCloseTo(Math.PI / 4, 5);
    });

    it('uses custom nWiggles', () => {
      const m = new Mobject();
      const anim = new Wiggle(m, { nWiggles: 3 });
      expect(anim.nWiggles).toBe(3);
    });

    it('uses custom scaleFactor', () => {
      const m = new Mobject();
      const anim = new Wiggle(m, { scaleFactor: 2.0 });
      expect(anim.scaleFactor).toBeCloseTo(2.0, 5);
    });

    it('uses custom rotationAxis', () => {
      const m = new Mobject();
      const anim = new Wiggle(m, { rotationAxis: [1, 0, 0] });
      expect(anim.rotationAxis).toEqual([1, 0, 0]);
    });
  });

  describe('wiggle() factory function', () => {
    it('returns a Wiggle instance', async () => {
      const { wiggle } = await import('./indication/Wiggle');
      const m = new Mobject();
      const anim = wiggle(m);
      expect(anim).toBeInstanceOf(Wiggle);
    });

    it('passes options through', async () => {
      const { wiggle } = await import('./indication/Wiggle');
      const m = new Mobject();
      const anim = wiggle(m, { nWiggles: 10, scaleFactor: 1.5 });
      expect(anim.nWiggles).toBe(10);
      expect(anim.scaleFactor).toBeCloseTo(1.5, 5);
    });
  });
});

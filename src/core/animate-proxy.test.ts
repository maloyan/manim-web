import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Circle } from '../mobjects/geometry/Circle';
import { Rectangle } from '../mobjects/geometry/Rectangle';
import { AnimateProxy } from './AnimateProxy';
import { Animation } from '../animation/Animation';
import { linear } from '../rate-functions';
import { overrideAnimation, clearAnimationOverrides } from '../animation/AnimationUtilities';

describe('AnimateProxy', () => {
  let circle: Circle;

  beforeEach(() => {
    circle = new Circle({ radius: 1, color: '#ff0000' });
  });

  it('mobject.animate returns an AnimateProxy instance', () => {
    const proxy = circle.animate;
    expect(proxy).toBeInstanceOf(AnimateProxy);
  });

  it('mobject.animate is an instance of Animation', () => {
    const proxy = circle.animate;
    expect(proxy).toBeInstanceOf(Animation);
  });

  it('calling methods on the proxy returns this (for chaining)', () => {
    const proxy = circle.animate;
    const result = proxy.shift([1, 0, 0]);
    expect(result).toBe(proxy);
  });

  it('records a shift call', () => {
    const proxy = circle.animate.shift([1, 0, 0]);
    expect(proxy).toBeInstanceOf(AnimateProxy);
  });

  it('chains multiple calls', () => {
    const proxy = circle.animate.shift([1, 0, 0]).setColor('#0000ff');
    expect(proxy).toBeInstanceOf(AnimateProxy);
  });

  it('begin() creates a target and sets up Transform internally', () => {
    // Circle.shift modifies points (not Mobject.position).
    // After begin + interpolate(1), getCenter should reflect the shift.
    const startCenter = circle.getCenter();
    const proxy = circle.animate.shift([2, 0, 0]);
    proxy.begin();
    proxy.interpolate(1);
    const endCenter = circle.getCenter();
    expect(endCenter[0]).toBeCloseTo(startCenter[0] + 2, 0);
  });

  it('interpolate(0) keeps mobject at original state', () => {
    const startCenter = circle.getCenter();
    const proxy = circle.animate.shift([3, 0, 0]);
    proxy.begin();
    proxy.interpolate(0);
    const center = circle.getCenter();
    expect(center[0]).toBeCloseTo(startCenter[0], 0);
  });

  it('interpolate(1) moves mobject to target state', () => {
    const startCenter = circle.getCenter();
    const proxy = circle.animate.shift([5, 0, 0]);
    proxy.begin();
    proxy.interpolate(1);
    const endCenter = circle.getCenter();
    expect(endCenter[0]).toBeCloseTo(startCenter[0] + 5, 0);
  });

  it('finish() finalizes the animation', () => {
    const startCenter = circle.getCenter();
    const proxy = circle.animate.shift([1, 0, 0]);
    proxy.begin();
    proxy.finish();
    expect(proxy.isFinished()).toBe(true);
    const endCenter = circle.getCenter();
    expect(endCenter[0]).toBeCloseTo(startCenter[0] + 1, 0);
  });

  it('withDuration(2) sets custom duration', () => {
    const proxy = circle.animate.withDuration(2).shift([1, 0, 0]);
    expect(proxy.duration).toBe(2);
  });

  it('withRateFunc(linear) sets custom rate function', () => {
    const proxy = circle.animate.withRateFunc(linear).shift([1, 0, 0]);
    expect(proxy.rateFunc).toBe(linear);
  });

  it('applies setColor correctly at alpha=1', () => {
    const proxy = circle.animate.setColor('#00ff00');
    proxy.begin();
    proxy.interpolate(1);
    // After transform to target with #00ff00, the color should change
    expect(circle.color).not.toBe('#ff0000');
  });

  it('applies scale correctly at alpha=1', () => {
    // Circle.scale(number) regenerates points with new radius.
    // Transform interpolates the point geometry, so at alpha=1
    // the points should match a circle with double the radius.
    const startPoints = circle.getPoints();
    const proxy = circle.animate.scale(2);
    proxy.begin();
    proxy.interpolate(1);
    const endPoints = circle.getPoints();
    // The points should have moved outward (larger radius).
    // Check that at least one point coordinate changed significantly.
    const startFirstX = startPoints[0]?.[0] ?? 0;
    const endFirstX = endPoints[0]?.[0] ?? 0;
    expect(Math.abs(endFirstX)).toBeGreaterThan(Math.abs(startFirstX) * 1.5);
  });

  describe('chained animations (issue #252)', () => {
    it('accumulates consecutive animate.shift on a Circle', () => {
      const c = new Circle({ radius: 1 });
      const startCenter = c.getCenter();

      let proxy = c.animate.shift([1, 0, 0]);
      proxy.begin();
      proxy.finish();
      expect(c.getCenter()[0]).toBeCloseTo(startCenter[0] + 1, 2);
      expect(c.getCircleCenter()[0]).toBeCloseTo(startCenter[0] + 1, 2);

      proxy = c.animate.shift([1, 0, 0]);
      proxy.begin();
      proxy.finish();
      expect(c.getCenter()[0]).toBeCloseTo(startCenter[0] + 2, 2);
      expect(c.getCircleCenter()[0]).toBeCloseTo(startCenter[0] + 2, 2);
    });

    it('accumulates consecutive animate.scale on a Circle', () => {
      const c = new Circle({ radius: 1 });

      let proxy = c.animate.scale(2);
      proxy.begin();
      proxy.finish();
      expect(c.getRadius()).toBeCloseTo(2, 2);

      proxy = c.animate.scale(2);
      proxy.begin();
      proxy.finish();
      expect(c.getRadius()).toBeCloseTo(4, 2);
    });

    it('keeps logical state in sync with visual state after animate.shift', () => {
      const c = new Circle({ radius: 1 });
      const proxy = c.animate.shift([3, 2, 0]);
      proxy.begin();
      proxy.finish();
      // Visual center, logical _centerPoint, and shifted-then-rescaled
      // points should all agree.
      const visual = c.getCenter();
      const logical = c.getCircleCenter();
      expect(logical[0]).toBeCloseTo(visual[0], 2);
      expect(logical[1]).toBeCloseTo(visual[1], 2);
    });

    it('accumulates consecutive animate.shift on a Rectangle', () => {
      const r = new Rectangle({ width: 2, height: 1 });
      const startCenter = r.getCenter();

      let proxy = r.animate.shift([1, 0, 0]);
      proxy.begin();
      proxy.finish();
      expect(r.getCenter()[0]).toBeCloseTo(startCenter[0] + 1, 2);
      expect(r.getWidth()).toBeCloseTo(2, 2);

      proxy = r.animate.shift([1, 0, 0]);
      proxy.begin();
      proxy.finish();
      expect(r.getCenter()[0]).toBeCloseTo(startCenter[0] + 2, 2);
      expect(r.getWidth()).toBeCloseTo(2, 2);
    });

    it('accumulates mixed chained calls in a single animation', () => {
      const c = new Circle({ radius: 1, color: '#ff0000' });
      const proxy = c.animate.shift([2, 0, 0]).setColor('#00ff00').scale(2);
      proxy.begin();
      proxy.finish();

      expect(c.getCenter()[0]).toBeCloseTo(2, 2);
      expect(c.getCircleCenter()[0]).toBeCloseTo(2, 2);
      expect(c.getRadius()).toBeCloseTo(2, 2);
      expect(c.color).toBe('#00ff00');
    });

    it('accumulates different methods across separate animations', () => {
      const c = new Circle({ radius: 1 });

      let proxy = c.animate.shift([1, 0, 0]);
      proxy.begin();
      proxy.finish();

      proxy = c.animate.scale(2);
      proxy.begin();
      proxy.finish();

      proxy = c.animate.shift([1, 0, 0]);
      proxy.begin();
      proxy.finish();

      // Started at (0,0,0) r=1 → +x by 1 → scale 2 (about own center) → +x by 1
      expect(c.getCircleCenter()[0]).toBeCloseTo(2, 2);
      expect(c.getRadius()).toBeCloseTo(2, 2);
    });
  });

  describe('animation overrides', () => {
    afterEach(() => {
      clearAnimationOverrides('Circle');
    });

    it('uses override animation when registered', () => {
      let overrideCalled = false;
      overrideAnimation('setColor', 'Circle', (mobject, options) => {
        overrideCalled = true;
        // Return a simple animation that just sets color
        return new (class extends Animation {
          interpolate(alpha: number): void {
            if (alpha >= 1) {
              mobject.setColor('#override');
            }
          }
        })(mobject, options);
      });

      const proxy = circle.animate.setColor('#00ff00');
      // The proxy should detect the override and use it
      proxy.begin();
      proxy.interpolate(1);
      proxy.finish();
      expect(overrideCalled).toBe(true);
    });
  });
});

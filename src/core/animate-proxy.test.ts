import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Circle } from '../mobjects/geometry/Circle';
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

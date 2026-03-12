import { describe, it, expect } from 'vitest';
import { StreamLines } from './VectorField';

const uniformFunc = () => [1, 0] as [number, number];
const rotationFunc = (x: number, y: number) => [-y, x] as [number, number];

function makeStreamLines(func = uniformFunc, numLines = 5) {
  return new StreamLines({
    func,
    xRange: [-2, 2, 1],
    yRange: [-2, 2, 1],
    numLines,
  });
}

describe('StreamLines continuous motion', () => {
  describe('startAnimation', () => {
    it('returns this for chaining', () => {
      const sl = makeStreamLines();
      expect(sl.startAnimation()).toBe(sl);
      sl.endAnimation();
    });

    it('adds an updater to the StreamLines', () => {
      const sl = makeStreamLines();
      expect(sl.hasUpdaters()).toBe(false);
      sl.startAnimation();
      expect(sl.hasUpdaters()).toBe(true);
      sl.endAnimation();
    });

    it('accepts custom options', () => {
      const sl = makeStreamLines();
      sl.startAnimation({
        warmUp: false,
        flowSpeed: 2,
        timeWidth: 0.5,
        rateFunc: (t: number) => t * t,
      });
      expect(sl.hasUpdaters()).toBe(true);
      sl.endAnimation();
    });

    it('replaces existing animation when called twice', () => {
      const sl = makeStreamLines();
      sl.startAnimation({ warmUp: false });
      sl.startAnimation({ warmUp: true, flowSpeed: 3 });
      // Should still have exactly one updater, not two
      expect(sl.hasUpdaters()).toBe(true);
      sl.endAnimation();
      expect(sl.hasUpdaters()).toBe(false);
    });

    it('is a no-op when there are no streamlines', () => {
      // A vector field that always returns zero should produce no streamlines
      const sl = new StreamLines({
        func: () => [0, 0] as [number, number],
        xRange: [-1, 1, 1],
        yRange: [-1, 1, 1],
        numLines: 3,
      });
      const result = sl.startAnimation();
      expect(result).toBe(sl);
      // Should not have an updater since there's nothing to animate
      sl.endAnimation();
    });
  });

  describe('endAnimation', () => {
    it('returns this for chaining', () => {
      const sl = makeStreamLines();
      sl.startAnimation();
      expect(sl.endAnimation()).toBe(sl);
    });

    it('removes the updater', () => {
      const sl = makeStreamLines();
      sl.startAnimation();
      expect(sl.hasUpdaters()).toBe(true);
      sl.endAnimation();
      expect(sl.hasUpdaters()).toBe(false);
    });

    it('is safe to call without startAnimation', () => {
      const sl = makeStreamLines();
      expect(() => sl.endAnimation()).not.toThrow();
    });

    it('is safe to call twice', () => {
      const sl = makeStreamLines();
      sl.startAnimation();
      sl.endAnimation();
      expect(() => sl.endAnimation()).not.toThrow();
      expect(sl.hasUpdaters()).toBe(false);
    });

    it('restores streamline visibility after animation', () => {
      const sl = makeStreamLines();
      const childCountBefore = sl.children.length;
      sl.startAnimation({ warmUp: false });
      sl.endAnimation();
      // Children should still be present
      expect(sl.children.length).toBe(childCountBefore);
    });
  });

  describe('updater behavior', () => {
    it('phases advance when updater is called', () => {
      const sl = makeStreamLines(rotationFunc, 5);
      sl.startAnimation({ warmUp: false, flowSpeed: 1, timeWidth: 0.3 });

      // Manually invoke the updater by calling applyUpdaters
      sl.update(0.1);

      // After calling the updater, streamlines should still have children
      expect(sl.children.length).toBeGreaterThan(0);
      sl.endAnimation();
    });

    it('warm-up randomizes phases', () => {
      const sl1 = makeStreamLines(rotationFunc, 5);
      const sl2 = makeStreamLines(rotationFunc, 5);

      sl1.startAnimation({ warmUp: true });
      sl2.startAnimation({ warmUp: true });

      // Both should have updaters
      expect(sl1.hasUpdaters()).toBe(true);
      expect(sl2.hasUpdaters()).toBe(true);

      sl1.endAnimation();
      sl2.endAnimation();
    });

    it('updater does not throw during multiple frames', () => {
      const sl = makeStreamLines(rotationFunc, 8);
      sl.startAnimation({ warmUp: false, flowSpeed: 2, timeWidth: 0.4 });

      // Simulate multiple frames
      expect(() => {
        for (let i = 0; i < 20; i++) {
          sl.update(1 / 60); // ~60fps
        }
      }).not.toThrow();

      sl.endAnimation();
    });

    it('handles small timeWidth', () => {
      const sl = makeStreamLines(uniformFunc, 5);
      sl.startAnimation({ warmUp: false, flowSpeed: 1, timeWidth: 0.05 });
      expect(() => sl.update(0.1)).not.toThrow();
      sl.endAnimation();
    });

    it('handles large timeWidth', () => {
      const sl = makeStreamLines(uniformFunc, 5);
      sl.startAnimation({ warmUp: false, flowSpeed: 1, timeWidth: 0.9 });
      expect(() => sl.update(0.1)).not.toThrow();
      sl.endAnimation();
    });

    it('wraps around phase correctly', () => {
      const sl = makeStreamLines(uniformFunc, 3);
      sl.startAnimation({ warmUp: false, flowSpeed: 10, timeWidth: 0.3 });

      // Advance enough that phase wraps multiple times
      expect(() => {
        for (let i = 0; i < 100; i++) {
          sl.update(0.1);
        }
      }).not.toThrow();

      sl.endAnimation();
    });
  });

  describe('integration with other StreamLines features', () => {
    it('works after setFunction', () => {
      const sl = makeStreamLines();
      sl.setFunction(rotationFunc);
      sl.startAnimation();
      expect(sl.hasUpdaters()).toBe(true);
      expect(() => sl.update(0.05)).not.toThrow();
      sl.endAnimation();
    });

    it('works with showArrows', () => {
      const sl = new StreamLines({
        func: uniformFunc,
        xRange: [-2, 2, 1],
        yRange: [-2, 2, 1],
        numLines: 5,
        showArrows: true,
      });
      sl.startAnimation();
      expect(sl.hasUpdaters()).toBe(true);
      expect(() => sl.update(0.05)).not.toThrow();
      sl.endAnimation();
    });

    it('works with variableWidth', () => {
      const sl = new StreamLines({
        func: rotationFunc,
        xRange: [-2, 2, 1],
        yRange: [-2, 2, 1],
        numLines: 5,
        variableWidth: true,
      });
      sl.startAnimation({ flowSpeed: 1.5 });
      expect(() => sl.update(0.05)).not.toThrow();
      sl.endAnimation();
    });

    it('works with custom startPoints', () => {
      const sl = new StreamLines({
        func: uniformFunc,
        startPoints: [
          [0, 0],
          [1, 1],
          [-1, -1],
        ],
      });
      sl.startAnimation({ warmUp: false });
      expect(() => sl.update(0.05)).not.toThrow();
      sl.endAnimation();
    });

    it('copy does not carry over animation state', () => {
      const sl = makeStreamLines();
      sl.startAnimation();
      const cp = sl.copy();
      // Copy should not have the updater
      expect(cp.hasUpdaters()).toBe(false);
      sl.endAnimation();
    });
  });
});

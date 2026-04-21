// @vitest-environment happy-dom
/**
 * Tests for MathTex animations (GitHub issue #251).
 *
 * Verifies that animations work correctly with SVG-based MathTex,
 * especially with async rendering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MathTex } from './MathTex';
import { Scene } from '../../core/Scene';
import { RIGHT, UP, DOWN, LEFT, ORIGIN } from '../../core/Mobject';
import { Create, DrawBorderThenFill } from '../../animation/creation';
import { FadeIn, FadeOut } from '../../animation/fading';
import { Transform } from '../../animation/transform';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Circle } from '../geometry';
// Import AnimateProxy to register it
import '../../core/AnimateProxy';

// Helper to create a minimal scene for testing
function createTestScene(): Scene {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  return new Scene(container, { width: 800, height: 600, headless: true });
}

describe('MathTex animations (issue #251)', () => {
  let scene: Scene;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    scene = new Scene(container, { width: 800, height: 600, headless: true });
  });

  afterEach(() => {
    scene.dispose();
    container.remove();
  });

  describe('basic shift animation', () => {
    it('should have children after waitForRender', async () => {
      const tex = new MathTex({ latex: 'x^2' });
      expect(tex.children.length).toBe(0);

      await tex.waitForRender();

      expect(tex.children.length).toBeGreaterThan(0);
    });

    it('should have points after waitForRender', async () => {
      const tex = new MathTex({ latex: 'x^2' });
      expect(tex.getPoints().length).toBe(0);

      await tex.waitForRender();

      expect(tex.getPoints().length).toBeGreaterThan(0);
    });

    it('should shift children when shift() is called', async () => {
      const tex = new MathTex({ latex: 'x^2' });
      await tex.waitForRender();

      const initialCenters = tex.children.map((c) => c.getCenter());
      tex.shift(RIGHT);
      const shiftedCenters = tex.children.map((c) => c.getCenter());

      expect(shiftedCenters.length).toBe(initialCenters.length);
      for (let i = 0; i < initialCenters.length; i++) {
        expect(shiftedCenters[i][0]).toBeCloseTo(initialCenters[i][0] + RIGHT[0], 5);
        expect(shiftedCenters[i][1]).toBeCloseTo(initialCenters[i][1], 5);
      }
    });

    it('should animate shift with animate.shift()', async () => {
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      await tex.waitForRender();

      const initialCenter = tex.getCenter();
      scene.add(tex);

      // Play the animation
      await scene.play(tex.animate.shift(RIGHT));

      const finalCenter = tex.getCenter();

      // The center should have moved by RIGHT amount
      expect(finalCenter[0]).toBeCloseTo(initialCenter[0] + RIGHT[0], 2);
    }, 10000);

    it('should work with Create animation after waitForRender', async () => {
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      await tex.waitForRender();

      // Create animation should work
      await scene.play(new Create(tex, { duration: 0.5 }));

      // MathTex should be visible after Create
      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);

    it('should work with FadeIn animation after waitForRender', async () => {
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      await tex.waitForRender();

      await scene.play(new FadeIn(tex, { duration: 0.5 }));

      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);

    it('should work with DrawBorderThenFill animation after waitForRender', async () => {
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      await tex.waitForRender();

      await scene.play(new DrawBorderThenFill(tex, { duration: 0.5 }));

      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);
  });

  describe('VGroup shift behavior', () => {
    it('VGroup shift should move children but not group position', async () => {
      const circle1 = new Circle({ radius: 0.5 });
      const circle2 = new Circle({ radius: 0.5 });
      const group = new VGroup(circle1, circle2);

      circle1.moveTo([0, 0, 0]);
      circle2.moveTo([2, 0, 0]);

      const initialGroupPos = [group.position.x, group.position.y, group.position.z];
      const initialCenter = group.getCenter();
      const initialChild1Center = circle1.getCenter();
      const initialChild2Center = circle2.getCenter();

      group.shift(RIGHT);

      // Group position should NOT change (children moved instead)
      expect(group.position.x).toBeCloseTo(initialGroupPos[0], 5);

      // Children should have moved
      expect(circle1.getCenter()[0]).toBeCloseTo(initialChild1Center[0] + RIGHT[0], 5);
      expect(circle2.getCenter()[0]).toBeCloseTo(initialChild2Center[0] + RIGHT[0], 5);

      // Group center (average of children) should have moved
      const newCenter = group.getCenter();
      expect(newCenter[0]).toBeCloseTo(initialCenter[0] + RIGHT[0], 5);
    });

    it('VGroup animate.shift should work with Transform', async () => {
      const circle1 = new Circle({ radius: 0.5 });
      const circle2 = new Circle({ radius: 0.5 });
      const group = new VGroup(circle1, circle2);

      circle1.moveTo([0, 0, 0]);
      circle2.moveTo([2, 0, 0]);

      const initialCenter = group.getCenter();
      scene.add(group);

      await scene.play(group.animate.shift(RIGHT));

      const finalCenter = group.getCenter();
      expect(finalCenter[0]).toBeCloseTo(initialCenter[0] + RIGHT[0], 2);
    }, 10000);
  });

  describe('Transform with MathTex', () => {
    it('should transform MathTex to another MathTex', async () => {
      const tex1 = new MathTex({ latex: 'x', fontSize: 1 });
      const tex2 = new MathTex({ latex: 'y', fontSize: 1 });

      await Promise.all([tex1.waitForRender(), tex2.waitForRender()]);

      scene.add(tex1);

      const initialCenter = tex1.getCenter();

      await scene.play(new Transform(tex1, tex2, { duration: 0.5 }));

      // tex1 should now have tex2's appearance
      // Note: the mobject itself doesn't change, just its visual appearance
      expect(scene.mobjects.has(tex1)).toBe(true);
    }, 10000);

    it('should animate scale on MathTex', async () => {
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      await tex.waitForRender();

      scene.add(tex);
      const initialCenter = tex.getCenter();

      await scene.play(tex.animate.scale(2));

      // The content should be scaled up
      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);

    it('should animate rotate on MathTex', async () => {
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      await tex.waitForRender();

      scene.add(tex);

      await scene.play(tex.animate.rotate(Math.PI / 4));

      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);
  });

  describe('consecutive animations', () => {
    it('should handle multiple consecutive shift animations', async () => {
      const tex = new MathTex({ latex: 'x', fontSize: 1 });
      await tex.waitForRender();

      scene.add(tex);

      const initialCenter = tex.getCenter();

      await scene.play(tex.animate.shift(RIGHT));
      const afterFirst = tex.getCenter();

      await scene.play(tex.animate.shift(RIGHT));
      const afterSecond = tex.getCenter();

      // Each shift should move by RIGHT amount
      expect(afterFirst[0]).toBeCloseTo(initialCenter[0] + RIGHT[0], 2);
      expect(afterSecond[0]).toBeCloseTo(afterFirst[0] + RIGHT[0], 2);
    }, 15000);

    it('should handle shift then scale animations', async () => {
      const tex = new MathTex({ latex: 'x', fontSize: 1 });
      await tex.waitForRender();

      scene.add(tex);

      await scene.play(tex.animate.shift(RIGHT));
      await scene.play(tex.animate.scale(2));

      expect(scene.mobjects.has(tex)).toBe(true);
    }, 15000);

    it('should handle Create then FadeOut', async () => {
      const tex = new MathTex({ latex: 'x', fontSize: 1 });
      await tex.waitForRender();

      await scene.play(new Create(tex, { duration: 0.3 }));
      expect(scene.mobjects.has(tex)).toBe(true);

      await scene.play(new FadeOut(tex, { duration: 0.3 }));
      expect(scene.mobjects.has(tex)).toBe(false);
    }, 15000);
  });

  describe('multipart MathTex animations', () => {
    it('should animate multipart MathTex', async () => {
      const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
      await tex.waitForRender();

      expect(tex.getPartCount()).toBe(3);

      scene.add(tex);

      await scene.play(tex.animate.shift(RIGHT));

      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);

    it('should animate individual parts', async () => {
      const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
      await tex.waitForRender();

      const part0 = tex.getPart(0);

      scene.add(tex);

      // Animate just the first part
      await scene.play(part0.animate.shift(UP));

      expect(scene.mobjects.has(tex)).toBe(true);
    }, 10000);
  });
});

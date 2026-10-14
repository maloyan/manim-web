import { describe, it, expect } from 'vitest';
import { Code } from '../../mobjects/text/Code';
import { TransformMatchingCode, transformMatchingCode } from './TransformMatchingCode';
import type { CodeToken } from '../../mobjects/text/CodeTokenLayout';

/**
 * These tests run in the default (node) environment, where `document` is
 * undefined. The Code mobject is then headless (no 2D canvas), and
 * `getCodeTokens()` computes positions with pure math. No WebGL or canvas
 * mocking is needed because token mobjects never build a Three.js object here.
 */

function js(code: string): Code {
  return new Code({ code, language: 'javascript', lineNumbers: false });
}

describe('TransformMatchingCode', () => {
  describe('matching', () => {
    it('matches every token when source and target are identical', () => {
      const source = js('x = 1');
      const target = js('x = 1');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      // Tokens: x, ' ', =, ' ', 1  -> all five match, nothing fades.
      expect(anim.matchedParts.length).toBe(5);
      expect(anim.fadeInParts.length).toBe(0);
      expect(anim.fadeOutParts.length).toBe(0);
    });

    it('fades out removed tokens and fades in added tokens for the diff', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      // Unchanged: x, ' ', =, ' ' (4). Removed: 1. Added: 2.
      expect(anim.matchedParts.length).toBe(4);
      expect(anim.fadeOutParts.length).toBe(1);
      expect(anim.fadeInParts.length).toBe(1);

      expect(anim.fadeOutParts[0].fadeIn).toBe(false);
      expect(anim.fadeInParts[0].fadeIn).toBe(true);
    });

    it('matches tokens, never recreates them: matched mobjects are not in the fade lists', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      const fadeMobs = new Set([
        ...anim.fadeInParts.map((p) => p.mobject),
        ...anim.fadeOutParts.map((p) => p.mobject),
      ]);
      for (const matched of anim.matchedParts) {
        expect(fadeMobs.has(matched.mobject)).toBe(false);
      }
    });

    it('hides the source and target blocks so only token mobjects show', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      expect(source.opacity).toBe(0);
      expect(target.opacity).toBe(0);
    });
  });

  describe('scene attachment', () => {
    // Regression: a Code block added directly to a Scene has no Mobject parent
    // (a Scene is not a Mobject). The token mobjects used to be added to
    // `source.parent`, which is null in that case, so nothing was ever attached
    // and the animation rendered a blank frame. The tokens must attach to the
    // source itself so they are in the scene graph and render.
    it('attaches every token mobject to the source when the source has no parent', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      const all = [
        ...anim.matchedParts.map((p) => p.mobject),
        ...anim.fadeInParts.map((p) => p.mobject),
        ...anim.fadeOutParts.map((p) => p.mobject),
      ];
      expect(all.length).toBeGreaterThan(0);
      for (const mobject of all) {
        expect(mobject.parent).toBe(source);
      }
      expect(source.children.length).toBe(all.length);
    });

    it('places token mobjects in the source-local frame when the source is moved', () => {
      const source = js('foo');
      source.moveTo([2, -1, 0]);
      const target = js('foo');
      target.moveTo([2, -1, 0]);
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      // The matched token's world position (source-local + source.position)
      // must equal its stored absolute start position, so it renders in place.
      const part = anim.matchedParts[0];
      anim.interpolate(0);
      expect(part.mobject.position.x + source.position.x).toBeCloseTo(part.startPosition[0], 6);
      expect(part.mobject.position.y + source.position.y).toBeCloseTo(part.startPosition[1], 6);
    });
  });

  describe('interpolation', () => {
    it('moves a matched token from its source position to its target position', () => {
      // "foo" shifts down one line, so the matched token actually moves.
      const source = js('foo');
      const target = js('\nfoo');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      expect(anim.matchedParts.length).toBe(1);
      const part = anim.matchedParts[0];
      // The source and target positions differ in Y.
      expect(part.startPosition[1]).not.toBeCloseTo(part.targetPosition[1], 6);

      anim.interpolate(0);
      expect(part.mobject.position.x).toBeCloseTo(part.startPosition[0], 6);
      expect(part.mobject.position.y).toBeCloseTo(part.startPosition[1], 6);

      anim.interpolate(1);
      expect(part.mobject.position.x).toBeCloseTo(part.targetPosition[0], 6);
      expect(part.mobject.position.y).toBeCloseTo(part.targetPosition[1], 6);

      anim.interpolate(0.5);
      expect(part.mobject.position.y).toBeCloseTo(
        (part.startPosition[1] + part.targetPosition[1]) / 2,
        6,
      );
      // A matched token stays fully visible while it moves.
      expect(part.mobject.opacity).toBeCloseTo(1, 6);
    });

    it('fades removed tokens out early and added tokens in late', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();

      const fadeOut = anim.fadeOutParts[0];
      const fadeIn = anim.fadeInParts[0];

      anim.interpolate(0);
      expect(fadeOut.mobject.opacity).toBeCloseTo(fadeOut.startOpacity, 6);
      expect(fadeIn.mobject.opacity).toBeCloseTo(0, 6);

      // Default fadeRatio 0.25: by the midpoint the old token is gone and the
      // new one has not started.
      anim.interpolate(0.5);
      expect(fadeOut.mobject.opacity).toBeCloseTo(0, 6);
      expect(fadeIn.mobject.opacity).toBeCloseTo(0, 6);

      anim.interpolate(1);
      expect(fadeOut.mobject.opacity).toBeCloseTo(0, 6);
      expect(fadeIn.mobject.opacity).toBeCloseTo(fadeIn.targetOpacity, 6);
    });

    it('finish() leaves matched tokens at the target and fades resolved', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target);
      anim.begin();
      anim.finish();

      for (const part of anim.matchedParts) {
        expect(part.mobject.position.x).toBeCloseTo(part.targetPosition[0], 6);
        expect(part.mobject.position.y).toBeCloseTo(part.targetPosition[1], 6);
      }
      expect(anim.fadeOutParts[0].mobject.opacity).toBeCloseTo(0, 6);
      expect(anim.fadeInParts[0].mobject.opacity).toBeCloseTo(anim.fadeInParts[0].targetOpacity, 6);
    });
  });

  describe('options', () => {
    it('clamps fadeRatio into [0, 0.5]', () => {
      expect(new TransformMatchingCode(js('a'), js('a'), { fadeRatio: 2 }).fadeRatio).toBe(0.5);
      expect(new TransformMatchingCode(js('a'), js('a'), { fadeRatio: -1 }).fadeRatio).toBe(0);
      expect(new TransformMatchingCode(js('a'), js('a'), { fadeRatio: 0.3 }).fadeRatio).toBe(0.3);
    });

    it('transformMismatches pairs the leftover tokens instead of fading them', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target, { transformMismatches: true });
      anim.begin();

      expect(anim.mismatchedParts.length).toBe(1);
      expect(anim.fadeOutParts.length).toBe(0);
      expect(anim.fadeInParts.length).toBe(0);
    });

    it('fadeTransformMismatches cross-fades the mismatched pair', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target, {
        transformMismatches: true,
        fadeTransformMismatches: true,
      });
      anim.begin();

      const pair = anim.mismatchedParts[0];
      // Cross-fade dips to zero at the halfway point.
      anim.interpolate(0.5);
      expect(pair.mobject.opacity).toBeCloseTo(0, 6);
      anim.interpolate(1);
      expect(pair.mobject.opacity).toBeGreaterThan(0.9);
    });

    it('without fadeTransformMismatches the mismatched pair stays visible', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      const anim = new TransformMatchingCode(source, target, { transformMismatches: true });
      anim.begin();

      const pair = anim.mismatchedParts[0];
      anim.interpolate(0.5);
      expect(pair.mobject.opacity).toBeGreaterThan(0.9);
    });

    it('a custom keyFunc overrides the default token key', () => {
      const source = js('x = 1');
      const target = js('x = 2');
      // Key everything the same: all five source tokens match five target tokens.
      const anim = new TransformMatchingCode(source, target, {
        keyFunc: (_token: CodeToken) => 'SAME',
      });
      anim.begin();

      expect(anim.matchedParts.length).toBe(5);
      expect(anim.fadeInParts.length).toBe(0);
      expect(anim.fadeOutParts.length).toBe(0);
    });

    it('matchBy "line" matches whole lines', () => {
      const source = js('a\nb');
      const target = js('a\nc');
      const anim = new TransformMatchingCode(source, target, { matchBy: 'line' });
      anim.begin();

      // Line "a" unchanged; line "b" removed; line "c" added.
      expect(anim.matchedParts.length).toBe(1);
      expect(anim.fadeOutParts.length).toBe(1);
      expect(anim.fadeInParts.length).toBe(1);
    });
  });

  describe('factory', () => {
    it('transformMatchingCode returns a TransformMatchingCode with the given target', () => {
      const source = js('a');
      const target = js('b');
      const anim = transformMatchingCode(source, target);
      expect(anim).toBeInstanceOf(TransformMatchingCode);
      expect(anim.target).toBe(target);
    });
  });
});

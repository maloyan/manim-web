/**
 * Tests for kinetic-typography preset animations.
 *
 * The presets stagger per-glyph animations over a Text's glyph submobjects.
 * A plain Text has no glyph children, so the presets fall back to animating
 * the whole mobject as a single glyph. Tests build a VGroup of per-glyph Text
 * mobjects to exercise the multi-glyph staggering paths.
 */

import { describe, it, expect } from 'vitest';
import { VGroup } from '../../core/VGroup';
import { Text } from '../../mobjects/text/Text';
import { AnimationGroup } from '../AnimationGroup';
import {
  resolveGlyphs,
  typeOn,
  fadeInByLetter,
  fadeInByWord,
  riseByLetter,
  scalePopByLetter,
  waveLetters,
  tracking,
  spreadOut,
  glitchIn,
  WaveLetters,
  LetterSpacing,
  GlitchIn,
} from './kineticTypography';

/** Build a VGroup of n single-letter Text glyphs, laid out left to right. */
function makeGlyphGroup(n: number): VGroup {
  const group = new VGroup();
  for (let i = 0; i < n; i++) {
    const glyph = new Text({ text: 'x' });
    glyph.position.set(i, 0, 0);
    group.add(glyph);
  }
  return group;
}

describe('resolveGlyphs', () => {
  it('returns the children when the mobject has submobjects', () => {
    const group = makeGlyphGroup(3);
    expect(resolveGlyphs(group)).toHaveLength(3);
  });

  it('falls back to the mobject itself when there are no children', () => {
    const text = new Text({ text: 'solo' });
    const glyphs = resolveGlyphs(text);
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0]).toBe(text);
  });
});

describe('typeOn', () => {
  it('covers every glyph with a sub-animation', () => {
    const group = makeGlyphGroup(5);
    const anim = typeOn(group) as AnimationGroup;
    expect(anim.animations).toHaveLength(5);
  });

  it('reveals glyphs sequentially (glyph k after glyph k-1)', () => {
    const group = makeGlyphGroup(4);
    const anim = typeOn(group, { lagRatio: 1 });
    anim.begin();
    anim.interpolate(0.3);
    const glyphs = group.submobjects;
    // Sequential: earlier glyphs are at least as visible as later ones.
    expect(glyphs[0].opacity).toBeGreaterThanOrEqual(glyphs[1].opacity);
    expect(glyphs[1].opacity).toBeGreaterThanOrEqual(glyphs[2].opacity);
    expect(glyphs[2].opacity).toBeGreaterThanOrEqual(glyphs[3].opacity);
  });

  it('interpolate(0) hides all glyphs, interpolate(1) shows all glyphs', () => {
    const group = makeGlyphGroup(4);
    const anim = typeOn(group);
    anim.begin();
    anim.interpolate(0);
    for (const g of group.submobjects) expect(g.opacity).toBeCloseTo(0);
    anim.interpolate(1);
    for (const g of group.submobjects) expect(g.opacity).toBeCloseTo(1);
  });
});

describe('fadeInByLetter', () => {
  it('staggers sub-animations: earlier glyph is further along at a given time', () => {
    const group = makeGlyphGroup(4);
    const anim = fadeInByLetter(group, { lagRatio: 0.5 });
    anim.begin();
    anim.interpolate(0.3);
    const [g0, g1, g2] = group.submobjects;
    expect(g0.opacity).toBeGreaterThan(g1.opacity);
    expect(g1.opacity).toBeGreaterThanOrEqual(g2.opacity);
  });

  it('interpolate(1) brings all glyphs to full opacity', () => {
    const group = makeGlyphGroup(3);
    const anim = fadeInByLetter(group);
    anim.begin();
    anim.interpolate(1);
    for (const g of group.submobjects) expect(g.opacity).toBeCloseTo(1);
  });
});

describe('fadeInByWord', () => {
  it('reveals glyphs of the same word together, before the next word', () => {
    const group = new VGroup();
    for (let i = 0; i < 4; i++) group.add(new Text({ text: 'x' }));
    // getText() = "ab cd" -> two words of two glyphs each, matching 4 children.
    const parent = new Text({ text: 'ab cd' });
    for (const g of group.submobjects) parent.add(g);

    const anim = fadeInByWord(parent, { lagRatio: 0.8 });
    anim.begin();
    anim.interpolate(0.25);
    const glyphs = parent.submobjects;
    // First word glyphs advance in parallel (equal opacity).
    expect(glyphs[0].opacity).toBeCloseTo(glyphs[1].opacity);
    // First word is ahead of the second word.
    expect(glyphs[0].opacity).toBeGreaterThan(glyphs[2].opacity);
  });

  it('does not throw and covers the whole text when words cannot be mapped', () => {
    const text = new Text({ text: 'hello' });
    const anim = fadeInByWord(text);
    expect(() => {
      anim.begin();
      anim.interpolate(1);
    }).not.toThrow();
    expect(text.opacity).toBeCloseTo(1);
  });
});

describe('riseByLetter', () => {
  it('starts glyphs below target and settles them at their base position', () => {
    const group = makeGlyphGroup(3);
    const baseY = group.submobjects.map((g) => g.position.y);
    const anim = riseByLetter(group, { distance: 0.5 });
    anim.begin();
    anim.interpolate(0);
    // Each glyph starts displaced below its target.
    group.submobjects.forEach((g, i) => {
      expect(g.position.y).toBeLessThan(baseY[i]);
      expect(g.opacity).toBeCloseTo(0);
    });
    anim.interpolate(1);
    group.submobjects.forEach((g, i) => {
      expect(g.position.y).toBeCloseTo(baseY[i]);
      expect(g.opacity).toBeCloseTo(1);
    });
  });

  it('honors a custom direction', () => {
    const group = makeGlyphGroup(2);
    const baseX = group.submobjects.map((g) => g.position.x);
    const anim = riseByLetter(group, { distance: 1, direction: [1, 0, 0] });
    anim.begin();
    anim.interpolate(0);
    group.submobjects.forEach((g, i) => expect(g.position.x).toBeLessThan(baseX[i]));
  });
});

describe('scalePopByLetter', () => {
  it('grows glyphs from zero scale to full scale', () => {
    const group = makeGlyphGroup(3);
    const anim = scalePopByLetter(group);
    anim.begin();
    anim.interpolate(0);
    for (const g of group.submobjects) {
      expect(g.scaleVector.x).toBeCloseTo(0);
      expect(g.opacity).toBeCloseTo(0);
    }
    anim.interpolate(1);
    for (const g of group.submobjects) {
      expect(g.scaleVector.x).toBeCloseTo(1);
      expect(g.opacity).toBeCloseTo(1);
    }
  });
});

describe('waveLetters', () => {
  it('returns to base at interpolate(0) and interpolate(1)', () => {
    const group = makeGlyphGroup(4);
    const base = group.submobjects.map((g) => g.position.y);
    const anim = waveLetters(group, { amplitude: 1 });
    anim.begin();
    anim.interpolate(0);
    group.submobjects.forEach((g, i) => expect(g.position.y).toBeCloseTo(base[i]));
    anim.interpolate(1);
    group.submobjects.forEach((g, i) => expect(g.position.y).toBeCloseTo(base[i]));
  });

  it('gives different glyphs different offsets at a mid time', () => {
    const group = makeGlyphGroup(4);
    const base = group.submobjects.map((g) => g.position.y);
    const anim = waveLetters(group, { amplitude: 1, waves: 2 });
    anim.begin();
    anim.interpolate(0.2);
    const offsets = group.submobjects.map((g, i) => g.position.y - base[i]);
    // Adjacent glyphs are out of phase, so their offsets differ.
    expect(offsets[0]).not.toBeCloseTo(offsets[1]);
    expect(offsets[1]).not.toBeCloseTo(offsets[2]);
  });

  it('is a WaveLetters instance', () => {
    expect(waveLetters(makeGlyphGroup(2))).toBeInstanceOf(WaveLetters);
  });
});

describe('spreadOut / tracking', () => {
  it('spreadOut keeps base spacing at alpha 0 and widens it at alpha 1', () => {
    const group = makeGlyphGroup(4);
    const base = group.submobjects.map((g) => g.position.x);
    const anim = spreadOut(group, { spacing: 0.5 });
    anim.begin();
    anim.interpolate(0);
    group.submobjects.forEach((g, i) => expect(g.position.x).toBeCloseTo(base[i]));
    anim.interpolate(1);
    const spread = group.submobjects.map((g) => g.position.x);
    // Outermost glyphs move further apart than the inner ones.
    const widthBase = base[3] - base[0];
    const widthSpread = spread[3] - spread[0];
    expect(widthSpread).toBeGreaterThan(widthBase);
  });

  it('tracking is a LetterSpacing instance and ends at the target spacing', () => {
    const group = makeGlyphGroup(3);
    const anim = tracking(group, { from: 0, spacing: 0.4 });
    expect(anim).toBeInstanceOf(LetterSpacing);
    anim.begin();
    const base = group.submobjects.map((g) => g.position.x);
    anim.interpolate(1);
    // Center glyph (index 1 of 3) stays put; edges move symmetrically.
    expect(group.submobjects[1].position.x).toBeCloseTo(base[1]);
  });
});

describe('glitchIn', () => {
  it('is deterministic: same offsets across two runs', () => {
    const a = makeGlyphGroup(4);
    const b = makeGlyphGroup(4);
    const animA = glitchIn(a, { amplitude: 1 });
    const animB = glitchIn(b, { amplitude: 1 });
    animA.begin();
    animB.begin();
    animA.interpolate(0.3);
    animB.interpolate(0.3);
    a.submobjects.forEach((g, i) => {
      expect(g.position.x).toBeCloseTo(b.submobjects[i].position.x);
      expect(g.position.y).toBeCloseTo(b.submobjects[i].position.y);
    });
  });

  it('settles to base position and full opacity at interpolate(1)', () => {
    const group = makeGlyphGroup(3);
    const base = group.submobjects.map((g) => g.position.clone());
    const anim = glitchIn(group, { amplitude: 1 });
    anim.begin();
    anim.interpolate(0);
    for (const g of group.submobjects) expect(g.opacity).toBeCloseTo(0);
    anim.interpolate(1);
    group.submobjects.forEach((g, i) => {
      expect(g.position.x).toBeCloseTo(base[i].x);
      expect(g.position.y).toBeCloseTo(base[i].y);
      expect(g.opacity).toBeCloseTo(1);
    });
  });

  it('is a GlitchIn instance', () => {
    expect(glitchIn(makeGlyphGroup(2))).toBeInstanceOf(GlitchIn);
  });
});

describe('empty and single-glyph text', () => {
  const presets = [
    typeOn,
    fadeInByLetter,
    fadeInByWord,
    riseByLetter,
    scalePopByLetter,
    waveLetters,
    tracking,
    spreadOut,
    glitchIn,
  ];

  it('handles empty text without throwing', () => {
    for (const preset of presets) {
      const text = new Text({ text: '' });
      expect(() => {
        const anim = preset(text);
        anim.begin();
        anim.interpolate(0);
        anim.interpolate(1);
      }, preset.name).not.toThrow();
    }
  });

  it('handles single-glyph text without throwing', () => {
    for (const preset of presets) {
      const text = new Text({ text: 'a' });
      expect(() => {
        const anim = preset(text);
        anim.begin();
        anim.interpolate(1);
      }, preset.name).not.toThrow();
    }
  });
});

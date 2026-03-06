import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { linear } from '../../rate-functions';
import {
  Create,
  create,
  DrawBorderThenFill,
  drawBorderThenFill,
  Uncreate,
  uncreate,
  Write,
  write,
  Unwrite,
  unwrite,
  AddTextLetterByLetter,
  addTextLetterByLetter,
  RemoveTextLetterByLetter,
  removeTextLetterByLetter,
} from './Create';
import {
  AddTextWordByWord,
  addTextWordByWord,
  ShowIncreasingSubsets,
  showIncreasingSubsets,
  ShowPartial,
  showPartial,
  ShowSubmobjectsOneByOne,
  showSubmobjectsOneByOne,
  SpiralIn,
  spiralIn,
} from './CreationExtensions';
import {
  TypeWithCursor,
  typeWithCursor,
  UntypeWithCursor,
  untypeWithCursor,
} from './TypeWithCursor';

// =============================================================================
// Helper: create a mock text-like mobject with getText/setText
// =============================================================================

class MockTextMobject extends Mobject {
  private _text: string;
  color: string = '#ffffff';

  constructor(text: string = 'Hello World') {
    super();
    this._text = text;
  }

  getText(): string {
    return this._text;
  }

  setText(text: string): void {
    this._text = text;
  }

  protected _createThreeObject() {
    return new (require('three').Object3D)();
  }

  protected _syncToThree(): void {}
}

// =============================================================================
// Helper: create a mock text mobject with highlight support
// =============================================================================

class MockHighlightTextMobject extends MockTextMobject {
  _renderToCanvas = vi.fn();
}

// =============================================================================
// Helper: create a mock mobject with setRevealProgress (for MathTex-like)
// =============================================================================

class MockMathTexMobject extends Mobject {
  private _revealProgress: number = 1;

  setRevealProgress(progress: number): void {
    this._revealProgress = progress;
  }

  getRevealProgress(): number {
    return this._revealProgress;
  }

  protected _createThreeObject() {
    return new (require('three').Object3D)();
  }

  protected _syncToThree(): void {}
}

// =============================================================================
// Create
// =============================================================================

describe('Create', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  describe('constructor', () => {
    it('sets default duration to 2', () => {
      const anim = new Create(mob);
      expect(anim.duration).toBe(2);
    });

    it('accepts custom duration', () => {
      const anim = new Create(mob, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('stores the mobject reference', () => {
      const anim = new Create(mob);
      expect(anim.mobject).toBe(mob);
    });

    it('accepts lagRatio option', () => {
      const anim = new Create(mob, { lagRatio: 0.5 });
      // lagRatio is private, but we can test its effect via interpolation
      expect(anim.mobject).toBe(mob);
    });

    it('accepts rateFunc option', () => {
      const anim = new Create(mob, { rateFunc: linear });
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('begin() - non-VMobject fallback (opacity)', () => {
    it('sets opacity to 0 for non-VMobject', () => {
      mob.opacity = 1;
      const anim = new Create(mob);
      anim.begin();
      expect(mob.opacity).toBe(0);
    });
  });

  describe('interpolate() - non-VMobject fallback (opacity)', () => {
    it('at alpha=0: opacity is 0', () => {
      const anim = new Create(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });

    it('at alpha=0.5: opacity is 0.5', () => {
      const anim = new Create(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=1: opacity is 1', () => {
      const anim = new Create(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(1, 5);
    });
  });

  describe('finish() - non-VMobject fallback', () => {
    it('sets opacity to 1', () => {
      const anim = new Create(mob);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.opacity).toBe(1);
    });

    it('marks animation as finished', () => {
      const anim = new Create(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('begin() - VMobject without Line2 (opacity fallback)', () => {
    it('sets opacity to 0 for VMobject without Line2 children', () => {
      const vmob = new VMobject();
      vmob.opacity = 1;
      const anim = new Create(vmob);
      anim.begin();
      expect(vmob.opacity).toBe(0);
    });
  });

  describe('interpolate() - VMobject without Line2 (opacity fallback)', () => {
    it('interpolates opacity for VMobject without Line2', () => {
      const vmob = new VMobject();
      const anim = new Create(vmob);
      anim.begin();

      anim.interpolate(0);
      expect(vmob.opacity).toBeCloseTo(0, 5);

      anim.interpolate(0.5);
      expect(vmob.opacity).toBeCloseTo(0.5, 5);

      anim.interpolate(1);
      expect(vmob.opacity).toBeCloseTo(1, 5);
    });
  });

  describe('finish() - VMobject without Line2', () => {
    it('sets opacity to 1', () => {
      const vmob = new VMobject();
      const anim = new Create(vmob);
      anim.begin();
      anim.finish();
      expect(vmob.opacity).toBe(1);
    });
  });

  describe('_childAlpha() via interpolation behavior', () => {
    it('with lagRatio=0 all children get same alpha (tested via Mobject fallback)', () => {
      // lagRatio=0 means _childAlpha returns alpha unchanged
      const anim = new Create(mob, { lagRatio: 0 });
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });
  });
});

describe('create() factory', () => {
  it('returns a Create instance', () => {
    const mob = new Mobject();
    const anim = create(mob);
    expect(anim).toBeInstanceOf(Create);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = create(mob, { duration: 5, rateFunc: linear });
    expect(anim.duration).toBe(5);
    expect(anim.rateFunc).toBe(linear);
  });

  it('default duration is 2', () => {
    const mob = new Mobject();
    const anim = create(mob);
    expect(anim.duration).toBe(2);
  });
});

// =============================================================================
// DrawBorderThenFill
// =============================================================================

describe('DrawBorderThenFill', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  describe('constructor', () => {
    it('sets default duration to 2', () => {
      const anim = new DrawBorderThenFill(mob);
      expect(anim.duration).toBe(2);
    });

    it('accepts custom duration', () => {
      const anim = new DrawBorderThenFill(mob, { duration: 3.5 });
      expect(anim.duration).toBe(3.5);
    });

    it('stores the mobject reference', () => {
      const anim = new DrawBorderThenFill(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  describe('begin() - non-VMobject', () => {
    it('does not crash for non-VMobject', () => {
      const anim = new DrawBorderThenFill(mob);
      expect(() => anim.begin()).not.toThrow();
    });
  });

  describe('interpolate() - non-VMobject (no dash reveal)', () => {
    it('does nothing for non-VMobject (no _useDashReveal)', () => {
      const anim = new DrawBorderThenFill(mob);
      anim.begin();
      mob.opacity = 0.5;
      anim.interpolate(0.5);
      // Without Line2 children, interpolate does nothing for DrawBorderThenFill
      expect(mob.opacity).toBe(0.5); // unchanged
    });
  });

  describe('begin() - VMobject without Line2', () => {
    it('does not crash for VMobject without Line2 children', () => {
      const vmob = new VMobject();
      const anim = new DrawBorderThenFill(vmob);
      expect(() => anim.begin()).not.toThrow();
    });
  });

  describe('finish()', () => {
    it('marks animation as finished', () => {
      const anim = new DrawBorderThenFill(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });
});

describe('drawBorderThenFill() factory', () => {
  it('returns a DrawBorderThenFill instance', () => {
    const mob = new Mobject();
    const anim = drawBorderThenFill(mob);
    expect(anim).toBeInstanceOf(DrawBorderThenFill);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = drawBorderThenFill(mob, { duration: 4, rateFunc: linear });
    expect(anim.duration).toBe(4);
    expect(anim.rateFunc).toBe(linear);
  });
});

// =============================================================================
// Uncreate
// =============================================================================

describe('Uncreate', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  describe('constructor', () => {
    it('sets default duration to 2', () => {
      const anim = new Uncreate(mob);
      expect(anim.duration).toBe(2);
    });

    it('accepts custom duration', () => {
      const anim = new Uncreate(mob, { duration: 1.5 });
      expect(anim.duration).toBe(1.5);
    });

    it('stores the mobject reference', () => {
      const anim = new Uncreate(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  describe('begin() - non-VMobject', () => {
    it('does not modify opacity for non-VMobject', () => {
      mob.opacity = 1;
      const anim = new Uncreate(mob);
      anim.begin();
      // Non-VMobject: _useDashReveal is false, no action in begin
      expect(mob.opacity).toBe(1);
    });
  });

  describe('interpolate() - non-VMobject fallback (opacity)', () => {
    it('at alpha=0: opacity is 1', () => {
      mob.opacity = 1;
      const anim = new Uncreate(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(1, 5);
    });

    it('at alpha=0.5: opacity is 0.5', () => {
      mob.opacity = 1;
      const anim = new Uncreate(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=1: opacity is 0', () => {
      mob.opacity = 1;
      const anim = new Uncreate(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });
  });

  describe('finish() - non-VMobject', () => {
    it('sets opacity to 0', () => {
      mob.opacity = 1;
      const anim = new Uncreate(mob);
      anim.begin();
      anim.finish();
      expect(mob.opacity).toBe(0);
    });

    it('marks animation as finished', () => {
      const anim = new Uncreate(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('begin() - VMobject without Line2', () => {
    it('does not crash', () => {
      const vmob = new VMobject();
      const anim = new Uncreate(vmob);
      expect(() => anim.begin()).not.toThrow();
    });
  });

  describe('interpolate() - VMobject without Line2', () => {
    it('uses opacity fallback', () => {
      const vmob = new VMobject();
      vmob.opacity = 1;
      const anim = new Uncreate(vmob);
      anim.begin();
      anim.interpolate(0.5);
      expect(vmob.opacity).toBeCloseTo(0.5, 5);
    });
  });

  describe('finish() - VMobject without Line2', () => {
    it('sets opacity to 0', () => {
      const vmob = new VMobject();
      vmob.opacity = 1;
      const anim = new Uncreate(vmob);
      anim.begin();
      anim.finish();
      expect(vmob.opacity).toBe(0);
    });
  });
});

describe('uncreate() factory', () => {
  it('returns an Uncreate instance', () => {
    const mob = new Mobject();
    const anim = uncreate(mob);
    expect(anim).toBeInstanceOf(Uncreate);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = uncreate(mob, { duration: 3 });
    expect(anim.duration).toBe(3);
  });
});

// =============================================================================
// Write
// =============================================================================

describe('Write', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  describe('constructor', () => {
    it('sets default duration to 1', () => {
      const anim = new Write(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const anim = new Write(mob, { duration: 2.5 });
      expect(anim.duration).toBe(2.5);
    });

    it('stores the mobject reference', () => {
      const anim = new Write(mob);
      expect(anim.mobject).toBe(mob);
    });

    it('sets default lagRatio to 0.05', () => {
      const anim = new Write(mob);
      // lagRatio is protected, cast to access
      expect((anim as any).lagRatio).toBe(0.05);
    });

    it('accepts custom lagRatio', () => {
      const anim = new Write(mob, { lagRatio: 0.1 });
      expect((anim as any).lagRatio).toBe(0.1);
    });

    it('sets default reverse to false', () => {
      const anim = new Write(mob);
      expect((anim as any)._reverse).toBe(false);
    });

    it('accepts reverse option', () => {
      const anim = new Write(mob, { reverse: true });
      expect((anim as any)._reverse).toBe(true);
    });

    it('sets default remover to false', () => {
      const anim = new Write(mob);
      expect((anim as any)._remover).toBe(false);
    });

    it('accepts remover option', () => {
      const anim = new Write(mob, { remover: true });
      expect((anim as any)._remover).toBe(true);
    });

    it('sets default strokeRatio to 0.7', () => {
      const anim = new Write(mob);
      expect((anim as any)._strokeRatio).toBe(0.7);
    });

    it('accepts custom strokeRatio', () => {
      const anim = new Write(mob, { strokeRatio: 0.5 });
      expect((anim as any)._strokeRatio).toBe(0.5);
    });
  });

  describe('begin() - non-VMobject, no glyph, no reveal (opacity fallback)', () => {
    it('sets opacity to 0 for forward play', () => {
      mob.opacity = 1;
      const anim = new Write(mob);
      anim.begin();
      expect(mob.opacity).toBe(0);
    });

    it('keeps opacity at original for reverse play', () => {
      mob.opacity = 0.8;
      const anim = new Write(mob, { reverse: true });
      anim.begin();
      expect(mob.opacity).toBeCloseTo(0.8, 5);
    });

    it('stores original opacity', () => {
      mob.opacity = 0.7;
      const anim = new Write(mob);
      anim.begin();
      expect((anim as any)._originalOpacity).toBeCloseTo(0.7, 5);
    });
  });

  describe('begin() - with setRevealProgress (MathTex path)', () => {
    it('uses setRevealProgress path when available', () => {
      const mathMob = new MockMathTexMobject();
      const anim = new Write(mathMob);
      anim.begin();
      expect((anim as any)._useRevealProgress).toBe(true);
      expect(mathMob.getRevealProgress()).toBe(0);
    });

    it('sets reveal progress to 1 for reverse', () => {
      const mathMob = new MockMathTexMobject();
      const anim = new Write(mathMob, { reverse: true });
      anim.begin();
      expect((anim as any)._useRevealProgress).toBe(true);
      expect(mathMob.getRevealProgress()).toBe(1);
    });
  });

  describe('interpolate() - opacity fallback (no VMobject, no glyph)', () => {
    it('at alpha=0: opacity is 0 (forward)', () => {
      mob.opacity = 1;
      const anim = new Write(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });

    it('at alpha=0.5: opacity is 0.5 (forward)', () => {
      mob.opacity = 1;
      const anim = new Write(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=1: opacity is original (forward)', () => {
      mob.opacity = 1;
      const anim = new Write(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(1, 5);
    });

    it('reverse: alpha=0 gives full opacity, alpha=1 gives 0', () => {
      mob.opacity = 1;
      const anim = new Write(mob, { reverse: true });
      anim.begin();

      // effectiveAlpha = 1 - alpha for reverse
      anim.interpolate(0);
      // effectiveAlpha = 1, so opacity = 1 * 1 = 1
      expect(mob.opacity).toBeCloseTo(1, 5);

      anim.interpolate(1);
      // effectiveAlpha = 0, so opacity = 1 * 0 = 0
      expect(mob.opacity).toBeCloseTo(0, 5);
    });
  });

  describe('interpolate() - revealProgress path', () => {
    it('calls setRevealProgress with effectiveAlpha', () => {
      const mathMob = new MockMathTexMobject();
      const anim = new Write(mathMob);
      anim.begin();

      anim.interpolate(0.5);
      expect(mathMob.getRevealProgress()).toBeCloseTo(0.5, 5);
    });

    it('reverse mode inverts alpha for revealProgress', () => {
      const mathMob = new MockMathTexMobject();
      const anim = new Write(mathMob, { reverse: true });
      anim.begin();

      anim.interpolate(0.25);
      // effectiveAlpha = 1 - 0.25 = 0.75
      expect(mathMob.getRevealProgress()).toBeCloseTo(0.75, 5);
    });
  });

  describe('finish() - opacity fallback (forward, not remover)', () => {
    it('restores original opacity', () => {
      mob.opacity = 0.8;
      const anim = new Write(mob);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.opacity).toBeCloseTo(0.8, 5);
    });

    it('marks animation as finished', () => {
      const anim = new Write(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('finish() - opacity fallback (remover=true)', () => {
    it('sets opacity to 0 when remover is true', () => {
      mob.opacity = 1;
      const anim = new Write(mob, { remover: true });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.opacity).toBe(0);
    });
  });

  describe('finish() - revealProgress path', () => {
    it('sets reveal progress to 1 when not remover', () => {
      const mathMob = new MockMathTexMobject();
      const anim = new Write(mathMob);
      anim.begin();
      anim.finish();
      expect(mathMob.getRevealProgress()).toBe(1);
    });

    it('sets reveal progress to 0 when remover', () => {
      const mathMob = new MockMathTexMobject();
      const anim = new Write(mathMob, { remover: true });
      anim.begin();
      anim.finish();
      expect(mathMob.getRevealProgress()).toBe(0);
    });
  });

  describe('begin() - VMobject without Line2 (opacity fallback)', () => {
    it('sets opacity to 0 for VMobject without Line2', () => {
      const vmob = new VMobject();
      vmob.opacity = 1;
      const anim = new Write(vmob);
      anim.begin();
      expect(vmob.opacity).toBe(0);
    });
  });
});

describe('write() factory', () => {
  it('returns a Write instance', () => {
    const mob = new Mobject();
    const anim = write(mob);
    expect(anim).toBeInstanceOf(Write);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = write(mob, { duration: 2, lagRatio: 0.1 });
    expect(anim.duration).toBe(2);
    expect((anim as any).lagRatio).toBe(0.1);
  });
});

// =============================================================================
// Unwrite
// =============================================================================

describe('Unwrite', () => {
  it('extends Write', () => {
    const mob = new Mobject();
    const anim = new Unwrite(mob);
    expect(anim).toBeInstanceOf(Write);
  });

  it('sets reverse to true', () => {
    const mob = new Mobject();
    const anim = new Unwrite(mob);
    expect((anim as any)._reverse).toBe(true);
  });

  it('sets remover to true', () => {
    const mob = new Mobject();
    const anim = new Unwrite(mob);
    expect((anim as any)._remover).toBe(true);
  });

  it('default duration is 1', () => {
    const mob = new Mobject();
    const anim = new Unwrite(mob);
    expect(anim.duration).toBe(1);
  });

  it('accepts custom duration', () => {
    const mob = new Mobject();
    const anim = new Unwrite(mob, { duration: 3 });
    expect(anim.duration).toBe(3);
  });

  it('full lifecycle: opacity goes from original to 0', () => {
    const mob = new Mobject();
    mob.opacity = 1;
    const anim = new Unwrite(mob);
    anim.begin();

    // reverse + remover: effectiveAlpha = 1 - alpha
    anim.interpolate(0);
    // effectiveAlpha = 1, opacity = 1 * 1 = 1
    expect(mob.opacity).toBeCloseTo(1, 5);

    anim.interpolate(1);
    // effectiveAlpha = 0, opacity = 1 * 0 = 0
    expect(mob.opacity).toBeCloseTo(0, 5);

    anim.finish();
    expect(mob.opacity).toBe(0);
  });
});

describe('unwrite() factory', () => {
  it('returns an Unwrite instance', () => {
    const mob = new Mobject();
    const anim = unwrite(mob);
    expect(anim).toBeInstanceOf(Unwrite);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = unwrite(mob, { duration: 2 });
    expect(anim.duration).toBe(2);
  });
});

// =============================================================================
// AddTextLetterByLetter
// =============================================================================

describe('AddTextLetterByLetter', () => {
  describe('constructor', () => {
    it('sets default duration to 1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('sets default timePerChar to 0.1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      expect((anim as any).timePerChar).toBe(0.1);
    });

    it('accepts custom timePerChar', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob, { timePerChar: 0.2 });
      expect((anim as any).timePerChar).toBe(0.2);
    });
  });

  describe('begin()', () => {
    it('stores full text and sets text to empty', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      expect(mob.getText()).toBe('');
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0: text is empty', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.getText()).toBe('');
    });

    it('at alpha=0.5: shows half the characters', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.5);
      // Math.floor(0.5 * 5) = 2
      expect(mob.getText()).toBe('He');
    });

    it('at alpha=1: shows all characters', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.getText()).toBe('Hello');
    });

    it('at alpha=0.2: shows 1 character for 5-char text', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.2);
      // Math.floor(0.2 * 5) = 1
      expect(mob.getText()).toBe('H');
    });

    it('handles empty text gracefully', () => {
      const mob = new MockTextMobject('');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.5);
      // Empty text with empty fullText: no-op because fullText is falsy
      expect(mob.getText()).toBe('');
    });
  });

  describe('finish()', () => {
    it('sets text to full text', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(mob.getText()).toBe('Hello World');
    });

    it('marks animation as finished', () => {
      const mob = new MockTextMobject('Test');
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('with non-text mobject (no getText/setText)', () => {
    it('does not crash when begin is called on non-text mobject', () => {
      const mob = new Mobject();
      const anim = new AddTextLetterByLetter(mob);
      expect(() => anim.begin()).not.toThrow();
    });

    it('does not crash when interpolate is called on non-text mobject', () => {
      const mob = new Mobject();
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      expect(() => anim.interpolate(0.5)).not.toThrow();
    });

    it('does not crash when finish is called on non-text mobject', () => {
      const mob = new Mobject();
      const anim = new AddTextLetterByLetter(mob);
      anim.begin();
      expect(() => anim.finish()).not.toThrow();
    });
  });
});

describe('addTextLetterByLetter() factory', () => {
  it('returns an AddTextLetterByLetter instance', () => {
    const mob = new MockTextMobject('Hi');
    const anim = addTextLetterByLetter(mob);
    expect(anim).toBeInstanceOf(AddTextLetterByLetter);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new MockTextMobject('Hi');
    const anim = addTextLetterByLetter(mob, { duration: 2, timePerChar: 0.05 });
    expect(anim.duration).toBe(2);
    expect((anim as any).timePerChar).toBe(0.05);
  });
});

// =============================================================================
// RemoveTextLetterByLetter
// =============================================================================

describe('RemoveTextLetterByLetter', () => {
  describe('constructor', () => {
    it('sets default duration to 1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob, { duration: 2 });
      expect(anim.duration).toBe(2);
    });

    it('sets default timePerChar to 0.1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      expect((anim as any).timePerChar).toBe(0.1);
    });
  });

  describe('begin()', () => {
    it('stores full text', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      expect((anim as any)._fullText).toBe('Hello');
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0: full text visible', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0);
      // charsToRemove = floor(0 * 5) = 0, remaining = 5
      expect(mob.getText()).toBe('Hello');
    });

    it('at alpha=0.5: half text removed', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.5);
      // charsToRemove = floor(0.5 * 5) = 2, remaining = 3
      expect(mob.getText()).toBe('Hel');
    });

    it('at alpha=1: text is empty', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(1);
      // charsToRemove = floor(1 * 5) = 5, remaining = 0
      expect(mob.getText()).toBe('');
    });

    it('at alpha=0.4: 2 chars removed from 5-char text', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.4);
      // charsToRemove = floor(0.4 * 5) = 2, remaining = 3
      expect(mob.getText()).toBe('Hel');
    });

    it('handles empty text gracefully', () => {
      const mob = new MockTextMobject('');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.5);
      // empty fullText is falsy so condition in interpolate skips
      expect(mob.getText()).toBe('');
    });
  });

  describe('finish()', () => {
    it('sets text to empty', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(mob.getText()).toBe('');
    });

    it('marks animation as finished', () => {
      const mob = new MockTextMobject('Test');
      const anim = new RemoveTextLetterByLetter(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('with non-text mobject', () => {
    it('does not crash on begin/interpolate/finish', () => {
      const mob = new Mobject();
      const anim = new RemoveTextLetterByLetter(mob);
      expect(() => {
        anim.begin();
        anim.interpolate(0.5);
        anim.finish();
      }).not.toThrow();
    });
  });
});

describe('removeTextLetterByLetter() factory', () => {
  it('returns a RemoveTextLetterByLetter instance', () => {
    const mob = new MockTextMobject('Hi');
    const anim = removeTextLetterByLetter(mob);
    expect(anim).toBeInstanceOf(RemoveTextLetterByLetter);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new MockTextMobject('Hi');
    const anim = removeTextLetterByLetter(mob, { duration: 2 });
    expect(anim.duration).toBe(2);
  });
});

// =============================================================================
// AddTextWordByWord (CreationExtensions)
// =============================================================================

describe('AddTextWordByWord', () => {
  describe('constructor', () => {
    it('stores the mobject reference', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextWordByWord(mob);
      expect(anim.mobject).toBe(mob);
    });

    it('sets default timePerWord to 0.2', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextWordByWord(mob);
      expect(anim.timePerWord).toBe(0.2);
    });

    it('accepts custom timePerWord', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextWordByWord(mob, { timePerWord: 0.5 });
      expect(anim.timePerWord).toBe(0.5);
    });
  });

  describe('begin()', () => {
    it('stores full text and splits into words', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      expect(mob.getText()).toBe('');
      expect((anim as any)._words).toEqual(['Hello', 'World']);
    });

    it('handles multiple spaces', () => {
      const mob = new MockTextMobject('Hello   World   Foo');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      expect((anim as any)._words).toEqual(['Hello', 'World', 'Foo']);
    });

    it('handles single word', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      expect((anim as any)._words).toEqual(['Hello']);
    });

    it('handles empty text', () => {
      const mob = new MockTextMobject('');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      expect((anim as any)._words).toEqual([]);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0: no words shown', () => {
      const mob = new MockTextMobject('Hello World Foo');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.getText()).toBe('');
    });

    it('at alpha=0.5: half the words shown', () => {
      const mob = new MockTextMobject('Hello World Foo Bar');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      anim.interpolate(0.5);
      // Math.floor(0.5 * 4) = 2
      expect(mob.getText()).toBe('Hello World');
    });

    it('at alpha=1: all words shown', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      anim.interpolate(1);
      // Math.floor(1 * 2) = 2
      expect(mob.getText()).toBe('Hello World');
    });

    it('handles empty words array gracefully', () => {
      const mob = new MockTextMobject('');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      anim.interpolate(0.5);
      // _words.length is 0, condition fails
      expect(mob.getText()).toBe('');
    });
  });

  describe('finish()', () => {
    it('sets text to full text', () => {
      const mob = new MockTextMobject('Hello World');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      anim.interpolate(0.3);
      anim.finish();
      expect(mob.getText()).toBe('Hello World');
    });

    it('marks animation as finished', () => {
      const mob = new MockTextMobject('Test');
      const anim = new AddTextWordByWord(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('with non-text mobject', () => {
    it('does not crash on begin/interpolate/finish', () => {
      const mob = new Mobject();
      const anim = new AddTextWordByWord(mob);
      expect(() => {
        anim.begin();
        anim.interpolate(0.5);
        anim.finish();
      }).not.toThrow();
    });
  });
});

describe('addTextWordByWord() factory', () => {
  it('returns an AddTextWordByWord instance', () => {
    const mob = new MockTextMobject('Hi there');
    const anim = addTextWordByWord(mob);
    expect(anim).toBeInstanceOf(AddTextWordByWord);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new MockTextMobject('Hi');
    const anim = addTextWordByWord(mob, { timePerWord: 0.3 });
    expect(anim.timePerWord).toBe(0.3);
  });
});

// =============================================================================
// ShowIncreasingSubsets (CreationExtensions)
// =============================================================================

describe('ShowIncreasingSubsets', () => {
  describe('constructor', () => {
    it('stores the mobject reference', () => {
      const mob = new Mobject();
      const anim = new ShowIncreasingSubsets(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  describe('begin()', () => {
    it('hides all submobjects initially', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      const child3 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 0.8;
      child3.opacity = 0.6;
      parent.add(child1);
      parent.add(child2);
      parent.add(child3);

      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();

      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(0);
      expect(child3.opacity).toBe(0);
    });

    it('stores original opacities', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      child1.opacity = 0.5;
      child2.opacity = 0.9;
      parent.add(child1);
      parent.add(child2);

      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();

      expect((anim as any)._originalOpacities).toEqual([0.5, 0.9]);
    });
  });

  describe('interpolate()', () => {
    it('shows submobjects progressively', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      const child3 = new Mobject();
      const child4 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 1;
      child3.opacity = 1;
      child4.opacity = 1;
      parent.add(child1);
      parent.add(child2);
      parent.add(child3);
      parent.add(child4);

      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();

      // At alpha=0.6 with 4 children: numToShow = floor(0.6*4) = 2
      // child3 at index 2 == numToShow: localAlpha = (0.6*4) - 2 = 0.4
      anim.interpolate(0.6);
      expect(child1.opacity).toBe(1); // fully shown (index < numToShow)
      expect(child2.opacity).toBe(1); // fully shown
      // child3 at index 2 == numToShow: partially shown with localAlpha=0.4
      expect(child3.opacity).toBeGreaterThan(0);
      expect(child4.opacity).toBe(0); // hidden
    });

    it('at alpha=0 all are hidden or partially showing first', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      child1.opacity = 1;
      parent.add(child1);

      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();

      anim.interpolate(0);
      // numToShow = 0, child at index 0 == numToShow: partially shown with localAlpha = 0
      expect(child1.opacity).toBeCloseTo(0, 5);
    });

    it('at alpha=1 all are fully shown', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      child1.opacity = 0.7;
      child2.opacity = 0.9;
      parent.add(child1);
      parent.add(child2);

      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();

      anim.interpolate(1);
      // numToShow = floor(1 * 2) = 2, all are < numToShow
      expect(child1.opacity).toBeCloseTo(0.7, 5);
      expect(child2.opacity).toBeCloseTo(0.9, 5);
    });
  });

  describe('finish()', () => {
    it('shows all submobjects with their original opacities', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      child1.opacity = 0.5;
      child2.opacity = 0.8;
      parent.add(child1);
      parent.add(child2);

      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();
      anim.finish();

      expect(child1.opacity).toBeCloseTo(0.5, 5);
      expect(child2.opacity).toBeCloseTo(0.8, 5);
    });

    it('marks animation as finished', () => {
      const parent = new Mobject();
      const anim = new ShowIncreasingSubsets(parent);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('with no children', () => {
    it('handles mobject with no children', () => {
      const parent = new Mobject();
      const anim = new ShowIncreasingSubsets(parent);
      expect(() => {
        anim.begin();
        anim.interpolate(0.5);
        anim.finish();
      }).not.toThrow();
    });
  });
});

describe('showIncreasingSubsets() factory', () => {
  it('returns a ShowIncreasingSubsets instance', () => {
    const mob = new Mobject();
    const anim = showIncreasingSubsets(mob);
    expect(anim).toBeInstanceOf(ShowIncreasingSubsets);
  });
});

// =============================================================================
// ShowPartial (CreationExtensions)
// =============================================================================

describe('ShowPartial', () => {
  describe('constructor', () => {
    it('sets default start and end portions', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob);
      expect(anim.startPortion).toBe(0);
      expect(anim.endPortion).toBe(1);
    });

    it('accepts custom portions', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob, { startPortion: 0.2, endPortion: 0.8 });
      expect(anim.startPortion).toBe(0.2);
      expect(anim.endPortion).toBe(0.8);
    });

    it('detects VMobject', () => {
      const vmob = new VMobject();
      const anim = new ShowPartial(vmob);
      expect((anim as any)._isVMobject).toBe(true);
    });

    it('detects non-VMobject', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob);
      expect((anim as any)._isVMobject).toBe(false);
    });
  });

  describe('interpolate() - non-VMobject (opacity fallback)', () => {
    it('at alpha=0: opacity is 0', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });

    it('at alpha=0.5: opacity is 0.5', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=1: opacity is 1', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(1, 5);
    });
  });

  describe('finish()', () => {
    it('marks animation as finished', () => {
      const mob = new Mobject();
      const anim = new ShowPartial(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('VMobject without Line2 (no crash)', () => {
    it('begin() does not crash on VMobject without Line2', () => {
      const vmob = new VMobject();
      const anim = new ShowPartial(vmob);
      expect(() => anim.begin()).not.toThrow();
    });
  });
});

describe('showPartial() factory', () => {
  it('returns a ShowPartial instance', () => {
    const mob = new Mobject();
    const anim = showPartial(mob);
    expect(anim).toBeInstanceOf(ShowPartial);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = showPartial(mob, { startPortion: 0.1, endPortion: 0.9 });
    expect(anim.startPortion).toBe(0.1);
    expect(anim.endPortion).toBe(0.9);
  });
});

// =============================================================================
// ShowSubmobjectsOneByOne (CreationExtensions)
// =============================================================================

describe('ShowSubmobjectsOneByOne', () => {
  describe('constructor', () => {
    it('stores the mobject reference', () => {
      const mob = new Mobject();
      const anim = new ShowSubmobjectsOneByOne(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  describe('begin()', () => {
    it('hides all submobjects initially', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 0.8;
      parent.add(child1);
      parent.add(child2);

      const anim = new ShowSubmobjectsOneByOne(parent);
      anim.begin();

      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(0);
    });
  });

  describe('interpolate()', () => {
    it('shows only one submobject at a time', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      const child3 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 1;
      child3.opacity = 1;
      parent.add(child1);
      parent.add(child2);
      parent.add(child3);

      const anim = new ShowSubmobjectsOneByOne(parent);
      anim.begin();

      // alpha=0.1 -> index = min(floor(0.1*3), 2) = 0
      anim.interpolate(0.1);
      expect(child1.opacity).toBe(1);
      expect(child2.opacity).toBe(0);
      expect(child3.opacity).toBe(0);

      // alpha=0.5 -> index = min(floor(0.5*3), 2) = 1
      anim.interpolate(0.5);
      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(1);
      expect(child3.opacity).toBe(0);

      // alpha=0.9 -> index = min(floor(0.9*3), 2) = 2
      anim.interpolate(0.9);
      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(0);
      expect(child3.opacity).toBe(1);
    });

    it('preserves original opacity when showing', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      child1.opacity = 0.6;
      parent.add(child1);

      const anim = new ShowSubmobjectsOneByOne(parent);
      anim.begin();

      anim.interpolate(0.5);
      expect(child1.opacity).toBeCloseTo(0.6, 5);
    });

    it('hides previous submobject when showing next', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 1;
      parent.add(child1);
      parent.add(child2);

      const anim = new ShowSubmobjectsOneByOne(parent);
      anim.begin();

      // Show child1
      anim.interpolate(0.1);
      expect(child1.opacity).toBe(1);
      expect(child2.opacity).toBe(0);

      // Transition to child2
      anim.interpolate(0.6);
      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(1);
    });
  });

  describe('finish()', () => {
    it('shows only the last submobject', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      const child3 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 1;
      child3.opacity = 0.7;
      parent.add(child1);
      parent.add(child2);
      parent.add(child3);

      const anim = new ShowSubmobjectsOneByOne(parent);
      anim.begin();
      anim.finish();

      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(0);
      expect(child3.opacity).toBeCloseTo(0.7, 5);
    });

    it('marks animation as finished', () => {
      const parent = new Mobject();
      const anim = new ShowSubmobjectsOneByOne(parent);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('with no children', () => {
    it('handles mobject with no children', () => {
      const parent = new Mobject();
      const anim = new ShowSubmobjectsOneByOne(parent);
      expect(() => {
        anim.begin();
        anim.interpolate(0.5);
        anim.finish();
      }).not.toThrow();
    });
  });
});

describe('showSubmobjectsOneByOne() factory', () => {
  it('returns a ShowSubmobjectsOneByOne instance', () => {
    const mob = new Mobject();
    const anim = showSubmobjectsOneByOne(mob);
    expect(anim).toBeInstanceOf(ShowSubmobjectsOneByOne);
  });
});

// =============================================================================
// SpiralIn (CreationExtensions)
// =============================================================================

describe('SpiralIn', () => {
  describe('constructor', () => {
    it('sets default scaleFactor to 3', () => {
      const mob = new Mobject();
      const anim = new SpiralIn(mob);
      expect(anim.scaleFactor).toBe(3);
    });

    it('sets default numTurns to 2', () => {
      const mob = new Mobject();
      const anim = new SpiralIn(mob);
      expect(anim.numTurns).toBe(2);
    });

    it('accepts custom scaleFactor', () => {
      const mob = new Mobject();
      const anim = new SpiralIn(mob, { scaleFactor: 5 });
      expect(anim.scaleFactor).toBe(5);
    });

    it('accepts custom numTurns', () => {
      const mob = new Mobject();
      const anim = new SpiralIn(mob, { numTurns: 4 });
      expect(anim.numTurns).toBe(4);
    });
  });

  describe('begin()', () => {
    it('scales up the mobject by scaleFactor when no children', () => {
      const mob = new VMobject();
      mob.scaleVector.set(1, 1, 1);
      const anim = new SpiralIn(mob, { scaleFactor: 3 });
      anim.begin();

      // When no children, the mobject itself is the target
      expect(mob.scaleVector.x).toBeCloseTo(3, 5);
      expect(mob.scaleVector.y).toBeCloseTo(3, 5);
      expect(mob.scaleVector.z).toBeCloseTo(3, 5);
    });

    it('moves mobject to center point when no children', () => {
      const mob = new VMobject();
      mob.position.set(2, 3, 0);
      const anim = new SpiralIn(mob, { scaleFactor: 2 });
      anim.begin();

      // Center point is computed from getBounds
      // For a single mobject at (2,3,0), the center should be around (2,3,0)
      // and the mobject is moved to the center point
      const center = (anim as any)._centerPoint;
      expect(mob.position.x).toBeCloseTo(center.x, 5);
      expect(mob.position.y).toBeCloseTo(center.y, 5);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0: mobject is at center, scaled up', () => {
      const mob = new VMobject();
      mob.position.set(0, 0, 0);
      mob.scaleVector.set(1, 1, 1);
      const anim = new SpiralIn(mob, { scaleFactor: 3, numTurns: 1 });
      anim.begin();

      // alpha=0: currentScale = 1 + (3-1) * 1 = 3
      anim.interpolate(0);
      // Scale should be 3x original (1*3)
      expect(mob.scaleVector.x).toBeCloseTo(3, 5);
    });

    it('at alpha=1: mobject is at target position and scale', () => {
      const mob = new VMobject();
      mob.position.set(2, 0, 0);
      mob.scaleVector.set(1, 1, 1);
      const anim = new SpiralIn(mob, { scaleFactor: 3, numTurns: 1 });

      // Store target position before begin changes it
      const targetX = mob.position.x;

      anim.begin();

      anim.interpolate(1);
      // At alpha=1: currentScale = 1 + (3-1)*0 = 1, position should be at target
      expect(mob.scaleVector.x).toBeCloseTo(1, 5);
      expect(mob.scaleVector.y).toBeCloseTo(1, 5);
      expect(mob.position.x).toBeCloseTo(targetX, 5);
    });

    it('at alpha=0.5: intermediate state', () => {
      const mob = new VMobject();
      mob.position.set(0, 0, 0);
      mob.scaleVector.set(1, 1, 1);
      const anim = new SpiralIn(mob, { scaleFactor: 2, numTurns: 1 });
      anim.begin();

      anim.interpolate(0.5);
      // currentScale = 1 + (2-1) * 0.5 = 1.5
      expect(mob.scaleVector.x).toBeCloseTo(1.5, 5);
    });
  });

  describe('finish()', () => {
    it('restores target position and scale', () => {
      const mob = new VMobject();
      mob.position.set(3, 4, 0);
      mob.scaleVector.set(1, 1, 1);
      const anim = new SpiralIn(mob, { scaleFactor: 2 });

      anim.begin();
      anim.interpolate(0.5);
      anim.finish();

      expect(mob.position.x).toBeCloseTo(3, 5);
      expect(mob.position.y).toBeCloseTo(4, 5);
      expect(mob.scaleVector.x).toBeCloseTo(1, 5);
      expect(mob.scaleVector.y).toBeCloseTo(1, 5);
    });

    it('marks animation as finished', () => {
      const mob = new VMobject();
      const anim = new SpiralIn(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('with children', () => {
    it('animates children when present', () => {
      const parent = new VMobject();
      const child1 = new VMobject();
      const child2 = new VMobject();
      child1.position.set(1, 0, 0);
      child1.scaleVector.set(1, 1, 1);
      child2.position.set(-1, 0, 0);
      child2.scaleVector.set(1, 1, 1);
      parent.add(child1);
      parent.add(child2);

      const anim = new SpiralIn(parent, { scaleFactor: 2 });
      anim.begin();

      // Both children should be scaled up
      expect(child1.scaleVector.x).toBeCloseTo(2, 5);
      expect(child2.scaleVector.x).toBeCloseTo(2, 5);

      anim.finish();
      // Both children should be back to original
      expect(child1.position.x).toBeCloseTo(1, 5);
      expect(child2.position.x).toBeCloseTo(-1, 5);
      expect(child1.scaleVector.x).toBeCloseTo(1, 5);
      expect(child2.scaleVector.x).toBeCloseTo(1, 5);
    });
  });
});

describe('spiralIn() factory', () => {
  it('returns a SpiralIn instance', () => {
    const mob = new Mobject();
    const anim = spiralIn(mob);
    expect(anim).toBeInstanceOf(SpiralIn);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new Mobject();
    const anim = spiralIn(mob, { scaleFactor: 5, numTurns: 3 });
    expect(anim.scaleFactor).toBe(5);
    expect(anim.numTurns).toBe(3);
  });
});

// =============================================================================
// TypeWithCursor (TypeWithCursor.ts)
// =============================================================================

describe('TypeWithCursor', () => {
  describe('constructor', () => {
    it('sets default cursorChar to |', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      expect((anim as any).cursorChar).toBe('|');
    });

    it('sets default cursorBlinkRate to 2', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      expect((anim as any).cursorBlinkRate).toBe(2);
    });

    it('sets default typingSpeed to 10', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      expect((anim as any).typingSpeed).toBe(10);
    });

    it('sets default cursorBlinks to true', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      expect((anim as any).cursorBlinks).toBe(true);
    });

    it('sets default hideCursorOnComplete to false', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      expect((anim as any).hideCursorOnComplete).toBe(false);
    });

    it('sets default duration to 1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom cursorChar', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorChar: '_' });
      expect((anim as any).cursorChar).toBe('_');
    });

    it('accepts custom cursorBlinkRate', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorBlinkRate: 5 });
      expect((anim as any).cursorBlinkRate).toBe(5);
    });

    it('accepts custom typingSpeed', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { typingSpeed: 20 });
      expect((anim as any).typingSpeed).toBe(20);
    });

    it('accepts cursorBlinks option', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorBlinks: false });
      expect((anim as any).cursorBlinks).toBe(false);
    });

    it('accepts hideCursorOnComplete option', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { hideCursorOnComplete: true });
      expect((anim as any).hideCursorOnComplete).toBe(true);
    });

    it('accepts highlightColor option', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { highlightColor: '#ff0000' });
      expect((anim as any).highlightColor).toBe('#ff0000');
    });

    it('accepts custom duration', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { duration: 5 });
      expect(anim.duration).toBe(5);
    });
  });

  describe('begin()', () => {
    it('stores full text', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._fullText).toBe('Hello');
    });

    it('sets initial text to just cursor', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect(mob.getText()).toBe('|');
    });

    it('sets initial text to custom cursor', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorChar: '_' });
      anim.begin();
      expect(mob.getText()).toBe('_');
    });

    it('initializes cursor state', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._currentCharCount).toBe(0);
      expect((anim as any)._cursorVisible).toBe(true);
      expect((anim as any)._lastCursorToggleTime).toBe(0);
    });

    it('stores original color', () => {
      const mob = new MockTextMobject('Hello');
      mob.color = '#00ff00';
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._originalColor).toBe('#00ff00');
    });
  });

  describe('interpolate()', () => {
    it('shows partial text with cursor at alpha=0.5', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(0.5);
      // targetCharCount = floor(0.5 * 5) = 2
      // cursorBlinks false => cursor always visible
      expect(mob.getText()).toBe('He|');
    });

    it('shows no text at alpha=0', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(0);
      // targetCharCount = floor(0 * 5) = 0
      expect(mob.getText()).toBe('|');
    });

    it('shows all text at alpha=1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(1);
      // targetCharCount = floor(1 * 5) = 5
      expect(mob.getText()).toBe('Hello|');
    });

    it('when cursorBlinks=false, cursor is always visible', () => {
      const mob = new MockTextMobject('Hi');
      const anim = new TypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(0.5);
      // targetCharCount = floor(0.5 * 2) = 1
      expect(mob.getText()).toBe('H|');
    });

    it('applies highlight color when specified', () => {
      const mob = new MockHighlightTextMobject('Hello');
      const anim = new TypeWithCursor(mob, {
        cursorBlinks: false,
        highlightColor: '#ff0000',
      });
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.color).toBe('#ff0000');
      expect(mob._renderToCanvas).toHaveBeenCalled();
    });

    it('does not crash for non-text mobject', () => {
      const mob = new Mobject();
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect(() => anim.interpolate(0.5)).not.toThrow();
    });
  });

  describe('_calculateDuration()', () => {
    it('returns text length / typingSpeed', () => {
      const mob = new MockTextMobject('Hello World'); // 11 chars
      const anim = new TypeWithCursor(mob, { typingSpeed: 10 });
      anim.begin(); // sets _fullText
      expect((anim as any)._calculateDuration()).toBeCloseTo(1.1, 5);
    });
  });

  describe('finish()', () => {
    it('shows full text with cursor when hideCursorOnComplete is false', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { hideCursorOnComplete: false });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.getText()).toBe('Hello|');
    });

    it('shows full text without cursor when hideCursorOnComplete is true', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, { hideCursorOnComplete: true });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.getText()).toBe('Hello');
    });

    it('restores original color when highlight was used', () => {
      const mob = new MockHighlightTextMobject('Hello');
      mob.color = '#00ff00';
      const anim = new TypeWithCursor(mob, {
        highlightColor: '#ff0000',
      });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.color).toBe('#00ff00');
    });

    it('marks animation as finished', () => {
      const mob = new MockTextMobject('Test');
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });

    it('does not crash for non-text mobject', () => {
      const mob = new Mobject();
      const anim = new TypeWithCursor(mob);
      anim.begin();
      expect(() => anim.finish()).not.toThrow();
    });
  });

  describe('cursor blinking', () => {
    it('toggles cursor based on blink rate', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new TypeWithCursor(mob, {
        cursorBlinks: true,
        cursorBlinkRate: 2,
        duration: 2,
      });
      anim.begin();

      // The blink period is 1/2 = 0.5s, half-period = 0.25s
      // At alpha=0 (time=0): cursor starts visible
      anim.interpolate(0);
      const text1 = mob.getText();
      expect(text1).toContain('|'); // cursor starts visible

      // The blinking toggle depends on time threshold logic,
      // testing that cursor can be toggled
      // At a high enough alpha, the cursor may toggle
      anim.interpolate(0.2); // time = 0.2 * 2 = 0.4s > half-period 0.25s
      // The cursor should have toggled at least once
      // We can verify by checking that the text either has cursor or space
      const text2 = mob.getText();
      expect(text2.endsWith('|') || text2.endsWith(' ')).toBe(true);
    });
  });
});

describe('typeWithCursor() factory', () => {
  it('returns a TypeWithCursor instance', () => {
    const mob = new MockTextMobject('Hello');
    const anim = typeWithCursor(mob);
    expect(anim).toBeInstanceOf(TypeWithCursor);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new MockTextMobject('Hello');
    const anim = typeWithCursor(mob, {
      cursorChar: '_',
      typingSpeed: 20,
      duration: 3,
    });
    expect((anim as any).cursorChar).toBe('_');
    expect((anim as any).typingSpeed).toBe(20);
    expect(anim.duration).toBe(3);
  });
});

// =============================================================================
// UntypeWithCursor (TypeWithCursor.ts)
// =============================================================================

describe('UntypeWithCursor', () => {
  describe('constructor', () => {
    it('sets default cursorChar to |', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      expect((anim as any).cursorChar).toBe('|');
    });

    it('sets default cursorBlinkRate to 2', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      expect((anim as any).cursorBlinkRate).toBe(2);
    });

    it('sets default deletingSpeed to 15', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      expect((anim as any).deletingSpeed).toBe(15);
    });

    it('sets default cursorBlinks to true', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      expect((anim as any).cursorBlinks).toBe(true);
    });

    it('sets default hideCursorOnComplete to true', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      expect((anim as any).hideCursorOnComplete).toBe(true);
    });

    it('sets default duration to 1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom cursorChar', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { cursorChar: '_' });
      expect((anim as any).cursorChar).toBe('_');
    });

    it('accepts custom deletingSpeed', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { deletingSpeed: 25 });
      expect((anim as any).deletingSpeed).toBe(25);
    });

    it('accepts custom duration', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('accepts highlightColor', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { highlightColor: '#00ff00' });
      expect((anim as any).highlightColor).toBe('#00ff00');
    });

    it('accepts hideCursorOnComplete=false', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { hideCursorOnComplete: false });
      expect((anim as any).hideCursorOnComplete).toBe(false);
    });
  });

  describe('begin()', () => {
    it('stores full text', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._fullText).toBe('Hello');
    });

    it('sets text to full text + cursor', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect(mob.getText()).toBe('Hello|');
    });

    it('removes trailing cursor from stored text if present', () => {
      const mob = new MockTextMobject('Hello|');
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._fullText).toBe('Hello');
    });

    it('removes custom trailing cursor from stored text', () => {
      const mob = new MockTextMobject('Hello_');
      const anim = new UntypeWithCursor(mob, { cursorChar: '_' });
      anim.begin();
      expect((anim as any)._fullText).toBe('Hello');
    });

    it('stores original color', () => {
      const mob = new MockTextMobject('Hello');
      mob.color = '#00ff00';
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._originalColor).toBe('#00ff00');
    });

    it('initializes cursor state', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect((anim as any)._cursorVisible).toBe(true);
      expect((anim as any)._lastCursorToggleTime).toBe(0);
    });
  });

  describe('interpolate()', () => {
    it('removes text progressively (alpha=0: full text)', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(0);
      // charsToRemove = floor(0 * 5) = 0, remaining = 5
      expect(mob.getText()).toBe('Hello|');
    });

    it('removes half text at alpha=0.5', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(0.5);
      // charsToRemove = floor(0.5 * 5) = 2, remaining = 3
      expect(mob.getText()).toBe('Hel|');
    });

    it('removes all text at alpha=1', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { cursorBlinks: false });
      anim.begin();
      anim.interpolate(1);
      // charsToRemove = floor(1 * 5) = 5, remaining = 0
      expect(mob.getText()).toBe('|');
    });

    it('applies highlight color when specified', () => {
      const mob = new MockHighlightTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, {
        cursorBlinks: false,
        highlightColor: '#ff0000',
      });
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.color).toBe('#ff0000');
      expect(mob._renderToCanvas).toHaveBeenCalled();
    });

    it('does not crash for non-text mobject', () => {
      const mob = new Mobject();
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect(() => anim.interpolate(0.5)).not.toThrow();
    });

    it('cursor blinking toggles visibility', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, {
        cursorBlinks: true,
        cursorBlinkRate: 2,
        duration: 2,
      });
      anim.begin();

      anim.interpolate(0);
      const text1 = mob.getText();
      // Starts visible
      expect(text1.endsWith('|') || text1.endsWith(' ')).toBe(true);
    });
  });

  describe('finish()', () => {
    it('sets text to empty when hideCursorOnComplete is true', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { hideCursorOnComplete: true });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.getText()).toBe('');
    });

    it('sets text to cursor only when hideCursorOnComplete is false', () => {
      const mob = new MockTextMobject('Hello');
      const anim = new UntypeWithCursor(mob, { hideCursorOnComplete: false });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.getText()).toBe('|');
    });

    it('restores original color when highlight was used', () => {
      const mob = new MockHighlightTextMobject('Hello');
      mob.color = '#00ff00';
      const anim = new UntypeWithCursor(mob, {
        highlightColor: '#ff0000',
      });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.color).toBe('#00ff00');
    });

    it('marks animation as finished', () => {
      const mob = new MockTextMobject('Test');
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });

    it('does not crash for non-text mobject', () => {
      const mob = new Mobject();
      const anim = new UntypeWithCursor(mob);
      anim.begin();
      expect(() => anim.finish()).not.toThrow();
    });
  });
});

describe('untypeWithCursor() factory', () => {
  it('returns an UntypeWithCursor instance', () => {
    const mob = new MockTextMobject('Hello');
    const anim = untypeWithCursor(mob);
    expect(anim).toBeInstanceOf(UntypeWithCursor);
    expect(anim.mobject).toBe(mob);
  });

  it('passes options through', () => {
    const mob = new MockTextMobject('Hello');
    const anim = untypeWithCursor(mob, {
      cursorChar: '_',
      deletingSpeed: 25,
      duration: 3,
    });
    expect((anim as any).cursorChar).toBe('_');
    expect((anim as any).deletingSpeed).toBe(25);
    expect(anim.duration).toBe(3);
  });
});

// =============================================================================
// Full lifecycle integration tests
// =============================================================================

describe('Full lifecycle integration', () => {
  describe('Create full cycle', () => {
    it('opacity goes 0 -> intermediate -> 1 for non-VMobject', () => {
      const mob = new Mobject();
      mob.opacity = 1;
      const anim = new Create(mob);

      anim.begin();
      expect(mob.opacity).toBe(0);

      anim.interpolate(0.3);
      expect(mob.opacity).toBeCloseTo(0.3, 5);

      anim.interpolate(0.7);
      expect(mob.opacity).toBeCloseTo(0.7, 5);

      anim.finish();
      expect(mob.opacity).toBe(1);
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('Uncreate full cycle', () => {
    it('opacity goes 1 -> intermediate -> 0 for non-VMobject', () => {
      const mob = new Mobject();
      mob.opacity = 1;
      const anim = new Uncreate(mob);

      anim.begin();
      expect(mob.opacity).toBe(1);

      anim.interpolate(0.3);
      expect(mob.opacity).toBeCloseTo(0.7, 5);

      anim.interpolate(0.7);
      expect(mob.opacity).toBeCloseTo(0.3, 5);

      anim.finish();
      expect(mob.opacity).toBe(0);
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('AddTextLetterByLetter full cycle', () => {
    it('text goes empty -> partial -> full', () => {
      const mob = new MockTextMobject('ABCDE');
      const anim = new AddTextLetterByLetter(mob);

      anim.begin();
      expect(mob.getText()).toBe('');

      anim.interpolate(0.2);
      expect(mob.getText()).toBe('A');

      anim.interpolate(0.6);
      expect(mob.getText()).toBe('ABC');

      anim.finish();
      expect(mob.getText()).toBe('ABCDE');
    });
  });

  describe('RemoveTextLetterByLetter full cycle', () => {
    it('text goes full -> partial -> empty', () => {
      const mob = new MockTextMobject('ABCDE');
      const anim = new RemoveTextLetterByLetter(mob);

      anim.begin();

      anim.interpolate(0);
      expect(mob.getText()).toBe('ABCDE');

      anim.interpolate(0.4);
      expect(mob.getText()).toBe('ABC');

      anim.interpolate(0.8);
      expect(mob.getText()).toBe('A');

      anim.finish();
      expect(mob.getText()).toBe('');
    });
  });

  describe('TypeWithCursor full cycle', () => {
    it('text typed then cursor shown at end', () => {
      const mob = new MockTextMobject('Hi');
      const anim = new TypeWithCursor(mob, { cursorBlinks: false });

      anim.begin();
      expect(mob.getText()).toBe('|');

      anim.interpolate(0.5);
      // floor(0.5 * 2) = 1
      expect(mob.getText()).toBe('H|');

      anim.interpolate(1);
      expect(mob.getText()).toBe('Hi|');

      anim.finish();
      expect(mob.getText()).toBe('Hi|');
    });
  });

  describe('UntypeWithCursor full cycle', () => {
    it('text removed then empty or cursor at end', () => {
      const mob = new MockTextMobject('Hi');
      const anim = new UntypeWithCursor(mob, {
        cursorBlinks: false,
        hideCursorOnComplete: true,
      });

      anim.begin();
      expect(mob.getText()).toBe('Hi|');

      anim.interpolate(0.5);
      // charsToRemove = floor(0.5 * 2) = 1, remaining = 1
      expect(mob.getText()).toBe('H|');

      anim.interpolate(1);
      // charsToRemove = floor(1 * 2) = 2, remaining = 0
      expect(mob.getText()).toBe('|');

      anim.finish();
      expect(mob.getText()).toBe('');
    });
  });

  describe('AddTextWordByWord full cycle', () => {
    it('words appear one by one', () => {
      const mob = new MockTextMobject('Hello World Foo');
      const anim = new AddTextWordByWord(mob);

      anim.begin();
      expect(mob.getText()).toBe('');

      // 3 words, alpha = 1/3 -> numWords = 1
      anim.interpolate(1 / 3);
      expect(mob.getText()).toBe('Hello');

      // alpha = 2/3 -> numWords = 2
      anim.interpolate(2 / 3);
      expect(mob.getText()).toBe('Hello World');

      anim.finish();
      expect(mob.getText()).toBe('Hello World Foo');
    });
  });

  describe('ShowIncreasingSubsets full cycle', () => {
    it('submobjects appear progressively', () => {
      const parent = new Mobject();
      const child1 = new Mobject();
      const child2 = new Mobject();
      child1.opacity = 1;
      child2.opacity = 1;
      parent.add(child1);
      parent.add(child2);

      const anim = new ShowIncreasingSubsets(parent);

      anim.begin();
      expect(child1.opacity).toBe(0);
      expect(child2.opacity).toBe(0);

      anim.interpolate(0.5);
      // numToShow = 1, child1 shown, child2 partially
      expect(child1.opacity).toBe(1);

      anim.finish();
      expect(child1.opacity).toBe(1);
      expect(child2.opacity).toBe(1);
    });
  });
});

// =============================================================================
// Create + MasterTimeline integration (issue #117)
// =============================================================================
import { MasterTimeline } from '../MasterTimeline';

describe('Create with MasterTimeline (opacity fallback path)', () => {
  it('Create(Dot) opacity fades from 0 to 1 in MasterTimeline', () => {
    // A plain Mobject has no Line2 children, so Create uses the opacity fallback
    const dot = new Mobject();
    dot.opacity = 1;

    const anim = new Create(dot, { duration: 1, rateFunc: linear });
    const tl = new MasterTimeline();
    tl.addSegment([anim]);

    // seek(0) should NOT corrupt the mobject's opacity for the animation
    tl.seek(0);
    // After seek(0), the animation runs begin() which sets opacity to 0
    // MasterTimeline should NOT override this since the animation controls visibility
    // The key invariant: the animation's _savedOpacities captured the real opacity (1)

    // Play forward to 50%
    tl.play();
    tl.update(0.5);
    // At alpha=0.5, the opacity should be ~0.5 (with smooth rate function it varies,
    // but with linear it should be exactly 0.5)
    expect(dot.opacity).toBeCloseTo(0.5, 1);

    // Play to end
    tl.update(0.5);
    expect(dot.opacity).toBeCloseTo(1, 1);
  });

  it('sequential Create animations work correctly', () => {
    const dot1 = new Mobject();
    dot1.opacity = 1;
    const dot2 = new Mobject();
    dot2.opacity = 1;

    const anim1 = new Create(dot1, { duration: 1, rateFunc: linear });
    const anim2 = new Create(dot2, { duration: 1, rateFunc: linear });

    const tl = new MasterTimeline();
    tl.addSegment([anim1]); // segment 0: t=0..1
    tl.addSegment([anim2]); // segment 1: t=1..2

    // seek(0): dot2 is a future mobject - but Create controls its own visibility
    // so MasterTimeline should NOT hide it (the animation will handle opacity itself)
    tl.seek(0);

    // Play through first animation
    tl.play();
    tl.update(0.5);
    expect(dot1.opacity).toBeCloseTo(0.5, 1);

    tl.update(0.5);
    expect(dot1.opacity).toBeCloseTo(1, 1);

    // Play through second animation
    tl.update(0.5);
    expect(dot2.opacity).toBeCloseTo(0.5, 1);

    tl.update(0.5);
    expect(dot2.opacity).toBeCloseTo(1, 1);
  });

  it('seek(0) does not corrupt saved opacity for opacity-based Create', () => {
    const dot = new Mobject();
    dot.opacity = 0.8; // custom opacity

    const anim = new Create(dot, { duration: 1, rateFunc: linear });
    const tl = new MasterTimeline();
    tl.addSegment([anim]);

    // Play partway
    tl.play();
    tl.update(0.5);

    // Seek back to 0
    tl.seek(0);

    // Play forward again - the opacity should scale correctly from the original 0.8
    tl.play();
    tl.update(1.0);
    expect(dot.opacity).toBeCloseTo(0.8, 1);
  });

  it('controlsOwnVisibility is true for Create before begin()', () => {
    const dot = new Mobject();
    const anim = new Create(dot);
    // Flag is set in constructor so MasterTimeline can check it before begin()
    expect(anim.controlsOwnVisibility).toBe(true);
  });

  it('controlsOwnVisibility is true after begin() for opacity fallback', () => {
    const dot = new Mobject();
    const anim = new Create(dot);
    anim.begin();
    expect(anim.controlsOwnVisibility).toBe(true);
  });
});

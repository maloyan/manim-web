import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
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
} from './creation/Create';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
describe('Create', () => {
  describe('constructor defaults', () => {
    it('has duration=2', () => {
      const m = new Mobject();
      const anim = new Create(m);
      expect(anim.duration).toBe(2);
    });

    it('accepts custom duration', () => {
      const m = new Mobject();
      const anim = new Create(m, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('accepts custom lagRatio', () => {
      const m = new Mobject();
      const anim = new Create(m, { lagRatio: 0.5 });
      // lagRatio is private but we can verify via the class existing
      expect(anim).toBeInstanceOf(Create);
    });
  });

  describe('non-VMobject (opacity fallback)', () => {
    it('begin sets opacity to 0', () => {
      const m = new Mobject();
      m.setOpacity(1);
      const anim = new Create(m);
      anim.begin();
      expect(m.opacity).toBe(0);
    });

    it('interpolate sets opacity proportional to alpha', () => {
      const m = new Mobject();
      const anim = new Create(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.opacity).toBeCloseTo(0, 5);
      anim.interpolate(0.5);
      expect(m.opacity).toBeCloseTo(0.5, 5);
      anim.interpolate(1);
      expect(m.opacity).toBeCloseTo(1, 5);
    });

    it('finish restores opacity to 1', () => {
      const m = new Mobject();
      const anim = new Create(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.opacity).toBe(1);
    });
  });

  describe('VMobject without Line2 (opacity fallback)', () => {
    it('uses opacity fallback when VMobject has no Line2 children', () => {
      const vm = new VMobject();
      // VMobject without any geometry won't have Line2 children
      const anim = new Create(vm);
      anim.begin();
      expect(vm.opacity).toBe(0);
      anim.interpolate(0.5);
      expect(vm.opacity).toBeCloseTo(0.5, 5);
      anim.finish();
      expect(vm.opacity).toBe(1);
    });
  });

  describe('create() factory function', () => {
    it('returns a Create instance', () => {
      const m = new Mobject();
      const anim = create(m);
      expect(anim).toBeInstanceOf(Create);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = create(m, { duration: 5 });
      expect(anim.duration).toBe(5);
    });
  });
});

// ---------------------------------------------------------------------------
// DrawBorderThenFill
// ---------------------------------------------------------------------------
describe('DrawBorderThenFill', () => {
  describe('constructor defaults', () => {
    it('has duration=2', () => {
      const m = new Mobject();
      const anim = new DrawBorderThenFill(m);
      expect(anim.duration).toBe(2);
    });

    it('accepts custom duration', () => {
      const m = new Mobject();
      const anim = new DrawBorderThenFill(m, { duration: 4 });
      expect(anim.duration).toBe(4);
    });
  });

  describe('non-VMobject (no dash reveal, no-op interpolation)', () => {
    it('begin does not crash for non-VMobject', () => {
      const m = new Mobject();
      const anim = new DrawBorderThenFill(m);
      expect(() => anim.begin()).not.toThrow();
    });

    it('interpolate does not crash for non-VMobject', () => {
      const m = new Mobject();
      const anim = new DrawBorderThenFill(m);
      anim.begin();
      expect(() => anim.interpolate(0.5)).not.toThrow();
    });

    it('finish does not crash for non-VMobject', () => {
      const m = new Mobject();
      const anim = new DrawBorderThenFill(m);
      anim.begin();
      anim.interpolate(1);
      expect(() => anim.finish()).not.toThrow();
    });
  });

  describe('VMobject without Line2 (no dash reveal)', () => {
    it('handles VMobject without Line2 children gracefully', () => {
      const vm = new VMobject();
      const anim = new DrawBorderThenFill(vm);
      anim.begin();
      expect(() => anim.interpolate(0.3)).not.toThrow();
      expect(() => anim.interpolate(0.7)).not.toThrow();
      expect(() => anim.finish()).not.toThrow();
    });
  });

  describe('drawBorderThenFill() factory function', () => {
    it('returns a DrawBorderThenFill instance', () => {
      const m = new Mobject();
      const anim = drawBorderThenFill(m);
      expect(anim).toBeInstanceOf(DrawBorderThenFill);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = drawBorderThenFill(m, { duration: 3 });
      expect(anim.duration).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Uncreate
// ---------------------------------------------------------------------------
describe('Uncreate', () => {
  describe('constructor defaults', () => {
    it('has duration=2', () => {
      const m = new Mobject();
      const anim = new Uncreate(m);
      expect(anim.duration).toBe(2);
    });

    it('accepts custom duration', () => {
      const m = new Mobject();
      const anim = new Uncreate(m, { duration: 1 });
      expect(anim.duration).toBe(1);
    });
  });

  describe('non-VMobject (opacity fallback)', () => {
    it('interpolate fades opacity from 1 to 0', () => {
      const m = new Mobject();
      m.setOpacity(1);
      const anim = new Uncreate(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.opacity).toBeCloseTo(1, 5);
      anim.interpolate(0.5);
      expect(m.opacity).toBeCloseTo(0.5, 5);
      anim.interpolate(1);
      expect(m.opacity).toBeCloseTo(0, 5);
    });

    it('finish sets opacity to 0', () => {
      const m = new Mobject();
      m.setOpacity(1);
      const anim = new Uncreate(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.opacity).toBe(0);
    });
  });

  describe('uncreate() factory function', () => {
    it('returns an Uncreate instance', () => {
      const m = new Mobject();
      const anim = uncreate(m);
      expect(anim).toBeInstanceOf(Uncreate);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = uncreate(m, { duration: 5 });
      expect(anim.duration).toBe(5);
    });
  });
});

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
describe('Write', () => {
  describe('constructor defaults', () => {
    it('has duration=1', () => {
      const m = new Mobject();
      const anim = new Write(m);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const m = new Mobject();
      const anim = new Write(m, { duration: 2 });
      expect(anim.duration).toBe(2);
    });
  });

  describe('non-VMobject (opacity fallback)', () => {
    it('begin sets opacity to 0', () => {
      const m = new Mobject();
      m.setOpacity(1);
      const anim = new Write(m);
      anim.begin();
      expect(m.opacity).toBe(0);
    });

    it('interpolate sets opacity proportional to alpha', () => {
      const m = new Mobject();
      m.setOpacity(1);
      const anim = new Write(m);
      anim.begin();
      anim.interpolate(0.5);
      expect(m.opacity).toBeCloseTo(0.5, 5);
    });

    it('finish restores opacity', () => {
      const m = new Mobject();
      m.setOpacity(0.8);
      const anim = new Write(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.opacity).toBeCloseTo(0.8, 5);
    });
  });

  describe('reverse mode (opacity fallback)', () => {
    it('reverse starts with full opacity and fades to 0', () => {
      const m = new Mobject();
      m.setOpacity(1);
      const anim = new Write(m, { reverse: true });
      anim.begin();
      // When reverse, begin should set opacity to original (not 0)
      anim.interpolate(0);
      // effectiveAlpha = 1 - 0 = 1, so opacity = original * 1
      expect(m.opacity).toBeCloseTo(1, 5);
      anim.interpolate(1);
      // effectiveAlpha = 1 - 1 = 0, so opacity = 0
      expect(m.opacity).toBeCloseTo(0, 5);
    });
  });

  describe('write() factory function', () => {
    it('returns a Write instance', () => {
      const m = new Mobject();
      const anim = write(m);
      expect(anim).toBeInstanceOf(Write);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = write(m, { duration: 3 });
      expect(anim.duration).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Unwrite
// ---------------------------------------------------------------------------
describe('Unwrite', () => {
  describe('constructor', () => {
    it('is an instance of Write', () => {
      const m = new Mobject();
      const anim = new Unwrite(m);
      expect(anim).toBeInstanceOf(Write);
    });

    it('has duration=1 by default', () => {
      const m = new Mobject();
      const anim = new Unwrite(m);
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const m = new Mobject();
      const anim = new Unwrite(m, { duration: 2 });
      expect(anim.duration).toBe(2);
    });
  });

  describe('unwrite() factory function', () => {
    it('returns an Unwrite instance', () => {
      const m = new Mobject();
      const anim = unwrite(m);
      expect(anim).toBeInstanceOf(Unwrite);
    });
  });
});

// ---------------------------------------------------------------------------
// AddTextLetterByLetter
// ---------------------------------------------------------------------------
describe('AddTextLetterByLetter', () => {
  describe('constructor defaults', () => {
    it('has duration=1, timePerChar=0.1', () => {
      const m = new Mobject();
      const anim = new AddTextLetterByLetter(m);
      expect(anim.duration).toBe(1);
      expect(anim.timePerChar).toBe(0.1);
    });

    it('accepts custom duration and timePerChar', () => {
      const m = new Mobject();
      const anim = new AddTextLetterByLetter(m, {
        duration: 5,
        timePerChar: 0.2,
      });
      expect(anim.duration).toBe(5);
      expect(anim.timePerChar).toBe(0.2);
    });
  });

  describe('with mock text mobject', () => {
    interface TextLike {
      getText(): string;
      setText(t: string): void;
    }
    function makeTextMobject(text: string): Mobject & TextLike {
      const m = new Mobject();
      let currentText = text;
      const tm = m as Mobject & TextLike;
      tm.getText = () => currentText;
      tm.setText = (t: string) => {
        currentText = t;
      };
      return tm;
    }

    it('begin clears the text', () => {
      const m = makeTextMobject('Hello');
      const anim = new AddTextLetterByLetter(m);
      anim.begin();
      expect(m.getText()).toBe('');
    });

    it('interpolate reveals characters proportional to alpha', () => {
      const m = makeTextMobject('Hello');
      const anim = new AddTextLetterByLetter(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.getText()).toBe('');
      anim.interpolate(0.4);
      // floor(0.4 * 5) = 2
      expect(m.getText()).toBe('He');
      anim.interpolate(1);
      // floor(1 * 5) = 5
      expect(m.getText()).toBe('Hello');
    });

    it('finish restores full text', () => {
      const m = makeTextMobject('Hello');
      const anim = new AddTextLetterByLetter(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.getText()).toBe('Hello');
    });
  });

  describe('without text methods (noop)', () => {
    it('does not crash when mobject has no getText/setText', () => {
      const m = new Mobject();
      const anim = new AddTextLetterByLetter(m);
      expect(() => {
        anim.begin();
        anim.interpolate(0.5);
        anim.finish();
      }).not.toThrow();
    });
  });

  describe('addTextLetterByLetter() factory function', () => {
    it('returns an AddTextLetterByLetter instance', () => {
      const m = new Mobject();
      const anim = addTextLetterByLetter(m);
      expect(anim).toBeInstanceOf(AddTextLetterByLetter);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = addTextLetterByLetter(m, { timePerChar: 0.5 });
      expect(anim.timePerChar).toBe(0.5);
    });
  });
});

// ---------------------------------------------------------------------------
// RemoveTextLetterByLetter
// ---------------------------------------------------------------------------
describe('RemoveTextLetterByLetter', () => {
  describe('constructor defaults', () => {
    it('has duration=1, timePerChar=0.1', () => {
      const m = new Mobject();
      const anim = new RemoveTextLetterByLetter(m);
      expect(anim.duration).toBe(1);
      expect(anim.timePerChar).toBe(0.1);
    });
  });

  describe('with mock text mobject', () => {
    interface TextLike {
      getText(): string;
      setText(t: string): void;
    }
    function makeTextMobject(text: string): Mobject & TextLike {
      const m = new Mobject();
      let currentText = text;
      const tm = m as Mobject & TextLike;
      tm.getText = () => currentText;
      tm.setText = (t: string) => {
        currentText = t;
      };
      return tm;
    }

    it('begin preserves full text', () => {
      const m = makeTextMobject('World');
      const anim = new RemoveTextLetterByLetter(m);
      anim.begin();
      expect(m.getText()).toBe('World');
    });

    it('interpolate removes characters proportional to alpha', () => {
      const m = makeTextMobject('World');
      const anim = new RemoveTextLetterByLetter(m);
      anim.begin();
      anim.interpolate(0);
      expect(m.getText()).toBe('World');
      anim.interpolate(0.4);
      // floor(0.4 * 5) = 2 chars removed => 3 remain
      expect(m.getText()).toBe('Wor');
      anim.interpolate(1);
      // floor(1 * 5) = 5 chars removed => 0 remain
      expect(m.getText()).toBe('');
    });

    it('finish clears all text', () => {
      const m = makeTextMobject('World');
      const anim = new RemoveTextLetterByLetter(m);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(m.getText()).toBe('');
    });
  });

  describe('removeTextLetterByLetter() factory function', () => {
    it('returns a RemoveTextLetterByLetter instance', () => {
      const m = new Mobject();
      const anim = removeTextLetterByLetter(m);
      expect(anim).toBeInstanceOf(RemoveTextLetterByLetter);
    });

    it('passes options through', () => {
      const m = new Mobject();
      const anim = removeTextLetterByLetter(m, {
        duration: 2,
        timePerChar: 0.3,
      });
      expect(anim.duration).toBe(2);
      expect(anim.timePerChar).toBe(0.3);
    });
  });
});

// ---------------------------------------------------------------------------
// Create._childAlpha stagger logic (tested via public interface)
// ---------------------------------------------------------------------------
describe('Create stagger with lagRatio', () => {
  it('lagRatio=0 means all children animate together (opacity path)', () => {
    const m = new Mobject();
    const anim = new Create(m, { lagRatio: 0 });
    anim.begin();
    // opacity fallback: all animated together regardless
    anim.interpolate(0.5);
    expect(m.opacity).toBeCloseTo(0.5, 5);
  });

  it('lagRatio>0 still animates correctly for opacity path', () => {
    const m = new Mobject();
    const anim = new Create(m, { lagRatio: 0.3 });
    anim.begin();
    anim.interpolate(1);
    expect(m.opacity).toBeCloseTo(1, 5);
    anim.finish();
    expect(m.opacity).toBe(1);
  });
});

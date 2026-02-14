// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkupText } from './MarkupText';
import type { StyledTextSegment } from './MarkupText';

function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((_t: string) => ({
      width: _t.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: _t.length * 10,
    })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') return createMockCtx();
    return null;
  });
  // Field initializer runs AFTER super(); provide fallback for overridden _measureText
  (MarkupText.prototype as unknown as Record<string, unknown>)._styledSegments = [];
});

/** Helper: create MarkupText and return its styled segments */
function segs(text: string): readonly StyledTextSegment[] {
  return new MarkupText({ text }).getStyledSegments();
}

describe('MarkupText', () => {
  describe('plain text fallback', () => {
    it('should produce a single segment for plain text', () => {
      const s = segs('Hello World');
      expect(s.length).toBe(1);
      expect(s[0].text).toBe('Hello World');
    });

    it('should have null style overrides for plain text', () => {
      const s = segs('Plain');
      expect(s[0].fontWeight).toBeNull();
      expect(s[0].fontStyle).toBeNull();
      expect(s[0].color).toBeNull();
      expect(s[0].fontFamily).toBeNull();
    });

    it('should default decorations off and scale normal', () => {
      const s = segs('Normal');
      expect(s[0].underline).toBe(false);
      expect(s[0].strikethrough).toBe(false);
      expect(s[0].baselineShift).toBe(0);
      expect(s[0].relativeScale).toBe(1);
    });

    it('should handle empty text', () => {
      const s = new MarkupText({ text: '' }).getStyledSegments();
      expect(s.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('basic Pango tags', () => {
    it('should parse <b> as bold', () => {
      const s = segs('<b>Bold</b>');
      expect(s.length).toBe(1);
      expect(s[0].text).toBe('Bold');
      expect(s[0].fontWeight).toBe('bold');
    });

    it('should parse <bold> as bold', () => {
      expect(segs('<bold>B</bold>')[0].fontWeight).toBe('bold');
    });

    it('should parse <i> as italic', () => {
      const s = segs('<i>Italic</i>');
      expect(s[0].text).toBe('Italic');
      expect(s[0].fontStyle).toBe('italic');
    });

    it('should parse <italic> as italic', () => {
      expect(segs('<italic>I</italic>')[0].fontStyle).toBe('italic');
    });

    it('should parse <u> as underline', () => {
      const s = segs('<u>Underlined</u>');
      expect(s[0].text).toBe('Underlined');
      expect(s[0].underline).toBe(true);
    });

    it('should parse <underline> as underline', () => {
      expect(segs('<underline>U</underline>')[0].underline).toBe(true);
    });

    it('should parse <s> as strikethrough', () => {
      const s = segs('<s>Struck</s>');
      expect(s[0].text).toBe('Struck');
      expect(s[0].strikethrough).toBe(true);
    });

    it('should parse <strikethrough> as strikethrough', () => {
      expect(segs('<strikethrough>S</strikethrough>')[0].strikethrough).toBe(true);
    });
  });

  describe('mixed text and tags', () => {
    it('should produce segments for mixed content', () => {
      const s = segs('Hello <b>World</b>!');
      expect(s.length).toBe(3);
      expect(s[0].text).toBe('Hello ');
      expect(s[0].fontWeight).toBeNull();
      expect(s[1].text).toBe('World');
      expect(s[1].fontWeight).toBe('bold');
      expect(s[2].text).toBe('!');
    });

    it('should handle consecutive styled spans', () => {
      const s = segs('<b>Bold</b> and <i>Italic</i>');
      expect(s.length).toBe(3);
      expect(s[0].text).toBe('Bold');
      expect(s[0].fontWeight).toBe('bold');
      expect(s[1].text).toBe(' and ');
      expect(s[2].text).toBe('Italic');
      expect(s[2].fontStyle).toBe('italic');
    });
  });

  describe('nested tags', () => {
    it('should handle <b><i>bold italic</i></b>', () => {
      const s = segs('<b><i>Bold Italic</i></b>');
      expect(s.length).toBe(1);
      expect(s[0].fontWeight).toBe('bold');
      expect(s[0].fontStyle).toBe('italic');
    });

    it('should nest underline inside bold', () => {
      const s = segs('<b><u>BU</u></b>');
      expect(s[0].fontWeight).toBe('bold');
      expect(s[0].underline).toBe(true);
    });

    it('should nest strikethrough inside italic', () => {
      const s = segs('<i><s>IS</s></i>');
      expect(s[0].fontStyle).toBe('italic');
      expect(s[0].strikethrough).toBe(true);
    });
  });

  describe('<span> attributes', () => {
    it('should parse color attribute', () => {
      expect(segs('<span color="red">R</span>')[0].color).toBe('red');
    });

    it('should parse foreground as color', () => {
      expect(segs('<span foreground="#0f0">G</span>')[0].color).toBe('#0f0');
    });

    it('should parse fgcolor as color', () => {
      expect(segs('<span fgcolor="blue">B</span>')[0].color).toBe('blue');
    });

    it('should parse font_family attribute', () => {
      expect(segs('<span font_family="Courier">C</span>')[0].fontFamily).toBe('Courier');
    });

    it('should parse font attribute as font_family', () => {
      expect(segs('<span font="Helvetica">H</span>')[0].fontFamily).toBe('Helvetica');
    });

    it('should parse face attribute as font_family', () => {
      expect(segs('<span face="Verdana">V</span>')[0].fontFamily).toBe('Verdana');
    });

    it('should parse font_size as absolute pixels', () => {
      expect(segs('<span font_size="24">S</span>')[0].fontSize).toBe(24);
    });

    it('should parse size as alias for font_size', () => {
      expect(segs('<span size="36">M</span>')[0].fontSize).toBe(36);
    });

    it('should parse weight="bold"', () => {
      expect(segs('<span weight="bold">B</span>')[0].fontWeight).toBe('bold');
    });

    it('should parse weight="normal"', () => {
      expect(segs('<span weight="normal">N</span>')[0].fontWeight).toBe('normal');
    });

    it('should parse numeric weight', () => {
      expect(segs('<span weight="600">W</span>')[0].fontWeight).toBe(600);
    });

    it('should parse style="italic"', () => {
      expect(segs('<span style="italic">I</span>')[0].fontStyle).toBe('italic');
    });

    it('should parse style="oblique"', () => {
      expect(segs('<span style="oblique">O</span>')[0].fontStyle).toBe('oblique');
    });

    it('should parse underline="single"', () => {
      expect(segs('<span underline="single">U</span>')[0].underline).toBe(true);
    });

    it('should parse underline="none"', () => {
      expect(segs('<span underline="none">N</span>')[0].underline).toBe(false);
    });

    it('should parse strikethrough="true"', () => {
      expect(segs('<span strikethrough="true">S</span>')[0].strikethrough).toBe(true);
    });

    it('should parse strikethrough="false"', () => {
      expect(segs('<span strikethrough="false">N</span>')[0].strikethrough).toBe(false);
    });

    it('should parse background attribute', () => {
      expect(segs('<span background="yellow">H</span>')[0].backgroundColor).toBe('yellow');
    });

    it('should parse bgcolor attribute', () => {
      expect(segs('<span bgcolor="#eee">B</span>')[0].backgroundColor).toBe('#eee');
    });

    it('should parse variant="small-caps"', () => {
      expect(segs('<span variant="small-caps">C</span>')[0].fontVariant).toBe('small-caps');
    });

    it('should handle multiple attributes on one span', () => {
      const s = segs('<span color="red" weight="bold" style="italic">X</span>');
      expect(s[0].color).toBe('red');
      expect(s[0].fontWeight).toBe('bold');
      expect(s[0].fontStyle).toBe('italic');
    });
  });

  describe('special tags', () => {
    it('should parse <sup> with negative baselineShift', () => {
      const s = segs('<sup>2</sup>');
      expect(s[0].baselineShift).toBeLessThan(0);
      expect(s[0].relativeScale).toBeCloseTo(0.7, 1);
    });

    it('should parse <sub> with positive baselineShift', () => {
      const s = segs('<sub>i</sub>');
      expect(s[0].baselineShift).toBeGreaterThan(0);
      expect(s[0].relativeScale).toBeCloseTo(0.7, 1);
    });

    it('should parse <big> with BIG_SCALE', () => {
      expect(segs('<big>L</big>')[0].relativeScale).toBeCloseTo(1.2, 1);
    });

    it('should parse <small> with SMALL_SCALE', () => {
      expect(segs('<small>T</small>')[0].relativeScale).toBeCloseTo(0.83, 2);
    });

    it('should parse <tt> as monospace font', () => {
      expect(new MarkupText({ text: '<tt>c</tt>' }).getStyledSegments()[0].fontFamily).toBe(
        'monospace',
      );
    });

    it('should respect custom code font family for <tt>', () => {
      const mt = new MarkupText({ text: '<tt>c</tt>' });
      mt.setCodeFontFamily('Fira Code');
      expect(mt.getStyledSegments()[0].fontFamily).toBe('Fira Code');
    });
  });

  describe('entity decoding', () => {
    it('should decode &amp; to &', () => {
      expect(segs('<b>A &amp; B</b>')[0].text).toBe('A & B');
    });

    it('should decode &lt; to <', () => {
      expect(segs('<b>x &lt; y</b>')[0].text).toBe('x < y');
    });

    it('should decode &gt; to >', () => {
      expect(segs('<b>x &gt; y</b>')[0].text).toBe('x > y');
    });

    it('should decode &quot; to "', () => {
      expect(segs('<b>&quot;q&quot;</b>')[0].text).toBe('"q"');
    });

    it('should decode &apos; to apostrophe', () => {
      expect(segs('<b>&apos;s&apos;</b>')[0].text).toBe("'s'");
    });
  });

  describe('legacy markdown parsing', () => {
    it('should parse **bold**', () => {
      const s = segs('Hello **bold** world');
      expect(s.length).toBe(3);
      expect(s[1].text).toBe('bold');
      expect(s[1].fontWeight).toBe('bold');
    });

    it('should parse *italic*', () => {
      const s = segs('Hello *italic* world');
      expect(s[1].text).toBe('italic');
      expect(s[1].fontStyle).toBe('italic');
    });

    it('should parse `code` as monospace', () => {
      const s = segs('Hello `code` world');
      expect(s[1].text).toBe('code');
      expect(s[1].fontFamily).toBe('monospace');
    });

    it('should parse ***bold italic***', () => {
      const s = segs('***both***');
      expect(s[0].fontWeight).toBe('bold');
      expect(s[0].fontStyle).toBe('italic');
    });

    it('should handle text with no markdown as single segment', () => {
      const s = segs('No formatting here');
      expect(s.length).toBe(1);
      expect(s[0].text).toBe('No formatting here');
    });
  });

  describe('getStyledSegments', () => {
    it('should return readonly array', () => {
      expect(Array.isArray(new MarkupText({ text: '<b>B</b>' }).getStyledSegments())).toBe(true);
    });

    it('should update after setText', () => {
      const mt = new MarkupText({ text: '<b>Old</b>' });
      mt.setText('<i>New</i>');
      const s = mt.getStyledSegments();
      expect(s[0].text).toBe('New');
      expect(s[0].fontStyle).toBe('italic');
    });
  });

  describe('codeFontFamily', () => {
    it('should default to monospace', () => {
      expect(new MarkupText({ text: 'T' }).getCodeFontFamily()).toBe('monospace');
    });

    it('should update via setCodeFontFamily and return this', () => {
      const mt = new MarkupText({ text: '<tt>x</tt>' });
      expect(mt.setCodeFontFamily('Consolas')).toBe(mt);
      expect(mt.getCodeFontFamily()).toBe('Consolas');
    });
  });

  describe('copy', () => {
    it('should create an independent copy', () => {
      const orig = new MarkupText({ text: '<b>Bold</b> text', fontSize: 64, color: '#f00' });
      const cl = orig.copy() as MarkupText;
      expect(cl).not.toBe(orig);
      expect(cl.getText()).toBe('<b>Bold</b> text');
      expect(cl.getFontSize()).toBe(64);
      expect(cl.color).toBe('#f00');
    });

    it('should copy codeFontFamily', () => {
      const orig = new MarkupText({ text: '<tt>x</tt>' });
      orig.setCodeFontFamily('Fira Code');
      expect((orig.copy() as MarkupText).getCodeFontFamily()).toBe('Fira Code');
    });

    it('should parse segments independently', () => {
      const orig = new MarkupText({ text: '<b>Bold</b>' });
      const cl = orig.copy() as MarkupText;
      cl.setText('<i>Italic</i>');
      expect(orig.getStyledSegments()[0].fontWeight).toBe('bold');
      expect(cl.getStyledSegments()[0].fontStyle).toBe('italic');
    });
  });

  describe('edge cases', () => {
    it('should treat unrecognized tags as plain text', () => {
      const s = segs('<unknown>Text</unknown>');
      expect(s.length).toBe(1);
      expect(s[0].text).toBe('<unknown>Text</unknown>');
    });

    it('should handle self-closing tags', () => {
      expect(() => new MarkupText({ text: '<b>B</b><br/>End' })).not.toThrow();
    });

    it('should handle font_size percentage', () => {
      expect(segs('<span font_size="120%">X</span>')[0].fontSize).toBeCloseTo(57.6, 0);
    });

    it('should handle font_size "larger"', () => {
      expect(segs('<span font_size="larger">X</span>')[0].fontSize).toBeCloseTo(57.6, 0);
    });

    it('should handle font_size "smaller"', () => {
      expect(segs('<span font_size="smaller">X</span>')[0].fontSize).toBeCloseTo(39.84, 0);
    });

    it('should handle named absolute sizes', () => {
      // Default fontSize is 48. Named sizes are multipliers.
      expect(segs('<span font_size="xx-small">X</span>')[0].fontSize).toBeCloseTo(48 * 0.5789, 0);
      expect(segs('<span font_size="medium">X</span>')[0].fontSize).toBeCloseTo(48, 0);
      expect(segs('<span font_size="x-large">X</span>')[0].fontSize).toBeCloseTo(48 * 1.44, 0);
      expect(segs('<span font_size="xx-large">X</span>')[0].fontSize).toBeCloseTo(48 * 1.728, 0);
    });

    it('should handle Pango units (>200) in font_size', () => {
      // Value > 200 => divide by 1024
      expect(segs('<span font_size="24576">X</span>')[0].fontSize).toBeCloseTo(24, 0);
    });

    it('should return current size for unparseable font_size', () => {
      expect(segs('<span font_size="abc">X</span>')[0].fontSize).toBeCloseTo(48, 0);
    });

    it('should handle malformed markup: unclosed tag at top level', () => {
      // '<b' without '>' - should treat as text
      const s = segs('<b>Bold</b> then <i unclosed');
      expect(s.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle stray closing tag at top level', () => {
      // Closing tag outside any element
      const s = segs('text</b>more');
      expect(s.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle unknown element tag in Pango markup', () => {
      // <div> is not a recognized Pango tag but has children
      const s = segs('<b><div>text</div></b>');
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s[0].text).toBe('text');
    });

    it('should handle malformed inner markup: no closing >', () => {
      const s = segs('<b>text<i broken');
      expect(s.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle inner text without tags (no < found)', () => {
      // Triggers tagStart === -1 inside inner parser
      const s = segs('<b>just plain text inside</b>');
      expect(s[0].text).toBe('just plain text inside');
    });

    it('should handle span with style="normal"', () => {
      expect(segs('<span style="normal">N</span>')[0].fontStyle).toBe('normal');
    });

    it('should handle span underline="true"', () => {
      expect(segs('<span underline="true">U</span>')[0].underline).toBe(true);
    });
  });

  describe('rendering integration', () => {
    it('should construct with different textAlign options', () => {
      const left = new MarkupText({ text: '<b>Left</b>', textAlign: 'left' });
      const right = new MarkupText({ text: '<b>Right</b>', textAlign: 'right' });
      const center = new MarkupText({ text: '<b>Center</b>', textAlign: 'center' });
      expect(left.getStyledSegments()[0].text).toBe('Left');
      expect(right.getStyledSegments()[0].text).toBe('Right');
      expect(center.getStyledSegments()[0].text).toBe('Center');
    });

    it('should handle text with newlines in segments', () => {
      const mt = new MarkupText({ text: '<b>Line1\nLine2</b>' });
      const s = mt.getStyledSegments();
      // The segments include text with newlines; split happens in _splitStyledSegmentsByLine
      expect(s.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle text with strokeWidth > 0', () => {
      const mt = new MarkupText({ text: '<b>Stroked</b>', strokeWidth: 2 });
      expect(mt.getStyledSegments()[0].text).toBe('Stroked');
    });

    it('should handle background color segment', () => {
      const mt = new MarkupText({ text: '<span background="yellow">Highlighted</span>' });
      expect(mt.getStyledSegments()[0].backgroundColor).toBe('yellow');
    });

    it('should handle underline rendering', () => {
      const mt = new MarkupText({ text: '<u>Underlined text</u>' });
      expect(mt.getStyledSegments()[0].underline).toBe(true);
    });

    it('should handle strikethrough rendering', () => {
      const mt = new MarkupText({ text: '<s>Struck text</s>' });
      expect(mt.getStyledSegments()[0].strikethrough).toBe(true);
    });

    it('should resolve segment font size with relativeScale', () => {
      const mt = new MarkupText({ text: '<big>Big text</big>' });
      const s = mt.getStyledSegments()[0];
      // relativeScale is 1.2 for big; effective font size = 48 * 1.2 = 57.6
      expect(s.relativeScale).toBeCloseTo(1.2, 2);
    });

    it('should handle numeric fontWeight in _buildStyledFontString', () => {
      const mt = new MarkupText({ text: '<span weight="700">Heavy</span>' });
      const s = mt.getStyledSegments()[0];
      expect(s.fontWeight).toBe(700);
    });

    it('should handle segments with custom fontSize and fontFamily', () => {
      const mt = new MarkupText({
        text: '<span font_family="Courier" font_size="24">Custom</span>',
      });
      const s = mt.getStyledSegments()[0];
      expect(s.fontFamily).toBe('Courier');
      expect(s.fontSize).toBe(24);
    });

    it('should handle superscript stacking', () => {
      const s = segs('<sup><sup>2</sup></sup>');
      // Nested sup: shift compounds
      expect(s[0].baselineShift).toBeLessThan(-0.35);
      expect(s[0].relativeScale).toBeCloseTo(0.7 * 0.7, 2);
    });

    it('should handle mixed legacy markdown without overlaps', () => {
      // Use text where patterns don't interfere with each other
      const s = segs('a **bold** and `code` end');
      expect(s.length).toBe(5);
      expect(s[1].text).toBe('bold');
      expect(s[1].fontWeight).toBe('bold');
      expect(s[3].text).toBe('code');
      expect(s[3].fontFamily).toBe('monospace');
    });

    it('should render strikethrough when setText is called', () => {
      const mt = new MarkupText({ text: 'plain' });
      mt.setText('<s>struck</s>');
      const s = mt.getStyledSegments();
      expect(s[0].strikethrough).toBe(true);
    });

    it('should render underline when setText is called', () => {
      const mt = new MarkupText({ text: 'plain' });
      mt.setText('<u>underlined</u>');
      const s = mt.getStyledSegments();
      expect(s[0].underline).toBe(true);
    });

    it('should render background color when setText is called', () => {
      const mt = new MarkupText({ text: 'plain' });
      mt.setText('<span background="yellow">highlighted</span>');
      const s = mt.getStyledSegments();
      expect(s[0].backgroundColor).toBe('yellow');
    });

    it('should render stroke when strokeWidth > 0 and setText is called', () => {
      const mt = new MarkupText({ text: 'plain', strokeWidth: 2 });
      mt.setText('<b>stroked</b>');
      const s = mt.getStyledSegments();
      expect(s[0].text).toBe('stroked');
    });
  });
});

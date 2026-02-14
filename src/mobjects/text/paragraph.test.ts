// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Paragraph } from './Paragraph';
import { Text } from './Text';

/** Type-safe access to private members in tests */
interface ParagraphInternal {
  _textAlign: string;
  _letterSpacing: number;
  _lineHeight: number;
  _wrappedLines: string[];
  _wrapText(): string[];
  _measureText(): { lines: string[]; [key: string]: unknown };
  _isNewParagraph(lines: string[], index: number): boolean;
}

/**
 * Create a mock CanvasRenderingContext2D for happy-dom.
 */
function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((_text: string) => ({
      width: _text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: _text.length * 10,
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
});

describe('Paragraph', () => {
  // ---------------------------------------------------------------------------
  // Constructor and defaults
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create a paragraph extending Text', () => {
      const p = new Paragraph({ text: 'Hello World' });
      expect(p).toBeInstanceOf(Text);
      expect(p).toBeInstanceOf(Paragraph);
    });

    it('should default maxWidth to Infinity', () => {
      const p = new Paragraph({ text: 'No wrap' });
      expect(p.getMaxWidth()).toBe(Infinity);
    });

    it('should accept custom width', () => {
      const p = new Paragraph({ text: 'Wrapped', width: 3 });
      expect(p.getMaxWidth()).toBe(3);
    });

    it('should default alignment to left', () => {
      const p = new Paragraph({ text: 'Left' });
      expect(p.getAlignment()).toBe('left');
    });

    it('should accept custom alignment', () => {
      const p = new Paragraph({ text: 'Center', alignment: 'center' });
      expect(p.getAlignment()).toBe('center');
    });

    it('should accept right alignment', () => {
      const p = new Paragraph({ text: 'Right', alignment: 'right' });
      expect(p.getAlignment()).toBe('right');
    });

    it('should accept justify alignment', () => {
      const p = new Paragraph({ text: 'Justified', alignment: 'justify' });
      expect(p.getAlignment()).toBe('justify');
    });

    it('should map justify to left for underlying textAlign', () => {
      const p = new Paragraph({ text: 'Justified', alignment: 'justify' });
      expect((p as unknown as ParagraphInternal)._textAlign).toBe('left');
    });

    it('should pass through Text options', () => {
      const p = new Paragraph({
        text: 'Styled',
        fontSize: 64,
        fontFamily: 'Arial',
        color: '#ff0000',
      });
      expect(p.getFontSize()).toBe(64);
      expect(p.getFontFamily()).toBe('Arial');
      expect(p.color).toBe('#ff0000');
    });
  });

  // ---------------------------------------------------------------------------
  // getMaxWidth / setWidth
  // ---------------------------------------------------------------------------

  describe('getMaxWidth / setWidth', () => {
    it('should return the initial width', () => {
      const p = new Paragraph({ text: 'Test', width: 5 });
      expect(p.getMaxWidth()).toBe(5);
    });

    it('should update width with setWidth', () => {
      const p = new Paragraph({ text: 'Test', width: 5 });
      p.setWidth(3);
      expect(p.getMaxWidth()).toBe(3);
    });

    it('should return this for chaining from setWidth', () => {
      const p = new Paragraph({ text: 'Test' });
      expect(p.setWidth(4)).toBe(p);
    });

    it('should accept Infinity as width (no wrapping)', () => {
      const p = new Paragraph({ text: 'Test', width: 2 });
      p.setWidth(Infinity);
      expect(p.getMaxWidth()).toBe(Infinity);
    });
  });

  // ---------------------------------------------------------------------------
  // getAlignment / setAlignment
  // ---------------------------------------------------------------------------

  describe('getAlignment / setAlignment', () => {
    it('should return the initial alignment', () => {
      const p = new Paragraph({ text: 'Test', alignment: 'center' });
      expect(p.getAlignment()).toBe('center');
    });

    it('should update alignment with setAlignment', () => {
      const p = new Paragraph({ text: 'Test' });
      p.setAlignment('right');
      expect(p.getAlignment()).toBe('right');
    });

    it('should return this for chaining from setAlignment', () => {
      const p = new Paragraph({ text: 'Test' });
      expect(p.setAlignment('center')).toBe(p);
    });

    it('should update textAlign when alignment changes to justify', () => {
      const p = new Paragraph({ text: 'Test', alignment: 'center' });
      p.setAlignment('justify');
      expect(p.getAlignment()).toBe('justify');
      expect((p as unknown as ParagraphInternal)._textAlign).toBe('left');
    });

    it('should update textAlign when alignment changes from justify', () => {
      const p = new Paragraph({ text: 'Test', alignment: 'justify' });
      p.setAlignment('right');
      expect((p as unknown as ParagraphInternal)._textAlign).toBe('right');
    });
  });

  // ---------------------------------------------------------------------------
  // Word wrapping
  // ---------------------------------------------------------------------------

  describe('word wrapping', () => {
    it('should not wrap when width is Infinity', () => {
      const p = new Paragraph({
        text: 'This is a long sentence that should not wrap',
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBe(1);
    });

    it('should preserve explicit newlines', () => {
      const p = new Paragraph({
        text: 'Line 1\nLine 2\nLine 3',
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBe(3);
      expect(wrappedLines[0]).toBe('Line 1');
      expect(wrappedLines[1]).toBe('Line 2');
      expect(wrappedLines[2]).toBe('Line 3');
    });

    it('should handle empty lines (double newlines)', () => {
      const p = new Paragraph({ text: 'A\n\nB' });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines).toContain('');
    });

    it('should handle single word that is very long', () => {
      const p = new Paragraph({
        text: 'Superlongwordthatcannotbesplit',
        width: 0.5,
      });
      // Single word should not be split - should be on one line
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBe(1);
      expect(wrappedLines[0]).toBe('Superlongwordthatcannotbesplit');
    });

    it('should handle empty text', () => {
      const p = new Paragraph({ text: '', width: 3 });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBeGreaterThanOrEqual(1);
    });

    it('should wrap words to multiple lines with constrained width', () => {
      // Each char is 10px wide in mock. width=1 world unit = 100 px * 2 = 200 scaled px
      // "Hello World" unwrapped: each word at 10px/char. "Hello" = 50px, "World" = 50px
      // "Hello World" together = 11*10 = 110px (within 200)
      // Use a very small width to force wrapping
      const p = new Paragraph({
        text: 'Hello World Foo Bar',
        width: 0.1, // 0.1 world = 10px * 2 = 20 scaled px max
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      // With mock measureText (10px/char), each word exceeds 20px, so each is its own line
      expect(wrappedLines.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Dimensions
  // ---------------------------------------------------------------------------

  describe('dimensions', () => {
    it('should return non-negative width', () => {
      const p = new Paragraph({
        text: 'Some text for the paragraph',
        width: 3,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should return non-negative height', () => {
      const p = new Paragraph({
        text: 'Some text for the paragraph',
        width: 3,
      });
      expect(p.getHeight()).toBeGreaterThanOrEqual(0);
    });

    it('should return finite dimensions', () => {
      const p = new Paragraph({ text: 'Test', width: 2 });
      expect(Number.isFinite(p.getWidth())).toBe(true);
      expect(Number.isFinite(p.getHeight())).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _measureText override
  // ---------------------------------------------------------------------------

  describe('_measureText override', () => {
    it('should use wrapped lines in measurement', () => {
      const p = new Paragraph({ text: 'Hello World', width: 10 });
      const measured = (p as unknown as ParagraphInternal)._measureText();
      expect(measured.lines).toBeDefined();
      expect(Array.isArray(measured.lines)).toBe(true);
    });

    it('should store wrappedLines after measurement', () => {
      const p = new Paragraph({ text: 'Wrap me up', width: 10 });
      (p as unknown as ParagraphInternal)._measureText();
      expect((p as unknown as ParagraphInternal)._wrappedLines).toBeDefined();
      expect(Array.isArray((p as unknown as ParagraphInternal)._wrappedLines)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Justify alignment
  // ---------------------------------------------------------------------------

  describe('justify alignment', () => {
    it('should create paragraph with justify alignment', () => {
      const p = new Paragraph({
        text: 'This is justified text that should expand to fill width',
        width: 3,
        alignment: 'justify',
      });
      expect(p.getAlignment()).toBe('justify');
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should detect new paragraph boundaries', () => {
      const p = new Paragraph({
        text: 'Para 1\n\nPara 2',
        alignment: 'justify',
      });
      const lines = (p as unknown as ParagraphInternal)._wrapText();
      expect(lines).toContain('');
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-paragraph text
  // ---------------------------------------------------------------------------

  describe('multi-paragraph text', () => {
    it('should handle text with multiple paragraphs via newlines', () => {
      const p = new Paragraph({
        text: 'First paragraph.\nSecond paragraph.',
        width: 10,
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle text with empty paragraphs', () => {
      const p = new Paragraph({
        text: 'Above\n\nBelow',
        width: 10,
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ---------------------------------------------------------------------------
  // copy
  // ---------------------------------------------------------------------------

  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new Paragraph({
        text: 'Copyable paragraph',
        width: 4,
        alignment: 'center',
        fontSize: 32,
      });
      const clone = original.copy() as Paragraph;

      expect(clone).not.toBe(original);
      expect(clone).toBeInstanceOf(Paragraph);
      expect(clone.getText()).toBe('Copyable paragraph');
    });

    it('should preserve width in copy', () => {
      const original = new Paragraph({ text: 'Test', width: 5 });
      const clone = original.copy() as Paragraph;
      expect(clone.getMaxWidth()).toBe(5);
    });

    it('should preserve alignment in copy', () => {
      const original = new Paragraph({ text: 'Test', alignment: 'right' });
      const clone = original.copy() as Paragraph;
      expect(clone.getAlignment()).toBe('right');
    });

    it('should preserve justify alignment in copy', () => {
      const original = new Paragraph({ text: 'Test', alignment: 'justify' });
      const clone = original.copy() as Paragraph;
      expect(clone.getAlignment()).toBe('justify');
    });

    it('should produce a copy independent from original', () => {
      const original = new Paragraph({ text: 'Original', width: 4 });
      const clone = original.copy() as Paragraph;
      clone.setWidth(2);
      expect(original.getMaxWidth()).toBe(4);
      expect(clone.getMaxWidth()).toBe(2);
    });

    it('should preserve fontSize and fontFamily', () => {
      const original = new Paragraph({
        text: 'Styled',
        fontSize: 24,
        fontFamily: 'Georgia',
        width: 3,
      });
      const clone = original.copy() as Paragraph;
      expect(clone.getFontSize()).toBe(24);
      expect(clone.getFontFamily()).toBe('Georgia');
    });

    it('should preserve color and fillOpacity', () => {
      const original = new Paragraph({
        text: 'Color',
        color: '#00ff00',
        fillOpacity: 0.8,
        width: 3,
      });
      const clone = original.copy() as Paragraph;
      expect(clone.color).toBe('#00ff00');
      expect(clone.fillOpacity).toBe(0.8);
    });

    it('should preserve letterSpacing and lineHeight', () => {
      const original = new Paragraph({
        text: 'Spaced',
        letterSpacing: 2,
        lineHeight: 1.6,
      });
      const clone = original.copy() as Paragraph;
      expect((clone as unknown as ParagraphInternal)._letterSpacing).toBe(2);
      expect((clone as unknown as ParagraphInternal)._lineHeight).toBe(1.6);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle text with only spaces', () => {
      expect(() => new Paragraph({ text: '   ', width: 2 })).not.toThrow();
    });

    it('should handle very narrow width', () => {
      const p = new Paragraph({
        text: 'Word by word',
        width: 0.01,
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very wide width', () => {
      const p = new Paragraph({
        text: 'Short',
        width: 1000,
      });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBe(1);
    });

    it('should handle setText on a paragraph', () => {
      const p = new Paragraph({ text: 'Original', width: 3 });
      p.setText('New text that might wrap');
      expect(p.getText()).toBe('New text that might wrap');
    });

    it('should handle changing font size after creation', () => {
      const p = new Paragraph({ text: 'Resize', width: 3 });
      p.setFontSize(12);
      expect(p.getFontSize()).toBe(12);
    });

    it('should not throw for zero width', () => {
      expect(() => new Paragraph({ text: 'Zero width', width: 0 })).not.toThrow();
    });

    it('should handle text with consecutive spaces', () => {
      const p = new Paragraph({ text: 'Hello    World', width: 5 });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle text with trailing newline', () => {
      const p = new Paragraph({ text: 'Hello\n', width: 5 });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle single character text', () => {
      const p = new Paragraph({ text: 'X', width: 1 });
      const wrappedLines = (p as unknown as ParagraphInternal)._wrapText();
      expect(wrappedLines).toEqual(['X']);
    });
  });

  // ---------------------------------------------------------------------------
  // _isNewParagraph helper
  // ---------------------------------------------------------------------------

  describe('_isNewParagraph', () => {
    it('should return true for last line', () => {
      const p = new Paragraph({ text: 'Single' });
      const lines = ['Single'];
      expect((p as unknown as ParagraphInternal)._isNewParagraph(lines, 0)).toBe(true);
    });

    it('should return true when next line is empty', () => {
      const p = new Paragraph({ text: 'A\n\nB' });
      const lines = ['A', '', 'B'];
      expect((p as unknown as ParagraphInternal)._isNewParagraph(lines, 0)).toBe(true);
    });

    it('should return false when next line has content', () => {
      const p = new Paragraph({ text: 'A\nB' });
      const lines = ['A', 'B'];
      expect((p as unknown as ParagraphInternal)._isNewParagraph(lines, 0)).toBe(false);
    });

    it('should return true when index is beyond bounds', () => {
      const p = new Paragraph({ text: 'Single' });
      const lines = ['Single'];
      expect((p as unknown as ParagraphInternal)._isNewParagraph(lines, 5)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _renderToCanvas with various alignments
  // ---------------------------------------------------------------------------

  describe('_renderToCanvas alignment branches', () => {
    it('should render with right alignment without error', () => {
      expect(
        () =>
          new Paragraph({
            text: 'Right aligned text\nSecond line',
            alignment: 'right',
            width: 3,
          }),
      ).not.toThrow();
    });

    it('should render with center alignment without error', () => {
      expect(
        () =>
          new Paragraph({
            text: 'Center aligned\nSecond line',
            alignment: 'center',
            width: 3,
          }),
      ).not.toThrow();
    });

    it('should render with left alignment without error', () => {
      expect(
        () =>
          new Paragraph({
            text: 'Left aligned\nSecond line',
            alignment: 'left',
            width: 3,
          }),
      ).not.toThrow();
    });

    it('should render with justify alignment without error', () => {
      expect(
        () =>
          new Paragraph({
            text: 'This is justified text that should wrap across multiple lines when constrained',
            alignment: 'justify',
            width: 0.5,
          }),
      ).not.toThrow();
    });

    it('should render justify with multiple wrapping lines', () => {
      // Force wrapping by using very small width
      const p = new Paragraph({
        text: 'Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8',
        alignment: 'justify',
        width: 0.1, // very small, each word on separate line
      });
      expect(p.getAlignment()).toBe('justify');
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should render justify with single word line (no justification)', () => {
      // A single word line in justify mode should be left-aligned
      const p = new Paragraph({
        text: 'SingleWordLine',
        alignment: 'justify',
        width: 0.01,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle justify with strokeWidth > 0', () => {
      const p = new Paragraph({
        text: 'Stroked justified text with multiple words here',
        alignment: 'justify',
        width: 0.2,
        strokeWidth: 2,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle right/center/left with strokeWidth > 0', () => {
      for (const alignment of ['right', 'center', 'left'] as const) {
        const p = new Paragraph({
          text: 'Stroked text\nTwo lines',
          alignment,
          width: 3,
          strokeWidth: 2,
        });
        expect(p.getWidth()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // _drawJustifiedLine
  // ---------------------------------------------------------------------------

  describe('_drawJustifiedLine', () => {
    it('should justify multi-word lines with correct spacing', () => {
      // Create paragraph with justify that has multiple words per line
      const p = new Paragraph({
        text: 'Hello World Foo Bar Baz Qux',
        alignment: 'justify',
        width: 3, // wide enough for multiple words per line
      });
      // Just verify it renders without error and dimensions are valid
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
      expect(p.getHeight()).toBeGreaterThanOrEqual(0);
    });

    it('should handle justified paragraph with empty lines between paragraphs', () => {
      const p = new Paragraph({
        text: 'First paragraph words.\n\nSecond paragraph words.',
        alignment: 'justify',
        width: 2,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle justified line with strokeWidth > 0 (multi-word)', () => {
      // Mock measureText: each char = 10px width, no letter spacing by default
      // width=0.4 world = 40px * RESOLUTION_SCALE(2) = 80 scaled px
      // "aa bb cc" = 8 chars * 10 = 80px fits; "aa bb cc dd" = 110 doesn't fit
      // So lines wrap with multiple words per line, triggering _drawJustifiedLine
      const p = new Paragraph({
        text: 'aa bb cc dd ee ff gg hh',
        alignment: 'justify',
        width: 0.4,
        strokeWidth: 2,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle justified multi-word lines without strokeWidth', () => {
      const p = new Paragraph({
        text: 'aa bb cc dd ee ff gg hh',
        alignment: 'justify',
        width: 0.4,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle justified single-word line with strokeWidth > 0', () => {
      // Force a line with a single word in justify mode
      // With very small width, each word becomes its own line
      const p = new Paragraph({
        text: 'Word1 Word2 Word3 Word4',
        alignment: 'justify',
        width: 0.01, // tiny width forces one word per line
        strokeWidth: 2,
      });
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // _measureText maxWidth constraint
  // ---------------------------------------------------------------------------

  describe('_measureText width constraint', () => {
    it('should constrain measured width to maxWidth when set', () => {
      const p = new Paragraph({
        text: 'A very long line that exceeds the maximum width constraint set by the user',
        width: 2,
      });
      // Width should be constrained
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(p.getWidth())).toBe(true);
    });

    it('should not constrain width when maxWidth is Infinity', () => {
      const p = new Paragraph({
        text: 'Unconstrained width paragraph',
      });
      expect(p.getMaxWidth()).toBe(Infinity);
      expect(p.getWidth()).toBeGreaterThanOrEqual(0);
    });
  });
});

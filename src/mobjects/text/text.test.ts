// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Text } from './Text';

/** Type-safe access to private members in tests */
interface TextInternal {
  _fontWeight: string | number;
  _fontStyle: string;
  _lineHeight: number;
  _letterSpacing: number;
  _textAlign: string;
  _fontUrl: string;
  _canvas: HTMLCanvasElement | null;
  _ctx: CanvasRenderingContext2D | null;
  _buildFontString(): string;
  _measureText(): { lines: string[]; [key: string]: unknown };
}

/**
 * Create a mock CanvasRenderingContext2D that satisfies Text's needs.
 * happy-dom does not support canvas 2d context, so we must mock it.
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
  // Mock getContext to return our mock 2d context
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') return createMockCtx();
    return null;
  });
});

describe('Text', () => {
  // ---------------------------------------------------------------------------
  // Constructor and defaults
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create text with default options', () => {
      const t = new Text({ text: 'Hello' });
      expect(t.getText()).toBe('Hello');
      expect(t.getFontSize()).toBe(48);
      expect(t.getFontFamily()).toBe('CMU Serif, Georgia, Times New Roman, serif');
    });

    it('should accept custom fontSize', () => {
      const t = new Text({ text: 'Big', fontSize: 96 });
      expect(t.getFontSize()).toBe(96);
    });

    it('should accept custom fontFamily', () => {
      const t = new Text({ text: 'Mono', fontFamily: 'monospace' });
      expect(t.getFontFamily()).toBe('monospace');
    });

    it('should accept custom fontWeight', () => {
      const t = new Text({ text: 'Bold', fontWeight: 'bold' });
      expect((t as unknown as TextInternal)._fontWeight).toBe('bold');
    });

    it('should accept numeric fontWeight', () => {
      const t = new Text({ text: 'W700', fontWeight: 700 });
      expect((t as unknown as TextInternal)._fontWeight).toBe(700);
    });

    it('should accept custom fontStyle', () => {
      const t = new Text({ text: 'Italic', fontStyle: 'italic' });
      expect((t as unknown as TextInternal)._fontStyle).toBe('italic');
    });

    it('should apply custom color', () => {
      const t = new Text({ text: 'Red', color: '#ff0000' });
      expect(t.color).toBe('#ff0000');
    });

    it('should apply default color as white', () => {
      const t = new Text({ text: 'White' });
      expect(t.color).toBe('#ffffff');
    });

    it('should apply fillOpacity', () => {
      const t = new Text({ text: 'Half', fillOpacity: 0.5 });
      expect(t.fillOpacity).toBe(0.5);
    });

    it('should apply default fillOpacity of 1', () => {
      const t = new Text({ text: 'Full' });
      expect(t.fillOpacity).toBe(1);
    });

    it('should apply strokeWidth', () => {
      const t = new Text({ text: 'Stroke', strokeWidth: 2 });
      expect(t.strokeWidth).toBe(2);
    });

    it('should apply custom lineHeight', () => {
      const t = new Text({ text: 'Lines', lineHeight: 1.5 });
      expect((t as unknown as TextInternal)._lineHeight).toBe(1.5);
    });

    it('should apply custom letterSpacing', () => {
      const t = new Text({ text: 'Spaced', letterSpacing: 5 });
      expect((t as unknown as TextInternal)._letterSpacing).toBe(5);
    });

    it('should apply custom textAlign', () => {
      const t = new Text({ text: 'Left', textAlign: 'left' });
      expect((t as unknown as TextInternal)._textAlign).toBe('left');
    });

    it('should default textAlign to center', () => {
      const t = new Text({ text: 'Center' });
      expect((t as unknown as TextInternal)._textAlign).toBe('center');
    });

    it('should store fontUrl when provided', () => {
      const t = new Text({ text: 'Custom', fontUrl: 'http://example.com/font.otf' });
      expect((t as unknown as TextInternal)._fontUrl).toBe('http://example.com/font.otf');
    });
  });

  // ---------------------------------------------------------------------------
  // getText / setText
  // ---------------------------------------------------------------------------

  describe('getText / setText', () => {
    it('should return the initial text', () => {
      const t = new Text({ text: 'Initial' });
      expect(t.getText()).toBe('Initial');
    });

    it('should update text with setText', () => {
      const t = new Text({ text: 'Before' });
      t.setText('After');
      expect(t.getText()).toBe('After');
    });

    it('should return this for chaining from setText', () => {
      const t = new Text({ text: 'A' });
      const result = t.setText('B');
      expect(result).toBe(t);
    });

    it('should handle empty string', () => {
      const t = new Text({ text: '' });
      expect(t.getText()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // getFontSize / setFontSize
  // ---------------------------------------------------------------------------

  describe('getFontSize / setFontSize', () => {
    it('should return the initial font size', () => {
      const t = new Text({ text: 'Size', fontSize: 72 });
      expect(t.getFontSize()).toBe(72);
    });

    it('should update font size', () => {
      const t = new Text({ text: 'Size' });
      t.setFontSize(24);
      expect(t.getFontSize()).toBe(24);
    });

    it('should return this for chaining', () => {
      const t = new Text({ text: 'Size' });
      expect(t.setFontSize(32)).toBe(t);
    });
  });

  // ---------------------------------------------------------------------------
  // getFontFamily / setFontFamily
  // ---------------------------------------------------------------------------

  describe('getFontFamily / setFontFamily', () => {
    it('should return the initial font family', () => {
      const t = new Text({ text: 'Font', fontFamily: 'Arial' });
      expect(t.getFontFamily()).toBe('Arial');
    });

    it('should update font family', () => {
      const t = new Text({ text: 'Font' });
      t.setFontFamily('Courier New');
      expect(t.getFontFamily()).toBe('Courier New');
    });

    it('should return this for chaining', () => {
      const t = new Text({ text: 'Font' });
      expect(t.setFontFamily('serif')).toBe(t);
    });
  });

  // ---------------------------------------------------------------------------
  // getWidth / getHeight
  // ---------------------------------------------------------------------------

  describe('getWidth / getHeight', () => {
    it('should return positive width for non-empty text', () => {
      const t = new Text({ text: 'Width' });
      expect(t.getWidth()).toBeGreaterThan(0);
    });

    it('should return positive height for non-empty text', () => {
      const t = new Text({ text: 'Height' });
      expect(t.getHeight()).toBeGreaterThan(0);
    });

    it('should return finite dimensions', () => {
      const t = new Text({ text: 'Finite' });
      expect(Number.isFinite(t.getWidth())).toBe(true);
      expect(Number.isFinite(t.getHeight())).toBe(true);
    });

    it('should return non-negative dimensions for empty text', () => {
      const t = new Text({ text: '' });
      expect(t.getWidth()).toBeGreaterThanOrEqual(0);
      expect(t.getHeight()).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // _buildFontString
  // ---------------------------------------------------------------------------

  describe('_buildFontString', () => {
    it('should produce correct font string with defaults', () => {
      const t = new Text({ text: 'Test' });
      const fs = (t as unknown as TextInternal)._buildFontString();
      // RESOLUTION_SCALE = 2, so 48 * 2 = 96
      expect(fs).toBe('normal normal 96px CMU Serif, Georgia, Times New Roman, serif');
    });

    it('should include italic when fontStyle is italic', () => {
      const t = new Text({ text: 'Test', fontStyle: 'italic' });
      const fs = (t as unknown as TextInternal)._buildFontString();
      expect(fs).toMatch(/^italic /);
    });

    it('should include bold weight', () => {
      const t = new Text({ text: 'Test', fontWeight: 'bold' });
      const fs = (t as unknown as TextInternal)._buildFontString();
      expect(fs).toContain(' bold ');
    });

    it('should include numeric weight', () => {
      const t = new Text({ text: 'Test', fontWeight: 700 });
      const fs = (t as unknown as TextInternal)._buildFontString();
      expect(fs).toContain(' 700 ');
    });

    it('should scale font size by RESOLUTION_SCALE', () => {
      const t = new Text({ text: 'Test', fontSize: 24 });
      const fs = (t as unknown as TextInternal)._buildFontString();
      // 24 * 2 = 48
      expect(fs).toContain('48px');
    });

    it('should include custom font family', () => {
      const t = new Text({ text: 'Test', fontFamily: 'Helvetica' });
      const fs = (t as unknown as TextInternal)._buildFontString();
      expect(fs).toContain('Helvetica');
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-line text
  // ---------------------------------------------------------------------------

  describe('multi-line text', () => {
    it('should split on newlines in _measureText', () => {
      const t = new Text({ text: 'Line 1\nLine 2\nLine 3' });
      const measured = (t as unknown as TextInternal)._measureText();
      expect(measured.lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });

    it('should handle single line (no newlines)', () => {
      const t = new Text({ text: 'SingleLine' });
      const measured = (t as unknown as TextInternal)._measureText();
      expect(measured.lines).toEqual(['SingleLine']);
    });

    it('should handle consecutive newlines', () => {
      const t = new Text({ text: 'A\n\nB' });
      const measured = (t as unknown as TextInternal)._measureText();
      expect(measured.lines).toEqual(['A', '', 'B']);
    });
  });

  // ---------------------------------------------------------------------------
  // Letter spacing
  // ---------------------------------------------------------------------------

  describe('letter spacing', () => {
    it('should default to 0 letter spacing', () => {
      const t = new Text({ text: 'Tight' });
      expect((t as unknown as TextInternal)._letterSpacing).toBe(0);
    });

    it('should accept positive letter spacing', () => {
      const t = new Text({ text: 'Wide', letterSpacing: 10 });
      expect((t as unknown as TextInternal)._letterSpacing).toBe(10);
    });
  });

  // ---------------------------------------------------------------------------
  // Text alignment
  // ---------------------------------------------------------------------------

  describe('text alignment', () => {
    it('should accept left alignment', () => {
      const t = new Text({ text: 'Left', textAlign: 'left' });
      expect((t as unknown as TextInternal)._textAlign).toBe('left');
    });

    it('should accept right alignment', () => {
      const t = new Text({ text: 'Right', textAlign: 'right' });
      expect((t as unknown as TextInternal)._textAlign).toBe('right');
    });

    it('should accept center alignment', () => {
      const t = new Text({ text: 'Center', textAlign: 'center' });
      expect((t as unknown as TextInternal)._textAlign).toBe('center');
    });
  });

  // ---------------------------------------------------------------------------
  // copy
  // ---------------------------------------------------------------------------

  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new Text({
        text: 'Original',
        fontSize: 64,
        fontFamily: 'Arial',
        color: '#ff0000',
      });
      const clone = original.copy() as Text;

      expect(clone).not.toBe(original);
      expect(clone.getText()).toBe('Original');
      expect(clone.getFontSize()).toBe(64);
      expect(clone.getFontFamily()).toBe('Arial');
      expect(clone.color).toBe('#ff0000');
    });

    it('should produce a copy that is independent of the original', () => {
      const original = new Text({ text: 'Original' });
      const clone = original.copy() as Text;

      clone.setText('Changed');
      expect(original.getText()).toBe('Original');
      expect(clone.getText()).toBe('Changed');
    });

    it('should copy letterSpacing and lineHeight', () => {
      const original = new Text({
        text: 'Test',
        letterSpacing: 3,
        lineHeight: 1.8,
      });
      const clone = original.copy() as Text;

      expect((clone as unknown as TextInternal)._letterSpacing).toBe(3);
      expect((clone as unknown as TextInternal)._lineHeight).toBe(1.8);
    });

    it('should copy textAlign', () => {
      const original = new Text({ text: 'Test', textAlign: 'right' });
      const clone = original.copy() as Text;
      expect((clone as unknown as TextInternal)._textAlign).toBe('right');
    });

    it('should copy fontWeight and fontStyle', () => {
      const original = new Text({
        text: 'Test',
        fontWeight: 'bold',
        fontStyle: 'italic',
      });
      const clone = original.copy() as Text;
      expect((clone as unknown as TextInternal)._fontWeight).toBe('bold');
      expect((clone as unknown as TextInternal)._fontStyle).toBe('italic');
    });

    it('should copy fillOpacity and strokeWidth', () => {
      const original = new Text({
        text: 'Test',
        fillOpacity: 0.7,
        strokeWidth: 3,
      });
      const clone = original.copy() as Text;
      expect(clone.fillOpacity).toBe(0.7);
      expect(clone.strokeWidth).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // dispose
  // ---------------------------------------------------------------------------

  describe('dispose', () => {
    it('should clean up canvas references', () => {
      const t = new Text({ text: 'Dispose me' });
      t.dispose();
      expect((t as unknown as TextInternal)._canvas).toBeNull();
      expect((t as unknown as TextInternal)._ctx).toBeNull();
    });

    it('should not throw when called multiple times', () => {
      const t = new Text({ text: 'Dispose twice' });
      t.dispose();
      expect(() => t.dispose()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // getCenter
  // ---------------------------------------------------------------------------

  describe('getCenter', () => {
    it('should return position as center', () => {
      const t = new Text({ text: 'Center' });
      const center = t.getCenter();
      expect(center).toEqual([0, 0, 0]);
    });

    it('should reflect position changes', () => {
      const t = new Text({ text: 'Moved' });
      t.position.set(1, 2, 3);
      const center = t.getCenter();
      expect(center).toEqual([1, 2, 3]);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle very long text without throwing', () => {
      const longText = 'A'.repeat(10000);
      expect(() => new Text({ text: longText })).not.toThrow();
    });

    it('should handle unicode text', () => {
      const t = new Text({ text: 'Hello' });
      expect(t.getText()).toBe('Hello');
    });

    it('should handle special characters', () => {
      const t = new Text({ text: '<>&"' });
      expect(t.getText()).toBe('<>&"');
    });

    it('should handle zero fontSize gracefully', () => {
      expect(() => new Text({ text: 'Zero', fontSize: 0 })).not.toThrow();
    });
  });
});

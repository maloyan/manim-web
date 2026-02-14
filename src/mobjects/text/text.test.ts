// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
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
  // _renderToCanvas – text alignment branches
  // ---------------------------------------------------------------------------

  describe('_renderToCanvas alignment branches', () => {
    it('should use left alignment (textX = padding)', () => {
      const t = new Text({ text: 'Left aligned', textAlign: 'left' });
      const internal = t as unknown as TextInternal;
      expect(internal._textAlign).toBe('left');
      // Width and height should be positive (canvas was rendered)
      expect(t.getWidth()).toBeGreaterThan(0);
      expect(t.getHeight()).toBeGreaterThan(0);
    });

    it('should use right alignment (textX = width - padding)', () => {
      const t = new Text({ text: 'Right aligned', textAlign: 'right' });
      const internal = t as unknown as TextInternal;
      expect(internal._textAlign).toBe('right');
      expect(t.getWidth()).toBeGreaterThan(0);
    });

    it('should use center alignment by default (textX = width / 2)', () => {
      const t = new Text({ text: 'Center aligned' });
      expect(t.getWidth()).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // _renderToCanvas – stroke path
  // ---------------------------------------------------------------------------

  describe('_renderToCanvas with strokeWidth > 0', () => {
    it('should invoke strokeText when strokeWidth > 0 and letterSpacing == 0', () => {
      const t = new Text({ text: 'Stroked', strokeWidth: 3 });
      // Access internal canvas context to verify strokeText was called
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.strokeText).toHaveBeenCalled();
    });

    it('should invoke fillText when strokeWidth is 0', () => {
      const t = new Text({ text: 'Filled', strokeWidth: 0 });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.fillText).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // _drawTextWithLetterSpacing – letter spacing rendering
  // ---------------------------------------------------------------------------

  describe('_drawTextWithLetterSpacing', () => {
    it('should render with letter spacing and center alignment', () => {
      const t = new Text({ text: 'ABC', letterSpacing: 5, textAlign: 'center' });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      // fillText is called once per character for letter spacing
      expect(ctx.fillText).toHaveBeenCalled();
      expect(t.getWidth()).toBeGreaterThan(0);
    });

    it('should render with letter spacing and right alignment', () => {
      const t = new Text({ text: 'ABC', letterSpacing: 5, textAlign: 'right' });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('should render with letter spacing and left alignment', () => {
      const t = new Text({ text: 'ABC', letterSpacing: 5, textAlign: 'left' });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('should render stroke per character when letterSpacing > 0 and strokeWidth > 0', () => {
      const t = new Text({ text: 'XY', letterSpacing: 3, strokeWidth: 2 });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.strokeText).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('should handle empty string with letter spacing', () => {
      const t = new Text({ text: '', letterSpacing: 5 });
      expect(t.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle single character with letter spacing', () => {
      const t = new Text({ text: 'A', letterSpacing: 10 });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.fillText).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-line rendering with different options
  // ---------------------------------------------------------------------------

  describe('multi-line rendering', () => {
    it('should render multi-line text with left alignment', () => {
      const t = new Text({ text: 'Line1\nLine2', textAlign: 'left' });
      expect(t.getHeight()).toBeGreaterThan(0);
    });

    it('should render multi-line text with right alignment', () => {
      const t = new Text({ text: 'Line1\nLine2', textAlign: 'right' });
      expect(t.getHeight()).toBeGreaterThan(0);
    });

    it('should render multi-line text with letter spacing', () => {
      const t = new Text({ text: 'AB\nCD', letterSpacing: 5, textAlign: 'center' });
      expect(t.getHeight()).toBeGreaterThan(0);
    });

    it('should render multi-line text with strokeWidth > 0', () => {
      const t = new Text({ text: 'A\nB', strokeWidth: 2 });
      const internal = t as unknown as TextInternal;
      const ctx = internal._ctx!;
      expect(ctx.strokeText).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // _createThreeObject, _syncMaterialToThree, getTextureMesh
  // ---------------------------------------------------------------------------

  describe('Three.js integration', () => {
    it('getTextureMesh should return null before _createThreeObject is called', () => {
      const t = new Text({ text: 'Mesh' });
      // Before getThreeObject() is called, _mesh is null
      expect(t.getTextureMesh()).toBeNull();
    });

    it('getTextureMesh should return a Mesh after Three.js object is created', () => {
      const t = new Text({ text: 'Mesh' });
      t.getThreeObject();
      const mesh = t.getTextureMesh();
      expect(mesh).not.toBeNull();
      expect(mesh).toBeInstanceOf(THREE.Mesh);
    });

    it('getGlyphGroup should return null when no glyphs loaded', () => {
      const t = new Text({ text: 'No glyphs' });
      expect(t.getGlyphGroup()).toBeNull();
    });

    it('loadGlyphs should return null when no fontUrl provided', async () => {
      const t = new Text({ text: 'No URL' });
      const result = await t.loadGlyphs();
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // _syncMaterialToThree
  // ---------------------------------------------------------------------------

  describe('_syncMaterialToThree', () => {
    it('should handle canvasDirty flag and re-render canvas', () => {
      const t = new Text({ text: 'Sync' });
      const internal = t as unknown as {
        _canvasDirty: boolean;
        _syncMaterialToThree(): void;
        _ctx: CanvasRenderingContext2D | null;
      };

      // After construction, canvasDirty should be false
      expect(internal._canvasDirty).toBe(false);

      // Mark dirty and call sync
      internal._canvasDirty = true;
      internal._syncMaterialToThree();

      // After sync, canvasDirty should be cleared
      expect(internal._canvasDirty).toBe(false);
    });

    it('should update material opacity when mesh exists', () => {
      const t = new Text({ text: 'Opacity' });
      t.getThreeObject(); // Force mesh creation
      const internal = t as unknown as {
        _syncMaterialToThree(): void;
        _opacity: number;
        _mesh: { material: { opacity: number } } | null;
      };

      expect(internal._mesh).not.toBeNull();
      internal._opacity = 0.5;
      internal._syncMaterialToThree();
      expect(internal._mesh!.material.opacity).toBe(0.5);
    });
  });

  // ---------------------------------------------------------------------------
  // _updateMesh (called from setText / setFontSize / setFontFamily)
  // ---------------------------------------------------------------------------

  describe('_updateMesh', () => {
    it('setText triggers _updateMesh to resize geometry', () => {
      const t = new Text({ text: 'Short' });
      t.getThreeObject(); // Force mesh creation
      const widthBefore = t.getWidth();
      t.setText('A much longer text string here');
      const widthAfter = t.getWidth();
      // The width should change (longer text = wider)
      expect(widthAfter).not.toBe(widthBefore);
    });

    it('setFontSize triggers _updateMesh', () => {
      const t = new Text({ text: 'Scale' });
      t.getThreeObject(); // Force mesh creation
      const heightBefore = t.getHeight();
      t.setFontSize(96);
      const heightAfter = t.getHeight();
      expect(heightAfter).not.toBe(heightBefore);
    });

    it('setFontFamily triggers _updateMesh', () => {
      const t = new Text({ text: 'Family' });
      t.getThreeObject(); // Force mesh creation
      // Just ensure it doesn't throw
      expect(() => t.setFontFamily('monospace')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // dispose with mesh (lines 575-576)
  // ---------------------------------------------------------------------------

  describe('dispose with mesh resources', () => {
    it('should dispose texture, geometry, and material when mesh exists', () => {
      const t = new Text({ text: 'Dispose with mesh' });
      // Force Three.js object creation (lazy init)
      t.getThreeObject();

      const internal = t as unknown as {
        _mesh: THREE.Mesh | null;
        _texture: THREE.CanvasTexture | null;
        _canvas: HTMLCanvasElement | null;
        _ctx: CanvasRenderingContext2D | null;
      };

      expect(internal._mesh).not.toBeNull();
      const geoDispose = vi.spyOn(internal._mesh!.geometry, 'dispose');
      const matDispose = vi.spyOn(internal._mesh!.material as THREE.Material, 'dispose');
      t.dispose();
      expect(geoDispose).toHaveBeenCalled();
      expect(matDispose).toHaveBeenCalled();
      expect(internal._canvas).toBeNull();
      expect(internal._ctx).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // _measureText edge cases
  // ---------------------------------------------------------------------------

  describe('_measureText', () => {
    it('should account for letterSpacing in line width measurement', () => {
      const noSpacing = new Text({ text: 'ABCDEF', letterSpacing: 0 });
      const withSpacing = new Text({ text: 'ABCDEF', letterSpacing: 10 });
      // With letter spacing, measured width should be larger
      expect(withSpacing.getWidth()).toBeGreaterThan(noSpacing.getWidth());
    });

    it('should return empty lines for empty text', () => {
      const t = new Text({ text: '' });
      const measured = (t as unknown as TextInternal)._measureText();
      expect(measured.lines).toEqual(['']);
    });

    it('should handle ctx being null gracefully', () => {
      const t = new Text({ text: 'Test' });
      const internal = t as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _measureText(): { lines: string[]; width: number; height: number };
      };
      internal._ctx = null;
      const result = internal._measureText();
      expect(result).toEqual({ lines: [], width: 0, height: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // _renderToCanvas when canvas/ctx is null
  // ---------------------------------------------------------------------------

  describe('_renderToCanvas null guards', () => {
    it('should return early if canvas is null', () => {
      const t = new Text({ text: 'Guard' });
      const internal = t as unknown as {
        _canvas: HTMLCanvasElement | null;
        _renderToCanvas(): void;
      };
      internal._canvas = null;
      // Should not throw
      expect(() => internal._renderToCanvas()).not.toThrow();
    });

    it('should return early if ctx is null', () => {
      const t = new Text({ text: 'Guard' });
      const internal = t as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _renderToCanvas(): void;
      };
      internal._ctx = null;
      expect(() => internal._renderToCanvas()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // _drawTextWithLetterSpacing null ctx guard
  // ---------------------------------------------------------------------------

  describe('_drawTextWithLetterSpacing null guard', () => {
    it('should return early if ctx is null', () => {
      const t = new Text({ text: 'Guard', letterSpacing: 5 });
      const internal = t as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _drawTextWithLetterSpacing(text: string, startX: number, y: number, fontSize: number): void;
      };
      internal._ctx = null;
      expect(() => internal._drawTextWithLetterSpacing('Test', 0, 0, 48)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // _updateMesh when no mesh
  // ---------------------------------------------------------------------------

  describe('_updateMesh when no mesh', () => {
    it('should return early if _mesh is null', () => {
      const t = new Text({ text: 'No mesh' });
      const internal = t as unknown as {
        _mesh: THREE.Mesh | null;
        _updateMesh(): void;
      };
      internal._mesh = null;
      expect(() => internal._updateMesh()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // _createThreeObject
  // ---------------------------------------------------------------------------

  describe('_createThreeObject', () => {
    it('should return a group when canvas is null', () => {
      const t = new Text({ text: 'Test' });
      const internal = t as unknown as {
        _canvas: HTMLCanvasElement | null;
        _createThreeObject(): THREE.Object3D;
      };
      internal._canvas = null;
      const result = internal._createThreeObject();
      expect(result).toBeInstanceOf(THREE.Group);
    });
  });

  // ---------------------------------------------------------------------------
  // Texture update on re-render
  // ---------------------------------------------------------------------------

  describe('texture update', () => {
    it('should set texture.needsUpdate when texture exists during render', () => {
      const t = new Text({ text: 'Texture' });
      t.getThreeObject(); // Force mesh + texture creation
      const internal = t as unknown as {
        _texture: THREE.CanvasTexture | null;
        _canvasDirty: boolean;
        _renderToCanvas(): void;
      };
      expect(internal._texture).not.toBeNull();
      // Manually set a mock texture with needsUpdate property
      const mockTexture = { needsUpdate: false } as unknown as THREE.CanvasTexture;
      internal._texture = mockTexture;
      internal._canvasDirty = true;
      internal._renderToCanvas();
      expect(mockTexture.needsUpdate).toBe(true);
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

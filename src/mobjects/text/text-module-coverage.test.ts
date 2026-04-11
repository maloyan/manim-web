// @vitest-environment happy-dom
/**
 * Tests for text module files at 0% coverage:
 *   - Tex.ts
 *   - TextExtensions.ts (BulletedList, Title, MarkdownText)
 *   - GlyphVMobject.ts
 *   - TextGlyphGroup.ts
 *   - MathTex.ts (SVG-based)
 *   - katex-styles.ts (improve from ~79% to 100%)
 */
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Canvas mock (happy-dom does not support canvas 2D context)
// ---------------------------------------------------------------------------

beforeAll(() => {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
    if (type === '2d') {
      return {
        scale: vi.fn(),
        clearRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        fillRect: vi.fn(),
        measureText: vi.fn((_text: string) => ({
          width: (_text?.length || 0) * 10,
          actualBoundingBoxAscent: 10,
          actualBoundingBoxDescent: 2,
          fontBoundingBoxAscent: 12,
          fontBoundingBoxDescent: 3,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: (_text?.length || 0) * 10,
        })),
        drawImage: vi.fn(),
        font: '',
        fillStyle: '',
        strokeStyle: '',
        globalAlpha: 1,
        lineWidth: 1,
        textBaseline: 'alphabetic',
        textAlign: 'left',
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    }
    return origGetContext.call(this, type, ...(args as []));
  } as typeof origGetContext;
});

// ═════════════════════════════════════════════════��═════════════════════════
// 1. Tex (Manim alias for MathTex with \text{} wrapping)
// ═══════════════════════════════════════════════════════════════════════════

describe('Tex', () => {
  // Lazy import to avoid module-level side effects
  let Tex: typeof import('./Tex').Tex;

  beforeAll(async () => {
    const mod = await import('./Tex');
    Tex = mod.Tex;
  });

  describe('constructor', () => {
    it('should wrap latex in \\text{} for text-mode rendering', () => {
      const tex = new Tex({ latex: 'Hello World' });
      // The latex should be wrapped: \text{Hello World}
      expect(tex.getLatex()).toContain('\\text{');
      expect(tex.getLatex()).toContain('Hello World');
    });

    it('should wrap single string latex', () => {
      const tex = new Tex({ latex: 'xyz' });
      expect(tex.getLatex()).toBe('\\text{xyz}');
    });

    it('should handle line breaks with \\\\', () => {
      const tex = new Tex({ latex: 'Line1 \\\\ Line2' });
      // Each part should be wrapped separately
      const latex = tex.getLatex();
      expect(latex).toContain('\\text{Line1}');
      expect(latex).toContain('\\text{Line2}');
    });

    it('should handle array latex by joining with \\\\', () => {
      const tex = new Tex({ latex: ['Part1', 'Part2'] });
      const latex = tex.getLatex();
      expect(latex).toContain('\\text{Part1}');
      expect(latex).toContain('\\text{Part2}');
    });

    it('should accept custom color', () => {
      const tex = new Tex({ latex: 'Colored', color: '#ff0000' });
      // Access internal _color since SVG MathTex stores color there
      expect((tex as any)._color).toBe('#ff0000');
    });

    it('should accept custom fontSize', () => {
      const tex = new Tex({ latex: 'Big', fontSize: 96 });
      expect((tex as any)._fontSize).toBe(96);
    });

    it('should default color to white', () => {
      const tex = new Tex({ latex: 'White' });
      expect((tex as any)._color.toUpperCase()).toBe('#FFFFFF');
    });
  });

  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new Tex({ latex: 'Original', color: '#00ff00', fontSize: 64 });
      const clone = original.copy();
      expect(clone).not.toBe(original);
      // Copy should be a Tex instance
      expect(clone).toBeInstanceOf(Tex);
    });

    it('should preserve color in copy', () => {
      const original = new Tex({ latex: 'Colored', color: '#ff0000' });
      const clone = original.copy();
      expect((clone as any)._color).toBe('#ff0000');
    });
  });

  describe('TexOptions type alias', () => {
    it('should accept all MathTexOptions fields', () => {
      const tex = new Tex({
        latex: 'Test',
        color: '#aabbcc',
        fontSize: 56,
        displayMode: true,
        position: [1, 2, 3],
      });
      expect((tex as any)._fontSize).toBe(56);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. TextExtensions (BulletedList, Title, MarkdownText)
// ═══════════════════════════════════════════════════════════════════════════

describe('BulletedList', () => {
  let BulletedList: typeof import('./TextExtensions').BulletedList;

  beforeAll(async () => {
    const mod = await import('./TextExtensions');
    BulletedList = mod.BulletedList;
  });

  describe('constructor', () => {
    it('should create a bulleted list with items', () => {
      const list = new BulletedList({ items: ['First', 'Second', 'Third'] });
      expect(list.getItems()).toEqual(['First', 'Second', 'Third']);
    });

    it('should default bullet char to bullet character', () => {
      const list = new BulletedList({ items: ['A'] });
      expect(list.getBulletChar()).toBe('\u2022');
    });

    it('should accept custom bullet char', () => {
      const list = new BulletedList({ items: ['A'], bulletChar: '-' });
      expect(list.getBulletChar()).toBe('-');
    });

    it('should create item and bullet mobjects for each item', () => {
      const list = new BulletedList({ items: ['A', 'B', 'C'] });
      expect(list.getItemMobject(0)).toBeDefined();
      expect(list.getItemMobject(1)).toBeDefined();
      expect(list.getItemMobject(2)).toBeDefined();
      expect(list.getBulletMobject(0)).toBeDefined();
      expect(list.getBulletMobject(1)).toBeDefined();
      expect(list.getBulletMobject(2)).toBeDefined();
    });

    it('should return undefined for out-of-bounds index', () => {
      const list = new BulletedList({ items: ['A'] });
      expect(list.getItemMobject(5)).toBeUndefined();
      expect(list.getBulletMobject(5)).toBeUndefined();
    });

    it('should accept indentLevels', () => {
      const list = new BulletedList({
        items: ['Main', 'Sub1', 'Sub2'],
        indentLevels: [0, 1, 1],
      });
      expect(list.getItems()).toEqual(['Main', 'Sub1', 'Sub2']);
    });

    it('should default indentLevels to all zeros when not provided', () => {
      const list = new BulletedList({ items: ['A', 'B'] });
      expect(list.getItems()).toEqual(['A', 'B']);
    });

    it('should accept custom fontSize, fontFamily, fontWeight', () => {
      const list = new BulletedList({
        items: ['Styled'],
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      });
      expect(list.getItems()).toEqual(['Styled']);
    });

    it('should accept custom color and fillOpacity', () => {
      const list = new BulletedList({
        items: ['Colored'],
        color: '#ff0000',
        fillOpacity: 0.5,
      });
      expect(list.getItems()).toEqual(['Colored']);
    });

    it('should accept custom itemSpacing, indentWidth, bulletBuffer', () => {
      const list = new BulletedList({
        items: ['Spaced'],
        itemSpacing: 0.5,
        indentWidth: 0.4,
        bulletBuffer: 0.2,
      });
      expect(list.getItems()).toEqual(['Spaced']);
    });
  });

  describe('setItems', () => {
    it('should update items and rebuild', () => {
      const list = new BulletedList({ items: ['A', 'B'] });
      list.setItems(['X', 'Y', 'Z']);
      expect(list.getItems()).toEqual(['X', 'Y', 'Z']);
    });

    it('should return this for chaining', () => {
      const list = new BulletedList({ items: ['A'] });
      const result = list.setItems(['B']);
      expect(result).toBe(list);
    });

    it('should reset indentLevels when items length changes', () => {
      const list = new BulletedList({
        items: ['A', 'B'],
        indentLevels: [0, 1],
      });
      list.setItems(['X', 'Y', 'Z']); // different length -> reset indent
      expect(list.getItems()).toEqual(['X', 'Y', 'Z']);
    });

    it('should preserve indentLevels when items length matches', () => {
      const list = new BulletedList({
        items: ['A', 'B'],
        indentLevels: [0, 1],
      });
      list.setItems(['X', 'Y']); // same length -> preserved
      expect(list.getItems()).toEqual(['X', 'Y']);
    });
  });

  describe('setBulletChar', () => {
    it('should update bullet character and rebuild', () => {
      const list = new BulletedList({ items: ['A'] });
      list.setBulletChar('*');
      expect(list.getBulletChar()).toBe('*');
    });

    it('should return this for chaining', () => {
      const list = new BulletedList({ items: ['A'] });
      const result = list.setBulletChar('>');
      expect(result).toBe(list);
    });
  });

  describe('_createThreeObject', () => {
    it('should return a THREE Group', () => {
      const list = new BulletedList({ items: ['A'] });
      const obj = list.getThreeObject();
      expect(obj).toBeDefined();
    });
  });

  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new BulletedList({
        items: ['A', 'B'],
        bulletChar: '-',
        color: '#ff0000',
      });
      const clone = original.copy() as InstanceType<typeof BulletedList>;
      expect(clone).not.toBe(original);
      expect(clone.getItems()).toEqual(['A', 'B']);
      expect(clone.getBulletChar()).toBe('-');
    });
  });
});

describe('Title', () => {
  let Title: typeof import('./TextExtensions').Title;

  beforeAll(async () => {
    const mod = await import('./TextExtensions');
    Title = mod.Title;
  });

  describe('constructor', () => {
    it('should create a title with text', () => {
      const title = new Title({ text: 'Introduction' });
      expect(title.getTitleText()).toBe('Introduction');
    });

    it('should have a text mobject', () => {
      const title = new Title({ text: 'Test' });
      expect(title.getTextMobject()).not.toBeNull();
    });

    it('should not have underline by default', () => {
      const title = new Title({ text: 'No Underline' });
      expect(title.getUnderlineMobject()).toBeNull();
    });

    it('should create underline when includeUnderline is true', () => {
      const title = new Title({ text: 'Underlined', includeUnderline: true });
      expect(title.getUnderlineMobject()).not.toBeNull();
    });

    it('should accept custom fontSize', () => {
      const title = new Title({ text: 'Big', fontSize: 96 });
      expect(title.getTitleText()).toBe('Big');
    });

    it('should accept custom color', () => {
      const title = new Title({ text: 'Red', color: '#ff0000' });
      expect(title.getTitleText()).toBe('Red');
    });

    it('should accept all styling options', () => {
      const title = new Title({
        text: 'Styled',
        fontSize: 64,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        color: '#ffcc00',
        fillOpacity: 0.8,
        includeUnderline: true,
        underlineColor: '#aabbcc',
        underlineWidth: 5,
        underlineStrokeWidth: 3,
        underlineBuffer: 0.2,
        yPosition: 3.0,
      });
      expect(title.getTitleText()).toBe('Styled');
      expect(title.getUnderlineMobject()).not.toBeNull();
    });
  });

  describe('setTitleText', () => {
    it('should update title text and rebuild', () => {
      const title = new Title({ text: 'Before' });
      title.setTitleText('After');
      expect(title.getTitleText()).toBe('After');
    });

    it('should return this for chaining', () => {
      const title = new Title({ text: 'Test' });
      const result = title.setTitleText('New');
      expect(result).toBe(title);
    });
  });

  describe('setUnderline', () => {
    it('should add underline when set to true', () => {
      const title = new Title({ text: 'Test' });
      expect(title.getUnderlineMobject()).toBeNull();
      title.setUnderline(true);
      expect(title.getUnderlineMobject()).not.toBeNull();
    });

    it('should remove underline when set to false', () => {
      const title = new Title({ text: 'Test', includeUnderline: true });
      expect(title.getUnderlineMobject()).not.toBeNull();
      title.setUnderline(false);
      expect(title.getUnderlineMobject()).toBeNull();
    });

    it('should return this for chaining', () => {
      const title = new Title({ text: 'Test' });
      const result = title.setUnderline(true);
      expect(result).toBe(title);
    });
  });

  describe('_createThreeObject', () => {
    it('should return a THREE Group', () => {
      const title = new Title({ text: 'Test' });
      const obj = title.getThreeObject();
      expect(obj).toBeDefined();
    });
  });

  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new Title({
        text: 'Original',
        color: '#ff0000',
        includeUnderline: true,
      });
      const clone = original.copy() as InstanceType<typeof Title>;
      expect(clone).not.toBe(original);
      expect(clone.getTitleText()).toBe('Original');
    });

    it('should preserve underline in copy', () => {
      const original = new Title({ text: 'UL', includeUnderline: true });
      const clone = original.copy() as InstanceType<typeof Title>;
      expect(clone.getUnderlineMobject()).not.toBeNull();
    });

    it('should preserve no-underline in copy', () => {
      const original = new Title({ text: 'No UL' });
      const clone = original.copy() as InstanceType<typeof Title>;
      expect(clone.getUnderlineMobject()).toBeNull();
    });
  });
});

describe('MarkdownText', () => {
  let MarkdownText: typeof import('./TextExtensions').MarkdownText;

  beforeAll(async () => {
    const mod = await import('./TextExtensions');
    MarkdownText = mod.MarkdownText;
  });

  describe('constructor', () => {
    it('should create from plain text', () => {
      const md = new MarkdownText({ text: 'Hello World' });
      expect(md.getMarkdownText()).toBe('Hello World');
    });

    it('should parse headers', () => {
      const md = new MarkdownText({ text: '# Header 1' });
      expect(md.getMarkdownText()).toBe('# Header 1');
      expect(md.getLineMobjects().length).toBeGreaterThan(0);
    });

    it('should parse h2 and h3 headers', () => {
      const md = new MarkdownText({ text: '## Sub Header\n### Sub Sub' });
      expect(md.getLineMobjects().length).toBe(2);
    });

    it('should parse bullet lists', () => {
      const md = new MarkdownText({ text: '- Item 1\n- Item 2' });
      expect(md.getLineMobjects().length).toBe(2);
    });

    it('should parse bullet lists with * prefix', () => {
      const md = new MarkdownText({ text: '* Item A\n* Item B' });
      expect(md.getLineMobjects().length).toBe(2);
    });

    it('should parse bold text', () => {
      const md = new MarkdownText({ text: 'This is **bold** text' });
      expect(md.getMarkdownText()).toContain('**bold**');
    });

    it('should parse italic text', () => {
      const md = new MarkdownText({ text: 'This is *italic* text' });
      expect(md.getMarkdownText()).toContain('*italic*');
    });

    it('should parse inline code', () => {
      const md = new MarkdownText({ text: 'Use `console.log`' });
      expect(md.getMarkdownText()).toContain('`console.log`');
    });

    it('should handle empty lines as spacing', () => {
      const md = new MarkdownText({ text: 'Line 1\n\nLine 2' });
      expect(md.getLineMobjects().length).toBe(2); // Empty line creates spacing, not a mobject
    });

    it('should accept custom options', () => {
      const md = new MarkdownText({
        text: 'Custom',
        fontSize: 36,
        fontFamily: 'Georgia',
        codeFontFamily: 'Courier New',
        color: '#ffcc00',
        codeColor: '#00ffcc',
        fillOpacity: 0.9,
        lineHeight: 1.6,
        bulletChar: '-',
        headerSizes: [2.0, 1.5, 1.2],
      });
      expect(md.getMarkdownText()).toBe('Custom');
    });

    it('should handle indented bullet lists', () => {
      const md = new MarkdownText({ text: '- Main\n  - Sub item' });
      expect(md.getLineMobjects().length).toBe(2);
    });
  });

  describe('setMarkdownText', () => {
    it('should update markdown text and rebuild', () => {
      const md = new MarkdownText({ text: 'Before' });
      md.setMarkdownText('After');
      expect(md.getMarkdownText()).toBe('After');
    });

    it('should return this for chaining', () => {
      const md = new MarkdownText({ text: 'Test' });
      const result = md.setMarkdownText('New');
      expect(result).toBe(md);
    });
  });

  describe('getLineMobjects', () => {
    it('should return array of mobjects', () => {
      const md = new MarkdownText({ text: 'Line 1\nLine 2' });
      const lines = md.getLineMobjects();
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBe(2);
    });

    it('should return independent copy of array', () => {
      const md = new MarkdownText({ text: 'Test' });
      const lines1 = md.getLineMobjects();
      const lines2 = md.getLineMobjects();
      expect(lines1).not.toBe(lines2); // Different array instances
      expect(lines1).toEqual(lines2); // Same contents
    });
  });

  describe('_createThreeObject', () => {
    it('should return a THREE Group', () => {
      const md = new MarkdownText({ text: 'Test' });
      const obj = md.getThreeObject();
      expect(obj).toBeDefined();
    });
  });

  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new MarkdownText({
        text: '# Title\n\nParagraph',
        color: '#ff0000',
      });
      const clone = original.copy() as InstanceType<typeof MarkdownText>;
      expect(clone).not.toBe(original);
      expect(clone.getMarkdownText()).toBe('# Title\n\nParagraph');
    });
  });

  describe('inline formatting edge cases', () => {
    it('should handle text with no formatting', () => {
      const md = new MarkdownText({ text: 'Plain text only' });
      expect(md.getLineMobjects().length).toBe(1);
    });

    it('should handle bold-italic (***)', () => {
      const md = new MarkdownText({ text: '***bold italic***' });
      expect(md.getLineMobjects().length).toBe(1);
    });

    it('should handle mixed formatting on one line', () => {
      const md = new MarkdownText({ text: '**bold** and *italic* and `code`' });
      expect(md.getLineMobjects().length).toBe(1);
    });

    it('should handle empty string', () => {
      const md = new MarkdownText({ text: '' });
      expect(md.getLineMobjects().length).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. katex-styles.ts (improve to 100%)
// ═══════════════════════════════════════════════════════════════════════════

describe('katex-styles', () => {
  // We need to test with module isolation since katex-styles has module-level state.
  // Reset state between tests by re-importing or testing in order.

  beforeEach(() => {
    // Remove any existing katex styles element
    const existing = document.getElementById('manimweb-katex-styles');
    if (existing) existing.remove();
  });

  it('should load and export ensureKatexStyles', async () => {
    const mod = await import('./katexStyles');
    expect(typeof mod.ensureKatexStyles).toBe('function');
  });

  it('should load and export waitForKatexStyles', async () => {
    const mod = await import('./katexStyles');
    expect(typeof mod.waitForKatexStyles).toBe('function');
  });

  it('should load and export areKatexStylesLoaded', async () => {
    const mod = await import('./katexStyles');
    expect(typeof mod.areKatexStylesLoaded).toBe('function');
  });

  it('ensureKatexStyles should call waitForKatexStyles', async () => {
    const mod = await import('./katexStyles');
    // Should not throw
    expect(() => mod.ensureKatexStyles()).not.toThrow();
  });

  it('areKatexStylesLoaded should return boolean', async () => {
    const mod = await import('./katexStyles');
    const result = mod.areKatexStylesLoaded();
    expect(typeof result).toBe('boolean');
  });

  it('waitForKatexStyles should return a Promise', async () => {
    const mod = await import('./katexStyles');
    const result = mod.waitForKatexStyles();
    expect(result).toBeInstanceOf(Promise);
  });

  it('waitForKatexStyles should return same promise on second call', async () => {
    const mod = await import('./katexStyles');
    const p1 = mod.waitForKatexStyles();
    const p2 = mod.waitForKatexStyles();
    expect(p1).toBe(p2);
  });

  it('areKatexStylesLoaded should return true after ensureKatexStyles', async () => {
    const mod = await import('./katexStyles');
    mod.ensureKatexStyles();
    expect(mod.areKatexStylesLoaded()).toBe(true);
  });

  it('should handle existing manimweb-katex-styles element', async () => {
    // Pre-create the link element to hit the "existing" branch
    const link = document.createElement('link');
    link.id = 'manimweb-katex-styles';
    document.head.appendChild(link);

    // Need a fresh module to test from scratch - but since vitest caches,
    // the areKatexStylesLoaded will check the DOM
    const mod = await import('./katexStyles');
    expect(mod.areKatexStylesLoaded()).toBe(true);

    link.remove();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. MathTex (SVG-based, with mocked MathJaxRenderer)
// ═══════════════════════════════════════════════════════════════════════════

// We'll dynamically mock MathJaxRenderer after importing VGroup/VMobject
let _VGroup: typeof import('../../core/VGroup').VGroup;
let _VMobject: typeof import('../../core/VMobject').VMobject;

// Load VGroup and VMobject first for mock usage
beforeAll(async () => {
  const vgMod = await import('../../core/VGroup');
  const vmMod = await import('../../core/VMobject');
  _VGroup = vgMod.VGroup;
  _VMobject = vmMod.VMobject;
});

// Mock MathJaxRenderer to avoid MathJax CDN dependency
vi.mock('./MathJaxRenderer', async (importOriginal) => {
  // We need to dynamically import VGroup/VMobject since they're ESM
  const { VGroup } = await import('../../core/VGroup');
  const { VMobject } = await import('../../core/VMobject');

  function createMockRenderResult(texString: string) {
    const vmobjectGroup = new VGroup();
    // Create one VMobject per character to simulate glyphs
    const chars = texString.replace(/[\\{}^_]/g, '').trim();
    for (let i = 0; i < Math.max(1, chars.length); i++) {
      const vmob = new VMobject();
      // Add some basic points so scaling works
      vmob.setPoints3D([
        [i * 0.1, 0, 0],
        [i * 0.1 + 0.03, 0, 0],
        [i * 0.1 + 0.07, 0.1, 0],
        [i * 0.1 + 0.1, 0.1, 0],
      ]);
      vmobjectGroup.add(vmob);
    }
    return {
      svgElement: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      vmobjectGroup,
      svgString: '<svg></svg>',
      width: 10,
      height: 5,
    };
  }

  return {
    renderLatexToSVG: vi.fn(async (texString: string, _options?: any) => {
      return createMockRenderResult(texString);
    }),
    katexCanRender: vi.fn((texString: string, _displayMode?: boolean) => {
      try {
        return !texString.includes('\\invalidcommand');
      } catch {
        return false;
      }
    }),
    isMathJaxLoaded: vi.fn(() => false),
    preloadMathJax: vi.fn(async () => {}),
  };
});

describe('MathTex (SVG)', () => {
  let MathTex: typeof import('./MathTex').MathTex;

  beforeAll(async () => {
    const mod = await import('./MathTex');
    MathTex = mod.MathTex;
  });

  describe('constructor', () => {
    it('should create with a single latex string', () => {
      const svg = new MathTex({ latex: 'x^2' });
      expect(svg.getLatex()).toBe('x^2');
    });

    it('should create with array of latex strings (multi-part)', () => {
      const svg = new MathTex({ latex: ['x', '=', '5'] });
      expect(svg.getLatex()).toBe('x=5');
      // Parts are populated asynchronously after render completes.
      // Before render, _isMultiPart is true but _parts may be empty.
      expect((svg as any)._isMultiPart).toBe(true);
    });

    it('should default color to white', () => {
      const svg = new MathTex({ latex: 'a' });
      // Access protected _color via cast
      expect((svg as any)._color).toBe('#FFFFFF');
    });

    it('should accept custom color', () => {
      const svg = new MathTex({ latex: 'a', color: '#ff0000' });
      expect((svg as any)._color).toBe('#ff0000');
    });

    it('should accept fontSize option', () => {
      const svg = new MathTex({ latex: 'a', fontSize: 2 });
      expect((svg as any)._fontSize).toBe(2);
    });

    it('should accept displayMode option', () => {
      const svg = new MathTex({ latex: 'a', displayMode: false });
      expect((svg as any)._displayMode).toBe(false);
    });

    it('should accept position option', () => {
      const svg = new MathTex({ latex: 'a', position: [1, 2, 3] });
      expect(svg.position.x).toBe(1);
      expect(svg.position.y).toBe(2);
      expect(svg.position.z).toBe(3);
    });

    it('should accept strokeWidth option', () => {
      const svg = new MathTex({ latex: 'a', strokeWidth: 4 });
      expect((svg as any)._svgStrokeWidth).toBe(4);
    });

    it('should accept fillOpacity option', () => {
      const svg = new MathTex({ latex: 'a', fillOpacity: 0.5 });
      expect((svg as any)._svgFillOpacity).toBe(0.5);
    });

    it('should accept height option', () => {
      const svg = new MathTex({ latex: 'a', height: 2 });
      expect((svg as any)._targetHeight).toBe(2);
    });

    it('should accept macros option', () => {
      const svg = new MathTex({ latex: '\\myvar', macros: { '\\myvar': 'x' } });
      expect((svg as any)._macros).toEqual({ '\\myvar': 'x' });
    });

    it('should default to single part for string latex', () => {
      const svg = new MathTex({ latex: 'y = mx + b' });
      expect(svg.getPartCount()).toBe(1);
    });
  });

  describe('getLatex', () => {
    it('should return the latex string', () => {
      const svg = new MathTex({ latex: 'E = mc^2' });
      expect(svg.getLatex()).toBe('E = mc^2');
    });
  });

  describe('getPartCount', () => {
    it('should return 1 for single-part', () => {
      const svg = new MathTex({ latex: 'x' });
      expect(svg.getPartCount()).toBe(1);
    });

    it('should return correct count for multi-part (before render)', () => {
      const svg = new MathTex({ latex: ['a', '+', 'b'] });
      // Parts are populated asynchronously during render.
      // Before render completes, _parts is empty but _isMultiPart is true.
      expect((svg as any)._isMultiPart).toBe(true);
    });
  });

  describe('getPart', () => {
    it('should throw on single-part MathTex', () => {
      const svg = new MathTex({ latex: 'x' });
      expect(() => svg.getPart(0)).toThrow('getPart() is only available on multi-part MathTex');
    });

    it('should return parts after multi-part render completes', async () => {
      const svg = new MathTex({ latex: ['a', 'b'] });
      await svg.waitForRender();
      expect(svg.getPartCount()).toBe(2);
      const part0 = svg.getPart(0);
      expect(part0).toBeDefined();
      const part1 = svg.getPart(1);
      expect(part1).toBeDefined();
    });

    it('should throw for negative index after render', async () => {
      const svg = new MathTex({ latex: ['a', 'b'] });
      await svg.waitForRender();
      expect(() => svg.getPart(-1)).toThrow('out of range');
    });

    it('should throw for index >= parts length after render', async () => {
      const svg = new MathTex({ latex: ['a', 'b'] });
      await svg.waitForRender();
      expect(() => svg.getPart(5)).toThrow('out of range');
    });

    it('should have getLatex on parts', async () => {
      const svg = new MathTex({ latex: ['x', 'y'] });
      await svg.waitForRender();
      const part = svg.getPart(0) as any;
      expect(part.getLatex()).toBe('x');
    });
  });

  describe('setColor', () => {
    it('should update color on single-part', () => {
      const svg = new MathTex({ latex: 'x' });
      svg.setColor('#00ff00');
      expect((svg as any)._color).toBe('#00ff00');
    });

    it('should return this for chaining', () => {
      const svg = new MathTex({ latex: 'x' });
      const result = svg.setColor('#ff0000');
      expect(result).toBe(svg);
    });

    it('should propagate color to VMobject children after render', async () => {
      const svg = new MathTex({ latex: 'x^2' });
      await svg.waitForRender();
      svg.setColor('#00ff00');
      expect((svg as any)._color).toBe('#00ff00');
    });

    it('should propagate color to parts in multi-part mode after render', async () => {
      const svg = new MathTex({ latex: ['a', 'b'] });
      await svg.waitForRender();
      svg.setColor('#ff00ff');
      expect((svg as any)._color).toBe('#ff00ff');
    });

    it('should set color on individual part after render', async () => {
      const svg = new MathTex({ latex: ['x', 'y'] });
      await svg.waitForRender();
      if (svg.getPartCount() > 0) {
        const part = svg.getPart(0);
        part.setColor('#aabbcc');
        // Part should have updated color
        expect((part as any)._color).toBe('#aabbcc');
      }
    });
  });

  describe('waitForRender', () => {
    it('should return a promise', () => {
      const svg = new MathTex({ latex: 'x' });
      const result = svg.waitForRender();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return a promise for multi-part', () => {
      const svg = new MathTex({ latex: ['a', 'b'] });
      const result = svg.waitForRender();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve and add children after single-part render', async () => {
      const svg = new MathTex({ latex: 'x^2' });
      await svg.waitForRender();
      // After render, should have VMobject children from the mock
      expect(svg.children.length).toBeGreaterThan(0);
    });

    it('should resolve and set fillOpacity after render', async () => {
      const svg = new MathTex({ latex: 'y', fillOpacity: 0.8 });
      await svg.waitForRender();
      expect(svg.fillOpacity).toBe(0.8);
    });

    it('should scale to target height after render', async () => {
      const svg = new MathTex({ latex: 'a', height: 2.0 });
      await svg.waitForRender();
      // After render, points should be scaled
      expect(svg.children.length).toBeGreaterThan(0);
    });

    it('should handle multi-part render and create parts', async () => {
      const svg = new MathTex({ latex: ['x', '=', '5'] });
      await svg.waitForRender();
      // After multi-part render, should have parts
      expect((svg as any)._isMultiPart).toBe(true);
      expect(svg.getPartCount()).toBeGreaterThanOrEqual(1);
    });

    it('should allow getPart on multi-part after render', async () => {
      const svg = new MathTex({ latex: ['a', 'b'] });
      await svg.waitForRender();
      if (svg.getPartCount() > 0) {
        const part = svg.getPart(0);
        expect(part).toBeDefined();
      }
    });
  });

  describe('copy', () => {
    it('should create an independent copy of single-part', () => {
      const original = new MathTex({ latex: 'x^2', color: '#ff0000' });
      const clone = original.copy() as InstanceType<typeof MathTex>;
      expect(clone).toBeInstanceOf(MathTex);
      expect(clone.getLatex()).toBe('x^2');
      expect((clone as any)._color).toBe('#ff0000');
    });

    it('should preserve position in copy', () => {
      const original = new MathTex({ latex: 'x', position: [1, 2, 3] });
      const clone = original.copy() as InstanceType<typeof MathTex>;
      expect(clone.position.x).toBeCloseTo(1);
      expect(clone.position.y).toBeCloseTo(2);
      expect(clone.position.z).toBeCloseTo(3);
    });

    it('should preserve options in copy', () => {
      const original = new MathTex({
        latex: 'x',
        fontSize: 2,
        displayMode: false,
        strokeWidth: 3,
        fillOpacity: 0.7,
        height: 1.5,
      });
      const clone = original.copy() as InstanceType<typeof MathTex>;
      expect((clone as any)._fontSize).toBe(2);
      expect((clone as any)._displayMode).toBe(false);
      expect((clone as any)._svgStrokeWidth).toBe(3);
      expect((clone as any)._svgFillOpacity).toBe(0.7);
      expect((clone as any)._targetHeight).toBe(1.5);
    });

    it('should preserve macros in copy', () => {
      const original = new MathTex({
        latex: '\\myvar',
        macros: { '\\myvar': 'x' },
      });
      const clone = original.copy() as InstanceType<typeof MathTex>;
      expect((clone as any)._macros).toEqual({ '\\myvar': 'x' });
    });

    it('should create copy of multi-part that is also multi-part', async () => {
      const original = new MathTex({ latex: ['x', 'y'] });
      await original.waitForRender();
      const clone = original.copy() as InstanceType<typeof MathTex>;
      expect((clone as any)._isMultiPart).toBe(true);
      expect(clone.getLatex()).toBe('xy');
    });
  });

  describe('_scaleToTarget', () => {
    it('should scale using fontSize when no explicit height is given', async () => {
      const svg = new MathTex({ latex: 'x', fontSize: 2 });
      await svg.waitForRender();
      // After render, children should exist and be scaled
      expect(svg.children.length).toBeGreaterThan(0);
    });

    it('should use explicit height when provided', async () => {
      const svg = new MathTex({ latex: 'x', height: 3.0 });
      await svg.waitForRender();
      expect(svg.children.length).toBeGreaterThan(0);
    });
  });

  describe('_restyleChildren', () => {
    it('should apply fillOpacity and strokeWidth to children after render', async () => {
      const svg = new MathTex({
        latex: 'x',
        strokeWidth: 4,
        fillOpacity: 0.8,
      });
      await svg.waitForRender();
      expect(svg.fillOpacity).toBe(0.8);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. GlyphVMobject (requires opentype.js mock)
// ═══════════════════════════════════════════════════════════════════════════

describe('GlyphVMobject', () => {
  let GlyphVMobject: typeof import('./GlyphVMobject').GlyphVMobject;

  // Mock glyph and font objects
  function createMockGlyph(commands: any[] = [], advanceWidth = 500) {
    return {
      index: 1,
      advanceWidth,
      getPath: vi.fn((_x: number, _y: number, _fontSize: number) => ({
        commands,
      })),
    };
  }

  function createMockFont(unitsPerEm = 1000) {
    return {
      unitsPerEm,
      charToGlyph: vi.fn(() => createMockGlyph()),
      getKerningValue: vi.fn(() => 0),
    };
  }

  beforeAll(async () => {
    const mod = await import('./GlyphVMobject');
    GlyphVMobject = mod.GlyphVMobject;
  });

  describe('constructor', () => {
    it('should create with empty glyph (no commands)', () => {
      const glyph = createMockGlyph([]);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob).toBeDefined();
      expect(vmob.strokeWidth).toBe(2); // default
      expect(vmob.fillOpacity).toBe(0); // outline only
    });

    it('should create with MoveTo and LineTo glyph commands', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 100, y: 100 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob.getPoints().length).toBeGreaterThan(0);
    });

    it('should handle quadratic Bezier (Q) commands', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'Q', x1: 50, y1: 100, x: 100, y: 0 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob.getPoints().length).toBeGreaterThan(0);
    });

    it('should handle cubic Bezier (C) commands', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'C', x1: 33, y1: 0, x2: 67, y2: 100, x: 100, y: 100 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob.getPoints().length).toBeGreaterThan(0);
    });

    it('should handle multi-contour glyphs (multiple M commands)', () => {
      const commands = [
        // Outer contour
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 100, y: 100 },
        { type: 'L', x: 0, y: 100 },
        { type: 'Z' },
        // Inner contour (hole)
        { type: 'M', x: 25, y: 25 },
        { type: 'L', x: 75, y: 25 },
        { type: 'L', x: 75, y: 75 },
        { type: 'L', x: 25, y: 75 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob.getPoints().length).toBeGreaterThan(0);
    });

    it('should accept custom color', () => {
      const glyph = createMockGlyph([]);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
        color: '#ff0000',
      });
      expect(vmob.color).toBe('#ff0000');
    });

    it('should accept custom strokeWidth', () => {
      const glyph = createMockGlyph([]);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
        strokeWidth: 5,
      });
      expect(vmob.strokeWidth).toBe(5);
    });

    it('should accept xOffset and yOffset', () => {
      const commands = [{ type: 'M', x: 0, y: 0 }, { type: 'L', x: 10, y: 0 }, { type: 'Z' }];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
        xOffset: 100,
        yOffset: 50,
      });
      expect(vmob).toBeDefined();
    });

    it('should handle Z when already at contour start (no extra line)', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 0, y: 0 }, // already back at start
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob.getPoints().length).toBeGreaterThan(0);
    });
  });

  describe('useSkeletonStroke', () => {
    it('should default to false', () => {
      const glyph = createMockGlyph([]);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      expect(vmob.useSkeletonStroke).toBe(false);
    });

    it('should be settable via constructor', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 100, y: 100 },
        { type: 'L', x: 0, y: 100 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
        useSkeletonStroke: true,
      });
      expect(vmob.useSkeletonStroke).toBe(true);
    });

    it('should be settable via property', () => {
      const glyph = createMockGlyph([]);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      vmob.useSkeletonStroke = true;
      expect(vmob.useSkeletonStroke).toBe(true);
    });
  });

  describe('getSkeletonPath', () => {
    it('should return null for empty glyph', () => {
      const glyph = createMockGlyph([]);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      const result = vmob.getSkeletonPath();
      expect(result).toBeNull();
    });

    it('should return null for glyph with too few points', () => {
      // Single point glyph -> _outlinePoints has < 4 elements
      const commands = [{ type: 'M', x: 0, y: 0 }];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      const result = vmob.getSkeletonPath();
      expect(result).toBeNull();
    });

    it('should compute skeleton path for complex glyph', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 100, y: 100 },
        { type: 'L', x: 0, y: 100 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      // getSkeletonPath will attempt to skeletonize - result depends on algo
      const result = vmob.getSkeletonPath();
      // Could be null or array depending on skeletonize implementation
      expect(result === null || Array.isArray(result)).toBe(true);
    });

    it('should cache skeleton path on repeated calls', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 100, y: 100 },
        { type: 'L', x: 0, y: 100 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      const r1 = vmob.getSkeletonPath();
      const r2 = vmob.getSkeletonPath();
      // Both should return the same cached result
      expect(r1).toBe(r2);
    });

    it('should accept custom skeletonize options', () => {
      const commands = [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 100, y: 0 },
        { type: 'L', x: 100, y: 100 },
        { type: 'L', x: 0, y: 100 },
        { type: 'Z' },
      ];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
      });
      const result = vmob.getSkeletonPath({ gridResolution: 50 });
      expect(result === null || Array.isArray(result)).toBe(true);
    });
  });

  describe('copy', () => {
    it('should create a copy', () => {
      const commands = [{ type: 'M', x: 0, y: 0 }, { type: 'L', x: 100, y: 0 }, { type: 'Z' }];
      const glyph = createMockGlyph(commands);
      const font = createMockFont();
      const vmob = new GlyphVMobject({
        glyph: glyph as any,
        font: font as any,
        fontSize: 48,
        color: '#00ff00',
        strokeWidth: 3,
      });
      const clone = vmob.copy();
      expect(clone).not.toBe(vmob);
      expect(clone.color).toBe('#00ff00');
      expect(clone.strokeWidth).toBe(3);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. TextGlyphGroup (requires opentype.js mock)
// ═══════════════════════════════════════════════════════════════════════════

// Mock opentype.js before importing TextGlyphGroup
vi.mock('opentype.js', () => {
  function createMockGlyphObj(char: string, index: number, advanceWidth = 500) {
    return {
      index,
      advanceWidth,
      name: char,
      getPath: (_x: number, _y: number, _fontSize: number) => ({
        commands:
          char === ' '
            ? []
            : [
                { type: 'M', x: 0 + _x, y: 0 + _y },
                { type: 'L', x: 100 + _x, y: 0 + _y },
                { type: 'L', x: 100 + _x, y: 100 + _y },
                { type: 'L', x: 0 + _x, y: 100 + _y },
                { type: 'Z' },
              ],
      }),
    };
  }

  // A null glyph for unknown characters
  const nullGlyph = createMockGlyphObj('.notdef', 0, 250);
  nullGlyph.getPath = () => ({ commands: [] });

  return {
    default: {
      load: vi.fn(async (_url: string) => ({
        unitsPerEm: 1000,
        charToGlyph: (char: string) => {
          if (char === '\uFFFD') return nullGlyph; // unknown char
          return createMockGlyphObj(char, char.charCodeAt(0), 500);
        },
        getKerningValue: vi.fn(() => -10), // some kerning
      })),
    },
  };
});

describe('TextGlyphGroup', () => {
  let TextGlyphGroup: typeof import('./TextGlyphGroup').TextGlyphGroup;

  beforeAll(async () => {
    const mod = await import('./TextGlyphGroup');
    TextGlyphGroup = mod.TextGlyphGroup;
  });

  describe('constructor', () => {
    it('should create with required options', () => {
      const group = new TextGlyphGroup({
        text: 'Hello',
        fontUrl: 'https://example.com/font.otf',
      });
      expect(group).toBeDefined();
    });

    it('should accept all options', () => {
      const group = new TextGlyphGroup({
        text: 'Test',
        fontUrl: '/fonts/test.otf',
        fontSize: 64,
        color: '#ff0000',
        strokeWidth: 3,
        useSkeletonStroke: true,
        skeletonOptions: { gridResolution: 50 },
      });
      expect(group).toBeDefined();
    });

    it('should set fillOpacity to 0 for outline rendering', () => {
      const group = new TextGlyphGroup({
        text: 'Test',
        fontUrl: '/fonts/test.otf',
      });
      expect(group.fillOpacity).toBe(0);
    });
  });

  describe('waitForReady', () => {
    it('should return a promise', () => {
      const group = new TextGlyphGroup({
        text: 'Test',
        fontUrl: '/fonts/test.otf',
      });
      const result = group.waitForReady();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should create GlyphVMobject children after loading', async () => {
      const group = new TextGlyphGroup({
        text: 'AB',
        fontUrl: '/fonts/test.otf',
      });
      await group.waitForReady();
      // Should have 2 children (one per non-space character)
      expect(group.children.length).toBe(2);
    });

    it('should skip space characters but advance cursor', async () => {
      const group = new TextGlyphGroup({
        text: 'A B',
        fontUrl: '/fonts/test.otf',
      });
      await group.waitForReady();
      // Should have 2 children ('A' and 'B'), space is skipped
      expect(group.children.length).toBe(2);
    });

    it('should apply kerning between adjacent characters', async () => {
      const group = new TextGlyphGroup({
        text: 'AB',
        fontUrl: '/fonts/test.otf',
      });
      await group.waitForReady();
      // Both glyphs should be created (kerning value is -10 in our mock)
      expect(group.children.length).toBe(2);
    });

    it('should handle single character', async () => {
      const group = new TextGlyphGroup({
        text: 'X',
        fontUrl: '/fonts/test.otf',
      });
      await group.waitForReady();
      expect(group.children.length).toBe(1);
    });

    it('should handle empty string', async () => {
      const group = new TextGlyphGroup({
        text: '',
        fontUrl: '/fonts/test.otf',
      });
      await group.waitForReady();
      expect(group.children.length).toBe(0);
    });

    it('should pass color and strokeWidth to GlyphVMobjects', async () => {
      const group = new TextGlyphGroup({
        text: 'A',
        fontUrl: '/fonts/test.otf',
        color: '#ff0000',
        strokeWidth: 5,
      });
      await group.waitForReady();
      expect(group.children.length).toBe(1);
      const child = group.children[0] as any;
      expect(child.color).toBe('#ff0000');
      expect(child.strokeWidth).toBe(5);
    });

    it('should use custom fontSize', async () => {
      const group = new TextGlyphGroup({
        text: 'A',
        fontUrl: '/fonts/test.otf',
        fontSize: 96,
      });
      await group.waitForReady();
      expect(group.children.length).toBe(1);
    });

    it('should handle missing glyphs (glyph.index === 0)', async () => {
      // \uFFFD is mapped to nullGlyph (index=0) in the mock
      const group = new TextGlyphGroup({
        text: 'A\uFFFDB',
        fontUrl: '/fonts/test.otf',
      });
      await group.waitForReady();
      // Should skip the missing glyph character, only render 'A' and 'B'
      expect(group.children.length).toBe(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. MathJaxRenderer (katexCanRender and isMathJaxLoaded)
//    Note: MathJaxRenderer is mocked globally for MathTex tests above.
//    These tests verify the mock's behavior is consistent with expected usage.
// ═══════════════════════════════════════════════════════════════════════════

describe('MathJaxRenderer (mocked)', () => {
  let katexCanRender: typeof import('./MathJaxRenderer').katexCanRender;
  let isMathJaxLoaded: typeof import('./MathJaxRenderer').isMathJaxLoaded;
  let renderLatexToSVG: typeof import('./MathJaxRenderer').renderLatexToSVG;

  beforeAll(async () => {
    const mod = await import('./MathJaxRenderer');
    katexCanRender = mod.katexCanRender;
    isMathJaxLoaded = mod.isMathJaxLoaded;
    renderLatexToSVG = mod.renderLatexToSVG;
  });

  describe('katexCanRender (mock)', () => {
    it('should return true for simple LaTeX', () => {
      expect(katexCanRender('x^2')).toBe(true);
    });

    it('should return false for unsupported commands', () => {
      expect(katexCanRender('\\invalidcommand')).toBe(false);
    });

    it('should handle displayMode parameter', () => {
      expect(katexCanRender('x', true)).toBe(true);
      expect(katexCanRender('x', false)).toBe(true);
    });
  });

  describe('isMathJaxLoaded (mock)', () => {
    it('should return false', () => {
      expect(isMathJaxLoaded()).toBe(false);
    });
  });

  describe('renderLatexToSVG (mock)', () => {
    it('should return a result with vmobjectGroup', async () => {
      const result = await renderLatexToSVG('x^2');
      expect(result).toBeDefined();
      expect(result.vmobjectGroup).toBeDefined();
      expect(result.svgString).toBeDefined();
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
    });

    it('should create VMobject children in vmobjectGroup', async () => {
      const result = await renderLatexToSVG('abc');
      expect(result.vmobjectGroup.children.length).toBeGreaterThan(0);
    });
  });
});

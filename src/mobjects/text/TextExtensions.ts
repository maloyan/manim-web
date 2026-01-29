import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Text } from './Text';

// ============================================================================
// BulletedList
// ============================================================================

/**
 * Options for creating a BulletedList mobject
 */
export interface BulletedListOptions {
  /** Array of text items to display */
  items: string[];
  /** Bullet character. Default: '•' */
  bulletChar?: string;
  /** Font size in pixels. Default: 48 */
  fontSize?: number;
  /** Font family. Default: 'sans-serif' */
  fontFamily?: string;
  /** Font weight. Default: 'normal' */
  fontWeight?: string | number;
  /** Text color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Vertical spacing between items in world units. Default: 0.35 */
  itemSpacing?: number;
  /** Horizontal indent per level in world units. Default: 0.3 */
  indentWidth?: number;
  /** Indentation levels for each item (0 = no indent). Default: all 0 */
  indentLevels?: number[];
  /** Space between bullet and text in world units. Default: 0.15 */
  bulletBuffer?: number;
}

/**
 * BulletedList - A list of text items with bullet points
 *
 * Creates a vertically arranged list of text items, each prefixed with
 * a bullet character. Supports multiple indentation levels for nested lists.
 *
 * @example
 * ```typescript
 * // Simple bulleted list
 * const list = new BulletedList({
 *   items: ['First item', 'Second item', 'Third item']
 * });
 *
 * // Nested list with custom bullet
 * const nested = new BulletedList({
 *   items: ['Main item', 'Sub item 1', 'Sub item 2', 'Another main'],
 *   indentLevels: [0, 1, 1, 0],
 *   bulletChar: '-'
 * });
 *
 * // Custom styling
 * const styled = new BulletedList({
 *   items: ['Red', 'Green', 'Blue'],
 *   color: '#ffcc00',
 *   fontSize: 36,
 *   itemSpacing: 0.5
 * });
 * ```
 */
export class BulletedList extends VMobject {
  protected _items: string[];
  protected _bulletChar: string;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _fontWeight: string | number;
  protected _textColor: string;
  protected _textFillOpacity: number;
  protected _itemSpacing: number;
  protected _indentWidth: number;
  protected _indentLevels: number[];
  protected _bulletBuffer: number;

  /** The Text mobjects for each bullet */
  protected _bulletMobjects: Text[] = [];

  /** The Text mobjects for each item */
  protected _itemMobjects: Text[] = [];

  constructor(options: BulletedListOptions) {
    super();

    const {
      items,
      bulletChar = '\u2022', // • character
      fontSize = 48,
      fontFamily = 'sans-serif',
      fontWeight = 'normal',
      color = '#ffffff',
      fillOpacity = 1,
      itemSpacing = 0.35,
      indentWidth = 0.3,
      indentLevels = [],
      bulletBuffer = 0.15,
    } = options;

    this._items = items;
    this._bulletChar = bulletChar;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._fontWeight = fontWeight;
    this._textColor = color;
    this._textFillOpacity = fillOpacity;
    this._itemSpacing = itemSpacing;
    this._indentWidth = indentWidth;
    this._indentLevels = indentLevels.length > 0 ? indentLevels : items.map(() => 0);
    this._bulletBuffer = bulletBuffer;

    this.color = color;
    this.fillOpacity = 0; // VMobject fill, not text fill

    this._buildList();
  }

  /**
   * Build the bullet and item Text mobjects
   */
  protected _buildList(): void {
    // Clear existing children
    for (const child of [...this.children]) {
      this.remove(child);
      child.dispose();
    }
    this._bulletMobjects = [];
    this._itemMobjects = [];

    let currentY = 0;

    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];
      const indentLevel = this._indentLevels[i] || 0;
      const indentX = indentLevel * this._indentWidth;

      // Create bullet
      const bullet = new Text({
        text: this._bulletChar,
        fontSize: this._fontSize,
        fontFamily: this._fontFamily,
        fontWeight: this._fontWeight,
        color: this._textColor,
        fillOpacity: this._textFillOpacity,
        textAlign: 'left',
      });

      // Create item text
      const itemText = new Text({
        text: item,
        fontSize: this._fontSize,
        fontFamily: this._fontFamily,
        fontWeight: this._fontWeight,
        color: this._textColor,
        fillOpacity: this._textFillOpacity,
        textAlign: 'left',
      });

      // Position bullet
      bullet.moveTo([indentX, currentY, 0]);

      // Position item text after bullet
      const bulletWidth = bullet.getWidth();
      itemText.moveTo([indentX + bulletWidth + this._bulletBuffer, currentY, 0]);

      // Add to hierarchy
      this.add(bullet, itemText);
      this._bulletMobjects.push(bullet);
      this._itemMobjects.push(itemText);

      // Move to next line
      const itemHeight = Math.max(bullet.getHeight(), itemText.getHeight());
      currentY -= itemHeight + this._itemSpacing;
    }

    this._markDirty();
  }

  /**
   * Get the items array
   */
  getItems(): string[] {
    return [...this._items];
  }

  /**
   * Set new items and rebuild the list
   * @param items - New array of text items
   * @returns this for chaining
   */
  setItems(items: string[]): this {
    this._items = items;
    if (this._indentLevels.length !== items.length) {
      this._indentLevels = items.map(() => 0);
    }
    this._buildList();
    return this;
  }

  /**
   * Get a specific item Text mobject by index
   * @param index - Item index (0-based)
   * @returns The Text mobject for the item, or undefined if out of bounds
   */
  getItemMobject(index: number): Text | undefined {
    return this._itemMobjects[index];
  }

  /**
   * Get a specific bullet Text mobject by index
   * @param index - Item index (0-based)
   * @returns The Text mobject for the bullet, or undefined if out of bounds
   */
  getBulletMobject(index: number): Text | undefined {
    return this._bulletMobjects[index];
  }

  /**
   * Get the bullet character
   */
  getBulletChar(): string {
    return this._bulletChar;
  }

  /**
   * Set the bullet character and rebuild
   * @param char - New bullet character
   * @returns this for chaining
   */
  setBulletChar(char: string): this {
    this._bulletChar = char;
    this._buildList();
    return this;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    // Children (Text mobjects) will be added by parent class
    return group;
  }

  /**
   * Create a copy of this BulletedList
   */
  protected override _createCopy(): BulletedList {
    return new BulletedList({
      items: [...this._items],
      bulletChar: this._bulletChar,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      color: this._textColor,
      fillOpacity: this._textFillOpacity,
      itemSpacing: this._itemSpacing,
      indentWidth: this._indentWidth,
      indentLevels: [...this._indentLevels],
      bulletBuffer: this._bulletBuffer,
    });
  }
}

// ============================================================================
// Title
// ============================================================================

/**
 * Options for creating a Title mobject
 */
export interface TitleOptions {
  /** The title text to display */
  text: string;
  /** Font size in pixels. Default: 72 (large) */
  fontSize?: number;
  /** Font family. Default: 'sans-serif' */
  fontFamily?: string;
  /** Font weight. Default: 'bold' */
  fontWeight?: string | number;
  /** Text color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Whether to include an underline. Default: false */
  includeUnderline?: boolean;
  /** Underline color. Default: same as text color */
  underlineColor?: string;
  /** Underline width in world units. Default: auto (match text width) */
  underlineWidth?: number;
  /** Underline stroke width. Default: 4 */
  underlineStrokeWidth?: number;
  /** Space between text and underline in world units. Default: 0.15 */
  underlineBuffer?: number;
  /** Y position from top of frame. Default: 3.5 (near top of standard 8-unit frame) */
  yPosition?: number;
}

/**
 * Title - Large, centered title text at the top of the frame
 *
 * Creates a prominent title positioned at the top of the frame.
 * Optionally includes an underline for emphasis.
 *
 * @example
 * ```typescript
 * // Simple title
 * const title = new Title({ text: 'Introduction' });
 *
 * // Title with underline
 * const underlined = new Title({
 *   text: 'Chapter 1',
 *   includeUnderline: true
 * });
 *
 * // Custom styled title
 * const styled = new Title({
 *   text: 'Custom Title',
 *   fontSize: 96,
 *   color: '#ff6600',
 *   fontFamily: 'Georgia',
 *   includeUnderline: true,
 *   underlineColor: '#ffcc00'
 * });
 * ```
 */
export class Title extends VMobject {
  protected _titleText: string;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _fontWeight: string | number;
  protected _textColor: string;
  protected _textFillOpacity: number;
  protected _includeUnderline: boolean;
  protected _underlineColor: string;
  protected _underlineWidth: number | null;
  protected _underlineStrokeWidth: number;
  protected _underlineBuffer: number;
  protected _yPosition: number;

  /** The Text mobject for the title */
  protected _textMobject: Text | null = null;

  /** The underline VMobject (if included) */
  protected _underlineMobject: VMobject | null = null;

  constructor(options: TitleOptions) {
    super();

    const {
      text,
      fontSize = 72,
      fontFamily = 'sans-serif',
      fontWeight = 'bold',
      color = '#ffffff',
      fillOpacity = 1,
      includeUnderline = false,
      underlineColor,
      underlineWidth,
      underlineStrokeWidth = 4,
      underlineBuffer = 0.15,
      yPosition = 3.5,
    } = options;

    this._titleText = text;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._fontWeight = fontWeight;
    this._textColor = color;
    this._textFillOpacity = fillOpacity;
    this._includeUnderline = includeUnderline;
    this._underlineColor = underlineColor || color;
    this._underlineWidth = underlineWidth || null;
    this._underlineStrokeWidth = underlineStrokeWidth;
    this._underlineBuffer = underlineBuffer;
    this._yPosition = yPosition;

    this.color = color;
    this.fillOpacity = 0;

    this._buildTitle();
  }

  /**
   * Build the title text and optional underline
   */
  protected _buildTitle(): void {
    // Clear existing children
    for (const child of [...this.children]) {
      this.remove(child);
      child.dispose();
    }

    // Create title text
    this._textMobject = new Text({
      text: this._titleText,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      color: this._textColor,
      fillOpacity: this._textFillOpacity,
      textAlign: 'center',
    });

    // Position at top of frame, centered
    this._textMobject.moveTo([0, this._yPosition, 0]);
    this.add(this._textMobject);

    // Create underline if requested
    if (this._includeUnderline) {
      const textWidth = this._underlineWidth || this._textMobject.getWidth();
      const textBottom = this._yPosition - this._textMobject.getHeight() / 2;
      const underlineY = textBottom - this._underlineBuffer;

      this._underlineMobject = new VMobject();
      this._underlineMobject.setPoints([
        [-textWidth / 2, underlineY, 0],
        [-textWidth / 6, underlineY, 0],
        [textWidth / 6, underlineY, 0],
        [textWidth / 2, underlineY, 0],
      ]);
      this._underlineMobject.setColor(this._underlineColor);
      this._underlineMobject.setStrokeWidth(this._underlineStrokeWidth);
      this._underlineMobject.setFillOpacity(0);

      this.add(this._underlineMobject);
    } else {
      this._underlineMobject = null;
    }

    this._markDirty();
  }

  /**
   * Get the title text
   */
  getTitleText(): string {
    return this._titleText;
  }

  /**
   * Set new title text and rebuild
   * @param text - New title text
   * @returns this for chaining
   */
  setTitleText(text: string): this {
    this._titleText = text;
    this._buildTitle();
    return this;
  }

  /**
   * Get the Text mobject for the title
   */
  getTextMobject(): Text | null {
    return this._textMobject;
  }

  /**
   * Get the underline mobject (if present)
   */
  getUnderlineMobject(): VMobject | null {
    return this._underlineMobject;
  }

  /**
   * Show or hide the underline
   * @param show - Whether to show the underline
   * @returns this for chaining
   */
  setUnderline(show: boolean): this {
    this._includeUnderline = show;
    this._buildTitle();
    return this;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    return group;
  }

  /**
   * Create a copy of this Title
   */
  protected override _createCopy(): Title {
    return new Title({
      text: this._titleText,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      color: this._textColor,
      fillOpacity: this._textFillOpacity,
      includeUnderline: this._includeUnderline,
      underlineColor: this._underlineColor,
      underlineWidth: this._underlineWidth || undefined,
      underlineStrokeWidth: this._underlineStrokeWidth,
      underlineBuffer: this._underlineBuffer,
      yPosition: this._yPosition,
    });
  }
}

// ============================================================================
// MarkdownText
// ============================================================================

/**
 * Token types for markdown parsing
 */
type MarkdownTokenType = 'text' | 'bold' | 'italic' | 'code' | 'header' | 'bullet';

/**
 * Parsed markdown token
 */
interface MarkdownToken {
  type: MarkdownTokenType;
  text: string;
  level?: number; // For headers (1-3) or bullet indent
}

/**
 * Parsed markdown line
 */
interface MarkdownLine {
  tokens: MarkdownToken[];
  isHeader: boolean;
  headerLevel: number;
  isBullet: boolean;
  bulletLevel: number;
}

/**
 * Options for creating a MarkdownText mobject
 */
export interface MarkdownTextOptions {
  /** The markdown text to parse and display */
  text: string;
  /** Base font size in pixels. Default: 48 */
  fontSize?: number;
  /** Font family for regular text. Default: 'sans-serif' */
  fontFamily?: string;
  /** Font family for code text. Default: 'monospace' */
  codeFontFamily?: string;
  /** Text color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Code text color. Default: '#88ff88' */
  codeColor?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Line height multiplier. Default: 1.4 */
  lineHeight?: number;
  /** Bullet character. Default: '•' */
  bulletChar?: string;
  /** Font size multipliers for headers [h1, h2, h3]. Default: [1.5, 1.25, 1.1] */
  headerSizes?: [number, number, number];
}

/**
 * MarkdownText - Parse and render simple markdown formatting
 *
 * Supports basic markdown syntax:
 * - **bold** text
 * - *italic* text
 * - `code` inline formatting
 * - # Header 1, ## Header 2, ### Header 3
 * - Bullet lists with - or *
 *
 * @example
 * ```typescript
 * // Simple formatted text
 * const md = new MarkdownText({
 *   text: 'This is **bold** and *italic* text'
 * });
 *
 * // Document with headers and lists
 * const doc = new MarkdownText({
 *   text: `# Main Title
 *
 * Some regular text with **bold** words.
 *
 * ## Section
 *
 * - First item
 * - Second item
 * - Third with \`code\`
 * `
 * });
 *
 * // Custom styling
 * const styled = new MarkdownText({
 *   text: '# Custom Header\n\nWith **styled** text.',
 *   color: '#ffcc00',
 *   codeColor: '#00ffcc',
 *   headerSizes: [2.0, 1.5, 1.2]
 * });
 * ```
 */
export class MarkdownText extends VMobject {
  protected _markdownText: string;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _codeFontFamily: string;
  protected _textColor: string;
  protected _codeColor: string;
  protected _textFillOpacity: number;
  protected _lineHeight: number;
  protected _bulletChar: string;
  protected _headerSizes: [number, number, number];

  /** Parsed lines of markdown */
  protected _parsedLines: MarkdownLine[] = [];

  /** Text mobjects for each line */
  protected _lineMobjects: Mobject[] = [];

  constructor(options: MarkdownTextOptions) {
    super();

    const {
      text,
      fontSize = 48,
      fontFamily = 'sans-serif',
      codeFontFamily = 'monospace',
      color = '#ffffff',
      codeColor = '#88ff88',
      fillOpacity = 1,
      lineHeight = 1.4,
      bulletChar = '\u2022',
      headerSizes = [1.5, 1.25, 1.1],
    } = options;

    this._markdownText = text;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._codeFontFamily = codeFontFamily;
    this._textColor = color;
    this._codeColor = codeColor;
    this._textFillOpacity = fillOpacity;
    this._lineHeight = lineHeight;
    this._bulletChar = bulletChar;
    this._headerSizes = headerSizes;

    this.color = color;
    this.fillOpacity = 0;

    this._parseMarkdown();
    this._buildDocument();
  }

  /**
   * Parse markdown text into tokens
   */
  protected _parseMarkdown(): void {
    this._parsedLines = [];
    const lines = this._markdownText.split('\n');

    for (const line of lines) {
      const parsedLine = this._parseLine(line);
      this._parsedLines.push(parsedLine);
    }
  }

  /**
   * Parse a single line of markdown
   */
  protected _parseLine(line: string): MarkdownLine {
    const result: MarkdownLine = {
      tokens: [],
      isHeader: false,
      headerLevel: 0,
      isBullet: false,
      bulletLevel: 0,
    };

    let text = line;

    // Check for header (# ## ###)
    const headerMatch = text.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      result.isHeader = true;
      result.headerLevel = headerMatch[1].length;
      text = headerMatch[2];
    }

    // Check for bullet (- or * at start with optional indent)
    const bulletMatch = text.match(/^(\s*)([-*])\s+(.*)$/);
    if (bulletMatch && !result.isHeader) {
      result.isBullet = true;
      result.bulletLevel = Math.floor(bulletMatch[1].length / 2);
      text = bulletMatch[3];
    }

    // Parse inline formatting
    result.tokens = this._parseInlineFormatting(text);

    return result;
  }

  /**
   * Parse inline formatting (bold, italic, code)
   */
  protected _parseInlineFormatting(text: string): MarkdownToken[] {
    const tokens: MarkdownToken[] = [];

    // Patterns for inline formatting (order matters)
    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, type: 'bold' as MarkdownTokenType, alsoItalic: true },
      { regex: /\*\*(.+?)\*\*/g, type: 'bold' as MarkdownTokenType },
      { regex: /\*([^*]+?)\*/g, type: 'italic' as MarkdownTokenType },
      { regex: /`(.+?)`/g, type: 'code' as MarkdownTokenType },
    ];

    interface Match {
      start: number;
      end: number;
      text: string;
      type: MarkdownTokenType;
      alsoItalic?: boolean;
    }

    const matches: Match[] = [];

    // Find all matches
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        // Check for overlap with existing matches
        const overlaps = matches.some(
          m => (match!.index >= m.start && match!.index < m.end) ||
               (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );

        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
            type: pattern.type,
            alsoItalic: pattern.alsoItalic,
          });
        }
      }
    }

    // Sort by position
    matches.sort((a, b) => a.start - b.start);

    // Build tokens
    let currentIndex = 0;
    for (const match of matches) {
      // Add plain text before match
      if (match.start > currentIndex) {
        const plainText = text.substring(currentIndex, match.start);
        if (plainText) {
          tokens.push({ type: 'text', text: plainText });
        }
      }

      // Add formatted token
      tokens.push({
        type: match.type,
        text: match.text,
      });

      currentIndex = match.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      tokens.push({ type: 'text', text: text.substring(currentIndex) });
    }

    // If no tokens, add the whole line as plain text
    if (tokens.length === 0 && text.length > 0) {
      tokens.push({ type: 'text', text });
    }

    return tokens;
  }

  /**
   * Build the document from parsed markdown
   */
  protected _buildDocument(): void {
    // Clear existing children
    for (const child of [...this.children]) {
      this.remove(child);
      child.dispose();
    }
    this._lineMobjects = [];

    let currentY = 0;
    const baseLineHeight = (this._fontSize / 100) * this._lineHeight;

    for (const parsedLine of this._parsedLines) {
      // Skip empty lines but add vertical space
      if (parsedLine.tokens.length === 0 ||
          (parsedLine.tokens.length === 1 && parsedLine.tokens[0].text.trim() === '')) {
        currentY -= baseLineHeight * 0.5;
        continue;
      }

      // Determine font size for this line
      let lineFontSize = this._fontSize;
      let fontWeight: string | number = 'normal';

      if (parsedLine.isHeader) {
        const sizeMultiplier = this._headerSizes[parsedLine.headerLevel - 1] || 1;
        lineFontSize = this._fontSize * sizeMultiplier;
        fontWeight = 'bold';
      }

      // Build the line content
      const lineGroup = new VMobject();
      lineGroup.fillOpacity = 0;
      let currentX = 0;

      // Add bullet if needed
      if (parsedLine.isBullet) {
        const bulletIndent = parsedLine.bulletLevel * 0.3;
        currentX = bulletIndent;

        const bulletText = new Text({
          text: this._bulletChar + ' ',
          fontSize: lineFontSize,
          fontFamily: this._fontFamily,
          color: this._textColor,
          fillOpacity: this._textFillOpacity,
          textAlign: 'left',
        });
        bulletText.moveTo([currentX, 0, 0]);
        lineGroup.add(bulletText);
        currentX += bulletText.getWidth();
      }

      // Add tokens
      for (const token of parsedLine.tokens) {
        let tokenFontFamily = this._fontFamily;
        let tokenFontWeight: string | number = fontWeight;
        let tokenFontStyle = 'normal';
        let tokenColor = this._textColor;

        switch (token.type) {
          case 'bold':
            tokenFontWeight = 'bold';
            break;
          case 'italic':
            tokenFontStyle = 'italic';
            break;
          case 'code':
            tokenFontFamily = this._codeFontFamily;
            tokenColor = this._codeColor;
            break;
        }

        const tokenText = new Text({
          text: token.text,
          fontSize: lineFontSize,
          fontFamily: tokenFontFamily,
          fontWeight: tokenFontWeight,
          fontStyle: tokenFontStyle,
          color: tokenColor,
          fillOpacity: this._textFillOpacity,
          textAlign: 'left',
        });

        tokenText.moveTo([currentX, 0, 0]);
        lineGroup.add(tokenText);
        currentX += tokenText.getWidth();
      }

      // Position the line
      lineGroup.moveTo([0, currentY, 0]);
      this.add(lineGroup);
      this._lineMobjects.push(lineGroup);

      // Calculate line height based on font size
      const lineHeight = (lineFontSize / 100) * this._lineHeight;
      currentY -= lineHeight;

      // Add extra space after headers
      if (parsedLine.isHeader) {
        currentY -= baseLineHeight * 0.3;
      }
    }

    this._markDirty();
  }

  /**
   * Get the markdown text
   */
  getMarkdownText(): string {
    return this._markdownText;
  }

  /**
   * Set new markdown text and rebuild
   * @param text - New markdown text
   * @returns this for chaining
   */
  setMarkdownText(text: string): this {
    this._markdownText = text;
    this._parseMarkdown();
    this._buildDocument();
    return this;
  }

  /**
   * Get all line mobjects
   */
  getLineMobjects(): Mobject[] {
    return [...this._lineMobjects];
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    return group;
  }

  /**
   * Create a copy of this MarkdownText
   */
  protected override _createCopy(): MarkdownText {
    return new MarkdownText({
      text: this._markdownText,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      codeFontFamily: this._codeFontFamily,
      color: this._textColor,
      codeColor: this._codeColor,
      fillOpacity: this._textFillOpacity,
      lineHeight: this._lineHeight,
      bulletChar: this._bulletChar,
      headerSizes: [...this._headerSizes],
    });
  }
}

export default { BulletedList, Title, MarkdownText };

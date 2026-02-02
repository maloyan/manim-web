import { Text, TextOptions } from './Text';

/**
 * Options for creating a MarkupText mobject
 */
export interface MarkupTextOptions extends TextOptions {
  /**
   * MarkupText uses the same base options as Text.
   * The `text` field should contain Pango-like XML markup.
   *
   * Supported tags:
   *   <b>, <bold>          - Bold text
   *   <i>, <italic>        - Italic text
   *   <u>, <underline>     - Underlined text
   *   <s>, <strikethrough> - Strikethrough text
   *   <sup>                - Superscript
   *   <sub>                - Subscript
   *   <big>                - Larger text (1.2x)
   *   <small>              - Smaller text (0.83x)
   *   <tt>                 - Monospace / code font
   *   <span ...>           - Span with attributes:
   *       font_family="..."  / font="..."
   *       font_size="..."    (absolute px, or relative like "larger"/"smaller"/percentage)
   *       color="..."        / foreground="..." / fgcolor="..."
   *       background="..."   / bgcolor="..."
   *       weight="..."       (bold, normal, 100-900)
   *       style="..."        (italic, normal, oblique)
   *       underline="single" / underline="none"
   *       strikethrough="true" / strikethrough="false"
   *       variant="..."      (normal, small-caps)
   *       size="..."         (alias for font_size)
   *
   * Tags can be nested arbitrarily: <b><i>bold italic</i></b>
   *
   * Special characters: &amp; &lt; &gt; &quot; &apos;
   */
}

// ---------------------------------------------------------------------------
// Styled text segment (leaf node after parsing)
// ---------------------------------------------------------------------------

/**
 * A styled text segment produced by the Pango markup parser.
 * Each segment is a leaf span of text sharing the same style.
 */
export interface StyledTextSegment {
  /** The text content (no markup) */
  text: string;
  /** CSS font-family */
  fontFamily: string | null;
  /** Font size in CSS pixels (before RESOLUTION_SCALE) */
  fontSize: number | null;
  /** Font weight: 'normal', 'bold', or numeric 100-900 */
  fontWeight: string | number | null;
  /** Font style: 'normal' | 'italic' | 'oblique' */
  fontStyle: string | null;
  /** Foreground (fill) color as CSS string */
  color: string | null;
  /** Background color as CSS string (drawn as rect behind text) */
  backgroundColor: string | null;
  /** Draw underline decoration */
  underline: boolean;
  /** Draw strikethrough decoration */
  strikethrough: boolean;
  /** Vertical offset factor for super/subscript. 0 = normal, negative = super, positive = sub */
  baselineShift: number;
  /** Font size scale relative to parent (1 = same). Used for <big>/<small>/<sup>/<sub> */
  relativeScale: number;
  /** CSS font-variant (e.g. 'small-caps') */
  fontVariant: string | null;
}

// ---------------------------------------------------------------------------
// AST node for the parser
// ---------------------------------------------------------------------------

interface MarkupNode {
  type: 'text' | 'element';
  /** For text nodes */
  content?: string;
  /** For element nodes */
  tag?: string;
  attrs?: Record<string, string>;
  children?: MarkupNode[];
}

// ---------------------------------------------------------------------------
// Style context for tree walk
// ---------------------------------------------------------------------------

interface StyleContext {
  fontFamily: string | null;
  fontSize: number | null;
  fontWeight: string | number | null;
  fontStyle: string | null;
  color: string | null;
  backgroundColor: string | null;
  underline: boolean;
  strikethrough: boolean;
  baselineShift: number;
  relativeScale: number;
  fontVariant: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

/** Resolution multiplier for crisp text on retina displays */
const RESOLUTION_SCALE = 2;

/** Default superscript vertical offset (negative = up) */
const SUPERSCRIPT_SHIFT = -0.35;

/** Default subscript vertical offset (positive = down) */
const SUBSCRIPT_SHIFT = 0.25;

/** Scale factor for super/subscript text */
const SCRIPT_SCALE = 0.7;

/** Scale factor for <big> */
const BIG_SCALE = 1.2;

/** Scale factor for <small> */
const SMALL_SCALE = 0.83;

// ---------------------------------------------------------------------------
// XML entity decode
// ---------------------------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// ---------------------------------------------------------------------------
// Minimal Pango-subset XML parser
// ---------------------------------------------------------------------------

/**
 * Parse a Pango-like markup string into an AST of MarkupNodes.
 *
 * This is a purpose-built parser (not using DOMParser) so it works in
 * environments without a full DOM and gives us precise control over
 * which tags are recognised.
 */
function parsePangoMarkup(markup: string): MarkupNode[] {
  const nodes: MarkupNode[] = [];
  let pos = 0;

  while (pos < markup.length) {
    // Look for the next '<'
    const tagStart = markup.indexOf('<', pos);

    if (tagStart === -1) {
      // Rest is plain text
      const text = markup.substring(pos);
      if (text) {
        nodes.push({ type: 'text', content: decodeEntities(text) });
      }
      break;
    }

    // Emit text before the tag
    if (tagStart > pos) {
      const text = markup.substring(pos, tagStart);
      if (text) {
        nodes.push({ type: 'text', content: decodeEntities(text) });
      }
    }

    // Find end of tag
    const tagEnd = markup.indexOf('>', tagStart);
    if (tagEnd === -1) {
      // Malformed: treat rest as text
      nodes.push({ type: 'text', content: decodeEntities(markup.substring(tagStart)) });
      break;
    }

    const tagContent = markup.substring(tagStart + 1, tagEnd).trim();

    // Self-closing tag? (e.g. <br/>)
    if (tagContent.endsWith('/')) {
      // Ignore self-closing tags (no Pango equivalent we need)
      pos = tagEnd + 1;
      continue;
    }

    // Closing tag?
    if (tagContent.startsWith('/')) {
      // We return what we have - the caller handles matching
      // Put pos past this closing tag
      pos = tagEnd + 1;
      // Return nodes; the closing tag name is embedded in context
      // We use a sentinel to signal the close
      const closeTag = tagContent.substring(1).trim().toLowerCase();
      nodes.push({ type: 'element', tag: '__close__', content: closeTag });
      continue;
    }

    // Opening tag - parse tag name and attributes
    const { tagName, attrs } = parseOpenTag(tagContent);

    // Now recursively parse children until we hit the matching close tag
    const innerResult = parsePangoMarkupInner(markup, tagEnd + 1, tagName);
    const elementNode: MarkupNode = {
      type: 'element',
      tag: tagName,
      attrs,
      children: innerResult.children,
    };
    nodes.push(elementNode);
    pos = innerResult.endPos;
  }

  // Filter out any stray __close__ sentinels (shouldn't happen in well-formed input)
  return nodes.filter(n => !(n.type === 'element' && n.tag === '__close__'));
}

/**
 * Parse children of an element until the matching closing tag is found.
 */
function parsePangoMarkupInner(
  markup: string,
  startPos: number,
  parentTag: string
): { children: MarkupNode[]; endPos: number } {
  const children: MarkupNode[] = [];
  let pos = startPos;

  while (pos < markup.length) {
    const tagStart = markup.indexOf('<', pos);

    if (tagStart === -1) {
      // Rest is text inside this element
      const text = markup.substring(pos);
      if (text) {
        children.push({ type: 'text', content: decodeEntities(text) });
      }
      pos = markup.length;
      break;
    }

    // Text before this tag
    if (tagStart > pos) {
      const text = markup.substring(pos, tagStart);
      if (text) {
        children.push({ type: 'text', content: decodeEntities(text) });
      }
    }

    const tagEnd = markup.indexOf('>', tagStart);
    if (tagEnd === -1) {
      children.push({ type: 'text', content: decodeEntities(markup.substring(tagStart)) });
      pos = markup.length;
      break;
    }

    const tagContent = markup.substring(tagStart + 1, tagEnd).trim();

    // Self-closing
    if (tagContent.endsWith('/')) {
      pos = tagEnd + 1;
      continue;
    }

    // Closing tag?
    if (tagContent.startsWith('/')) {
      const closeTag = tagContent.substring(1).trim().toLowerCase();
      pos = tagEnd + 1;
      if (closeTag === parentTag.toLowerCase()) {
        // Matched our parent - done
        return { children, endPos: pos };
      }
      // Mismatched close tag - treat as implicit close of parent
      // (lenient parsing)
      return { children, endPos: pos };
    }

    // Opening tag for a child element
    const { tagName, attrs } = parseOpenTag(tagContent);
    const innerResult = parsePangoMarkupInner(markup, tagEnd + 1, tagName);
    children.push({
      type: 'element',
      tag: tagName,
      attrs,
      children: innerResult.children,
    });
    pos = innerResult.endPos;
  }

  return { children, endPos: pos };
}

/**
 * Parse an opening tag string into tag name and attributes.
 * E.g. 'span font_family="Arial" color="red"' => { tagName: 'span', attrs: { font_family: 'Arial', color: 'red' } }
 */
function parseOpenTag(content: string): { tagName: string; attrs: Record<string, string> } {
  // Tag name is the first token
  const firstSpace = content.search(/\s/);
  let tagName: string;
  let attrStr: string;

  if (firstSpace === -1) {
    tagName = content.toLowerCase();
    attrStr = '';
  } else {
    tagName = content.substring(0, firstSpace).toLowerCase();
    attrStr = content.substring(firstSpace + 1);
  }

  const attrs: Record<string, string> = {};

  // Parse attributes: name="value" or name='value'
  const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3];
    attrs[name] = value;
  }

  return { tagName, attrs };
}

// ---------------------------------------------------------------------------
// Flatten AST to styled segments
// ---------------------------------------------------------------------------

function flattenToSegments(
  nodes: MarkupNode[],
  parentContext: StyleContext,
  defaultFontSize: number,
  defaultFontFamily: string,
  codeFontFamily: string,
): StyledTextSegment[] {
  const segments: StyledTextSegment[] = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      if (node.content) {
        segments.push({
          text: node.content,
          fontFamily: parentContext.fontFamily,
          fontSize: parentContext.fontSize,
          fontWeight: parentContext.fontWeight,
          fontStyle: parentContext.fontStyle,
          color: parentContext.color,
          backgroundColor: parentContext.backgroundColor,
          underline: parentContext.underline,
          strikethrough: parentContext.strikethrough,
          baselineShift: parentContext.baselineShift,
          relativeScale: parentContext.relativeScale,
          fontVariant: parentContext.fontVariant,
        });
      }
      continue;
    }

    // Element node
    const tag = node.tag || '';
    const attrs = node.attrs || {};
    const ctx: StyleContext = { ...parentContext };

    switch (tag) {
      case 'b':
      case 'bold':
        ctx.fontWeight = 'bold';
        break;

      case 'i':
      case 'italic':
        ctx.fontStyle = 'italic';
        break;

      case 'u':
      case 'underline':
        ctx.underline = true;
        break;

      case 's':
      case 'strikethrough':
        ctx.strikethrough = true;
        break;

      case 'sup':
        ctx.baselineShift = (parentContext.baselineShift || 0) + SUPERSCRIPT_SHIFT;
        ctx.relativeScale = parentContext.relativeScale * SCRIPT_SCALE;
        break;

      case 'sub':
        ctx.baselineShift = (parentContext.baselineShift || 0) + SUBSCRIPT_SHIFT;
        ctx.relativeScale = parentContext.relativeScale * SCRIPT_SCALE;
        break;

      case 'big':
        ctx.relativeScale = parentContext.relativeScale * BIG_SCALE;
        break;

      case 'small':
        ctx.relativeScale = parentContext.relativeScale * SMALL_SCALE;
        break;

      case 'tt':
        ctx.fontFamily = codeFontFamily;
        break;

      case 'span':
        applySpanAttributes(ctx, attrs, defaultFontSize, defaultFontFamily, codeFontFamily);
        break;

      default:
        // Unknown tag - just recurse into children with no style change
        break;
    }

    if (node.children && node.children.length > 0) {
      const childSegments = flattenToSegments(
        node.children, ctx, defaultFontSize, defaultFontFamily, codeFontFamily
      );
      segments.push(...childSegments);
    }
  }

  return segments;
}

/**
 * Apply Pango <span> attributes to a style context.
 */
function applySpanAttributes(
  ctx: StyleContext,
  attrs: Record<string, string>,
  defaultFontSize: number,
  _defaultFontFamily: string,
  _codeFontFamily: string,
): void {
  // font_family / font
  const family = attrs['font_family'] || attrs['font'] || attrs['face'];
  if (family) {
    ctx.fontFamily = family;
  }

  // font_size / size
  const sizeStr = attrs['font_size'] || attrs['size'];
  if (sizeStr) {
    ctx.fontSize = parseFontSize(sizeStr, ctx.fontSize ?? defaultFontSize, ctx.relativeScale);
    // Reset relativeScale since we've baked it into fontSize
    ctx.relativeScale = 1;
  }

  // color / foreground / fgcolor
  const fg = attrs['color'] || attrs['foreground'] || attrs['fgcolor'];
  if (fg) {
    ctx.color = fg;
  }

  // background / bgcolor
  const bg = attrs['background'] || attrs['bgcolor'];
  if (bg) {
    ctx.backgroundColor = bg;
  }

  // weight
  const weight = attrs['weight'];
  if (weight) {
    if (weight === 'bold') {
      ctx.fontWeight = 'bold';
    } else if (weight === 'normal') {
      ctx.fontWeight = 'normal';
    } else {
      const numWeight = parseInt(weight, 10);
      if (!isNaN(numWeight)) {
        ctx.fontWeight = numWeight;
      }
    }
  }

  // style
  const style = attrs['style'];
  if (style) {
    if (style === 'italic' || style === 'oblique' || style === 'normal') {
      ctx.fontStyle = style;
    }
  }

  // underline
  const underline = attrs['underline'];
  if (underline) {
    ctx.underline = underline === 'single' || underline === 'true';
  }

  // strikethrough
  const st = attrs['strikethrough'];
  if (st) {
    ctx.strikethrough = st === 'true';
  }

  // variant
  const variant = attrs['variant'];
  if (variant) {
    ctx.fontVariant = variant;
  }

  // alpha / fgalpha (Pango supports these but we map to color opacity conceptually)
  // Not easy to map to Canvas 2D per-segment so we skip for now.
}

/**
 * Parse a Pango font_size attribute value.
 * Supports: absolute pixels ("24"), named sizes ("larger","smaller","xx-large", etc.),
 * percentages ("120%"), and Pango scale units (multiply by ~1024).
 */
function parseFontSize(value: string, currentSize: number, _currentScale: number): number {
  const trimmed = value.trim().toLowerCase();

  // Named relative sizes
  if (trimmed === 'larger') return currentSize * 1.2;
  if (trimmed === 'smaller') return currentSize * 0.83;

  // Named absolute sizes (approximate Pango mapping)
  const namedSizes: Record<string, number> = {
    'xx-small': 0.5789,
    'x-small': 0.6944,
    'small': 0.8333,
    'medium': 1.0,
    'large': 1.2,
    'x-large': 1.44,
    'xx-large': 1.728,
  };
  if (namedSizes[trimmed] !== undefined) {
    return currentSize * namedSizes[trimmed];
  }

  // Percentage (e.g. "120%")
  if (trimmed.endsWith('%')) {
    const pct = parseFloat(trimmed);
    if (!isNaN(pct)) {
      return currentSize * (pct / 100);
    }
  }

  // Numeric pixel value
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    // Pango uses 1024 scale units per pt. If value > 200, assume Pango units.
    if (num > 200) {
      return num / 1024;
    }
    return num;
  }

  return currentSize;
}

// ---------------------------------------------------------------------------
// Check if text contains any XML-like tags
// ---------------------------------------------------------------------------

function containsMarkupTags(text: string): boolean {
  // Check for common Pango tags
  return /<\s*\/?\s*(b|bold|i|italic|u|underline|s|strikethrough|span|sup|sub|big|small|tt)\b/i.test(text);
}

// ---------------------------------------------------------------------------
// MarkupText class
// ---------------------------------------------------------------------------

/**
 * MarkupText - A text mobject with Pango-like XML markup support
 *
 * Supports rich inline formatting via XML tags modelled after Pango markup
 * (the same format used by Python manim's MarkupText).
 *
 * @example
 * ```typescript
 * // Bold and italic
 * const text = new MarkupText({
 *   text: '<b>Bold</b> and <i>Italic</i> text'
 * });
 *
 * // Colored text with span
 * const colored = new MarkupText({
 *   text: '<span foreground="red">Red</span> and <span color="#00ff00">Green</span>'
 * });
 *
 * // Nested formatting
 * const nested = new MarkupText({
 *   text: '<b><i>Bold Italic</i></b> with <u>underline</u>'
 * });
 *
 * // Complex span attributes
 * const complex = new MarkupText({
 *   text: '<span font_family="Courier" font_size="24" color="yellow" weight="bold">Custom</span> text'
 * });
 *
 * // Superscript and subscript
 * const math = new MarkupText({
 *   text: 'x<sup>2</sup> + y<sub>i</sub>'
 * });
 *
 * // Size variations
 * const sizes = new MarkupText({
 *   text: '<big>Big</big> Normal <small>Small</small>'
 * });
 *
 * // Strikethrough
 * const strike = new MarkupText({
 *   text: '<s>deleted</s> replaced'
 * });
 * ```
 *
 * Also supports the legacy Markdown-style syntax (**bold**, *italic*, `code`)
 * for backward compatibility when no XML tags are detected.
 */
export class MarkupText extends Text {
  /** Parsed styled text segments */
  protected _styledSegments: StyledTextSegment[] = [];

  /** Code / monospace font family */
  protected _codeFontFamily: string = 'monospace';

  constructor(options: MarkupTextOptions) {
    super(options);

    // Parse the markup text
    this._parseMarkup();
  }

  /**
   * Set new text content and re-parse markup
   */
  override setText(text: string): this {
    this._text = text;
    this._parseMarkup();
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the code font family
   */
  getCodeFontFamily(): string {
    return this._codeFontFamily;
  }

  /**
   * Set the code font family
   * @param family - CSS font family for code / tt text
   * @returns this for chaining
   */
  setCodeFontFamily(family: string): this {
    this._codeFontFamily = family;
    this._parseMarkup(); // re-parse since tt depends on this
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the parsed styled segments (useful for inspection / testing)
   */
  getStyledSegments(): readonly StyledTextSegment[] {
    return this._styledSegments;
  }

  // -----------------------------------------------------------------------
  // Parsing
  // -----------------------------------------------------------------------

  /**
   * Parse the markup text into styled segments.
   *
   * If the text contains Pango-like XML tags, use the XML parser.
   * Otherwise fall back to legacy Markdown-style parsing for backward compat.
   */
  protected _parseMarkup(): void {
    const text = this._text;

    if (containsMarkupTags(text)) {
      this._parsePangoMarkup(text);
    } else {
      this._parseLegacyMarkup(text);
    }

    // Ensure at least one segment
    if (this._styledSegments.length === 0) {
      this._styledSegments.push(this._makeDefaultSegment(text));
    }
  }

  /**
   * Parse Pango-like XML markup
   */
  protected _parsePangoMarkup(text: string): void {
    const ast = parsePangoMarkup(text);
    const rootContext: StyleContext = {
      fontFamily: null,
      fontSize: null,
      fontWeight: null,
      fontStyle: null,
      color: null,
      backgroundColor: null,
      underline: false,
      strikethrough: false,
      baselineShift: 0,
      relativeScale: 1,
      fontVariant: null,
    };
    this._styledSegments = flattenToSegments(
      ast, rootContext, this._fontSize, this._fontFamily, this._codeFontFamily
    );
  }

  /**
   * Legacy Markdown-style parsing (**bold**, *italic*, `code`)
   * for backward compatibility.
   */
  protected _parseLegacyMarkup(text: string): void {
    this._styledSegments = [];

    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, bold: true, italic: true, code: false },
      { regex: /\*\*(.+?)\*\*/g, bold: true, italic: false, code: false },
      { regex: /\*([^*]+?)\*/g, bold: false, italic: true, code: false },
      { regex: /`(.+?)`/g, bold: false, italic: false, code: true },
    ];

    interface LegacyMatch {
      start: number;
      end: number;
      text: string;
      bold: boolean;
      italic: boolean;
      code: boolean;
    }

    const matches: LegacyMatch[] = [];

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        const overlaps = matches.some(
          m => (match!.index >= m.start && match!.index < m.end) ||
               (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1],
            bold: pattern.bold,
            italic: pattern.italic,
            code: pattern.code,
          });
        }
      }
    }

    matches.sort((a, b) => a.start - b.start);

    let currentIndex = 0;
    for (const m of matches) {
      if (m.start > currentIndex) {
        const plain = text.substring(currentIndex, m.start);
        if (plain) this._styledSegments.push(this._makeDefaultSegment(plain));
      }
      const seg = this._makeDefaultSegment(m.text);
      if (m.bold) seg.fontWeight = 'bold';
      if (m.italic) seg.fontStyle = 'italic';
      if (m.code) seg.fontFamily = this._codeFontFamily;
      this._styledSegments.push(seg);
      currentIndex = m.end;
    }

    if (currentIndex < text.length) {
      this._styledSegments.push(this._makeDefaultSegment(text.substring(currentIndex)));
    }
  }

  /**
   * Create a default (unstyled) segment
   */
  private _makeDefaultSegment(text: string): StyledTextSegment {
    return {
      text,
      fontFamily: null,
      fontSize: null,
      fontWeight: null,
      fontStyle: null,
      color: null,
      backgroundColor: null,
      underline: false,
      strikethrough: false,
      baselineShift: 0,
      relativeScale: 1,
      fontVariant: null,
    };
  }

  // -----------------------------------------------------------------------
  // Font string helpers
  // -----------------------------------------------------------------------

  /**
   * Resolve a styled segment's effective font size (in CSS pixels, before RESOLUTION_SCALE).
   */
  protected _resolveSegmentFontSize(seg: StyledTextSegment): number {
    const base = seg.fontSize ?? this._fontSize;
    return base * seg.relativeScale;
  }

  /**
   * Build a CSS font string for a styled segment.
   */
  protected _buildStyledFontString(seg: StyledTextSegment): string {
    const style = seg.fontStyle || this._fontStyle || 'normal';
    const weightRaw = seg.fontWeight ?? this._fontWeight;
    const weight = typeof weightRaw === 'number' ? weightRaw.toString() : (weightRaw || 'normal');
    const size = Math.round(this._resolveSegmentFontSize(seg) * RESOLUTION_SCALE);
    const family = seg.fontFamily || this._fontFamily;

    // font-variant is not part of the shorthand font string for Canvas 2D,
    // but we can set it separately on ctx. Build the base string:
    return `${style} ${weight} ${size}px ${family}`;
  }

  // -----------------------------------------------------------------------
  // Layout helpers
  // -----------------------------------------------------------------------

  /**
   * Get plain text without markup for compatibility
   */
  protected _getPlainText(): string {
    return this._styledSegments.map(s => s.text).join('');
  }

  /**
   * Split styled segments by newlines into lines of segments.
   */
  protected _splitStyledSegmentsByLine(): StyledTextSegment[][] {
    const lines: StyledTextSegment[][] = [[]];
    let lineIdx = 0;

    for (const seg of this._styledSegments) {
      const parts = seg.text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          lineIdx++;
          lines[lineIdx] = [];
        }
        if (parts[i]) {
          lines[lineIdx].push({ ...seg, text: parts[i] });
        }
      }
    }

    return lines;
  }

  /**
   * Measure the pixel width of a line of styled segments (after RESOLUTION_SCALE).
   */
  protected _measureStyledLineWidth(segments: StyledTextSegment[]): number {
    if (!this._ctx) return 0;

    let totalWidth = 0;
    for (const seg of segments) {
      this._ctx.font = this._buildStyledFontString(seg);
      totalWidth += this._ctx.measureText(seg.text).width;
      totalWidth += (seg.text.length - 1) * this._letterSpacing * RESOLUTION_SCALE;
    }
    return totalWidth;
  }

  /**
   * Get the maximum effective font size in a line (for line height calculation).
   */
  protected _maxFontSizeInLine(segments: StyledTextSegment[]): number {
    let max = this._fontSize;
    for (const seg of segments) {
      const fs = this._resolveSegmentFontSize(seg);
      if (fs > max) max = fs;
    }
    return max;
  }

  // -----------------------------------------------------------------------
  // Measure override
  // -----------------------------------------------------------------------

  protected override _measureText(): { lines: string[]; width: number; height: number } {
    if (!this._ctx) {
      return { lines: [], width: 0, height: 0 };
    }

    const lineSegments = this._splitStyledSegmentsByLine();
    const scaledBaseFontSize = this._fontSize * RESOLUTION_SCALE;

    // Measure each line
    let maxWidth = 0;
    let totalHeight = 0;

    for (const segments of lineSegments) {
      const lineWidth = this._measureStyledLineWidth(segments);
      maxWidth = Math.max(maxWidth, lineWidth);

      const lineMaxFs = this._maxFontSizeInLine(segments) * RESOLUTION_SCALE;
      totalHeight += lineMaxFs * this._lineHeight;
    }

    // Fallback if no lines
    if (totalHeight === 0) {
      totalHeight = scaledBaseFontSize * this._lineHeight;
    }

    const padding = scaledBaseFontSize * 0.2;
    const width = Math.ceil(maxWidth + padding * 2);
    const height = Math.ceil(totalHeight + padding * 2);

    const lines = lineSegments.map(segs => segs.map(s => s.text).join(''));

    return { lines, width, height };
  }

  // -----------------------------------------------------------------------
  // Render override
  // -----------------------------------------------------------------------

  protected override _renderToCanvas(): void {
    if (!this._canvas || !this._ctx) {
      return;
    }

    const { width, height } = this._measureText();
    const lineSegments = this._splitStyledSegmentsByLine();

    // Resize canvas
    this._canvas.width = width || 1;
    this._canvas.height = height || 1;

    // Clear
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    const scaledBaseFontSize = this._fontSize * RESOLUTION_SCALE;
    const padding = scaledBaseFontSize * 0.2;

    let currentY = padding;

    for (const segments of lineSegments) {
      const lineMaxFs = this._maxFontSizeInLine(segments) * RESOLUTION_SCALE;
      const lineHeight = lineMaxFs * this._lineHeight;
      // Baseline: use alphabetic for proper alignment
      const baseline = currentY + lineMaxFs * 0.8; // approximate baseline position

      // Calculate line width for alignment
      const lineWidth = this._measureStyledLineWidth(segments);
      let startX: number;
      switch (this._textAlign) {
        case 'center':
          startX = (width - lineWidth) / 2;
          break;
        case 'right':
          startX = width - padding - lineWidth;
          break;
        case 'left':
        default:
          startX = padding;
          break;
      }

      // Draw each segment
      let currentX = startX;
      for (const seg of segments) {
        const segFontSize = this._resolveSegmentFontSize(seg) * RESOLUTION_SCALE;
        const fontStr = this._buildStyledFontString(seg);
        this._ctx.font = fontStr;
        this._ctx.textBaseline = 'alphabetic';
        this._ctx.textAlign = 'left';

        // Compute y position for this segment (baseline + shift)
        const shiftPx = seg.baselineShift * lineMaxFs;
        const segY = baseline + shiftPx;

        const segWidth = this._ctx.measureText(seg.text).width
          + (seg.text.length - 1) * this._letterSpacing * RESOLUTION_SCALE;

        // Draw background if present
        if (seg.backgroundColor) {
          this._ctx.save();
          this._ctx.fillStyle = seg.backgroundColor;
          this._ctx.globalAlpha = this.fillOpacity * this._opacity;
          // Background rect from top of line to bottom
          this._ctx.fillRect(currentX, currentY, segWidth, lineHeight);
          this._ctx.restore();
        }

        // Determine colors
        const fillColor = seg.color || this.color;

        // Draw stroke if strokeWidth > 0
        if (this.strokeWidth > 0) {
          this._ctx.strokeStyle = fillColor;
          this._ctx.lineWidth = this.strokeWidth * RESOLUTION_SCALE;
          this._ctx.strokeText(seg.text, currentX, segY);
        }

        // Draw fill
        this._ctx.fillStyle = fillColor;
        this._ctx.globalAlpha = this.fillOpacity * this._opacity;
        this._ctx.fillText(seg.text, currentX, segY);

        // Draw underline
        if (seg.underline) {
          const underlineY = segY + segFontSize * 0.1;
          const lineW = Math.max(1, segFontSize * 0.05);
          this._ctx.save();
          this._ctx.strokeStyle = fillColor;
          this._ctx.lineWidth = lineW;
          this._ctx.globalAlpha = this.fillOpacity * this._opacity;
          this._ctx.beginPath();
          this._ctx.moveTo(currentX, underlineY);
          this._ctx.lineTo(currentX + segWidth, underlineY);
          this._ctx.stroke();
          this._ctx.restore();
        }

        // Draw strikethrough
        if (seg.strikethrough) {
          const strikeY = segY - segFontSize * 0.3;
          const lineW = Math.max(1, segFontSize * 0.05);
          this._ctx.save();
          this._ctx.strokeStyle = fillColor;
          this._ctx.lineWidth = lineW;
          this._ctx.globalAlpha = this.fillOpacity * this._opacity;
          this._ctx.beginPath();
          this._ctx.moveTo(currentX, strikeY);
          this._ctx.lineTo(currentX + segWidth, strikeY);
          this._ctx.stroke();
          this._ctx.restore();
        }

        currentX += segWidth;
      }

      currentY += lineHeight;
    }

    // Store world dimensions
    this._worldWidth = (width / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    this._worldHeight = (height / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    // Update texture
    if (this._texture) {
      this._texture.needsUpdate = true;
    }
  }

  // -----------------------------------------------------------------------
  // Copy
  // -----------------------------------------------------------------------

  protected override _createCopy(): MarkupText {
    const copy = new MarkupText({
      text: this._text,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      fontStyle: this._fontStyle,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
      lineHeight: this._lineHeight,
      letterSpacing: this._letterSpacing,
      textAlign: this._textAlign,
    });
    copy._codeFontFamily = this._codeFontFamily;
    return copy;
  }
}

export default MarkupText;

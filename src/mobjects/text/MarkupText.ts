import { Text, TextOptions } from './Text';

/**
 * Options for creating a MarkupText mobject
 */
export interface MarkupTextOptions extends TextOptions {
  // MarkupText uses the same options as Text
  // Markup syntax: **bold**, *italic*, `code`
}

/**
 * Represents a text segment with its formatting
 */
interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
}

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

/** Resolution multiplier for crisp text on retina displays */
const RESOLUTION_SCALE = 2;

/**
 * MarkupText - A text mobject with simple inline formatting support
 *
 * Supports basic markup syntax for formatting:
 * - **bold** for bold text
 * - *italic* for italic text
 * - `code` for monospace/code text
 *
 * These can be combined: ***bold italic***, **bold `code`**, etc.
 *
 * @example
 * ```typescript
 * // Create text with formatting
 * const text = new MarkupText({
 *   text: 'This is **bold** and *italic* text'
 * });
 *
 * // Code formatting
 * const code = new MarkupText({
 *   text: 'Use `console.log()` to debug'
 * });
 *
 * // Combined formatting
 * const combined = new MarkupText({
 *   text: '***Bold and italic*** together'
 * });
 * ```
 */
export class MarkupText extends Text {
  /** Parsed text segments with formatting */
  protected _segments: TextSegment[] = [];

  /** Code font family */
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
   * @param family - CSS font family for code text
   * @returns this for chaining
   */
  setCodeFontFamily(family: string): this {
    this._codeFontFamily = family;
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Parse the text for markup syntax and create segments
   */
  protected _parseMarkup(): void {
    this._segments = [];

    // Regex patterns for markup
    // Order matters: check for combined patterns first
    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, bold: true, italic: true, code: false },
      { regex: /\*\*(.+?)\*\*/g, bold: true, italic: false, code: false },
      { regex: /\*([^*]+?)\*/g, bold: false, italic: true, code: false },
      { regex: /`(.+?)`/g, bold: false, italic: false, code: true },
    ];

    // Simple state machine to parse the text
    const text = this._text;

    // Find all markup positions
    interface MarkupMatch {
      start: number;
      end: number;
      text: string;
      bold: boolean;
      italic: boolean;
      code: boolean;
    }

    const matches: MarkupMatch[] = [];

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        // Check if this position overlaps with existing matches
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

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Build segments
    let currentIndex = 0;
    for (const match of matches) {
      // Add plain text before this match
      if (match.start > currentIndex) {
        const plainText = text.substring(currentIndex, match.start);
        if (plainText) {
          this._segments.push({
            text: plainText,
            bold: false,
            italic: false,
            code: false,
          });
        }
      }

      // Add the formatted segment
      this._segments.push({
        text: match.text,
        bold: match.bold,
        italic: match.italic,
        code: match.code,
      });

      currentIndex = match.end;
    }

    // Add remaining plain text
    if (currentIndex < text.length) {
      this._segments.push({
        text: text.substring(currentIndex),
        bold: false,
        italic: false,
        code: false,
      });
    }

    // If no segments were created, add the whole text as plain
    if (this._segments.length === 0) {
      this._segments.push({
        text: this._text,
        bold: false,
        italic: false,
        code: false,
      });
    }
  }

  /**
   * Build font string for a specific segment
   */
  protected _buildSegmentFontString(segment: TextSegment): string {
    const style = segment.italic ? 'italic' : 'normal';
    const weight = segment.bold ? 'bold' : (typeof this._fontWeight === 'number'
      ? this._fontWeight.toString()
      : this._fontWeight);
    const size = Math.round(this._fontSize * RESOLUTION_SCALE);
    const family = segment.code ? this._codeFontFamily : this._fontFamily;
    return `${style} ${weight} ${size}px ${family}`;
  }

  /**
   * Get plain text without markup for measuring
   */
  protected _getPlainText(): string {
    return this._segments.map(s => s.text).join('');
  }

  /**
   * Measure the total width of all segments for a line
   */
  protected _measureSegmentsWidth(segments: TextSegment[]): number {
    if (!this._ctx) return 0;

    let totalWidth = 0;
    for (const segment of segments) {
      this._ctx.font = this._buildSegmentFontString(segment);
      totalWidth += this._ctx.measureText(segment.text).width;
      totalWidth += (segment.text.length - 1) * this._letterSpacing * RESOLUTION_SCALE;
    }
    return totalWidth;
  }

  /**
   * Split segments by newlines
   */
  protected _splitSegmentsByLine(): TextSegment[][] {
    const lines: TextSegment[][] = [[]];
    let currentLineIndex = 0;

    for (const segment of this._segments) {
      const parts = segment.text.split('\n');

      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          // New line
          currentLineIndex++;
          lines[currentLineIndex] = [];
        }

        if (parts[i]) {
          lines[currentLineIndex].push({
            ...segment,
            text: parts[i],
          });
        }
      }
    }

    return lines;
  }

  /**
   * Override measure text to handle segments
   */
  protected override _measureText(): { lines: string[]; width: number; height: number } {
    if (!this._ctx) {
      return { lines: [], width: 0, height: 0 };
    }

    const lineSegments = this._splitSegmentsByLine();
    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;

    // Measure each line width
    let maxWidth = 0;
    for (const segments of lineSegments) {
      const lineWidth = this._measureSegmentsWidth(segments);
      maxWidth = Math.max(maxWidth, lineWidth);
    }

    // Calculate total height
    const totalHeight = lineSegments.length * scaledLineHeight;

    // Add padding
    const padding = scaledFontSize * 0.2;
    const width = Math.ceil(maxWidth + padding * 2);
    const height = Math.ceil(totalHeight + padding * 2);

    // Return plain text lines for compatibility
    const lines = lineSegments.map(segments => segments.map(s => s.text).join(''));

    return { lines, width, height };
  }

  /**
   * Render formatted text to canvas
   */
  protected override _renderToCanvas(): void {
    if (!this._canvas || !this._ctx) {
      return;
    }

    const { width, height } = this._measureText();
    const lineSegments = this._splitSegmentsByLine();

    // Resize canvas
    this._canvas.width = width || 1;
    this._canvas.height = height || 1;

    // Clear canvas (transparent background)
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this._ctx.textBaseline = 'top';

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const padding = scaledFontSize * 0.2;

    // Draw each line
    for (let lineIndex = 0; lineIndex < lineSegments.length; lineIndex++) {
      const segments = lineSegments[lineIndex];
      const y = padding + lineIndex * scaledLineHeight;

      // Calculate starting x based on alignment
      const lineWidth = this._measureSegmentsWidth(segments);
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
      for (const segment of segments) {
        this._ctx.font = this._buildSegmentFontString(segment);
        this._ctx.textAlign = 'left';

        // Draw stroke if strokeWidth > 0
        if (this.strokeWidth > 0) {
          this._ctx.strokeStyle = this.color;
          this._ctx.lineWidth = this.strokeWidth * RESOLUTION_SCALE;
          this._ctx.strokeText(segment.text, currentX, y);
        }

        // Draw fill
        this._ctx.fillStyle = this.color;
        this._ctx.globalAlpha = this.fillOpacity * this._opacity;
        this._ctx.fillText(segment.text, currentX, y);

        // Move to next position
        currentX += this._ctx.measureText(segment.text).width;
        currentX += (segment.text.length - 1) * this._letterSpacing * RESOLUTION_SCALE;
      }
    }

    // Store world dimensions
    this._worldWidth = (width / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    this._worldHeight = (height / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    // Update texture if it exists
    if (this._texture) {
      this._texture.needsUpdate = true;
    }
  }

  /**
   * Create a copy of this MarkupText mobject
   */
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

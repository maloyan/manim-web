import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import {
  type Token,
  type CodeColorScheme,
  DEFAULT_COLOR_SCHEME,
  tokenizeLine,
} from './CodeHighlighting';

// Re-export all highlighting types and constants so existing imports from './Code' still work
export {
  type Token,
  type TokenType,
  type CodeColorScheme,
  DEFAULT_COLOR_SCHEME,
  MONOKAI_COLOR_SCHEME,
} from './CodeHighlighting';

/**
 * Options for creating a Code mobject
 */
export interface CodeOptions {
  /** The code string to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Whether to show line numbers. Default: true */
  lineNumbers?: boolean;
  /** Tab width in spaces. Default: 4 */
  tabWidth?: number;
  /** Font size in pixels. Default: 24 */
  fontSize?: number;
  /** Font family. Default: 'monospace' */
  fontFamily?: string;
  /** Color scheme for syntax highlighting */
  colorScheme?: CodeColorScheme;
  /** Whether to show background rectangle. Default: true */
  showBackground?: boolean;
  /** Background padding in pixels. Default: 16 */
  backgroundPadding?: number;
  /** Background corner radius in pixels. Default: 8 */
  backgroundRadius?: number;
  /** Line height multiplier. Default: 1.4 */
  lineHeight?: number;
}

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

/** Resolution multiplier for crisp text on retina displays */
const RESOLUTION_SCALE = 2;

/**
 * Code - A syntax-highlighted code block mobject
 *
 * Renders code with syntax highlighting using Canvas 2D to a texture.
 * Supports multiple programming languages with customizable color schemes.
 *
 * @example
 * ```typescript
 * // Create Python code block
 * const pythonCode = new Code({
 *   code: `def hello():
 *     print("Hello, World!")`,
 *   language: 'python',
 * });
 *
 * // Create TypeScript code without line numbers
 * const tsCode = new Code({
 *   code: 'const x: number = 42;',
 *   language: 'typescript',
 *   lineNumbers: false,
 * });
 *
 * // Use Monokai color scheme
 * const monokaiCode = new Code({
 *   code: 'console.log("Hello");',
 *   language: 'javascript',
 *   colorScheme: MONOKAI_COLOR_SCHEME,
 * });
 * ```
 */
export class Code extends VMobject {
  protected _code: string;
  protected _language: string;
  protected _lineNumbers: boolean;
  protected _tabWidth: number;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _colorScheme: CodeColorScheme;
  protected _showBackground: boolean;
  protected _backgroundPadding: number;
  protected _backgroundRadius: number;
  protected _lineHeight: number;

  /** Off-screen canvas for code rendering */
  protected _canvas: HTMLCanvasElement | null = null;
  protected _ctx: CanvasRenderingContext2D | null = null;

  /** Three.js texture from canvas */
  protected _texture: THREE.CanvasTexture | null = null;

  /** Plane mesh for displaying the texture */
  protected _mesh: THREE.Mesh | null = null;

  /** Background mesh */
  protected _backgroundMesh: THREE.Mesh | null = null;

  /** Cached dimensions in world units */
  protected _worldWidth: number = 0;
  protected _worldHeight: number = 0;

  /** Parsed lines for later access */
  protected _lines: string[] = [];

  /** Tokenized lines for highlighting specific parts */
  protected _tokenizedLines: Token[][] = [];

  /** Highlight rectangles */
  protected _highlightMeshes: THREE.Mesh[] = [];

  constructor(options: CodeOptions) {
    super();

    const {
      code,
      language = 'text',
      lineNumbers = true,
      tabWidth = 4,
      fontSize = 24,
      fontFamily = 'monospace',
      colorScheme = DEFAULT_COLOR_SCHEME,
      showBackground = true,
      backgroundPadding = 16,
      backgroundRadius = 8,
      lineHeight = 1.4,
    } = options;

    this._code = code;
    this._language = language.toLowerCase();
    this._lineNumbers = lineNumbers;
    this._tabWidth = tabWidth;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._colorScheme = colorScheme;
    this._showBackground = showBackground;
    this._backgroundPadding = backgroundPadding;
    this._backgroundRadius = backgroundRadius;
    this._lineHeight = lineHeight;

    // Set default colors
    this.color = colorScheme.default;
    this.fillOpacity = 1;
    this.strokeWidth = 0;

    // Initialize canvas
    this._initCanvas();

    // Parse and tokenize code
    this._parseCode();
  }

  /**
   * Initialize the off-screen canvas
   */
  protected _initCanvas(): void {
    if (typeof document === 'undefined') {
      return;
    }
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    if (!this._ctx) {
      throw new Error('Failed to get 2D context for code rendering');
    }
  }

  /**
   * Parse code into lines and tokenize
   */
  protected _parseCode(): void {
    // Expand tabs to spaces
    const expandedCode = this._code.replace(/\t/g, ' '.repeat(this._tabWidth));
    this._lines = expandedCode.split('\n');

    // Tokenize each line using the standalone tokenizer
    this._tokenizedLines = this._lines.map((line) => tokenizeLine(line, this._language));
  }

  /**
   * Get the code content
   */
  getCode(): string {
    return this._code;
  }

  /**
   * Set new code and re-render
   * @param code - New code to display
   * @returns this for chaining
   */
  setCode(code: string): this {
    this._code = code;
    this._parseCode();
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the language
   */
  getLanguage(): string {
    return this._language;
  }

  /**
   * Set language and re-render
   * @param language - Programming language
   * @returns this for chaining
   */
  setLanguage(language: string): this {
    this._language = language.toLowerCase();
    this._parseCode();
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the number of lines
   */
  getLineCount(): number {
    return this._lines.length;
  }

  /**
   * Get code width in world units
   */
  getWidth(): number {
    return this._worldWidth;
  }

  /**
   * Get code height in world units
   */
  getHeight(): number {
    return this._worldHeight;
  }

  /**
   * Get a specific line of code as a Text-like mobject representation
   * Returns position info for the specified line
   * @param lineNumber - 1-based line number
   * @returns Object with line info or null if out of range
   */
  getLineOfCode(
    lineNumber: number,
  ): { text: string; position: Vector3Tuple; tokens: Token[] } | null {
    const index = lineNumber - 1;
    if (index < 0 || index >= this._lines.length) {
      return null;
    }

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;

    // Calculate line position relative to code block
    const lineY = scaledPadding + (index + 0.5) * scaledLineHeight;
    const worldY = this._worldHeight / 2 - (lineY / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    return {
      text: this._lines[index],
      position: [this.position.x, this.position.y + worldY, this.position.z],
      tokens: this._tokenizedLines[index],
    };
  }

  /**
   * Highlight a range of lines with a background color
   * @param startLine - Starting line number (1-based)
   * @param endLine - Ending line number (1-based, inclusive)
   * @param color - Highlight color. Default: semi-transparent yellow
   * @returns this for chaining
   */
  highlightLines(
    startLine: number,
    endLine: number,
    color: string = 'rgba(255, 255, 0, 0.3)',
  ): this {
    // Clear existing highlights
    this.clearHighlights();

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;

    // Clamp line numbers
    const start = Math.max(1, Math.min(startLine, this._lines.length));
    const end = Math.max(1, Math.min(endLine, this._lines.length));

    // Calculate highlight dimensions
    const highlightHeight =
      (((end - start + 1) * scaledLineHeight) / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    const highlightWidth = this._worldWidth - 2 * (this._backgroundPadding * PIXEL_TO_WORLD);

    // Calculate position
    const topY = this._worldHeight / 2 - (scaledPadding / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    const startY = topY - (((start - 0.5) * scaledLineHeight) / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    const centerY = startY - highlightHeight / 2;

    // Create highlight geometry
    const geometry = new THREE.PlaneGeometry(highlightWidth, highlightHeight);

    // Parse color
    const threeColor = new THREE.Color(color);
    let alpha = 0.3;
    const rgbaMatch = color.match(/rgba?\([\d.]+,\s*[\d.]+,\s*[\d.]+(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch && rgbaMatch[1]) {
      alpha = parseFloat(rgbaMatch[1]);
    }

    const material = new THREE.MeshBasicMaterial({
      color: threeColor,
      transparent: true,
      opacity: alpha,
      depthWrite: false,
    });

    const highlightMesh = new THREE.Mesh(geometry, material);
    highlightMesh.position.set(0, centerY - this._worldHeight / 2 + highlightHeight, 0.001);
    this._highlightMeshes.push(highlightMesh);

    if (this._threeObject) {
      this._threeObject.add(highlightMesh);
    }

    this._markDirty();
    return this;
  }

  /**
   * Clear all line highlights
   * @returns this for chaining
   */
  clearHighlights(): this {
    for (const mesh of this._highlightMeshes) {
      if (this._threeObject) {
        this._threeObject.remove(mesh);
      }
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this._highlightMeshes = [];
    return this;
  }

  /**
   * Build the CSS font string
   */
  protected _buildFontString(): string {
    const size = Math.round(this._fontSize * RESOLUTION_SCALE);
    return `${size}px ${this._fontFamily}`;
  }

  /**
   * Calculate the width needed for line numbers
   */
  protected _getLineNumberWidth(): number {
    if (!this._lineNumbers || !this._ctx) return 0;

    this._ctx.font = this._buildFontString();
    const maxLineNum = this._lines.length.toString();
    const metrics = this._ctx.measureText(maxLineNum);
    return metrics.width + 20 * RESOLUTION_SCALE; // Add padding
  }

  /**
   * Measure canvas dimensions needed
   */
  protected _measureCode(): { width: number; height: number } {
    if (!this._ctx) {
      return { width: 0, height: 0 };
    }

    this._ctx.font = this._buildFontString();

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;
    const lineNumberWidth = this._getLineNumberWidth();

    // Measure max line width
    let maxWidth = 0;
    for (const line of this._lines) {
      const metrics = this._ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    // Total dimensions
    const width = Math.ceil(lineNumberWidth + maxWidth + scaledPadding * 2);
    const height = Math.ceil(this._lines.length * scaledLineHeight + scaledPadding * 2);

    return { width, height };
  }

  /**
   * Render code to the off-screen canvas
   */
  protected _renderToCanvas(): void {
    if (!this._canvas || !this._ctx) {
      return;
    }

    const { width, height } = this._measureCode();

    // Resize canvas
    this._canvas.width = width || 1;
    this._canvas.height = height || 1;

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;
    const lineNumberWidth = this._getLineNumberWidth();

    // Draw background if enabled
    if (this._showBackground) {
      this._ctx.fillStyle = this._colorScheme.background;
      const scaledRadius = this._backgroundRadius * RESOLUTION_SCALE;
      this._roundRect(0, 0, width, height, scaledRadius);
    } else {
      // Clear canvas (transparent background)
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    // Set font
    this._ctx.font = this._buildFontString();
    this._ctx.textBaseline = 'middle';

    // Draw each line
    for (let i = 0; i < this._lines.length; i++) {
      const y = scaledPadding + (i + 0.5) * scaledLineHeight;

      // Draw line number
      if (this._lineNumbers) {
        this._ctx.fillStyle = this._colorScheme.lineNumber;
        this._ctx.textAlign = 'right';
        const lineNum = (i + 1).toString();
        this._ctx.fillText(lineNum, lineNumberWidth - 10 * RESOLUTION_SCALE, y);
      }

      // Draw tokenized code
      this._ctx.textAlign = 'left';
      let x = lineNumberWidth + scaledPadding / 2;

      for (const token of this._tokenizedLines[i]) {
        this._ctx.fillStyle = this._colorScheme[token.type];
        this._ctx.fillText(token.text, x, y);
        x += this._ctx.measureText(token.text).width;
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
   * Draw a rounded rectangle
   */
  protected _roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    if (!this._ctx) return;

    this._ctx.beginPath();
    this._ctx.moveTo(x + radius, y);
    this._ctx.lineTo(x + width - radius, y);
    this._ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this._ctx.lineTo(x + width, y + height - radius);
    this._ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this._ctx.lineTo(x + radius, y + height);
    this._ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this._ctx.lineTo(x, y + radius);
    this._ctx.quadraticCurveTo(x, y, x + radius, y);
    this._ctx.closePath();
    this._ctx.fill();
  }

  /**
   * Update the mesh geometry to match new dimensions
   */
  protected _updateMesh(): void {
    if (!this._mesh) return;

    // Dispose old geometry
    this._mesh.geometry.dispose();

    // Create new geometry with updated dimensions
    const geometry = new THREE.PlaneGeometry(this._worldWidth, this._worldHeight);
    this._mesh.geometry = geometry;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Render code to canvas
    this._renderToCanvas();

    if (!this._canvas) {
      return group;
    }

    // Create texture from canvas
    this._texture = new THREE.CanvasTexture(this._canvas);
    this._texture.colorSpace = THREE.SRGBColorSpace;
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;

    // Create material with transparency
    const material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create plane geometry sized to match code
    const geometry = new THREE.PlaneGeometry(this._worldWidth, this._worldHeight);

    // Create mesh
    this._mesh = new THREE.Mesh(geometry, material);
    group.add(this._mesh);

    // Add existing highlights
    for (const highlightMesh of this._highlightMeshes) {
      group.add(highlightMesh);
    }

    return group;
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    // Re-render canvas with updated colors/opacity
    this._renderToCanvas();

    if (this._mesh) {
      const material = this._mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = this._opacity;
      }
    }
  }

  /**
   * Get the center of this code mobject
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Create a copy of this Code mobject
   */
  protected override _createCopy(): Code {
    return new Code({
      code: this._code,
      language: this._language,
      lineNumbers: this._lineNumbers,
      tabWidth: this._tabWidth,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      colorScheme: { ...this._colorScheme },
      showBackground: this._showBackground,
      backgroundPadding: this._backgroundPadding,
      backgroundRadius: this._backgroundRadius,
      lineHeight: this._lineHeight,
    });
  }

  /**
   * Clean up Three.js and canvas resources
   */
  override dispose(): void {
    this._texture?.dispose();
    if (this._mesh) {
      this._mesh.geometry.dispose();
      (this._mesh.material as THREE.Material).dispose();
    }
    this.clearHighlights();
    this._canvas = null;
    this._ctx = null;
    super.dispose();
  }
}

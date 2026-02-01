import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { TextGlyphGroup } from './TextGlyphGroup';
import type { SkeletonizeOptions } from '../../utils/skeletonize';

/**
 * Options for creating a Text mobject
 */
export interface TextOptions {
  /** The text content to display */
  text: string;
  /** Font size in pixels. Default: 48 */
  fontSize?: number;
  /** Font family. Default: 'CMU Serif, Georgia, Times New Roman, serif' (Manim-like) */
  fontFamily?: string;
  /** Font weight. Default: 'normal' */
  fontWeight?: string | number;
  /** Font style ('normal' | 'italic'). Default: 'normal' */
  fontStyle?: string;
  /** Text color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Stroke width for outlined text. Default: 0 */
  strokeWidth?: number;
  /** Line height multiplier. Default: 1.2 */
  lineHeight?: number;
  /** Letter spacing in pixels. Default: 0 */
  letterSpacing?: number;
  /** Text alignment. Default: 'center' */
  textAlign?: 'left' | 'center' | 'right';
  /** URL to a font file (OTF/TTF) for glyph vector extraction. When provided, loadGlyphs() can extract glyph outlines for stroke-draw animation. */
  fontUrl?: string;
}

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

/** Resolution multiplier for crisp text on retina displays */
const RESOLUTION_SCALE = 2;

/**
 * Text - A text mobject rendered using Canvas 2D to a texture
 *
 * Uses Canvas 2D APIs to render text to an off-screen canvas, then creates
 * a Three.js plane mesh with that texture. This approach avoids the complexity
 * of converting fonts to Bezier paths while providing crisp text rendering.
 *
 * @example
 * ```typescript
 * // Create simple text
 * const text = new Text({ text: 'Hello World' });
 *
 * // Create styled text
 * const styled = new Text({
 *   text: 'Styled Text',
 *   fontSize: 72,
 *   fontFamily: 'Georgia',
 *   color: '#ff6600',
 *   fontWeight: 'bold'
 * });
 *
 * // Multi-line text
 * const multiline = new Text({ text: 'Line 1\nLine 2\nLine 3' });
 * ```
 */
/**
 * Global cache: fontUrl -> { familyName, loadPromise }
 * Ensures the same OTF/TTF is loaded only once via @font-face,
 * and all Text instances sharing a URL get the same CSS family name.
 */
const _fontFaceCache = new Map<string, { familyName: string; loadPromise: Promise<void> }>();
let _fontFaceIdCounter = 0;

/**
 * Load a font URL as a CSS @font-face rule (cached).
 * Returns the unique font-family name assigned to this URL.
 */
async function _loadFontFace(url: string): Promise<string> {
  const cached = _fontFaceCache.get(url);
  if (cached) {
    await cached.loadPromise;
    return cached.familyName;
  }

  const familyName = `ManimFont_${_fontFaceIdCounter++}`;
  const face = new FontFace(familyName, `url(${url})`);
  const loadPromise = face.load().then(() => {
    document.fonts.add(face);
  });

  _fontFaceCache.set(url, { familyName, loadPromise });
  await loadPromise;
  return familyName;
}

export class Text extends VMobject {
  protected _text: string;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _fontWeight: string | number;
  protected _fontStyle: string;
  /** Flag to track when canvas content needs re-rendering (text/color/font changes) */
  protected _canvasDirty: boolean = true;
  protected _lineHeight: number;
  protected _letterSpacing: number;
  protected _textAlign: 'left' | 'center' | 'right';

  /** Optional font URL for glyph vector extraction */
  protected _fontUrl?: string;
  /** Cached glyph group (created lazily by loadGlyphs) */
  protected _glyphGroup: TextGlyphGroup | null = null;

  /** Off-screen canvas for text rendering */
  protected _canvas: HTMLCanvasElement | null = null;
  protected _ctx: CanvasRenderingContext2D | null = null;

  /** Three.js texture from canvas */
  protected _texture: THREE.CanvasTexture | null = null;

  /** Plane mesh for displaying the texture */
  protected _mesh: THREE.Mesh | null = null;

  /** Cached dimensions in world units */
  protected _worldWidth: number = 0;
  protected _worldHeight: number = 0;

  constructor(options: TextOptions) {
    super();

    const {
      text,
      fontSize = 48,
      fontFamily = 'CMU Serif, Georgia, Times New Roman, serif',
      fontWeight = 'normal',
      fontStyle = 'normal',
      color = '#ffffff',
      fillOpacity = 1,
      strokeWidth = 0,
      lineHeight = 1.2,
      letterSpacing = 0,
      textAlign = 'center',
      fontUrl,
    } = options;

    this._text = text;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._fontWeight = fontWeight;
    this._fontStyle = fontStyle;
    this._lineHeight = lineHeight;
    this._letterSpacing = letterSpacing;
    this._textAlign = textAlign;
    this._fontUrl = fontUrl;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    // Initialize canvas
    this._initCanvas();
  }

  /**
   * Initialize the off-screen canvas
   */
  protected _initCanvas(): void {
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    if (!this._ctx) {
      throw new Error('Failed to get 2D context for text rendering');
    }
  }

  /**
   * Get the current text content
   */
  getText(): string {
    return this._text;
  }

  /**
   * Set new text content and re-render
   * @param text - New text to display
   * @returns this for chaining
   */
  setText(text: string): this {
    this._text = text;
    this._canvasDirty = true;
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the current font size
   */
  getFontSize(): number {
    return this._fontSize;
  }

  /**
   * Set font size and re-render
   * @param size - Font size in pixels
   * @returns this for chaining
   */
  setFontSize(size: number): this {
    this._fontSize = size;
    this._canvasDirty = true;
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the current font family
   */
  getFontFamily(): string {
    return this._fontFamily;
  }

  /**
   * Set font family and re-render
   * @param family - CSS font family string
   * @returns this for chaining
   */
  setFontFamily(family: string): this {
    this._fontFamily = family;
    this._canvasDirty = true;
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get text width in world units
   */
  getWidth(): number {
    return this._worldWidth;
  }

  /**
   * Get text height in world units
   */
  getHeight(): number {
    return this._worldHeight;
  }

  /**
   * Build the CSS font string
   */
  protected _buildFontString(): string {
    const style = this._fontStyle === 'italic' ? 'italic' : 'normal';
    const weight = typeof this._fontWeight === 'number'
      ? this._fontWeight.toString()
      : this._fontWeight;
    const size = Math.round(this._fontSize * RESOLUTION_SCALE);
    return `${style} ${weight} ${size}px ${this._fontFamily}`;
  }

  /**
   * Split text into lines and measure dimensions
   * @returns Object with lines array and canvas dimensions
   */
  protected _measureText(): { lines: string[]; width: number; height: number } {
    if (!this._ctx) {
      return { lines: [], width: 0, height: 0 };
    }

    this._ctx.font = this._buildFontString();
    const lines = this._text.split('\n');
    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;

    // Measure each line width
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = this._ctx.measureText(line);
      const lineWidth = metrics.width + (line.length - 1) * this._letterSpacing * RESOLUTION_SCALE;
      maxWidth = Math.max(maxWidth, lineWidth);
    }

    // Calculate total height
    const totalHeight = lines.length * scaledLineHeight;

    // Add padding
    const padding = scaledFontSize * 0.2;
    const width = Math.ceil(maxWidth + padding * 2);
    const height = Math.ceil(totalHeight + padding * 2);

    return { lines, width, height };
  }

  /**
   * Render text to the off-screen canvas
   */
  protected _renderToCanvas(): void {
    if (!this._canvas || !this._ctx) {
      return;
    }

    const { lines, width, height } = this._measureText();

    // Resize canvas
    this._canvas.width = width || 1;
    this._canvas.height = height || 1;

    // Clear canvas (transparent background)
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Set font and styles
    this._ctx.font = this._buildFontString();
    this._ctx.textBaseline = 'top';
    this._ctx.textAlign = this._textAlign;

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const padding = scaledFontSize * 0.2;

    // Calculate x position based on alignment
    let textX: number;
    switch (this._textAlign) {
      case 'left':
        textX = padding;
        break;
      case 'right':
        textX = width - padding;
        break;
      case 'center':
      default:
        textX = width / 2;
        break;
    }

    // Draw each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const y = padding + i * scaledLineHeight;

      // Apply letter spacing if needed
      if (this._letterSpacing > 0) {
        this._drawTextWithLetterSpacing(line, textX, y, scaledFontSize);
      } else {
        // Draw stroke if strokeWidth > 0
        if (this.strokeWidth > 0) {
          this._ctx.strokeStyle = this.color;
          this._ctx.lineWidth = this.strokeWidth * RESOLUTION_SCALE;
          this._ctx.strokeText(line, textX, y);
        }

        // Draw fill (use fillOpacity only; dynamic _opacity is handled by material)
        this._ctx.fillStyle = this.color;
        this._ctx.globalAlpha = this.fillOpacity;
        this._ctx.fillText(line, textX, y);
      }
    }

    // Store world dimensions
    this._worldWidth = (width / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    this._worldHeight = (height / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    // Clear canvas dirty flag
    this._canvasDirty = false;

    // Update texture if it exists
    if (this._texture) {
      this._texture.needsUpdate = true;
    }
  }

  /**
   * Draw text with custom letter spacing
   */
  protected _drawTextWithLetterSpacing(
    text: string,
    startX: number,
    y: number,
    _fontSize: number
  ): void {
    if (!this._ctx) return;

    const scaledSpacing = this._letterSpacing * RESOLUTION_SCALE;
    let currentX = startX;

    // Adjust starting position based on alignment
    if (this._textAlign === 'center') {
      const totalWidth = this._ctx.measureText(text).width + (text.length - 1) * scaledSpacing;
      currentX = startX - totalWidth / 2;
    } else if (this._textAlign === 'right') {
      const totalWidth = this._ctx.measureText(text).width + (text.length - 1) * scaledSpacing;
      currentX = startX - totalWidth;
    }

    this._ctx.textAlign = 'left';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Draw stroke if strokeWidth > 0
      if (this.strokeWidth > 0) {
        this._ctx.strokeStyle = this.color;
        this._ctx.lineWidth = this.strokeWidth * RESOLUTION_SCALE;
        this._ctx.strokeText(char, currentX, y);
      }

      // Draw fill (use fillOpacity only; dynamic _opacity is handled by material)
      this._ctx.fillStyle = this.color;
      this._ctx.globalAlpha = this.fillOpacity;
      this._ctx.fillText(char, currentX, y);

      currentX += this._ctx.measureText(char).width + scaledSpacing;
    }

    // Restore alignment
    this._ctx.textAlign = this._textAlign;
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

    // Render text to canvas
    this._renderToCanvas();

    if (!this._canvas) {
      return group;
    }

    // Create texture from canvas
    this._texture = new THREE.CanvasTexture(this._canvas);
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;

    // Create material with transparency
    const material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create plane geometry sized to match text
    const geometry = new THREE.PlaneGeometry(this._worldWidth, this._worldHeight);

    // Create mesh
    this._mesh = new THREE.Mesh(geometry, material);
    group.add(this._mesh);

    return group;
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    // Only re-render canvas when text/color/font changed (not for opacity-only changes)
    if (this._canvasDirty) {
      this._renderToCanvas();
    }

    if (this._mesh) {
      const material = this._mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = this._opacity;
      }
    }
  }

  /**
   * Get the cached TextGlyphGroup (null until loadGlyphs() resolves).
   */
  getGlyphGroup(): TextGlyphGroup | null {
    return this._glyphGroup;
  }

  /**
   * Lazily create a TextGlyphGroup from the font file at _fontUrl.
   * Returns null if no fontUrl was provided.
   *
   * @param options.useSkeletonStroke  When true, each glyph computes its
   *   skeleton (medial axis) for center-line stroke animation. Default: false.
   * @param options.skeletonOptions  Fine-tuning options for the skeletonization
   *   algorithm (grid resolution, smoothing, etc.).
   */
  async loadGlyphs(options?: {
    useSkeletonStroke?: boolean;
    skeletonOptions?: SkeletonizeOptions;
  }): Promise<TextGlyphGroup | null> {
    if (this._glyphGroup) return this._glyphGroup;
    if (!this._fontUrl) return null;

    // Load the font URL as a CSS @font-face (cached across all Text instances)
    // so the Canvas 2D renderer uses the same font file as the opentype.js glyph strokes.
    const familyName = await _loadFontFace(this._fontUrl);
    this._fontFamily = `'${familyName}'`;
    this._canvasDirty = true;
    this._renderToCanvas();
    this._updateMesh();

    this._glyphGroup = new TextGlyphGroup({
      text: this._text,
      fontUrl: this._fontUrl,
      fontSize: this._fontSize,
      color: this.color,
      strokeWidth: 2,
      useSkeletonStroke: options?.useSkeletonStroke,
      skeletonOptions: options?.skeletonOptions,
    });
    await this._glyphGroup.waitForReady();
    return this._glyphGroup;
  }

  /**
   * Get the texture mesh (for animation cross-fade access).
   */
  getTextureMesh(): THREE.Mesh | null {
    return this._mesh;
  }

  /**
   * Get the center of this text mobject
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Create a copy of this Text mobject
   */
  protected override _createCopy(): Text {
    return new Text({
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
      fontUrl: this._fontUrl,
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
    this._canvas = null;
    this._ctx = null;
    super.dispose();
  }
}

export default Text;

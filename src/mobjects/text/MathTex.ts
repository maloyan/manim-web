/**
 * MathTex - LaTeX rendering for manimweb using KaTeX (default) or MathJax (fallback)
 *
 * This module provides LaTeX math rendering capabilities by:
 * 1. Using KaTeX to render LaTeX to HTML (fast, limited subset)
 * 2. Falling back to MathJax SVG output for unsupported LaTeX (full LaTeX support)
 * 3. Converting output to canvas via DOM walking / SVG foreignObject
 * 4. Creating a THREE.js textured plane mesh
 *
 * Renderer selection:
 * - 'katex'  : KaTeX only (fast, limited subset)
 * - 'mathjax': MathJax only (slower, full LaTeX including \usepackage, align, etc.)
 * - 'auto'   : Try KaTeX first; fall back to MathJax if KaTeX throws (default)
 */

import * as THREE from 'three';
import katex from 'katex';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { ensureKatexStyles, waitForKatexStyles } from './katex-styles';
import { renderLatexToSVG, katexCanRender } from './MathJaxRenderer';

/**
 * Which renderer to use for LaTeX.
 * - 'katex'  : KaTeX only (fast, but limited LaTeX subset)
 * - 'mathjax': MathJax SVG only (slower, full LaTeX support)
 * - 'auto'   : Try KaTeX first; if it throws, fall back to MathJax
 */
export type TexRenderer = 'katex' | 'mathjax' | 'auto';

/**
 * Options for creating a MathTex object
 */
export interface MathTexOptions {
  /** LaTeX string or array of strings for multi-part expressions.
   *  When an array is provided, each string becomes a separate sub-mobject
   *  accessible via getPart(index), matching Python Manim's behavior. */
  latex: string | string[];
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Base font size in pixels. Default: 48 */
  fontSize?: number;
  /** Use display mode (block) vs inline mode. Default: true */
  displayMode?: boolean;
  /** Position in 3D space. Default: [0, 0, 0] */
  position?: Vector3Tuple;
  /** Internal: padding in pixels around the rendered content. Default: 10 */
  _padding?: number;
  /**
   * Which renderer to use.
   * - 'katex'  : KaTeX only (fast)
   * - 'mathjax': MathJax SVG only (full LaTeX support)
   * - 'auto'   : KaTeX first, MathJax fallback (default)
   */
  renderer?: TexRenderer;
}

/**
 * Internal state for async rendering
 */
interface RenderState {
  canvas: HTMLCanvasElement | null;
  texture: THREE.CanvasTexture | null;
  mesh: THREE.Mesh | null;
  width: number;
  height: number;
  isRendering: boolean;
  renderPromise: Promise<void> | null;
}

/**
 * MathTex - A mobject for rendering LaTeX mathematical expressions
 *
 * Uses KaTeX for LaTeX parsing and renders to a textured plane in Three.js.
 * The rendering is asynchronous but the constructor is synchronous.
 *
 * @example
 * ```typescript
 * // Create a simple equation
 * const equation = new MathTex({ latex: 'E = mc^2' });
 *
 * // Create a colored integral
 * const integral = new MathTex({
 *   latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
 *   color: '#00ff00',
 *   fontSize: 64
 * });
 *
 * // Wait for rendering to complete before animating
 * await integral.waitForRender();
 * ```
 */
export class MathTex extends Mobject {
  protected _latex: string;
  protected _fontSize: number;
  protected _displayMode: boolean;
  protected _renderState: RenderState;
  /** User-requested renderer mode */
  protected _renderer: TexRenderer;
  /** Which renderer was actually used for the last successful render */
  protected _activeRenderer: 'katex' | 'mathjax' | null = null;
  /** Whether this is a multi-part MathTex (created from string[]) */
  protected _isMultiPart: boolean = false;
  /** Child MathTex parts (only when _isMultiPart is true) */
  protected _parts: MathTex[] = [];
  /** Promise that resolves when parts are arranged (multi-part only) */
  protected _arrangePromise: Promise<void> | null = null;
  /** Padding in pixels around rendered content */
  protected _padding: number;

  constructor(options: MathTexOptions) {
    super();

    const {
      latex,
      color = '#ffffff',
      fontSize = 48,
      displayMode = true,
      position = [0, 0, 0],
      renderer = 'auto',
      _padding = 10,
    } = options;

    this._fontSize = fontSize;
    this._displayMode = displayMode;
    this._renderer = renderer;
    this._padding = _padding;
    this.color = color;

    // Initialize render state
    this._renderState = {
      canvas: null,
      texture: null,
      mesh: null,
      width: 0,
      height: 0,
      isRendering: false,
      renderPromise: null,
    };

    // Set position
    this.position.set(position[0], position[1], position[2]);

    if (Array.isArray(latex)) {
      // Multi-part mode: create child MathTex for each string
      this._isMultiPart = true;
      this._latex = latex.join('');

      for (const part of latex) {
        const child = new MathTex({
          latex: part,
          color,
          fontSize,
          displayMode: false, // inline mode for parts to avoid extra spacing
          renderer,
          _padding: 2, // minimal padding for multi-part children
        });
        this._parts.push(child);
        this.add(child);
      }

      // Arrange parts after they all render
      this._arrangePromise = this._arrangeParts();
      this._renderState.renderPromise = this._arrangePromise;
    } else {
      // Single-string mode: existing behavior
      this._isMultiPart = false;
      this._latex = latex;

      // Ensure KaTeX CSS is loaded (needed for 'katex' and 'auto' modes)
      if (this._renderer !== 'mathjax') {
        ensureKatexStyles();
      }

      // Start async rendering
      this._startRender();
    }
  }

  /**
   * Get the renderer mode
   */
  getRenderer(): TexRenderer {
    return this._renderer;
  }

  /**
   * Get which renderer was actually used for the current render.
   * Returns null if not yet rendered.
   */
  getActiveRenderer(): 'katex' | 'mathjax' | null {
    return this._activeRenderer;
  }

  /**
   * Set the renderer mode and re-render.
   * @param renderer The renderer to use
   * @returns this for chaining
   */
  setRenderer(renderer: TexRenderer): this {
    if (this._renderer === renderer) return this;
    this._renderer = renderer;
    this._startRender();
    return this;
  }

  /**
   * Get the LaTeX string
   */
  getLatex(): string {
    return this._latex;
  }

  /**
   * Set the LaTeX string and re-render
   * @param latex New LaTeX string
   * @returns this for chaining
   */
  setLatex(latex: string): this {
    if (this._latex === latex) return this;
    this._latex = latex;
    this._startRender();
    return this;
  }

  /**
   * Get the font size
   */
  getFontSize(): number {
    return this._fontSize;
  }

  /**
   * Set the font size and re-render
   * @param size New font size in pixels
   * @returns this for chaining
   */
  setFontSize(size: number): this {
    if (this._fontSize === size) return this;
    this._fontSize = size;
    this._startRender();
    return this;
  }

  /**
   * Override setColor — texture is always rendered white, so we only need
   * to update the material tint via _syncMaterialToThree (no re-render).
   */
  override setColor(color: string): this {
    super.setColor(color);
    if (this._isMultiPart) {
      for (const part of this._parts) {
        part.setColor(color);
      }
    }
    this._markDirty();
    return this;
  }

  /**
   * Override setOpacity to propagate to multi-part children.
   */
  override setOpacity(opacity: number): this {
    super.setOpacity(opacity);
    if (this._isMultiPart) {
      for (const part of this._parts) {
        part.setOpacity(opacity);
      }
    }
    return this;
  }

  /**
   * Wait for the LaTeX to finish rendering.
   * For multi-part MathTex, waits for all parts to render and be arranged.
   * @returns Promise that resolves when rendering is complete
   */
  async waitForRender(): Promise<void> {
    if (this._isMultiPart) {
      await Promise.all(this._parts.map((p) => p.waitForRender()));
      if (this._arrangePromise) {
        await this._arrangePromise;
      }
      return;
    }
    if (this._renderState.renderPromise) {
      await this._renderState.renderPromise;
    }
  }

  /**
   * Get a sub-part of a multi-part MathTex expression.
   * Only available when the MathTex was created with a string array.
   * @param index Zero-based index of the part
   * @returns The MathTex sub-part at the given index
   */
  getPart(index: number): MathTex {
    if (!this._isMultiPart) {
      throw new Error('getPart() is only available on multi-part MathTex (created with string[])');
    }
    if (index < 0 || index >= this._parts.length) {
      throw new Error(`Part index ${index} out of range [0, ${this._parts.length - 1}]`);
    }
    return this._parts[index];
  }

  /**
   * Get the number of parts (1 for single-string, N for multi-part).
   */
  getPartCount(): number {
    return this._isMultiPart ? this._parts.length : 1;
  }

  /**
   * Arrange child parts horizontally after they all render.
   * Positions parts so their content (minus padding) is seamlessly adjacent.
   */
  private async _arrangeParts(): Promise<void> {
    await Promise.all(this._parts.map((p) => p.waitForRender()));

    const SCALE = 0.01;

    // Collect content widths (total width minus padding on each side)
    const widths = this._parts.map((p) => {
      const [w] = p.getDimensions();
      return w;
    });
    const contentWidths = this._parts.map((p, i) => {
      const paddingWorld = p._padding * SCALE;
      return Math.max(0, widths[i] - 2 * paddingWorld);
    });

    // Small gap between parts to approximate natural LaTeX inter-expression spacing
    const INTER_PART_GAP = 0.03;

    // Position parts so content edges are adjacent with small gaps
    let cx = 0;
    const positions: number[] = [];
    for (let i = 0; i < this._parts.length; i++) {
      if (i > 0) cx += INTER_PART_GAP;
      positions.push(cx + contentWidths[i] / 2);
      cx += contentWidths[i];
    }

    // Center the entire group
    const totalContentWidth = cx;
    const centerOffset = totalContentWidth / 2;
    for (let i = 0; i < this._parts.length; i++) {
      this._parts[i].position.set(positions[i] - centerOffset, 0, 0);
      this._parts[i]._markDirty();
    }
  }

  /**
   * Check if rendering is in progress
   */
  isRendering(): boolean {
    return this._renderState.isRendering;
  }

  /**
   * Get the rendered dimensions in world units
   * @returns [width, height] or [0, 0] if not yet rendered
   */
  getDimensions(): [number, number] {
    if (this._isMultiPart) {
      // Compute aggregate dimensions from bounding box of all parts
      const bbox = this._getBoundingBox();
      return [bbox.width, bbox.height];
    }
    return [this._renderState.width, this._renderState.height];
  }

  /**
   * Start the async rendering process
   */
  protected _startRender(): void {
    this._renderState.isRendering = true;
    this._renderState.renderPromise = this._renderLatex()
      .then(() => {
        this._renderState.isRendering = false;
        this._markDirty();
      })
      .catch((error) => {
        console.error('MathTex rendering error:', error);
        this._renderState.isRendering = false;
        throw error;
      });
  }

  /**
   * Render the LaTeX to a canvas using the selected renderer.
   *
   * Renderer selection logic:
   * - 'katex'  : Use KaTeX directly (throwOnError: false)
   * - 'mathjax': Use MathJax SVG output, rendered to canvas via Image
   * - 'auto'   : Try KaTeX with throwOnError: true. If it throws,
   *              fall back to MathJax.
   */
  protected async _renderLatex(): Promise<void> {
    const useRenderer = this._resolveRenderer();

    if (useRenderer === 'mathjax') {
      return this._renderLatexViaMathJax();
    }

    // KaTeX path (used by both 'katex' and 'auto' after resolution)
    return this._renderLatexViaKaTeX();
  }

  /**
   * Determine which concrete renderer to use for the current LaTeX string.
   */
  private _resolveRenderer(): 'katex' | 'mathjax' {
    if (this._renderer === 'katex') return 'katex';
    if (this._renderer === 'mathjax') return 'mathjax';

    // 'auto': probe KaTeX
    if (katexCanRender(this._latex, this._displayMode)) {
      return 'katex';
    }
    return 'mathjax';
  }

  /**
   * Render using MathJax SVG output.  The SVG is painted onto a canvas
   * texture in the same way the KaTeX path works, keeping the visual
   * pipeline consistent.
   */
  protected async _renderLatexViaMathJax(): Promise<void> {
    this._activeRenderer = 'mathjax';

    const result = await renderLatexToSVG(this._latex, {
      displayMode: this._displayMode,
      color: '#ffffff', // always render white; actual color applied via material tint
      fontScale: this._fontSize / 48, // normalise against base 48px
    });

    // Render the MathJax SVG into a canvas via <img>
    const svgString = result.svgString;

    // Measure intrinsic size
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = svgString;
    document.body.appendChild(tempDiv);

    const svgEl = tempDiv.querySelector('svg');
    if (!svgEl) {
      document.body.removeChild(tempDiv);
      console.warn('MathTex: MathJax produced no SVG for:', this._latex);
      return;
    }

    // Ensure the SVG has explicit width/height for rasterization
    const wAttr = svgEl.getAttribute('width');
    const hAttr = svgEl.getAttribute('height');
    let svgW = wAttr ? parseFloat(wAttr) : 0;
    let svgH = hAttr ? parseFloat(hAttr) : 0;
    if ((!svgW || !svgH) && result.width && result.height) {
      // viewBox units — scale to a reasonable pixel size
      svgW = result.width * this._fontSize;
      svgH = result.height * this._fontSize;
      svgEl.setAttribute('width', String(svgW));
      svgEl.setAttribute('height', String(svgH));
    }

    const finalSvgString = new XMLSerializer().serializeToString(svgEl);
    document.body.removeChild(tempDiv);

    const padding = this._padding;
    const width = Math.ceil(svgW) + padding * 2;
    const height = Math.ceil(svgH) + padding * 2;

    if (width <= 0 || height <= 0) {
      console.warn('MathTex (MathJax): Invalid dimensions', { width, height, latex: this._latex });
      return;
    }

    // Rasterize to canvas
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, padding, padding, svgW, svgH);
        URL.revokeObjectURL(img.src);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('MathTex (MathJax): Failed to rasterize SVG'));
      };
      const blob = new Blob([finalSvgString], { type: 'image/svg+xml;charset=utf-8' });
      img.src = URL.createObjectURL(blob);
    });

    // Store in render state (same pipeline as KaTeX)
    this._renderState.canvas = canvas;

    if (this._renderState.texture) {
      this._renderState.texture.dispose();
    }
    this._renderState.texture = new THREE.CanvasTexture(canvas);
    this._renderState.texture.colorSpace = THREE.SRGBColorSpace;
    this._renderState.texture.minFilter = THREE.LinearFilter;
    this._renderState.texture.magFilter = THREE.LinearFilter;
    this._renderState.texture.needsUpdate = true;

    const scaleFactor = 0.01;
    this._renderState.width = width * scaleFactor;
    this._renderState.height = height * scaleFactor;

    if (this._renderState.mesh) {
      this._updateMeshGeometry();
      const material = this._renderState.mesh.material as THREE.MeshBasicMaterial;
      material.map = this._renderState.texture;
      material.needsUpdate = true;
    }
  }

  /**
   * Render the LaTeX to a canvas by walking the KaTeX DOM
   * and drawing each text element at its computed CSS position.
   */
  protected async _renderLatexViaKaTeX(): Promise<void> {
    this._activeRenderer = 'katex';

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.fontSize = `${this._fontSize}px`;
    document.body.appendChild(container);

    try {
      // Render LaTeX with KaTeX — produces properly laid-out HTML+CSS
      katex.render(this._latex, container, {
        displayMode: this._displayMode,
        throwOnError: false,
        output: 'html',
      });

      // Wait for KaTeX CSS to load
      await waitForKatexStyles();

      // Force style recalculation so browser discovers @font-face rules
      void container.offsetHeight;

      // Wait a tick for CSS processing and font discovery.
      // NOTE: use setTimeout instead of requestAnimationFrame — rAF is
      // suspended in background tabs, causing waitForRender() to hang.
      await new Promise<void>((r) => setTimeout(r, 0));

      // Explicitly request common KaTeX fonts (triggers download if not cached).
      // Race against a timeout to avoid hanging if fonts can't load.
      const fs = `${this._fontSize}px`;
      const fontTimeout = new Promise<void>((r) => setTimeout(r, 5000));
      await Promise.race([
        Promise.all(
          [
            document.fonts.load(`${fs} KaTeX_Main`),
            document.fonts.load(`italic ${fs} KaTeX_Math`),
            document.fonts.load(`bold ${fs} KaTeX_Main`),
            document.fonts.load(`${fs} KaTeX_Size1`),
            document.fonts.load(`${fs} KaTeX_Size2`),
            document.fonts.load(`${fs} KaTeX_AMS`),
          ].map((p) => p.catch((err) => {
            console.warn('MathTex: KaTeX font failed to load. Rendering may be degraded.', err);
          })),
        ),
        fontTimeout,
      ]);

      // Wait for all fonts to finish loading (with timeout)
      await Promise.race([document.fonts.ready, fontTimeout]);

      // Measure the rendered content
      const containerRect = container.getBoundingClientRect();
      const padding = this._padding;
      const width = Math.ceil(containerRect.width) + padding * 2;
      const height = Math.ceil(containerRect.height) + padding * 2;

      if (width <= 0 || height <= 0) {
        console.warn('MathTex: Invalid dimensions', { width, height, latex: this._latex });
        return;
      }

      // Walk KaTeX DOM and render each text/SVG element to canvas
      const canvas = await this._renderDomToCanvas(
        container,
        containerRect,
        width,
        height,
        padding,
      );

      // Store render state
      this._renderState.canvas = canvas;

      // Create or update texture
      if (this._renderState.texture) {
        this._renderState.texture.dispose();
      }
      this._renderState.texture = new THREE.CanvasTexture(canvas);
      this._renderState.texture.colorSpace = THREE.SRGBColorSpace;
      this._renderState.texture.minFilter = THREE.LinearFilter;
      this._renderState.texture.magFilter = THREE.LinearFilter;
      this._renderState.texture.needsUpdate = true;

      // Calculate world dimensions
      const scaleFactor = 0.01;
      this._renderState.width = width * scaleFactor;
      this._renderState.height = height * scaleFactor;

      // Update mesh if it exists
      if (this._renderState.mesh) {
        this._updateMeshGeometry();
        const material = this._renderState.mesh.material as THREE.MeshBasicMaterial;
        material.map = this._renderState.texture;
        material.needsUpdate = true;
      }
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Walk the KaTeX DOM tree and render text nodes + SVG elements
   * at their computed CSS positions onto a canvas.
   */
  protected async _renderDomToCanvas(
    container: HTMLElement,
    containerRect: DOMRect,
    width: number,
    height: number,
    padding: number,
  ): Promise<HTMLCanvasElement> {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff'; // always render white; actual color applied via material tint

    // Collect text items, SVG items, and CSS rule items from KaTeX DOM
    interface TextItem {
      text: string;
      x: number;
      y: number;
      font: string;
    }
    interface SvgItem {
      svgString: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }
    interface RuleItem {
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const textItems: TextItem[] = [];
    const svgItems: SvgItem[] = [];
    const ruleItems: RuleItem[] = [];

    const collectNodes = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || !text.trim()) return;
        // Skip zero-width/invisible characters (KaTeX uses ZWSP in vlist-s spacing elements)
        if (/^(?:\u200B|\u200C|\u200D|\uFEFF)+$/.test(text)) return;

        const parent = node.parentElement;
        if (!parent) return;

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        if (parseFloat(style.opacity) === 0) return;

        // Get the position of this text node
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = range.getClientRects();
        if (rects.length === 0) return;

        // Use the first rect for positioning — skip zero-width rects
        const r = rects[0];
        if (r.width < 0.5) return;

        textItems.push({
          text,
          x: r.left - containerRect.left + padding,
          y: r.top - containerRect.top + padding,
          font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        });
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;

        // Skip the hidden MathML accessibility tree
        if (el.classList?.contains('katex-mathml')) return;

        // Handle inline SVGs (radical signs, delimiters, etc.)
        if (el.tagName.toLowerCase() === 'svg') {
          const svgRect = el.getBoundingClientRect();
          if (svgRect.width > 0 && svgRect.height > 0) {
            const clone = el.cloneNode(true) as SVGElement;
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            // Always set explicit width/height from the rendered size
            clone.setAttribute('width', String(svgRect.width));
            clone.setAttribute('height', String(svgRect.height));
            // Preserve the viewBox if present; if not, add one from the original SVG
            if (!clone.getAttribute('viewBox')) {
              const origVb = el.getAttribute('viewBox');
              if (origVb) clone.setAttribute('viewBox', origVb);
            }
            // Set color property for currentColor inheritance in standalone SVG
            // Always render white; actual color applied via material tint
            clone.setAttribute('color', '#ffffff');
            clone.setAttribute('style', 'color: #ffffff; overflow: visible;');

            // Replace currentColor in all shape elements (attributes + inline styles)
            const shapes = clone.querySelectorAll('path, line, rect, circle, polyline, polygon');
            shapes.forEach((p) => {
              const fill = p.getAttribute('fill');
              if (!fill || fill === 'currentColor' || fill === 'inherit') {
                p.setAttribute('fill', '#ffffff');
              }
              const stroke = p.getAttribute('stroke');
              if (stroke === 'currentColor' || stroke === 'inherit') {
                p.setAttribute('stroke', '#ffffff');
              }
              const inlineStyle = p.getAttribute('style');
              if (inlineStyle && inlineStyle.includes('currentColor')) {
                p.setAttribute('style', inlineStyle.replace(/currentColor/g, '#ffffff'));
              }
            });

            svgItems.push({
              svgString: new XMLSerializer().serializeToString(clone),
              x: svgRect.left - containerRect.left + padding,
              y: svgRect.top - containerRect.top + padding,
              w: svgRect.width,
              h: svgRect.height,
            });
          }
          return;
        }

        // Capture CSS-rendered visual elements (fraction bars, overlines, etc.)
        const elStyle = window.getComputedStyle(el);
        const borderBottom = parseFloat(elStyle.borderBottomWidth) || 0;
        const borderTop = parseFloat(elStyle.borderTopWidth) || 0;
        if (borderBottom > 0 || borderTop > 0) {
          const elRect = el.getBoundingClientRect();
          if (elRect.width > 0) {
            const ex = elRect.left - containerRect.left + padding;
            const ey = elRect.top - containerRect.top + padding;
            if (borderBottom > 0) {
              ruleItems.push({
                x: ex,
                y: ey + elRect.height - borderBottom,
                w: elRect.width,
                h: Math.max(borderBottom, 1),
              });
            }
            if (borderTop > 0) {
              ruleItems.push({
                x: ex,
                y: ey,
                w: elRect.width,
                h: Math.max(borderTop, 1),
              });
            }
          }
        }

        // Capture background-color rules (e.g., KaTeX \rule elements)
        const bgColor = elStyle.backgroundColor;
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
          const elRect = el.getBoundingClientRect();
          if (elRect.width > 0 && elRect.height > 0) {
            ruleItems.push({
              x: elRect.left - containerRect.left + padding,
              y: elRect.top - containerRect.top + padding,
              w: elRect.width,
              h: elRect.height,
            });
          }
        }

        // Recurse into child nodes
        for (const child of el.childNodes) {
          collectNodes(child);
        }
      }
    };

    collectNodes(container);

    // Draw layers in correct z-order:
    // 1. SVG items FIRST (radical signs, delimiters — background decorations)
    if (svgItems.length > 0) {
      await Promise.all(
        svgItems.map((item) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, item.x, item.y, item.w, item.h);
              URL.revokeObjectURL(img.src);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(img.src);
              resolve();
            };
            const blob = new Blob([item.svgString], { type: 'image/svg+xml;charset=utf-8' });
            img.src = URL.createObjectURL(blob);
          });
        }),
      );
    }

    // 2. CSS rule items (fraction bars, overlines)
    for (const item of ruleItems) {
      ctx.fillStyle = '#ffffff'; // always render white; actual color via material tint
      ctx.fillRect(item.x, item.y, item.w, item.h);
    }

    // 3. Text items LAST (foreground — actual math content on top)
    for (const item of textItems) {
      ctx.font = item.font;
      ctx.fillStyle = '#ffffff'; // always render white; actual color via material tint
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      // Compute the alphabetic baseline from the CSS rect position.
      // KaTeX uses tight line-heights, so rect.top ≈ baseline - fontBoundingBoxAscent.
      // Using fontBoundingBoxAscent (constant per font) preserves baseline alignment
      // for all characters in the same font, while correctly positioning large
      // operators (like ∑ in KaTeX_Size2) that extend above the em-box.
      const metrics = ctx.measureText(item.text);
      const baselineY = item.y + (metrics.fontBoundingBoxAscent ?? 0);
      ctx.fillText(item.text, item.x, baselineY);
    }

    return canvas;
  }

  /**
   * Update the mesh geometry to match current dimensions
   */
  protected _updateMeshGeometry(): void {
    if (!this._renderState.mesh) return;

    const { width, height } = this._renderState;
    const geometry = new THREE.PlaneGeometry(width, height);

    // Dispose old geometry
    this._renderState.mesh.geometry.dispose();
    this._renderState.mesh.geometry = geometry;
  }

  /**
   * Create the Three.js backing object
   */
  protected _createThreeObject(): THREE.Object3D {
    // Multi-part mode: just return an empty group; children add their own meshes
    if (this._isMultiPart) {
      return new THREE.Group();
    }

    const group = new THREE.Group();
    const { width, height, texture } = this._renderState;

    // Create geometry (may be placeholder if not yet rendered)
    const geometry = new THREE.PlaneGeometry(width || 1, height || 0.5);

    // Create material with texture — canvas is always white, material.color tints
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: this._opacity,
      color: new THREE.Color(this.color),
    });

    // Create mesh inside group so _syncToThree sets group position,
    // and setRevealProgress can independently set mesh local position
    const mesh = new THREE.Mesh(geometry, material);
    this._renderState.mesh = mesh;
    group.add(mesh);

    return group;
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    if (this._renderState.mesh) {
      const material = this._renderState.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = this._opacity;
      material.color.set(this.color); // tint white texture to desired color

      // Update texture if available
      if (this._renderState.texture && material.map !== this._renderState.texture) {
        material.map = this._renderState.texture;
        material.needsUpdate = true;
      }

      // Update geometry if dimensions changed
      const geometry = this._renderState.mesh.geometry as THREE.PlaneGeometry;
      const params = geometry.parameters;
      if (params.width !== this._renderState.width || params.height !== this._renderState.height) {
        this._updateMeshGeometry();
      }
    }
  }

  /**
   * Create a copy of this MathTex
   */
  protected override _createCopy(): MathTex {
    const latexValue = this._isMultiPart ? this._parts.map((p) => p._latex) : this._latex;
    return new MathTex({
      latex: latexValue,
      color: this.color,
      fontSize: this._fontSize,
      displayMode: this._displayMode,
      position: [this.position.x, this.position.y, this.position.z],
      renderer: this._renderer,
    });
  }

  /**
   * Set reveal progress for Write animation (left-to-right wipe).
   * @param alpha - Progress from 0 (hidden) to 1 (fully visible)
   */
  setRevealProgress(alpha: number): void {
    if (this._isMultiPart) {
      // Reveal parts sequentially, each part gets its own slice of the alpha range
      const n = this._parts.length;
      for (let i = 0; i < n; i++) {
        const partStart = i / n;
        const partEnd = (i + 1) / n;
        const partAlpha = Math.max(0, Math.min(1, (alpha - partStart) / (partEnd - partStart)));
        this._parts[i].setRevealProgress(partAlpha);
      }
      return;
    }
    if (!this._renderState.mesh || !this._renderState.texture) return;

    const a = Math.max(0.001, Math.min(1, alpha));

    if (a <= 0.001) {
      this._renderState.mesh.visible = false;
      return;
    }

    this._renderState.mesh.visible = true;

    // Scale X to reveal left portion, keep left edge fixed
    this._renderState.mesh.scale.x = a;
    this._renderState.mesh.position.x = (this._renderState.width * (a - 1)) / 2;

    // Adjust texture to show only revealed portion (prevent squishing)
    this._renderState.texture.repeat.set(a, 1);
    this._renderState.texture.offset.set(0, 0);
    this._renderState.texture.needsUpdate = true;
  }

  /**
   * Get the center of this MathTex
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Clean up Three.js resources
   */
  override dispose(): void {
    if (this._renderState.texture) {
      this._renderState.texture.dispose();
    }
    if (this._renderState.mesh) {
      this._renderState.mesh.geometry.dispose();
      (this._renderState.mesh.material as THREE.Material).dispose();
    }
    super.dispose();
  }
}

export default MathTex;

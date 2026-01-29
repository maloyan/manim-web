/**
 * MathTex - LaTeX rendering for manimweb using KaTeX
 *
 * This module provides LaTeX math rendering capabilities by:
 * 1. Using KaTeX to render LaTeX to HTML
 * 2. Converting HTML to canvas via SVG foreignObject
 * 3. Creating a THREE.js textured plane mesh
 */

import * as THREE from 'three';
import katex from 'katex';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { ensureKatexStyles, waitForKatexStyles } from './katex-styles';

/**
 * Options for creating a MathTex object
 */
export interface MathTexOptions {
  /** LaTeX string to render, e.g., 'E = mc^2' */
  latex: string;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Base font size in pixels. Default: 48 */
  fontSize?: number;
  /** Use display mode (block) vs inline mode. Default: true */
  displayMode?: boolean;
  /** Position in 3D space. Default: [0, 0, 0] */
  position?: Vector3Tuple;
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

  constructor(options: MathTexOptions) {
    super();

    const {
      latex,
      color = '#ffffff',
      fontSize = 48,
      displayMode = true,
      position = [0, 0, 0],
    } = options;

    this._latex = latex;
    this._fontSize = fontSize;
    this._displayMode = displayMode;
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

    // Ensure KaTeX CSS is loaded
    ensureKatexStyles();

    // Start async rendering
    this._startRender();
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
   * Override setColor to trigger re-render
   */
  override setColor(color: string): this {
    super.setColor(color);
    this._startRender();
    return this;
  }

  /**
   * Wait for the LaTeX to finish rendering
   * @returns Promise that resolves when rendering is complete
   */
  async waitForRender(): Promise<void> {
    if (this._renderState.renderPromise) {
      await this._renderState.renderPromise;
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
      });
  }

  /**
   * Render the LaTeX to a canvas by walking the KaTeX DOM
   * and drawing each text element at its computed CSS position.
   */
  protected async _renderLatex(): Promise<void> {
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
      await new Promise<void>(r => setTimeout(r, 0));

      // Explicitly request common KaTeX fonts (triggers download if not cached).
      // Race against a timeout to avoid hanging if fonts can't load.
      const fs = `${this._fontSize}px`;
      const fontTimeout = new Promise<void>(r => setTimeout(r, 5000));
      await Promise.race([
        Promise.all([
          document.fonts.load(`${fs} KaTeX_Main`),
          document.fonts.load(`italic ${fs} KaTeX_Math`),
          document.fonts.load(`bold ${fs} KaTeX_Main`),
          document.fonts.load(`${fs} KaTeX_Size1`),
          document.fonts.load(`${fs} KaTeX_Size2`),
          document.fonts.load(`${fs} KaTeX_AMS`),
        ].map(p => p.catch(() => {}))),
        fontTimeout,
      ]);

      // Wait for all fonts to finish loading (with timeout)
      await Promise.race([document.fonts.ready, fontTimeout]);

      // Measure the rendered content
      const containerRect = container.getBoundingClientRect();
      const padding = 10;
      const width = Math.ceil(containerRect.width) + padding * 2;
      const height = Math.ceil(containerRect.height) + padding * 2;

      if (width <= 0 || height <= 0) {
        console.warn('MathTex: Invalid dimensions', { width, height, latex: this._latex });
        return;
      }

      // Walk KaTeX DOM and render each text/SVG element to canvas
      const canvas = await this._renderDomToCanvas(container, containerRect, width, height, padding);

      // Store render state
      this._renderState.canvas = canvas;

      // Create or update texture
      if (this._renderState.texture) {
        this._renderState.texture.dispose();
      }
      this._renderState.texture = new THREE.CanvasTexture(canvas);
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
    padding: number
  ): Promise<HTMLCanvasElement> {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = this.color;

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
        if (/^[\u200B\u200C\u200D\uFEFF]+$/.test(text)) return;

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
            clone.setAttribute('color', this.color);
            clone.setAttribute('style', `color: ${this.color}; overflow: visible;`);

            // Replace currentColor in all shape elements (attributes + inline styles)
            const shapes = clone.querySelectorAll('path, line, rect, circle, polyline, polygon');
            shapes.forEach(p => {
              const fill = p.getAttribute('fill');
              if (!fill || fill === 'currentColor' || fill === 'inherit') {
                p.setAttribute('fill', this.color);
              }
              const stroke = p.getAttribute('stroke');
              if (stroke === 'currentColor' || stroke === 'inherit') {
                p.setAttribute('stroke', this.color);
              }
              const inlineStyle = p.getAttribute('style');
              if (inlineStyle && inlineStyle.includes('currentColor')) {
                p.setAttribute('style', inlineStyle.replace(/currentColor/g, this.color));
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
      await Promise.all(svgItems.map(item => {
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
      }));
    }

    // 2. CSS rule items (fraction bars, overlines)
    for (const item of ruleItems) {
      ctx.fillStyle = this.color;
      ctx.fillRect(item.x, item.y, item.w, item.h);
    }

    // 3. Text items LAST (foreground — actual math content on top)
    for (const item of textItems) {
      ctx.font = item.font;
      ctx.fillStyle = this.color;
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
    const group = new THREE.Group();
    const { width, height, texture } = this._renderState;

    // Create geometry (may be placeholder if not yet rendered)
    const geometry = new THREE.PlaneGeometry(width || 1, height || 0.5);

    // Create material with texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: this._opacity,
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

      // Update texture if available
      if (this._renderState.texture && material.map !== this._renderState.texture) {
        material.map = this._renderState.texture;
        material.needsUpdate = true;
      }

      // Update geometry if dimensions changed
      const geometry = this._renderState.mesh.geometry as THREE.PlaneGeometry;
      const params = geometry.parameters;
      if (
        params.width !== this._renderState.width ||
        params.height !== this._renderState.height
      ) {
        this._updateMeshGeometry();
      }
    }
  }

  /**
   * Create a copy of this MathTex
   */
  protected override _createCopy(): MathTex {
    return new MathTex({
      latex: this._latex,
      color: this.color,
      fontSize: this._fontSize,
      displayMode: this._displayMode,
      position: [this.position.x, this.position.y, this.position.z],
    });
  }

  /**
   * Set reveal progress for Write animation (left-to-right wipe).
   * @param alpha - Progress from 0 (hidden) to 1 (fully visible)
   */
  setRevealProgress(alpha: number): void {
    if (!this._renderState.mesh || !this._renderState.texture) return;

    const a = Math.max(0.001, Math.min(1, alpha));

    if (a <= 0.001) {
      this._renderState.mesh.visible = false;
      return;
    }

    this._renderState.mesh.visible = true;

    // Scale X to reveal left portion, keep left edge fixed
    this._renderState.mesh.scale.x = a;
    this._renderState.mesh.position.x = this._renderState.width * (a - 1) / 2;

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

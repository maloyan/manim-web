import * as THREE from 'three';

/**
 * Options for configuring the Renderer.
 */
export interface RendererOptions {
  /** Canvas width in pixels. Defaults to container width. */
  width?: number;
  /** Canvas height in pixels. Defaults to container height. */
  height?: number;
  /** Background color as CSS color string. Defaults to '#000000'. */
  backgroundColor?: string;
  /** Enable antialiasing. Defaults to true. */
  antialias?: boolean;
  /** Device pixel ratio. Defaults to window.devicePixelRatio (capped at 2x for performance). */
  pixelRatio?: number;
  /** GPU power preference. Defaults to 'high-performance'. */
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  /** Enable alpha channel. Defaults to false. */
  alpha?: boolean;
  /** Preserve drawing buffer for export. Defaults to true for video/image export support. */
  preserveDrawingBuffer?: boolean;
  /** Existing canvas element to reuse. If not provided, a new canvas is created. */
  canvas?: HTMLCanvasElement;
}

/**
 * Three.js WebGLRenderer wrapper for manimweb.
 * Handles canvas creation, rendering, and lifecycle management.
 */
export class Renderer {
  private _renderer: THREE.WebGLRenderer;
  private _width: number;
  private _height: number;
  private _backgroundColor: THREE.Color;

  /**
   * Create a new Renderer and append it to the container.
   * @param container - DOM element to append the canvas to
   * @param options - Renderer configuration options
   */
  constructor(container: HTMLElement, options: RendererOptions = {}) {
    const {
      width = container.clientWidth || 800,
      height = container.clientHeight || 450,
      backgroundColor = '#000000',
      antialias = true,
      // Cap pixel ratio at 2x for performance on high-DPI screens
      pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
      powerPreference = 'high-performance',
      alpha = false,
      preserveDrawingBuffer = true,  // Needed for video/image export
      canvas,
    } = options;

    this._width = width;
    this._height = height;
    this._backgroundColor = new THREE.Color(backgroundColor);

    this._renderer = new THREE.WebGLRenderer({
      canvas,  // Reuse existing canvas if provided
      antialias,
      alpha,
      preserveDrawingBuffer,
      powerPreference,
    });

    this._renderer.setSize(this._width, this._height);
    // Ensure pixel ratio is capped at 2x even if explicitly provided higher
    this._renderer.setPixelRatio(Math.min(pixelRatio, 2));
    this._renderer.setClearColor(this._backgroundColor);

    // Only append if we created a new canvas (no existing canvas provided)
    if (!canvas) {
      container.appendChild(this._renderer.domElement);
    }
  }

  /**
   * Get the current width.
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get the current height.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Get the background color.
   */
  get backgroundColor(): THREE.Color {
    return this._backgroundColor;
  }

  /**
   * Set the background color.
   */
  set backgroundColor(color: THREE.Color | string) {
    this._backgroundColor = color instanceof THREE.Color ? color : new THREE.Color(color);
    this._renderer.setClearColor(this._backgroundColor);
  }

  /**
   * Render a frame.
   * @param scene - Three.js scene to render
   * @param camera - Three.js camera to use
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this._renderer.render(scene, camera);
  }

  /**
   * Handle resize events.
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this._renderer.setSize(width, height);
  }

  /**
   * Get the underlying canvas element.
   * @returns The HTMLCanvasElement used for rendering
   */
  getCanvas(): HTMLCanvasElement {
    return this._renderer.domElement;
  }

  /**
   * Get the underlying Three.js WebGLRenderer.
   * @returns The WebGLRenderer instance
   */
  getThreeRenderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  /**
   * Clean up resources.
   * Removes canvas from DOM and disposes WebGL resources.
   */
  dispose(): void {
    const canvas = this._renderer.domElement;
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
    this._renderer.dispose();
  }
}

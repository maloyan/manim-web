import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Image filter options for visual effects
 */
export interface ImageFilterOptions {
  /** Apply grayscale filter. Default: false */
  grayscale?: boolean;
  /** Invert colors. Default: false */
  invert?: boolean;
  /** Brightness multiplier (1 = normal). Default: 1 */
  brightness?: number;
  /** Contrast multiplier (1 = normal). Default: 1 */
  contrast?: number;
}

/**
 * Options for creating an ImageMobject
 */
export interface ImageMobjectOptions {
  /** Image source: URL or base64 data URI. Either source or pixelData is required. */
  source?: string;
  /** 2D grayscale pixel array (values 0-255). Each inner array is a row. Either source or pixelData is required. */
  pixelData?: number[][];
  /** Width of the image in scene units. Default: auto-calculated from aspect ratio */
  width?: number;
  /** Height of the image in scene units. Default: auto-calculated from aspect ratio */
  height?: number;
  /** If both width and height specified, whether to scale to fit within bounds preserving aspect ratio. Default: true */
  scaleToFit?: boolean;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Image filter options */
  filters?: ImageFilterOptions;
  /** Whether to render both sides. Default: false */
  doubleSided?: boolean;
}

/**
 * ImageMobject - Display images as mobjects
 *
 * Creates an image plane using THREE.js PlaneGeometry with TextureLoader.
 * Supports loading from URLs or base64 data, with optional filters like
 * grayscale and invert.
 *
 * @example
 * ```typescript
 * // Load from URL
 * const image = new ImageMobject({
 *   source: 'https://example.com/image.png',
 *   width: 4,
 * });
 *
 * // Load from base64
 * const base64Image = new ImageMobject({
 *   source: 'data:image/png;base64,iVBORw0KGgoAAAA...',
 *   height: 3,
 *   opacity: 0.8,
 * });
 *
 * // With filters
 * const filtered = new ImageMobject({
 *   source: 'https://example.com/photo.jpg',
 *   width: 5,
 *   filters: {
 *     grayscale: true,
 *     brightness: 1.2,
 *   },
 * });
 * ```
 */
export class ImageMobject extends Mobject {
  protected _source: string;
  protected _pixelData: number[][] | undefined;
  protected _width: number | undefined;
  protected _height: number | undefined;
  protected _scaleToFit: boolean;
  protected _centerPoint: Vector3Tuple;
  protected _filters: ImageFilterOptions;
  protected _doubleSided: boolean;
  protected _texture: THREE.Texture | null = null;
  protected _imageLoaded: boolean = false;
  protected _naturalWidth: number = 1;
  protected _naturalHeight: number = 1;

  // Promise that resolves when image is loaded
  private _loadPromise: Promise<void>;
  private _loadResolve: (() => void) | null = null;

  constructor(options: ImageMobjectOptions) {
    super();

    const {
      source = '',
      pixelData,
      width,
      height,
      scaleToFit = true,
      center = [0, 0, 0],
      opacity = 1,
      filters = {},
      doubleSided = false,
    } = options;

    this._source = source;
    this._pixelData = pixelData;
    this._width = width;
    this._height = height;
    this._scaleToFit = scaleToFit;
    this._centerPoint = [...center];
    this._filters = {
      grayscale: filters.grayscale ?? false,
      invert: filters.invert ?? false,
      brightness: filters.brightness ?? 1,
      contrast: filters.contrast ?? 1,
    };
    this._doubleSided = doubleSided;
    this._opacity = opacity;

    // For pixelData images, default height to 2 scene units.
    // Manim Python's ImageMobject initializes points at a 2×2 unit square;
    // users typically call .scale(2) which brings it to 4 units (half the frame).
    if (pixelData && width === undefined && height === undefined) {
      this._height = 2;
    }

    // Set position from center
    this.position.set(center[0], center[1], center[2]);

    // Initialize load promise
    this._loadPromise = new Promise((resolve) => {
      this._loadResolve = resolve;
    });

    if (pixelData) {
      this._loadFromPixelData(pixelData);
    } else {
      this._loadTexture();
    }
  }

  /**
   * Load texture from a 2D grayscale pixel array
   */
  private _loadFromPixelData(pixelData: number[][]): void {
    const rows = pixelData.length;
    const cols = pixelData[0]?.length ?? 0;

    // Paint raw pixel values onto a tiny source canvas
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = cols;
    srcCanvas.height = rows;
    const srcCtx = srcCanvas.getContext('2d')!;
    const imageData = srcCtx.createImageData(cols, rows);
    const data = imageData.data;

    for (let y = 0; y < rows; y++) {
      const row = pixelData[y];
      for (let x = 0; x < cols; x++) {
        const v = Math.max(0, Math.min(255, Math.round(row[x] ?? 0)));
        const idx = (y * cols + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    srcCtx.putImageData(imageData, 0, 0);

    // Upscale with bilinear interpolation for smooth gradients
    // (matches Python Manim's Cairo interpolation on tiny pixel arrays)
    const scale = 128;
    const canvas = document.createElement('canvas');
    canvas.width = cols * scale;
    canvas.height = rows * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this._texture = texture;
    this._naturalWidth = cols;
    this._naturalHeight = rows;
    this._imageLoaded = true;

    this._applyFilters();
    this._updateGeometry();
    this._markDirty();

    if (this._loadResolve) {
      this._loadResolve();
      this._loadResolve = null;
    }
  }

  /**
   * Load the texture from the source
   */
  private _loadTexture(): void {
    const loader = new THREE.TextureLoader();

    loader.load(
      this._source,
      // onLoad callback
      (texture) => {
        this._texture = texture;
        this._naturalWidth = texture.image.width;
        this._naturalHeight = texture.image.height;
        this._imageLoaded = true;

        // Apply filters if needed
        this._applyFilters();

        // Update geometry with correct dimensions
        this._updateGeometry();

        // Mark dirty to trigger re-render
        this._markDirty();

        // Resolve the load promise
        if (this._loadResolve) {
          this._loadResolve();
          this._loadResolve = null;
        }
      },
      // onProgress callback (unused)
      undefined,
      // onError callback
      (error) => {
        console.error('Failed to load image:', error);
        // Still resolve promise to prevent hanging
        if (this._loadResolve) {
          this._loadResolve();
          this._loadResolve = null;
        }
      }
    );
  }

  /**
   * Wait for the image to be loaded
   * @returns Promise that resolves when the image is loaded
   */
  async waitForLoad(): Promise<void> {
    return this._loadPromise;
  }

  /**
   * Check if the image has been loaded
   */
  isLoaded(): boolean {
    return this._imageLoaded;
  }

  /**
   * Calculate the display dimensions based on options and natural size
   */
  private _calculateDimensions(): { width: number; height: number } {
    const aspectRatio = this._naturalWidth / this._naturalHeight;

    if (this._width !== undefined && this._height !== undefined) {
      if (this._scaleToFit) {
        // Scale to fit within bounds while preserving aspect ratio
        const boxAspect = this._width / this._height;
        if (aspectRatio > boxAspect) {
          // Image is wider, fit to width
          return {
            width: this._width,
            height: this._width / aspectRatio,
          };
        } else {
          // Image is taller, fit to height
          return {
            width: this._height * aspectRatio,
            height: this._height,
          };
        }
      } else {
        // Stretch to exact dimensions
        return {
          width: this._width,
          height: this._height,
        };
      }
    } else if (this._width !== undefined) {
      // Calculate height from width and aspect ratio
      return {
        width: this._width,
        height: this._width / aspectRatio,
      };
    } else if (this._height !== undefined) {
      // Calculate width from height and aspect ratio
      return {
        width: this._height * aspectRatio,
        height: this._height,
      };
    } else {
      // Default: use natural dimensions scaled to reasonable scene units
      // Assume 100 pixels = 1 scene unit as a reasonable default
      const scale = 0.01;
      return {
        width: this._naturalWidth * scale,
        height: this._naturalHeight * scale,
      };
    }
  }

  /**
   * Apply image filters using canvas manipulation
   */
  private _applyFilters(): void {
    if (!this._texture || !this._texture.image) return;

    const { grayscale, invert, brightness, contrast } = this._filters;

    // Only process if filters are applied
    if (!grayscale && !invert && brightness === 1 && contrast === 1) {
      return;
    }

    const image = this._texture.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply filters to each pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply brightness
      if (brightness !== 1) {
        r *= brightness!;
        g *= brightness!;
        b *= brightness!;
      }

      // Apply contrast
      if (contrast !== 1) {
        r = ((r / 255 - 0.5) * contrast! + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrast! + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrast! + 0.5) * 255;
      }

      // Apply grayscale
      if (grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }

      // Apply invert
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    // Put modified data back
    ctx.putImageData(imageData, 0, 0);

    // Create new texture from canvas
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.colorSpace = THREE.SRGBColorSpace;

    // Dispose old texture and use new one
    if (this._texture) {
      this._texture.dispose();
    }
    this._texture = newTexture;
  }

  /**
   * Create the Three.js plane mesh with image texture
   */
  protected _createThreeObject(): THREE.Object3D {
    const dims = this._calculateDimensions();

    const geometry = new THREE.PlaneGeometry(dims.width, dims.height);

    const material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      opacity: this._opacity,
      side: this._doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  }

  /**
   * Update geometry when dimensions change
   */
  protected _updateGeometry(): void {
    if (!(this._threeObject instanceof THREE.Mesh)) return;

    const dims = this._calculateDimensions();

    // Dispose old geometry
    this._threeObject.geometry.dispose();

    // Create new geometry with correct dimensions
    this._threeObject.geometry = new THREE.PlaneGeometry(dims.width, dims.height);

    // Update material with texture
    const material = this._threeObject.material as THREE.MeshBasicMaterial;
    if (material && this._texture) {
      material.map = this._texture;
      material.needsUpdate = true;
    }

    this._markDirty();
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const material = this._threeObject.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        if (this._texture) {
          material.map = this._texture;
        }
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Get the image source
   */
  getSource(): string {
    return this._source;
  }

  /**
   * Set a new image source
   */
  setSource(source: string): this {
    this._source = source;
    this._imageLoaded = false;
    this._loadPromise = new Promise((resolve) => {
      this._loadResolve = resolve;
    });
    this._loadTexture();
    return this;
  }

  /**
   * Get the display width
   */
  getWidth(): number {
    return this._calculateDimensions().width;
  }

  /**
   * Set the display width (height will be calculated from aspect ratio)
   */
  setWidth(width: number): this {
    this._width = width;
    this._height = undefined;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the display height
   */
  getHeight(): number {
    return this._calculateDimensions().height;
  }

  /**
   * Set the display height (width will be calculated from aspect ratio)
   */
  setHeight(height: number): this {
    this._height = height;
    this._width = undefined;
    this._updateGeometry();
    return this;
  }

  /**
   * Set both width and height
   * @param width Display width
   * @param height Display height
   * @param scaleToFit If true, scale to fit preserving aspect ratio
   */
  setSize(width: number, height: number, scaleToFit: boolean = true): this {
    this._width = width;
    this._height = height;
    this._scaleToFit = scaleToFit;
    this._updateGeometry();
    return this;
  }

  /**
   * Scale the image to fit within a bounding box
   * @param maxWidth Maximum width
   * @param maxHeight Maximum height
   */
  scaleToFitBox(maxWidth: number, maxHeight: number): this {
    this._width = maxWidth;
    this._height = maxHeight;
    this._scaleToFit = true;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the current filter options
   */
  getFilters(): ImageFilterOptions {
    return { ...this._filters };
  }

  /**
   * Set filter options
   */
  setFilters(filters: Partial<ImageFilterOptions>): this {
    this._filters = { ...this._filters, ...filters };

    // Need to reload texture to apply filters
    if (this._imageLoaded) {
      this._loadTexture();
    }
    return this;
  }

  /**
   * Set grayscale filter
   */
  setGrayscale(enabled: boolean): this {
    return this.setFilters({ grayscale: enabled });
  }

  /**
   * Set invert filter
   */
  setInvert(enabled: boolean): this {
    return this.setFilters({ invert: enabled });
  }

  /**
   * Set brightness
   */
  setBrightness(value: number): this {
    return this.setFilters({ brightness: value });
  }

  /**
   * Set contrast
   */
  setContrast(value: number): this {
    return this.setFilters({ contrast: value });
  }

  /**
   * Get whether double-sided rendering is enabled
   */
  isDoubleSided(): boolean {
    return this._doubleSided;
  }

  /**
   * Set double-sided rendering
   */
  setDoubleSided(value: boolean): this {
    this._doubleSided = value;
    this._markDirty();
    return this;
  }

  /**
   * Get the natural (original) dimensions of the image
   */
  getNaturalSize(): { width: number; height: number } {
    return {
      width: this._naturalWidth,
      height: this._naturalHeight,
    };
  }

  /**
   * Get the aspect ratio of the image
   */
  getAspectRatio(): number {
    return this._naturalWidth / this._naturalHeight;
  }

  /**
   * Override getBoundingBox to use calculated dimensions
   */
  protected override _getBoundingBox(): { width: number; height: number; depth: number } {
    const dims = this._calculateDimensions();
    return {
      width: dims.width * this.scaleVector.x,
      height: dims.height * this.scaleVector.y,
      depth: 0.01, // Thin plane
    };
  }

  /**
   * Create a copy of this ImageMobject
   */
  protected override _createCopy(): ImageMobject {
    return new ImageMobject({
      source: this._source || undefined,
      pixelData: this._pixelData,
      width: this._width,
      height: this._height,
      scaleToFit: this._scaleToFit,
      center: this._centerPoint,
      opacity: this._opacity,
      filters: { ...this._filters },
      doubleSided: this._doubleSided,
    });
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    super.dispose();

    if (this._texture) {
      this._texture.dispose();
      this._texture = null;
    }
  }
}

export default ImageMobject;

/**
 * DecimalNumber - A text mobject that displays a number and can be animated
 *
 * This module provides number display capabilities with configurable decimal places,
 * sign display, and ellipsis support. Designed to work with ValueTracker for animations.
 */

import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a DecimalNumber mobject
 */
export interface DecimalNumberOptions {
  /** The numeric value to display. Default: 0 */
  value?: number;
  /** Number of decimal places to show. Default: 2 */
  numDecimalPlaces?: number;
  /** Whether to show ellipsis (...) after the number. Default: false */
  showEllipsis?: boolean;
  /** Whether to show + sign for positive numbers. Default: false */
  includeSign?: boolean;
  /** Group digits with separator (e.g., 1,000). Default: false */
  groupWithCommas?: boolean;
  /** Font size in pixels. Default: 48 */
  fontSize?: number;
  /** Font family. Default: 'monospace' */
  fontFamily?: string;
  /** Font weight. Default: 'normal' */
  fontWeight?: string | number;
  /** Text color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Edge to preserve when number width changes. Default: null (center) */
  edgeToFix?: 'left' | 'right' | null;
  /** Unit string to append (e.g., '%', 'm/s'). Default: '' */
  unit?: string;
  /** Buffer between number and unit. Default: 0.05 */
  unitBuff?: number;
}

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

/** Resolution multiplier for crisp text on retina displays */
const RESOLUTION_SCALE = 2;

/**
 * DecimalNumber - A text mobject that displays a configurable number
 *
 * The number can be animated by calling setValue() with new values,
 * or by using a ValueTracker with an updater function.
 *
 * @example
 * ```typescript
 * // Create a simple decimal number
 * const num = new DecimalNumber({ value: 3.14159 });
 *
 * // Create with custom formatting
 * const percentage = new DecimalNumber({
 *   value: 75.5,
 *   numDecimalPlaces: 1,
 *   includeSign: true,
 *   unit: '%'
 * });
 *
 * // Animate value change
 * num.setValue(42);
 * ```
 */
export class DecimalNumber extends VMobject {
  protected _value: number;
  protected _numDecimalPlaces: number;
  protected _showEllipsis: boolean;
  protected _includeSign: boolean;
  protected _groupWithCommas: boolean;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _fontWeight: string | number;
  protected _edgeToFix: 'left' | 'right' | null;
  protected _unit: string;
  protected _unitBuff: number;

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

  /** Previous edge position for edge-fixing */
  protected _previousEdgePosition: number | null = null;

  constructor(options: DecimalNumberOptions = {}) {
    super();

    const {
      value = 0,
      numDecimalPlaces = 2,
      showEllipsis = false,
      includeSign = false,
      groupWithCommas = false,
      fontSize = 48,
      fontFamily = 'monospace',
      fontWeight = 'normal',
      color = '#ffffff',
      fillOpacity = 1,
      edgeToFix = null,
      unit = '',
      unitBuff = 0.05,
    } = options;

    this._value = value;
    this._numDecimalPlaces = numDecimalPlaces;
    this._showEllipsis = showEllipsis;
    this._includeSign = includeSign;
    this._groupWithCommas = groupWithCommas;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._fontWeight = fontWeight;
    this._edgeToFix = edgeToFix;
    this._unit = unit;
    this._unitBuff = unitBuff;

    this.color = color;
    this.fillOpacity = fillOpacity;

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
      throw new Error('Failed to get 2D context for DecimalNumber rendering');
    }
  }

  /**
   * Get the current numeric value
   */
  getValue(): number {
    return this._value;
  }

  /**
   * Set the numeric value and update display
   * @param value - New value to display
   * @returns this for chaining
   */
  setValue(value: number): this {
    const oldWidth = this._worldWidth;
    const oldEdgeX = this._getEdgeX();

    this._value = value;
    this._renderToCanvas();
    this._updateMesh();

    // Fix edge position if requested
    if (this._edgeToFix && oldWidth > 0) {
      const newEdgeX = this._getEdgeX();
      const drift = oldEdgeX - newEdgeX;
      this.position.x += drift;
    }

    this._markDirty();
    return this;
  }

  /**
   * Get the X position of the edge being fixed
   */
  protected _getEdgeX(): number {
    if (this._edgeToFix === 'left') {
      return this.position.x - this._worldWidth / 2;
    } else if (this._edgeToFix === 'right') {
      return this.position.x + this._worldWidth / 2;
    }
    return this.position.x;
  }

  /**
   * Get the number of decimal places
   */
  getNumDecimalPlaces(): number {
    return this._numDecimalPlaces;
  }

  /**
   * Set the number of decimal places
   * @param places - Number of decimal places
   * @returns this for chaining
   */
  setNumDecimalPlaces(places: number): this {
    this._numDecimalPlaces = Math.max(0, Math.floor(places));
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the font size
   */
  getFontSize(): number {
    return this._fontSize;
  }

  /**
   * Set the font size
   * @param size - Font size in pixels
   * @returns this for chaining
   */
  setFontSize(size: number): this {
    this._fontSize = size;
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Format the number as a string
   */
  protected _formatNumber(): string {
    let str: string;

    if (this._numDecimalPlaces >= 0) {
      str = this._value.toFixed(this._numDecimalPlaces);
    } else {
      str = this._value.toString();
    }

    // Add sign for positive numbers if requested
    if (this._includeSign && this._value > 0) {
      str = '+' + str;
    }

    // Group with commas if requested
    if (this._groupWithCommas) {
      const parts = str.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      str = parts.join('.');
    }

    // Add unit
    if (this._unit) {
      str += this._unit;
    }

    // Add ellipsis if requested
    if (this._showEllipsis) {
      str += '...';
    }

    return str;
  }

  /**
   * Build the CSS font string
   */
  protected _buildFontString(): string {
    const weight =
      typeof this._fontWeight === 'number' ? this._fontWeight.toString() : this._fontWeight;
    const size = Math.round(this._fontSize * RESOLUTION_SCALE);
    return `${weight} ${size}px ${this._fontFamily}`;
  }

  /**
   * Measure text dimensions
   */
  protected _measureText(): { text: string; width: number; height: number } {
    if (!this._ctx) {
      return { text: '', width: 0, height: 0 };
    }

    this._ctx.font = this._buildFontString();
    const text = this._formatNumber();
    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;

    const metrics = this._ctx.measureText(text);
    const width = Math.ceil(metrics.width);
    const height = Math.ceil(scaledFontSize * 1.2);

    // Add padding
    const padding = scaledFontSize * 0.2;
    return {
      text,
      width: width + padding * 2,
      height: height + padding * 2,
    };
  }

  /**
   * Render text to the off-screen canvas
   */
  protected _renderToCanvas(): void {
    if (!this._canvas || !this._ctx) {
      return;
    }

    const { text, width, height } = this._measureText();

    // Resize canvas
    this._canvas.width = width || 1;
    this._canvas.height = height || 1;

    // Clear canvas (transparent background)
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Set font and styles
    this._ctx.font = this._buildFontString();
    this._ctx.textBaseline = 'middle';
    this._ctx.textAlign = 'center';

    // Draw fill
    this._ctx.fillStyle = this.color;
    this._ctx.globalAlpha = this.fillOpacity * this._opacity;
    this._ctx.fillText(text, width / 2, height / 2);

    // Store world dimensions
    this._worldWidth = (width / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    this._worldHeight = (height / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    // Update texture if it exists
    if (this._texture) {
      this._texture.needsUpdate = true;
    }
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
   * Get the center of this DecimalNumber
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
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
   * Create a copy of this DecimalNumber
   */
  protected override _createCopy(): DecimalNumber {
    const copy = new DecimalNumber({
      value: this._value,
      numDecimalPlaces: this._numDecimalPlaces,
      showEllipsis: this._showEllipsis,
      includeSign: this._includeSign,
      groupWithCommas: this._groupWithCommas,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      color: this.color,
      fillOpacity: this.fillOpacity,
      edgeToFix: this._edgeToFix,
      unit: this._unit,
      unitBuff: this._unitBuff,
    });
    return copy;
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

/**
 * Integer - A DecimalNumber with zero decimal places
 *
 * Convenience class for displaying integers without decimal points.
 *
 * @example
 * ```typescript
 * const count = new Integer({ value: 42 });
 * count.setValue(100);
 * ```
 */
export class Integer extends DecimalNumber {
  constructor(options: Omit<DecimalNumberOptions, 'numDecimalPlaces'> = {}) {
    super({
      ...options,
      numDecimalPlaces: 0,
    });
  }

  /**
   * Create a copy of this Integer
   */
  protected override _createCopy(): Integer {
    return new Integer({
      value: this._value,
      showEllipsis: this._showEllipsis,
      includeSign: this._includeSign,
      groupWithCommas: this._groupWithCommas,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      fontWeight: this._fontWeight,
      color: this.color,
      fillOpacity: this.fillOpacity,
      edgeToFix: this._edgeToFix,
      unit: this._unit,
      unitBuff: this._unitBuff,
    });
  }
}

export default DecimalNumber;

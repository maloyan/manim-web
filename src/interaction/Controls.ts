/**
 * Controls - UI overlay for interactive scene manipulation.
 * Provides sliders, buttons, checkboxes, and color pickers for real-time parameter control.
 */

import { Scene } from '../core/Scene';

/**
 * Position options for the controls panel.
 */
export type ControlsPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Theme options for the controls panel.
 */
export type ControlsTheme = 'dark' | 'light';

/**
 * Options for configuring the Controls panel.
 */
export interface ControlsOptions {
  /** Position of the controls panel. Defaults to 'top-right'. */
  position?: ControlsPosition;
  /** Color theme. Defaults to 'dark'. */
  theme?: ControlsTheme;
  /** Panel width in pixels. Defaults to 250. */
  width?: number;
}

/**
 * Configuration for a slider control.
 */
export interface SliderConfig {
  /** Label text displayed above the slider. */
  label: string;
  /** Minimum value. */
  min: number;
  /** Maximum value. */
  max: number;
  /** Initial value. Defaults to min. */
  value?: number;
  /** Step increment. Defaults to (max-min)/100. */
  step?: number;
  /** Callback when value changes. */
  onChange: (value: number) => void;
}

/**
 * Configuration for a button control.
 */
export interface ButtonConfig {
  /** Button label text. */
  label: string;
  /** Callback when button is clicked. */
  onClick: () => void;
}

/**
 * Configuration for a checkbox control.
 */
export interface CheckboxConfig {
  /** Label text displayed next to the checkbox. */
  label: string;
  /** Initial checked state. Defaults to false. */
  checked?: boolean;
  /** Callback when checked state changes. */
  onChange: (checked: boolean) => void;
}

/**
 * Configuration for a color picker control.
 */
export interface ColorPickerConfig {
  /** Label text displayed above the color picker. */
  label: string;
  /** Initial color value. Defaults to '#ffffff'. */
  value?: string;
  /** Callback when color changes. */
  onChange: (color: string) => void;
}

/**
 * Controls panel for interactive scene manipulation.
 * Creates a DOM-based UI overlay positioned over the scene canvas.
 */
export class Controls {
  protected _scene: Scene;
  protected _panel: HTMLElement;
  protected _options: Required<ControlsOptions>;

  /**
   * Create a new Controls panel.
   * @param scene - The scene to attach controls to
   * @param options - Configuration options
   */
  constructor(scene: Scene, options: ControlsOptions = {}) {
    this._scene = scene;
    this._options = {
      position: options.position ?? 'top-right',
      theme: options.theme ?? 'dark',
      width: options.width ?? 250,
    };
    this._panel = this._createPanel();
  }

  /**
   * Get the underlying HTML panel element.
   */
  get panel(): HTMLElement {
    return this._panel;
  }

  /**
   * Get the scene this controls panel is attached to.
   */
  get scene(): Scene {
    return this._scene;
  }

  /**
   * Create the controls panel and attach it to the scene container.
   */
  private _createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'manimweb-controls';
    panel.style.cssText = `
      position: absolute;
      ${this._getPositionStyles()}
      width: ${this._options.width}px;
      max-height: calc(100% - 24px);
      overflow-y: auto;
      padding: 12px;
      background: ${this._options.theme === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'};
      color: ${this._options.theme === 'dark' ? '#ffffff' : '#000000'};
      border-radius: 8px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      z-index: 1000;
      box-sizing: border-box;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      user-select: none;
      -webkit-user-select: none;
    `;

    // Get the scene's container and ensure it has relative positioning
    const container = this._scene.getContainer();
    container.style.position = 'relative';
    container.appendChild(panel);

    return panel;
  }

  /**
   * Get CSS position styles based on the configured position.
   */
  private _getPositionStyles(): string {
    const margin = '12px';
    switch (this._options.position) {
      case 'top-left':
        return `top: ${margin}; left: ${margin};`;
      case 'top-right':
        return `top: ${margin}; right: ${margin};`;
      case 'bottom-left':
        return `bottom: ${margin}; left: ${margin};`;
      case 'bottom-right':
        return `bottom: ${margin}; right: ${margin};`;
      default:
        return `top: ${margin}; right: ${margin};`;
    }
  }

  /**
   * Get the accent color based on theme.
   */
  protected _getAccentColor(): string {
    return this._options.theme === 'dark' ? '#4a90d9' : '#3b7fc4';
  }

  /**
   * Get the hover color based on theme.
   */
  protected _getHoverColor(): string {
    return this._options.theme === 'dark' ? '#5a9fe9' : '#4b8fd4';
  }

  /**
   * Get the border color based on theme.
   */
  protected _getBorderColor(): string {
    return this._options.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  }

  /**
   * Add a slider control.
   * @param config - Slider configuration
   * @returns The created wrapper element
   */
  addSlider(config: SliderConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 12px;';

    // Create label row with value display
    const labelRow = document.createElement('label');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      cursor: default;
    `;

    const labelText = document.createElement('span');
    labelText.textContent = config.label;
    labelText.style.cssText = 'font-weight: 500;';

    const initialValue = config.value ?? config.min;
    const valueText = document.createElement('span');
    valueText.textContent = this._formatNumber(initialValue);
    valueText.style.cssText = `
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 12px;
      opacity: 0.8;
    `;

    labelRow.appendChild(labelText);
    labelRow.appendChild(valueText);

    // Create slider input
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(config.min);
    slider.max = String(config.max);
    slider.step = String(config.step ?? (config.max - config.min) / 100);
    slider.value = String(initialValue);
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      appearance: none;
      -webkit-appearance: none;
      background: ${this._getBorderColor()};
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    `;

    // Add touch-friendly styling
    this._styleSliderThumb(slider);

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      valueText.textContent = this._formatNumber(val);
      config.onChange(val);
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(slider);
    this._panel.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Style the slider thumb for cross-browser compatibility.
   */
  private _styleSliderThumb(_slider: HTMLInputElement): void {
    const accentColor = this._getAccentColor();

    // Create a style element for pseudo-elements
    const styleId = 'manimweb-slider-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .manimweb-controls input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: ${accentColor};
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        .manimweb-controls input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: ${accentColor};
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        .manimweb-controls input[type="range"]:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.3);
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Format a number for display.
   */
  private _formatNumber(value: number): string {
    // Show integers without decimals, otherwise show 2 decimal places
    if (Number.isInteger(value)) {
      return String(value);
    }
    return value.toFixed(2);
  }

  /**
   * Add a button control.
   * @param config - Button configuration
   * @returns The created button element
   */
  addButton(config: ButtonConfig): HTMLElement {
    const button = document.createElement('button');
    button.textContent = config.label;

    const accentColor = this._getAccentColor();
    const hoverColor = this._getHoverColor();

    button.style.cssText = `
      width: 100%;
      padding: 10px 16px;
      margin-bottom: 8px;
      border: none;
      border-radius: 6px;
      background: ${accentColor};
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: background-color 0.15s ease, transform 0.1s ease;
      outline: none;
      touch-action: manipulation;
    `;

    // Add hover and active states
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = accentColor;
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.98)';
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1)';
    });
    button.addEventListener('click', config.onClick);

    this._panel.appendChild(button);
    return button;
  }

  /**
   * Add a checkbox control.
   * @param config - Checkbox configuration
   * @returns The created wrapper element
   */
  addCheckbox(config: CheckboxConfig): HTMLElement {
    const wrapper = document.createElement('label');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      padding: 4px 0;
    `;

    // Create custom checkbox container
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.style.cssText = `
      position: relative;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    `;

    // Hidden actual checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = config.checked ?? false;
    checkbox.style.cssText = `
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
    `;

    // Custom checkbox visual
    const customCheckbox = document.createElement('div');
    const accentColor = this._getAccentColor();
    const updateCheckboxStyle = () => {
      customCheckbox.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 4px;
        border: 2px solid ${checkbox.checked ? accentColor : this._getBorderColor()};
        background: ${checkbox.checked ? accentColor : 'transparent'};
        transition: all 0.15s ease;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      customCheckbox.innerHTML = checkbox.checked
        ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '';
    };
    updateCheckboxStyle();

    checkbox.addEventListener('change', () => {
      updateCheckboxStyle();
      config.onChange(checkbox.checked);
    });

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(customCheckbox);

    const labelText = document.createElement('span');
    labelText.textContent = config.label;
    labelText.style.cssText = 'font-weight: 500;';

    wrapper.appendChild(checkboxWrapper);
    wrapper.appendChild(labelText);
    this._panel.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Add a color picker control.
   * @param config - Color picker configuration
   * @returns The created wrapper element
   */
  addColorPicker(config: ColorPickerConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 12px;';

    // Create label row
    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    `;

    const labelText = document.createElement('span');
    labelText.textContent = config.label;
    labelText.style.cssText = 'font-weight: 500;';

    const initialColor = config.value ?? '#ffffff';
    const colorValue = document.createElement('span');
    colorValue.textContent = initialColor.toUpperCase();
    colorValue.style.cssText = `
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 12px;
      opacity: 0.8;
    `;

    labelRow.appendChild(labelText);
    labelRow.appendChild(colorValue);

    // Create color picker row
    const pickerRow = document.createElement('div');
    pickerRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = initialColor;
    colorInput.style.cssText = `
      width: 40px;
      height: 32px;
      padding: 0;
      border: 2px solid ${this._getBorderColor()};
      border-radius: 6px;
      cursor: pointer;
      background: transparent;
    `;

    // Text input for hex value
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = initialColor;
    textInput.style.cssText = `
      flex: 1;
      padding: 6px 10px;
      border: 2px solid ${this._getBorderColor()};
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 13px;
      outline: none;
    `;

    textInput.addEventListener('focus', () => {
      textInput.style.borderColor = this._getAccentColor();
    });
    textInput.addEventListener('blur', () => {
      textInput.style.borderColor = this._getBorderColor();
    });

    // Sync color and text inputs
    colorInput.addEventListener('input', () => {
      const color = colorInput.value;
      textInput.value = color;
      colorValue.textContent = color.toUpperCase();
      config.onChange(color);
    });

    textInput.addEventListener('input', () => {
      const color = textInput.value;
      // Validate hex color
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        colorInput.value = color;
        colorValue.textContent = color.toUpperCase();
        config.onChange(color);
      }
    });

    pickerRow.appendChild(colorInput);
    pickerRow.appendChild(textInput);

    wrapper.appendChild(labelRow);
    wrapper.appendChild(pickerRow);
    this._panel.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Add a horizontal separator line.
   */
  addSeparator(): void {
    const hr = document.createElement('hr');
    hr.style.cssText = `
      border: none;
      border-top: 1px solid ${this._getBorderColor()};
      margin: 14px 0;
    `;
    this._panel.appendChild(hr);
  }

  /**
   * Add a section label.
   * @param text - Label text
   * @returns The created label element
   */
  addLabel(text: string): HTMLElement {
    const label = document.createElement('div');
    label.textContent = text;
    label.style.cssText = `
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
      margin-bottom: 10px;
      margin-top: 4px;
    `;
    this._panel.appendChild(label);
    return label;
  }

  /**
   * Show the controls panel.
   */
  show(): void {
    this._panel.style.display = 'block';
  }

  /**
   * Hide the controls panel.
   */
  hide(): void {
    this._panel.style.display = 'none';
  }

  /**
   * Toggle the controls panel visibility.
   */
  toggle(): void {
    if (this._panel.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Check if the controls panel is visible.
   */
  isVisible(): boolean {
    return this._panel.style.display !== 'none';
  }

  /**
   * Clean up and remove the controls panel from the DOM.
   */
  dispose(): void {
    this._panel.remove();
  }
}

/**
 * Port of ManimCE `Label` (`manim/mobject/geometry/labeled.py`, 0.22.0).
 *
 * A `Label` is text wrapped in a frame. It is a `VGroup` with three children,
 * in this order: a background rectangle, the rendered label, and a frame
 * rectangle around the label.
 *
 * ManimCE renders a `str` label as `MathTex`. This port renders a `str` label
 * as `Text`, which needs no LaTeX toolchain. Pass a prebuilt mobject (for
 * example `MathTex`) to control the rendering.
 */

import { Mobject } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { WHITE } from '../../constants';
import { Text, type TextOptions } from '../text/Text';
import {
  BackgroundRectangle,
  SurroundingRectangle,
  type BackgroundRectangleOptions,
  type SurroundingRectangleOptions,
} from './ShapeMatchers';

/** Options for creating a `Label`. */
export interface LabelOptions {
  /** Config for the rendered label. Applied only when `label` is a string. */
  labelConfig?: Partial<TextOptions>;
  /** Config for the background box behind the label. */
  boxConfig?: BackgroundRectangleOptions;
  /** Config for the frame around the label. */
  frameConfig?: SurroundingRectangleOptions;
}

/**
 * Text surrounded by a frame.
 *
 * @example
 * ```typescript
 * const label = new Label('Hello', { boxConfig: { color: '#58C4DD' } });
 * scene.add(label);
 * ```
 */
export class Label extends VGroup {
  /** The rendered label mobject. */
  readonly renderedLabel: Mobject;
  /** The filled background rectangle behind the label. */
  readonly backgroundRect: BackgroundRectangle;
  /** The frame rectangle around the label. */
  readonly frame: SurroundingRectangle;

  constructor(label: string | Mobject, options: LabelOptions = {}) {
    super();

    const boxConfig: BackgroundRectangleOptions = {
      buff: 0.05,
      fillOpacity: 1,
      strokeWidth: 0.5,
      ...options.boxConfig,
    };
    const frameConfig: SurroundingRectangleOptions = {
      color: WHITE,
      buff: 0.05,
      strokeWidth: 0.5,
      ...options.frameConfig,
    };

    this.renderedLabel =
      typeof label === 'string' ? new Text({ text: label, ...options.labelConfig }) : label;
    this.backgroundRect = new BackgroundRectangle(this.renderedLabel, boxConfig);
    this.frame = new SurroundingRectangle(this.renderedLabel, frameConfig);

    this.add(this.backgroundRect, this.renderedLabel, this.frame);
  }
}

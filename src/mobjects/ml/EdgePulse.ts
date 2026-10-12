/**
 * EdgePulse - animates one connection line as a signal flows through it.
 *
 * At alpha 0 the line sits at its resting opacity and color; at alpha 1 it is
 * fully lit in the activation color. By default the line stays lit (a forward
 * signal that propagates), which makes a staggered group read as a wave moving
 * through the network. Set `restore` to fade back to the resting look.
 */

import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../../animation/Animation';
import { thereAndBack } from '../../rate-functions';
import { DEFAULT_ACTIVATION_COLOR } from './mlStyles';

export interface EdgePulseOptions extends AnimationOptions {
  /** Color the line takes when fully active. Default: white. */
  activationColor?: string;
  /** Peak stroke opacity at full activation. Default: 1. */
  peakOpacity?: number;
  /** When true, the line fades back to its resting look at alpha 1. Default: false. */
  restore?: boolean;
}

export class EdgePulse extends Animation {
  /** The activation level set on the most recent interpolate call, 0 to 1. */
  activation: number = 0;

  private readonly _activationColor: string;
  private readonly _peakOpacity: number;
  private readonly _restore: boolean;
  private _baseOpacity: number = 1;
  private _baseColor: string = '';

  constructor(line: VMobject, options: EdgePulseOptions = {}) {
    super(line, {
      duration: options.duration ?? 1,
      // A restoring pulse goes up then down; a flowing one just ramps up.
      rateFunc: options.rateFunc ?? (options.restore ? thereAndBack : undefined),
    });
    this._activationColor = options.activationColor ?? DEFAULT_ACTIVATION_COLOR;
    this._peakOpacity = options.peakOpacity ?? 1;
    this._restore = options.restore ?? false;
  }

  override begin(): void {
    super.begin();
    this._baseOpacity = this.mobject.opacity;
    this._baseColor = this.mobject.color;
    this.activation = 0;
  }

  interpolate(alpha: number): void {
    this.activation = alpha;
    const opacity = this._baseOpacity + (this._peakOpacity - this._baseOpacity) * alpha;
    this.mobject.setStrokeOpacity(opacity);

    const base = new THREE.Color(this._baseColor);
    const target = new THREE.Color(this._activationColor);
    const lerped = base.clone().lerp(target, alpha);
    this.mobject.setColor('#' + lerped.getHexString());
    this.mobject._markDirty();
  }

  override finish(): void {
    if (this._restore) {
      this.mobject.setStrokeOpacity(this._baseOpacity);
      this.mobject.setColor(this._baseColor);
      this.activation = 0;
    } else {
      this.activation = 1;
    }
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create an EdgePulse animation for one connection line.
 * @param line - The connection line to animate.
 * @param options - Activation color, peak opacity, restore and timing options.
 */
export function edgePulse(line: VMobject, options?: EdgePulseOptions): EdgePulse {
  return new EdgePulse(line, options);
}

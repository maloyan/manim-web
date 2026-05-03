import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';

export interface MorphStrategy {
  begin(animation: Animation, source: Mobject, target: Mobject): void;
  interpolate(animation: Animation, source: Mobject, target: Mobject, alpha: number): void;
  finish(animation: Animation, source: Mobject, target: Mobject): void;
}

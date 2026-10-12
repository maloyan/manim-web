/**
 * forwardPass / backwardPass - animate a signal propagating through a network.
 *
 * A forward pass lights the connection lines gap by gap, from the input layer
 * to the output layer, as a staggered LaggedStart of per-gap pulses. A backward
 * pass does the same in reverse. Both reuse the existing AnimationGroup and
 * LaggedStart composition and the per-line EdgePulse.
 */

import { Animation } from '../../animation/Animation';
import { AnimationGroup } from '../../animation/AnimationGroup';
import { LaggedStart } from '../../animation/LaggedStart';
import { Line } from '../geometry/Line';
import { NeuralNetwork } from './NeuralNetwork';
import { EdgePulse, EdgePulseOptions } from './EdgePulse';

export interface ForwardPassOptions extends EdgePulseOptions {
  /**
   * Overlap between consecutive gaps. 1 is strictly sequential (one gap fully
   * lit before the next starts), 0 is all gaps at once. Default: 1.
   */
  lagRatio?: number;
  /** Duration of each gap's pulse in seconds. Default: 1. */
  gapDuration?: number;
}

/**
 * Build the per-gap pulse groups for a network, optionally reversed.
 * @param network - The network whose connection stages to animate.
 * @param reverse - When true, order gaps from output to input.
 * @param options - Pulse and timing options.
 * @returns One AnimationGroup per connection stage, in play order.
 */
function buildStageAnimations(
  network: NeuralNetwork,
  reverse: boolean,
  options: ForwardPassOptions,
): AnimationGroup[] {
  const stages = network.getConnectionStages();
  const ordered = reverse ? [...stages].reverse() : stages;
  const pulseOptions: EdgePulseOptions = {
    duration: options.gapDuration ?? 1,
    activationColor: options.activationColor,
    peakOpacity: options.peakOpacity,
    restore: options.restore,
    rateFunc: options.rateFunc,
  };
  return ordered.map((stage) => {
    const pulses = stage.map((line: Line) => new EdgePulse(line, pulseOptions));
    // lagRatio 0: every line in a gap pulses together.
    return new AnimationGroup(pulses, { lagRatio: 0 });
  });
}

/**
 * Animate a forward pass: light each gap's connections from input to output.
 * @param network - The network to animate.
 * @param options - Pulse color/opacity, lagRatio and per-gap duration.
 * @returns A LaggedStart over the gaps (an empty, zero-duration one for a
 *          network with fewer than two layers).
 */
export function forwardPass(network: NeuralNetwork, options: ForwardPassOptions = {}): Animation {
  const stageAnimations = buildStageAnimations(network, false, options);
  return new LaggedStart(stageAnimations, { lagRatio: options.lagRatio ?? 1 });
}

/**
 * Animate a backward pass: light each gap's connections from output to input.
 * @param network - The network to animate.
 * @param options - Pulse color/opacity, lagRatio and per-gap duration.
 * @returns A LaggedStart over the gaps in reverse order.
 */
export function backwardPass(network: NeuralNetwork, options: ForwardPassOptions = {}): Animation {
  const stageAnimations = buildStageAnimations(network, true, options);
  return new LaggedStart(stageAnimations, { lagRatio: options.lagRatio ?? 1 });
}

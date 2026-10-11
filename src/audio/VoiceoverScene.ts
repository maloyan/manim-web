/**
 * VoiceoverScene - a Scene with built-in narration.
 *
 * This mirrors the ManimCE `VoiceoverScene` helper. It is a thin
 * Scene subclass that owns a {@link Voiceover} and wires the pre-recorded path
 * to the scene's own {@link AudioManager}, so narration syncs with the scene
 * timeline without any extra setup.
 *
 * ```ts
 * const scene = new VoiceoverScene(container);
 * await scene.voiceover('Here <bookmark mark="a"/> we go.', async (tracker) => {
 *   await scene.play(create(circle));
 *   await tracker.waitForMark('a');
 *   await scene.play(fadeIn(label));
 * });
 * ```
 */

import { Scene, type SceneOptions } from '../core/Scene';
import {
  Voiceover,
  type VoiceoverCallback,
  type VoiceoverOptions,
  type VoiceoverAudioOptions,
  type VoiceoverTracker,
} from './Voiceover';

/** Options for a {@link VoiceoverScene}. */
export interface VoiceoverSceneOptions extends SceneOptions {
  /** Default narration options (voice, rate, injected synthesizer, ...). */
  voiceover?: VoiceoverOptions;
}

/** A pre-recorded voiceover on a scene; the scene supplies the scheduler. */
export type VoiceoverSceneAudioOptions = Omit<VoiceoverAudioOptions, 'audioManager'>;

/**
 * A {@link Scene} that can narrate itself with synced animations.
 */
export class VoiceoverScene extends Scene {
  /** The narrator bound to this scene. */
  readonly narrator: Voiceover;

  constructor(container: HTMLElement | null, options: VoiceoverSceneOptions = {}) {
    super(container, options);
    this.narrator = new Voiceover(options.voiceover);
  }

  /**
   * Speak `text` (Web Speech) and run `callback` while it plays.
   * Resolves after the narration finishes.
   */
  async voiceover(
    text: string,
    callback?: VoiceoverCallback,
    options?: VoiceoverOptions,
  ): Promise<VoiceoverTracker> {
    return this.narrator.voiceover(text, callback, options);
  }

  /**
   * Play a pre-recorded narration clip through this scene's audio manager and
   * run `callback` while it plays.
   */
  async voiceoverAudio(
    options: VoiceoverSceneAudioOptions,
    callback?: VoiceoverCallback,
  ): Promise<VoiceoverTracker> {
    return this.narrator.voiceoverAudio({ ...options, audioManager: this.audioManager }, callback);
  }
}

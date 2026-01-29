import {
  ref,
  shallowRef,
  watch,
  onMounted,
  onUnmounted,
  provide,
  inject,
  h,
  defineComponent,
  type Ref,
  type PropType,
} from 'vue';
import { Scene, type SceneOptions } from '../core/Scene';
import { Mobject, type UpdaterFunction } from '../core/Mobject';
import { Animation } from '../animation/Animation';

// Re-export everything from main library for convenience
export * from '../index';

/**
 * Composable to create and manage a ManimWeb scene.
 * Creates a Scene instance when the container element is mounted.
 *
 * @param containerRef - A Vue ref to the container HTMLElement
 * @param options - Optional SceneOptions for configuring the scene
 * @returns An object with the scene ref and isReady flag
 *
 * @example
 * ```typescript
 * const containerRef = ref<HTMLElement | null>(null);
 * const { scene, isReady } = useScene(containerRef, { backgroundColor: '#1a1a2e' });
 * ```
 */
export function useScene(
  containerRef: Ref<HTMLElement | null>,
  options?: SceneOptions
) {
  const scene = shallowRef<Scene | null>(null);
  const isReady = ref(false);

  onMounted(() => {
    if (!containerRef.value) return;

    scene.value = new Scene(containerRef.value, options);
    isReady.value = true;
  });

  onUnmounted(() => {
    if (scene.value) {
      scene.value.dispose();
      scene.value = null;
      isReady.value = false;
    }
  });

  // Watch for container changes (e.g., when using v-if)
  watch(containerRef, (newContainer, oldContainer) => {
    if (oldContainer && scene.value) {
      scene.value.dispose();
      scene.value = null;
      isReady.value = false;
    }
    if (newContainer) {
      scene.value = new Scene(newContainer, options);
      isReady.value = true;
    }
  });

  return {
    scene,
    isReady,
  };
}

/**
 * Composable to manage a mobject within a scene.
 * Automatically adds the mobject to the scene when the scene is ready,
 * and removes it when unmounted.
 *
 * @param scene - A Vue ref to the Scene (from useScene)
 * @param createMobject - Factory function to create the mobject
 * @returns A shallow ref to the mobject
 *
 * @example
 * ```typescript
 * const { scene } = useScene(containerRef);
 * const circle = useMobject(scene, () => new Circle({ radius: 1 }));
 * ```
 */
export function useMobject<T extends Mobject>(
  scene: Ref<Scene | null>,
  createMobject: () => T
): Ref<T | null> {
  const mobject = shallowRef<T | null>(null);

  watch(
    scene,
    (newScene, oldScene) => {
      // Remove from old scene
      if (oldScene && mobject.value) {
        oldScene.remove(mobject.value);
      }

      // Add to new scene
      if (newScene) {
        if (!mobject.value) {
          mobject.value = createMobject();
        }
        newScene.add(mobject.value);
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (scene.value && mobject.value) {
      scene.value.remove(mobject.value);
    }
    mobject.value = null;
  });

  return mobject as Ref<T | null>;
}

/**
 * Composable for playing animations on a scene.
 * Provides convenient wrappers around Scene.play() and Scene.playAll().
 *
 * @param scene - A Vue ref to the Scene (from useScene)
 * @returns An object with play, playAll, and isPlaying
 *
 * @example
 * ```typescript
 * const { scene } = useScene(containerRef);
 * const { play, playAll, isPlaying } = useAnimation(scene);
 *
 * // Play animations sequentially
 * await play(new FadeIn(circle), new FadeOut(square));
 *
 * // Play animations in parallel
 * await playAll(new FadeIn(circle), new FadeIn(square));
 * ```
 */
export function useAnimation(scene: Ref<Scene | null>) {
  const isPlaying = ref(false);

  /**
   * Play animations sequentially (one after another).
   * @param animations - Animations to play in sequence
   */
  const play = async (...animations: Animation[]): Promise<void> => {
    if (!scene.value) return;
    isPlaying.value = true;
    try {
      await scene.value.play(...animations);
    } finally {
      isPlaying.value = false;
    }
  };

  /**
   * Play animations in parallel (all at once).
   * @param animations - Animations to play simultaneously
   */
  const playAll = async (...animations: Animation[]): Promise<void> => {
    if (!scene.value) return;
    isPlaying.value = true;
    try {
      await scene.value.playAll(...animations);
    } finally {
      isPlaying.value = false;
    }
  };

  return {
    play,
    playAll,
    isPlaying,
  };
}

/**
 * Composable to attach an updater function to a mobject.
 * The updater is automatically added when the mobject is available
 * and removed when the component unmounts.
 *
 * @param mobject - A Vue ref to the Mobject (from useMobject)
 * @param updater - Function called every frame with (mobject, dt)
 *
 * @example
 * ```typescript
 * const circle = useMobject(scene, () => new Circle({ radius: 1 }));
 *
 * useUpdater(circle, (m, dt) => {
 *   m.rotate(dt); // Rotate the circle over time
 * });
 * ```
 */
export function useUpdater(
  mobject: Ref<Mobject | null>,
  updater: UpdaterFunction
): void {
  watch(
    mobject,
    (newMobject, oldMobject) => {
      if (oldMobject) {
        oldMobject.removeUpdater(updater);
      }
      if (newMobject) {
        newMobject.addUpdater(updater);
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (mobject.value) {
      mobject.value.removeUpdater(updater);
    }
  });
}

// Injection key for providing scene to child components
const MANIMWEB_SCENE_KEY = Symbol('manimweb-scene');

/**
 * ManimScene component.
 * A wrapper component that creates a Scene and provides it to child components.
 *
 * @example
 * ```vue
 * <template>
 *   <ManimScene
 *     :width="800"
 *     :height="450"
 *     background-color="#1a1a2e"
 *     @ready="onSceneReady"
 *   />
 * </template>
 *
 * <script setup>
 * import { ManimScene, Circle, FadeIn } from 'manimweb/vue';
 *
 * const onSceneReady = async (scene) => {
 *   const circle = new Circle({ radius: 1, color: '#ff0000' });
 *   scene.add(circle);
 *   await scene.play(new FadeIn(circle));
 * };
 * </script>
 * ```
 */
export const ManimScene = defineComponent({
  name: 'ManimScene',

  props: {
    /**
     * Canvas width in pixels.
     * @default 800
     */
    width: {
      type: Number as PropType<number>,
      default: 800,
    },
    /**
     * Canvas height in pixels.
     * @default 450
     */
    height: {
      type: Number as PropType<number>,
      default: 450,
    },
    /**
     * Background color as CSS color string.
     * @default '#1a1a2e'
     */
    backgroundColor: {
      type: String as PropType<string>,
      default: '#1a1a2e',
    },
    /**
     * Frame width in world units (Manim standard is 14).
     * @default 14
     */
    frameWidth: {
      type: Number as PropType<number>,
      default: 14,
    },
    /**
     * Frame height in world units (Manim standard is 8).
     * @default 8
     */
    frameHeight: {
      type: Number as PropType<number>,
      default: 8,
    },
  },

  emits: {
    /**
     * Emitted when the scene is ready to use.
     * @param scene - The Scene instance
     */
    ready: (scene: Scene) => scene instanceof Scene,
  },

  setup(props, { emit, slots }) {
    const containerRef = ref<HTMLElement | null>(null);

    const { scene, isReady } = useScene(containerRef, {
      width: props.width,
      height: props.height,
      backgroundColor: props.backgroundColor,
      frameWidth: props.frameWidth,
      frameHeight: props.frameHeight,
    });

    // Emit ready event when scene becomes available
    watch(isReady, (ready) => {
      if (ready && scene.value) {
        emit('ready', scene.value);
      }
    });

    // Provide scene to child components
    provide(MANIMWEB_SCENE_KEY, scene);

    return () =>
      h(
        'div',
        {
          ref: containerRef,
          style: {
            width: `${props.width}px`,
            height: `${props.height}px`,
            position: 'relative',
          },
        },
        slots.default?.()
      );
  },
});

/**
 * Composable to inject the scene from a parent ManimScene component.
 * Use this in child components that need access to the scene.
 *
 * @returns A Vue ref to the Scene (may be null if no parent ManimScene)
 *
 * @example
 * ```vue
 * <script setup>
 * import { useInjectedScene, Circle, FadeIn } from 'manimweb/vue';
 *
 * const scene = useInjectedScene();
 *
 * // Use the scene when it becomes available
 * watch(scene, async (s) => {
 *   if (!s) return;
 *   const circle = new Circle({ radius: 1 });
 *   s.add(circle);
 *   await s.play(new FadeIn(circle));
 * });
 * </script>
 * ```
 */
export function useInjectedScene(): Ref<Scene | null> {
  const injected = inject<Ref<Scene | null>>(MANIMWEB_SCENE_KEY, ref(null));
  return injected;
}

/**
 * Vue 3 plugin for ManimWeb.
 * Currently a no-op, but can be extended to add global configuration.
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue';
 * import { ManimWebPlugin } from 'manimweb/vue';
 *
 * const app = createApp(App);
 * app.use(ManimWebPlugin);
 * ```
 */
export const ManimWebPlugin = {
  install(_app: { provide: (key: symbol, value: unknown) => void }): void {
    // Plugin can be extended to provide global configuration
    // For now, it's a no-op since scene context is provided per-component
  },
};

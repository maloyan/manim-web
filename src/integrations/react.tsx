import {
  useRef,
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
  type RefObject,
  type DependencyList,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { Scene, type SceneOptions, type Mobject, type Animation } from '../index';

// Re-export for convenience
export * from '../index';

/**
 * Hook to create and manage a ManimWeb scene
 * @param containerRef - Reference to the container element
 * @param options - Scene configuration options
 * @returns The created Scene instance or null if not ready
 */
export function useScene(
  containerRef: RefObject<HTMLElement | null>,
  options?: SceneOptions
): Scene | null {
  const [scene, setScene] = useState<Scene | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!containerRef.current) return;

    const newScene = new Scene(containerRef.current, optionsRef.current);
    setScene(newScene);

    return () => {
      newScene.dispose();
    };
  }, [containerRef]);

  // Handle resize when dimensions change
  useEffect(() => {
    if (!scene || !options?.width || !options?.height) return;
    scene.resize(options.width, options.height);
  }, [scene, options?.width, options?.height]);

  return scene;
}

/**
 * Hook to manage mobjects in a scene
 * @param scene - The scene to add the mobject to
 * @param createMobject - Factory function to create the mobject
 * @param deps - Dependencies that trigger mobject recreation
 * @returns The created mobject or null if not ready
 */
export function useMobject<T extends Mobject>(
  scene: Scene | null,
  createMobject: () => T,
  deps: DependencyList = []
): T | null {
  const mobjectRef = useRef<T | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Remove old mobject if exists
    if (mobjectRef.current) {
      scene.remove(mobjectRef.current);
    }

    // Create and add new mobject
    const mobject = createMobject();
    mobjectRef.current = mobject;
    scene.add(mobject);

    return () => {
      if (mobjectRef.current && scene) {
        scene.remove(mobjectRef.current);
        mobjectRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, ...deps]);

  return mobjectRef.current;
}

/**
 * Hook to play animations with loading state tracking
 * @param scene - The scene to play animations in
 * @returns Object with play, playAll functions and isPlaying state
 */
export function useAnimation(
  scene: Scene | null
): {
  play: (...animations: Animation[]) => Promise<void>;
  playAll: (...animations: Animation[]) => Promise<void>;
  isPlaying: boolean;
} {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(
    async (...animations: Animation[]) => {
      if (!scene) return;
      setIsPlaying(true);
      try {
        await scene.play(...animations);
      } finally {
        setIsPlaying(false);
      }
    },
    [scene]
  );

  const playAll = useCallback(
    async (...animations: Animation[]) => {
      if (!scene) return;
      setIsPlaying(true);
      try {
        await scene.playAll(...animations);
      } finally {
        setIsPlaying(false);
      }
    },
    [scene]
  );

  return { play, playAll, isPlaying };
}

/**
 * Props for ManimScene component
 */
export interface ManimSceneProps {
  /** Canvas width in pixels. Defaults to 800. */
  width?: number;
  /** Canvas height in pixels. Defaults to 450. */
  height?: number;
  /** Background color as CSS color string. Defaults to '#1a1a2e'. */
  backgroundColor?: string;
  /** Callback when scene is ready */
  onSceneReady?: (scene: Scene) => void;
  /** Child elements to render (overlay content) */
  children?: ReactNode;
  /** CSS class name for the container */
  className?: string;
  /** Inline styles for the container */
  style?: CSSProperties;
}

/**
 * React component that wraps a ManimWeb scene
 *
 * @example
 * ```tsx
 * <ManimScene
 *   width={800}
 *   height={450}
 *   onSceneReady={async (scene) => {
 *     const circle = new Circle({ radius: 1, color: '#ff0000' });
 *     scene.add(circle);
 *     await scene.play(new FadeIn(circle));
 *   }}
 * />
 * ```
 */
export function ManimScene({
  width = 800,
  height = 450,
  backgroundColor = '#1a1a2e',
  onSceneReady,
  children,
  className,
  style,
}: ManimSceneProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const scene = useScene(containerRef, { width, height, backgroundColor });
  const onSceneReadyRef = useRef(onSceneReady);

  // Update callback ref when it changes
  useEffect(() => {
    onSceneReadyRef.current = onSceneReady;
  }, [onSceneReady]);

  useEffect(() => {
    if (scene && onSceneReadyRef.current) {
      onSceneReadyRef.current(scene);
    }
  }, [scene]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Context for sharing scene across components
 */
export const SceneContext = createContext<Scene | null>(null);

/**
 * Hook to access the scene from context
 * @returns The scene from context or null
 */
export function useSceneContext(): Scene | null {
  return useContext(SceneContext);
}

/**
 * Props for ManimProvider component
 */
export interface ManimProviderProps {
  /** Child components that can access the scene via useSceneContext */
  children: ReactNode;
  /** Canvas width in pixels. Defaults to 800. */
  width?: number;
  /** Canvas height in pixels. Defaults to 450. */
  height?: number;
  /** Background color as CSS color string. Defaults to '#1a1a2e'. */
  backgroundColor?: string;
  /** CSS class name for the container */
  className?: string;
  /** Inline styles for the container */
  style?: CSSProperties;
}

/**
 * Provider component that creates a scene and shares it via context
 *
 * @example
 * ```tsx
 * <ManimProvider width={800} height={450}>
 *   <MyAnimationComponent />
 * </ManimProvider>
 *
 * function MyAnimationComponent() {
 *   const scene = useSceneContext();
 *   // Use scene to add mobjects and play animations
 * }
 * ```
 */
export function ManimProvider({
  children,
  width = 800,
  height = 450,
  backgroundColor = '#1a1a2e',
  className,
  style,
}: ManimProviderProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const scene = useScene(containerRef, { width, height, backgroundColor });

  return (
    <SceneContext.Provider value={scene}>
      <div
        ref={containerRef}
        className={className}
        style={{ width, height, position: 'relative', ...style }}
      />
      {children}
    </SceneContext.Provider>
  );
}

/**
 * Hook to use updaters with React state
 * Automatically adds/removes the updater when dependencies change
 *
 * @param mobject - The mobject to add the updater to
 * @param updater - The updater function (receives mobject and dt)
 * @param deps - Dependencies that trigger updater recreation
 *
 * @example
 * ```tsx
 * const circle = useMobject(scene, () => new Circle({ radius: 1 }));
 *
 * useUpdater(circle, (m, dt) => {
 *   m.rotate(dt * Math.PI); // Rotate continuously
 * });
 * ```
 */
export function useUpdater(
  mobject: Mobject | null,
  updater: (m: Mobject, dt: number) => void,
  deps: DependencyList = []
): void {
  const updaterRef = useRef(updater);

  // Keep updater ref current
  useEffect(() => {
    updaterRef.current = updater;
  }, [updater]);

  useEffect(() => {
    if (!mobject) return;

    // Create a stable wrapper that uses the current updater
    const stableUpdater = (m: Mobject, dt: number) => {
      updaterRef.current(m, dt);
    };

    mobject.addUpdater(stableUpdater);

    return () => {
      mobject.removeUpdater(stableUpdater);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobject, ...deps]);
}

/**
 * Hook to wait for a duration within an async effect
 * @param scene - The scene to use for waiting
 * @returns A wait function that returns a promise
 */
export function useWait(scene: Scene | null): (duration: number) => Promise<void> {
  return useCallback(
    (duration: number) => {
      if (!scene) return Promise.resolve();
      return scene.wait(duration);
    },
    [scene]
  );
}

/**
 * Hook to get scene playback controls
 * @param scene - The scene to control
 * @returns Playback control functions and state
 */
export function usePlaybackControls(scene: Scene | null): {
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  isPlaying: boolean;
  currentTime: number;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Sync state with scene
  useEffect(() => {
    if (!scene) return;

    const interval = setInterval(() => {
      setIsPlaying(scene.isPlaying);
      setCurrentTime(scene.currentTime);
    }, 16); // ~60fps update

    return () => clearInterval(interval);
  }, [scene]);

  const pause = useCallback(() => {
    scene?.pause();
    setIsPlaying(false);
  }, [scene]);

  const resume = useCallback(() => {
    scene?.resume();
    setIsPlaying(true);
  }, [scene]);

  const stop = useCallback(() => {
    scene?.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [scene]);

  const seek = useCallback(
    (time: number) => {
      scene?.seek(time);
      setCurrentTime(time);
    },
    [scene]
  );

  return { pause, resume, stop, seek, isPlaying, currentTime };
}

import React, { useRef, useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { createExampleScene } from './createExampleScene';

type AnimationFn = (scene: any) => Promise<void>;
type SceneFactory = (
  container: HTMLElement,
  manim: any,
  dims: { width: number; height: number },
) => any | Promise<any>;

interface ManimExampleProps {
  animationFn: AnimationFn;
  /** Optional factory to create a custom scene type (e.g. ZoomedScene). */
  createScene?: SceneFactory;
}

const ASPECT_RATIO = 800 / 450; // ~16:9

const placeholderStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 800,
  aspectRatio: `${ASPECT_RATIO}`,
  background: '#000000',
  borderRadius: 12,
};

/**
 * Global initialization queue.  Scene creation is serialized through this
 * queue so that WebGL contexts are allocated one at a time (avoiding a burst
 * of simultaneous context requests that can cause GPU OOM).  The queue is
 * released as soon as the scene is created, allowing multiple scenes to
 * animate concurrently.
 */
let initQueue: Array<() => void> = [];
let initRunning = false;

function enqueueInit(): Promise<void> {
  if (!initRunning) {
    initRunning = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    initQueue.push(resolve);
  });
}

function dequeueInit(): void {
  if (initQueue.length > 0) {
    const next = initQueue.shift()!;
    next();
  } else {
    initRunning = false;
  }
}

/** Release the queue exactly once via a shared flag. */
function releaseQueue(flag: { released: boolean }): void {
  if (!flag.released) {
    flag.released = true;
    dequeueInit();
  }
}

/** Force the browser to release a WebGL context immediately. */
function forceContextLoss(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  try {
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* ignore — context may already be lost */
  }
}

/** Check if an element is in the viewport using getBoundingClientRect. */
function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function ManimExampleInner({ animationFn, createScene }: ManimExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const queueFlagRef = useRef<{ released: boolean } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  // Scenes run only after the user clicks "Run".  The /examples page has ~100
  // examples; auto-running them all exhausts the browser's limited WebGL
  // contexts, so most never rendered and showed as black boxes.  Click-to-run
  // bounds the number of live contexts to the few the reader actually opens.
  const [activated, setActivated] = useState(false);

  // Visibility detection — IntersectionObserver with manual fallback.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Manual check — IntersectionObserver may not fire its initial callback
    // immediately when used inside Docusaurus BrowserOnly.
    if (isElementInViewport(el)) {
      setIsVisible(true);
    }

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: [0, 0.1],
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scene lifecycle — runs once the reader opens the example by clicking.  We
  // deliberately do NOT gate on `isVisible`: the IntersectionObserver proved
  // unreliable on this page, and an explicit click is unambiguous intent.
  // Live contexts stay bounded because only the handful of examples the reader
  // actually opens ever run.
  const shouldRun = activated;

  useEffect(() => {
    if (!shouldRun || !containerRef.current) return;

    const container = containerRef.current;
    let cancelled = false;
    const queueFlag = { released: true };

    (async () => {
      await enqueueInit();
      queueFlag.released = false;
      queueFlagRef.current = queueFlag;

      if (cancelled) {
        releaseQueue(queueFlag);
        return;
      }

      try {
        const manim = await import('manim-web');
        if (cancelled) {
          releaseQueue(queueFlag);
          return;
        }

        const width = container.clientWidth || 800;
        const height = Math.round(width / ASPECT_RATIO);

        // Create scene ONCE — reuse across loop iterations to avoid
        // WebGL context churn that causes GPU OOM.  createExampleScene also
        // resizes factories that pin 800x450 to the box size, so the canvas
        // is not clipped off-center on narrow (mobile) screens (#838).
        const scene = await createExampleScene(container, manim, { width, height }, createScene);

        if (cancelled) {
          const c = container.querySelector('canvas') as HTMLCanvasElement | null;
          forceContextLoss(c);
          try {
            scene.dispose();
          } catch {
            /* ignore */
          }
          releaseQueue(queueFlag);
          return;
        }

        sceneRef.current = scene;

        // Release the init queue now that the scene is created — other
        // scenes can start initializing while this one animates.
        releaseQueue(queueFlag);

        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        const onContextLost = () => {
          if (!cancelled) setIsVisible(false);
        };
        canvas?.addEventListener('webglcontextlost', onContextLost);

        // Animation loop: run animation, hold, clear, repeat
        while (!cancelled) {
          try {
            await animationFn(scene);
          } catch (e) {
            console.error('Animation error:', e);
          }

          // Re-enable auto-render and force a render so static scenes
          // (add-only, no play) show their final state.
          if (scene._autoRender !== undefined) {
            scene._autoRender = true;
          }
          try {
            scene._render?.();
          } catch {
            /* ignore */
          }

          if (cancelled) break;

          // Hold the final frame so the result is visible before looping.
          await new Promise((r) => setTimeout(r, 2000));

          if (cancelled) break;

          // Clear scene without rendering and suppress auto-render so the
          // canvas keeps showing the last frame while the next iteration
          // rebuilds.  play() calls _render() directly (not gated by
          // _autoRender), so animations still render normally — only the
          // redundant per-add() renders are suppressed.
          if (scene._autoRender !== undefined) {
            scene._autoRender = false;
          }
          if (scene.clear) {
            scene.clear({ render: false });
          } else {
            while (scene.mobjects && scene.mobjects.length > 0) {
              scene.remove(scene.mobjects[0]);
            }
          }
        }

        canvas?.removeEventListener('webglcontextlost', onContextLost);

        forceContextLoss(canvas);
        try {
          scene.dispose();
        } catch {
          /* ignore */
        }
        sceneRef.current = null;
      } catch (e) {
        console.error('Scene init error:', e);
      }

      releaseQueue(queueFlag);
    })();

    return () => {
      cancelled = true;
      if (sceneRef.current) {
        const c = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
        forceContextLoss(c);
        try {
          sceneRef.current.dispose();
        } catch {
          /* ignore */
        }
        sceneRef.current = null;
      }
      container.innerHTML = '';
      if (queueFlagRef.current) {
        releaseQueue(queueFlagRef.current);
        queueFlagRef.current = null;
      }
    };
  }, [shouldRun, animationFn, createScene]);

  return (
    <div
      onClick={() => setActivated(true)}
      role={activated ? undefined : 'button'}
      tabIndex={activated ? undefined : 0}
      onKeyDown={(e) => {
        if (!activated && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setActivated(true);
        }
      }}
      style={{
        width: '100%',
        maxWidth: 800,
        aspectRatio: `${ASPECT_RATIO}`,
        // Intentional panel instead of pure black.  The /examples page has ~100
        // examples; auto-running them all exhausts the browser's limited WebGL
        // contexts, so most never rendered and showed as black boxes.  Instead
        // each is a click-to-run poster, bounding live contexts to the few the
        // reader opens.
        background: 'linear-gradient(135deg, #15161f 0%, #20222e 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        cursor: activated ? 'default' : 'pointer',
      }}
    >
      {/* Run affordance — shown until the user opens the example. */}
      {!activated && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: '#8b93b8',
            userSelect: 'none',
          }}
        >
          <div
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(130,140,190,0.14)',
              border: '1px solid rgba(130,140,190,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              paddingLeft: 4,
            }}
          >
            ▶
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
            Run animation
          </div>
        </div>
      )}
      {/* The live scene's canvas is mounted here and covers the poster above
          while it renders.  Kept separate from the poster so the scene
          cleanup's innerHTML reset never removes the placeholder. */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
    </div>
  );
}

export default function ManimExample(props: ManimExampleProps) {
  return (
    <BrowserOnly fallback={<div style={placeholderStyle} />}>
      {() => <ManimExampleInner {...props} />}
    </BrowserOnly>
  );
}

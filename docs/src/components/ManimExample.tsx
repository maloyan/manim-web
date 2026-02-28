import React, { useRef, useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimationFn = (scene: any) => Promise<void>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function ManimExampleInner({ animationFn, createScene }: ManimExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Bidirectional observer — create on enter, dispose on leave
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scene lifecycle tied to visibility
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const container = containerRef.current;
    let cancelled = false;

    (async () => {
      try {
        const manim = await import('manim-web');
        if (cancelled) return;
        if (!container) return;

        const width = container.clientWidth || 800;
        const height = Math.round(width / ASPECT_RATIO);

        const scene = createScene
          ? await createScene(container, manim, { width, height })
          : new manim.Scene(container, {
              width,
              height,
              backgroundColor: '#000000',
            });

        if (cancelled) {
          try {
            scene.dispose();
          } catch {
            /* ignore */
          }
          return;
        }

        // Listen for context loss — mark not visible so re-init can happen
        const canvas = container.querySelector('canvas');
        const onContextLost = () => {
          if (!cancelled) setIsVisible(false);
        };
        canvas?.addEventListener('webglcontextlost', onContextLost);

        // Run animation loop
        while (!cancelled) {
          try {
            await animationFn(scene);
            if (cancelled) break;
            await scene.wait(2);
            if (cancelled) break;
            scene.clear({ render: false });
          } catch (e) {
            if (cancelled) break;
            console.error('Animation error:', e);
            break;
          }
        }

        canvas?.removeEventListener('webglcontextlost', onContextLost);

        try {
          scene.dispose();
        } catch {
          /* ignore */
        }
      } catch (e) {
        console.error('Scene init error:', e);
      }
    })();

    return () => {
      cancelled = true;
      // Clear old canvas so a fresh one is created on re-init
      container.innerHTML = '';
    };
  }, [isVisible, animationFn, createScene]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 800,
        aspectRatio: `${ASPECT_RATIO}`,
        background: '#000000',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    />
  );
}

export default function ManimExample(props: ManimExampleProps) {
  return (
    <BrowserOnly fallback={<div style={placeholderStyle} />}>
      {() => <ManimExampleInner {...props} />}
    </BrowserOnly>
  );
}

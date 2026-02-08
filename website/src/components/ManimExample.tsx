import React, { useRef, useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimationFn = (scene: any) => Promise<void>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SceneFactory = (container: HTMLElement, manim: any) => any | Promise<any>;

interface ManimExampleProps {
  animationFn: AnimationFn;
  /** Optional factory to create a custom scene type (e.g. ZoomedScene). */
  createScene?: SceneFactory;
}

const placeholderStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 800,
  height: 450,
  background: '#000000',
  borderRadius: 12,
};

function ManimExampleInner({ animationFn, createScene }: ManimExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sceneRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const initializedRef = useRef(false);

  // Only activate when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize scene directly when visible
  useEffect(() => {
    if (!isVisible || !containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const manim = await import('manim-js');
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;

        const scene = createScene
          ? await createScene(container, manim)
          : new manim.Scene(container, {
              width: 800,
              height: 450,
              backgroundColor: '#000000',
            });
        sceneRef.current = scene;

        // Run animation loop
        while (!cancelled) {
          try {
            await animationFn(scene);
            if (cancelled) break;
            await scene.wait(2);
            if (cancelled) break;
            scene.clear();
          } catch (e) {
            if (cancelled) break;
            console.error('Animation error:', e);
            break;
          }
        }
      } catch (e) {
        console.error('Scene init error:', e);
      }
    })();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      if (sceneRef.current) {
        try {
          sceneRef.current.dispose();
        } catch {
          /* ignore */
        }
        sceneRef.current = null;
      }
    };
  }, [isVisible, animationFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (sceneRef.current) {
        try {
          sceneRef.current.dispose();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 800,
        height: 450,
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

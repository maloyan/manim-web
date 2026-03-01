import React, { useRef, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const ASPECT_RATIO = 800 / 450;

const placeholderStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 800,
  aspectRatio: `${ASPECT_RATIO}`,
  background: '#000000',
  borderRadius: 12,
};

function PlayerExampleInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any = null;

    (async () => {
      const {
        Player,
        Circle,
        Square,
        Triangle,
        Create,
        Transform,
        FadeIn,
        FadeOut,
        Indicate,
        Rotate,
        BLACK,
        BLUE,
        RED,
        GREEN,
        YELLOW,
      } = await import('manim-web');

      if (disposed) return;

      const width = el.clientWidth || 800;
      const height = Math.round(width / ASPECT_RATIO);

      player = new Player(el, {
        width,
        height,
        backgroundColor: BLACK,
      });

      if (disposed) {
        player.dispose();
        return;
      }

      player.sequence(async (scene) => {
        const circle = new Circle({ radius: 1.5, color: BLUE });
        await scene.play(new Create(circle));

        await scene.wait(0.5);

        const square = new Square({ sideLength: 3, color: RED });
        await scene.play(new Transform(circle, square));

        await scene.play(new Indicate(circle));

        const triangle = new Triangle({ color: GREEN });
        triangle.scale(2);
        await scene.play(new Transform(circle, triangle));

        await scene.play(new Rotate(circle, { angle: Math.PI }));

        await scene.play(new FadeOut(circle));

        const circle2 = new Circle({ radius: 1, color: YELLOW });
        await scene.play(new FadeIn(circle2));

        await scene.wait(1);
      });
    })();

    return () => {
      disposed = true;
      if (player) {
        try {
          player.dispose();
        } catch {
          /* ignore */
        }
      }
      el.innerHTML = '';
    };
  }, []);

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

export default function PlayerExample() {
  return (
    <BrowserOnly fallback={<div style={placeholderStyle} />}>
      {() => <PlayerExampleInner />}
    </BrowserOnly>
  );
}

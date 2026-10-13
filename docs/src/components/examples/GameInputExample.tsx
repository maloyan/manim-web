// Interactive widget for the 0.31 / 0.32 input controllers: KeyboardInput and
// GamepadInput. A passive WebGL render cannot show live input, so this is a
// real input widget: press WASD / arrows (or use a connected gamepad) to move
// the dot. It uses the DOM-only input controllers, so no WebGL context is used.
import React, { useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const ASPECT = 800 / 450;
const DOT = 26;
const SPEED = 320; // px per second

function GameInputInner() {
  const [activated, setActivated] = useState(false);
  const [status, setStatus] = useState('Press WASD or the arrow keys to move');
  const areaRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activated) return;
    let cancelled = false;
    let raf = 0;
    let keys: any = null;
    let pad: any = null;

    const area = areaRef.current;
    const dot = dotRef.current;
    if (!area || !dot) return;

    // Position in px within the play area. Start centered on the measured box.
    let x = area.clientWidth / 2 - DOT / 2;
    let y = area.clientHeight / 2 - DOT / 2;
    let last = performance.now();

    (async () => {
      const { KeyboardInput, GamepadInput } = await import('manim-web');
      if (cancelled) return;

      // preventDefault keeps the game keys from scrolling the page.
      keys = new KeyboardInput({
        preventDefault: ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'],
      });
      pad = new GamepadInput({ deadzone: 0.15 });

      const loop = (now: number) => {
        if (cancelled) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        pad.poll(); // read the gamepad snapshot and compute button edges

        // Combine the keyboard and gamepad direction vectors. Screen y grows
        // down, so subtract the (up-positive) input y.
        const [kx, ky] = keys.getDirectionVector();
        const [gx, gy] = pad.getDirectionVector();
        const dx = kx + gx;
        const dy = ky + gy;

        const maxX = area.clientWidth - DOT;
        const maxY = area.clientHeight - DOT;
        x = Math.max(0, Math.min(maxX, x + dx * SPEED * dt));
        y = Math.max(0, Math.min(maxY, y - dy * SPEED * dt));
        dot.style.transform = `translate(${x}px, ${y}px)`;

        const pads = pad.getConnectedGamepads();
        if (pads.length > 0) {
          setStatus(`Gamepad connected — left stick / d-pad to move (${pads.length})`);
        }

        keys.endFrame(); // clear this frame's pressed / released edges
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      keys?.dispose?.();
      pad?.dispose?.();
    };
  }, [activated]);

  return (
    <div
      ref={areaRef}
      onClick={() => setActivated(true)}
      role={activated ? undefined : 'button'}
      tabIndex={0}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 800,
        aspectRatio: `${ASPECT}`,
        background: 'linear-gradient(135deg, #15161f 0%, #20222e 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        outline: 'none',
        cursor: activated ? 'default' : 'pointer',
      }}
    >
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: DOT,
          height: DOT,
          borderRadius: '50%',
          background: '#58c4dd',
          boxShadow: '0 0 14px rgba(88,196,221,0.8)',
          visibility: activated ? 'visible' : 'hidden',
        }}
      />

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
            }}
          >
            🎮
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
            Click, then press WASD / arrows
          </div>
        </div>
      )}

      {activated && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '6px 10px',
            fontSize: 12,
            color: '#aeb4d6',
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

export default function GameInputExample() {
  return (
    <BrowserOnly
      fallback={
        <div
          style={{
            width: '100%',
            maxWidth: 800,
            aspectRatio: `${ASPECT}`,
            background: '#000',
            borderRadius: 12,
          }}
        />
      }
    >
      {() => <GameInputInner />}
    </BrowserOnly>
  );
}

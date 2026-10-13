// Interactive affordance for the 0.33 feature SMIL export. The export writes a
// file, which a passive render cannot show, so this is a real download button:
// it calls exportAndDownloadAnimatedSVG and hands you a standalone .svg that
// animates on its own in any browser (no JavaScript).
//
// The button exports synchronously so the download fires inside the click
// gesture. It drives a small seek-driven SmilExportableScene — the documented
// export contract. In an app you pass your animated Scene straight in.
import React, { useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function SmilExportInner() {
  const [note, setNote] = useState('Click to build and download an animated SVG.');
  const modRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    import('manim-web').then((m) => {
      if (active) modRef.current = m;
    });
    return () => {
      active = false;
    };
  }, []);

  const download = () => {
    const mod = modRef.current;
    if (!mod) {
      setNote('Still loading — try again in a moment.');
      return;
    }
    const { Circle, Square, exportAndDownloadAnimatedSVG } = mod;

    const duration = 3;
    const dot = new Circle({ radius: 0.6, color: '#58c4dd', fillOpacity: 1 });
    const box = new Square({ sideLength: 1.2, color: '#ff862f', strokeWidth: 6 });

    // A duck-typed SmilExportableScene: seek(t) mutates the mobjects to their
    // state at time t, and the exporter samples it across the timeline.
    const scene = {
      getWidth: () => 800,
      getHeight: () => 450,
      camera: { frameWidth: 14, frameHeight: 8, position: { x: 0, y: 0 } },
      mobjects: [box, dot],
      getTimelineDuration: () => duration,
      seek: (t: number) => {
        const p = t / duration; // 0..1
        dot.moveTo([-5 + p * 10, Math.sin(p * Math.PI * 2) * 2, 0]);
        box.moveTo([5 - p * 10, -Math.sin(p * Math.PI * 2) * 2, 0]);
      },
    };

    exportAndDownloadAnimatedSVG(scene, 'manim-web-demo.svg', {
      duration,
      loop: true,
      background: '#111111',
      preferTransform: true,
    });
    setNote('Downloaded manim-web-demo.svg — open it in a browser to watch it loop.');
  };

  return (
    <div
      style={{
        maxWidth: 800,
        padding: 20,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #15161f 0%, #20222e 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        onClick={download}
        style={{
          padding: '10px 18px',
          borderRadius: 8,
          border: '1px solid rgba(130,140,190,0.4)',
          background: '#2f6d8b',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ⬇ Download animated SVG
      </button>
      <span style={{ color: '#aeb4d6', fontSize: 14 }}>{note}</span>
    </div>
  );
}

export default function SmilExportExample() {
  return (
    <BrowserOnly
      fallback={
        <div style={{ maxWidth: 800, height: 72, borderRadius: 12, background: '#15161f' }} />
      }
    >
      {() => <SmilExportInner />}
    </BrowserOnly>
  );
}

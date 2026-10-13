// Interactive affordance for the 0.33 feature SpatialAudio. A WebGL render
// cannot demonstrate 3D audio, so this is an honest "play" button: it builds a
// real SpatialAudio over the Web Audio API and sweeps the sound from the left
// ear to the right ear. Use headphones to hear the pan.
//
// The manim-web module is preloaded at mount so the click handler stays
// synchronous: browsers suspend an AudioContext created outside a user gesture.
import React, { useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function buildToneBuffer(ctx: AudioContext, seconds: number, freq: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.floor(seconds * rate), rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const t = i / rate;
    // A soft sine with a gentle fade in/out so the loop has no clicks.
    const env = Math.min(1, t * 4) * Math.min(1, (seconds - t) * 4);
    data[i] = Math.sin(2 * Math.PI * freq * t) * 0.35 * env;
  }
  return buffer;
}

function SpatialAudioInner() {
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState('');
  const modRef = useRef<any>(null);
  const cleanupRef = useRef<null | (() => void)>(null);

  // Preload the module so the click handler is synchronous (gesture-preserving).
  useEffect(() => {
    let active = true;
    import('manim-web').then((m) => {
      if (active) modRef.current = m;
    });
    return () => {
      active = false;
      cleanupRef.current?.();
    };
  }, []);

  const play = () => {
    const mod = modRef.current;
    if (playing || !mod) return;

    if (!mod.isSpatialAudioSupported()) {
      setNote('Web Audio is unavailable in this browser.');
      return;
    }

    const Ctx: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;

    // A short-lived context only to allocate the tone buffer. SpatialAudio
    // builds its own context internally; an AudioBuffer plays on either.
    const scratch = new Ctx();
    const buffer = buildToneBuffer(scratch, 6, 330);
    void scratch.close();

    // fromBuffer builds a positional source wired through a PannerNode.
    const audio = mod.SpatialAudio.fromBuffer(buffer, { loop: true, position: [-8, 0, 0] });
    audio.setListenerPosition([0, 0, 0]);
    audio.play();

    setPlaying(true);
    setNote('Playing — the tone sweeps left → right. Use headphones.');

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = ((now - start) / 1000) % 4; // 0..4s loop
      const phase = t < 2 ? t / 2 : 1 - (t - 2) / 2; // 0 → 1 → 0
      audio.setPosition([-8 + phase * 16, 0, 0]); // -8 (left) .. +8 (right)
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      try {
        audio.stop();
      } catch {
        /* ignore */
      }
      cleanupRef.current = null;
    };
  };

  const stop = () => {
    cleanupRef.current?.();
    setPlaying(false);
    setNote('Stopped.');
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
        onClick={playing ? stop : play}
        style={{
          padding: '10px 18px',
          borderRadius: 8,
          border: '1px solid rgba(130,140,190,0.4)',
          background: playing ? '#8b2f4a' : '#2f6d8b',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {playing ? '■ Stop' : '▶ Play spatial sound'}
      </button>
      <span style={{ color: '#aeb4d6', fontSize: 14 }}>
        {note || 'Click to pan a looping tone around the listener.'}
      </span>
    </div>
  );
}

export default function SpatialAudioExample() {
  return (
    <BrowserOnly
      fallback={
        <div style={{ maxWidth: 800, height: 72, borderRadius: 12, background: '#15161f' }} />
      }
    >
      {() => <SpatialAudioInner />}
    </BrowserOnly>
  );
}

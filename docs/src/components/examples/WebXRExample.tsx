// Interactive affordance for the 0.33 feature WebXR. Entering a headset needs
// hardware, so a passive render cannot show it. This widget calls the real
// isXRSupported() guard and reports honestly whether this device can start an
// immersive VR session. The full enableXR + button wiring is in the snippet.
import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function WebXRInner() {
  const [note, setNote] = useState('Click to probe this device for immersive VR.');
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    setNote('Checking…');
    const { isXRSupported } = await import('manim-web');
    const ok = await isXRSupported('immersive-vr');
    setNote(
      ok
        ? 'immersive-vr is supported on this device. enableXR(scene) can start a session.'
        : 'immersive-vr is not available here (no headset / WebXR). enableXR degrades to a no-op.',
    );
    setChecking(false);
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
        onClick={check}
        disabled={checking}
        style={{
          padding: '10px 18px',
          borderRadius: 8,
          border: '1px solid rgba(130,140,190,0.4)',
          background: '#2f6d8b',
          color: '#fff',
          fontWeight: 600,
          cursor: checking ? 'default' : 'pointer',
          opacity: checking ? 0.7 : 1,
        }}
      >
        Check VR support
      </button>
      <span style={{ color: '#aeb4d6', fontSize: 14 }}>{note}</span>
    </div>
  );
}

export default function WebXRExample() {
  return (
    <BrowserOnly
      fallback={
        <div style={{ maxWidth: 800, height: 72, borderRadius: 12, background: '#15161f' }} />
      }
    >
      {() => <WebXRInner />}
    </BrowserOnly>
  );
}

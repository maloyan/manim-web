// Live example for Sonifier. Browsers need a click before sound plays, so the
// example has buttons.
import React, { useRef } from 'react';
import ManimExample from '../ManimExample';

interface Hooks {
  play: () => void;
  sweep: () => void;
  stop: () => void;
}

const COUNT = 48;
const WIDTH = 9;
const valueAt = (x: number) => Math.sin((x / WIDTH) * Math.PI * 4);

export default function SonifierExample() {
  const hooks = useRef<Hooks | null>(null);

  async function animate(scene: any) {
    const { Sonifier, ValueTracker, Dot, Line, BLUE, YELLOW, GRAY } = await import('manim-web');

    const sonifier = new Sonifier({ minFrequency: 220, maxFrequency: 880 });
    const series = Array.from({ length: COUNT }, (_, i) => valueAt((i / (COUNT - 1)) * WIDTH));

    // A row of dots shows the series. Height equals value.
    scene.add(new Line({ start: [-4.5, 0, 0], end: [4.5, 0, 0], color: GRAY }));
    series.forEach((v, i) => {
      const x = -4.5 + (i / (COUNT - 1)) * WIDTH;
      scene.add(new Dot({ point: [x, v * 1.5, 0], radius: 0.06, color: BLUE }));
    });

    // A cursor dot. A tracker moves it from left to right.
    const tracker = new ValueTracker(0);
    const cursor = new Dot({ point: [-4.5, 0, 0], radius: 0.14, color: YELLOW });
    cursor.addUpdater(() => {
      const x = tracker.getValue();
      cursor.moveTo([-4.5 + x, valueAt(x) * 1.5, 0]);
    });
    scene.add(tracker, cursor);

    let playing: { stop(): void } | null = null;
    let binding: { stop(): void } | null = null;
    const stop = () => {
      playing?.stop();
      binding?.stop();
      playing = null;
      binding = null;
    };

    hooks.current = {
      stop,
      // play(series) schedules the whole series as stepped pitch.
      play: () => {
        stop();
        playing = sonifier.play(series, { totalDuration: 6 });
        tracker.setValue(0);
        scene.play(tracker.animateTo(WIDTH, { duration: 6 }));
      },
      // bindToTracker makes the tracker value drive the pitch every frame.
      sweep: async () => {
        stop();
        tracker.setValue(0);
        binding = sonifier.bindToTracker(tracker, { domain: [0, WIDTH] });
        await scene.play(tracker.animateTo(WIDTH, { duration: 6 }));
        stop();
      },
    };
    await scene.wait(999999);
  }

  return (
    <div>
      <ManimExample animationFn={animate} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => hooks.current?.play()}>Play series</button>
        <button onClick={() => hooks.current?.sweep()}>Play bound tracker</button>
        <button onClick={() => hooks.current?.stop()}>Stop</button>
      </div>
    </div>
  );
}

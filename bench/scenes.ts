/**
 * Benchmark scenes. Each scene builds its mobjects and returns the animations
 * to time. The harness (`bench.ts`) steps them frame by frame off the real-time
 * clock, so a result does not depend on requestAnimationFrame scheduling.
 */
import {
  Animation,
  ApplyPointwiseFunction,
  Circle,
  Create,
  Dot,
  Line,
  MathTex,
  NumberPlane,
  ParametricFunction,
  Scene,
  Square,
  Transform,
  TransformMatchingTex,
  UpdateFromAlphaFunc,
  ValueTracker,
  BLUE,
  GREEN,
  YELLOW,
} from '../src/index.ts';

export interface BenchScene {
  /** Animated seconds to step through. */
  duration: number;
  /** Builds mobjects, adds them to the scene, and returns the animations to time. */
  build(scene: Scene): Promise<Animation[]>;
}

const GRID = 10;

export const SCENES: Record<string, BenchScene> = {
  // Many VMobjects morphing at once: a CPU geometry rebuild every frame.
  'transform-shapes': {
    duration: 2,
    async build(scene) {
      const anims: Animation[] = [];
      for (let i = 0; i < GRID * 5; i++) {
        const c = new Circle({ radius: 0.25, color: BLUE, fillOpacity: 0.5 });
        c.moveTo([-6 + (i % GRID) * 1.3, -3 + Math.floor(i / GRID) * 1.4, 0]);
        const s = new Square({ sideLength: 0.5, color: GREEN, fillOpacity: 0.5 });
        s.moveTo(c.getCenter());
        scene.add(c);
        anims.push(new Transform(c, s));
      }
      return anims;
    },
  },

  // The classic "apply a nonlinear function to the plane" shot.
  'numberplane-pointwise': {
    duration: 2,
    async build(scene) {
      const plane = new NumberPlane();
      scene.add(plane);
      const fn = (p: number[]) => [p[0] + Math.sin(p[1]), p[1] + Math.sin(p[0]), p[2]];
      return [new ApplyPointwiseFunction(plane, fn)];
    },
  },

  // Equation morphing: glyph-heavy fills.
  'mathtex-transform': {
    duration: 2,
    async build(scene) {
      const a = new MathTex({ latex: ['e^{i\\pi}', '+', '1', '=', '0'] });
      const b = new MathTex({ latex: ['e^{i\\pi}', '=', '-', '1'] });
      await a.waitForRender();
      await b.waitForRender();
      scene.add(a);
      return [new TransformMatchingTex(a, b)];
    },
  },

  // Drawing many curves at once.
  'create-curves': {
    duration: 2,
    async build() {
      const anims: Animation[] = [];
      for (let k = 0; k < 40; k++) {
        const curve = new ParametricFunction({
          func: (t: number) => [t, Math.sin(t * (1 + k * 0.05)) * 3 + k * 0.02, 0],
          tRange: [-7, 7],
          numSamples: 280,
          color: YELLOW,
        });
        anims.push(new Create(curve));
      }
      return anims;
    },
  },

  // Per-frame updaters: always-redraw style lines following moving dots.
  updaters: {
    duration: 2,
    async build(scene) {
      const t = new ValueTracker(0);
      for (let i = 0; i < 150; i++) {
        const phase = (i / 150) * Math.PI * 2;
        const dot = new Dot({ point: [Math.cos(phase) * 3, Math.sin(phase) * 3, 0] });
        const line = new Line({ start: [0, 0, 0], end: dot.getCenter(), color: BLUE });
        dot.addUpdater((d) => {
          const a = phase + t.getValue();
          d.moveTo([Math.cos(a) * 3, Math.sin(a) * 3, 0]);
        });
        line.addUpdater((l) => (l as Line).setEnd(dot.getCenter()));
        scene.add(line, dot);
      }
      return [
        new UpdateFromAlphaFunc(t, (_m, alpha) => {
          t.setValue(alpha * Math.PI);
        }),
      ];
    },
  },

  // Rigid motion only: should cost a matrix update, not a geometry rebuild.
  'animate-shift': {
    duration: 2,
    async build(scene) {
      const anims: Animation[] = [];
      for (let i = 0; i < 100; i++) {
        const c = new Circle({ radius: 0.2, color: BLUE, fillOpacity: 0.8 });
        c.moveTo([-6 + (i % GRID) * 1.3, -3 + Math.floor(i / GRID) * 0.6, 0]);
        scene.add(c);
        anims.push(c.animate.shift([0.5, 0.3, 0]).rotate(Math.PI / 2));
      }
      return anims;
    },
  },
};

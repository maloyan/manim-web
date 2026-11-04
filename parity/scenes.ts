/**
 * manim-web twins of the ManimCE scenes in `scenes.py`. Same names, same
 * mobjects, same options, same animations, same run times. Where manim-web
 * spells an API differently, the ManimCE idiom is used when manim-web
 * supports it, so the harness also checks the idiom works.
 */
import {
  Animation,
  Arrow,
  Axes,
  BLUE,
  Circle,
  Create,
  DashedLine,
  Dot,
  DoubleArrow,
  FadeIn,
  FadeOut,
  GREEN,
  GrowFromCenter,
  Indicate,
  Line,
  MathTex,
  PINK,
  RED,
  ReplacementTransform,
  Rotate,
  Scene,
  Square,
  Text,
  Transform,
  ValueTracker,
  Write,
  YELLOW,
} from '../src/index.ts';

type ParityScene = (scene: Scene) => Promise<void>;

const PI = Math.PI;

export const SCENES: Record<string, ParityScene> = {
  async CreateCircle(scene) {
    const circle = new Circle();
    circle.setFill(PINK, 0.5);
    await scene.play(new Create(circle));
    await scene.wait(0.5);
  },

  async SquareToCircle(scene) {
    const circle = new Circle();
    circle.setFill(PINK, 0.5);
    const square = new Square();
    square.rotate(PI / 4);
    await scene.play(new Create(square));
    await scene.play(new Transform(square, circle));
    await scene.play(new FadeOut(square));
  },

  async AnimatedSquareToCircle(scene) {
    const circle = new Circle();
    const square = new Square();
    await scene.play(new Create(square));
    await scene.play(square.animate.rotate(PI / 4));
    await scene.play(new ReplacementTransform(square, circle));
    await scene.play(circle.animate.setFill(PINK, 0.5));
  },

  async DifferentRotations(scene) {
    const left = new Square({ color: BLUE, fillOpacity: 0.7 }).shift([-2, 0, 0]);
    const right = new Square({ color: GREEN, fillOpacity: 0.7 }).shift([2, 0, 0]);
    scene.add(left, right);
    await scene.play(
      left.animate.rotate(PI).withDuration(2),
      new Rotate(right, { angle: PI, duration: 2 }),
    );
    await scene.wait(0.5);
  },

  async FadeAndGrow(scene) {
    const square = new Square({ color: BLUE, fillOpacity: 0.5 }).shift([-2, 0, 0]);
    const circle = new Circle({ color: YELLOW, fillOpacity: 0.5 }).shift([2, 0, 0]);
    await scene.play(new FadeIn(square, { shift: [0, 1, 0] }));
    await scene.play(new GrowFromCenter(circle));
    await scene.play(new Indicate(square));
    await scene.play(new FadeOut(square, { shift: [0, -1, 0] }), new FadeOut(circle));
  },

  async MathTexWrite(scene) {
    const tex = new MathTex({ latex: 'e^{i\\pi} + 1 = 0', fontSize: 96 });
    await tex.waitForRender();
    await scene.play(new Write(tex));
    await scene.wait(0.5);
  },

  async TextWrite(scene) {
    const text = new Text({ text: 'Hello, Manim', fontSize: 72 });
    await scene.play(new Write(text));
    await scene.wait(0.5);
  },

  async AxesPlot(scene) {
    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], xLength: 8, yLength: 5 });
    const graph = axes.plot((x) => Math.sin(2 * x), { color: BLUE });
    await scene.play(new Create(axes));
    await scene.play(new Create(graph));
    await scene.wait(0.5);
  },

  async UpdaterDot(scene) {
    const t = new ValueTracker(0);
    const dot = new Dot({ color: YELLOW }).moveTo([2, 0, 0]);
    const line = new Line({ start: [0, 0, 0], end: dot.getCenter(), color: BLUE });
    dot.addUpdater((d) => d.moveTo([2 * Math.cos(t.getValue()), 2 * Math.sin(t.getValue()), 0]));
    line.addUpdater((l) => (l as Line).setEnd(dot.getCenter()));
    scene.add(line, dot);
    // The ManimCE idiom `t.animate.set_value(PI)`. Typed and supported once
    // `.animate` accepts any mobject method (#893); until then it throws.
    const animate = t.animate as unknown as {
      setValue(v: number): { withDuration(s: number): Animation };
    };
    await scene.play(animate.setValue(PI).withDuration(2));
    await scene.wait(0.5);
  },

  async ArrowsAndLines(scene) {
    const arrow = new Arrow({ start: [-3, 1, 0], end: [3, 1, 0], color: RED });
    const double = new DoubleArrow({ start: [-3, 0, 0], end: [3, 0, 0], color: GREEN });
    const dashed = new DashedLine({ start: [-3, -1, 0], end: [3, -1, 0], color: YELLOW });
    await scene.play(new Create(arrow), new Create(double), new Create(dashed));
    await scene.wait(0.5);
  },
};

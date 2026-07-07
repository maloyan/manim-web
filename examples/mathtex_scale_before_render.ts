/**
 * Issue #324 demo: `MathTex.scale(...)` was a silent no-op when called before
 * `await waitForRender()`, because `VGroup.scale` iterated children and the
 * glyphs were not rendered yet. After the fix the pre-render scale is recorded
 * on the group's own `scaleVector` and applied via Three.js once glyphs
 * materialize, with no explicit await required.
 *
 * The orange `x^2` is built with `scale(2)` before being added to the scene
 * and should render at twice the size of the blue baseline.
 */
import { BLACK, Create, MathTex, Scene } from "../src/index.ts";

const container = document.getElementById("container");
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

const baseline = new MathTex({ latex: "x^2", color: "#6aa9ff" });
baseline.moveTo([-2, 0, 0]);

const scaled = new MathTex({ latex: "x^2", color: "#ffaa66" });
scaled.scale(2);
scaled.moveTo([2, 0, 0]);

scene.add(baseline);
await scene.play(new Create(scaled));

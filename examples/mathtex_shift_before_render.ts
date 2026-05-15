/**
 * Issue #318 demo: `MathTex.shift(...)` (and any transform that delegates to it)
 * used to be a silent no-op when called before `await waitForRender()`, because
 * `VGroup.shift` iterated children and the glyphs were not rendered yet. After
 * the fix, the pre-render shift is recorded on the group's own `position` and
 * the glyphs render at the expected location without an explicit await.
 */
import { Scene, MathTex, WHITE, GOLD, RED, BLACK } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

// Three labels, each constructed and shifted to its slot BEFORE any render.
// Pre-fix: all three would have collapsed to the origin on top of each other.
const left = new MathTex({ latex: '0', color: WHITE, fontSize: 64 });
left.shift([-4, 0, 0]);

const middle = new MathTex({ latex: '\\pi', color: GOLD, fontSize: 64 });
middle.moveTo([0, 1.5, 0]); // moveTo also delegates to shift internally

const right = new MathTex({ latex: '\\infty', color: RED, fontSize: 64 });
right.shift([4, -1.5, 0]);

scene.add(left, middle, right);

// Regression demo for issue #310: Transforming a small MathTex("0") into a
// big MathTex("0") used to render rectangular artefacts because the
// linearity test in VMobjectGeometry.isNearlyLinear used an absolute
// threshold and was not scale-invariant.
import { BLACK, MathTex, Scene, Transform, WHITE } from "../src/index.ts";

const container = document.getElementById("container");
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

async function run() {
  scene.clear();

  const small = new MathTex({
    latex: "0",
    color: WHITE,
    fillOpacity: 1,
    fontSize: 24,
  });
  const big = new MathTex({
    latex: "0",
    color: WHITE,
    fillOpacity: 1,
    fontSize: 240,
  });
  await Promise.all([small.waitForRender(), big.waitForRender()]);

  scene.add(small);
  await scene.play(new Transform(small, big, { duration: 2 }));
  await new Promise((r) => setTimeout(r, 600));
  await scene.play(new Transform(small, small.copy(), { duration: 0 }));
}

document.getElementById("playBtn")?.addEventListener("click", async () => {
  if (isAnimating) return;
  isAnimating = true;
  const btn = document.getElementById("playBtn") as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  await run();
  isAnimating = false;
  if (btn) btn.disabled = false;
});

document.getElementById("resetBtn")?.addEventListener("click", () => {
  scene.clear();
});

if (new URLSearchParams(window.location.search).has("embed")) {
  document
    .querySelectorAll(".controls, .buttons, h1, #status")
    .forEach((el) => ((el as HTMLElement).style.display = "none"));
  const playBtn = document.getElementById("playBtn") as
    | HTMLButtonElement
    | null;
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 1500);
    }).observe(playBtn, { attributes: true, attributeFilter: ["disabled"] });
  }
}

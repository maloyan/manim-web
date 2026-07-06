import {
  Animation,
  BLACK,
  BLUE,
  Circle,
  Create,
  FadeOut,
  GREEN,
  Scene,
  Square,
  Timeline,
  Transform,
} from "../src/index.ts";

const container = document.getElementById("container")!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

const progressContainer = document.getElementById("progressContainer")!;
const progressFill = document.getElementById("progressFill")!;
const progressText = document.getElementById("progressText")!;

function showProgress(progress: number, label: string) {
  progressContainer.style.display = "block";
  progressFill.style.width = `${Math.round(progress * 100)}%`;
  progressText.textContent = `${label} — ${Math.round(progress * 100)}%`;
}

function hideProgress() {
  progressContainer.style.display = "none";
  progressFill.style.width = "0%";
}

function setButtonsDisabled(disabled: boolean) {
  document
    .querySelectorAll<HTMLButtonElement>(".controls button")
    .forEach((btn) => (btn.disabled = disabled));
}

// Build the same three animations Play and Export share.
// Each call returns a fresh set against a freshly populated scene
// — animations are stateful (begin() snapshots opacities), so reusing
// instances across runs would replay against stale state.
function buildAnimations(): Animation[] {
  scene.clear();
  const square = new Square({ sideLength: 2.5, color: BLUE, fillOpacity: 0.5 });
  const circle = new Circle({ radius: 1.25, color: GREEN, fillOpacity: 0.5 });
  return [
    new Create(square, { duration: 1 }),
    new Transform(square, circle, { duration: 1 }),
    new FadeOut(square, { duration: 1 }),
  ];
}

// Wire animations into the scene's timeline sequentially without
// starting playback. We avoid Succession here because it would call
// begin() on every child up front — Transform.begin() would then
// snapshot the fillOpacity that Create.begin() just zeroed, leaving
// the square invisible after the morph. Timeline drives each begin()
// lazily inside _updateAnimationsAtTime as forward-seeking crosses
// each animation's start time, which is what GifExporter does.
function installTimeline(anims: Animation[]): number {
  scene.add(anims[0].mobject);
  const timeline = new Timeline();
  for (const anim of anims) timeline.add(anim, ">");
  scene.setTimeline(timeline);
  return timeline.getDuration();
}

// Play animation
document.getElementById("playBtn")!.addEventListener("click", async () => {
  if (isAnimating) return;
  isAnimating = true;
  setButtonsDisabled(true);

  for (const anim of buildAnimations()) {
    await scene.play(anim);
  }

  isAnimating = false;
  setButtonsDisabled(false);
});

// Export GIF
document.getElementById("exportGifBtn")!.addEventListener("click", async () => {
  if (isAnimating) return;
  isAnimating = true;
  setButtonsDisabled(true);

  try {
    const duration = installTimeline(buildAnimations());
    await scene.export("animation.gif", {
      fps: 15,
      quality: 10,
      duration,
      onProgress: (p) => showProgress(p, "Exporting GIF"),
    });
  } catch (err) {
    console.error("GIF export failed:", err);
  } finally {
    hideProgress();
    isAnimating = false;
    setButtonsDisabled(false);
  }
});

// Export WebM
document.getElementById("exportWebmBtn")!.addEventListener(
  "click",
  async () => {
    if (isAnimating) return;
    isAnimating = true;
    setButtonsDisabled(true);

    try {
      const duration = installTimeline(buildAnimations());
      await scene.export("animation.webm", {
        fps: 30,
        duration,
        onProgress: (p) => showProgress(p, "Exporting WebM"),
      });
    } catch (err) {
      console.error("WebM export failed:", err);
    } finally {
      hideProgress();
      isAnimating = false;
      setButtonsDisabled(false);
    }
  },
);

// Reset
document.getElementById("resetBtn")!.addEventListener("click", () => {
  scene.clear();
});

// Embed mode: hide controls, auto-play, loop
if (new URLSearchParams(window.location.search).has("embed")) {
  document
    .querySelectorAll(".controls, .buttons, h1, #status")
    .forEach((el) => ((el as HTMLElement).style.display = "none"));
  document.documentElement.style.cssText =
    "margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000";
  document.body.style.cssText =
    "margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center";
  const cont = document.getElementById("container");
  if (cont) {
    cont.style.cssText =
      "border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center";
  }
  const playBtn = document.getElementById("playBtn");
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!(playBtn as HTMLButtonElement).disabled) {
        setTimeout(() => playBtn.click(), 2000);
      }
    }).observe(playBtn, { attributes: true, attributeFilter: ["disabled"] });
  }
}

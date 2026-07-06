import {
  BLUE,
  Circle,
  GREEN,
  makeClickable,
  makeDraggable,
  ORANGE,
  PINK,
  PURPLE,
  RED,
  Scene,
  Square,
  TEAL,
  Text,
  type Vector3Tuple,
  WHITE,
  YELLOW,
} from "../src/index.ts";

const container = document.getElementById("container");
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: "#000000",
});

// Colors the clickable circle cycles through on each click.
const PALETTE = [BLUE, GREEN, YELLOW, RED, PURPLE, ORANGE, TEAL, PINK];

// Interaction handles are disposed before each replay so their canvas/window
// event listeners don't accumulate across runs.
let handles: Array<{ dispose: () => void }> = [];

function disposeHandles(): void {
  handles.forEach((h) => h.dispose());
  handles = [];
}

let isAnimating = false;

document.getElementById("playBtn").addEventListener("click", async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById("playBtn").disabled = true;

  try {
    disposeHandles();
    scene.clear();

    const title = new Text({
      text: "Click the circle  •  Drag the square",
      fontSize: 26,
      color: WHITE,
    });
    title.moveTo([0, 2.8, 0]);

    // --- Clickable: a discrete tap action. The circle never moves. ---
    let colorIndex = 0;
    let clickCount = 0;

    const circle = new Circle({ radius: 0.7, color: BLUE, fillOpacity: 0.9 });
    circle.moveTo([-2.5, 0.3, 0]);

    const counter = new Text({ text: "Clicks: 0", fontSize: 22, color: WHITE });
    counter.moveTo([-2.5, -1.6, 0]);

    // --- Draggable: a continuous gesture that repositions the square. ---
    const square = new Square({
      sideLength: 1.3,
      color: GREEN,
      fillOpacity: 0.9,
    });
    square.moveTo([2.5, 0.3, 0]);

    const posLabel = new Text({
      text: "Square: (2.5, 0.3)",
      fontSize: 22,
      color: WHITE,
    });
    posLabel.moveTo([2.5, -1.6, 0]);

    const hint = new Text({
      text: "Double-click the circle to reset",
      fontSize: 18,
      color: "#888888",
    });
    hint.moveTo([0, -2.8, 0]);

    scene.add(title, circle, counter, square, posLabel, hint);
    scene.render();

    // Click → cycle color and bump the counter (the object stays put).
    // Double-click → reset to the initial state. Reset is idempotent because
    // browsers fire `click` events before `dblclick`.
    // This scene has no animation loop, so interaction callbacks must call
    // scene.render() to repaint after they mutate a mobject.
    handles.push(
      makeClickable(circle, scene, {
        onClick: () => {
          clickCount += 1;
          colorIndex = (colorIndex + 1) % PALETTE.length;
          circle.setColor(PALETTE[colorIndex]);
          counter.setText(`Clicks: ${clickCount}`);
          scene.render();
        },
        onDoubleClick: () => {
          clickCount = 0;
          colorIndex = 0;
          circle.setColor(BLUE);
          counter.setText("Clicks: 0");
          scene.render();
        },
      }),
    );

    // Drag → reposition the square and reflect its live position in the label.
    handles.push(
      makeDraggable(square, scene, {
        onDrag: (_mobject, position: Vector3Tuple) => {
          posLabel.setText(
            `Square: (${position[0].toFixed(1)}, ${position[1].toFixed(1)})`,
          );
          scene.render();
        },
      }),
    );
  } catch (e) {
    console.error("ERROR:", e.message, e.stack);
  }

  isAnimating = false;
  document.getElementById("playBtn").disabled = false;
});

document.getElementById("resetBtn").addEventListener("click", () => {
  disposeHandles();
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
    setTimeout(() => (playBtn as HTMLButtonElement).click(), 500);
  }
}

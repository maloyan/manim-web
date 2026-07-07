import {
  BLACK,
  BLUE,
  Circle,
  GREEN,
  RED,
  ReplacementTransform,
  Scene,
  Square,
  Transform,
  YELLOW,
} from "../src/index.ts";

const container = document.getElementById("container") as HTMLElement;
const status = document.getElementById("status") as HTMLPreElement;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let busy = false;

function log(msg: string) {
  status.textContent = `${msg}\n${status.textContent}`.slice(0, 4000);
}

function describe(label: string) {
  const names: string[] = [];
  for (const m of scene.mobjects) {
    names.push((m as { constructor: { name: string } }).constructor.name);
  }
  log(`${label}: scene has ${names.length} mobjects -> [${names.join(", ")}]`);
}

document.getElementById("playBtn")!.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  (document.getElementById("playBtn") as HTMLButtonElement).disabled = true;
  scene.clear();

  // Plain Transform: morphs visuals but the SOURCE stays in the scene.
  const a = new Circle({
    radius: 1.4,
    color: RED,
    fillOpacity: 0.9,
    strokeWidth: 6,
  }).shift([
    -3,
    0,
    0,
  ]);
  const aTarget = new Square({
    sideLength: 2.2,
    color: GREEN,
    fillOpacity: 0.9,
    strokeWidth: 6,
  }).shift([-3, 0, 0]);
  scene.add(a);
  describe("before Transform");
  await scene.play(new Transform(a, aTarget, { duration: 1.2 }));
  describe("after  Transform     ");

  await scene.wait(0.6);

  // ReplacementTransform: source removed, target added (issue #308 fix).
  const b = new Circle({
    radius: 1.4,
    color: BLUE,
    fillOpacity: 0.9,
    strokeWidth: 6,
  }).shift([
    3,
    0,
    0,
  ]);
  const bTarget = new Square({
    sideLength: 2.2,
    color: YELLOW,
    fillOpacity: 0.9,
    strokeWidth: 6,
  }).shift([3, 0, 0]);
  scene.add(b);
  describe("before ReplacementTx");
  await scene.play(new ReplacementTransform(b, bTarget, { duration: 1.2 }));
  describe("after  ReplacementTx");

  await scene.wait(0.8);

  busy = false;
  (document.getElementById("playBtn") as HTMLButtonElement).disabled = false;
});

document.getElementById("resetBtn")!.addEventListener("click", () => {
  scene.clear();
  status.textContent = "cleared.";
});

if (new URLSearchParams(window.location.search).has("embed")) {
  setTimeout(
    () => (document.getElementById("playBtn") as HTMLButtonElement).click(),
    400,
  );
}

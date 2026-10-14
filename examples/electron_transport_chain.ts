/**
 * Electron Transport Chain (oxidative phosphorylation).
 *
 * The scene draws the inner mitochondrial membrane as a lipid bilayer with
 * Complex I, II, III, IV, ATP synthase and the two mobile carriers (CoQ and
 * Cyt c) embedded in it. Click Play to run the flows in order:
 *   1. NADH and FADH2 give up electrons.
 *   2. Electrons hop I -> CoQ -> III -> Cyt c -> IV (MoveAlongPath).
 *   3. Each complex pumps protons up, out of the matrix.
 *   4. At Complex IV, 2H+ + 1/2 O2 + 2e- makes H2O.
 *   5. Protons flow down through ATP synthase and ADP becomes ATP.
 */
import {
  Scene,
  Membrane,
  ComplexBlob,
  Text,
  Dot,
  Arrow,
  CubicBezier,
  Line,
  VGroup,
  FadeIn,
  FadeOut,
  GrowArrow,
  Transform,
  MoveAlongPath,
  AnimationGroup,
  LaggedStart,
  Succession,
  type Mobject,
  type Animation,
} from '../src/index.ts';

type Pt = [number, number, number];

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 1280,
  height: 720,
  backgroundColor: '#0d1117',
});

let isAnimating = false;

// Layout, in scene units. The frame is 14 wide and 8 tall.
const TEXT_COLOR = '#E6EDF3';
const ELECTRON_COLOR = '#FFEB3B';
const PROTON_COLOR = '#FF5252';
const WATER_COLOR = '#4FC3F7';
const BLOB_Y = 0;

interface Spec {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: 'rounded' | 'ellipse';
  fontSize: number;
  /** True when the blob sits in a gap of the membrane. */
  embedded: boolean;
}

const SPECS: Spec[] = [
  {
    key: 'I',
    label: 'I',
    x: -5.7,
    y: BLOB_Y,
    width: 1.6,
    height: 1.7,
    color: '#E57373',
    shape: 'rounded',
    fontSize: 34,
    embedded: true,
  },
  {
    key: 'II',
    label: 'II',
    x: -3.9,
    y: BLOB_Y,
    width: 1.2,
    height: 1.4,
    color: '#FFB74D',
    shape: 'rounded',
    fontSize: 34,
    embedded: true,
  },
  {
    key: 'CoQ',
    label: 'CoQ',
    x: -2.7,
    y: BLOB_Y,
    width: 0.8,
    height: 0.5,
    color: '#FFF176',
    shape: 'ellipse',
    fontSize: 16,
    embedded: true,
  },
  {
    key: 'III',
    label: 'III',
    x: -1.2,
    y: BLOB_Y,
    width: 1.5,
    height: 1.7,
    color: '#81C784',
    shape: 'rounded',
    fontSize: 34,
    embedded: true,
  },
  {
    key: 'Cytc',
    label: 'Cyt c',
    x: 0.2,
    y: 0.78,
    width: 0.9,
    height: 0.55,
    color: '#F06292',
    shape: 'ellipse',
    fontSize: 16,
    embedded: false,
  },
  {
    key: 'IV',
    label: 'IV',
    x: 1.6,
    y: BLOB_Y,
    width: 1.4,
    height: 1.7,
    color: '#64B5F6',
    shape: 'rounded',
    fontSize: 34,
    embedded: true,
  },
  {
    key: 'ATP',
    label: 'ATP synthase',
    x: 4.8,
    y: BLOB_Y,
    width: 1.9,
    height: 1.9,
    color: '#BA68C8',
    shape: 'rounded',
    fontSize: 20,
    embedded: true,
  },
];

function label(text: string, at: Pt, fontSize = 22, color = TEXT_COLOR): Text {
  const t = new Text({ text, fontSize, color });
  t.moveTo(at);
  return t;
}

function electronDot(at: Pt): VGroup {
  const glow = new Dot({ point: at, radius: 0.2, color: ELECTRON_COLOR, fillOpacity: 0.28 });
  const core = new Dot({ point: at, radius: 0.09, color: ELECTRON_COLOR, fillOpacity: 1 });
  return new VGroup(glow, core);
}

function protonDot(at: Pt): Dot {
  return new Dot({ point: at, radius: 0.08, color: PROTON_COLOR, fillOpacity: 1 });
}

/** A curved path between two points that bows up by `lift`. */
function hopPath(from: Pt, to: Pt, lift: number): CubicBezier {
  const dx = to[0] - from[0];
  return new CubicBezier({
    points: [
      from,
      [from[0] + dx / 3, from[1] + lift, 0],
      [from[0] + (2 * dx) / 3, to[1] + lift, 0],
      to,
    ],
    color: ELECTRON_COLOR,
    strokeWidth: 0,
  });
}

function straight(from: Pt, to: Pt): Line {
  return new Line({ start: from, end: to, strokeWidth: 0 });
}

/**
 * Pump `count` protons up through the complex at x, with an arrow and a
 * count label. Each proton moves along a vertical line from the matrix side
 * to the intermembrane space.
 */
function pumpAnimation(x: number, count: number): { add: Mobject[]; animation: Animation } {
  const spread = 0.22;
  const dots: Dot[] = [];
  const moves: Animation[] = [];
  for (let i = 0; i < count; i++) {
    const dx = (i - (count - 1) / 2) * spread;
    const dot = protonDot([x + dx, -1.05, 0]);
    dots.push(dot);
    moves.push(
      new MoveAlongPath(dot, {
        path: straight([x + dx, -1.05, 0], [x + dx, 1.45 + (i % 2) * 0.25, 0]),
        duration: 0.9,
      }),
    );
  }
  const arrow = new Arrow({
    start: [x, 1.0, 0],
    end: [x, 1.95, 0],
    color: PROTON_COLOR,
    strokeWidth: 4,
    tipLength: 0.22,
  });
  const text = label(`${count}H⁺`, [x, 2.3, 0], 26, PROTON_COLOR);
  return {
    add: dots,
    animation: new AnimationGroup([
      new LaggedStart(moves, { lagRatio: 0.25 }),
      new Succession([
        new GrowArrow(arrow, { duration: 0.4 }),
        new FadeIn(text, { duration: 0.4 }),
      ]),
    ]),
  };
}

document.getElementById('playBtn')!.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  scene.clear();

  const spec = (key: string) => SPECS.find((s) => s.key === key)!;
  const at = (key: string, dy = 0): Pt => [spec(key).x, spec(key).y + dy, 0];

  // Membrane with a gap for each embedded complex.
  const membrane = new Membrane({
    length: 14,
    spacing: 0.25,
    headRadius: 0.09,
    tailLength: 0.28,
    coreGap: 0.08,
  });
  for (const s of SPECS.filter((p) => p.embedded)) {
    membrane.gapAt(s.x - s.width / 2 - 0.08, s.x + s.width / 2 + 0.08);
  }

  const blobs = new Map<string, ComplexBlob>();
  for (const s of SPECS) {
    blobs.set(
      s.key,
      new ComplexBlob({
        label: s.label,
        width: s.width,
        height: s.height,
        shape: s.shape,
        color: s.color,
        fontSize: s.fontSize,
        center: [s.x, s.y, 0],
        glow: true,
      }),
    );
  }

  const title = label('Electron Transport Chain', [0, 3.5, 0], 38);
  const imsLabel = label('Intermembrane space', [-5.3, 3.0, 0], 20, '#8B98A5');
  const matrixLabel = label('Matrix', [-6.3, -1.6, 0], 20, '#8B98A5');

  // Substrate and product labels, on the matrix side.
  const nadh = label('NADH', [-6.4, -2.4, 0]);
  const nad = label('NAD⁺ + 2H⁺', [-5.0, -3.3, 0]);
  const fadh2 = label('FADH₂', [-3.6, -2.4, 0]);
  const fad = label('FAD + 2H⁺', [-2.4, -3.3, 0]);
  const o2 = label('½O₂ + 2H⁺', [0.7, -2.4, 0]);
  const water = label('H₂O', [2.7, -2.4, 0], 26, WATER_COLOR);
  const adp = label('ADP + Pᵢ', [4.0, -2.4, 0]);
  const atp = label('ATP', [5.7, -2.4, 0], 26, '#FFD54F');
  const eLabel = label('2e⁻', [-6.55, 0.0, 0], 22, ELECTRON_COLOR);

  const inArrow = (from: Pt, to: Pt) =>
    new Arrow({ start: from, end: to, color: '#9AA7B4', strokeWidth: 3, tipLength: 0.2 });
  const nadhIn = inArrow([-6.3, -2.1, 0], [-6.0, -0.95, 0]);
  const nadOut = inArrow([-5.4, -0.95, 0], [-5.1, -2.95, 0]);
  const fadhIn = inArrow([-3.7, -2.1, 0], [-3.9, -0.85, 0]);
  const fadOut = inArrow([-3.5, -0.85, 0], [-2.6, -2.95, 0]);
  const o2In = inArrow([0.9, -2.1, 0], [1.3, -0.95, 0]);
  const h2oOut = inArrow([1.9, -0.95, 0], [2.5, -2.1, 0]);
  const adpIn = inArrow([4.1, -2.1, 0], [4.4, -1.1, 0]);
  const atpOut = inArrow([5.3, -1.1, 0], [5.6, -2.1, 0]);

  // 1. Scene setup.
  await scene.play(new FadeIn(membrane, { duration: 1.2 }), new FadeIn(title, { duration: 1.2 }));
  await scene.play(
    new LaggedStart(
      SPECS.map((s) => new FadeIn(blobs.get(s.key)!, { duration: 0.6 })),
      { lagRatio: 0.35 },
    ),
  );
  await scene.play(new FadeIn(imsLabel), new FadeIn(matrixLabel));
  await scene.wait(0.4);

  // 2. NADH and FADH2 donate electrons.
  await scene.play(
    new AnimationGroup([
      new Succession([
        new FadeIn(nadh, { duration: 0.4 }),
        new GrowArrow(nadhIn, { duration: 0.4 }),
      ]),
      new Succession([
        new FadeIn(fadh2, { duration: 0.4 }),
        new GrowArrow(fadhIn, { duration: 0.4 }),
      ]),
    ]),
  );
  await scene.play(
    new AnimationGroup([
      new Succession([
        new GrowArrow(nadOut, { duration: 0.4 }),
        new FadeIn(nad, { duration: 0.4 }),
      ]),
      new Succession([
        new GrowArrow(fadOut, { duration: 0.4 }),
        new FadeIn(fad, { duration: 0.4 }),
      ]),
    ]),
  );
  await scene.play(new FadeIn(eLabel, { duration: 0.4 }));

  // 3. Electrons hop through the chain. Complex II feeds CoQ too.
  const electron = electronDot(at('I'));
  const electronFromII = electronDot(at('II'));
  scene.add(electron, electronFromII);
  await scene.play(new FadeOut(eLabel, { duration: 0.3 }));

  await scene.play(
    new AnimationGroup([
      new MoveAlongPath(electron, { path: hopPath(at('I'), at('CoQ'), 0.5), duration: 1.4 }),
      new MoveAlongPath(electronFromII, {
        path: hopPath(at('II'), at('CoQ'), 0.35),
        duration: 0.8,
      }),
    ]),
  );
  await scene.play(new FadeOut(electronFromII, { duration: 0.3 }));

  // Complex I pumps 4H+.
  const pumpI = pumpAnimation(spec('I').x, 4);
  scene.add(...pumpI.add);
  await scene.play(pumpI.animation);

  await scene.play(
    new MoveAlongPath(electron, { path: hopPath(at('CoQ'), at('III'), 0.45), duration: 1.0 }),
  );
  const pumpIII = pumpAnimation(spec('III').x, 4);
  scene.add(...pumpIII.add);
  await scene.play(pumpIII.animation);

  await scene.play(
    new MoveAlongPath(electron, { path: hopPath(at('III'), at('Cytc'), 0.3), duration: 1.0 }),
  );
  await scene.play(
    new MoveAlongPath(electron, { path: hopPath(at('Cytc'), at('IV'), 0.3), duration: 1.0 }),
  );

  // 4. Complex IV: protons pumped, then 2H+ + 1/2 O2 + 2e- -> H2O.
  const pumpIV = pumpAnimation(spec('IV').x, 2);
  scene.add(...pumpIV.add);
  await scene.play(pumpIV.animation);

  await scene.play(new FadeIn(o2, { duration: 0.4 }), new GrowArrow(o2In, { duration: 0.4 }));
  await scene.play(new FadeOut(electron, { duration: 0.4 }));
  await scene.play(
    new Transform(o2, water, { duration: 1.0 }),
    new GrowArrow(h2oOut, { duration: 0.6 }),
  );
  await scene.wait(0.4);

  // 5. ATP synthase: protons flow down, ADP becomes ATP.
  const flowDots = [-0.35, 0, 0.35].map((dx) => protonDot([spec('ATP').x + dx, 1.55, 0]));
  scene.add(...flowDots);
  await scene.play(new FadeIn(adp, { duration: 0.4 }), new GrowArrow(adpIn, { duration: 0.4 }));
  const down = flowDots.map(
    (dot, i) =>
      new MoveAlongPath(dot, {
        path: straight(
          [spec('ATP').x + (i - 1) * 0.35, 1.55, 0],
          [spec('ATP').x + (i - 1) * 0.35, -1.25, 0],
        ),
        duration: 1.3,
      }),
  );
  await scene.play(
    new Succession([
      new LaggedStart(down, { lagRatio: 0.3 }),
      new AnimationGroup([
        new Transform(adp, atp, { duration: 0.9 }),
        new GrowArrow(atpOut, { duration: 0.6 }),
        new AnimationGroup(flowDots.map((d) => new FadeOut(d, { duration: 0.6 }))),
      ]),
    ]),
  );

  isAnimating = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls and autoplay.
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls')
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));
  setTimeout(() => document.getElementById('playBtn')?.click(), 300);
}

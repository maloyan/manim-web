// Cradle, rolling disk, two springs and a pendulum, driven by an exact Lagrangian simulation.
// Model and equations: thoughts/research/2026-10-14-cradle-eom.md
// Every moving mobject is set from the simulation state in one Scene updater.
import {
  Scene,
  AnnularSector,
  Arc,
  ArcBrace,
  Arrow,
  BraceBetweenPoints,
  BraceLabel,
  Circle,
  DashedLine,
  Dot,
  Line,
  MathTex,
  Spring,
  VGroup,
  createCradleSystem,
  BLACK,
  BLUE,
  GREEN,
  ORANGE,
  RED,
  WHITE,
  YELLOW,
  type CradleSystem,
  type Mobject,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

/** Scene units per model meter. */
const S = 2.25;
/** Scene position of the cradle pivot. */
const PIVOT: [number, number] = [0, 2.0];
/** Simulation seconds per scene updater substep. */
const SUBSTEP = 0.002;
const RUN_SECONDS = 24;

const PARAMS = {
  innerRadius: 1,
  outerRadius: 1.3,
  halfOpening: 1.0,
  cradleMass: 2,
  disk: { mass: 0.5, radius: 0.42 },
  springStiffness: 40,
  springAnchorOffset: 1.8,
  groundDrop: 2.2,
  gravity: 9.81,
  pendulum: {
    lengths: [0.5, 0.4, 0.3] as [number, number, number],
    linkDensity: 0.2,
    pointMass: 0.3,
    pointSpacing: 0.5,
  },
};

const INITIAL = {
  theta: 0.3,
  alpha: 0.15,
  beta: [0.25, -0.2, 0.3] as [number, number, number],
};

const GROUND_Y = PIVOT[1] - PARAMS.groundDrop * S;

type P2 = [number, number];
/** Model point to scene point. */
const toScene = (p: P2): [number, number, number] => [PIVOT[0] + S * p[0], PIVOT[1] + S * p[1], 0];
/** Point in the cradle frame (scene units from the pivot) to scene point. */
const cradleToScene = (theta: number, p: P2): [number, number, number] => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [PIVOT[0] + c * p[0] - s * p[1], PIVOT[1] + s * p[0] + c * p[1], 0];
};
/** Unit vector for an angle measured counter clockwise from straight down. */
const down = (a: number): P2 => [Math.sin(a), -Math.cos(a)];

/** Set a mobject pose directly: position, then rotation about its own origin. */
function setPose(mob: Mobject, x: number, y: number, angle: number): void {
  mob.position.set(x, y, 0);
  mob.rotation.z = angle;
  mob._markDirty();
}

async function tex(latex: string, color: string = WHITE): Promise<MathTex> {
  const m = new MathTex({ latex, color, height: 0.34 });
  await m.waitForRender();
  return m;
}

async function buildScene(sim: CradleSystem) {
  const ri = PARAMS.innerRadius * S;
  const ro = PARAMS.outerRadius * S;
  const bs = PARAMS.halfOpening;
  const rd = PARAMS.disk.radius * S;

  // Ground line with hatching, and the two spring anchors.
  const groundLine = new Line({ start: [-6, GROUND_Y, 0], end: [6, GROUND_Y, 0], color: WHITE });
  const hatch = new VGroup();
  for (let x = -6; x <= 6; x += 0.3) {
    hatch.add(
      new Line({
        start: [x, GROUND_Y, 0],
        end: [x - 0.2, GROUND_Y - 0.2, 0],
        color: WHITE,
        strokeWidth: 1.5,
      }),
    );
  }
  const anchorX = PARAMS.springAnchorOffset * S;
  const anchors = [
    new Dot({ point: [anchorX, GROUND_Y, 0], radius: 0.07, color: WHITE }),
    new Dot({ point: [-anchorX, GROUND_Y, 0], radius: 0.07, color: WHITE }),
  ];

  // Cradle group: annular sector, axis, radius leaders and the opening arc.
  // Local frame: origin at the pivot, rotated by theta.
  const sector = new AnnularSector({
    innerRadius: ri,
    outerRadius: ro,
    startAngle: -Math.PI / 2 - bs,
    angle: 2 * bs,
    color: BLUE,
    fillOpacity: 0.45,
  });
  const axis = new DashedLine({ start: [0, 0, 0], end: [0, -ro - 0.25, 0], color: WHITE });
  const aOut = -Math.PI / 2 + 0.75;
  const aIn = -Math.PI / 2 - 0.6;
  const leaderOut = new Arrow({
    start: [0, 0, 0],
    end: [ro * Math.cos(aOut), ro * Math.sin(aOut), 0],
    color: YELLOW,
    strokeWidth: 2,
    tipLength: 0.15,
  });
  const leaderIn = new Arrow({
    start: [0, 0, 0],
    end: [ri * Math.cos(aIn), ri * Math.sin(aIn), 0],
    color: GREEN,
    strokeWidth: 2,
    tipLength: 0.15,
  });
  const openArc = new Arc({
    radius: ro + 0.3,
    startAngle: -Math.PI / 2,
    angle: bs,
    color: ORANGE,
    strokeWidth: 2,
  });
  const openBrace = new ArcBrace({ arc: openArc, direction: 1, buff: 0.08, color: ORANGE });
  const cradle = new VGroup(sector, axis, leaderOut, leaderIn, openArc, openBrace);

  // Disk group: circle plus a spoke that shows the spin. Local origin is the disk center.
  const diskCircle = new Circle({ radius: rd, color: RED, fillOpacity: 0.3 });
  const spoke = new Line({ start: [0, 0, 0], end: [rd, 0, 0], color: RED, strokeWidth: 3 });
  const disk = new VGroup(diskCircle, spoke);

  // Springs, one per side, stretched in the updater.
  const springs = [
    new Spring({ coils: 9, width: 0.28, leadLength: 0.3, color: WHITE, strokeWidth: 2.5 }),
    new Spring({ coils: 9, width: 0.28, leadLength: 0.3, color: WHITE, strokeWidth: 2.5 }),
  ];

  // Pendulum: three rods, an axle and two point masses.
  const rods = [0, 1, 2].map(() => new Line({ color: WHITE, strokeWidth: 4 }));
  const axle = new Line({ color: WHITE, strokeWidth: 3 });
  const masses = [
    new Dot({ radius: 0.12, color: ORANGE }),
    new Dot({ radius: 0.12, color: ORANGE }),
  ];
  const widthBrace = new BraceBetweenPoints({ start: [0, 0, 0], end: [1, 0, 0] });

  // Static references: vertical for theta, gravity arrow, distance d_s.
  const vertical = new DashedLine({
    start: [PIVOT[0], PIVOT[1], 0],
    end: [PIVOT[0], PIVOT[1] - ro - 0.5, 0],
    color: WHITE,
  });
  const thetaArc0 = (theta: number) =>
    new Arc({
      radius: 0.6,
      startAngle: -Math.PI / 2,
      angle: Math.abs(theta) < 1e-3 ? 1e-3 : theta,
      center: [PIVOT[0], PIVOT[1], 0],
      color: YELLOW,
      strokeWidth: 3,
    });
  const thetaArc = thetaArc0(INITIAL.theta);
  const gravityArrow = new Arrow({
    start: [5.4, 2.2, 0],
    end: [5.4, 0.7, 0],
    color: WHITE,
    strokeWidth: 4,
  });
  const dsLine = new Line({
    start: [PIVOT[0], GROUND_Y, 0],
    end: [anchorX, GROUND_Y, 0],
    color: WHITE,
    strokeWidth: 1.5,
  });

  // LaTeX labels.
  const [lRo, lRi, lR, lTheta, lBetaS, lDs, lWp, lK, lG, lM, lMr, lMp] = await Promise.all([
    tex('R_o', YELLOW),
    tex('R_i', GREEN),
    tex('r', RED),
    tex('\\theta', YELLOW),
    tex('\\beta_s', ORANGE),
    tex('d_s'),
    tex('w_p', ORANGE),
    tex('k'),
    tex('g'),
    tex('M', BLUE),
    tex('m_r', RED),
    tex('m_p', ORANGE),
  ]);
  const dsBrace = new BraceLabel(dsLine, {
    label: lDs,
    direction: [0, -1, 0],
    buff: 0.12,
    labelBuff: 0.12,
  });
  lG.moveTo([5.75, 1.45, 0]);

  const sync = () => {
    const theta = sim.getTheta();

    // Cradle and its labels.
    setPose(cradle, PIVOT[0], PIVOT[1], theta);
    lRo.moveTo(
      cradleToScene(theta, [
        (ro * 0.55 + 0.25) * Math.cos(aOut) + 0.28,
        ro * 0.55 * Math.sin(aOut),
      ]),
    );
    lRi.moveTo(cradleToScene(theta, [ri * 0.55 * Math.cos(aIn) - 0.28, ri * 0.55 * Math.sin(aIn)]));
    lBetaS.moveTo(
      cradleToScene(theta, [
        (ro + 0.75) * Math.cos(-Math.PI / 2 + bs / 2),
        (ro + 0.75) * Math.sin(-Math.PI / 2 + bs / 2),
      ]),
    );
    lM.moveTo(
      cradleToScene(theta, [
        ((ri + ro) / 2) * Math.cos(-Math.PI / 2 - 0.75),
        ((ri + ro) / 2) * Math.sin(-Math.PI / 2 - 0.75),
      ]),
    );

    // Disk, spoke label r, mass label m_r.
    const d = sim.getDiskPose();
    if (d) {
      const c = toScene(d.center);
      setPose(disk, c[0], c[1], d.spin);
      const sx = Math.cos(d.spin);
      const sy = Math.sin(d.spin);
      lR.moveTo([c[0] + sx * rd * 0.5 - sy * 0.2, c[1] + sy * rd * 0.5 + sx * 0.2, 0]);
      lMr.moveTo([c[0] + rd + 0.34, c[1] + rd * 0.7, 0]);
    }

    // Springs, theta marker and label.
    const ends = sim.getSpringEndpoints();
    springs[0].setEndpoints(toScene(ends[0].anchor), toScene(ends[0].attach));
    springs[1].setEndpoints(toScene(ends[1].anchor), toScene(ends[1].attach));
    const mid = toScene([
      (ends[0].anchor[0] + ends[0].attach[0]) / 2,
      (ends[0].anchor[1] + ends[0].attach[1]) / 2,
    ]);
    lK.moveTo([mid[0] + 0.35, mid[1] - 0.1, 0]);
    thetaArc.become(thetaArc0(theta));
    const half = down(theta / 2);
    lTheta.moveTo([PIVOT[0] + 0.95 * half[0], PIVOT[1] + 0.95 * half[1], 0]);

    // Pendulum.
    const joints = sim.getLinkJoints();
    const pm = sim.getPointMasses();
    if (joints && pm) {
      for (let i = 0; i < 3; i++) {
        rods[i].setStart(toScene(joints[i])).setEnd(toScene(joints[i + 1]));
      }
      const m0 = toScene(pm[0]);
      const m1 = toScene(pm[1]);
      axle.setStart(m0).setEnd(m1);
      masses[0].moveTo(m0);
      masses[1].moveTo(m1);
      const beta3 = sim.getBetas()[2];
      const dir = down(beta3);
      widthBrace.become(
        new BraceBetweenPoints({
          start: m1,
          end: m0,
          direction: [dir[0], dir[1], 0],
          buff: 0.12,
          color: ORANGE,
        }),
      );
      lWp.moveTo([Math.min(m0[0], m1[0]) - 0.42, (m0[1] + m1[1]) / 2 - 0.05, 0]);
      lMp.moveTo([Math.max(m0[0], m1[0]) + 0.4, m0[1] + 0.05, 0]);
    }
  };
  sync();

  scene.add(
    hatch,
    groundLine,
    ...anchors,
    dsLine,
    dsBrace,
    vertical,
    gravityArrow,
    ...springs,
    cradle,
    disk,
    ...rods,
    axle,
    ...masses,
    widthBrace,
    thetaArc,
    lRo,
    lRi,
    lR,
    lTheta,
    lBetaS,
    lWp,
    lK,
    lG,
    lM,
    lMr,
    lMp,
  );

  // One updater drives the whole scene. The step is fixed, so the run is deterministic.
  const driver = new VGroup();
  driver.addUpdater((_m, dt) => {
    const t = Math.min(dt, 0.05);
    const n = Math.max(1, Math.ceil(t / SUBSTEP));
    for (let i = 0; i < n; i++) sim.step(t / n);
    sync();
  });
  scene.add(driver);
  return driver;
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  const sim = createCradleSystem(PARAMS, INITIAL);
  await buildScene(sim);
  await scene.wait(RUN_SECONDS);

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.clear();
});

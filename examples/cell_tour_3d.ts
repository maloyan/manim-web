/**
 * A narrated 3D tour of a human cell, made only with the public API: the 3D
 * cell kit gives the cell and its processes, `CellTour` (an `ExplainerTour`
 * that keeps each focus stop clean) gives the camera, dim, captions and
 * callouts. Each stop starts its narration clip with `narrate()` and lasts at
 * least as long as the clip. Plain stop data is in `cell_tour_3d.data.ts`.
 *
 *   npm run render -- cell_tour_3d --width 1080 --height 1080 --fps 30 --out cell.mp4
 *
 * Clips: `examples/audio/cell_tour/generate.mjs` (local Kokoro-82M voice, text in `lines.json`).
 */
import {
  ThreeDScene,
  Cell3D,
  Organelle3D,
  Indicate,
  interpolateColor,
  CellTour,
  CellMembrane3D,
  Ribosome3D,
  Create3D,
  SweepReveal3D,
  GrowAlongPath3D,
  CameraFocus,
  Callout3D,
  Create,
  Write,
  FadeIn,
  FadeOut,
  LaggedStart,
  Rectangle,
  narrate,
  registerRender,
  exportMRNA,
  translateRibosome,
  vesicleTransport,
  releaseATP,
  moveCargoAlongMicrotubule,
  digestCargo,
  peroxisomeReaction,
  ANIMAL_CELL_PRESET,
  linear,
  smooth,
  addVec,
  scaleVec,
  normalizeVec,
  subVec,
  type TourStop,
  type Vector3Tuple,
  type Nucleus3D,
  type Mitochondrion3D,
  type Cytoskeleton3D,
  type Vesicle3D,
} from '../src/index.ts';
import {
  BG,
  TEXT,
  DIM_TEXT,
  LEGEND,
  ROW,
  STOPS,
  UM,
  scaleOverlay,
  bilayerCloseUp,
  tissueField,
  txt,
} from './cell_tour_3d.data.ts';

// ── scene and cell ───────────────────────────────────────────────────────
const scene = new ThreeDScene(document.getElementById('container')!, {
  width: 1080,
  height: 1080,
  frameWidth: 14,
  frameHeight: 14,
  backgroundColor: BG,
  fov: 30,
});
scene.lighting.addAmbient({ intensity: 0.55 });

const SEED = 3;
// The cut-open mitochondrion starts under a lid; the cristae stop opens it.
const organelles = ANIMAL_CELL_PRESET.map((o) =>
  o.name === 'mitochondrion' ? { ...o, options: { lid: true } } : o,
);
const cell = new Cell3D({ radius: 4, organelles, cytoskeleton: true, seed: SEED });
const org = (id: string) => cell.getOrganelle(id) as Organelle3D;
const kinds = (kind: string) => cell.getOrganellesOfKind(kind);
const { membrane } = cell;
const nucleus = org('nucleus') as Nucleus3D;
const mito = org('mitochondrion') as Mitochondrion3D;
const cyto = org('cytoskeleton') as Cytoskeleton3D;
const [golgi, roughER, centrosome] = ['golgi apparatus', 'rough er', 'centrosome'].map(org);

// The cytoskeleton waits for its own stops: microtubules first, then the rest.
const actin = cyto.getPart('actin')!;
const filaments = cyto.getPart('intermediateFilaments')!;
cyto.remove(actin);
cyto.remove(filaments);
cell.remove(cyto);

// The closed cell of the opening: the same membrane, not cut open.
const closed = new CellMembrane3D({ radius: 4, cutaway: 'none', seed: SEED });
closed.scale(1.005);

// One ribosome at close range, where the messenger RNA leaves the nucleus.
const pore = nucleus.getAnchor('pore')!;
const core = nucleus.getAnchor('center')!;
const out = normalizeVec([...subVec(pore, core).slice(0, 2), 0] as Vector3Tuple);
const ribosome = new Ribosome3D({ size: 0.42, peptide: 12, shownBeads: 0 });
ribosome.rotate(Math.atan2(out[1], out[0]), { axis: [0, 0, 1] });
ribosome.moveTo(addVec(pore, scaleVec(1.9, out), [0, 0, 0.35]));

const overlay = await scaleOverlay();
scene.markFixedInFrame(...overlay.all);
const tissue = tissueField();

// ── narration and the stop runner ────────────────────────────────────────
const clip = (id: string) => `./audio/cell_tour/${id}.mp3`;
let clipEnd = 0;
const tour = new CellTour(scene, cell, {
  framing: { runTime: 2.3, screenOffset: [0, 1.3] },
  caption: { maxWidth: 11.5, titleSize: 54, bodySize: 36, footnoteSize: 29 },
});

/** Start a narration clip now; the stop that follows lasts at least as long. */
async function say(id: string): Promise<void> {
  const track = await narrate(scene, clip(id), { wait: false });
  clipEnd = track.startTime + track.duration;
}

/** Hold until the clip ends (plus a breath), with a slow drift so the frame never freezes. */
async function settle(pad = 0.35): Promise<void> {
  const rest = clipEnd + pad - scene.audioManager.timelineNow();
  if (rest < 0.05) return;
  const cam = scene.getCameraState();
  await scene.play(
    new CameraFocus(scene, cam.lookAt, {
      distance: cam.distance * (1 - 0.012 * rest),
      theta: cam.theta + 0.025 * rest,
      runTime: rest,
      rateFunc: linear,
    }),
  );
}

/** Callout label size of the whole tour. */
const LABEL = { fontSize: 38 };

/** One tour stop: its clip, the CellTour composition (dim, camera, caption, callouts), the hold. */
async function stop(id: string, s: TourStop): Promise<void> {
  await say(id);
  const full = { ...STOPS[id], ...s };
  const callouts = full.callouts?.map((c) => ({ ...LABEL, ...c }));
  // Indicate an organelle as its name is spoken (not a point, not the whole cell).
  const t = full.target;
  const glow = t instanceof Organelle3D && t !== cell;
  const color = glow ? interpolateColor(t.getMainColor(), '#ffffff', 0.55) : undefined;
  const emphasis = full.emphasis ?? (glow ? new Indicate(t, { color, scaleFactor: 1.06 }) : 'none');
  await tour.playStop({ hold: 0, ...full, callouts, emphasis });
  await settle();
}

// ── the tour ─────────────────────────────────────────────────────────────
async function construct(s: ThreeDScene): Promise<void> {
  const audio = s.audioManager;
  const music = await audio.addSound(clip('music'), {
    ...{ time: 0, gain: 0.13, loop: true, duration: 600, fadeIn: 2 },
  });
  s.setCameraOrientation(1.0, -1.2, 22);

  // 1. One cell, alone.
  s.add(closed);
  await say('intro');
  await s.play(
    new Create3D(closed, { duration: 2 }),
    tour.card.show({ title: 'A single human cell', style: 'headline' }),
  );
  await settle(0.3);

  // 2. Its size: the camera rises and the cell lands in the first slot of five across a hair.
  await say('scale');
  await s.play(
    new CameraFocus(s, [0, 0, 0], {
      ...{ distance: 125, phi: 0.02, theta: -Math.PI / 2, runTime: 2.4 },
      screenOffset: [-40 * UM, ROW],
    }),
    tour.card.update({ title: 'One hair is five cells wide', style: 'headline' }),
  );
  const { hair, ruler, unit, cells, brace, size, label } = overlay;
  const draw = [hair, ruler, ...cells].map((m) => new Create(m));
  await s.play(new LaggedStart([...draw, new FadeIn(unit)], { lagRatio: 0.25 }));
  await s.play(new Create(brace), new Write(size), new Write(label));
  await settle(0.4);

  // 3. The lid sweeps away, and the organelles build one kind at a time.
  await say('open');
  s.add(cell);
  const order = ['nucleus', 'rough er', 'smooth er', 'golgi apparatus', 'centrosome'];
  order.push('mitochondrion', 'lysosome', 'peroxisome', 'vesicle', 'ribosome');
  const build = order.map(
    (kind) =>
      new LaggedStart(
        kinds(kind).map((o) => o.buildAnimation({ duration: 1.4 })),
        { lagRatio: 0.15 },
      ),
  );
  await s.play(
    new LaggedStart(
      [
        new LaggedStart(
          // FadeOut fades the root only: the ruler's ticks and numbers need their own.
          overlay.all.flatMap((m) => m.getFamily()).map((m) => new FadeOut(m, { duration: 0.8 })),
          { lagRatio: 0.03 },
        ),
        tour.card.hide(),
        new CameraFocus(s, [0, 0, 0], { distance: 19, phi: 0.95, theta: -1.2, runTime: 2.6 }),
        new SweepReveal3D(closed, {
          axis: [0, 0, 1],
          duration: 1.8,
          rateFunc: (t) => 1 - smooth(t),
        }),
        new LaggedStart(build, { lagRatio: 0.42 }),
      ],
      { lagRatio: 0.35 },
    ),
  );
  s.remove(closed);
  await settle(0.3);

  // 4. The organelles, one stop each.
  // The near cut wall, low three-quarter view. wall(az, k, z): a point on k x the inner wall.
  const [ra, rb, rc] = membrane.getInnerRadii();
  const cutZ = membrane.getCutHeight() ?? 0;
  const wall = (az: number, k: number, z: number): Vector3Tuple => {
    const f = Math.sqrt(Math.max(0, 1 - (z / (k * rc)) ** 2));
    return [k * ra * f * Math.cos(az), k * rb * f * Math.sin(az), z];
  };
  const rim = wall(-0.8, 1.02, cutZ);
  const closeUp = await bilayerCloseUp();
  await stop('membrane', {
    target: rim,
    keep: [membrane],
    framing: { distance: 8, phi: 1.2, theta: -0.4, screenOffset: [0.4, 1.0], runTime: 1.8 },
    caption: membrane.getCaption(),
    callouts: [
      { label: 'outside', anchor: wall(-0.55, 1.05, cutZ - 0.9), direction: [1, -0.4] },
      { label: 'inside', anchor: wall(-1.0, 0.8, cutZ - 0.3), direction: [1, 0.7] },
    ],
    inset: {
      title: 'Close-up: two layers of fat, one channel',
      anchor: rim,
      content: closeUp.content,
      ...{ position: [-3.5, 4.35], width: 6.2, height: 3.6, fontSize: 30 },
    },
    onEnter: (_sc, _stop, p) => p.play(closeUp.passThrough(3)),
  });
  await stop('nucleus', { target: nucleus });

  // A patch of the envelope, seen along its normal: a few pores fill the frame.
  const r0 = nucleus.getRadius();
  const strand = { beadRadius: 0.042 * r0, reach: 0.9 * r0 };
  const mrna = exportMRNA(nucleus, { scene: s, duration: 3.4, ...strand });
  const normal = normalizeVec(subVec(pore, core));
  await stop('pores', {
    target: pore,
    keep: [nucleus, ...mrna.actors],
    framing: {
      distance: 2.3,
      phi: Math.min(1.1, Math.acos(normal[2]) + 0.25),
      theta: Math.atan2(normal[1], normal[0]),
      screenOffset: [0, 0.9],
    },
    callouts: [{ label: 'nuclear pore', anchor: pore, direction: [1, 0.7] }],
    onEnter: async (sc, _stop, p) => {
      await p.play(mrna);
      sc.add(ribosome);
      await p.play(new Create3D(ribosome, { duration: 1 }));
    },
  });
  // A point target (the decoding site) frames the ribosome itself, not its long mRNA.
  const side = Math.atan2(out[1], out[0]) - Math.PI / 2;
  await stop('ribosome', {
    target: ribosome.getAnchor('decodingSite')!,
    keep: [ribosome],
    framing: { distance: 5, phi: 1.15, theta: side, screenOffset: [0, 0.6] },
    caption: ribosome.getCaption(),
    callouts: [
      { label: 'messenger RNA', anchor: ribosome.getAnchor('mRNA')!, direction: [1, -0.7] },
      { label: 'new protein', anchor: ribosome.getAnchor('peptide')!, direction: [-1, 0.5] },
    ],
    onEnter: (_sc, _stop, p) =>
      p.play(
        translateRibosome(ribosome, { duration: 4 }),
        ...mrna.actors.map((a) => new FadeOut(a)),
      ),
  });
  await stop('rough_er', { target: roughER });
  await stop('smooth_er', { target: org('smooth er') });

  // The secretory route ends where the line from the cell centre through the exit side meets the wall.
  const exit = golgi.getAnchor('exitSide')!;
  const k = 0.96 / Math.hypot(exit[0] / ra, exit[1] / rb);
  const transport = vesicleTransport({
    scene: s,
    from: roughER.getAnchor('sheet')!,
    golgiEntry: golgi.getAnchor('entrySide')!,
    golgiExit: exit,
    membrane: [exit[0] * k, exit[1] * k, exit[2]],
    duration: 5,
  });
  await stop('golgi', {
    target: golgi,
    keep: [golgi, ...transport.actors],
    onEnter: (_sc, _stop, p) => p.play(transport),
  });
  await stop('mitochondria', {
    target: mito,
    keep: kinds('mitochondrion'),
    caption: { ...mito.getCaption(), title: 'Mitochondria', footnote: undefined },
    // Whole capsules first; the cut one opens as the narration ends.
    onEnter: async (_sc, _stop, p) => {
      const wait = clipEnd - 1.6 - s.audioManager.timelineNow();
      if (wait > 0) await p.wait(wait);
      await p.play(mito.openAnimation({ duration: 1.8 }));
    },
  });
  const atp = releaseATP(mito, { scene: s, duration: 3.6 });
  await stop('cristae', {
    target: mito,
    keep: [mito, ...atp.actors],
    onEnter: (_sc, _stop, p) => p.play(atp),
  });

  // A vesicle stop frames the one with the most room round it (far from the
  // nucleus and from the wall), seen from above: nothing tall stands in front.
  const roomiest = (kind: string) => {
    const score = (o: Organelle3D) => {
      const c = o.getCenter();
      const fromNucleus = Math.hypot(...subVec(c, core)) - r0;
      return Math.min(fromNucleus, (1 - Math.hypot(c[0] / ra, c[1] / rb)) * ra);
    };
    return [...kinds(kind)].sort((p, q) => score(q) - score(p))[0] as Vesicle3D;
  };
  const lysosome = roomiest('lysosome');
  const digest = digestCargo(lysosome, { scene: s, duration: 4 });
  await stop('lysosomes', {
    target: lysosome,
    keep: [...kinds('lysosome'), ...digest.actors],
    caption: { ...lysosome.getCaption(), title: 'Lysosomes' },
    callouts: [
      ...(STOPS.lysosomes.callouts ?? []),
      { label: 'worn-out part', anchor: digest.anchors.fragment, direction: [1, -0.7] },
    ],
    onEnter: (_sc, _stop, p) => p.play(digest),
  });
  const peroxisome = roomiest('peroxisome');
  const reaction = peroxisomeReaction(peroxisome, { scene: s, duration: 3.8 });
  const molecule = (label: string, at: string, direction: [number, number]) => ({
    ...{ label, tex: true, anchor: reaction.anchors[at], direction, distance: 1.6 },
  });
  await stop('peroxisomes', {
    target: peroxisome,
    keep: [...kinds('peroxisome'), ...reaction.actors],
    caption: { ...peroxisome.getCaption(), title: 'Peroxisomes' },
    callouts: [
      molecule('\\mathrm{H_2O_2}', 'in', [-1, 0.5]),
      molecule('\\mathrm{H_2O}', 'water', [1, -0.5]),
      molecule('\\mathrm{O_2}', 'oxygen', [1, 0.6]),
    ],
    onEnter: (_sc, _stop, p) => p.play(reaction),
  });
  await stop('centrosome', { target: centrosome });

  // 5. The cytoskeleton grows, and cargo rides a microtubule.
  const tubeAnchor = cyto.getAnchor('microtubule')!;
  const cargo = moveCargoAlongMicrotubule(cyto, { scene: s, duration: 3.6, radius: 0.3 });
  // Our own callout: it may only appear once the tubes exist, so it is not a stop callout.
  const tube = new Callout3D({ scene: s, anchor: tubeAnchor, label: 'microtubule', ...LABEL });
  await stop('microtubules', {
    target: cell,
    keep: [cyto, centrosome, ...cargo.actors],
    onEnter: async (_sc, _stop, p) => {
      // Each legend row appears with its filaments: here the title and row 1.
      await p.play(tour.card.show(LEGEND));
      const tubes = new GrowAlongPath3D(cyto.getPart('microtubules')!, { duration: 1.6 });
      cell.add(cyto); // added with its grow, so it never shows before it
      await p.play(tour.card.revealNext(), tubes);
      await p.play(cargo, tube.create());
    },
  });
  // A point target (the cell centre) keeps the legend card; a mobject would swap in its caption.
  await stop('filaments', {
    target: [0, 0, 0],
    framing: { ...STOPS.filaments.framing, distance: s.getCameraState().distance },
    keep: [cyto],
    onEnter: async (_sc, _stop, p) => {
      await p.play(tube.uncreate());
      cyto.add(actin);
      await p.play(tour.card.revealNext(), new GrowAlongPath3D(actin, { duration: 1.8 }));
      cyto.add(filaments);
      await p.play(tour.card.revealNext(), new GrowAlongPath3D(filaments, { duration: 1.8 }));
    },
  });

  // 6. The full cell, a tissue of many cells, and one closing fact.
  await stop('crowded', { target: cell });
  await say('tissue');
  s.add(tissue.field);
  await s.play(
    new CameraFocus(s, [0, 0, 0], { distance: 120, phi: 0.55, theta: -1.4, runTime: 3.2 }),
    tissue.grow(3.2),
    tour.card.show(
      { title: 'Tissue', body: 'Cells join to build tissues, and tissues build organs.' },
      { reveal: 'all' },
    ),
  );
  await settle(0.2);

  await say('closing');
  const panel = new Rectangle({ width: 12.4, height: 4.6, color: TEXT, strokeWidth: 2 });
  panel.setFill(BG, 0.88).moveTo([0, -0.2, 0]);
  const fact = txt('30 trillion cells', 80, 0, 0.8);
  const sub = txt('in one adult human body', 48, 0, -0.45);
  const notes = [
    txt('About 84% of them are red blood cells,', 30, 0, -1.45, DIM_TEXT),
    txt('and a mature red blood cell has no nucleus.', 30, 0, -1.95, DIM_TEXT),
  ];
  s.markFixedInFrame(panel, fact, sub, ...notes);
  await s.play(
    tour.card.hide(),
    new Create(panel, { duration: 1 }),
    new Write(fact, { duration: 1.6 }),
  );
  await s.play(new Write(sub, { duration: 1 }), ...notes.map((n) => new FadeIn(n)));
  await settle(1.6);
  // The music bed loops: end it with the picture (the export mixes the tracks at the end).
  music.duration = audio.timelineNow();
  music.fadeOut = 2.5;
  tour.dispose();
}

registerRender(scene, { construct });

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  playBtn.disabled = true;
  await construct(scene);
  playBtn.disabled = false;
});
if (new URLSearchParams(location.search).has('embed')) setTimeout(() => playBtn.click(), 300);

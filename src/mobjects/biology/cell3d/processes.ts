/**
 * Process animations of the 3D cell kit.
 *
 * Each process is a pure function of alpha (built on `UpdateFromAlphaFunc`),
 * so the Player and the video export can seek it. The moving things (an mRNA
 * strand, vesicles, ATP, cargo) are "actors": instanced mobjects built ONCE
 * when the process is created and only moved per frame, never created in an
 * updater. Add them to the scene with `scene.add(...process.actors)`, or pass
 * `scene` in the options. At alpha 0 every actor is hidden (scale ~0).
 *
 * Paths are taken in world space when the process is created, so create the
 * process after the organelles are in place.
 */

import * as THREE from 'three';
import type { Mobject, Vector3Tuple } from '../../../core/Mobject';
import { Group } from '../../../core/Group';
import type { AnimationOptions } from '../../../animation/Animation';
import { UpdateFromAlphaFunc } from '../../../animation/UpdateFromAlphaFunc';
import { linear } from '../../../rate-functions';
import { InstancedMobject, type InstanceTransform } from '../../three-d/InstancedMobject';
import { addVec, dotVec, lengthVec, normalizeVec, scaleVec, subVec } from '../../../utils/vectors';
import { interpolateColor } from '../../../utils/color';
import {
  mergedSpheres,
  makeRng,
  pointAlong,
  polylineLength,
  smoothPolyline,
  sphereGeometry,
} from './geometry';
import { applyLook, kitColor } from './Organelle3D';
import type { CellLook } from './cell3dTypes';
import type { Ribosome3D } from './Ribosome3D';
import type { Nucleus3D } from './Nucleus3D';
import type { Mitochondrion3D } from './Mitochondrion3D';
import type { Cytoskeleton3D } from './Cytoskeleton3D';
import type { Vesicle3D } from './Vesicle3D';

/** Extra wiring of a {@link ProcessAnimation}. */
interface ProcessWiring {
  /** Puts back every organelle the process moves (actors are restored for you). */
  restore?: () => void;
  /** The animated mobject. Default: the first actor (an empty group when there is none) */
  mobject?: Mobject;
}

/** The instances each actor had when it was built (hidden). */
const INITIAL_INSTANCES = new WeakMap<InstancedMobject, InstanceTransform[]>();

/**
 * A process animation: an `UpdateFromAlphaFunc` with the actors it moves.
 *
 * Creating it changes nothing on screen: the actors start hidden and
 * organelles move only when it plays. `interpolate(alpha)` writes the full
 * state for `alpha`, and `reset()` puts every actor instance and every
 * organelle the process moved back to the state at creation.
 */
export class ProcessAnimation extends UpdateFromAlphaFunc {
  /** Mobjects the process moves; add them to the scene before playing. */
  readonly actors: Mobject[];
  /**
   * Named world points on the paths of the actors, for callouts (for example
   * `in`, `water`, `oxygen` of {@link peroxisomeReaction}). Empty for most.
   */
  readonly anchors: Readonly<Record<string, Vector3Tuple>>;
  private readonly _restore: () => void;
  /** Whether interpolate() wrote any state since the last reset. */
  private _touched = false;

  constructor(
    actors: Mobject[],
    apply: (alpha: number) => void,
    options: AnimationOptions = {},
    anchors: Record<string, Vector3Tuple> = {},
    wiring: ProcessWiring = {},
  ) {
    const driven = wiring.mobject ?? actors[0] ?? new Group();
    super(driven, (_m, alpha) => apply(alpha), { rateFunc: linear, ...options });
    this.actors = actors;
    this.anchors = anchors;
    this._restore = wiring.restore ?? (() => undefined);
  }

  /** No snapshot: reset() restores the state at creation itself. */
  override begin(): void {
    this._hasBegun = true;
    this._isFinished = false;
  }

  override interpolate(alpha: number): void {
    this._touched = true;
    super.interpolate(alpha);
  }

  override reset(): void {
    super.reset();
    if (!this._touched) return;
    this._touched = false;
    for (const a of this.actors) {
      const initial = INITIAL_INSTANCES.get(a as InstancedMobject);
      if (initial) (a as InstancedMobject).setInstances(initial);
    }
    this._restore();
  }
}

/** Options shared by the processes. */
export interface ProcessOptions extends AnimationOptions {
  /** Add the actors to this scene (or group) right away. Default: none */
  scene?: { add(...mobjects: Mobject[]): unknown };
  /** Look of the actors. Default: 'manim' */
  style?: CellLook;
  /** Main color of the actors. Default: the palette color of the process */
  color?: string;
}

const HIDDEN = 1e-4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Local progress of a window [a, b] of alpha. */
const win = (alpha: number, a: number, b: number) => clamp01((alpha - a) / Math.max(1e-9, b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

function actor(
  geometry: THREE.BufferGeometry,
  count: number,
  colors: string[],
  style: CellLook | undefined,
): InstancedMobject {
  const instances = Array.from({ length: count }, (_, i) => ({
    position: [0, 0, 0] as Vector3Tuple,
    scale: HIDDEN,
    color: colors[i % colors.length],
  }));
  const m = new InstancedMobject({
    geometry,
    material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    instances,
  });
  INITIAL_INSTANCES.set(m, instances);
  applyLook(m, style ?? 'manim');
  return m;
}

function finish(
  actors: Mobject[],
  apply: (alpha: number) => void,
  options: ProcessOptions,
  anchors: Record<string, Vector3Tuple> = {},
  restore?: () => void,
): ProcessAnimation {
  options.scene?.add(...actors);
  const animation: AnimationOptions = {};
  if (options.duration !== undefined) animation.duration = options.duration;
  if (options.rateFunc !== undefined) animation.rateFunc = options.rateFunc;
  return new ProcessAnimation(actors, apply, animation, anchors, { restore });
}

// ── translation ──────────────────────────────────────────────────────────

/** Options of {@link translateRibosome}. */
export interface TranslateRibosomeOptions extends AnimationOptions {
  /** Beads at the start. Default: 0 */
  from?: number;
  /** Beads at the end. Default: the full chain */
  to?: number;
}

/**
 * The ribosome reads its mRNA: the strand moves one codon per amino acid and
 * the protein chain grows bead by bead out of the exit tunnel.
 */
export function translateRibosome(
  ribosome: Ribosome3D,
  options: TranslateRibosomeOptions = {},
): UpdateFromAlphaFunc {
  const { from = 0, to = ribosome.getPeptideLength(), ...animation } = options;
  const initial = ribosome.getTranslationProgress();
  return new ProcessAnimation(
    [],
    (alpha) => ribosome.setTranslationProgress(from + (to - from) * alpha),
    { duration: Math.max(1, 0.5 * Math.abs(to - from)), ...animation },
    {},
    { mobject: ribosome, restore: () => ribosome.setTranslationProgress(initial) },
  );
}

// ── mRNA export ──────────────────────────────────────────────────────────

/** Options of {@link exportMRNA}. */
export interface ExportMRNAOptions extends ProcessOptions {
  /** Exit pore in world space. Default: the nucleus 'pore' anchor */
  pore?: Vector3Tuple;
  /** Strand length in world units. Default: 0.9 * nucleus radius */
  length?: number;
  /** How far the strand travels past the pore. Default: 1.2 * nucleus radius */
  reach?: number;
  /** Radius of one bead of the strand. Default: 0.035 * nucleus radius */
  beadRadius?: number;
}

/** A messenger RNA strand leaves the nucleus through a nuclear pore, as a bead snake. */
export function exportMRNA(nucleus: Nucleus3D, options: ExportMRNAOptions = {}): ProcessAnimation {
  const r = nucleus.getRadius() * avgScale(nucleus);
  const center = nucleus.getAnchor('center') ?? nucleus.getCenter();
  const pore = options.pore ?? nucleus.getAnchor('pore') ?? addVec(center, [0, 0, r]);
  const out = normalizeVec(subVec(pore, center));
  const length = options.length ?? 0.9 * r;
  const reach = options.reach ?? 1.2 * r;
  const rng = makeRng(5);
  const side = normalizeVec(addVec(rng.direction(), scaleVec(-0.2, out)));
  // Inside: a curl near the centre; then straight through the pore; then a drift.
  const path = smoothPolyline(
    [
      addVec(center, scaleVec(0.35 * r, side)),
      addVec(center, scaleVec(0.55 * r, out), scaleVec(0.2 * r, side)),
      addVec(pore, scaleVec(-0.12 * r, out)),
      addVec(pore, scaleVec(0.12 * r, out)),
      addVec(pore, scaleVec(0.6 * reach, out), scaleVec(0.25 * r, side)),
      addVec(pore, scaleVec(reach, out), scaleVec(-0.1 * r, side)),
    ],
    3,
  );
  const beadR = options.beadRadius ?? 0.035 * r;
  const spacing = 1.5 * beadR;
  const count = Math.max(4, Math.round(length / spacing));
  const color = options.color ?? kitColor('mrna');
  const strand = actor(
    sphereGeometry(beadR, 1),
    count,
    [color, interpolateColor(color, '#ffffff', 0.25)],
    options.style,
  );
  const total = polylineLength(path);
  const apply = (alpha: number) => {
    // The head runs from the start of the path to its end; bead i trails it.
    const head = alpha * total;
    for (let i = 0; i < count; i++) {
      const s = head - i * spacing;
      const shown = alpha > 0 && s >= 0 && s <= total;
      strand.setInstanceTransform(i, {
        position: pointAlong(path, s / total),
        scale: shown ? 1 : HIDDEN,
      });
    }
  };
  return finish([strand], apply, { duration: 3, ...options });
}

// ── vesicle transport ────────────────────────────────────────────────────

/** Options of {@link vesicleTransport}. */
export interface VesicleTransportOptions extends ProcessOptions {
  /** Where the vesicle buds (on the rough ER), world space. */
  from: Vector3Tuple;
  /** Entry side of the Golgi, world space. */
  golgiEntry: Vector3Tuple;
  /** Exit side of the Golgi, world space. */
  golgiExit: Vector3Tuple;
  /** Where the second vesicle fuses with the membrane, world space. */
  membrane: Vector3Tuple;
  /** Vesicle radius. Default: 0.12 */
  radius?: number;
}

/**
 * The secretory route: a vesicle buds from the ER, travels to the Golgi entry
 * side and fuses; a second vesicle buds from the exit side, travels to the
 * cell membrane and fuses with it.
 */
export function vesicleTransport(options: VesicleTransportOptions): ProcessAnimation {
  const { from, golgiEntry, golgiExit, membrane, radius = 0.12 } = options;
  const color = options.color ?? kitColor('vesicle');
  const vesicles = actor(
    sphereGeometry(radius, 2),
    2,
    [interpolateColor(color, kitColor('rough er'), 0.35), color],
    options.style,
  );
  const arc = (a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple[] => {
    const lift = 0.15 * lengthVec(subVec(b, a));
    return smoothPolyline([a, addVec(scaleVec(0.5, addVec(a, b)), [0, 0, lift]), b], 3);
  };
  const leg1 = arc(from, golgiEntry);
  const leg2 = arc(golgiExit, membrane);
  const apply = (alpha: number) => {
    // Vesicle 1: bud 0-0.12, travel 0.12-0.42, fuse 0.42-0.5.
    const s1 =
      alpha <= 0
        ? HIDDEN
        : alpha < 0.12
          ? ease(win(alpha, 0, 0.12))
          : alpha < 0.42
            ? 1
            : 1 - win(alpha, 0.42, 0.5);
    vesicles.setInstanceTransform(0, {
      position: pointAlong(leg1, ease(win(alpha, 0.12, 0.42))),
      scale: Math.max(HIDDEN, s1),
    });
    // Vesicle 2: bud 0.5-0.6, travel 0.6-0.9, fuse (flatten into the wall) 0.9-1.
    const s2 =
      alpha < 0.5
        ? HIDDEN
        : alpha < 0.6
          ? ease(win(alpha, 0.5, 0.6))
          : alpha < 0.9
            ? 1
            : 1 - win(alpha, 0.9, 1);
    vesicles.setInstanceTransform(1, {
      position: pointAlong(leg2, ease(win(alpha, 0.6, 0.9))),
      scale: Math.max(HIDDEN, s2),
    });
  };
  return finish([vesicles], apply, { duration: 6, ...options });
}

// ── ATP ──────────────────────────────────────────────────────────────────

/** Options of {@link releaseATP}. */
export interface ReleaseATPOptions extends ProcessOptions {
  /** Number of ATP molecules. Default: 18 */
  count?: number;
  /** How far they travel from the surface. Default: 1.2 * the mitochondrion half-length */
  distance?: number;
  /** Size of one molecule. Default: 0.05 * the half-length */
  size?: number;
  /** Seed for the directions. Default: 1 */
  seed?: number;
}

/** ATP molecules (three beads: the phosphate tail) leave a mitochondrion in a lagged stream. */
export function releaseATP(
  mitochondrion: Mitochondrion3D,
  options: ReleaseATPOptions = {},
): ProcessAnimation {
  const { count = 18, seed = 1 } = options;
  const center = mitochondrion.getAnchor('center') ?? mitochondrion.getCenter();
  const end = mitochondrion.getAnchor('end') ?? addVec(center, [1, 0, 0]);
  const half = lengthVec(subVec(end, center));
  const axis = normalizeVec(subVec(end, center));
  const distance = options.distance ?? 1.2 * half;
  const size = options.size ?? 0.06 * half;
  const color = options.color ?? kitColor('atp');
  const geometry = mergedSpheres([
    { center: [0, 0, 0], radius: 1.3 * size },
    { center: [0, 1.9 * size, 0], radius: 0.8 * size },
    { center: [0, 3.3 * size, 0], radius: 0.8 * size },
    { center: [0, 4.7 * size, 0], radius: 0.8 * size },
  ]);
  const atp = actor(
    geometry,
    count,
    [color, interpolateColor(color, '#ffffff', 0.3)],
    options.style,
  );
  const rng = makeRng(seed);
  const starts: Vector3Tuple[] = [];
  const dirs: Vector3Tuple[] = [];
  for (let i = 0; i < count; i++) {
    const along = rng.range(-0.8, 0.8) * half;
    const d = rng.direction();
    // Leave sideways from the rod, with an upward bias so they read from above.
    const sideways = normalizeVec(addVec(subVec(d, scaleVec(dotVec(d, axis), axis)), [0, 0, 0.5]));
    starts.push(addVec(center, scaleVec(along, axis), scaleVec(0.35 * half, sideways)));
    dirs.push(sideways);
  }
  const spin = Array.from(
    { length: count },
    () => [rng.range(0, 6.28), rng.range(0, 6.28), 0] as Vector3Tuple,
  );
  const apply = (alpha: number) => {
    for (let i = 0; i < count; i++) {
      const lag = (0.6 * i) / count;
      const t = win(alpha, lag, lag + 0.4);
      const s = t <= 0 ? HIDDEN : Math.min(ease(win(t, 0, 0.15)), 1 - win(t, 0.8, 1));
      atp.setInstanceTransform(i, {
        position: addVec(starts[i], scaleVec(distance * ease(t), dirs[i])),
        rotation: [spin[i][0] + 2 * t, spin[i][1], 0],
        scale: Math.max(HIDDEN, s),
      });
    }
  };
  return finish([atp], apply, { duration: 4, ...options });
}

// ── cargo on a microtubule ───────────────────────────────────────────────

/** Options of {@link moveCargoAlongMicrotubule}. */
export interface CargoOptions extends ProcessOptions {
  /** Which microtubule (index into getMicrotubulePaths()). Default: the longest */
  microtubule?: number;
  /** Cargo vesicle radius. Default: 0.12 */
  radius?: number;
  /** Move toward the centrosome (dynein) instead of outward (kinesin). Default: false */
  inward?: boolean;
}

/**
 * A motor protein walks a cargo vesicle along a microtubule: outward from the
 * centrosome (kinesin) or inward (dynein).
 */
export function moveCargoAlongMicrotubule(
  cytoskeleton: Cytoskeleton3D,
  options: CargoOptions = {},
): ProcessAnimation {
  const paths = cytoskeleton.getMicrotubulePaths();
  if (paths.length === 0)
    throw new Error('moveCargoAlongMicrotubule: the cytoskeleton has no microtubules.');
  let index = options.microtubule ?? 0;
  if (options.microtubule === undefined) {
    paths.forEach((p, i) => {
      if (polylineLength(p) > polylineLength(paths[index])) index = i;
    });
  }
  const world = paths[Math.min(index, paths.length - 1)].map((p) => cytoskeleton.localToWorld(p));
  const path = options.inward ? [...world].reverse() : world;
  const radius = options.radius ?? 0.12;
  const color = options.color ?? kitColor('vesicle');
  const cargo = actor(sphereGeometry(radius, 2), 1, [color], options.style);
  const motor = actor(
    mergedSpheres([
      { center: [-0.25 * radius, 0, 0], radius: 0.22 * radius },
      { center: [0.25 * radius, 0, 0], radius: 0.22 * radius },
    ]),
    1,
    [kitColor('microtubule')].map((c) => interpolateColor(c, '#ffffff', 0.4)),
    options.style,
  );
  const lift: Vector3Tuple = [0, 0, 1.25 * radius];
  const apply = (alpha: number) => {
    const shown = alpha > 0 ? Math.min(1, alpha / 0.06, (1 - alpha) / 0.06 + 0.001) : HIDDEN;
    const p = pointAlong(path, 0.05 + 0.85 * alpha);
    // The motor "walks": a small bob every step.
    const bob = 0.1 * radius * Math.abs(Math.sin(alpha * 60));
    motor.setInstanceTransform(0, {
      position: addVec(p, [0, 0, 0.35 * radius + bob]),
      scale: Math.max(HIDDEN, shown),
    });
    cargo.setInstanceTransform(0, {
      position: addVec(p, lift, [0, 0, bob]),
      scale: Math.max(HIDDEN, shown),
    });
  };
  return finish([cargo, motor], apply, { duration: 5, ...options });
}

// ── lysosome digestion ───────────────────────────────────────────────────

/** Options of {@link digestCargo}. */
export interface DigestCargoOptions extends ProcessOptions {
  /** Where the worn-out fragment starts, world space. Default: 3.5 lysosome radii away */
  from?: Vector3Tuple;
  /** Fragment radius. Default: 0.55 x the lysosome radius */
  size?: number;
  /** Seed for the fragment shape and the default start. Default: 1 */
  seed?: number;
}

/**
 * A lysosome digests a worn-out fragment: the grey fragment drifts in, the
 * lysosome moves to meet it and takes it in, then the fragment shrinks and
 * fades inside while the lysosome pulses twice. The lysosome itself moves, so
 * create the process after the lysosome is in place. Anchor: `fragment` (the
 * start of the fragment's path).
 */
export function digestCargo(
  lysosome: Vesicle3D,
  options: DigestCargoOptions = {},
): ProcessAnimation {
  const { seed = 1 } = options;
  const rng = makeRng(seed + 11);
  const r = lysosome.getRadius() * avgScale(lysosome);
  const home = lysosome.getAnchor('center') ?? lysosome.getCenter();
  const away = normalizeVec(addVec(rng.direction(), [0, 0, -0.6 * rng.direction()[2]]));
  const start = options.from ?? addVec(home, scaleVec(3.5 * r, away));
  const meet = addVec(home, scaleVec(0.4, subVec(start, home)));
  const size = options.size ?? 0.55 * r;
  const lumps = Array.from({ length: 5 }, () => ({
    center: scaleVec(0.45 * size, rng.direction()),
    radius: size * rng.range(0.45, 0.7),
  }));
  const grey = options.color ?? '#9E9E9E';
  const fragment = actor(mergedSpheres(lumps), 1, [grey], options.style);
  const tint = interpolateColor(grey, lysosome.getMainColor(), 0.6);
  const base = lysosome.position.clone();
  const baseScale = lysosome.scaleVector.clone();
  const apply = (alpha: number) => {
    // 0-0.45: both move to the meeting point; then digestion; pulses at 0.55 and 0.75.
    const move = ease(win(alpha, 0, 0.45));
    const center = addVec(home, scaleVec(move, subVec(meet, home)));
    lysosome.position.set(...addVec([base.x, base.y, base.z], subVec(center, home)));
    const pulse =
      0.07 *
      (Math.sin(Math.PI * win(alpha, 0.5, 0.62)) + Math.sin(Math.PI * win(alpha, 0.7, 0.82)));
    // The pulse multiplies the scale the lysosome had, so a user scale survives.
    lysosome.scaleVector.copy(baseScale).multiplyScalar(1 + pulse);
    lysosome._markDirty();
    const digest = win(alpha, 0.5, 0.92);
    fragment.setInstanceTransform(0, {
      position: addVec(start, scaleVec(move, subVec(meet, start))),
      rotation: [2 * alpha, 1.3 * alpha, 0],
      scale:
        alpha <= 0
          ? HIDDEN
          : Math.max(HIDDEN, Math.min(ease(win(alpha, 0, 0.08)), 1 - ease(digest))),
    });
    fragment.setInstanceColor(0, interpolateColor(grey, tint, digest));
  };
  const anchors = { fragment: addVec(start, scaleVec(0.2, subVec(meet, start))) };
  const restore = () => {
    lysosome.position.copy(base);
    lysosome.scaleVector.copy(baseScale);
    lysosome._markDirty();
  };
  return finish([fragment], apply, { duration: 5, ...options }, anchors, restore);
}

// ── peroxisome reaction ──────────────────────────────────────────────────

/** Options of {@link peroxisomeReaction}. */
export interface PeroxisomeReactionOptions extends ProcessOptions {
  /** Molecules of hydrogen peroxide that come in (2 H2O2 make 2 H2O and 1 O2). Default: 4 */
  count?: number;
  /** Size of one atom bead. Default: 0.13 x the peroxisome radius */
  atom?: number;
  /** Seed for the paths. Default: 1 */
  seed?: number;
}

/**
 * The catalase reaction of a peroxisome: hydrogen peroxide molecules
 * (H2O2: two red oxygen and two white hydrogen beads) come in from one side
 * and vanish in the centre; water (H2O) and oxygen (O2) leave on the other
 * side, as 2 H2O2 -> 2 H2O + O2. Anchors for callouts: `in`, `water`, `oxygen`.
 */
export function peroxisomeReaction(
  peroxisome: Vesicle3D,
  options: PeroxisomeReactionOptions = {},
): ProcessAnimation {
  const { count = 4, seed = 1 } = options;
  const r = peroxisome.getRadius() * avgScale(peroxisome);
  const c = peroxisome.getAnchor('center') ?? peroxisome.getCenter();
  const b = options.atom ?? 0.13 * r;
  // Each molecule is two instanced actors with the same transforms: red
  // oxygen beads and white hydrogen beads.
  const molecule = (o: Vector3Tuple[], h: Vector3Tuple[], n: number) => {
    const ox = actor(
      mergedSpheres(o.map((center) => ({ center, radius: b }))),
      n,
      ['#EF5350'],
      options.style,
    );
    const hy =
      h.length === 0
        ? null
        : actor(
            mergedSpheres(h.map((center) => ({ center, radius: 0.6 * b }))),
            n,
            ['#F5F5F5'],
            options.style,
          );
    const place = (i: number, t: Partial<InstanceTransform>) => {
      ox.setInstanceTransform(i, t);
      hy?.setInstanceTransform(i, t);
    };
    return { actors: hy ? [ox, hy] : [ox], place, n };
  };
  const h2o2 = molecule(
    [
      [-0.8 * b, 0, 0],
      [0.8 * b, 0, 0],
    ],
    [
      [-1.5 * b, 0.9 * b, 0],
      [1.5 * b, -0.9 * b, 0],
    ],
    count,
  );
  const water = molecule(
    [[0, 0, 0]],
    [
      [-1.0 * b, 0.8 * b, 0],
      [1.0 * b, 0.8 * b, 0],
    ],
    count,
  );
  const oxygen = molecule(
    [
      [-0.8 * b, 0, 0],
      [0.8 * b, 0, 0],
    ],
    [],
    Math.max(1, Math.floor(count / 2)),
  );
  const rng = makeRng(seed + 31);
  const side = normalizeVec(addVec(rng.direction(), [0, 0, -0.5]));
  const spread = (axis: Vector3Tuple) =>
    normalizeVec(addVec(axis, scaleVec(0.45, rng.direction()), [0, 0, 0.3]));
  const ins = Array.from({ length: count }, () => spread(scaleVec(-1, side)));
  const outsW = Array.from({ length: count }, () => spread(side));
  const turn: Vector3Tuple = normalizeVec([-side[1], side[0], 0.2]);
  const outsO = Array.from({ length: oxygen.n }, () => spread(turn));
  const far = 3.4 * r;
  const spin = (i: number, t: number): Vector3Tuple => [1.7 * i + 2 * t, 0.9 * i + t, 0];
  const apply = (alpha: number) => {
    for (let i = 0; i < count; i++) {
      // In: lagged over 0-0.55; each molecule reaches the centre and is used up.
      const lag = (0.3 * i) / count;
      const tIn = win(alpha, lag, lag + 0.35);
      const shownIn = tIn > 0 && tIn < 1;
      h2o2.place(i, {
        position: addVec(c, scaleVec(far * (1 - ease(tIn)) + 0.2 * r, ins[i])),
        rotation: spin(i, tIn),
        scale: shownIn ? Math.min(1, 6 * tIn, 5 * (1 - tIn)) : HIDDEN,
      });
      // Out: water leaves after its molecule arrived.
      const tOut = win(alpha, lag + 0.4, lag + 0.75);
      const shownOut = tOut > 0 && tOut < 1;
      water.place(i, {
        position: addVec(c, scaleVec(0.2 * r + far * ease(tOut), outsW[i])),
        rotation: spin(i + 3, tOut),
        scale: shownOut ? Math.min(1, 6 * tOut, 5 * (1 - tOut)) : HIDDEN,
      });
    }
    for (let i = 0; i < oxygen.n; i++) {
      const lag = 0.45 + (0.2 * i) / oxygen.n;
      const t = win(alpha, lag, lag + 0.4);
      const shown = t > 0 && t < 1;
      oxygen.place(i, {
        position: addVec(c, scaleVec(0.2 * r + far * ease(t), outsO[i])),
        rotation: spin(i + 7, t),
        scale: shown ? Math.min(1, 6 * t, 5 * (1 - t)) : HIDDEN,
      });
    }
  };
  const anchors = {
    in: addVec(c, scaleVec(2.2 * r, scaleVec(-1, side))),
    water: addVec(c, scaleVec(2.2 * r, side)),
    oxygen: addVec(c, scaleVec(2.2 * r, turn)),
  };
  const actors = [...h2o2.actors, ...water.actors, ...oxygen.actors];
  return finish(actors, apply, { duration: 5, ...options }, anchors);
}

/** Mean scale of a mobject's world transform (for radii given in the organelle frame). */
function avgScale(m: Mobject): number {
  const s = new THREE.Vector3();
  m._worldMatrix().decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
  return (s.x + s.y + s.z) / 3;
}

/**
 * Cell3D: an assembled cutaway animal cell from the organelles of the kit.
 *
 * The API follows the 2D `Cell`: a list of organelle specs (`{ name,
 * position?, color?, ... }`) or `preset: 'animal'`, auto-arranged without
 * overlap in anatomically sensible places (see `cellLayout.ts`), and per-name
 * color overrides through `colors`.
 *
 * Each organelle is reachable by id ({@link getOrganelle}); anchors of an
 * organelle are reachable from the cell as `'<id>.<anchor>'`, for example
 * `cell.getAnchor('golgi apparatus.entrySide')`.
 *
 * @example
 * ```ts
 * const cell = new Cell3D({ radius: 4, preset: 'animal' });
 * scene.add(cell);
 * await scene.play(cell.buildAnimation());
 * ```
 */

import type { Mobject, Vector3Tuple } from '../../../core/Mobject';
import type { Animation } from '../../../animation/Animation';
import { AnimationGroup } from '../../../animation/AnimationGroup';
import { LaggedStart } from '../../../animation/LaggedStart';
import { logger } from '../../../utils/logger';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { scatterInVolume } from '../../three-d/scatter';
import { byDetail, type Rng } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import { CellMembrane3D, type CellCutaway } from './CellMembrane3D';
import { Nucleus3D } from './Nucleus3D';
import { RoughER3D } from './RoughER3D';
import { SmoothER3D } from './SmoothER3D';
import { GolgiApparatus3D } from './GolgiApparatus3D';
import { Mitochondrion3D } from './Mitochondrion3D';
import { Vesicle3D, type VesiclePreset } from './Vesicle3D';
import { Centrosome3D } from './Centrosome3D';
import { Cytoskeleton3D } from './Cytoskeleton3D';
import { FreeRibosomes3D, type ClearAroundOptions } from './FreeRibosomes3D';
import {
  erSpheres,
  fitsInCell,
  isClear,
  perinuclearSlots,
  placeFree,
  smoothErSpheres,
  type CellSpace,
  type LayoutSphere,
  type PerinuclearSlots,
  ANIMAL_CELL_PRESET,
  KIND_ALIASES,
  expandSpecs,
} from './cellLayout';
import type {
  BuildAnimationOptions,
  CellDetail,
  CellLayoutEntry,
  CellLook,
  OrganelleInfo,
  OrganelleSpec3D,
} from './cell3dTypes';

/** Options of {@link Cell3D}. */
export interface Cell3DOptions {
  /** Cell radius along Y (before the aspect scale). Default: 4 */
  radius?: number;
  /** Per-axis shape scale of the cell. Default: [1.15, 1, 0.62] */
  aspect?: Vector3Tuple;
  /** How the cell is opened. Default: 'bowl' */
  cutaway?: CellCutaway;
  /** The organelles. Default: the `preset` list. */
  organelles?: OrganelleSpec3D[];
  /** Named organelle list used when `organelles` is not given. Default: 'animal' */
  preset?: 'animal';
  /** Add the cytoskeleton (microtubules, actin, intermediate filaments). Default: false */
  cytoskeleton?: boolean;
  /** Seed for the layout and every organelle. Default: 1 */
  seed?: number;
  /** Segment and instance counts. Default: 'medium' */
  detail?: CellDetail;
  /** Per-name color overrides (organelle names or part names). */
  colors?: Record<string, string>;
  /** The look of every part. Default: 'manim' */
  style?: CellLook;
  /** Centre of the cell. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Caption overrides for the whole cell. */
  info?: Partial<OrganelleInfo>;
}

/** Options of {@link Cell3D.clearAround}. */
export interface CellClearOptions extends ClearAroundOptions {
  /** Radius of the cleared sphere. Default: margin x the target's half-diagonal */
  radius?: number;
  /** Scale of the target's half-diagonal. Default: 1.1 */
  margin?: number;
}

/** One organelle to place: its id, kind, spec, resolved options and size scale. */
interface PlaceOrder {
  id: string;
  kind: string;
  spec: OrganelleSpec3D;
  opts: Record<string, unknown>;
  k: number;
}

/** Shared state of one layout pass. */
interface PlaceContext {
  slots: PerinuclearSlots;
  sheets: number;
  rng: Rng;
  mitochondria: number;
}

/** Build order of the kinds (the membrane comes first). */
const BUILD_ORDER = [
  'nucleus',
  'rough er',
  'smooth er',
  'golgi apparatus',
  'centrosome',
  'mitochondrion',
  'lysosome',
  'peroxisome',
  'vesicle',
  'ribosome',
  'cytoskeleton',
];

export class Cell3D extends Organelle3D {
  /** The membrane. */
  readonly membrane: CellMembrane3D;
  private readonly _organelles: { id: string; kind: string; organelle: Organelle3D }[] = [];
  private readonly _layout: CellLayoutEntry[] = [];
  private readonly _space: CellSpace;

  constructor(options: Cell3DOptions = {}) {
    super(
      'cell',
      {
        seed: options.seed,
        detail: options.detail,
        colors: options.colors,
        style: options.style,
        info: options.info,
        center: options.center,
      },
      'cell membrane',
    );
    const { radius = 4, aspect = [1.15, 1, 0.62], cutaway = 'bowl' } = options;
    const shared = {
      seed: this._seed,
      detail: this._detail,
      colors: this._colorOverrides,
      style: this._look,
    };
    this.membrane = new CellMembrane3D({
      ...shared,
      radius,
      aspect,
      cutaway,
      color: this._colorOverrides['cell membrane'],
    });
    this._register({ id: 'cell membrane', kind: 'cell membrane' }, this.membrane);
    this._space = {
      radii: this.membrane.getInnerRadii(),
      cutZ: this.membrane.getCutHeight(),
      radius,
    };

    const specs = expandSpecs(
      options.organelles ?? [...ANIMAL_CELL_PRESET],
      options.cytoskeleton ?? false,
    );
    const sheets = byDetail(this._detail, [3, 4, 5] as const);
    const slots = perinuclearSlots(this._space, sheets);
    const ids = new Map<string, number>();
    const idFor = (spec: OrganelleSpec3D, kind: string) => {
      if (spec.id) return spec.id;
      const n = (ids.get(kind) ?? 0) + 1;
      ids.set(kind, n);
      return n === 1 ? kind : `${kind} ${n}`;
    };
    // Fixed slots first, then the scattered organelles, then the crowds.
    const order = (k: string) =>
      ['nucleus', 'rough er', 'smooth er', 'golgi apparatus', 'centrosome'].includes(k)
        ? 0
        : k === 'ribosome' || k === 'cytoskeleton'
          ? 2
          : 1;
    const sorted = [...specs].sort((a, b) => order(a.kind) - order(b.kind));
    const ctx: PlaceContext = { slots, sheets, rng: this._rng(17), mitochondria: 0 };
    for (const { spec, kind } of sorted) {
      const id = idFor(spec, kind);
      const opts: Record<string, unknown> = {
        ...shared,
        ...(spec.color ? { color: spec.color } : {}),
        ...(spec.options ?? {}),
      };
      const place = this._placers[kind.replace(/ (\w)/g, (_m, c: string) => c.toUpperCase())];
      if (!place) {
        logger.debug(`Cell3D: unknown organelle "${spec.name}" is left out.`);
        continue;
      }
      const k = spec.size ?? 1;
      if (!(Number.isFinite(k) && k > 0))
        throw new Error(`Cell3D: size of organelle "${id}" must be a positive number, got ${k}.`);
      place({ id, kind, spec, opts, k }, ctx);
    }
    this._setAnchor('center', [0, 0, 0], this.membrane.getPart('membrane'));
    this._finish(undefined, false);
  }

  /** One placer per organelle kind: build the organelle and register its layout spheres. */
  private readonly _placers: Record<string, (o: PlaceOrder, ctx: PlaceContext) => void> = {
    nucleus: (o, { slots }) => {
      const r = slots.nucleusRadius * o.k;
      const c = o.spec.position ?? slots.nucleusCenter;
      this._register(o, new Nucleus3D({ radius: r, center: c, ...o.opts }), [
        { center: c, radius: r },
      ]);
    },
    roughEr: (o, { slots, sheets }) => {
      const er = slots.er;
      const organelle = new RoughER3D({
        innerRadius: er.innerRadius,
        spacing: er.spacing * o.k,
        thickness: er.thickness * o.k,
        height: er.height,
        arcStart: er.arcStart,
        arcAngle: er.arcAngle,
        sheets,
        center: o.spec.position ?? er.center,
        ...o.opts,
      });
      const nucleus = this._organelles.find((x) => x.kind === 'nucleus')?.id;
      this._register(o, organelle, erSpheres(slots, sheets), nucleus);
    },
    smoothEr: (o, { slots }) => {
      const s = slots.smoothEr;
      const c = o.spec.position ?? s.center;
      const organelle = new SmoothER3D({ size: s.size, bend: s.bend, center: c, ...o.opts });
      // Its slab curves around +Y; turn it to face the nucleus.
      organelle.rotate(s.azimuth + Math.PI / 2, { axis: [0, 0, 1], aboutPoint: c });
      const spheres = o.spec.position
        ? [{ center: c, radius: 0.5 * s.size[0] }]
        : smoothErSpheres(slots);
      this._register(o, organelle, spheres);
    },
    golgiApparatus: (o, { slots }) => {
      const g = slots.golgi;
      const c = o.spec.position ?? g.center;
      const organelle = new GolgiApparatus3D({
        size: g.size * o.k,
        direction: g.direction,
        center: c,
        ...o.opts,
      });
      this._register(o, organelle, [{ center: c, radius: 0.55 * g.size * o.k }]);
    },
    centrosome: (o, { slots }) => {
      const g = slots.centrosome;
      const c = o.spec.position ?? g.center;
      this._register(o, new Centrosome3D({ size: g.size * o.k, center: c, ...o.opts }), [
        { center: c, radius: 0.75 * g.size * o.k },
      ]);
    },
    mitochondrion: (o, ctx) => this._placeMitochondrion(o, ctx),
    lysosome: (o, ctx) => this._placeVesicle(o, ctx),
    peroxisome: (o, ctx) => this._placeVesicle(o, ctx),
    vesicle: (o, ctx) => this._placeVesicle(o, ctx),
    ribosome: (o) => {
      const count = o.spec.count ?? byDetail(this._detail, [400, 1200, 2400] as const);
      const size = 0.012 * this._space.radius * o.k;
      this._register(
        o,
        new FreeRibosomes3D({ points: this._ribosomePoints(count), size, ...o.opts }),
      );
    },
    cytoskeleton: (o, { slots }) => {
      const hasCentrosome = this._organelles.some((x) => x.kind === 'centrosome');
      const hasNucleus = this._organelles.some((x) => x.kind === 'nucleus');
      const organelle = new Cytoskeleton3D({
        radii: this._space.radii,
        maxZ: this._space.cutZ ?? undefined,
        origin: hasCentrosome ? slots.centrosome.center : [0, 0, 0],
        keepOut: hasNucleus
          ? { center: slots.nucleusCenter, radius: slots.nucleusRadius }
          : undefined,
        ...o.opts,
      });
      this._register(o, organelle);
    },
  };

  /** The first mitochondrion is cut open and goes to the front; the rest scatter. */
  private _placeMitochondrion(o: PlaceOrder, ctx: PlaceContext): void {
    const R = this._space.radius;
    const cutaway = ctx.mitochondria === 0 && o.spec.options?.cutaway === undefined;
    ctx.mitochondria++;
    const len = 0.34 * R * o.k * (cutaway ? 1.25 : 1);
    const rad = 0.075 * R * o.k * (cutaway ? 1.25 : 1);
    const footprint = 0.47 * len;
    const { rng } = ctx;
    const c =
      o.spec.position ??
      (cutaway ? this._frontSpot(footprint, rng) : null) ??
      placeFree(this._space, this._layout, footprint, rng, 0.03 * R, [1.05 * rad, 2.4 * rad]);
    if (!c) {
      logger.debug(`Cell3D: no free spot for ${o.id}; it is left out.`);
      return;
    }
    const a = rng.range(0, Math.PI);
    const direction: Vector3Tuple = cutaway
      ? [1, 0.25, 0]
      : [Math.cos(a), Math.sin(a), rng.range(-0.15, 0.15)];
    const center: Vector3Tuple = cutaway ? [c[0], c[1], (this._space.cutZ ?? 0) - 0.9 * rad] : c;
    const organelle = new Mitochondrion3D({
      length: len,
      radius: rad,
      direction,
      cutaway,
      bend: rng.range(-0.5, 0.5),
      center,
      ...o.opts,
    });
    this._register(o, organelle, [{ center, radius: footprint }]);
  }

  /** Lysosomes, peroxisomes and transport vesicles scatter into free space. */
  private _placeVesicle(o: PlaceOrder, { rng }: PlaceContext): void {
    const R = this._space.radius;
    const base = o.kind === 'lysosome' ? 0.07 : o.kind === 'peroxisome' ? 0.058 : 0.04;
    const r = base * R * o.k * rng.range(0.85, 1.15);
    const c = o.spec.position ?? placeFree(this._space, this._layout, r, rng, 0.02 * R);
    if (!c) {
      logger.debug(`Cell3D: no free spot for ${o.id}; it is left out.`);
      return;
    }
    const preset: VesiclePreset = o.kind === 'vesicle' ? 'transport' : (o.kind as VesiclePreset);
    const seed = this._seed + this._organelles.length;
    this._register(o, new Vesicle3D({ ...o.opts, radius: r, preset, center: c, seed }), [
      { center: c, radius: r },
    ]);
  }

  /** The organelle with this id (the kind name, then 'kind 2', 'kind 3' ...), or undefined. */
  getOrganelle(id: string): Organelle3D | undefined {
    return this._organelles.find((o) => o.id === id)?.organelle;
  }

  /** Every organelle, the membrane first, in layout order. */
  get organelles(): Organelle3D[] {
    return this._organelles.map((o) => o.organelle);
  }

  /** Ids of every organelle. */
  get organelleIds(): string[] {
    return this._organelles.map((o) => o.id);
  }

  /** Every organelle of one kind (for example all mitochondria). */
  getOrganellesOfKind(kind: string): Organelle3D[] {
    const k = KIND_ALIASES[kind] ?? kind;
    return this._organelles.filter((o) => o.kind === k).map((o) => o.organelle);
  }

  /** The layout spheres in the cell frame (several per organelle for the rough ER). */
  getLayout(): CellLayoutEntry[] {
    return this._layout.map((e) => ({ ...e, center: [...e.center] as Vector3Tuple }));
  }

  /** Whether a sphere (cell frame) lies inside the inner membrane wall. */
  containsSphere(center: Vector3Tuple, radius: number): boolean {
    return fitsInCell({ ...this._space, cutZ: null }, center, radius);
  }

  /**
   * An anchor of the cell: its own (`center`), an organelle id (its centre),
   * or `'<organelle id>.<anchor>'`.
   */
  override getAnchor(name: string): Vector3Tuple | undefined {
    const own = super.getAnchor(name);
    if (own) return own;
    const dot = name.lastIndexOf('.');
    if (dot > 0) return this.getOrganelle(name.slice(0, dot))?.getAnchor(name.slice(dot + 1));
    const org = this.getOrganelle(name);
    return org?.getAnchor('center') ?? (org && !org.isEmpty() ? org.getCenter() : undefined);
  }

  /**
   * An animation that clears the free-ribosome crowd around a target, so a
   * close view of an organelle has no curtain of dots in front of it: the
   * ribosomes inside a sphere round the target shrink away, every other one
   * grows back. A null target, the cell itself or a ribosome crowd shows
   * every ribosome again. Seekable, so it can run next to a camera move.
   */
  clearAround(target: Mobject | Vector3Tuple | null, options: CellClearOptions = {}): Animation {
    const { radius, margin = 1.1, ...animation } = options;
    const crowds = this.getOrganellesOfKind('ribosome').filter(
      (o): o is FreeRibosomes3D => o instanceof FreeRibosomes3D,
    );
    let center: Vector3Tuple | null = null;
    let r = 0;
    if (Array.isArray(target)) {
      center = target;
      r = radius ?? 0;
    } else if (target && target !== this && !(target instanceof FreeRibosomes3D)) {
      const { min, max } = target.getBounds();
      center = [(min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2];
      r = radius ?? (margin * Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z)) / 2;
    }
    return new AnimationGroup(crowds.map((c) => c.clearAround(center, r, animation)));
  }

  /** One staged build-up: the membrane, then one organelle (or one kind of crowd) at a time. */
  override buildAnimation(options: BuildAnimationOptions = {}): Animation {
    const groups: Organelle3D[][] = [[this.membrane]];
    for (const kind of BUILD_ORDER) {
      const members = this._organelles.filter((o) => o.kind === kind).map((o) => o.organelle);
      if (members.length > 0) groups.push(members);
    }
    const lag = options.lagRatio ?? 0.7;
    const total = options.duration ?? 1.6 * groups.length;
    const make = (unit: number) =>
      new LaggedStart(
        groups.map((members) =>
          members.length === 1
            ? members[0].buildAnimation({ duration: unit })
            : new LaggedStart(
                members.map((m) => m.buildAnimation({ duration: unit * 0.6 })),
                { lagRatio: 0.4 / members.length },
              ),
        ),
        { lagRatio: lag },
      );
    // Every run time scales with `unit`: measure the schedule at unit 1, then
    // scale it so the whole build lasts exactly `total`.
    const span = make(1).duration;
    return make(span > 0 ? total / span : total);
  }

  protected _buildSteps(): BuildStep[] {
    return this.organelles.map((o): BuildStep => ({ part: o, mode: 'create' }));
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.75, phi: 0.95, theta: -1.2 };
  }

  private _register(
    order: { id: string; kind: string },
    organelle: Organelle3D,
    spheres: LayoutSphere[] = [],
    wraps?: string,
  ): void {
    const { id, kind } = order;
    this._organelles.push({ id, kind, organelle });
    for (const sp of spheres) {
      this._layout.push({
        id,
        kind,
        center: [...sp.center],
        radius: sp.radius,
        ...(wraps ? { wraps } : {}),
      });
    }
    this._addPart(id, organelle);
  }

  /** A free spot on the front-right of the cell, toward the default camera (for the cutaway mitochondrion). */
  private _frontSpot(r: number, rng: Rng): Vector3Tuple | null {
    const [a, b] = this._space.radii;
    const top = this._space.cutZ ?? 0;
    for (let t = 0; t < 200; t++) {
      const az = rng.range(-1.2, -0.5);
      const u = rng.range(0.45, 0.7);
      const p: Vector3Tuple = [a * u * Math.cos(az), b * u * Math.sin(az), top - 0.6 * r];
      if (
        fitsInCell(this._space, p, r, 1) &&
        isClear(this._layout, p, r, 0.02 * this._space.radius)
      )
        return p;
    }
    return null;
  }

  /** Free ribosome positions: a layer just under the cut, outside every organelle. */
  private _ribosomePoints(count: number): Vector3Tuple[] {
    const [a, b, c] = this._space.radii;
    const top = this._space.cutZ ?? 0.1 * c;
    const depth = 0.16 * this._space.radius;
    return scatterInVolume({
      count,
      size: [2 * a, 2 * b, depth],
      center: [0, 0, top - depth / 2 - 0.01 * this._space.radius],
      seed: this._seed + 23,
      minDistance: 0.025 * this._space.radius,
      filter: (p) =>
        fitsInCell({ ...this._space, cutZ: null }, p, 0.02 * this._space.radius) &&
        isClear(this._layout, p, 0.015 * this._space.radius, 0),
    });
  }
}

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Mobject } from '../../../core/Mobject';
import type { Animation } from '../../../animation/Animation';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { getRevealUniforms } from '../../../rendering/toon/toonMaterial';
import { lengthVec, subVec } from '../../../utils/vectors';
import { Cell3D } from './Cell3D';
import { CellMembrane3D } from './CellMembrane3D';
import { Nucleus3D } from './Nucleus3D';
import { NuclearPore3D } from './NuclearPore3D';
import { RoughER3D } from './RoughER3D';
import { SmoothER3D } from './SmoothER3D';
import { GolgiApparatus3D } from './GolgiApparatus3D';
import { Mitochondrion3D } from './Mitochondrion3D';
import { Ribosome3D } from './Ribosome3D';
import { Vesicle3D } from './Vesicle3D';
import { Centrosome3D } from './Centrosome3D';
import { Cytoskeleton3D } from './Cytoskeleton3D';
import { FreeRibosomes3D } from './FreeRibosomes3D';
import type { Organelle3D } from './Organelle3D';
import {
  ProcessAnimation,
  digestCargo,
  exportMRNA,
  moveCargoAlongMicrotubule,
  peroxisomeReaction,
  releaseATP,
  translateRibosome,
  vesicleTransport,
} from './processes';

describe('Cell3D layout', () => {
  // MIGRATION: example for the property
  //   ∀ seed s, ∀ options o: new Cell3D({ ...o, seed: s }).getLayout()
  //   deep-equals a second new Cell3D({ ...o, seed: s }).getLayout().
  // Replace with a property test once the suite lands.
  it('is deterministic for a seed', () => {
    const a = new Cell3D({ seed: 7, detail: 'low' }).getLayout();
    const b = new Cell3D({ seed: 7, detail: 'low' }).getLayout();
    const c = new Cell3D({ seed: 8, detail: 'low' }).getLayout();
    expect(b).toEqual(a);
    expect(c).not.toEqual(a);
  });

  // MIGRATION: example for the property
  //   ∀ seed s: every layout sphere e of new Cell3D({ seed: s }) satisfies
  //   cell.containsSphere(e.center, e.radius), and for spheres e, f of
  //   different organelles that do not wrap each other,
  //   |e.center - f.center| >= e.radius + f.radius - tolerance.
  // Replace with a property test once the suite lands.
  it('puts every organelle of the animal preset inside the membrane, without overlap', () => {
    const cell = new Cell3D({ seed: 3, detail: 'low' });
    const layout = cell.getLayout();
    expect(cell.getOrganellesOfKind('mitochondrion').length).toBeGreaterThanOrEqual(5);
    for (const e of layout) expect(cell.containsSphere(e.center, e.radius), e.id).toBe(true);
    const tolerance = 0.02;
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const e = layout[i];
        const f = layout[j];
        if (e.id === f.id || e.wraps === f.id || f.wraps === e.id) continue;
        const gap = lengthVec(subVec(e.center, f.center)) - (e.radius + f.radius);
        expect(gap, `${e.id} / ${f.id}`).toBeGreaterThanOrEqual(-tolerance);
      }
    }
  });
});

describe('Organelle3D anchors', () => {
  // MIGRATION: example for the property
  //   ∀ organelle class C, ∀ name in new C().anchorNames:
  //   getAnchor(name) is a finite point, and after shift(d) it moves by d.
  // Replace with a property test once the suite lands.
  it('resolves every listed anchor to a finite world point that follows the organelle', () => {
    const organelles: Organelle3D[] = [
      new CellMembrane3D({ detail: 'low' }),
      new Nucleus3D({ detail: 'low' }),
      new NuclearPore3D({ detail: 'low' }),
      new RoughER3D({ detail: 'low', ribosomes: 50 }),
      new SmoothER3D({ detail: 'low' }),
      new GolgiApparatus3D({ detail: 'low', direction: [0, 1, 0] }),
      new Mitochondrion3D({ detail: 'low', cutaway: true }),
      new Ribosome3D({ detail: 'low' }),
      Vesicle3D.peroxisome({ detail: 'low' }),
      new Centrosome3D({ detail: 'low' }),
      new Cytoskeleton3D({ detail: 'low', microtubules: 10, actin: 20, intermediateFilaments: 4 }),
    ];
    const d: [number, number, number] = [1, -2, 0.5];
    for (const o of organelles) {
      expect(o.anchorNames.length, o.kind).toBeGreaterThan(0);
      for (const name of o.anchorNames) {
        const before = o.getAnchor(name)!;
        expect(before.every(Number.isFinite), `${o.kind}.${name}`).toBe(true);
        o.shift(d);
        const after = o.getAnchor(name)!;
        o.shift([-d[0], -d[1], -d[2]]);
        expect(lengthVec(subVec(subVec(after, before), d))).toBeLessThan(1e-6);
      }
      expect(o.getAnchor('no such anchor')).toBeUndefined();
    }
  });
});

describe('Cell3D.clearAround', () => {
  // MIGRATION: example for the property
  //   ∀ cell c, ∀ organelle o of c: after c.clearAround(o) runs to the end,
  //   some free ribosomes are hidden and most are shown; after
  //   c.clearAround(null) runs to the end, every visibility === 1.
  // Replace with a property test once the suite lands.
  it('hides the free ribosomes round a target and brings them back', () => {
    const cell = new Cell3D({ seed: 3, detail: 'low' });
    const crowd = cell.getOrganellesOfKind('ribosome')[0] as FreeRibosomes3D;
    const run = (target: Parameters<Cell3D['clearAround']>[0]) => {
      const a = cell.clearAround(target);
      a.begin();
      a.interpolate(1);
      return crowd.getVisibility();
    };
    const cleared = run(cell.getOrganelle('golgi apparatus')!);
    const hidden = cleared.filter((v) => v === 0).length;
    expect(hidden).toBeGreaterThan(0);
    expect(hidden).toBeLessThan(cleared.length / 2);
    expect(run(null).every((v) => v === 1)).toBe(true);
  });
});

// ── seeking, construction side effects, durations, copies, extreme options ──

/** Observable state of a tree: transforms, opacity, instances, draw ranges, reveal clips. */
function treeState(roots: Mobject[]): unknown[] {
  const out: unknown[] = [];
  for (const root of roots) {
    for (const m of root.getFamily()) {
      out.push([
        m.position.toArray(),
        m.rotation.toArray().slice(0, 3),
        m.scaleVector.toArray(),
        m.opacity,
      ]);
      if (m instanceof InstancedMobject) {
        const mesh = m.getInstancedMesh();
        out.push(
          [...mesh.instanceMatrix.array],
          [...(mesh.instanceColor?.array ?? [])],
          mesh.count,
        );
      }
    }
    root.getThreeObject().traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      out.push([o.visible, o.geometry.drawRange.start, o.geometry.drawRange.count]);
      for (const material of [o.material].flat()) {
        const u = getRevealUniforms(material);
        if (u) out.push([u.plane.value.toArray(), u.attr.value]);
      }
    });
  }
  return out;
}

/** A small scene of organelles and every process of the kit on them. */
function processCases(): { name: string; make: () => Animation; touched: Mobject[] }[] {
  const nucleus = new Nucleus3D({ detail: 'low' });
  const ribosome = new Ribosome3D({ detail: 'low' });
  const mito = new Mitochondrion3D({ detail: 'low', center: [3, 0, 0] });
  const cyto = new Cytoskeleton3D({ detail: 'low', microtubules: 6, actin: 4 });
  const lysosome = Vesicle3D.lysosome({ detail: 'low', center: [0, 3, 0] });
  const peroxisome = Vesicle3D.peroxisome({ detail: 'low', center: [0, -3, 0] });
  return [
    { name: 'translateRibosome', make: () => translateRibosome(ribosome), touched: [ribosome] },
    { name: 'exportMRNA', make: () => exportMRNA(nucleus), touched: [nucleus] },
    {
      name: 'vesicleTransport',
      make: () =>
        vesicleTransport({
          from: [0, 0, 0],
          golgiEntry: [1, 0, 0],
          golgiExit: [2, 0, 0],
          membrane: [3, 1, 0],
        }),
      touched: [],
    },
    { name: 'releaseATP', make: () => releaseATP(mito), touched: [mito] },
    { name: 'moveCargo', make: () => moveCargoAlongMicrotubule(cyto), touched: [cyto] },
    { name: 'digestCargo', make: () => digestCargo(lysosome), touched: [lysosome] },
    {
      name: 'peroxisomeReaction',
      make: () => peroxisomeReaction(peroxisome),
      touched: [peroxisome],
    },
  ];
}

describe('cell kit animations', () => {
  // MIGRATION: example for the property
  //   ∀ animation A of the kit (processes, clearAround, openAnimation,
  //   buildAnimation), ∀ a, b in [0, 1]:
  //   state after (begin; interpolate(a); reset) === state before begin, and
  //   state after (interpolate(b); interpolate(a)) === state after a fresh interpolate(a).
  // Replace with a property test once the suite lands.
  it('restore everything they touch on reset and are pure functions of alpha', () => {
    const cases: { name: string; anim: Animation; touched: Mobject[] }[] = processCases().map(
      (c) => {
        const anim = c.make();
        const actors = anim instanceof ProcessAnimation ? anim.actors : [];
        return { name: c.name, anim, touched: [...c.touched, ...actors] };
      },
    );
    const cell = new Cell3D({ seed: 3, detail: 'low' });
    const crowd = cell.getOrganellesOfKind('ribosome')[0];
    cases.push({
      name: 'Cell3D.clearAround',
      anim: cell.clearAround(cell.getOrganelle('golgi apparatus')!),
      touched: [crowd],
    });
    const lidded = new Mitochondrion3D({ detail: 'low', cutaway: true, lid: true });
    cases.push({ name: 'openAnimation', anim: lidded.openAnimation(), touched: [lidded] });
    for (const o of [new Vesicle3D({ detail: 'low' }), new SmoothER3D({ detail: 'low' }), lidded])
      cases.push({ name: `${o.kind}.buildAnimation`, anim: o.buildAnimation(), touched: [o] });
    for (const { name, anim, touched } of cases) {
      const before = treeState(touched);
      anim.begin();
      anim.interpolate(0.7);
      anim.reset();
      expect(treeState(touched), `${name} reset`).toEqual(before);
      anim.begin();
      anim.interpolate(0.2);
      const fresh = treeState(touched);
      anim.interpolate(0.7);
      anim.interpolate(0.2);
      expect(treeState(touched), `${name} 0.7 then 0.2`).toEqual(fresh);
      anim.reset();
    }
  });

  // MIGRATION: example for the property
  //   ∀ process factory f, ∀ organelle o it reads: state(o) after f(o) === state(o) before,
  //   and every actor of f(o) is hidden; ∀ scale s (non-uniform), digestCargo pulses
  //   multiply s and the end state keeps s.
  // Replace with a property test once the suite lands.
  it('process factories change nothing on screen until they play', () => {
    for (const c of processCases()) {
      const before = treeState(c.touched);
      const anim = c.make();
      expect(treeState(c.touched), c.name).toEqual(before);
      for (const actor of anim instanceof ProcessAnimation ? anim.actors : []) {
        const mesh = (actor as InstancedMobject).getInstancedMesh();
        const m = new THREE.Matrix4();
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, m);
          expect(m.getMaxScaleOnAxis(), c.name).toBeLessThan(1e-3);
        }
      }
    }
    const lysosome = Vesicle3D.lysosome({ detail: 'low' });
    lysosome.scaleVector.set(2, 1, 0.5);
    const digest = digestCargo(lysosome);
    expect(lysosome.scaleVector.toArray()).toEqual([2, 1, 0.5]);
    digest.begin();
    digest.interpolate(0.56);
    const [x, y, z] = lysosome.scaleVector.toArray();
    expect(x / 2).toBeGreaterThan(1.01);
    expect(y).toBeCloseTo(x / 2, 9);
    expect(z).toBeCloseTo(x / 4, 9);
    digest.interpolate(1);
    expect(lysosome.scaleVector.toArray()).toEqual([2, 1, 0.5]);
  });

  // MIGRATION: example for the property
  //   ∀ organelle class C, ∀ duration d > 0: new C().buildAnimation({ duration: d }).duration === d,
  //   and the same for Cell3D.
  // Replace with a property test once the suite lands.
  it('buildAnimation lasts exactly the requested duration', () => {
    const all: Organelle3D[] = [
      ...organelleSweep(),
      new Cell3D({ seed: 3, detail: 'low' }),
      new Cell3D({ seed: 3, detail: 'low', cytoskeleton: true }),
    ];
    for (const o of all) {
      for (const duration of [10, 0.5]) {
        expect(o.buildAnimation({ duration }).duration, o.kind).toBeCloseTo(duration, 6);
      }
      expect(o.buildAnimation({ duration: 3, lagRatio: 0.9 }).duration, o.kind).toBeCloseTo(3, 6);
    }
  });

  // MIGRATION: example for the property
  //   ∀ organelle o: c = o.copy() is an instance of o's class, with the same partNames and
  //   anchorNames, every c.getPart(n) inside c (not o), c.getAnchor(n) === o.getAnchor(n),
  //   and moving c moves its anchors but not o's.
  // Replace with a property test once the suite lands.
  it('copy keeps the concrete class with parts and anchors bound to the copy', () => {
    const cell = new Cell3D({ seed: 3, detail: 'low' });
    const ribosome = new Ribosome3D({ detail: 'low' });
    ribosome.setTranslationProgress(3);
    for (const o of [...organelleSweep(), ribosome, cell]) {
      o.shift([0.5, -0.25, 1]);
      const c = o.copy();
      expect(c.constructor, o.kind).toBe(o.constructor);
      expect(c.kind).toBe(o.kind);
      expect(c.partNames).toEqual(o.partNames);
      expect(c.anchorNames).toEqual(o.anchorNames);
      const family = new Set(c.getFamily());
      for (const n of c.partNames) expect(family.has(c.getPart(n)!), `${o.kind}.${n}`).toBe(true);
      for (const n of c.anchorNames) {
        expect(lengthVec(subVec(c.getAnchor(n)!, o.getAnchor(n)!)), `${o.kind}.${n}`).toBeLessThan(
          1e-9,
        );
      }
      expect(treeState([c])).toEqual(treeState([o]));
      const name = c.anchorNames[0];
      const before = o.getAnchor(name)!;
      c.shift([1, 0, 0]);
      expect(o.getAnchor(name)).toEqual(before);
      expect(c.getAnchor(name)![0]).toBeCloseTo(before[0] + 1, 9);
    }
    const copied = cell.copy();
    expect(copied.getOrganelle('nucleus')).toBeInstanceOf(Nucleus3D);
    expect(copied.getOrganelle('nucleus')!.parent).toBe(copied);
    expect(copied.membrane.parent).toBe(copied);
    expect(copied.getLayout()).toEqual(cell.getLayout());
  });
});

/** One of each organelle class, at low detail. */
function organelleSweep(): Organelle3D[] {
  return [
    new CellMembrane3D({ detail: 'low' }),
    new Nucleus3D({ detail: 'low' }),
    new NuclearPore3D({ detail: 'low' }),
    new RoughER3D({ detail: 'low', ribosomes: 50 }),
    new SmoothER3D({ detail: 'low' }),
    new GolgiApparatus3D({ detail: 'low' }),
    new Mitochondrion3D({ detail: 'low' }),
    new Mitochondrion3D({ detail: 'low', cutaway: true, lid: true }),
    new Ribosome3D({ detail: 'low' }),
    new Vesicle3D({ detail: 'low' }),
    Vesicle3D.lysosome({ detail: 'low' }),
    Vesicle3D.peroxisome({ detail: 'low' }),
    new Centrosome3D({ detail: 'low' }),
    new Cytoskeleton3D({ detail: 'low', microtubules: 6, actin: 4, intermediateFilaments: 2 }),
    new FreeRibosomes3D({
      points: [
        [0, 0, 0],
        [0.3, 0, 0],
        [0, 0.3, 0.1],
      ],
    }),
  ];
}

describe('organelle options at their extremes', () => {
  // MIGRATION: example for the property
  //   ∀ organelle class C, ∀ legal options o (tiny sizes, counts 0, detail 'low'):
  //   new C(o) does not throw, or throws an Error that names the bad option, and
  //   every anchor of the result is finite.
  // Replace with a property test once the suite lands.
  it('build a finite organelle or a clear error', () => {
    const tiny: [number, number, number] = [0.1, 0.1, 0.1];
    const makers: [string, () => Organelle3D][] = [
      ['smooth er tiny', () => new SmoothER3D({ size: tiny, spacing: 1, droplets: 0 })],
      ['smooth er droplets', () => new SmoothER3D({ size: tiny, spacing: 1, droplets: 3 })],
      ['membrane tiny', () => new CellMembrane3D({ detail: 'low', radius: 0.05, thickness: 0.01 })],
      ['membrane thick', () => new CellMembrane3D({ detail: 'low', radius: 1, thickness: 2 })],
      ['membrane cut', () => new CellMembrane3D({ detail: 'low', cutHeight: 5 })],
      ['nucleus cap', () => new Nucleus3D({ detail: 'low', opening: 'cap', capOffset: 2 })],
      ['pore patch 0', () => new NuclearPore3D({ detail: 'low', patch: 0 })],
      ['rough er arc 0', () => new RoughER3D({ detail: 'low', arcAngle: 0 })],
      ['ribosome no strand', () => new Ribosome3D({ detail: 'low', mRNALength: 0 })],
      [
        'cell size 0',
        () => new Cell3D({ detail: 'low', organelles: [{ name: 'nucleus', size: 0 }] }),
      ],
      [
        'membrane wedge 0',
        () => new CellMembrane3D({ detail: 'low', cutaway: 'wedge', wedgeAngle: 0 }),
      ],
      [
        'nucleus 0 pores',
        () => new Nucleus3D({ detail: 'low', poreCount: 0, chromatinStrands: 0 }),
      ],
      ['nucleus tiny', () => new Nucleus3D({ detail: 'low', radius: 0.05 })],
      ['pore tiny', () => new NuclearPore3D({ detail: 'low', size: 0.01, channel: false })],
      ['rough er 0', () => new RoughER3D({ detail: 'low', ribosomes: 0, sheets: 1 })],
      [
        'rough er tiny',
        () => new RoughER3D({ detail: 'low', innerRadius: 0.05, thickness: 0.01, height: 0.02 }),
      ],
      [
        'golgi 1',
        () => new GolgiApparatus3D({ detail: 'low', cisternae: 1, vesicles: 0, size: 0.05 }),
      ],
      ['mito 0 cristae', () => new Mitochondrion3D({ detail: 'low', cutaway: true, cristae: 0 })],
      [
        'mito tiny',
        () => new Mitochondrion3D({ detail: 'low', length: 0.01, radius: 0.01, cristae: 0 }),
      ],
      [
        'mito tiny cut',
        () => new Mitochondrion3D({ detail: 'low', cutaway: true, length: 0.05, radius: 0.04 }),
      ],
      ['ribosome 0', () => new Ribosome3D({ detail: 'low', peptide: 0, mRNA: false })],
      ['ribosome tiny', () => new Ribosome3D({ detail: 'low', size: 0.01 })],
      ['vesicle tiny', () => Vesicle3D.lysosome({ detail: 'low', radius: 0.01 })],
      ['peroxisome tiny', () => Vesicle3D.peroxisome({ detail: 'low', radius: 0.01 })],
      ['centrosome tiny', () => new Centrosome3D({ detail: 'low', size: 0.01, pcm: false })],
      [
        'cyto 0',
        () =>
          new Cytoskeleton3D({
            detail: 'low',
            microtubules: 0,
            actin: 0,
            intermediateFilaments: 0,
          }),
      ],
      ['free ribosomes 0', () => new FreeRibosomes3D({ points: [] })],
      ['cell empty', () => new Cell3D({ detail: 'low', organelles: [] })],
      [
        'cell zero counts',
        () => new Cell3D({ detail: 'low', organelles: [{ name: 'mitochondrion', count: 0 }] }),
      ],
      ['cell tiny', () => new Cell3D({ detail: 'low', radius: 0.3 })],
    ];
    for (const [name, make] of makers) {
      let o: Organelle3D;
      try {
        o = make();
      } catch (err) {
        expect(String(err), name).toMatch(/^Error: [A-Za-z0-9]+: \w+ .*must/);
        continue;
      }
      for (const a of o.anchorNames)
        expect(o.getAnchor(a)!.every(Number.isFinite), `${name}.${a}`).toBe(true);
      expect(() => o.buildAnimation().begin(), name).not.toThrow();
    }
  });
});

/** A user organelle with extra state: math values, typed arrays, and a custom object. */
class TaggedVesicle extends Vesicle3D {
  readonly offset = new THREE.Vector2(1, 2);
  readonly tint = new THREE.Color('#ff0000');
  readonly weights = new Float64Array([1, 2]);
  readonly labels = new Map([['a', [1, 2]]]);
  tag: { history: string[] } = { history: ['built'] };
  log = new (class Log {
    entries: string[] = [];
  })();

  protected override _copyState(source: this): void {
    this.log = new (source.log.constructor as new () => typeof source.log)();
    this.log.entries = [...source.log.entries];
  }
}

describe('Organelle3D.copy of a user subclass', () => {
  // MIGRATION: example for the property
  //   ∀ organelle subclass C, ∀ field f of C holding a value type (three.js math value,
  //   typed array, Map/Set/array/plain object of those) or handled by _copyState:
  //   mutating c.f of c = o.copy() leaves o.f unchanged.
  // Replace with a property test once the suite lands.
  it('clones value fields and runs the _copyState hook', () => {
    const o = new TaggedVesicle({ detail: 'low' });
    o.log.entries.push('x');
    const c = o.copy();
    expect(c).toBeInstanceOf(TaggedVesicle);
    c.offset.set(9, 9);
    c.tint.set('#00ff00');
    c.weights[0] = 9;
    c.labels.get('a')!.push(3);
    c.tag.history.push('copied');
    c.log.entries.push('y');
    expect(o.offset.toArray()).toEqual([1, 2]);
    expect(o.tint.getHexString()).toBe('ff0000');
    expect([...o.weights]).toEqual([1, 2]);
    expect(o.labels.get('a')).toEqual([1, 2]);
    expect(o.tag.history).toEqual(['built']);
    expect(o.log.entries).toEqual(['x']);
    expect(c.log.entries).toEqual(['x', 'y']);
  });
});

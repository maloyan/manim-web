import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Sphere } from '../../mobjects/three-d/Sphere';
import { Torus } from '../../mobjects/three-d/Torus';
import { Group } from '../../core/Group';
import { Create3D, GrowAlongPath3D, SweepReveal3D } from '../../animation/creation/Create3D';
import { InstancedMobject } from '../../mobjects/three-d/InstancedMobject';
import { Shell3D } from '../../mobjects/three-d/Shell3D';
import { Blob3D } from '../../mobjects/three-d/Blob3D';
import { ModelMobject } from '../../mobjects/three-d/ModelMobject';
import { applyToonShading, resolveToonOptions } from './toonShading';
import { getRevealUniforms, getToonUniforms, hasMaterialPatch } from './toonMaterial';
import { getOutlineMesh } from './toonOutline';

/** The first mesh in an object tree that is not a helper (outline) mesh. */
function bodyMesh(root: THREE.Object3D): THREE.Mesh {
  let found: THREE.Mesh | null = null;
  root.traverse((o) => {
    if (!found && o instanceof THREE.Mesh && !o.userData.toonOutline) found = o;
  });
  if (!found) throw new Error('no body mesh');
  return found;
}

describe('resolveToonOptions', () => {
  // MIGRATION: example for the property
  //   ∀ preset p, ∀ overrides o: resolveToonOptions({ ...o, preset: p }) takes each
  //   field from o when given, else from p; o.outline.color given without a mode
  //   => outline.mode === 'color'; o.outline === false => outline === null.
  // Replace with a property test once the suite lands.
  it('fills from the preset and lets overrides win', () => {
    const manim = resolveToonOptions();
    expect(manim.outline?.mode).toBe('lighter');
    expect(manim.softness).toBe(1);

    const cartoon = resolveToonOptions({ preset: 'cartoon', outline: { color: '#123456' } });
    expect(cartoon.softness).toBe(0);
    expect(cartoon.outline).toMatchObject({ mode: 'color', color: '#123456' });
    expect(resolveToonOptions({ outline: false, highlight: false })).toMatchObject({
      outline: null,
      highlight: null,
    });
  });
});

describe('Mobject3D.setToonShading', () => {
  // MIGRATION: example for the property
  //   ∀ 3D mesh mobject m: after m.setToonShading(o) and a sync, every own mesh
  //   has toon uniforms and (o.outline !== false) an outline child sharing its
  //   geometry; after m.setToonShading(false) and a sync, it has neither.
  // Replace with a property test once the suite lands.
  it('adds and removes the toon patch and the outline on a group of meshes', () => {
    const sphere = new Sphere({ color: '#58c4dd' });
    const torus = new Torus({ color: '#fc6255' });
    const group = new Group(sphere, torus);

    expect(applyToonShading(group, 'cartoon')).toBe(2);
    for (const m of [sphere, torus]) {
      const mesh = bodyMesh(m.getThreeObject());
      expect(getToonUniforms(mesh.material as THREE.Material)).not.toBeNull();
      const outline = getOutlineMesh(mesh);
      expect(outline?.parent).toBe(mesh);
      expect(outline?.geometry).toBe(mesh.geometry);
    }

    sphere.setToonShading(false);
    const mesh = bodyMesh(sphere.getThreeObject());
    expect(getToonUniforms(mesh.material as THREE.Material)).toBeNull();
    expect(getOutlineMesh(mesh)).toBeNull();
    expect(torus.getToonShading()).not.toBeNull();
  });
});

/** The reveal uniforms as plain values: plane (x, y, z, w) and attribute range [lo, hi]. */
interface RevealValues {
  plane: THREE.Vector4;
  lo: number;
  hi: number;
}

function revealValuesOf(material: THREE.Material): RevealValues {
  const r = getRevealUniforms(material);
  if (!r) throw new Error('material has no reveal patch');
  return { plane: r.plane.value.clone(), lo: r.attr.value.x, hi: r.attr.value.y };
}

/** CPU mirror of REVEAL_FRAGMENT: whether a vertex at world p with reveal value v shows. */
function shows(r: RevealValues, p: THREE.Vector3, v: number): boolean {
  const n = new THREE.Vector3(r.plane.x, r.plane.y, r.plane.z);
  return !(p.dot(n) > r.plane.w || v < r.lo || v > r.hi);
}

/** How many vertices of a mesh show under the reveal state of `material`. */
function visibleCount(mesh: THREE.Mesh, material: THREE.Material): number {
  mesh.updateWorldMatrix(true, false);
  const r = revealValuesOf(material);
  const pos = mesh.geometry.getAttribute('position');
  const rev = mesh.geometry.getAttribute('reveal');
  const p = new THREE.Vector3();
  let count = 0;
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    if (shows(r, p, rev ? rev.getX(i) : 0)) count++;
  }
  return count;
}

/** A renderer stub for an outline's onBeforeRender: it records the depth-only draws. */
function stubRenderer(draws: THREE.Material[]): THREE.WebGLRenderer {
  return {
    getRenderTarget: () => null,
    getDrawingBufferSize: (v: THREE.Vector2) => v.set(100, 100),
    getPixelRatio: () => 1,
    renderBufferDirect: (_c: unknown, _s: unknown, _g: unknown, material: THREE.Material) => {
      draws.push(material);
    },
  } as unknown as THREE.WebGLRenderer;
}

describe('toon state ownership', () => {
  // MIGRATION: example for the property
  //   ∀ toon-shaded 3D mobject m (single material, multi-slot, instanced, group):
  //   c = m.copy() has its own live patch and outline; a reveal animation runs
  //   on c; recolouring c leaves m unchanged; disposing m leaves c's patch and
  //   outline in place.
  // Replace with a property test once the suite lands.
  it('a copy gets its own patch, and copy and source stay independent', () => {
    const inst = new InstancedMobject({
      geometry: new THREE.SphereGeometry(0.2, 8, 6),
      material: new THREE.MeshStandardMaterial(),
      color: '#58c4dd',
      instances: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }],
    }).setToonShading();
    const shell = new Shell3D({ color: '#fc6255' }).setToonShading('cartoon');
    const group = new Group(inst, shell);
    group.getThreeObject();

    const copy = group.copy();
    copy.getThreeObject();
    const sweep = new SweepReveal3D(copy);
    expect(() => {
      sweep.begin();
      sweep.interpolate(0.5);
    }).not.toThrow();

    const [instCopy, shellCopy] = copy.children as [InstancedMobject, Shell3D];
    for (const [a, b] of [
      [inst, instCopy],
      [shell, shellCopy],
    ] as const) {
      const ma = bodyMesh(a.getThreeObject());
      const mb = bodyMesh(b.getThreeObject());
      const matsA = [mb.material].flat() as THREE.Material[];
      for (const [i, m] of ([ma.material].flat() as THREE.Material[]).entries()) {
        expect(getToonUniforms(matsA[i])).not.toBeNull();
        expect(getToonUniforms(matsA[i])).not.toBe(getToonUniforms(m));
      }
      expect(getOutlineMesh(mb)?.parent).toBe(mb);
      // Exactly one outline child: no stale clone of the source's outline.
      expect(mb.children.filter((c) => c.userData.toonOutline).length).toBe(1);
    }

    instCopy.setColor('#00ff00');
    instCopy.getThreeObject();
    const srcColor = (bodyMesh(inst.getThreeObject()).material as THREE.MeshStandardMaterial).color;
    expect(`#${srcColor.getHexString()}`).toBe('#58c4dd');

    inst.dispose();
    const copyMesh = bodyMesh(instCopy.getThreeObject());
    expect(getToonUniforms(copyMesh.material as THREE.Material)).not.toBeNull();
    expect(getOutlineMesh(copyMesh)).not.toBeNull();
  });

  // MIGRATION: example for the property
  //   ∀ mesh replacement or dispose of a 3D mobject with an outline: every
  //   outline material and outline depth material that leaves the tree is
  //   disposed exactly once, and no live mesh keeps a stale outline.
  // Replace with a property test once the suite lands.
  it('frees the outline of a replaced instanced mesh and on dispose', () => {
    const inst = new InstancedMobject({
      geometry: new THREE.SphereGeometry(0.2, 8, 6),
      material: new THREE.MeshStandardMaterial(),
      instances: [{ position: [0, 0, 0] }],
    }).setToonShading();
    const oldMesh = inst.getInstancedMesh();
    const oldOutline = getOutlineMesh(oldMesh) as THREE.Mesh;
    const draws: THREE.Material[] = [];
    inst.opacity = 0.5;
    inst.getThreeObject();
    oldOutline.onBeforeRender(
      stubRenderer(draws),
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
      oldMesh.geometry,
      oldOutline.material as THREE.Material,
      new THREE.Group(),
    );
    const disposed: THREE.Material[] = [];
    for (const m of [oldOutline.material as THREE.Material, draws[0]]) {
      m.addEventListener('dispose', () => disposed.push(m));
    }

    inst.setInstances([{ position: [0, 0, 0] }, { position: [1, 0, 0] }]);
    inst.getThreeObject();
    expect(getOutlineMesh(oldMesh)).toBeNull();
    expect(disposed.length).toBe(2);

    const newOutline = getOutlineMesh(inst.getInstancedMesh()) as THREE.Mesh;
    let freed = false;
    (newOutline.material as THREE.Material).addEventListener('dispose', () => (freed = true));
    inst.dispose();
    expect(freed).toBe(true);
  });
});

describe('toon model copies', () => {
  // MIGRATION: example for the property
  //   ∀ toon-shaded ModelMobject m, c = m.copy(), ∀ reveal alpha a on m:
  //   after m.dispose(), every material of c reveals all; a colour change on a
  //   material of c leaves m's material unchanged while m is live.
  // Replace with a property test once the suite lands.
  it('a copy does not share reveal state or colour with its source', () => {
    const makeModel = () => {
      const root = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: '#ff0000' });
      root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));
      root.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat));
      return root;
    };
    // No sync before copy(): the toon setting is still pending.
    const source = new ModelMobject(makeModel()).setToonShading();
    const copy = source.copy();
    source.getThreeObject();
    copy.getThreeObject();

    const copyMesh = bodyMesh(copy.getThreeObject());
    const copyMat = copyMesh.material as THREE.MeshStandardMaterial;
    copyMat.color.set('#00ff00');
    const srcMat = bodyMesh(source.getThreeObject()).material as THREE.MeshStandardMaterial;
    expect(`#${srcMat.color.getHexString()}`).toBe('#ff0000');

    const sweep = new SweepReveal3D(source, { axis: [1, 0, 0] });
    sweep.begin();
    sweep.interpolate(0.2);
    source.dispose();
    copy.getThreeObject().traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o.userData.toonOutline) return;
      const r = revealValuesOf(o.material as THREE.Material);
      expect(r.plane.toArray()).toEqual([0, 0, 0, 1]);
      expect([r.lo, r.hi]).toEqual([-1, 2]);
    });
  });

  // MIGRATION: example for the property
  //   ∀ ModelMobject m without toon or reveal state, c = m.copy(): toon shading
  //   or a reveal applied to c later leaves every material of m unpatched.
  // Replace with a property test once the suite lands.
  it('toon or a reveal added to a copy later leaves the source as it was', () => {
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
    const source = new ModelMobject(root);
    source.getThreeObject();
    const copy = source.copy();
    const srcMat = bodyMesh(source.getThreeObject()).material as THREE.Material;
    // Without the toon look a copy shares its materials, as on main.
    expect(bodyMesh(copy.getThreeObject()).material).toBe(srcMat);

    const sweep = new SweepReveal3D(copy, { axis: [1, 0, 0] });
    sweep.begin();
    sweep.interpolate(0.2);
    copy.setToonShading();
    copy.getThreeObject();
    expect(hasMaterialPatch(srcMat)).toBe(false);
    expect(bodyMesh(source.getThreeObject()).material).toBe(srcMat);
    expect(
      getToonUniforms(bodyMesh(copy.getThreeObject()).material as THREE.Material),
    ).not.toBeNull();
  });
});

describe('SweepReveal3D on attribute-revealed shapes', () => {
  // MIGRATION: example for the property
  //   ∀ shape s with a `reveal` attribute, ∀ reverse r, ∀ t in [0, 1]:
  //   the visible vertex count is 0 at t = 0, all at t = 1, and grows with t;
  //   reverse shows the vertices with the highest reveal first.
  // Replace with a property test once the suite lands.
  it('reverse hides the shape at 0 and grows it from the end of its build order', () => {
    const blob = new Blob3D({ radius: 1 });
    blob.getThreeObject();
    const mesh = bodyMesh(blob.getThreeObject());
    const material = mesh.material as THREE.Material;
    const total = mesh.geometry.getAttribute('position').count;
    const anim = new SweepReveal3D(blob, { reverse: true });
    anim.begin();
    anim.interpolate(0);
    expect(visibleCount(mesh, material)).toBe(0);
    anim.interpolate(0.5);
    const half = visibleCount(mesh, material);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(total);
    // Reverse: the shown vertices are the ones late in the build order.
    const r = revealValuesOf(material);
    expect(r.lo).toBeCloseTo(0.5, 6);
    anim.interpolate(1);
    expect(visibleCount(mesh, material)).toBe(total);
  });

  // MIGRATION: example for the property
  //   ∀ translucent shape s, ∀ reveal animation, ∀ alpha: every depth-only helper
  //   (prepass child, outline depth draw) clips exactly like the part it serves.
  // Replace with a property test once the suite lands.
  it('clips the depth prepass and the outline depth draw with the reveal', () => {
    const blob = new Blob3D({ radius: 1, opacity: 0.5 }).setToonShading();
    const mesh = bodyMesh(blob.getThreeObject());
    const prepass = mesh.children.find(
      (c): c is THREE.Mesh => c instanceof THREE.Mesh && !c.userData.toonOutline && !!c.material,
    ) as THREE.Mesh;
    const anim = new SweepReveal3D(blob, { axis: [1, 0, 0] });
    anim.begin();
    anim.interpolate(0.4);
    const body = revealValuesOf(mesh.material as THREE.Material);
    expect(revealValuesOf(prepass.material as THREE.Material)).toEqual(body);

    const outline = getOutlineMesh(mesh) as THREE.Mesh;
    const draws: THREE.Material[] = [];
    outline.onBeforeRender(
      stubRenderer(draws),
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
      mesh.geometry,
      outline.material as THREE.Material,
      new THREE.Group(),
    );
    expect(draws.length).toBe(1);
    expect(revealValuesOf(draws[0])).toEqual(body);
  });
});

describe('3D creation reset in a group', () => {
  // MIGRATION: example for the property
  //   ∀ group G of 3D mobjects with child opacities o_i, ∀ creation animation A
  //   (Create3D, SweepReveal3D, GrowAlongPath3D), ∀ alpha a:
  //   A.begin(); A.interpolate(a); A.reset() leaves every child at o_i.
  // Replace with a property test once the suite lands.
  it('reset() gives every child its own start opacity back', () => {
    const makers = [
      (g: Group) => new Create3D(g),
      (g: Group) => new SweepReveal3D(g),
      (g: Group) => new GrowAlongPath3D(g),
    ];
    for (const make of makers) {
      const kids = [0.4, 1, 0.7].map((o) => new Sphere({ opacity: o }).setToonShading());
      const group = new Group(...kids);
      group.getThreeObject();
      const anim = make(group);
      anim.begin();
      anim.interpolate(0.3);
      anim.reset();
      expect(kids.map((k) => k.opacity)).toEqual([0.4, 1, 0.7]);
    }
  });
});

describe('Create3D', () => {
  // MIGRATION: example for the property
  //   ∀ alphas a, b: interpolate(a); interpolate(b); interpolate(a) leaves the same
  //   opacity and outline opacity as interpolate(a) alone (pure function of alpha),
  //   interpolate(1) restores the opacity the mobject had at begin() (1 when it
  //   was 0), and reset() restores the opacity from before begin().
  // Replace with a property test once the suite lands.
  it('is a pure function of alpha: outline first, then the body', () => {
    const sphere = new Sphere({ opacity: 0.4 }).setToonShading();
    sphere.getThreeObject();
    const anim = new Create3D(sphere, { outlineFraction: 0.5 });
    anim.begin();

    anim.interpolate(0.25);
    const first = { opacity: sphere.opacity, outline: sphere._toonOutlineOpacity() };
    expect(first.opacity).toBe(0);
    expect(first.outline).toBe(1);

    anim.interpolate(0.9);
    anim.interpolate(0.25);
    expect({ opacity: sphere.opacity, outline: sphere._toonOutlineOpacity() }).toEqual(first);

    anim.interpolate(1);
    expect(sphere.opacity).toBeCloseTo(0.4);
    expect(sphere._toonOutlineOpacity()).toBe(1);

    // reset() restores the opacity from before begin(), also when it was 0.
    const hidden = new Sphere({ opacity: 0 }).setToonShading();
    const build = new Create3D(hidden);
    build.begin();
    build.interpolate(1);
    expect(hidden.opacity).toBe(1);
    build.reset();
    expect(hidden.opacity).toBe(0);
  });
});

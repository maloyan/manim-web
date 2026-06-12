/**
 * Tests for Surface3D self-occlusion via depth prepass (issue #416).
 *
 * A transparent Surface3D is a single mesh, so Three.js never sorts its
 * triangles — with depthWrite=false (the issue #255 recipe) the far part
 * of a bell-curve surface can draw over the near part. The fix renders
 * the geometry twice in the transparent pass: a depth-only prepass mesh
 * (colorWrite=false, depthWrite=true) followed by the normal color pass,
 * so only the front-most layer of the surface shades.
 *
 * The prepass mesh is created BEFORE the color mesh so its lower
 * object.id wins Three.js' reversePainterSortStable tiebreak (equal
 * groupOrder/renderOrder/z) and is guaranteed to draw first. That is an
 * internal Three.js invariant; these tests guard our side of it.
 */
import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';
import { ThreeDScene } from '../../core/ThreeDScene';
import { ParametricSurface } from './ParametricSurface';
import { Surface3D } from './Surface3D';

const bellFunc = (u: number, v: number): [number, number, number] => [
  u,
  v,
  Math.exp(-(u * u + v * v) / 0.32),
];

function makeSurface(extra: Partial<ConstructorParameters<typeof Surface3D>[0]> = {}): Surface3D {
  return new Surface3D({
    func: bellFunc,
    uRange: [-2, 2],
    vRange: [-2, 2],
    uResolution: 8,
    vResolution: 8,
    opacity: 0.85,
    ...extra,
  });
}

function getColorMesh(surface: Surface3D): THREE.Mesh {
  return surface.getThreeObject() as THREE.Mesh;
}

function getPrepassMesh(surface: Surface3D): THREE.Mesh {
  const mesh = getColorMesh(surface);
  const prepass = mesh.children.find(
    (c) =>
      (c as THREE.Mesh).isMesh &&
      ((c as THREE.Mesh).material as THREE.Material).userData.depthPrepass,
  );
  expect(prepass, 'expected a depth-prepass child mesh').toBeDefined();
  return prepass as THREE.Mesh;
}

function getPrepassMaterial(surface: Surface3D): THREE.Material {
  return getPrepassMesh(surface).material as THREE.Material;
}

function getColorMaterial(surface: Surface3D): THREE.MeshStandardMaterial {
  return getColorMesh(surface).material as THREE.MeshStandardMaterial;
}

describe('Surface3D depth prepass (issue #416)', () => {
  it('transparent surface has a depth-only prepass mesh sharing its geometry', () => {
    const surface = makeSurface();
    const colorMesh = getColorMesh(surface);
    const prepass = getPrepassMesh(surface);
    const prepassMat = prepass.material as THREE.Material;

    expect(prepassMat.colorWrite).toBe(false);
    expect(prepassMat.depthWrite).toBe(true);
    expect(prepassMat.depthTest).toBe(true);
    expect(prepassMat.transparent).toBe(true);
    expect(prepassMat.userData.depthPrepass).toBe(true);
    expect(prepass.geometry).toBe(colorMesh.geometry);
  });

  it('prepass mesh has a lower object id than the color mesh (draw-order tiebreak)', () => {
    const surface = makeSurface();
    expect(getPrepassMesh(surface).id).toBeLessThan(getColorMesh(surface).id);
  });

  it('prepass mesh is invisible to raycasting', () => {
    const surface = makeSurface();
    const colorMesh = getColorMesh(surface);
    colorMesh.updateMatrixWorld(true);

    const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1));
    const hits = raycaster.intersectObject(colorMesh, true);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.object).toBe(colorMesh);
    }
  });

  it('prepass mirrors the side setting of the color material', () => {
    const doubleSided = makeSurface({ doubleSided: true });
    expect(getPrepassMaterial(doubleSided).side).toBe(THREE.DoubleSide);

    const singleSided = makeSurface({ doubleSided: false });
    expect(getPrepassMaterial(singleSided).side).toBe(THREE.FrontSide);
  });

  it('checkerboard (non-indexed) surface gets the same prepass invariants', () => {
    const surface = makeSurface({ checkerboardColors: ['#E65A4C', '#2D72D2'] });
    const colorMesh = getColorMesh(surface);
    const prepass = getPrepassMesh(surface);
    const prepassMat = prepass.material as THREE.Material;

    expect(getColorMaterial(surface).vertexColors).toBe(true);
    expect(prepassMat.colorWrite).toBe(false);
    expect(prepassMat.depthWrite).toBe(true);
    expect(prepassMat.userData.depthPrepass).toBe(true);
    expect(prepass.geometry).toBe(colorMesh.geometry);
    expect(colorMesh.geometry.index).toBeNull();
  });

  it('wireframe surface keeps the prepass disabled (depthWrite=false, not drawn)', () => {
    const surface = makeSurface({ wireframe: true });
    expect(getPrepassMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMaterial(surface).visible).toBe(false);
  });

  it('fully transparent surface disables the prepass depth write', () => {
    const surface = makeSurface({ opacity: 0 });
    expect(getPrepassMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMaterial(surface).visible).toBe(false);
  });

  it('opaque surface disables the prepass (color mesh writes its own depth)', () => {
    const surface = makeSurface({ opacity: 1 });
    expect(getPrepassMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMaterial(surface).visible).toBe(false);
  });

  it('runtime opacity changes toggle the prepass across 1 → 0.5 → 0 → 0.5', () => {
    const scene = ThreeDScene.createHeadless();
    const surface = makeSurface({ opacity: 1 });
    scene.add(surface);

    expect(getPrepassMaterial(surface).depthWrite).toBe(false);

    surface.setStrokeOpacity(0.5);
    scene.render();
    expect(getColorMaterial(surface).transparent).toBe(true);
    expect(getColorMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMaterial(surface).depthWrite).toBe(true);
    expect(getPrepassMaterial(surface).visible).toBe(true);

    surface.setStrokeOpacity(0);
    scene.render();
    expect(getPrepassMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMaterial(surface).visible).toBe(false);

    surface.setStrokeOpacity(0.5);
    scene.render();
    expect(getPrepassMaterial(surface).depthWrite).toBe(true);

    scene.dispose();
  });

  it('runtime wireframe toggle disables and re-enables the prepass', () => {
    const scene = ThreeDScene.createHeadless();
    const surface = makeSurface();
    scene.add(surface);

    expect(getPrepassMaterial(surface).depthWrite).toBe(true);

    surface.setWireframe(true);
    scene.render();
    expect(getPrepassMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMaterial(surface).visible).toBe(false);

    surface.setWireframe(false);
    scene.render();
    expect(getPrepassMaterial(surface).depthWrite).toBe(true);
    expect(getPrepassMaterial(surface).visible).toBe(true);

    scene.dispose();
  });

  it('syncing without a scene keeps color depthWrite correct (Transform-target path)', () => {
    // FadeMorphStrategy attaches Transform targets straight to the Three.js
    // parent, bypassing ThreeDScene's depth settings — the surface itself
    // must keep depthWrite consistent with its own transparency.
    const surface = makeSurface({ opacity: 1 });
    surface.setStrokeOpacity(0.5);
    surface._syncToThree();
    expect(getColorMaterial(surface).depthWrite).toBe(false);

    surface.setStrokeOpacity(1);
    surface._syncToThree();
    expect(getColorMaterial(surface).depthWrite).toBe(true);
  });

  it('ThreeDScene.add keeps prepass depthWrite=true while color gets depthWrite=false', () => {
    const scene = ThreeDScene.createHeadless();
    const surface = makeSurface();
    scene.add(surface);

    const colorMat = getColorMaterial(surface);
    expect(colorMat.transparent).toBe(true);
    expect(colorMat.depthTest).toBe(true);
    expect(colorMat.depthWrite).toBe(false);

    const prepassMat = getPrepassMaterial(surface);
    expect(prepassMat.depthTest).toBe(true);
    expect(prepassMat.depthWrite).toBe(true);

    scene.dispose();
  });

  it('prepass and color mesh always share the same renderOrder (sort-tiebreak precondition)', () => {
    // The id tiebreak in three.js' transparent sort only applies when
    // renderOrder is equal — every renderOrder stamping path must hit
    // both meshes uniformly.
    const scene = ThreeDScene.createHeadless();
    const surface = makeSurface();
    scene.add(surface);
    expect(getPrepassMesh(surface).renderOrder).toBe(getColorMesh(surface).renderOrder);
    expect(getColorMesh(surface).renderOrder).toBe(0);

    const fgSurface = makeSurface();
    scene.addForegroundMobject(fgSurface);
    expect(getPrepassMesh(fgSurface).renderOrder).toBe(getColorMesh(fgSurface).renderOrder);

    scene.dispose();
  });

  it('prepass child keeps an identity local transform (sort-z equality precondition)', () => {
    const surface = makeSurface();
    const prepass = getPrepassMesh(surface);
    prepass.updateMatrix();
    expect(prepass.matrix.equals(new THREE.Matrix4())).toBe(true);
  });

  it('HUD path (addFixedInFrameMobjects) applies the same depth rules to surfaces', () => {
    const scene = ThreeDScene.createHeadless();
    const surface = makeSurface();
    scene.addFixedInFrameMobjects(surface);

    expect(getPrepassMaterial(surface).depthWrite).toBe(true);
    expect(getColorMaterial(surface).depthWrite).toBe(false);
    expect(getPrepassMesh(surface).renderOrder).toBe(0);
    expect(getColorMesh(surface).renderOrder).toBe(0);

    scene.dispose();
  });

  it('geometry rebuild (setFunc) updates both meshes and disposes the old geometry', () => {
    const surface = makeSurface();
    const colorMesh = getColorMesh(surface);
    const oldGeometry = colorMesh.geometry;
    const disposeSpy = vi.spyOn(oldGeometry, 'dispose');

    surface.setFunc((u, v) => [u, v, u * v]);

    const prepass = getPrepassMesh(surface);
    expect(colorMesh.geometry).not.toBe(oldGeometry);
    expect(prepass.geometry).toBe(colorMesh.geometry);
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('geometry rebuild on a checkerboard surface keeps shared non-indexed geometry', () => {
    const surface = makeSurface({ checkerboardColors: ['#E65A4C', '#2D72D2'] });
    const colorMesh = getColorMesh(surface);

    surface.setURange([-1, 1]);

    const prepass = getPrepassMesh(surface);
    expect(prepass.geometry).toBe(colorMesh.geometry);
    expect(colorMesh.geometry.index).toBeNull();
  });

  it('copy() preserves the prepass on the copied surface', () => {
    const surface = makeSurface();
    const copied = surface.copy();
    expect(getPrepassMaterial(copied).depthWrite).toBe(true);
  });
});

describe('ParametricSurface.copy (latent bug found in #416 review)', () => {
  it('round-trips checkerboardColors into identical baked vertex colors', () => {
    const surface = new ParametricSurface({
      func: bellFunc,
      checkerboardColors: ['#E65A4C', '#2D72D2'],
    });
    const copied = surface.copy();

    const material = (copied.getThreeObject() as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(material.vertexColors).toBe(true);

    const originalColors = (surface.getThreeObject() as THREE.Mesh).geometry.getAttribute('color');
    const copiedColors = (copied.getThreeObject() as THREE.Mesh).geometry.getAttribute('color');
    expect(Array.from(copiedColors.array)).toEqual(Array.from(originalColors.array));
  });
});

describe('three.js transparent-sort tiebreak (upstream invariant the fix relies on)', () => {
  // The prepass draws before the color mesh only because, with equal
  // groupOrder/renderOrder/z, reversePainterSortStable falls back to
  // ascending object id. Verified against three r0.184; this test fails
  // loudly if a three.js upgrade changes that comparator.
  it('orders equal-z transparent render items by ascending object id', async () => {
    const { WebGLRenderList } = await import('three/src/renderers/webgl/WebGLRenderLists.js');

    const makeItem = (objectId: number, materialId: number) => ({
      object: { id: objectId, renderOrder: 0 },
      material: { id: materialId, transparent: true },
    });
    const a = makeItem(1, 200);
    const b = makeItem(2, 100);

    // Insert in reverse id order so a stable no-op sort cannot pass.
    const list = new WebGLRenderList();
    list.push(b.object, null, b.material, 0, 5, null);
    list.push(a.object, null, a.material, 0, 5, null);
    list.sort(null, null);

    expect(list.transparent.map((item: { id: number }) => item.id)).toEqual([1, 2]);
  });
});

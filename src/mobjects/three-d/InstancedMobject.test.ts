/**
 * Tests for InstancedMobject — a safe, opt-in mobject that draws many copies of
 * one template via THREE.InstancedMesh (one draw call) for large scenes.
 *
 * No real GPU is used: these assert the instance data, matrices, color buffer,
 * needsUpdate flags, mesh count, and disposal, all readable without a renderer.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { InstancedMobject, type InstanceTransform } from './InstancedMobject';
import { Cube } from './Cube';

function makeGeometryMaterial(): { geometry: THREE.BufferGeometry; material: THREE.Material } {
  return {
    geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshStandardMaterial(),
  };
}

function countInstancedMeshes(obj: THREE.Object3D): number {
  let count = 0;
  obj.traverse((o) => {
    if (o instanceof THREE.InstancedMesh) count++;
  });
  return count;
}

describe('InstancedMobject', () => {
  it('builds one InstancedMesh with count equal to the number of instances', () => {
    const instances: InstanceTransform[] = [
      { position: [0, 0, 0] },
      { position: [1, 0, 0] },
      { position: [2, 0, 0] },
    ];
    const mob = new InstancedMobject({ ...makeGeometryMaterial(), instances });

    const mesh = mob.getInstancedMesh();
    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(mesh.count).toBe(3);
    expect(mob.getInstanceCount()).toBe(3);
    expect(countInstancedMeshes(mob.getThreeObject())).toBe(1);
  });

  it('places each instance at the given position (read back via getMatrixAt)', () => {
    const instances: InstanceTransform[] = [{ position: [0, 0, 0] }, { position: [5, -3, 2] }];
    const mob = new InstancedMobject({ ...makeGeometryMaterial(), instances });
    const mesh = mob.getInstancedMesh();

    const m = new THREE.Matrix4();
    mesh.getMatrixAt(1, m);
    const pos = new THREE.Vector3().setFromMatrixPosition(m);
    expect(pos.x).toBeCloseTo(5);
    expect(pos.y).toBeCloseTo(-3);
    expect(pos.z).toBeCloseTo(2);
  });

  it('applies per-instance rotation and scale into the instance matrix', () => {
    const instances: InstanceTransform[] = [
      { position: [1, 2, 3], rotation: [0, Math.PI / 2, 0], scale: 2 },
    ];
    const mob = new InstancedMobject({ ...makeGeometryMaterial(), instances });

    const m = mob.getInstanceMatrix(0);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    m.decompose(pos, quat, scale);

    expect(pos.toArray()).toEqual([1, 2, 3]);
    expect(scale.x).toBeCloseTo(2);
    expect(scale.y).toBeCloseTo(2);
    expect(scale.z).toBeCloseTo(2);

    const expected = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'));
    expect(quat.angleTo(expected)).toBeCloseTo(0);
  });

  it('applies per-instance color via setColorAt', () => {
    const instances: InstanceTransform[] = [
      { position: [0, 0, 0], color: '#ff0000' },
      { position: [1, 0, 0], color: '#0000ff' },
    ];
    const mob = new InstancedMobject({ ...makeGeometryMaterial(), instances });
    const mesh = mob.getInstancedMesh();

    expect(mesh.instanceColor).not.toBeNull();
    const c = new THREE.Color();
    mesh.getColorAt(0, c);
    expect(c.getHexString()).toBe('ff0000');
    mesh.getColorAt(1, c);
    expect(c.getHexString()).toBe('0000ff');
  });

  it('flags instanceMatrix for upload when an instance transform changes', () => {
    // BufferAttribute.needsUpdate is a write-only setter that bumps `.version`;
    // a rising version is the observable signal that an upload is queued.
    const mob = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [0, 0, 0] }],
    });
    const mesh = mob.getInstancedMesh();
    const versionBefore = mesh.instanceMatrix.version;

    mob.setInstanceTransform(0, { position: [9, 9, 9] });

    expect(mesh.instanceMatrix.version).toBeGreaterThan(versionBefore);
    const pos = new THREE.Vector3().setFromMatrixPosition(mob.getInstanceMatrix(0));
    expect(pos.toArray()).toEqual([9, 9, 9]);
  });

  it('flags instanceColor for upload when an instance color changes', () => {
    const mob = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [0, 0, 0], color: '#ffffff' }],
    });
    const mesh = mob.getInstancedMesh();
    expect(mesh.instanceColor).not.toBeNull();
    const versionBefore = mesh.instanceColor!.version;

    mob.setInstanceColor(0, '#00ff00');

    expect(mesh.instanceColor!.version).toBeGreaterThan(versionBefore);
    const c = new THREE.Color();
    mesh.getColorAt(0, c);
    expect(c.getHexString()).toBe('00ff00');
  });

  it('setInstances updates in place when the count is unchanged (same mesh)', () => {
    const mob = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [0, 0, 0] }, { position: [1, 0, 0] }],
    });
    const meshBefore = mob.getInstancedMesh();

    mob.setInstances([{ position: [3, 3, 3] }, { position: [4, 4, 4] }]);
    const meshAfter = mob.getInstancedMesh();

    expect(meshAfter).toBe(meshBefore);
    const pos = new THREE.Vector3().setFromMatrixPosition(mob.getInstanceMatrix(0));
    expect(pos.toArray()).toEqual([3, 3, 3]);
  });

  it('setInstances rebuilds exactly one mesh when the count changes', () => {
    const mob = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [0, 0, 0] }],
    });
    mob.getInstancedMesh();

    mob.setInstances([{ position: [0, 0, 0] }, { position: [1, 1, 1] }, { position: [2, 2, 2] }]);

    const mesh = mob.getInstancedMesh();
    expect(mesh.count).toBe(3);
    expect(countInstancedMeshes(mob.getThreeObject())).toBe(1);
  });

  it('derives geometry and material from a template mobject', () => {
    const template = new Cube({ sideLength: 2, color: '#123456' });
    const mob = new InstancedMobject({
      template,
      instances: [{ position: [0, 0, 0] }],
    });

    expect(mob.getGeometry()).toBeInstanceOf(THREE.BufferGeometry);
    expect(mob.getMaterial()).toBeInstanceOf(THREE.Material);
    // Derived geometry is a clone, not the template's own geometry.
    const templateMesh = template.getThreeObject() as THREE.Mesh;
    expect(mob.getGeometry()).not.toBe(templateMesh.geometry);
  });

  it('constructs 10k instances without throwing and keeps exactly one mesh', () => {
    const instances: InstanceTransform[] = [];
    for (let i = 0; i < 10000; i++) {
      instances.push({ position: [i, 0, 0] });
    }
    const mob = new InstancedMobject({ ...makeGeometryMaterial(), instances });

    const mesh = mob.getInstancedMesh();
    expect(mesh.count).toBe(10000);
    expect(countInstancedMeshes(mob.getThreeObject())).toBe(1);
  });

  it('reports isEmpty only when there are no instances', () => {
    const empty = new InstancedMobject({ ...makeGeometryMaterial(), instances: [] });
    expect(empty.isEmpty()).toBe(true);

    const full = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [0, 0, 0] }],
    });
    expect(full.isEmpty()).toBe(false);
  });

  it('getCenter reflects the spread of the instance cloud', () => {
    const mob = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [-2, 0, 0] }, { position: [2, 0, 0] }],
    });
    const center = mob.getCenter();
    expect(center[0]).toBeCloseTo(0);
    expect(center[1]).toBeCloseTo(0);
    expect(center[2]).toBeCloseTo(0);
  });

  it('throws on an out-of-range instance index', () => {
    const mob = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [0, 0, 0] }],
    });
    expect(() => mob.setInstanceTransform(5, { position: [0, 0, 0] })).toThrow(RangeError);
    expect(() => mob.setInstanceColor(-1, '#fff')).toThrow(RangeError);
  });

  it('disposes geometry, material, and the instanced mesh without leaks', () => {
    const { geometry, material } = makeGeometryMaterial();
    const geoSpy = { called: false };
    const matSpy = { called: false };
    geometry.dispose = () => {
      geoSpy.called = true;
    };
    material.dispose = () => {
      matSpy.called = true;
    };
    const mob = new InstancedMobject({ geometry, material, instances: [{ position: [0, 0, 0] }] });
    const mesh = mob.getInstancedMesh();
    let meshDisposed = false;
    mesh.dispose = () => {
      meshDisposed = true;
    };

    mob.dispose();

    expect(meshDisposed).toBe(true);
    expect(geoSpy.called).toBe(true);
    expect(matSpy.called).toBe(true);
  });

  it('copy() clones geometry, material, and instances (deep, independent)', () => {
    const original = new InstancedMobject({
      ...makeGeometryMaterial(),
      instances: [{ position: [1, 1, 1], color: '#ff0000' }],
      color: '#abcdef',
    });
    const clone = original.copy();

    expect(clone).toBeInstanceOf(InstancedMobject);
    expect(clone.getInstanceCount()).toBe(1);
    expect(clone.getGeometry()).not.toBe(original.getGeometry());
    expect(clone.getMaterial()).not.toBe(original.getMaterial());

    // Mutating the clone does not affect the original.
    clone.setInstanceTransform(0, { position: [9, 9, 9] });
    const origPos = new THREE.Vector3().setFromMatrixPosition(original.getInstanceMatrix(0));
    expect(origPos.toArray()).toEqual([1, 1, 1]);
  });
});

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { meshMaterial } from './threeMaterial';
import { VGroup } from './VGroup';
import { VMobject } from './VMobject';
import { Circle } from '../mobjects/geometry/index';

describe('meshMaterial', () => {
  it('returns the single material of a mesh, typed as the requested subtype', () => {
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);

    const result = meshMaterial<THREE.MeshBasicMaterial>(mesh);

    expect(result).toBe(material);
    expect(result.color.getHex()).toBe(0xff0000);
  });

  it('returns the first material when the mesh carries a material array', () => {
    const first = new THREE.MeshStandardMaterial();
    const second = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), [first, second]);

    expect(meshMaterial(mesh)).toBe(first);
  });
});

describe('Mobject.getMesh / getMeshMaterial', () => {
  // Minimal concrete mobject whose backing object is a plain Mesh.
  class MeshMobject extends VMobject {
    private readonly _material = new THREE.MeshBasicMaterial();
    protected override _createThreeObject(): THREE.Object3D {
      return new THREE.Mesh(new THREE.BufferGeometry(), this._material);
    }
    readThroughGetMesh(): THREE.Mesh | null {
      return this.getMesh();
    }
    readThroughGetMeshMaterial(): THREE.MeshBasicMaterial | null {
      return this.getMeshMaterial<THREE.MeshBasicMaterial>();
    }
    ownMaterial(): THREE.MeshBasicMaterial {
      return this._material;
    }
  }

  it('getMesh returns the backing mesh once it is built', () => {
    const mob = new MeshMobject();
    expect(mob.readThroughGetMesh()).toBeNull();
    mob.getThreeObject();
    expect(mob.readThroughGetMesh()).toBeInstanceOf(THREE.Mesh);
  });

  it('getMeshMaterial returns the typed material once the mesh exists', () => {
    const mob = new MeshMobject();
    expect(mob.readThroughGetMeshMaterial()).toBeNull();
    mob.getThreeObject();
    expect(mob.readThroughGetMeshMaterial()).toBe(mob.ownMaterial());
  });

  it('getMesh returns null for a container backed by a THREE.Group', () => {
    class GroupMobject extends VMobject {
      protected override _createThreeObject(): THREE.Object3D {
        return new THREE.Group();
      }
      readThroughGetMesh(): THREE.Mesh | null {
        return this.getMesh();
      }
    }
    const mob = new GroupMobject();
    mob.getThreeObject();
    expect(mob.readThroughGetMesh()).toBeNull();
  });
});

describe('VGroup.getChildrenAs', () => {
  it('returns the children typed as the requested VMobject subtype', () => {
    const a = new Circle();
    const b = new Circle();
    const group = new VGroup(a, b);

    const children = group.getChildrenAs<Circle>();

    expect(children).toHaveLength(2);
    expect(children[0]).toBe(a);
    expect(children[1]).toBe(b);
  });

  it('is the same array the base children accessor exposes', () => {
    const group = new VGroup(new Circle());
    expect(group.getChildrenAs()).toStrictEqual(group.children);
  });
});

/**
 * Tests for Bond3D (a 3D chemical bond: an oriented cylinder from start to end).
 *
 * Bond3D builds a CylinderGeometry centered at the midpoint of start->end and
 * orients it along that direction via orientMeshAlong. With split:true it draws
 * two half-length cylinders meeting at the midpoint so each half can carry the
 * color of the atom it touches.
 */
import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { Bond3D } from './Bond3D';

/** Collect the mesh children of a Bond3D's backing group. */
function meshesOf(bond: Bond3D): THREE.Mesh[] {
  const obj = bond.getThreeObject();
  const out: THREE.Mesh[] = [];
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) out.push(child);
  });
  return out;
}

/** World direction that a mesh's local +Y maps to. */
function orientedY(mesh: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion);
}

describe('Bond3D geometry', () => {
  it('reports the length as |end - start|', () => {
    const bond = new Bond3D({ start: [0, 0, 0], end: [3, 4, 0] });
    expect(bond.getLength()).toBeCloseTo(5, 6);
  });

  it('exposes start and end as copies', () => {
    const bond = new Bond3D({ start: [1, 2, 3], end: [4, 5, 6] });
    expect(bond.getStart()).toEqual([1, 2, 3]);
    expect(bond.getEnd()).toEqual([4, 5, 6]);
    bond.getStart()[0] = 99;
    expect(bond.getStart()).toEqual([1, 2, 3]);
  });

  it('builds one cylinder whose height equals the bond length', () => {
    const bond = new Bond3D({ start: [0, 0, 0], end: [0, 0, 2] });
    const meshes = meshesOf(bond);
    expect(meshes).toHaveLength(1);
    const geom = meshes[0].geometry as THREE.CylinderGeometry;
    expect(geom.parameters.height).toBeCloseTo(2, 6);
  });

  it('centers the cylinder at the midpoint', () => {
    const bond = new Bond3D({ start: [0, 0, 0], end: [2, 0, 0] });
    const mesh = meshesOf(bond)[0];
    expect(mesh.position.x).toBeCloseTo(1, 6);
    expect(mesh.position.y).toBeCloseTo(0, 6);
    expect(mesh.position.z).toBeCloseTo(0, 6);
  });

  it('orients the cylinder along X', () => {
    const bond = new Bond3D({ start: [0, 0, 0], end: [2, 0, 0] });
    const dir = orientedY(meshesOf(bond)[0]);
    expect(dir.x).toBeCloseTo(1, 6);
    expect(dir.y).toBeCloseTo(0, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });

  it('orients the cylinder along Z', () => {
    const bond = new Bond3D({ start: [0, 0, 0], end: [0, 0, 4] });
    const dir = orientedY(meshesOf(bond)[0]);
    expect(dir.z).toBeCloseTo(1, 6);
  });

  it('orients the cylinder along a diagonal', () => {
    const bond = new Bond3D({ start: [1, 1, 1], end: [2, 3, 5] });
    const target = new THREE.Vector3(1, 2, 4).normalize();
    const dir = orientedY(meshesOf(bond)[0]);
    expect(dir.x).toBeCloseTo(target.x, 6);
    expect(dir.y).toBeCloseTo(target.y, 6);
    expect(dir.z).toBeCloseTo(target.z, 6);
  });

  it('honors the radius option', () => {
    const bond = new Bond3D({ start: [0, 0, 0], end: [1, 0, 0], radius: 0.2 });
    const geom = meshesOf(bond)[0].geometry as THREE.CylinderGeometry;
    expect(geom.parameters.radiusTop).toBeCloseTo(0.2, 6);
    expect(geom.parameters.radiusBottom).toBeCloseTo(0.2, 6);
  });

  it('does not throw on a degenerate zero-length bond', () => {
    expect(() => {
      const bond = new Bond3D({ start: [1, 1, 1], end: [1, 1, 1] });
      bond.getThreeObject();
      expect(bond.getLength()).toBe(0);
    }).not.toThrow();
  });
});

describe('Bond3D split coloring', () => {
  it('produces two half-length segments that meet at the midpoint', () => {
    const bond = new Bond3D({
      start: [0, 0, 0],
      end: [4, 0, 0],
      split: true,
      color: '#ff0000',
      endColor: '#0000ff',
    });
    const meshes = meshesOf(bond);
    expect(meshes).toHaveLength(2);

    // Each half spans half the full length.
    for (const mesh of meshes) {
      const geom = mesh.geometry as THREE.CylinderGeometry;
      expect(geom.parameters.height).toBeCloseTo(2, 6);
    }

    // Segment centers sit at the quarter and three-quarter points, so the
    // inner ends meet at the midpoint (x = 2).
    const centers = meshes.map((m) => m.position.x).sort((a, b) => a - b);
    expect(centers[0]).toBeCloseTo(1, 6);
    expect(centers[1]).toBeCloseTo(3, 6);
  });

  it('colors the start half and end half distinctly', () => {
    const bond = new Bond3D({
      start: [0, 0, 0],
      end: [2, 0, 0],
      split: true,
      color: '#ff0000',
      endColor: '#0000ff',
    });
    const meshes = meshesOf(bond).sort((a, b) => a.position.x - b.position.x);
    const startMat = meshes[0].material as THREE.MeshStandardMaterial;
    const endMat = meshes[1].material as THREE.MeshStandardMaterial;
    expect(startMat.color.getHexString()).toBe('ff0000');
    expect(endMat.color.getHexString()).toBe('0000ff');
  });

  it('falls back to the base color for the end half when endColor is absent', () => {
    const bond = new Bond3D({
      start: [0, 0, 0],
      end: [2, 0, 0],
      split: true,
      color: '#00ff00',
    });
    const meshes = meshesOf(bond);
    for (const mesh of meshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      expect(mat.color.getHexString()).toBe('00ff00');
    }
  });
});

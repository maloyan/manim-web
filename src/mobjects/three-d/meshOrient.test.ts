/**
 * Tests for orientMeshAlong (shared mesh-orientation helper).
 *
 * A Three.js cylinder, cone or tube segment points along its local +Y axis.
 * orientMeshAlong rotates a mesh so that local +Y maps to a target direction.
 * Arrow3D, Bond3D and other start->end primitives share this one function so
 * the quaternion math lives in a single place.
 */
import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { orientMeshAlong } from './meshOrient';

/** Apply a mesh quaternion to local +Y and return the world direction. */
function orientedY(mesh: THREE.Object3D): THREE.Vector3 {
  return new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion);
}

describe('orientMeshAlong', () => {
  it('aligns local +Y to +X', () => {
    const mesh = new THREE.Mesh();
    orientMeshAlong(mesh, [1, 0, 0]);
    const dir = orientedY(mesh);
    expect(dir.x).toBeCloseTo(1, 6);
    expect(dir.y).toBeCloseTo(0, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });

  it('aligns local +Y to +Z', () => {
    const mesh = new THREE.Mesh();
    orientMeshAlong(mesh, [0, 0, 1]);
    const dir = orientedY(mesh);
    expect(dir.x).toBeCloseTo(0, 6);
    expect(dir.y).toBeCloseTo(0, 6);
    expect(dir.z).toBeCloseTo(1, 6);
  });

  it('aligns local +Y to a diagonal direction', () => {
    const mesh = new THREE.Mesh();
    const target = new THREE.Vector3(1, 2, -3).normalize();
    orientMeshAlong(mesh, [1, 2, -3]);
    const dir = orientedY(mesh);
    expect(dir.x).toBeCloseTo(target.x, 6);
    expect(dir.y).toBeCloseTo(target.y, 6);
    expect(dir.z).toBeCloseTo(target.z, 6);
  });

  it('normalizes a non-unit direction before orienting', () => {
    const mesh = new THREE.Mesh();
    orientMeshAlong(mesh, [5, 0, 0]);
    const dir = orientedY(mesh);
    expect(dir.x).toBeCloseTo(1, 6);
    expect(dir.length()).toBeCloseTo(1, 6);
  });

  it('accepts a THREE.Vector3 direction', () => {
    const mesh = new THREE.Mesh();
    orientMeshAlong(mesh, new THREE.Vector3(0, 0, 2));
    const dir = orientedY(mesh);
    expect(dir.z).toBeCloseTo(1, 6);
  });

  it('keeps identity orientation when the direction is parallel to +Y', () => {
    const mesh = new THREE.Mesh();
    orientMeshAlong(mesh, [0, 1, 0]);
    const dir = orientedY(mesh);
    expect(dir.x).toBeCloseTo(0, 6);
    expect(dir.y).toBeCloseTo(1, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });

  it('handles the antiparallel (-Y) degenerate case without NaN', () => {
    const mesh = new THREE.Mesh();
    orientMeshAlong(mesh, [0, -1, 0]);
    const dir = orientedY(mesh);
    expect(Number.isNaN(dir.x)).toBe(false);
    expect(Number.isNaN(dir.y)).toBe(false);
    expect(Number.isNaN(dir.z)).toBe(false);
    expect(dir.x).toBeCloseTo(0, 6);
    expect(dir.y).toBeCloseTo(-1, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });

  it('leaves a zero-length direction as identity (no throw, no NaN)', () => {
    const mesh = new THREE.Mesh();
    expect(() => orientMeshAlong(mesh, [0, 0, 0])).not.toThrow();
    const q = mesh.quaternion;
    expect(Number.isNaN(q.x)).toBe(false);
    expect(q.x).toBeCloseTo(0, 6);
    expect(q.y).toBeCloseTo(0, 6);
    expect(q.z).toBeCloseTo(0, 6);
    expect(q.w).toBeCloseTo(1, 6);
  });
});

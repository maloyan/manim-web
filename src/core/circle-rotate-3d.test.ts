// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Circle } from '../../src/index';

describe('Circle rotate in 3D', () => {
  it('rotate around X axis should transform both stroke and fill mesh', () => {
    const circle = new Circle({
      radius: 1,
      color: '#ff0000',
      fillOpacity: 0.7,
      strokeWidth: 2,
    });

    // Force initial geometry build
    circle.getThreeObject();

    // Rotate around X axis
    circle.rotate(Math.PI / 12, { axis: [1, 0, 0] });

    // Verify points were transformed (Z values change)
    const pointsAfter = circle.getPoints();
    expect(pointsAfter[0][2]).toBeCloseTo(0, 5); // first point on X axis stays at Z=0
    expect(pointsAfter[1][2]).not.toBeCloseTo(0, 5); // other points get Z values
    expect(pointsAfter[2][2]).not.toBeCloseTo(0, 5);

    // Get the Three.js objects after rotation
    const threeObject = circle.getThreeObject();

    // Find the fill mesh (Mesh that is NOT a Line2)
    const fillMesh = threeObject.children.find(
      (c) => c instanceof THREE.Mesh && !(c as any).isLine2,
    ) as THREE.Mesh;

    // Find the stroke (Line2)
    const stroke = threeObject.children.find((c) => (c as any).isLine2) as any;

    // Check stroke has Z values
    const strokePositions = stroke?.geometry?.attributes?.instanceStart?.array;
    let strokeHasNonZeroZ = false;
    for (let i = 2; i < strokePositions.length; i += 3) {
      if (Math.abs(strokePositions[i]) > 0.001) {
        strokeHasNonZeroZ = true;
        break;
      }
    }
    expect(strokeHasNonZeroZ).toBe(true);

    // Check fill mesh geometry has Z values
    const positions = fillMesh?.geometry?.attributes?.position?.array;
    expect(positions).toBeDefined();

    let fillHasNonZeroZ = false;
    for (let i = 2; i < positions.length; i += 3) {
      if (Math.abs(positions[i]) > 0.001) {
        fillHasNonZeroZ = true;
        break;
      }
    }
    expect(fillHasNonZeroZ).toBe(true);

    // Verify no double rotation (group rotation should be identity)
    expect(threeObject.rotation.x).toBeCloseTo(0, 5);
  });
});

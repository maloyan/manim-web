import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

export interface PolygramOptions {
  vertexGroups: Vector3Tuple[][];
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

/**
 * Polygram - A generalized polygon that accepts multiple vertex groups.
 *
 * Each vertex group defines a separate closed path, allowing for disconnected
 * sets of edges and holes. This matches Python manim's Polygram.
 */
export class Polygram extends VMobject {
  private _vertexGroups: Vector3Tuple[][];

  constructor(options: PolygramOptions) {
    super();

    const {
      vertexGroups,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    if (!vertexGroups || vertexGroups.length === 0) {
      throw new Error('Polygram requires at least one vertex group');
    }

    for (let i = 0; i < vertexGroups.length; i++) {
      if (!vertexGroups[i] || vertexGroups[i].length < 2) {
        throw new Error(`Vertex group ${i} requires at least 2 vertices`);
      }
    }

    // Close each vertex group if needed
    this._vertexGroups = vertexGroups.map((group) => {
      const closed = group.map((v) => [...v] as Vector3Tuple);
      const first = closed[0];
      const last = closed[closed.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1] || first[2] !== last[2]) {
        closed.push([...first] as Vector3Tuple);
      }
      return closed;
    });

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  private _generatePoints(): void {
    // Remove any previous component children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    for (let g = 0; g < this._vertexGroups.length; g++) {
      const vertices = this._vertexGroups[g];
      const points = Polygram._buildPathPoints(vertices);

      if (g === 0) {
        this.setPoints3D(points);
      } else {
        const component = new VMobject();
        component.color = this.color;
        component.fillOpacity = this.fillOpacity;
        component.strokeWidth = this.strokeWidth;
        component.setPoints3D(points);
        this.add(component);
      }
    }
  }

  private static _buildPathPoints(vertices: Vector3Tuple[]): number[][] {
    const points: number[][] = [];
    // vertices already include closing vertex, so iterate up to length - 1
    for (let i = 0; i < vertices.length - 1; i++) {
      const p0 = vertices[i];
      const p1 = vertices[i + 1];
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (i === 0) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, p0[2] + (2 * dz) / 3]);
      points.push([...p1]);
    }
    return points;
  }

  getVertexGroups(): Vector3Tuple[][] {
    return this._vertexGroups.map((group) => group.map((v) => [...v] as Vector3Tuple));
  }

  getVertexGroup(index: number): Vector3Tuple[] {
    if (index < 0 || index >= this._vertexGroups.length) {
      throw new Error(`Vertex group index ${index} out of bounds`);
    }
    return this._vertexGroups[index].map((v) => [...v] as Vector3Tuple);
  }

  getCentroid(): Vector3Tuple {
    // Compute centroid of all vertices across all groups (excluding closing duplicates)
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let count = 0;

    for (const group of this._vertexGroups) {
      // Exclude the last vertex since it duplicates the first (closing)
      for (let i = 0; i < group.length - 1; i++) {
        sumX += group[i][0];
        sumY += group[i][1];
        sumZ += group[i][2];
        count++;
      }
    }

    if (count === 0) return [0, 0, 0];

    return [sumX / count, sumY / count, sumZ / count];
  }

  protected override _createCopy(): Polygram {
    // Strip closing vertices for the constructor (it auto-closes)
    const groups = this._vertexGroups.map((group) => {
      const stripped = group.map((v) => [...v] as Vector3Tuple);
      // Remove closing vertex if it matches the first
      if (stripped.length > 1) {
        const first = stripped[0];
        const last = stripped[stripped.length - 1];
        if (first[0] === last[0] && first[1] === last[1] && first[2] === last[2]) {
          stripped.pop();
        }
      }
      return stripped;
    });

    return new Polygram({
      vertexGroups: groups,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

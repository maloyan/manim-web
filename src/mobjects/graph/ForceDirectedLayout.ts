/**
 * ForceDirectedLayout - a live, animated spring (force-directed) layout.
 *
 * It runs the Fruchterman-Reingold simulation step by step over the animation's
 * run time and moves the graph's vertices to the stepped positions, so the
 * graph visibly relaxes. The whole trajectory is computed once at `begin()`, so
 * the animation is deterministic and safe to seek forward or backward.
 */

import { Animation, AnimationOptions } from '../../animation/Animation';
import { Vector3Tuple } from '../../core/Mobject';
import type { GenericGraph } from './GenericGraph';
import { VertexId, EdgeTuple } from './graphTypes';
import {
  SpringPoint,
  springForceConstant,
  springLayoutStep,
  randomSpringPositions,
  DEFAULT_SPRING_COOLING,
} from './layoutAlgorithms';

/**
 * Options for the ForceDirectedLayout animation.
 */
export interface ForceDirectedLayoutOptions extends AnimationOptions {
  /** Number of simulation steps to run. Default: 50. */
  iterations?: number;
  /** Cooling factor applied to the temperature each step. Default: 0.95. */
  cooling?: number;
  /** Layout scale. It sets the force constant and the initial temperature. Default: 2. */
  scale?: number;
  /** Layout center. Default: [0, 0, 0]. */
  center?: Vector3Tuple;
  /** Explicit initial positions. They override the random or seeded start. */
  initialPositions?: Map<VertexId, Vector3Tuple>;
  /** Seed for the random initial positions. Omit to start from the current positions. */
  seed?: number;
}

/**
 * A small deterministic pseudo-random generator (mulberry32).
 * It gives repeatable initial positions for a given seed.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Copy a positions map so the trajectory owns its own snapshots. */
function cloneSpringPositions(positions: Map<VertexId, SpringPoint>): Map<VertexId, SpringPoint> {
  const clone = new Map<VertexId, SpringPoint>();
  for (const [v, p] of positions) {
    clone.set(v, { x: p.x, y: p.y });
  }
  return clone;
}

export class ForceDirectedLayout extends Animation {
  private _graph: GenericGraph;
  private _iterations: number;
  private _cooling: number;
  private _scale: number;
  private _center: Vector3Tuple;
  private _seed?: number;
  private _initialPositions?: Map<VertexId, Vector3Tuple>;

  private _vertices: VertexId[] = [];
  private _edges: EdgeTuple[] = [];

  /** One positions snapshot per step (length = iterations + 1). */
  private _trajectory: Map<VertexId, SpringPoint>[] = [];

  constructor(graph: GenericGraph, options: ForceDirectedLayoutOptions = {}) {
    super(graph, options);
    this._graph = graph;
    this._iterations = options.iterations ?? 50;
    this._cooling = options.cooling ?? DEFAULT_SPRING_COOLING;
    this._scale = options.scale ?? 2;
    this._center = options.center ?? [0, 0, 0];
    this._seed = options.seed;
    this._initialPositions = options.initialPositions;
  }

  /**
   * Snapshot the graph and build the full simulation trajectory once.
   */
  override begin(): void {
    super.begin();
    this._vertices = this._graph.getVertices();
    this._edges = this._graph.getEdges();
    this._trajectory = this._computeTrajectory();
  }

  /**
   * Build the trajectory from the initial positions to the settled layout.
   * Each entry is the positions after one more step.
   */
  private _computeTrajectory(): Map<VertexId, SpringPoint>[] {
    const n = this._vertices.length;
    const trajectory: Map<VertexId, SpringPoint>[] = [];

    let pos = this._resolveInitialPositions();
    trajectory.push(cloneSpringPositions(pos));
    if (n === 0) return trajectory;

    const k = springForceConstant(n, this._scale);
    let temperature = this._scale;
    for (let iter = 0; iter < this._iterations; iter++) {
      const result = springLayoutStep(this._vertices, this._edges, pos, {
        k,
        temperature,
        cooling: this._cooling,
      });
      pos = result.positions;
      temperature = result.temperature;
      trajectory.push(cloneSpringPositions(pos));
    }
    return trajectory;
  }

  /** Resolve the starting positions from the options or the graph. */
  private _resolveInitialPositions(): Map<VertexId, SpringPoint> {
    const pos = new Map<VertexId, SpringPoint>();

    if (this._initialPositions) {
      for (const v of this._vertices) {
        const p = this._initialPositions.get(v) ?? this._center;
        pos.set(v, { x: p[0], y: p[1] });
      }
      return pos;
    }

    if (this._seed !== undefined) {
      return randomSpringPositions(
        this._vertices,
        this._scale,
        this._center,
        mulberry32(this._seed),
      );
    }

    // Fall back to the graph's current positions.
    for (const v of this._vertices) {
      const p = this._graph.getVertexPosition(v) ?? this._center;
      pos.set(v, { x: p[0], y: p[1] });
    }
    return pos;
  }

  /**
   * Move the graph's vertices to the simulation state for `alpha`.
   * It interpolates between the two nearest trajectory snapshots, so the motion
   * is smooth. `alpha` 0 is the initial layout and `alpha` 1 is the settled one.
   */
  interpolate(alpha: number): void {
    const steps = this._trajectory.length - 1;
    if (steps <= 0) return;

    const clamped = Math.max(0, Math.min(1, alpha));
    const t = clamped * steps;
    let i = Math.floor(t);
    if (i >= steps) i = steps - 1;
    const frac = t - i;

    const a = this._trajectory[i];
    const b = this._trajectory[i + 1];
    const z = this._center[2];
    for (const v of this._vertices) {
      const pa = a.get(v)!;
      const pb = b.get(v)!;
      const x = pa.x + (pb.x - pa.x) * frac;
      const y = pa.y + (pb.y - pa.y) * frac;
      this._graph.setVertexPosition(v, [x, y, z]);
    }
  }

  /**
   * Get the settled layout (the last trajectory snapshot).
   * The map is empty until `begin()` runs.
   */
  getSettledPositions(): Map<VertexId, Vector3Tuple> {
    const result = new Map<VertexId, Vector3Tuple>();
    if (this._trajectory.length === 0) return result;
    const last = this._trajectory[this._trajectory.length - 1];
    const z = this._center[2];
    for (const [v, p] of last) {
      result.set(v, [p.x, p.y, z]);
    }
    return result;
  }
}

/**
 * Factory for a ForceDirectedLayout animation.
 * @param graph - The graph to relax.
 * @param options - Animation and simulation options.
 * @returns A new ForceDirectedLayout animation.
 */
export function forceDirectedLayout(
  graph: GenericGraph,
  options?: ForceDirectedLayoutOptions,
): ForceDirectedLayout {
  return new ForceDirectedLayout(graph, options);
}

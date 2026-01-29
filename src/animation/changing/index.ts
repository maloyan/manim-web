/**
 * Changing animations - animations that create/modify mobjects based on runtime state.
 *
 * TracedPath - Creates a trail/path behind a moving mobject
 * AnimatedBoundary - Creates a "marching ants" animated boundary effect
 */

import { Mobject, UpdaterFunction } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { BLUE, YELLOW, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for TracedPath
 */
export interface TracedPathOptions {
  /** Stroke color of the path. Default: YELLOW */
  strokeColor?: string;
  /** Stroke width of the path. Default: DEFAULT_STROKE_WIDTH */
  strokeWidth?: number;
  /** Stroke opacity. Default: 1 */
  strokeOpacity?: number;
  /** Time in seconds for the trail to dissipate (0 = no dissipation). Default: 0 */
  dissipatingTime?: number;
  /** Minimum distance between recorded points. Default: 0.05 */
  minDistanceToNewPoint?: number;
  /** Maximum number of points to store (for performance). Default: 1000 */
  maxPoints?: number;
}

/**
 * TracedPath - Creates a trail/path behind a moving mobject.
 *
 * Tracks a mobject's position over time and creates a VMobject path following
 * the movement. Supports configurable stroke properties and optional fade out
 * of old path segments via the dissipatingTime option.
 *
 * @example
 * ```typescript
 * const dot = new Dot({ center: [0, 0, 0], color: BLUE });
 * const trail = new TracedPath(dot, {
 *   strokeColor: YELLOW,
 *   dissipatingTime: 2  // Trail fades over 2 seconds
 * });
 * scene.add(dot, trail);
 *
 * // Animate the dot, and the trail follows
 * scene.play(shift(dot, [3, 2, 0], { duration: 2 }));
 * ```
 */
export class TracedPath extends VMobject {
  /** The mobject being tracked */
  private _trackedMobject: Mobject;

  /** Time in seconds for trail to dissipate */
  private _dissipatingTime: number;

  /** Minimum distance between recorded points */
  private _minDistanceToNewPoint: number;

  /** Maximum number of points to store */
  private _maxPoints: number;

  /** Recorded path points with timestamps: [x, y, z, timestamp] */
  private _pathData: { point: number[]; time: number }[] = [];

  /** Total elapsed time */
  private _elapsedTime: number = 0;

  /** Last recorded position */
  private _lastPosition: number[] | null = null;

  /** The updater function reference (for removal) */
  private _updater: UpdaterFunction;

  constructor(trackedMobject: Mobject, options: TracedPathOptions = {}) {
    super();

    this._trackedMobject = trackedMobject;
    this._dissipatingTime = options.dissipatingTime ?? 0;
    this._minDistanceToNewPoint = options.minDistanceToNewPoint ?? 0.05;
    this._maxPoints = options.maxPoints ?? 1000;

    // Style configuration
    this.color = options.strokeColor ?? YELLOW;
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    this._opacity = options.strokeOpacity ?? 1;
    this.fillOpacity = 0; // Traced paths are stroke-only

    // Create the updater that tracks the mobject
    this._updater = (_mobject: Mobject, dt: number) => {
      this._updatePath(dt);
    };

    // Add updater to self so it runs every frame
    this.addUpdater(this._updater);

    // Record initial position
    this._recordCurrentPosition(0);
  }

  /**
   * Get the tracked mobject
   */
  get trackedMobject(): Mobject {
    return this._trackedMobject;
  }

  /**
   * Update the path based on current mobject position
   */
  private _updatePath(dt: number): void {
    this._elapsedTime += dt;

    // Record new position if moved enough
    this._recordCurrentPosition(this._elapsedTime);

    // Remove old points if dissipating
    if (this._dissipatingTime > 0) {
      this._removeOldPoints();
    }

    // Rebuild the VMobject points from path data
    this._rebuildPathPoints();
  }

  /**
   * Record the current position of the tracked mobject
   */
  private _recordCurrentPosition(currentTime: number): void {
    const center = this._trackedMobject.getCenter();
    const newPoint = [center[0], center[1], center[2]];

    // Check if we should add this point
    if (this._lastPosition) {
      const dx = newPoint[0] - this._lastPosition[0];
      const dy = newPoint[1] - this._lastPosition[1];
      const dz = newPoint[2] - this._lastPosition[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < this._minDistanceToNewPoint) {
        return; // Too close to last point
      }
    }

    // Add the point
    this._pathData.push({
      point: newPoint,
      time: currentTime
    });

    this._lastPosition = newPoint;

    // Limit total points for performance
    if (this._pathData.length > this._maxPoints) {
      this._pathData.shift();
    }
  }

  /**
   * Remove points that have exceeded the dissipating time
   */
  private _removeOldPoints(): void {
    const cutoffTime = this._elapsedTime - this._dissipatingTime;

    while (this._pathData.length > 0 && this._pathData[0].time < cutoffTime) {
      this._pathData.shift();
    }
  }

  /**
   * Rebuild the VMobject points from path data.
   * Creates smooth cubic Bezier curves through the tracked points.
   */
  private _rebuildPathPoints(): void {
    if (this._pathData.length < 2) {
      this.clearPoints();
      return;
    }

    // For a smooth path, we create cubic Bezier segments through the points
    // Using Catmull-Rom style control points for smooth curves
    const bezierPoints: number[][] = [];
    const data = this._pathData;

    // For each pair of consecutive points, create a cubic Bezier segment
    for (let i = 0; i < data.length - 1; i++) {
      const p0 = i > 0 ? data[i - 1].point : data[i].point;
      const p1 = data[i].point;
      const p2 = data[i + 1].point;
      const p3 = i + 2 < data.length ? data[i + 2].point : data[i + 1].point;

      // Calculate control points using Catmull-Rom to Bezier conversion
      const tension = 0.5;
      const handle1 = [
        p1[0] + (p2[0] - p0[0]) * tension / 3,
        p1[1] + (p2[1] - p0[1]) * tension / 3,
        p1[2] + (p2[2] - p0[2]) * tension / 3
      ];
      const handle2 = [
        p2[0] - (p3[0] - p1[0]) * tension / 3,
        p2[1] - (p3[1] - p1[1]) * tension / 3,
        p2[2] - (p3[2] - p1[2]) * tension / 3
      ];

      // Add anchor and handles (sharing anchors between segments)
      if (i === 0) {
        bezierPoints.push([...p1]); // First anchor
      }
      bezierPoints.push(handle1);   // Handle 1
      bezierPoints.push(handle2);   // Handle 2
      bezierPoints.push([...p2]);   // Anchor 2 (shared with next segment)
    }

    this.setPoints3D(bezierPoints);
  }

  /**
   * Clear the traced path
   */
  clearPath(): this {
    this._pathData = [];
    this._lastPosition = null;
    this.clearPoints();
    return this;
  }

  /**
   * Stop tracking (remove updater)
   */
  stopTracking(): this {
    this.removeUpdater(this._updater);
    return this;
  }

  /**
   * Resume tracking (add updater back)
   */
  resumeTracking(): this {
    if (!this.hasUpdaters()) {
      this.addUpdater(this._updater);
    }
    return this;
  }

  /**
   * Create a copy of this TracedPath
   */
  protected override _createCopy(): TracedPath {
    const copy = new TracedPath(this._trackedMobject, {
      strokeColor: this.color,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this._opacity,
      dissipatingTime: this._dissipatingTime,
      minDistanceToNewPoint: this._minDistanceToNewPoint,
      maxPoints: this._maxPoints
    });
    // Copy current path data
    copy._pathData = this._pathData.map(d => ({ point: [...d.point], time: d.time }));
    copy._elapsedTime = this._elapsedTime;
    copy._lastPosition = this._lastPosition ? [...this._lastPosition] : null;
    return copy;
  }
}

/**
 * Factory function to create a TracedPath
 */
export function tracedPath(
  trackedMobject: Mobject,
  options?: TracedPathOptions
): TracedPath {
  return new TracedPath(trackedMobject, options);
}


/**
 * Options for AnimatedBoundary
 */
export interface AnimatedBoundaryOptions {
  /** Colors to cycle through for the dashes. Default: [BLUE, YELLOW] */
  colors?: string[];
  /** Number of dashes around the boundary. Default: 30 */
  numDashes?: number;
  /** Width of the dashes. Default: 3 */
  dashWidth?: number;
  /** Animation speed (cycles per second). Default: 1 */
  cycleRate?: number;
  /** Buffer around the mobject. Default: 0.1 */
  buff?: number;
}

/**
 * AnimatedBoundary - Creates a "marching ants" style animated boundary around a mobject.
 *
 * Creates dashed lines around the perimeter of a mobject that animate
 * (march around the boundary), similar to selection borders in image editors.
 *
 * @example
 * ```typescript
 * const rect = new Rectangle({ width: 2, height: 1 });
 * const boundary = new AnimatedBoundary(rect, {
 *   colors: [RED, YELLOW],
 *   cycleRate: 2
 * });
 * scene.add(rect, boundary);
 * // The boundary will automatically animate
 * ```
 */
export class AnimatedBoundary extends VMobject {
  /** The mobject being bounded */
  private _boundedMobject: Mobject;

  /** Colors to cycle through */
  private _colors: string[];

  /** Number of dashes */
  private _numDashes: number;

  /** Width of dashes */
  private _dashWidth: number;

  /** Animation speed (cycles per second) */
  private _cycleRate: number;

  /** Buffer around mobject */
  private _buff: number;

  /** Current animation phase (0 to 1) */
  private _phase: number = 0;

  /** Child VMobjects representing dashes */
  private _dashes: VMobject[] = [];

  /** The updater function reference */
  private _updater: UpdaterFunction;

  constructor(boundedMobject: Mobject, options: AnimatedBoundaryOptions = {}) {
    super();

    this._boundedMobject = boundedMobject;
    this._colors = options.colors ?? [BLUE, YELLOW];
    this._numDashes = options.numDashes ?? 30;
    this._dashWidth = options.dashWidth ?? 3;
    this._cycleRate = options.cycleRate ?? 1;
    this._buff = options.buff ?? 0.1;

    // No fill for the boundary container
    this.fillOpacity = 0;
    this._opacity = 1;

    // Create initial boundary
    this._createBoundary();

    // Create updater for animation
    this._updater = (_mobject: Mobject, dt: number) => {
      this._updateAnimation(dt);
    };

    this.addUpdater(this._updater);
  }

  /**
   * Get the bounded mobject
   */
  get boundedMobject(): Mobject {
    return this._boundedMobject;
  }

  /**
   * Create the boundary dashes around the mobject
   */
  private _createBoundary(): void {
    // Clear existing dashes
    for (const dash of this._dashes) {
      this.remove(dash);
      dash.dispose();
    }
    this._dashes = [];

    // Get the bounding box of the mobject
    const bounds = this._boundedMobject.getBounds();
    const minX = bounds.min.x - this._buff;
    const minY = bounds.min.y - this._buff;
    const maxX = bounds.max.x + this._buff;
    const maxY = bounds.max.y + this._buff;

    // Calculate perimeter points (rectangle corners)
    const width = maxX - minX;
    const height = maxY - minY;
    // perimeter is calculated in _positionDashes, only used for context here
    void (2 * (width + height)); // perimeter calculation reference

    for (let i = 0; i < this._numDashes; i++) {
      const dash = new VMobject();
      dash.strokeWidth = this._dashWidth;
      dash.fillOpacity = 0;

      // Cycle through colors
      dash.color = this._colors[i % this._colors.length];

      this._dashes.push(dash);
      this.add(dash);
    }

    // Position dashes initially
    this._positionDashes(0);
  }

  /**
   * Position dashes around the boundary at the given phase
   */
  private _positionDashes(phase: number): void {
    const bounds = this._boundedMobject.getBounds();
    const minX = bounds.min.x - this._buff;
    const minY = bounds.min.y - this._buff;
    const maxX = bounds.max.x + this._buff;
    const maxY = bounds.max.y + this._buff;

    const width = maxX - minX;
    const height = maxY - minY;
    const perimeter = 2 * (width + height);

    // Each dash covers 1/(2*numDashes) of the perimeter
    const segmentLength = perimeter / this._numDashes;
    const dashLength = segmentLength * 0.6; // 60% dash, 40% gap

    for (let i = 0; i < this._numDashes; i++) {
      const dash = this._dashes[i];

      // Calculate position along perimeter with phase offset
      const startDistance = ((i / this._numDashes) + phase) * perimeter;
      const endDistance = startDistance + dashLength;

      // Convert perimeter distances to actual points
      const startPoint = this._perimeterToPoint(startDistance % perimeter, minX, minY, maxX, maxY, width, height, perimeter);
      const endPoint = this._perimeterToPoint(endDistance % perimeter, minX, minY, maxX, maxY, width, height, perimeter);

      // Handle wrap-around: if the dash crosses a corner, simplify to a straight line segment
      if (Math.abs(endDistance % perimeter - startDistance) > dashLength * 1.5) {
        // Dash wraps around perimeter, just draw to the corner
        const cornerDistance = this._nearestCornerDistance(startDistance % perimeter, width, height, perimeter);
        const cornerPoint = this._perimeterToPoint(cornerDistance, minX, minY, maxX, maxY, width, height, perimeter);
        this._setDashLine(dash, startPoint, cornerPoint);
      } else {
        this._setDashLine(dash, startPoint, endPoint);
      }
    }
  }

  /**
   * Convert a distance along the perimeter to a 3D point
   */
  private _perimeterToPoint(
    distance: number,
    minX: number, minY: number,
    maxX: number, maxY: number,
    width: number, height: number,
    perimeter: number
  ): number[] {
    // Normalize distance
    distance = distance % perimeter;
    if (distance < 0) distance += perimeter;

    // Bottom edge (left to right): 0 to width
    if (distance <= width) {
      return [minX + distance, minY, 0];
    }
    distance -= width;

    // Right edge (bottom to top): 0 to height
    if (distance <= height) {
      return [maxX, minY + distance, 0];
    }
    distance -= height;

    // Top edge (right to left): 0 to width
    if (distance <= width) {
      return [maxX - distance, maxY, 0];
    }
    distance -= width;

    // Left edge (top to bottom): 0 to height
    return [minX, maxY - distance, 0];
  }

  /**
   * Find the nearest corner distance from a given perimeter distance
   */
  private _nearestCornerDistance(
    distance: number,
    width: number, height: number,
    perimeter: number
  ): number {
    const corners = [0, width, width + height, 2 * width + height, perimeter];
    let nearest = corners[0];
    let minDiff = Math.abs(distance - nearest);

    for (const corner of corners) {
      const diff = Math.abs(distance - corner);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = corner;
      }
    }

    return nearest;
  }

  /**
   * Set a VMobject dash as a line between two points
   */
  private _setDashLine(dash: VMobject, start: number[], end: number[]): void {
    // Create a simple line as degenerate cubic Bezier
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    // Control points at 1/3 and 2/3 along the line
    const h1 = [start[0] + dx / 3, start[1] + dy / 3, start[2] + dz / 3];
    const h2 = [start[0] + 2 * dx / 3, start[1] + 2 * dy / 3, start[2] + 2 * dz / 3];

    dash.setPoints3D([
      [...start],
      h1,
      h2,
      [...end]
    ]);
  }

  /**
   * Update the animation
   */
  private _updateAnimation(dt: number): void {
    // Update phase (0 to 1 cycles at cycleRate per second)
    this._phase = (this._phase + dt * this._cycleRate) % 1;

    // Reposition dashes
    this._positionDashes(this._phase);
  }

  /**
   * Set the animation speed
   */
  setCycleRate(rate: number): this {
    this._cycleRate = rate;
    return this;
  }

  /**
   * Set the dash colors
   */
  setColors(colors: string[]): this {
    this._colors = colors;
    // Update existing dash colors
    for (let i = 0; i < this._dashes.length; i++) {
      this._dashes[i].color = colors[i % colors.length];
      this._dashes[i]._markDirty();
    }
    return this;
  }

  /**
   * Pause the animation
   */
  pause(): this {
    this.removeUpdater(this._updater);
    return this;
  }

  /**
   * Resume the animation
   */
  resume(): this {
    if (!this.hasUpdaters()) {
      this.addUpdater(this._updater);
    }
    return this;
  }

  /**
   * Rebuild the boundary (call after bounded mobject changes size)
   */
  rebuild(): this {
    this._createBoundary();
    return this;
  }

  /**
   * Create a copy of this AnimatedBoundary
   */
  protected override _createCopy(): AnimatedBoundary {
    const copy = new AnimatedBoundary(this._boundedMobject, {
      colors: [...this._colors],
      numDashes: this._numDashes,
      dashWidth: this._dashWidth,
      cycleRate: this._cycleRate,
      buff: this._buff
    });
    copy._phase = this._phase;
    return copy;
  }

  /**
   * Clean up resources
   */
  override dispose(): void {
    for (const dash of this._dashes) {
      dash.dispose();
    }
    this._dashes = [];
    super.dispose();
  }
}

/**
 * Factory function to create an AnimatedBoundary
 */
export function animatedBoundary(
  boundedMobject: Mobject,
  options?: AnimatedBoundaryOptions
): AnimatedBoundary {
  return new AnimatedBoundary(boundedMobject, options);
}

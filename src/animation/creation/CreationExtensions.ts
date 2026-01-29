/**
 * Extended creation animations - additional ways to reveal mobjects.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * AddTextWordByWord options
 */
export interface AddTextWordByWordOptions extends AnimationOptions {
  /** Time per word in seconds (default: 0.2) */
  timePerWord?: number;
}

/**
 * AddTextWordByWord - adds text one word at a time.
 * Works with Text or Paragraph mobjects.
 */
export class AddTextWordByWord extends Animation {
  readonly timePerWord: number;
  private _fullText: string = '';
  private _words: string[] = [];

  constructor(mobject: Mobject, options: AddTextWordByWordOptions = {}) {
    super(mobject, options);
    this.timePerWord = options.timePerWord ?? 0.2;
  }

  override begin(): void {
    super.begin();
    if ('getText' in this.mobject && typeof (this.mobject as any).getText === 'function') {
      this._fullText = (this.mobject as any).getText();
      this._words = this._fullText.split(/\s+/).filter(w => w.length > 0);
      if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
        (this.mobject as any).setText('');
      }
    }
  }

  interpolate(alpha: number): void {
    if (
      'setText' in this.mobject &&
      typeof (this.mobject as any).setText === 'function' &&
      this._words.length > 0
    ) {
      const numWords = Math.floor(alpha * this._words.length);
      const text = this._words.slice(0, numWords).join(' ');
      (this.mobject as any).setText(text);
    }
  }

  override finish(): void {
    if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
      (this.mobject as any).setText(this._fullText);
    }
    super.finish();
  }
}

/**
 * Create an AddTextWordByWord animation.
 */
export function addTextWordByWord(
  mobject: Mobject,
  options?: AddTextWordByWordOptions
): AddTextWordByWord {
  return new AddTextWordByWord(mobject, options);
}

/**
 * ShowIncreasingSubsets options
 */
export interface ShowIncreasingSubsetsOptions extends AnimationOptions {
  /** Whether to suspend updating of submobjects (default: true) */
  suspendMobjectUpdating?: boolean;
}

/**
 * ShowIncreasingSubsets - shows submobjects one by one, cumulatively.
 * Each new submobject appears while previous ones remain visible.
 */
export class ShowIncreasingSubsets extends Animation {
  private _submobjects: Mobject[] = [];
  private _originalOpacities: number[] = [];

  constructor(mobject: Mobject, options: ShowIncreasingSubsetsOptions = {}) {
    super(mobject, options);
  }

  override begin(): void {
    super.begin();

    // Get all submobjects
    this._submobjects = [...this.mobject.children];
    this._originalOpacities = this._submobjects.map(m => m.opacity);

    // Hide all submobjects initially
    this._submobjects.forEach(m => m.setOpacity(0));
  }

  interpolate(alpha: number): void {
    const numToShow = Math.floor(alpha * this._submobjects.length);

    for (let i = 0; i < this._submobjects.length; i++) {
      if (i < numToShow) {
        this._submobjects[i].setOpacity(this._originalOpacities[i]);
      } else if (i === numToShow && alpha < 1) {
        // Partially show the current one
        const localAlpha = (alpha * this._submobjects.length) - numToShow;
        this._submobjects[i].setOpacity(this._originalOpacities[i] * localAlpha);
      } else {
        this._submobjects[i].setOpacity(0);
      }
    }
  }

  override finish(): void {
    // Show all submobjects
    this._submobjects.forEach((m, i) => m.setOpacity(this._originalOpacities[i]));
    super.finish();
  }
}

/**
 * Create a ShowIncreasingSubsets animation.
 */
export function showIncreasingSubsets(
  mobject: Mobject,
  options?: ShowIncreasingSubsetsOptions
): ShowIncreasingSubsets {
  return new ShowIncreasingSubsets(mobject, options);
}

/**
 * ShowPartial options
 */
export interface ShowPartialOptions extends AnimationOptions {
  /** Start portion (0-1), default 0 */
  startPortion?: number;
  /** End portion (0-1), default 1 */
  endPortion?: number;
}

/**
 * ShowPartial - shows a portion of a VMobject's path.
 * Reveals from startPortion to endPortion.
 */
export class ShowPartial extends Animation {
  readonly startPortion: number;
  readonly endPortion: number;
  private _totalLength: number = 1;
  private _isVMobject: boolean = false;

  constructor(mobject: Mobject, options: ShowPartialOptions = {}) {
    super(mobject, options);
    this.startPortion = options.startPortion ?? 0;
    this.endPortion = options.endPortion ?? 1;
    this._isVMobject = mobject instanceof VMobject;
  }

  override begin(): void {
    super.begin();

    if (this._isVMobject) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = true;
          material.dashScale = 1;

          child.computeLineDistances();
          const lineDistances = (child.geometry as any).attributes.lineDistance;
          if (lineDistances && lineDistances.count > 0) {
            this._totalLength = lineDistances.array[lineDistances.count - 1] || 1;
          }

          // Start with nothing visible
          material.dashSize = 0;
          material.gapSize = this._totalLength;
          material.needsUpdate = true;
        }
      });
    }
  }

  interpolate(alpha: number): void {
    if (this._isVMobject) {
      // Interpolate from startPortion to endPortion
      const currentPortion = this.startPortion + alpha * (this.endPortion - this.startPortion);

      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          const visibleLength = currentPortion * this._totalLength;
          material.dashSize = visibleLength;
          material.gapSize = this._totalLength - visibleLength + 0.0001;
          material.needsUpdate = true;
        }
      });
    } else {
      // For non-VMobjects, use opacity
      this.mobject.setOpacity(alpha);
    }
  }

  override finish(): void {
    if (this._isVMobject && this.endPortion >= 1) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = false;
          material.needsUpdate = true;
        }
      });
    }
    super.finish();
  }
}

/**
 * Create a ShowPartial animation.
 */
export function showPartial(
  mobject: Mobject,
  options?: ShowPartialOptions
): ShowPartial {
  return new ShowPartial(mobject, options);
}

/**
 * ShowSubmobjectsOneByOne options
 */
export interface ShowSubmobjectsOneByOneOptions extends AnimationOptions {}

/**
 * ShowSubmobjectsOneByOne - shows each submobject one at a time.
 * Unlike ShowIncreasingSubsets, only one is visible at a time.
 */
export class ShowSubmobjectsOneByOne extends Animation {
  private _submobjects: Mobject[] = [];
  private _originalOpacities: number[] = [];
  private _currentIndex: number = -1;

  constructor(mobject: Mobject, options: ShowSubmobjectsOneByOneOptions = {}) {
    super(mobject, options);
  }

  override begin(): void {
    super.begin();

    this._submobjects = [...this.mobject.children];
    this._originalOpacities = this._submobjects.map(m => m.opacity);

    // Hide all submobjects initially
    this._submobjects.forEach(m => m.setOpacity(0));
    this._currentIndex = -1;
  }

  interpolate(alpha: number): void {
    const newIndex = Math.min(
      Math.floor(alpha * this._submobjects.length),
      this._submobjects.length - 1
    );

    if (newIndex !== this._currentIndex) {
      // Hide previous
      if (this._currentIndex >= 0 && this._currentIndex < this._submobjects.length) {
        this._submobjects[this._currentIndex].setOpacity(0);
      }

      // Show current
      this._currentIndex = newIndex;
      if (this._currentIndex >= 0 && this._currentIndex < this._submobjects.length) {
        this._submobjects[this._currentIndex].setOpacity(this._originalOpacities[this._currentIndex]);
      }
    }
  }

  override finish(): void {
    // Show the last one (or restore all if that's the intended behavior)
    this._submobjects.forEach((m, i) => {
      if (i === this._submobjects.length - 1) {
        m.setOpacity(this._originalOpacities[i]);
      } else {
        m.setOpacity(0);
      }
    });
    super.finish();
  }
}

/**
 * Create a ShowSubmobjectsOneByOne animation.
 */
export function showSubmobjectsOneByOne(
  mobject: Mobject,
  options?: ShowSubmobjectsOneByOneOptions
): ShowSubmobjectsOneByOne {
  return new ShowSubmobjectsOneByOne(mobject, options);
}

/**
 * SpiralIn options
 */
export interface SpiralInOptions extends AnimationOptions {
  /** Scale factor at start (default: 3) */
  scaleFactor?: number;
  /** Number of spiral turns (default: 2) */
  numTurns?: number;
}

/**
 * SpiralIn - mobjects spiral inward to their final positions.
 * Combines rotation with scale and position movement.
 */
export class SpiralIn extends Animation {
  readonly scaleFactor: number;
  readonly numTurns: number;

  private _targetPositions: Map<Mobject, THREE.Vector3> = new Map();
  private _targetScales: Map<Mobject, THREE.Vector3> = new Map();
  private _centerPoint: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: SpiralInOptions = {}) {
    super(mobject, options);
    this.scaleFactor = options.scaleFactor ?? 3;
    this.numTurns = options.numTurns ?? 2;
  }

  override begin(): void {
    super.begin();

    // Calculate center of all submobjects (or use mobject center)
    const bounds = this.mobject.getBounds();
    this._centerPoint.set(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2,
      (bounds.min.z + bounds.max.z) / 2
    );

    // Store target positions and scales for all children (or the mobject itself)
    const targets = this.mobject.children.length > 0 ? this.mobject.children : [this.mobject];

    for (const m of targets) {
      this._targetPositions.set(m, m.position.clone());
      this._targetScales.set(m, m.scaleVector.clone());

      // Start scaled up and at center
      m.scaleVector.multiplyScalar(this.scaleFactor);
      m.position.copy(this._centerPoint);
    }
  }

  interpolate(alpha: number): void {
    const targets = this.mobject.children.length > 0 ? this.mobject.children : [this.mobject];
    const angle = (1 - alpha) * this.numTurns * Math.PI * 2;
    const currentScale = 1 + (this.scaleFactor - 1) * (1 - alpha);

    for (const m of targets) {
      const targetPos = this._targetPositions.get(m);
      const targetScale = this._targetScales.get(m);

      if (!targetPos || !targetScale) continue;

      // Scale interpolation
      m.scaleVector.set(
        targetScale.x * currentScale,
        targetScale.y * currentScale,
        targetScale.z * currentScale
      );

      // Position: spiral from center to target
      const offsetX = targetPos.x - this._centerPoint.x;
      const offsetY = targetPos.y - this._centerPoint.y;

      // Rotate the offset by the spiral angle
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = offsetX * cos - offsetY * sin;
      const rotatedY = offsetX * sin + offsetY * cos;

      // Interpolate from center to rotated target position
      m.position.set(
        this._centerPoint.x + rotatedX * alpha,
        this._centerPoint.y + rotatedY * alpha,
        this._centerPoint.z + (targetPos.z - this._centerPoint.z) * alpha
      );

      m._markDirty();
    }
  }

  override finish(): void {
    const targets = this.mobject.children.length > 0 ? this.mobject.children : [this.mobject];

    for (const m of targets) {
      const targetPos = this._targetPositions.get(m);
      const targetScale = this._targetScales.get(m);

      if (targetPos) m.position.copy(targetPos);
      if (targetScale) m.scaleVector.copy(targetScale);
      m._markDirty();
    }

    super.finish();
  }
}

/**
 * Create a SpiralIn animation.
 */
export function spiralIn(mobject: Mobject, options?: SpiralInOptions): SpiralIn {
  return new SpiralIn(mobject, options);
}

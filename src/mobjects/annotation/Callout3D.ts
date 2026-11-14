/**
 * Callout3D: a manim-style label with a thin leader line to a point on a 3D
 * object. The label, line and anchor dot live in the frame (ThreeDScene HUD,
 * constant size); the line end and the dot follow the projected anchor on
 * every rendered frame, so they stay on the object while the camera flies.
 *
 * In a plain 2D Scene the anchor is a 2D point (or mobject) and the parts
 * live in world coordinates; an updater keeps the line on the anchor.
 *
 * @example
 * ```ts
 * const c = new Callout3D({ scene, anchor: torus, label: 'ATP synthase', direction: [1, 1] });
 * await scene.play(c.create());
 * await scene.play(c.uncreate());
 * ```
 */

import * as THREE from 'three';
import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation } from '../../animation/Animation';
import { AnimationGroup } from '../../animation/AnimationGroup';
import { LaggedStart } from '../../animation/LaggedStart';
import { Create, Write } from '../../animation/creation/Create';
import { FadeIn } from '../../animation/fading/FadeIn';
import { FadeOut } from '../../animation/fading/FadeOut';
import { addVec, lengthVec, normalizeVec, scaleVec, subVec } from '../../utils/vectors';
import { Dot } from '../geometry/Dot';
import { Rectangle } from '../geometry/Rectangle';
import { MathTex } from '../text/MathTex';
import { Text } from '../text/Text';
import {
  ANNOTATION_FONT,
  AnnotationScene,
  backgroundOf,
  emOf,
  frameSizeOf,
  pinToFrame,
  projectPoint,
  resolvePalette,
} from './annotationStyle';

/** A 3D point, or a mobject (its centre, or a point in its local frame). */
export type AnchorTarget = Vector3Tuple | Mobject;

export interface Callout3DOptions {
  /** Host scene (ThreeDScene for 3D anchors). */
  scene: AnnotationScene;
  /** What the leader points at. */
  anchor: AnchorTarget;
  /** A point in the anchor mobject's local frame. Default: the mobject's centre */
  anchorLocal?: Vector3Tuple;
  /** Label: a string (Text, or MathTex with `tex: true`) or any mobject. */
  label: string | Mobject;
  /** Render a string label as MathTex. Default: false */
  tex?: boolean;
  /** Label direction from the anchor, in frame units. Default: [1, 0.6] */
  direction?: [number, number];
  /** Label distance from the anchor, in frame units. Default: 16% of the frame height */
  distance?: number;
  /** Fixed label centre in frame units. When set, the label does not follow the anchor. */
  labelPosition?: [number, number];
  /** Leader shape. 'elbow' runs a short horizontal stub out of the label first. Default: 'straight' */
  leader?: 'straight' | 'elbow';
  /** Draw a thin box around the label. Default: false */
  box?: boolean;
  /** Line, dot and label colour. Default: derived from the scene background */
  color?: string;
  /** Label font size (pt). Default: 19 pt at frame height 8 */
  fontSize?: number;
  /** Font family. Default: the Text default (manim style) */
  fontFamily?: string;
  /** Line stroke width. Default: 2 */
  strokeWidth?: number;
  /** Anchor dot radius (frame units). Default: 0.045 at frame height 8 */
  dotRadius?: number;
}

/** World position of an anchor right now. */
export function resolveAnchor(anchor: AnchorTarget, local?: Vector3Tuple): Vector3Tuple {
  if (Array.isArray(anchor)) return [anchor[0], anchor[1], anchor[2] ?? 0];
  const mob = anchor;
  if (!local) return mob.getCenter();
  const obj = mob.getThreeObject();
  obj.updateWorldMatrix(true, false);
  const v = new THREE.Vector3(local[0], local[1], local[2]).applyMatrix4(obj.matrixWorld);
  return [v.x, v.y, v.z];
}

/**
 * The point where a leader leaves a box of half-size (hw, hh) centred at
 * `c`, aiming at `p`: the box edge crossed by the segment c -> p, plus a gap.
 */
function boxExit(
  c: Vector3Tuple,
  hw: number,
  hh: number,
  p: Vector3Tuple,
  gap: number,
): Vector3Tuple {
  const d = subVec(p, c);
  const tx = Math.abs(d[0]) > 1e-9 ? (hw + gap) / Math.abs(d[0]) : Infinity;
  const ty = Math.abs(d[1]) > 1e-9 ? (hh + gap) / Math.abs(d[1]) : Infinity;
  const t = Math.min(tx, ty, 1);
  return addVec(c, scaleVec(t, d));
}

export class Callout3D {
  readonly scene: AnnotationScene;
  readonly line: VMobject;
  readonly dot: Dot;
  readonly label: Mobject;
  readonly box: Rectangle | null;
  private readonly _o: Callout3DOptions;
  private readonly _distance: number;
  private readonly _gap: number;
  private _unhook: (() => void) | null = null;

  constructor(options: Callout3DOptions) {
    this._o = options;
    this.scene = options.scene;
    const frame = frameSizeOf(options.scene);
    const k = frame.height / 8;
    const pal = resolvePalette(backgroundOf(options.scene), options.color);
    const color = options.color ?? pal.text;
    const fontSize = options.fontSize ?? 19 * k;
    this._distance = options.distance ?? 0.16 * frame.height;
    this._gap = 0.25 * emOf(fontSize);

    if (typeof options.label === 'string') {
      this.label = options.tex
        ? // MathTex glyphs come out ~0.7x the size of Text at the same pt.
          new MathTex({ latex: options.label, color, fontSize: fontSize * 1.4 })
        : new Text({
            text: options.label,
            color,
            fontSize,
            fontFamily: options.fontFamily ?? ANNOTATION_FONT,
          });
    } else {
      this.label = options.label;
    }
    this.line = new VMobject();
    this.line.setColor(color);
    this.line.setStrokeWidth(options.strokeWidth ?? 2);
    this.dot = new Dot({ radius: options.dotRadius ?? 0.045 * k, color, fillOpacity: 1 });
    this.box = options.box
      ? new Rectangle({ width: 1, height: 1, color, strokeWidth: 1.5, fillOpacity: 0 })
      : null;
    if (this.box) this.box.setFill(pal.background, 0.75);

    const parts = this.getMobjects();
    pinToFrame(options.scene, ...parts);
    this.layout();

    if (options.scene.addBeforeRenderHook) {
      this._unhook = options.scene.addBeforeRenderHook(() => this.layout());
    } else {
      // Plain Scene: follow a moving 2D anchor through an updater.
      const updater = () => this.layout();
      this.dot.addUpdater(updater);
      this._unhook = () => this.dot.removeUpdater(updater);
    }
  }

  /** Every mobject of the callout. */
  getMobjects(): Mobject[] {
    return [this.line, this.dot, this.label, ...(this.box ? [this.box] : [])];
  }

  /** Re-project the anchor and place the label, leader and dot. */
  layout(): void {
    const o = this._o;
    const p = projectPoint(this.scene, resolveAnchor(o.anchor, o.anchorLocal));
    const z = 0.03;
    const anchor: Vector3Tuple = [p[0], p[1], z];
    let center: Vector3Tuple;
    if (o.labelPosition) {
      center = [o.labelPosition[0], o.labelPosition[1], z];
    } else {
      const dir = normalizeVec([...(o.direction ?? [1, 0.6]), 0] as Vector3Tuple);
      center = addVec(anchor, scaleVec(this._distance, dir));
    }
    this.label.moveTo(center);
    const hw = this.label.getWidth() / 2;
    const hh = this.label.getHeight() / 2;
    if (this.box) {
      const bw = 2 * hw + 2 * this._gap;
      const bh = 2 * hh + 1.2 * this._gap;
      if (Math.abs(this.box.getWidth() - bw) > 1e-6) this.box.setWidth(bw);
      if (Math.abs(this.box.getHeight() - bh) > 1e-6) this.box.setHeight(bh);
      this.box.moveTo([center[0], center[1], z - 0.005]);
    }
    const gap = this.box ? this._gap * 1.2 : this._gap;
    const exit = boxExit(center, hw, hh, anchor, gap);
    const corners: Vector3Tuple[] = [exit];
    if (o.leader === 'elbow') {
      const side = Math.sign(anchor[0] - center[0]) || 1;
      const stub: Vector3Tuple = [center[0] + side * (hw + gap + 2 * this._gap), exit[1], z];
      // The stub must leave from the label's side, at the label's height.
      corners[0] = [center[0] + side * (hw + gap), center[1], z];
      corners.push(stub);
    }
    corners.push(anchor);
    // No change cache: a seek resets these mobjects to an animation's
    // snapshot, so the layout must be rewritten on every frame.
    const degenerate = lengthVec(subVec(anchor, corners[0])) < 1e-6;
    this.line.setPointsAsCorners(degenerate ? [anchor, addVec(anchor, [1e-4, 0, 0])] : corners);
    this.dot.moveTo(anchor);
  }

  /** Line draws in (Create), dot fades in, label writes. */
  create(options: { duration?: number } = {}): Animation {
    const d = options.duration ?? 1.4;
    const anims: Animation[] = [
      new Create(this.line, { duration: d * 0.45 }),
      new FadeIn(this.dot, { duration: d * 0.25 }),
    ];
    if (this.box) anims.push(new Create(this.box, { duration: d * 0.35 }));
    anims.push(new Write(this.label, { duration: d * 0.5 }));
    return new LaggedStart(anims, { lagRatio: 0.55 });
  }

  /** Fade every part out. */
  uncreate(options: { duration?: number } = {}): Animation {
    const d = options.duration ?? 0.5;
    return new AnimationGroup(this.getMobjects().map((m) => new FadeOut(m, { duration: d })));
  }

  /** Stop following the anchor (call when the callout is gone for good). */
  dispose(): void {
    this._unhook?.();
    this._unhook = null;
  }
}

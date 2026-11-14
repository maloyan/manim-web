/**
 * InsetPanel: a manim-style close-up box fixed in the frame. A thin bright
 * frame with a background-colour fill, a title above its top-left corner,
 * 2D content fitted (and clipped) inside, and two connector lines from the
 * box corners to a 3D anchor. The connectors follow the projected anchor on
 * every rendered frame.
 *
 * @example
 * ```ts
 * const inset = new InsetPanel({
 *   scene, anchor: membraneSphere, title: 'Close-up',
 *   content: [new Membrane({ length: 6 })], position: [2.2, 1.6],
 * });
 * await scene.play(inset.create());
 * ```
 */

import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Group } from '../../core/Group';
import { Animation } from '../../animation/Animation';
import { AnimationGroup } from '../../animation/AnimationGroup';
import { LaggedStart } from '../../animation/LaggedStart';
import { Create, Write } from '../../animation/creation/Create';
import { FadeIn } from '../../animation/fading/FadeIn';
import { FadeOut } from '../../animation/fading/FadeOut';
import { Dot } from '../geometry/Dot';
import { Line } from '../geometry/Line';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import {
  ANNOTATION_FONT,
  AnnotationScene,
  backgroundOf,
  emOf,
  frameSizeOf,
  pinToFrame,
  placeTextTopLeft,
  projectPoint,
  resolvePalette,
  textBoxHeight,
} from './annotationStyle';
import { resolveAnchor, type AnchorTarget } from './Callout3D';

export interface InsetPanelOptions {
  /** Host scene (ThreeDScene for a 3D anchor). */
  scene: AnnotationScene;
  /** Where the connectors point. No connectors when omitted. */
  anchor?: AnchorTarget;
  /** A point in the anchor mobject's local frame. Default: its centre */
  anchorLocal?: Vector3Tuple;
  /** Title above the box. Default: 'Close-up'; '' for none */
  title?: string;
  /** 2D mobjects shown in the box, scaled to fit and centred. */
  content?: Mobject[];
  /** Box centre in frame units. Default: upper right of the frame */
  position?: [number, number];
  /** Box width (frame units). Default: 38% of the frame width */
  width?: number;
  /** Box height (frame units). Default: 30% of the frame height */
  height?: number;
  /** Inner padding around the content (frame units). Default: 6% of the box height */
  padding?: number;
  /**
   * Clip the content to the box with a stencil mask. Default: false, because
   * the content is already scaled to fit, and a mask currently hides the
   * Line2 strokes of masked VMobjects (lipid tails of a Membrane vanish).
   */
  clip?: boolean;
  /** Frame, connector and title colour. Default: derived from the background */
  color?: string;
  /** Box fill. Default: the scene background */
  fillColor?: string;
  /** Title font size (pt). Default: 15 pt at frame height 8 */
  fontSize?: number;
  /** Font family. Default: the Text default (manim style) */
  fontFamily?: string;
}

export class InsetPanel {
  readonly scene: AnnotationScene;
  readonly frame: Rectangle;
  readonly title: Text | null;
  readonly content: Group | null;
  readonly connectors: [Line, Line] | null;
  readonly anchorDot: Dot | null;
  private readonly _o: InsetPanelOptions;
  private readonly _center: [number, number];
  private readonly _size: [number, number];
  private _unhook: (() => void) | null = null;

  constructor(options: InsetPanelOptions) {
    this._o = options;
    this.scene = options.scene;
    const fr = frameSizeOf(options.scene);
    const k = fr.height / 8;
    const pal = resolvePalette(backgroundOf(options.scene), options.color);
    const color = options.color ?? pal.text;
    const w = options.width ?? 0.38 * fr.width;
    const h = options.height ?? 0.3 * fr.height;
    const c = options.position ?? [
      fr.width / 2 - 0.05 * fr.width - w / 2,
      fr.height / 2 - 0.1 * fr.height - h / 2,
    ];
    this._center = c;
    this._size = [w, h];

    this.frame = new Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 2.5,
      center: [c[0], c[1], 0],
    });
    this.frame.setFill(options.fillColor ?? pal.background, 1);

    this.title = this._buildTitle(color, k);
    this.content = this._buildContent();

    if (options.anchor !== undefined) {
      this.connectors = [
        new Line({ start: [0, 0, 0], end: [1, 0, 0], color, strokeWidth: 1.5 }),
        new Line({ start: [0, 0, 0], end: [1, 0, 0], color, strokeWidth: 1.5 }),
      ];
      this.anchorDot = new Dot({ radius: 0.04 * k, color, fillOpacity: 1 });
    } else {
      this.connectors = null;
      this.anchorDot = null;
    }

    pinToFrame(options.scene, ...this.getMobjects());
    this.layout();
    if (this.connectors) {
      if (options.scene.addBeforeRenderHook) {
        this._unhook = options.scene.addBeforeRenderHook(() => this.layout());
      } else if (this.anchorDot) {
        const updater = () => this.layout();
        const dot = this.anchorDot;
        dot.addUpdater(updater);
        this._unhook = () => dot.removeUpdater(updater);
      }
    }
  }

  /** The title above the box's top-left corner, or null. */
  private _buildTitle(color: string, k: number): Text | null {
    const o = this._o;
    const titleText = o.title ?? 'Close-up';
    if (!titleText) return null;
    const [cx, cy] = this._center;
    const [w, h] = this._size;
    const title = new Text({
      text: titleText,
      color,
      fontSize: o.fontSize ?? 15 * k,
      fontFamily: o.fontFamily ?? ANNOTATION_FONT,
      textAlign: 'left',
    });
    const gap = 0.3 * emOf(title.getFontSize());
    placeTextTopLeft(title, cx - w / 2, cy + h / 2 + gap + textBoxHeight(title), 0.03);
    return title;
  }

  /** The content group, scaled to fit the box and centred, or null. */
  private _buildContent(): Group | null {
    const o = this._o;
    if (!o.content || o.content.length === 0) return null;
    const [cx, cy] = this._center;
    const [w, h] = this._size;
    const group = new Group(...o.content);
    const pad = o.padding ?? 0.06 * h;
    const s = Math.min(
      (w - 2 * pad) / Math.max(group.getWidth(), 1e-6),
      (h - 2 * pad) / Math.max(group.getHeight(), 1e-6),
    );
    if (Number.isFinite(s) && s > 0) group.scale(s);
    group.moveTo([cx, cy, 0.01]);
    // Keep every member in front of the opaque frame fill: centring puts the
    // group's middle at z = 0.01, and a member lower than that fails the depth
    // test against the fill and vanishes.
    const minZ = group.getBounds().min.z;
    if (minZ < 0.01) group.shift([0, 0, 0.01 - minZ]);
    if (o.clip ?? false) {
      group.setMask(new Rectangle({ width: w, height: h, center: [cx, cy, 0.01] }));
    }
    return group;
  }

  /** Every mobject of the panel. */
  getMobjects(): Mobject[] {
    const out: Mobject[] = [];
    if (this.connectors) out.push(...this.connectors);
    if (this.anchorDot) out.push(this.anchorDot);
    out.push(this.frame);
    if (this.title) out.push(this.title);
    if (this.content) out.push(this.content);
    return out;
  }

  /**
   * Re-project the anchor and run the connectors from the two box corners
   * that bound the box as seen from the anchor (its silhouette corners).
   */
  layout(): void {
    if (!this.connectors || this._o.anchor === undefined || !this.anchorDot) return;
    const p = projectPoint(this.scene, resolveAnchor(this._o.anchor, this._o.anchorLocal));
    // No change cache: a seek resets these mobjects to an animation's
    // snapshot, so the layout must be rewritten on every frame.
    const [cx, cy] = this._center;
    const [w, h] = this._size;
    const corners: Vector3Tuple[] = [
      [cx - w / 2, cy - h / 2, 0],
      [cx + w / 2, cy - h / 2, 0],
      [cx + w / 2, cy + h / 2, 0],
      [cx - w / 2, cy + h / 2, 0],
    ];
    // Silhouette corners: extreme angles of the corners seen from p.
    const angle = (q: Vector3Tuple) => Math.atan2(q[1] - p[1], q[0] - p[0]);
    const ref = Math.atan2(cy - p[1], cx - p[0]);
    const rel = (q: Vector3Tuple) => {
      let d = angle(q) - ref;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      return d;
    };
    const sorted = [...corners].sort((a, b) => rel(a) - rel(b));
    const anchor: Vector3Tuple = [p[0], p[1], 0];
    this.connectors[0].setStart(sorted[0]);
    this.connectors[0].setEnd(anchor);
    this.connectors[1].setStart(sorted[3]);
    this.connectors[1].setEnd(anchor);
    this.anchorDot.moveTo([p[0], p[1], 0.02]);
  }

  /** Frame draws, title writes, connectors draw toward the anchor, content fades in. */
  create(options: { duration?: number } = {}): Animation {
    const d = options.duration ?? 1.8;
    const anims: Animation[] = [new Create(this.frame, { duration: d * 0.4 })];
    if (this.title) anims.push(new Write(this.title, { duration: d * 0.35 }));
    if (this.connectors && this.anchorDot) {
      anims.push(
        new AnimationGroup([
          new Create(this.connectors[0], { duration: d * 0.35 }),
          new Create(this.connectors[1], { duration: d * 0.35 }),
          new FadeIn(this.anchorDot, { duration: d * 0.2 }),
        ]),
      );
    }
    if (this.content) anims.push(new FadeIn(this.content, { duration: d * 0.4 }));
    return new LaggedStart(anims, { lagRatio: 0.45 });
  }

  /** Fade every part out. */
  uncreate(options: { duration?: number } = {}): Animation {
    const d = options.duration ?? 0.6;
    return new AnimationGroup(this.getMobjects().map((m) => new FadeOut(m, { duration: d })));
  }

  /** Stop following the anchor. */
  dispose(): void {
    this._unhook?.();
    this._unhook = null;
  }
}

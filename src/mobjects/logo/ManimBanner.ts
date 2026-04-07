import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Text } from '../text/Text';
import { Circle } from '../geometry/Circle';
import { Square } from '../geometry/Rectangle';
import { BLUE, GREEN, YELLOW, WHITE, BLACK } from '../../constants/colors';
import { Create } from '../../animation/creation';
import { Animation, AnimationOptions } from '../../animation/Animation';
import { lerp } from '../../utils/math';

export interface ManimBannerOptions {
  /** Use dark theme colors. Default: true */
  darkTheme?: boolean;
}

export class ManimBanner extends VGroup {
  private _darkTheme: boolean;
  private _shapes: VGroup;
  private _text: Text;

  constructor(options: ManimBannerOptions = {}) {
    super();
    this._darkTheme = options.darkTheme ?? true;

    // Create logo shapes - a triangle, circle, and square arranged nicely
    this._shapes = new VGroup();

    const triangle = new VMobject();
    triangle.color = BLUE;
    triangle.fillOpacity = 1;
    triangle.strokeWidth = 0;
    // Create triangle points
    const triPoints: number[][] = [];
    const addSeg = (p0: number[], p1: number[], first: boolean) => {
      const dx = p1[0] - p0[0],
        dy = p1[1] - p0[1],
        dz = p1[2] - p0[2];
      if (first) triPoints.push([...p0]);
      triPoints.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      triPoints.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, p0[2] + (2 * dz) / 3]);
      triPoints.push([...p1]);
    };
    addSeg([-0.5, -0.3, 0], [0, 0.5, 0], true);
    addSeg([0, 0.5, 0], [0.5, -0.3, 0], false);
    addSeg([0.5, -0.3, 0], [-0.5, -0.3, 0], false);
    triangle.setPoints3D(triPoints);
    triangle.moveTo([-1.2, 0, 0]);

    const circle = new Circle({ radius: 0.35, color: GREEN, fillOpacity: 1 });
    circle.strokeWidth = 0;
    circle.moveTo([0, 0, 0]);

    const square = new Square({ sideLength: 0.6, color: YELLOW, fillOpacity: 1 });
    square.strokeWidth = 0;
    square.moveTo([1.2, 0, 0]);

    this._shapes.add(triangle);
    this._shapes.add(circle);
    this._shapes.add(square);

    // Create text
    const textColor = this._darkTheme ? WHITE : BLACK;
    this._text = new Text({
      text: 'manim-web',
      fontSize: 36,
      color: textColor,
    });
    this._text.moveTo([0, -1.2, 0]);
    this._text.opacity = 0;

    this.add(this._shapes);
    this.add(this._text);
  }

  /**
   * Create animation - draws the logo shapes
   */
  createAnimation(options: AnimationOptions = {}): Create {
    return new Create(this._shapes, { duration: options.duration ?? 2, ...options });
  }

  /**
   * Expand animation - reveals the text below
   */
  expandAnimation(options: AnimationOptions = {}): Animation {
    return new BannerExpand(this._text, { duration: options.duration ?? 1.5, ...options });
  }

  getShapes(): VGroup {
    return this._shapes;
  }

  getText(): Text {
    return this._text;
  }

  isDarkTheme(): boolean {
    return this._darkTheme;
  }
}

class BannerExpand extends Animation {
  override begin(): void {
    super.begin();
  }

  interpolate(alpha: number): void {
    this.mobject.opacity = lerp(0, 1, alpha);
    const scale = lerp(0.5, 1, alpha);
    this.mobject.scaleVector.set(scale, scale, scale);
  }

  override finish(): void {
    this.mobject.opacity = 1;
    this.mobject.scaleVector.set(1, 1, 1);
    super.finish();
  }
}

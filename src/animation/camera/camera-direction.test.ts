// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { ThreeDScene } from '../../core/ThreeDScene';
import { Sphere } from '../../mobjects/three-d/Sphere';
import { Cube } from '../../mobjects/three-d/Cube';
import { colorToRgb } from '../../utils/color';
import { Timeline } from '../Timeline';
import { CameraFocus, focusCamera } from './CameraFocus';
import { FocusDim, restoreFocus } from './FocusDim';

function scene3D(): ThreeDScene {
  return ThreeDScene.createHeadless({ width: 400, height: 400, frameWidth: 8, frameHeight: 8 });
}

function run(anim: { begin(): void; update(dt: number, t: number): void; duration: number }) {
  anim.begin();
  anim.update(0, 0);
  anim.update(0, anim.duration);
}

describe('CameraFocus', () => {
  // MIGRATION: example for the property
  //   ∀ target mobject m, ∀ fill f in (0, 1]: after CameraFocus(m, {fill: f}) ends,
  //   lookAt === center(m) and the projected radius / frame half-extent ≈ f;
  //   and ∀ chain of focus moves on a Timeline, seek(0) restores the initial pose.
  // Replace with a property test once the suite lands.
  it('frames the target, and a timeline seek back restores the start pose', () => {
    const scene = scene3D();
    const a = new Sphere({ radius: 1, center: [3, 1, 0] });
    const b = new Cube({ sideLength: 1, center: [-2, 0, 1] });
    scene.add(a, b);
    const start = scene.getCameraState();

    const tl = new Timeline();
    const f1 = new CameraFocus(scene, a, { fill: 0.5, duration: 1 });
    const f2 = new CameraFocus(scene, b, { distance: 6, phi: 1, duration: 1 });
    tl.add(f1, 0);
    tl.add(f2, 1);

    tl.seek(1);
    const s1 = scene.getCameraState();
    expect(s1.lookAt[0]).toBeCloseTo(3, 5);
    expect(s1.lookAt[1]).toBeCloseTo(1, 5);
    // The sphere edge projects at half the shorter frame half-extent.
    const edge = scene.projectToFrame(
      [3, 1, 0].map((v, i) => v + 1 * scene.camera3D.getCamera().up.toArray()[i]) as [
        number,
        number,
        number,
      ],
    );
    const centre = scene.projectToFrame([3, 1, 0]);
    expect(Math.hypot(edge[0] - centre[0], edge[1] - centre[1])).toBeGreaterThan(1.5);

    tl.seek(2);
    const s2 = scene.getCameraState();
    expect(s2.distance).toBeCloseTo(6, 5);
    expect(s2.phi).toBeCloseTo(1, 5);
    expect(s2.lookAt[2]).toBeCloseTo(1, 5);

    // Reset last to first (as MasterTimeline.seek does): the start pose returns.
    f2.reset();
    f1.reset();
    const back = scene.getCameraState();
    expect(back.distance).toBeCloseTo(start.distance, 6);
    expect(back.lookAt).toEqual(start.lookAt);
  });
});

describe('FocusDim', () => {
  // MIGRATION: example for the property
  //   ∀ scene, ∀ keep set K: after FocusDim(K), leaves under K keep their colour,
  //   other leaves move toward the background; restoreFocus() and reset() both
  //   return every leaf to its original colour and opacity.
  // Replace with a property test once the suite lands.
  it('washes all but the focus set, and restores it', () => {
    const scene = scene3D();
    scene.backgroundColor = '#000000';
    const keep = new Sphere({ radius: 1, color: '#ff0000' });
    const other = new Cube({ sideLength: 1, color: '#ffffff' });
    scene.add(keep, other);

    const dim = new FocusDim(scene, keep, { strength: 0.5, opacity: 0.8, duration: 0.5 });
    run(dim);
    expect(keep.color.toLowerCase()).toBe('#ff0000');
    expect(colorToRgb(other.color)[0]).toBeCloseTo(0.5, 1);
    expect(other.opacity).toBeCloseTo(0.8, 6);

    const back = restoreFocus(scene, { duration: 0.5 });
    run(back);
    expect(other.color.toLowerCase()).toBe('#ffffff');
    expect(other.opacity).toBeCloseTo(1, 6);

    back.reset();
    expect(colorToRgb(other.color)[0]).toBeCloseTo(0.5, 1);
  });

  // MIGRATION: example for the property
  //   ∀ leaf m with appearance A (colour, opacity, toon mute) before a dim session:
  //   dim then restore (or reset) gives back exactly A, even when A was set by an
  //   independent change after an earlier session; the mute during a dim is
  //   A.mute + (1 - A.mute) * mute.
  // Replace with a property test once the suite lands.
  it('restores the appearance of each session, including a pre-set toon mute', () => {
    const scene = scene3D();
    scene.backgroundColor = '#000000';
    const keep = new Sphere({ radius: 1 });
    const other = new Cube({ sideLength: 1, color: '#ff0000' });
    other.setToonMute(0.3);
    scene.add(keep, other);

    const dim = new FocusDim(scene, keep, { mute: 0.5, duration: 0.5 });
    run(dim);
    expect(other.getToonMute()).toBeCloseTo(0.65, 6);
    // A seek back resets the dim itself: the preset mute and colour return exactly.
    dim.reset();
    expect(other.getToonMute()).toBe(0.3);
    expect(other.color.toLowerCase()).toBe('#ff0000');
    expect(other.opacity).toBe(1);
    run(dim);
    expect(other.getToonMute()).toBeCloseTo(0.65, 6);
    run(restoreFocus(scene, { duration: 0.5 }));
    expect(other.color.toLowerCase()).toBe('#ff0000');
    expect(other.getToonMute()).toBeCloseTo(0.3, 6);

    other.setColor('#00ff00');
    other.opacity = 0.6;
    run(new FocusDim(scene, keep, { duration: 0.5 }));
    const back = restoreFocus(scene, { duration: 0.5 });
    run(back);
    expect(other.color.toLowerCase()).toBe('#00ff00');
    expect(other.opacity).toBeCloseTo(0.6, 6);
    // A seek back replays the restore from the dimmed look to the same end.
    back.reset();
    expect(other.color.toLowerCase()).not.toBe('#00ff00');
    run(back);
    expect(other.color.toLowerCase()).toBe('#00ff00');
  });

  // MIGRATION: example for the property
  //   ∀ focus target t, ∀ washed leaf m: with `occlusion`, m.opacity === 0 iff m
  //   overlaps t on screen and is nearer to the camera than t; every other
  //   washed leaf keeps the dim opacity and gets toon mute === options.mute.
  // Replace with a property test once the suite lands.
  it('mutes the rims of neighbours and hides the ones in front of the target', () => {
    const scene = scene3D();
    const target = new Sphere({ radius: 0.5, center: [0, 0, 0] });
    const front = new Sphere({ radius: 0.3, center: [0, 0, 3] });
    const side = new Cube({ sideLength: 0.5, center: [3, 0, 0] });
    scene.add(target, front, side);
    scene.setCameraOrientation(0.01, -Math.PI / 2, 10);
    const dim = new FocusDim(scene, target, {
      opacity: 0.7,
      mute: 0.9,
      occlusion: { target, camera: () => focusCamera(scene, target, { distance: 10 }) },
    });
    run(dim);
    expect(front.opacity).toBe(0);
    expect(side.opacity).toBeCloseTo(0.7, 6);
    expect(side.getToonMute()).toBeCloseTo(0.9, 6);
    expect(target.getToonMute()).toBe(0);
  });
});

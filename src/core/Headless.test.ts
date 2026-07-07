import { describe, expect, it } from "vitest";
import { NullRenderer } from "./NullRenderer";
import { Scene } from "./Scene";
import { ThreeDScene } from "./ThreeDScene";
import { ZoomedScene } from "./ZoomedScene";
import { VGroup } from "./VGroup";
import { Circle } from "../mobjects/geometry/Circle";
import { FadeIn } from "../animation/fading/FadeIn";
import { FadeOut } from "../animation/fading/FadeOut";
import { ReplacementTransform } from "../animation/transform/Transform";
import { Text } from "../mobjects/text/Text";
import { Code } from "../mobjects/text/Code";
import { DecimalNumber } from "../mobjects/text/DecimalNumber";

describe("NullRenderer", () => {
  it("creates with default dimensions", () => {
    const renderer = new NullRenderer();
    expect(renderer.width).toBe(800);
    expect(renderer.height).toBe(450);
  });

  it("creates with custom dimensions", () => {
    const renderer = new NullRenderer({ width: 1920, height: 1080 });
    expect(renderer.width).toBe(1920);
    expect(renderer.height).toBe(1080);
  });

  it("resize updates dimensions", () => {
    const renderer = new NullRenderer();
    renderer.resize(640, 480);
    expect(renderer.width).toBe(640);
    expect(renderer.height).toBe(480);
  });

  it("render is a no-op", () => {
    const renderer = new NullRenderer();
    // Should not throw
    expect(() => renderer.render(null as never, null as never)).not.toThrow();
  });

  it("dispose is a no-op", () => {
    const renderer = new NullRenderer();
    expect(() => renderer.dispose()).not.toThrow();
  });

  it("getCanvas throws in headless mode", () => {
    const renderer = new NullRenderer();
    expect(() => renderer.getCanvas()).toThrow(
      "not available in headless mode",
    );
  });

  it("getThreeRenderer throws in headless mode", () => {
    const renderer = new NullRenderer();
    expect(() => renderer.getThreeRenderer()).toThrow(
      "not available in headless mode",
    );
  });

  it("isContextLost is always false", () => {
    const renderer = new NullRenderer();
    expect(renderer.isContextLost).toBe(false);
  });

  it("backgroundColor can be get/set", () => {
    const renderer = new NullRenderer({ backgroundColor: "#ff0000" });
    expect(renderer.backgroundColor.getHexString()).toBe("ff0000");
    renderer.backgroundColor = "#00ff00";
    expect(renderer.backgroundColor.getHexString()).toBe("00ff00");
  });

  it("backgroundOpacity clamps to [0, 1]", () => {
    const renderer = new NullRenderer();
    renderer.backgroundOpacity = 2;
    expect(renderer.backgroundOpacity).toBe(1);
    renderer.backgroundOpacity = -1;
    expect(renderer.backgroundOpacity).toBe(0);
  });
});

describe("Scene headless mode", () => {
  it("creates via createHeadless()", () => {
    const scene = Scene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it("creates via constructor with headless option", () => {
    const scene = new Scene(null, { headless: true });
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it("throws when container is null without headless flag", () => {
    expect(() => new Scene(null)).toThrow("container is required");
  });

  it("can add and remove mobjects", () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.remove(circle);
    expect(scene.mobjects).not.toContain(circle);
    scene.dispose();
  });

  it("getCanvas throws in headless mode", () => {
    const scene = Scene.createHeadless();
    expect(() => scene.getCanvas()).toThrow("not available in headless mode");
    scene.dispose();
  });

  it("getWidth and getHeight work", () => {
    const scene = Scene.createHeadless({ width: 1920, height: 1080 });
    expect(scene.getWidth()).toBe(1920);
    expect(scene.getHeight()).toBe(1080);
    scene.dispose();
  });

  it("resize works", () => {
    const scene = Scene.createHeadless();
    scene.resize(640, 480);
    expect(scene.getWidth()).toBe(640);
    expect(scene.getHeight()).toBe(480);
    scene.dispose();
  });

  it("clear does not throw", () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(() => scene.clear()).not.toThrow();
    scene.dispose();
  });

  it("dispose does not throw", () => {
    const scene = Scene.createHeadless();
    expect(() => scene.dispose()).not.toThrow();
  });

  it("play() resolves in headless mode", async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    await scene.play(new FadeIn(circle, { duration: 0.1 }));
    scene.dispose();
  });

  it("FadeOut still removes mobject after play (remover regression)", async () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects.has(circle)).toBe(true);
    await scene.play(new FadeOut(circle, { duration: 0.1 }));
    expect(scene.mobjects.has(circle)).toBe(false);
    scene.dispose();
  });

  it("ReplacementTransform swaps source for target in scene (issue #308)", async () => {
    const scene = Scene.createHeadless();
    const src = new Circle({ radius: 1 });
    const dst = new Circle({ radius: 2 });
    scene.add(src);
    expect(scene.mobjects.has(src)).toBe(true);
    expect(scene.mobjects.has(dst)).toBe(false);
    await scene.play(new ReplacementTransform(src, dst, { duration: 0.1 }));
    expect(scene.mobjects.has(src)).toBe(false);
    expect(scene.mobjects.has(dst)).toBe(true);
    scene.dispose();
  });

  it("wait() resolves in headless mode", async () => {
    const scene = Scene.createHeadless();
    await scene.wait(0.1);
    scene.dispose();
  });

  it("getContainer throws in headless mode", () => {
    const scene = Scene.createHeadless();
    expect(() => scene.getContainer()).toThrow(
      "getContainer() is not available in headless mode",
    );
    scene.dispose();
  });

  it("export throws in headless mode", async () => {
    const scene = Scene.createHeadless();
    await expect(scene.export("test.gif")).rejects.toThrow(
      "not available in headless mode",
    );
    scene.dispose();
  });
});

describe("Text mobjects in headless scene", () => {
  it("Text can be added to headless scene", () => {
    const scene = Scene.createHeadless();
    const text = new Text({ text: "hello" });
    expect(() => scene.add(text)).not.toThrow();
    scene.dispose();
  });

  it("Code can be added to headless scene", () => {
    const scene = Scene.createHeadless();
    const code = new Code({ code: "print(1)" });
    expect(() => scene.add(code)).not.toThrow();
    scene.dispose();
  });

  it("DecimalNumber can be added to headless scene", () => {
    const scene = Scene.createHeadless();
    const num = new DecimalNumber(3.14);
    expect(() => scene.add(num)).not.toThrow();
    scene.dispose();
  });
});

describe("ThreeDScene headless mode", () => {
  it("creates via createHeadless()", () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it("does not create orbit controls in headless mode", () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.orbitControls).toBeNull();
    scene.dispose();
  });

  it("does not create orbit controls even when explicitly enabled", () => {
    const scene = ThreeDScene.createHeadless({ enableOrbitControls: true });
    expect(scene.orbitControls).toBeNull();
    scene.dispose();
  });

  it("camera3D is accessible", () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.camera3D).toBeDefined();
    scene.dispose();
  });

  it("setCameraOrientation works", () => {
    const scene = ThreeDScene.createHeadless();
    expect(() => scene.setCameraOrientation(Math.PI / 3, Math.PI / 6)).not
      .toThrow();
    scene.dispose();
  });

  it("can add mobjects", () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });
});

describe("Child z-layering in 3D (issue #465)", () => {
  it("2D Scene bumps grouped children by idx * 0.01 (draw-order hack)", () => {
    const scene = Scene.createHeadless();
    const group = new VGroup(new Circle(), new Circle(), new Circle());
    scene.add(group);
    group.getThreeObject(); // force sync
    const z = group.children.map((c) => c._threeObject!.position.z);
    expect(z[0]).toBeCloseTo(0, 6);
    expect(z[1]).toBeCloseTo(0.01, 6);
    expect(z[2]).toBeCloseTo(0.02, 6);
    scene.dispose();
  });

  it("ThreeDScene opts grouped children out of the z bump", () => {
    const scene = ThreeDScene.createHeadless();
    const group = new VGroup(new Circle(), new Circle(), new Circle());
    scene.add(group);
    group.getThreeObject();
    for (const c of group.children) {
      expect(c._threeObject!.position.z).toBeCloseTo(0, 6);
    }
    scene.dispose();
  });

  it("also covers children added to the group after it joins the 3D scene", () => {
    const scene = ThreeDScene.createHeadless();
    const group = new VGroup(new Circle());
    scene.add(group);
    const late = new Circle();
    group.add(late);
    group.getThreeObject();
    expect(late._threeObject!.position.z).toBeCloseTo(0, 6);
    scene.dispose();
  });
});

describe("ZoomedScene headless mode", () => {
  it("creates via createHeadless()", () => {
    const scene = ZoomedScene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it("activateZooming does not throw", () => {
    const scene = ZoomedScene.createHeadless();
    expect(() => scene.activateZooming()).not.toThrow();
    scene.dispose();
  });

  it("can add mobjects", () => {
    const scene = ZoomedScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });
});

# Changelog

All notable changes to this project will be documented in this file. This file
is **auto-generated** by [`standard-version`](https://github.com/conventional-changelog/standard-version)
from the Conventional Commits history; do not hand-edit the generated release
sections below. For commit conventions, breaking-change markers, and the
release process see [`AGENTS.md`](./AGENTS.md#commits-changelog--releases).

### [0.3.22](https://github.com/maloyan/manim-js/compare/v0.3.21...v0.3.22) (2026-05-24)


### Features

* **#342:** customizable PolarPlane angle/radius labels ([#377](https://github.com/maloyan/manim-js/issues/377)) ([a5d9c5a](https://github.com/maloyan/manim-js/commit/a5d9c5a253b144d098c0df7e74ed9440e1bdda87)), closes [#342](https://github.com/maloyan/manim-js/issues/342)
* **#358:** add multi-camera example scenes ([#383](https://github.com/maloyan/manim-js/issues/383)) ([add61eb](https://github.com/maloyan/manim-js/commit/add61eb19c17e5c2af1a756c5725e9d6b293fcff)), closes [#358](https://github.com/maloyan/manim-js/issues/358) [#358](https://github.com/maloyan/manim-js/issues/358) [#358](https://github.com/maloyan/manim-js/issues/358)
* **#358:** aspectMode + viewport borders for multi-camera scenes ([#387](https://github.com/maloyan/manim-js/issues/387)) ([fa27b70](https://github.com/maloyan/manim-js/commit/fa27b703760b02d5921f36d18e69a7058c44cd96)), closes [#358](https://github.com/maloyan/manim-js/issues/358) [#383](https://github.com/maloyan/manim-js/issues/383)
* **#380:** add onLog callback for subscribing to log messages ([#395](https://github.com/maloyan/manim-js/issues/395)) ([79edf80](https://github.com/maloyan/manim-js/commit/79edf80f3c8bb5a45b8d4c74531b67969c4df397)), closes [#380](https://github.com/maloyan/manim-js/issues/380)
* add runtime argument validation for animations and mobjects ([#350](https://github.com/maloyan/manim-js/issues/350)) ([d4beea6](https://github.com/maloyan/manim-js/commit/d4beea61b48c8752cc74ba2f5a6ad2048bc6a2af))
* **slides:** add per-slide looping via scene.loopPlay ([#215](https://github.com/maloyan/manim-js/issues/215)) ([#354](https://github.com/maloyan/manim-js/issues/354)) ([626d808](https://github.com/maloyan/manim-js/commit/626d80868aed40f8cd5bb112f9212dcb57a1bbe5))
* **slides:** rebuild slidesMode on Slide groups, add nextSlide + autoNext ([#215](https://github.com/maloyan/manim-js/issues/215)) ([#355](https://github.com/maloyan/manim-js/issues/355)) ([5fd8465](https://github.com/maloyan/manim-js/commit/5fd8465013e243a0935285cd8e4742dcacda2710)), closes [#354](https://github.com/maloyan/manim-js/issues/354)


### Bug Fixes

* **#321:** silence coverage stderr noise ([#372](https://github.com/maloyan/manim-js/issues/372)) ([8f830d4](https://github.com/maloyan/manim-js/commit/8f830d4a5d72389366d5ae4f76cbcc3407fe6de7)), closes [#321](https://github.com/maloyan/manim-js/issues/321)
* **#324:** MathTex preserves pre-applied scale ([#374](https://github.com/maloyan/manim-js/issues/374)) ([430a203](https://github.com/maloyan/manim-js/commit/430a2030e3d1d5cd804a6007a6ed405fd686fd42)), closes [#324](https://github.com/maloyan/manim-js/issues/324) [#318](https://github.com/maloyan/manim-js/issues/318)
* **#344:** register AnimateProxy when Scene loads ([#382](https://github.com/maloyan/manim-js/issues/382)) ([da1d384](https://github.com/maloyan/manim-js/commit/da1d38440f999754e83de602775af83f31dce6f1)), closes [#344](https://github.com/maloyan/manim-js/issues/344)
* **#360:** auto-resize canvas on container/window changes ([#389](https://github.com/maloyan/manim-js/issues/389)) ([7e52cf4](https://github.com/maloyan/manim-js/commit/7e52cf4fe1b98250111d61dd9a585378c51f45f2)), closes [#360](https://github.com/maloyan/manim-js/issues/360)
* **#361:** render Line3D via Line2/LineMaterial so lineWidth works ([#388](https://github.com/maloyan/manim-js/issues/388)) ([c28d7e5](https://github.com/maloyan/manim-js/commit/c28d7e56e90415c4d5fe965f14186b5954ce6e02)), closes [#361](https://github.com/maloyan/manim-js/issues/361)
* default orbit controls up axis to z ([#379](https://github.com/maloyan/manim-js/issues/379)) ([d47b77e](https://github.com/maloyan/manim-js/commit/d47b77eb8e78db1ad6de41570871ab9bcabc324a))
* defer scene.add() auto-render to next microtask ([#317](https://github.com/maloyan/manim-js/issues/317)) ([#352](https://github.com/maloyan/manim-js/issues/352)) ([5887d3c](https://github.com/maloyan/manim-js/commit/5887d3c9e3b0c2e426604fe46bc3bed77b0278bf))
* **docs:** drop manim-web source alias so typia transform reaches the bundle ([#376](https://github.com/maloyan/manim-js/issues/376)) ([2baea18](https://github.com/maloyan/manim-js/commit/2baea18ffe15f00b2938c21404382618fe22f909)), closes [#340](https://github.com/maloyan/manim-js/issues/340) [#340](https://github.com/maloyan/manim-js/issues/340) [#340](https://github.com/maloyan/manim-js/issues/340)
* **examples:** address remaining issue [#316](https://github.com/maloyan/manim-js/issues/316) polish items ([#353](https://github.com/maloyan/manim-js/issues/353)) ([5d6c437](https://github.com/maloyan/manim-js/commit/5d6c437f3e8e9cb41d09c16959e13fc02bce6bc7))
* **examples:** polish examples after recent camera + font changes ([#316](https://github.com/maloyan/manim-js/issues/316)) ([#351](https://github.com/maloyan/manim-js/issues/351)) ([70e7b79](https://github.com/maloyan/manim-js/commit/70e7b794f0fd6bea2c20c87dc9fcdd81f85ce23d))
* **slides:** address PR [#355](https://github.com/maloyan/manim-js/issues/355) review — extract RecordingScene, fix nav + seek edge cases ([#215](https://github.com/maloyan/manim-js/issues/215)) ([#356](https://github.com/maloyan/manim-js/issues/356)) ([e52a242](https://github.com/maloyan/manim-js/commit/e52a24273aa14685fd682b666e69bdab92375bcb))
* **text:** flush canvas font cache after FontFace.add (issue [#309](https://github.com/maloyan/manim-js/issues/309)) ([#328](https://github.com/maloyan/manim-js/issues/328)) ([2130609](https://github.com/maloyan/manim-js/commit/2130609756374239bc1d45d48078c28efac2f525))
* **vgroup:** apply shift to group position when empty ([#318](https://github.com/maloyan/manim-js/issues/318)) ([#357](https://github.com/maloyan/manim-js/issues/357)) ([73f173a](https://github.com/maloyan/manim-js/commit/73f173acb6f25805a74bb1afac489e9e2164db6e))
* **vmobject:** make isNearlyLinear scale-invariant ([#310](https://github.com/maloyan/manim-js/issues/310)) ([#329](https://github.com/maloyan/manim-js/issues/329)) ([5761291](https://github.com/maloyan/manim-js/commit/5761291ff61592e2ee39770f5a7e91cb56a4e119)), closes [#258](https://github.com/maloyan/manim-js/issues/258)


### Tests

* strict console policy + root-cause remaining noise ([#373](https://github.com/maloyan/manim-js/issues/373)) ([44bc757](https://github.com/maloyan/manim-js/commit/44bc757881dc73afa055799e0dc8d3b67b8a630f))


### Refactoring

* **#340:** centralize cross/dot/length/normalize in vectors.ts ([#375](https://github.com/maloyan/manim-js/issues/375)) ([aa257b8](https://github.com/maloyan/manim-js/commit/aa257b8d6cc081548822bb8aeee15dc2214809eb)), closes [#340](https://github.com/maloyan/manim-js/issues/340) [#340](https://github.com/maloyan/manim-js/issues/340) [#340](https://github.com/maloyan/manim-js/issues/340) [#340](https://github.com/maloyan/manim-js/issues/340)


### Documentation

* **#358:** surface multi-camera examples on docs site ([#386](https://github.com/maloyan/manim-js/issues/386)) ([313521a](https://github.com/maloyan/manim-js/commit/313521a4762797d9bf18f1515057125fc4011824)), closes [#358](https://github.com/maloyan/manim-js/issues/358) [#383](https://github.com/maloyan/manim-js/issues/383)
* **#378:** document changelog conventions and release process ([#385](https://github.com/maloyan/manim-js/issues/385)) ([fdfeb5a](https://github.com/maloyan/manim-js/commit/fdfeb5a2fd83598c4b188fe25bf9a554faa4fd28)), closes [#378](https://github.com/maloyan/manim-js/issues/378) [#378](https://github.com/maloyan/manim-js/issues/378)
* regenerate example docs to include multi-camera scenes ([#384](https://github.com/maloyan/manim-js/issues/384)) ([016fe76](https://github.com/maloyan/manim-js/commit/016fe7667ab92a495aebb65f952096928f315b2d))

## [0.4.0] (Unreleased)

### ⚠️ Breaking

- `PMobject.getPoints()` now returns world-space points.
  - Use `getLocalPoints()` for local/object-space points.
- `Mobject.scale()` / `stretch()` now throw with `aboutPoint`/`aboutEdge` in deferred-transform mode.
- Group/VGroup normalization unified under `normalizeTransform()`.
  - Removed `src/core/normalizeContainerTransform.ts`.

### Changed

- VGroup normalization/child-forwarding aligned with container normalize path.
- Ordered Euler rotation bake in normalization is now covered by regression tests.
- Axis mapping shared via `src/utils/axis.ts` (runtime + tests).
- `PointMorphStrategy` normalizes a copy target and removes hot-path string formatting.

### Fixed

- Centralized VMobject geometry-dirty propagation.
- Added/updated coverage for async pre-render text transform flows.
- Locked transform/container semantics with expanded tests.

### [0.3.16](https://github.com/maloyan/manim-js/compare/v0.3.13...v0.3.16) (2026-03-16)


### Features

* implement ApplyComplexFunction animation ([#139](https://github.com/maloyan/manim-js/issues/139)) ([#166](https://github.com/maloyan/manim-js/issues/166)) ([9950a84](https://github.com/maloyan/manim-js/commit/9950a8405661641544065ee4095d3d0ac2eb65ac))
* implement ApplyPointwiseFunctionToCenter animation ([#140](https://github.com/maloyan/manim-js/issues/140)) ([#179](https://github.com/maloyan/manim-js/issues/179)) ([2db8101](https://github.com/maloyan/manim-js/commit/2db81018c914585c60bb0c343c4e34610a5e5872))
* implement Broadcast animation ([#155](https://github.com/maloyan/manim-js/issues/155)) ([#165](https://github.com/maloyan/manim-js/issues/165)) ([a5e9339](https://github.com/maloyan/manim-js/commit/a5e933988967678e895c23b670bc126ca8218db2))
* implement continuous motion for streamlines ([#135](https://github.com/maloyan/manim-js/issues/135)) ([abc327d](https://github.com/maloyan/manim-js/commit/abc327d5ddc9b4ecc5ec855e65f2f992359c6e94))
* implement LabeledPolygram geometry ([#143](https://github.com/maloyan/manim-js/issues/143)) ([#167](https://github.com/maloyan/manim-js/issues/167)) ([2b6f337](https://github.com/maloyan/manim-js/commit/2b6f337be91c383b9a851beafa63ffc2b2bfbc4d))


### Bug Fixes

* export missing growing animations from main index ([#134](https://github.com/maloyan/manim-js/issues/134)) ([#136](https://github.com/maloyan/manim-js/issues/136)) ([392756d](https://github.com/maloyan/manim-js/commit/392756dd63bfc49ab27eeed277b8ee600ec2dae4))
* match Python manim StreamLines and fix Player yellow circle ([#148](https://github.com/maloyan/manim-js/issues/148)) ([6b36a23](https://github.com/maloyan/manim-js/commit/6b36a23e546c9e16cb50b67dc7f9afe354582034))

### [0.3.14](https://github.com/maloyan/manim-js/compare/v0.3.13...v0.3.14) (2026-03-12)


### Bug Fixes

* export missing growing animations from main index ([#134](https://github.com/maloyan/manim-js/issues/134)) ([#136](https://github.com/maloyan/manim-js/issues/136)) ([392756d](https://github.com/maloyan/manim-js/commit/392756dd63bfc49ab27eeed277b8ee600ec2dae4))

### [0.3.13](https://github.com/maloyan/manim-js/compare/v0.3.12...v0.3.13) (2026-03-11)


### Bug Fixes

* export missing graphing classes from main index ([#131](https://github.com/maloyan/manim-js/issues/131)) ([#132](https://github.com/maloyan/manim-js/issues/132)) ([4c40604](https://github.com/maloyan/manim-js/commit/4c40604b5e532ddbac3c5439455570223fd9c648))

### [0.3.12](https://github.com/maloyan/manim-web/compare/v0.3.11...v0.3.12) (2026-03-09)

### [0.3.11](https://github.com/maloyan/manim-js/compare/v0.3.10...v0.3.11) (2026-03-07)

### [0.3.10](https://github.com/maloyan/manim-js/compare/v0.3.9...v0.3.10) (2026-03-06)

### [0.3.9](https://github.com/maloyan/manim-js/compare/v0.3.6...v0.3.9) (2026-03-05)


### Bug Fixes

* eliminate black flash between animation loops in docs examples ([c21961a](https://github.com/maloyan/manim-js/commit/c21961a645da7b1af4e813a4fe13b99925e3a45c))
* preserve per-child opacities in Create animation ([#109](https://github.com/maloyan/manim-js/issues/109)) ([a8f56f1](https://github.com/maloyan/manim-js/commit/a8f56f15acb526b1f810bb4bfc7231490f406002))
* restore mobject opacity when segment starts during playback ([e88b557](https://github.com/maloyan/manim-js/commit/e88b55783288365fe264125873f4e19efd22f397)), closes [#106](https://github.com/maloyan/manim-js/issues/106)

### [0.3.4](https://github.com/maloyan/manim-js/compare/v0.3.0...v0.3.4) (2026-02-16)


### Bug Fixes

* **ci:** check remote tags to avoid push conflict with pre-existing releases ([c4fb884](https://github.com/maloyan/manim-js/commit/c4fb8847fab1263e0b0fbecea4f77ed2e89613a0))
* **ci:** create GitHub Release even when tag is pre-pushed ([70b6d49](https://github.com/maloyan/manim-js/commit/70b6d49a9398c7181eacec949b5e1ff7e71c2c7b))
* **ci:** decouple npm publish from tag check to handle pre-created releases ([6f438e4](https://github.com/maloyan/manim-js/commit/6f438e4843d945f0fae4f812237b2307e26a9d3a))
* **docs:** generate API docs into docs/docs/api/ so Docusaurus routes them ([3a5e0d7](https://github.com/maloyan/manim-js/commit/3a5e0d7ed6bcc39c45d7a127871b68307df834b9))
* **MathTexSVG:** scale text by em width for consistent fontSize across expressions ([a3550d6](https://github.com/maloyan/manim-js/commit/a3550d65a907459b791a021308e5b0124e5af77d))

### [0.3.3](https://github.com/maloyan/manim-js/compare/v0.3.2...v0.3.3) (2026-02-15)


### Bug Fixes

* **ci:** create GitHub Release even when tag is pre-pushed ([70b6d49](https://github.com/maloyan/manim-js/commit/70b6d49a9398c7181eacec949b5e1ff7e71c2c7b))

### [0.3.2](https://github.com/maloyan/manim-js/compare/v0.1.0...v0.3.2) (2026-02-15)


### Bug Fixes

* **build:** exclude test files from tsc and remove unused field ([49e605b](https://github.com/maloyan/manim-js/commit/49e605b80266d071ea8a67b4884b275a3f59404d))
* **ci:** check remote tags to avoid push conflict with pre-existing releases ([c4fb884](https://github.com/maloyan/manim-js/commit/c4fb8847fab1263e0b0fbecea4f77ed2e89613a0))
* **ci:** decouple npm publish from tag check to handle pre-created releases ([6f438e4](https://github.com/maloyan/manim-js/commit/6f438e4843d945f0fae4f812237b2307e26a9d3a))
* **MathTexSVG:** scale text by em width for consistent fontSize across expressions ([a3550d6](https://github.com/maloyan/manim-js/commit/a3550d65a907459b791a021308e5b0124e5af77d))

## 0.3.0 (2026-02-14)

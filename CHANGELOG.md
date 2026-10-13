# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.36.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.36.0) (2026-10-13)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** mask mobjects with a stencil clip shape ([2ac5bd1](https://github.com/maloyan/manim-web/commit/2ac5bd107961118bfef9c688678722856b3e24b4))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **core:** responsive multi-aspect layout (setFrameAspect + SafeArea) ([7fdbc9a](https://github.com/maloyan/manim-web/commit/7fdbc9a1c14a1969b3edb71419d48ea94290ec65))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **svg:** center imported SVG and size <text> so it renders on screen ([31a584c](https://github.com/maloyan/manim-web/commit/31a584cb877d3b148df626469abd7f9798f7371d))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))
* **text:** stroke each glyph contour as its own subpath ([#716](https://github.com/maloyan/manim-web/issues/716)) ([5e54f9e](https://github.com/maloyan/manim-web/commit/5e54f9e3b6b0d1c1104a66d9086840b53b834093)), closes [#700](https://github.com/maloyan/manim-web/issues/700)
* **transform:** ignore stale subpath lengths instead of crashing ([43aa65d](https://github.com/maloyan/manim-web/commit/43aa65d146249f8e90510dd26dc0eab6321f6d26)), closes [#700](https://github.com/maloyan/manim-web/issues/700) [#716](https://github.com/maloyan/manim-web/issues/716)


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* **#381:** add manim-web skill with live-dev watch.js ([8b7c3fb](https://github.com/maloyan/manim-web/commit/8b7c3fbb61e88959c36ba2fe629543ffa82cc23a)), closes [#381](https://github.com/maloyan/manim-web/issues/381)
* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))


### Refactoring

* **core:** generic VGroup child accessor and typed mesh access to remove downcasts ([#399](https://github.com/maloyan/manim-web/issues/399)) ([2ef5d84](https://github.com/maloyan/manim-web/commit/2ef5d84bdb7543d03d7d4559960f7dcf582158ed))
* **core:** replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([a8ea720](https://github.com/maloyan/manim-web/commit/a8ea720868d9534674f99a7e31946608fabd4d84))
* **mobjects:** replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([df14e73](https://github.com/maloyan/manim-web/commit/df14e734c6eba82899bb9428592ab319fdf06664))
* replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([2dde4c8](https://github.com/maloyan/manim-web/commit/2dde4c8aaa518fd0fd57eee61628e53c3a85609e))

### [0.35.2](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.35.2) (2026-10-13)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **core:** responsive multi-aspect layout (setFrameAspect + SafeArea) ([7fdbc9a](https://github.com/maloyan/manim-web/commit/7fdbc9a1c14a1969b3edb71419d48ea94290ec65))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **svg:** center imported SVG and size <text> so it renders on screen ([31a584c](https://github.com/maloyan/manim-web/commit/31a584cb877d3b148df626469abd7f9798f7371d))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))
* **text:** stroke each glyph contour as its own subpath ([#716](https://github.com/maloyan/manim-web/issues/716)) ([5e54f9e](https://github.com/maloyan/manim-web/commit/5e54f9e3b6b0d1c1104a66d9086840b53b834093)), closes [#700](https://github.com/maloyan/manim-web/issues/700)
* **transform:** ignore stale subpath lengths instead of crashing ([43aa65d](https://github.com/maloyan/manim-web/commit/43aa65d146249f8e90510dd26dc0eab6321f6d26)), closes [#700](https://github.com/maloyan/manim-web/issues/700) [#716](https://github.com/maloyan/manim-web/issues/716)


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* **#381:** add manim-web skill with live-dev watch.js ([8b7c3fb](https://github.com/maloyan/manim-web/commit/8b7c3fbb61e88959c36ba2fe629543ffa82cc23a)), closes [#381](https://github.com/maloyan/manim-web/issues/381)
* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))


### Refactoring

* **core:** generic VGroup child accessor and typed mesh access to remove downcasts ([#399](https://github.com/maloyan/manim-web/issues/399)) ([2ef5d84](https://github.com/maloyan/manim-web/commit/2ef5d84bdb7543d03d7d4559960f7dcf582158ed))
* **core:** replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([a8ea720](https://github.com/maloyan/manim-web/commit/a8ea720868d9534674f99a7e31946608fabd4d84))
* **mobjects:** replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([df14e73](https://github.com/maloyan/manim-web/commit/df14e734c6eba82899bb9428592ab319fdf06664))
* replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([2dde4c8](https://github.com/maloyan/manim-web/commit/2dde4c8aaa518fd0fd57eee61628e53c3a85609e))

### [0.35.1](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.35.1) (2026-10-13)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **core:** responsive multi-aspect layout (setFrameAspect + SafeArea) ([7fdbc9a](https://github.com/maloyan/manim-web/commit/7fdbc9a1c14a1969b3edb71419d48ea94290ec65))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **svg:** center imported SVG and size <text> so it renders on screen ([31a584c](https://github.com/maloyan/manim-web/commit/31a584cb877d3b148df626469abd7f9798f7371d))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))
* **text:** stroke each glyph contour as its own subpath ([#716](https://github.com/maloyan/manim-web/issues/716)) ([5e54f9e](https://github.com/maloyan/manim-web/commit/5e54f9e3b6b0d1c1104a66d9086840b53b834093)), closes [#700](https://github.com/maloyan/manim-web/issues/700)
* **transform:** ignore stale subpath lengths instead of crashing ([43aa65d](https://github.com/maloyan/manim-web/commit/43aa65d146249f8e90510dd26dc0eab6321f6d26)), closes [#700](https://github.com/maloyan/manim-web/issues/700) [#716](https://github.com/maloyan/manim-web/issues/716)


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* **#381:** add manim-web skill with live-dev watch.js ([8b7c3fb](https://github.com/maloyan/manim-web/commit/8b7c3fbb61e88959c36ba2fe629543ffa82cc23a)), closes [#381](https://github.com/maloyan/manim-web/issues/381)
* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))


### Refactoring

* **core:** replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([a8ea720](https://github.com/maloyan/manim-web/commit/a8ea720868d9534674f99a7e31946608fabd4d84))
* **mobjects:** replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([df14e73](https://github.com/maloyan/manim-web/commit/df14e734c6eba82899bb9428592ab319fdf06664))
* replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([2dde4c8](https://github.com/maloyan/manim-web/commit/2dde4c8aaa518fd0fd57eee61628e53c3a85609e))

## [0.35.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.35.0) (2026-10-13)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **core:** responsive multi-aspect layout (setFrameAspect + SafeArea) ([7fdbc9a](https://github.com/maloyan/manim-web/commit/7fdbc9a1c14a1969b3edb71419d48ea94290ec65))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **svg:** center imported SVG and size <text> so it renders on screen ([31a584c](https://github.com/maloyan/manim-web/commit/31a584cb877d3b148df626469abd7f9798f7371d))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))
* **text:** stroke each glyph contour as its own subpath ([#716](https://github.com/maloyan/manim-web/issues/716)) ([5e54f9e](https://github.com/maloyan/manim-web/commit/5e54f9e3b6b0d1c1104a66d9086840b53b834093)), closes [#700](https://github.com/maloyan/manim-web/issues/700)
* **transform:** ignore stale subpath lengths instead of crashing ([43aa65d](https://github.com/maloyan/manim-web/commit/43aa65d146249f8e90510dd26dc0eab6321f6d26)), closes [#700](https://github.com/maloyan/manim-web/issues/700) [#716](https://github.com/maloyan/manim-web/issues/716)


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* **#381:** add manim-web skill with live-dev watch.js ([8b7c3fb](https://github.com/maloyan/manim-web/commit/8b7c3fbb61e88959c36ba2fe629543ffa82cc23a)), closes [#381](https://github.com/maloyan/manim-web/issues/381)
* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))


### Refactoring

* replace unsafe type casts with precise types ([#399](https://github.com/maloyan/manim-web/issues/399)) ([2dde4c8](https://github.com/maloyan/manim-web/commit/2dde4c8aaa518fd0fd57eee61628e53c3a85609e))

### [0.34.3](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.34.3) (2026-10-12)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **svg:** center imported SVG and size <text> so it renders on screen ([31a584c](https://github.com/maloyan/manim-web/commit/31a584cb877d3b148df626469abd7f9798f7371d))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))
* **text:** stroke each glyph contour as its own subpath ([#716](https://github.com/maloyan/manim-web/issues/716)) ([5e54f9e](https://github.com/maloyan/manim-web/commit/5e54f9e3b6b0d1c1104a66d9086840b53b834093)), closes [#700](https://github.com/maloyan/manim-web/issues/700)
* **transform:** ignore stale subpath lengths instead of crashing ([43aa65d](https://github.com/maloyan/manim-web/commit/43aa65d146249f8e90510dd26dc0eab6321f6d26)), closes [#700](https://github.com/maloyan/manim-web/issues/700) [#716](https://github.com/maloyan/manim-web/issues/716)


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* **#381:** add manim-web skill with live-dev watch.js ([8b7c3fb](https://github.com/maloyan/manim-web/commit/8b7c3fbb61e88959c36ba2fe629543ffa82cc23a)), closes [#381](https://github.com/maloyan/manim-web/issues/381)
* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))

### [0.34.2](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.34.2) (2026-10-12)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))
* **text:** stroke each glyph contour as its own subpath ([#716](https://github.com/maloyan/manim-web/issues/716)) ([5e54f9e](https://github.com/maloyan/manim-web/commit/5e54f9e3b6b0d1c1104a66d9086840b53b834093)), closes [#700](https://github.com/maloyan/manim-web/issues/700)


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))

### [0.34.1](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.34.1) (2026-10-12)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **core:** keep play() alive when a render throws mid-animation ([986461a](https://github.com/maloyan/manim-web/commit/986461a53218b74622ebcd000edba94c66574845))
* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop frozen step-by-step formula example ([9c78123](https://github.com/maloyan/manim-web/commit/9c78123d1160f6da7f92a6250997b87c014e17d4))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* **examples:** add step-by-step formula transform example ([#705](https://github.com/maloyan/manim-web/issues/705)) ([cb39e60](https://github.com/maloyan/manim-web/commit/cb39e6081c8de32a4b24841e2235f8a39045c7c7))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))

## [0.34.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.34.0) (2026-10-12)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** activate every example on scroll (not just the first) ([a962946](https://github.com/maloyan/manim-web/commit/a962946fffc815df97a27da069ac9d8aeb1d464c))
* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** click-to-run examples (bound live WebGL contexts) ([90fcf1e](https://github.com/maloyan/manim-web/commit/90fcf1ee2a6d865ca0651352d5c1eeea78beb2ca))
* **docs:** intentional poster panel instead of pure-black example boxes ([bd7e881](https://github.com/maloyan/manim-web/commit/bd7e8814ec7cb9bf06a8c9cab87d3cd84363830a))
* **docs:** run example on click without gating on flaky isVisible ([bd491d3](https://github.com/maloyan/manim-web/commit/bd491d3a264e8ac02dd3e0e258879e816b809be0))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **graphing:** remove spurious bridging lines in ContourPlot ([#700](https://github.com/maloyan/manim-web/issues/700)) ([76f59a1](https://github.com/maloyan/manim-web/commit/76f59a107d4ce9484b78afa9992e4f66cf4efa99))
* **interaction:** add touch and pinch support to PanZoomControls ([#693](https://github.com/maloyan/manim-web/issues/693)) ([3c7bb88](https://github.com/maloyan/manim-web/commit/3c7bb88eaace47400556b4af2a0d4bb08ff39f51))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))

## [0.33.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.33.0) (2026-10-12)


### Features

* **3d:** extruded/beveled 3D text ([05328fd](https://github.com/maloyan/manim-web/commit/05328fd11b827c2ded059e7cdc12aa798cb64fd5))
* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** spatial/positional audio via PannerNode ([7576070](https://github.com/maloyan/manim-web/commit/75760704a7773135ff47927022bf9d9fddccae00))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **biology:** DNA helix and cell mobjects ([f854324](https://github.com/maloyan/manim-web/commit/f8543244a5bd5bbb6e05ff6beabc551cfed4f0cd)), closes [#4809](https://github.com/maloyan/manim-web/issues/4809)
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** opt-in WebXR scene output ([ea47ab5](https://github.com/maloyan/manim-web/commit/ea47ab50b5cac47b63e679e9449bb695b11d4bbd))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** animated SVG (SMIL) export ([2e0868d](https://github.com/maloyan/manim-web/commit/2e0868dd4036eadf577d942cf8d8233e71e2b118))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **docs:** stop the examples init-queue from stalling into black boxes ([187f359](https://github.com/maloyan/manim-web/commit/187f3591fc710d5ad0611675278c4922207671ff))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* document GamepadInput (0.32) ([0a73224](https://github.com/maloyan/manim-web/commit/0a732241db4c602e073a6e72bfb421f304b63993))
* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))
* pages and live examples for 0.29-0.31 features ([2711fac](https://github.com/maloyan/manim-web/commit/2711faca7c8287a312c986fa51fa2e2a2ca22f74))

## [0.32.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.32.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** gamepad input for interactive apps and games ([40836be](https://github.com/maloyan/manim-web/commit/40836be275c46fbe08814cbeb2d8245ecfc3ad46))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))

## [0.31.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.31.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** keyboard input for interactive apps and games ([97cc639](https://github.com/maloyan/manim-web/commit/97cc639a7d8f0efebcfa285797d024d82db7e252))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))

## [0.30.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.30.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **core:** reactive signal graph (lazy memoized computed values) ([3481b19](https://github.com/maloyan/manim-web/commit/3481b1939dd83b6b7bdfcf6eb5a94aff35bc687c))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **interaction:** state-machine for input-driven animation ([c7113e4](https://github.com/maloyan/manim-web/commit/c7113e4cccfc2db03f1a4dcc59cebdbf3e533d80))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **scene:** props/schema parametrized scenes with data-at-render ([326cae1](https://github.com/maloyan/manim-web/commit/326cae1b7d82541b3c0d80c26d86ebb345da4bf1))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))

## [0.29.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.29.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **chemistry:** molecule mobjects for science animations ([828d98f](https://github.com/maloyan/manim-web/commit/828d98f412fe2e3584b5e8328fbc1fb2bff685cb))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **effects:** per-mobject drop shadow ([cec33d8](https://github.com/maloyan/manim-web/commit/cec33d8a54678aa377b8852dab88e495e8e1f9a3)), closes [ManimCommunity/manim#3616](https://github.com/ManimCommunity/manim/issues/3616)
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))
* pages and live examples for 0.23-0.25 features ([3649423](https://github.com/maloyan/manim-web/commit/364942358162b7a4c4b5cf4ccfa8ce9a5c2f5e4b))
* pages and live examples for 0.26-0.28 features ([d50f4af](https://github.com/maloyan/manim-web/commit/d50f4af2c50f95e938f9733e4199889802295495))

## [0.28.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.28.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **ml:** neural-network diagram toolkit ([0bd6a3f](https://github.com/maloyan/manim-web/commit/0bd6a3f76cd6c8d6f373819fa39bdd917248f443))
* **mobjects:** custom GLSL ShaderMobject ([4732dad](https://github.com/maloyan/manim-web/commit/4732dad92d00335db660a616c76c3f99e125ad0b))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** hand-drawn sketch stroke style ([e8b2263](https://github.com/maloyan/manim-web/commit/e8b2263826286dfd3d7f76669e0f129ed86467ca))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **physics:** 2D rigid-body physics simulation ([b036e0f](https://github.com/maloyan/manim-web/commit/b036e0f0134da52f953f2aa7b3bee154507ae5f5))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))

## [0.27.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.27.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **animation:** kinetic-typography preset animations ([edf31f5](https://github.com/maloyan/manim-web/commit/edf31f5ae260037c690d224a14de90380c3c421f))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **audio:** Web MIDI input for animation control ([dbcb900](https://github.com/maloyan/manim-web/commit/dbcb90099030fd3055412fff3632e92b35f85c06))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** Gantt chart ([9212c0a](https://github.com/maloyan/manim-web/commit/9212c0a6a17172b77cc6ad8443399f8992e6434e))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **integrations:** notebook/Observable embed helper ([d425d4e](https://github.com/maloyan/manim-web/commit/d425d4e4c671270ec607419bba5304246191435e))
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))

## [0.26.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.26.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graphing:** radar and waterfall charts ([933e65c](https://github.com/maloyan/manim-web/commit/933e65c2d62cb3c77e23ddf211af5d79f9ab5c80))
* **graphing:** stacked/area/step charts and calendar heatmap ([c055035](https://github.com/maloyan/manim-web/commit/c055035f65f76be0bfed1afb870e42f1554e45d5))
* **graphing:** treemap and chord diagram ([4f4dc5d](https://github.com/maloyan/manim-web/commit/4f4dc5d72e87d931147187a46e2ff35128aafb27))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))

## [0.25.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.25.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** slide-deck export to PDF ([da8337a](https://github.com/maloyan/manim-web/commit/da8337a52f90bb2d3fd8df1d0acde99cc1ea310b))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graph:** animated force-directed layout ([eb903ac](https://github.com/maloyan/manim-web/commit/eb903ac2f9062866a29a09021ff1fc58ca6e518e))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** complex-function domain coloring ([bdc389f](https://github.com/maloyan/manim-web/commit/bdc389fe88560a99aa7ee43512a8f5004303b414))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graph:** Sankey flow diagram ([8e53fe7](https://github.com/maloyan/manim-web/commit/8e53fe70a422ebc2590d944a814332ca3b8cfc2c))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))
* pages and live examples for 0.20-0.22 features ([ba046af](https://github.com/maloyan/manim-web/commit/ba046afa7b1a657c1656648fa0c0f5eb003802c1))

## [0.24.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.24.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** candlestick/OHLC financial chart ([06b9a08](https://github.com/maloyan/manim-web/commit/06b9a083dff7a701ed82593cd9c5859f376e9203))
* **graphing:** Fourier series and epicycle visualization ([26fc7b7](https://github.com/maloyan/manim-web/commit/26fc7b71d4e79c910f56d88069169ff98b5d299c))
* **graphing:** histogram, scatter, box and violin plots ([caeaeef](https://github.com/maloyan/manim-web/commit/caeaeefd48b58c1542f9d836f4f3c2a95419db0d))
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **serialization:** URL-state permalinks for explorables ([c714fc4](https://github.com/maloyan/manim-web/commit/c714fc4f24ef16e3732876d0a073403c57ce0e0e))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))

## [0.23.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.23.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** Lottie animation import ([ada1f08](https://github.com/maloyan/manim-web/commit/ada1f082a9e9ccb757c2ebb31420c5190c3a597b))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))

## [0.22.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.22.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **core:** opt-in post-processing pipeline (bloom, vignette, DOF) ([7c0846e](https://github.com/maloyan/manim-web/commit/7c0846e539b97726af79f078d6fb8f0d1060b872))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **interaction:** 2D pan/zoom viewport controls ([ee86f75](https://github.com/maloyan/manim-web/commit/ee86f753beb2e1353ccdd980a7e1e9455fce6a65))
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))
* pages and live examples for 0.18/0.19 features ([3904d4b](https://github.com/maloyan/manim-web/commit/3904d4b0d22ed4f9098f4c997ad9915a4835fdb8))

## [0.21.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.21.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **export:** transparent/alpha background export ([ca08499](https://github.com/maloyan/manim-web/commit/ca08499729f9fa2bf033a35553e7338c729ad70d))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **mobjects:** particle system with emitter and forces ([148475f](https://github.com/maloyan/manim-web/commit/148475fc8b1677a1a2b5f061d853ccd7935a1132))
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))
* **text:** text-on-a-path layout ([b198346](https://github.com/maloyan/manim-web/commit/b19834625b0e09f9b81f6d9b58d1656e4f047a72))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))

## [0.20.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.20.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **audio:** audio-reactive animation via Web Audio FFT ([3ee052d](https://github.com/maloyan/manim-web/commit/3ee052d84b3bc8d9659970e48c421f89a95d4947))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **export:** scene-to-SVG vector export ([b7409a3](https://github.com/maloyan/manim-web/commit/b7409a3f79db4f7439babafaad2353dc551701b0))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graphing:** PieChart and DonutChart ([2b4390c](https://github.com/maloyan/manim-web/commit/2b4390ca0af8c2c2907b212c62cd97b5209263ef))
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))
* **text:** deflake MathJax script-fallback test under parallel load ([6907c62](https://github.com/maloyan/manim-web/commit/6907c62ba1b9afb7ced38d65ccdcf61082976945))

## [0.19.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.19.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **mobjects:** GPU-instanced mobject for large scenes ([9b1ad67](https://github.com/maloyan/manim-web/commit/9b1ad67a09c2429d37f2bfc344ae4df1254b57bd))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)
* **svg:** pattern fill support ([9ea8c93](https://github.com/maloyan/manim-web/commit/9ea8c93935b7bad75ab239eadfcb870f8d8907ab))
* **table:** entry/row/column accessors, cell highlighting, numeric table variants ([5408781](https://github.com/maloyan/manim-web/commit/54087817d5fc311f2fa1f3c2b44c7b2530901c68))


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))

## [0.18.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.18.0) (2026-10-12)


### Features

* **3d:** OBJ/MTL material and texture support for ModelMobject ([b97097b](https://github.com/maloyan/manim-web/commit/b97097b215592e45a7cb92409d9fb1d0b5d9e368))
* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))


### Documentation

* pages and live examples for 0.16/0.17 features ([51af95c](https://github.com/maloyan/manim-web/commit/51af95c999ba1d67553ea6acf7f24ea9424631b3))

## [0.17.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.17.0) (2026-10-11)


### Features

* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **graphing:** 3D isosurfaces, heatmap and contour plots ([4b7c3d0](https://github.com/maloyan/manim-web/commit/4b7c3d08a9e48002b3c92c0118cc8db9ea72062e)), closes [#4428](https://github.com/maloyan/manim-web/issues/4428) [#416](https://github.com/maloyan/manim-web/issues/416)
* **graph:** weighted-edge labels and self-loop edges ([d502747](https://github.com/maloyan/manim-web/commit/d5027472766e685e2a20f04d75045f427f2b8ae0)), closes [#3153](https://github.com/maloyan/manim-web/issues/3153)
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))


### Tests

* **spaceOps:** ignore sign of zero in midpoint/mean property ([996e196](https://github.com/maloyan/manim-web/commit/996e196b97009c460f53b92fb7ae7b2113aed2a4))

## [0.16.0](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.16.0) (2026-10-11)


### Features

* **a11y:** WebVTT captions, reduced-motion, ARIA narration ([3280c8e](https://github.com/maloyan/manim-web/commit/3280c8e095dbfe3de275996670fdb21f8c16d25a))
* **color:** Oklab/Oklch perceptual color interpolation ([c41d93d](https://github.com/maloyan/manim-web/commit/c41d93d15b7803265c44da4b97e5ff2f5d06e984))
* **mobjects:** opt-in RK4 integrator and seeded flow for StreamLines ([cb482b7](https://github.com/maloyan/manim-web/commit/cb482b7a77afb50919b71a34eb229bb785bfc6f5)), closes [#3789](https://github.com/maloyan/manim-web/issues/3789)


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))

### [0.15.1](https://github.com/maloyan/manim-web/compare/v0.15.0...v0.15.1) (2026-10-11)


### Bug Fixes

* **docs:** add MovablePoint and Slider to the scene in the live example ([0207d1e](https://github.com/maloyan/manim-web/commit/0207d1e1187271358d1738fcdd7fc78cb9fe2fbd))
* **text:** recreate canvas texture on setText size change ([#607](https://github.com/maloyan/manim-web/issues/607)) ([2df7994](https://github.com/maloyan/manim-web/commit/2df799422ad3c757e11fa96863f64df9ae3fd9a2))

## [0.15.0](https://github.com/maloyan/manim-web/compare/v0.14.0...v0.15.0) (2026-10-11)


### Features

* **geo:** add geographical maps module (2D choropleth + 3D globe) ([8a6d697](https://github.com/maloyan/manim-web/commit/8a6d69720544521ce15d69006764dea838815bb6)), closes [#296](https://github.com/maloyan/manim-web/issues/296)


### Bug Fixes

* **rate-functions:** floor spring damping ratio so damping:0 stays finite; format serialization README ([a145fa3](https://github.com/maloyan/manim-web/commit/a145fa3b104d0b37838e87ce1169930762dc3415))


### Tests

* add property-based tests for pure core modules ([#413](https://github.com/maloyan/manim-web/issues/413)) ([c36b8e2](https://github.com/maloyan/manim-web/commit/c36b8e2da80c26e5f54336f62336e05a83301a3f))
* typecheck test files and remove bare Mobject ([#415](https://github.com/maloyan/manim-web/issues/415), [#426](https://github.com/maloyan/manim-web/issues/426)) ([0a54034](https://github.com/maloyan/manim-web/commit/0a540343635a169b3b44619cb59bc4b69431099a))

## [0.14.0](https://github.com/maloyan/manim-web/compare/v0.13.0...v0.14.0) (2026-10-11)


### Features

* continuous dynamic matrix transformations (MatrixTracker + applyMatrixLive) ([aeadd89](https://github.com/maloyan/manim-web/commit/aeadd8928c5e8eb4396f47e6ecf6d9bed74f9e65)), closes [#359](https://github.com/maloyan/manim-web/issues/359)
* interactive slides — keep paused Player slides interactive (fixes [#449](https://github.com/maloyan/manim-web/issues/449)) ([108625b](https://github.com/maloyan/manim-web/commit/108625bbd09c83104ea03bafb8febf4a22b2dabc))
* JSON scene serialization format (closes [#244](https://github.com/maloyan/manim-web/issues/244)) ([4d47647](https://github.com/maloyan/manim-web/commit/4d476471a14abe15d61952e6550b09519afb2148))
* **player:** add export settings (fps/resolution/quality) and frame-accurate path ([afec6b5](https://github.com/maloyan/manim-web/commit/afec6b5de6748f8b4e30f6dce9b2fd5f18b7a2be)), closes [#539](https://github.com/maloyan/manim-web/issues/539)


### Bug Fixes

* **#536:** bias Line3D depth to stop mobile z-fighting ([f1d4875](https://github.com/maloyan/manim-web/commit/f1d48750b5b4012aff57525cff6a4baecd4f4015)), closes [#536](https://github.com/maloyan/manim-web/issues/536)
* CyclicReplace single-arc path ([#448](https://github.com/maloyan/manim-web/issues/448)); regression-guard GrowFromPoint on DashedLine ([#535](https://github.com/maloyan/manim-web/issues/535)) ([09e76cf](https://github.com/maloyan/manim-web/commit/09e76cf548e02792facc6f7237a040080d85e14d))


### Documentation

* fix React/Vue examples, PR template, Getting Started, ARCHITECTURE.md, AGENTS.md ([fd7a246](https://github.com/maloyan/manim-web/commit/fd7a246364be3052e03795ea75bae6e1a37a4294)), closes [#549](https://github.com/maloyan/manim-web/issues/549) [#393](https://github.com/maloyan/manim-web/issues/393) [#397](https://github.com/maloyan/manim-web/issues/397) [#284](https://github.com/maloyan/manim-web/issues/284) [#401](https://github.com/maloyan/manim-web/issues/401) [#400](https://github.com/maloyan/manim-web/issues/400)

## [0.13.0](https://github.com/maloyan/manim-web/compare/v0.12.0...v0.13.0) (2026-10-11)


### Features

* animated GIF support via AnimatedImageMobject ([25707f6](https://github.com/maloyan/manim-web/commit/25707f630e6eb614fb11e3f54692f0863afd6314)), closes [#2950](https://github.com/maloyan/manim-web/issues/2950)
* **examples:** add in-browser manim-web playground ([b4b4113](https://github.com/maloyan/manim-web/commit/b4b4113a1b59ca6c3dd74e5dd413724e4634c0ec))
* **rate-functions:** add spring physics and custom easing ([c0d2c51](https://github.com/maloyan/manim-web/commit/c0d2c51b99f2672f11d3df16043ef6513c14cd90))
* TransformMatchingCode for animating Code diffs (ManimCE [#4103](https://github.com/maloyan/manim-web/issues/4103)) ([a30164e](https://github.com/maloyan/manim-web/commit/a30164e54b2b0f280a5f4df01893d932753b2bf7))


### Documentation

* BEYOND-PARITY.md — researched ManimCE gaps and the manim-web response ([fefa0fe](https://github.com/maloyan/manim-web/commit/fefa0fe5e3d0c29b4f3acd151dbb6b026a85df82))
* document and add examples for 0.11-0.12 features ([8fa921c](https://github.com/maloyan/manim-web/commit/8fa921c6b9e7c4b957f05bc8afb1006f1afdaa36))

## [0.12.0](https://github.com/maloyan/manim-web/compare/v0.11.0...v0.12.0) (2026-10-11)


### Features

* **audio:** add Voiceover narration-sync helper ([8c923da](https://github.com/maloyan/manim-web/commit/8c923da45c62e6af2ac965420b77e46ef387ba47))
* **interaction:** add MovablePoint and Slider explorable primitives ([72ed08a](https://github.com/maloyan/manim-web/commit/72ed08aa8671a8faee772424cfaeb49382a5cd53))
* per-mobject blend modes and a theme system ([bf4a2ff](https://github.com/maloyan/manim-web/commit/bf4a2ffc32afd54e0d0c07041640dc4609ee226b))
* **svg:** add URL loading, gradients, and text/image import ([085425b](https://github.com/maloyan/manim-web/commit/085425baeb08776a711a0c3bd619753bc8014faf)), closes [#3709](https://github.com/maloyan/manim-web/issues/3709)

## [0.11.0](https://github.com/maloyan/manim-web/compare/v0.10.0...v0.11.0) (2026-10-11)


### Features

* **element:** <manim-scene> web component for zero-build embeds ([a83d9a4](https://github.com/maloyan/manim-web/commit/a83d9a4663aff7657c17fc8305b96ca9e412215c))
* **export:** PNG frame export and deterministic WebCodecs encoder ([c987e00](https://github.com/maloyan/manim-web/commit/c987e002543c10f8d7ae845ec6bab83f28e0c8d7))
* **three-d:** ModelMobject for glTF/OBJ 3D model import ([afc0189](https://github.com/maloyan/manim-web/commit/afc018931c8d1e944421409fcc156b6889884afe))
* **video:** VideoMobject — HTML video as a movable mobject ([fc183bc](https://github.com/maloyan/manim-web/commit/fc183bc4eb306a66b319a53df853718071e57b86))

## [0.10.0](https://github.com/maloyan/manim-web/compare/v0.9.0...v0.10.0) (2026-10-11)


### Features

* **text:** Typst + MathTypst mobjects via lazy-loaded Typst WASM (parity) ([fa2b82e](https://github.com/maloyan/manim-web/commit/fa2b82eb9bd4638d074dd2e293e86ede5763678d))


### Documentation

* PARITY.md to 100% feasible coverage (Typst shipped) ([b681036](https://github.com/maloyan/manim-web/commit/b681036016d8fb314b62fc566b8b065a25901b1e))

## [0.9.0](https://github.com/maloyan/manim-web/compare/v0.8.0...v0.9.0) (2026-10-11)


### Features

* **color:** ManimColor/HSV/RGBA/RandomColorGenerator/getShadedRgb (parity) ([bed1de4](https://github.com/maloyan/manim-web/commit/bed1de4691a9daa8287db2daa4886b35e59d7686))
* **geometry:** VMobject appendPoints/insertNCurves + ArcPolygonFromArcs (parity) ([74e7e6a](https://github.com/maloyan/manim-web/commit/74e7e6a218bde07aa43d33fca9c3c9d12615e14e))
* **graphing:** CoordinateSystem export + LinearBase/LogBase scaling (parity) ([aa4f658](https://github.com/maloyan/manim-web/commit/aa4f658bfb85de2dc8b28ac264418e5f2452cc87))
* override_animate + assertIsMobjectMethod + registerFont (parity) ([9194665](https://github.com/maloyan/manim-web/commit/9194665e5cb57314c9105b4a56014f87e8846c92))
* **three-d:** get_3d_vmob_* helpers + SpecialThreeDScene (parity) ([2065986](https://github.com/maloyan/manim-web/commit/2065986c1906a0412893f53ebcab9b8cf87e9fce))


### Documentation

* update PARITY.md to 99.5% + tidy color type exports ([711037e](https://github.com/maloyan/manim-web/commit/711037e298c3f9419086fe8d7d2b957872382ad5))

## [0.8.0](https://github.com/maloyan/manim-web/compare/v0.7.0...v0.8.0) (2026-10-11)


### Features

* close cheap ManimCE parity residual + add PARITY.md ([1de3efb](https://github.com/maloyan/manim-web/commit/1de3efba50c6a21803409eff28efa7713b36983e))


### Documentation

* prettier-format PARITY.md ([f5dfb3b](https://github.com/maloyan/manim-web/commit/f5dfb3b42fded656331a2235813ad4735442c66d))

## [0.7.0](https://github.com/maloyan/manim-web/compare/v0.6.0...v0.7.0) (2026-10-11)


### Features

* **animation:** always_shift/always_rotate/turn_animation_into_updater/cycle_animation (parity) ([2eb80ea](https://github.com/maloyan/manim-web/commit/2eb80ea2158cfb1099ee454e5a27e2fd1abf80bb))
* **constants:** export ManimCE math/axis/default/font constants (parity) ([3946298](https://github.com/maloyan/manim-web/commit/39462984787f2120f8999e634615834f49cb2d67))
* **utils:** export ManimCE bezier utilities (parity) ([4510690](https://github.com/maloyan/manim-web/commit/4510690cd9d73bba464025593be7bf9543348ae6))
* **utils:** export ManimCE color utilities (parity) ([eeced4f](https://github.com/maloyan/manim-web/commit/eeced4fa622e4d18da466ec49a74ac6e3229b2f1))
* **utils:** export ManimCE iterables/unit/family/debug helpers (parity) ([73d9097](https://github.com/maloyan/manim-web/commit/73d9097e828d9fc7a3ce5f20e8184ceb3f4656c2))
* **utils:** export ManimCE space_ops/paths/simple_functions (parity) ([d2303ca](https://github.com/maloyan/manim-web/commit/d2303ca7e99aed37390650156e13af20b6ff7d9e))

## [0.6.0](https://github.com/maloyan/manim-web/compare/v0.5.0...v0.6.0) (2026-10-11)


### Features

* **animation:** fAlways + always updater helpers (parity) ([fc1ab30](https://github.com/maloyan/manim-web/commit/fc1ab309c3ae7e7f2ca5d6e88088ffad5b562458))
* **core:** VMobject.roundCorners for arbitrary polygons (parity) ([38e1198](https://github.com/maloyan/manim-web/commit/38e11982df8fade8f199f8c71bb43f9612bccbea))
* **text:** Text linear color gradient fill (parity) ([aa546bb](https://github.com/maloyan/manim-web/commit/aa546bbeebaad37aaaa5b15130cc970d0e7998b8))

## [0.5.0](https://github.com/maloyan/manim-web/compare/v0.4.0...v0.5.0) (2026-10-11)


### Features

* **core:** always_redraw + size-to-fit/match helpers on Mobject (parity) ([d9706e4](https://github.com/maloyan/manim-web/commit/d9706e458f0b78e18bd280553102fc7783ebd9fc))
* **core:** arc-length proportion, subcurve, smooth/jagged + color gradient on VMobject (parity) ([1313ca3](https://github.com/maloyan/manim-web/commit/1313ca3347d071dac47df0ceadd408ad6a49bf0f))
* **graphing:** Axes addCoordinates + horizontal/lines-to-point (parity) ([7b431bd](https://github.com/maloyan/manim-web/commit/7b431bd10bb00c86b478c323937ddfa2868efd2e))
* **text:** MathTex setColorByTex + Text per-substring color (parity) ([4abdb72](https://github.com/maloyan/manim-web/commit/4abdb7247ecbaa5b8629a912f96059d38575c034))


### Bug Fixes

* **graphing:** drop redundant calculus value exports flagged by knip ([#552](https://github.com/maloyan/manim-web/issues/552)) ([0ac75ec](https://github.com/maloyan/manim-web/commit/0ac75eca9f616681b8d0e77e7cf66df07e3c6944))

## [0.4.0](https://github.com/maloyan/manim-web/compare/v0.3.24...v0.4.0) (2026-10-10)


### Features

* **core:** optional user ids + Scene.getMobject lookup ([#547](https://github.com/maloyan/manim-web/issues/547)) ([1226394](https://github.com/maloyan/manim-web/commit/1226394dd8d7cebbbc54cc693830308e8c7b0e3e))
* **graphing:** add length options to ThreeDAxes ([#538](https://github.com/maloyan/manim-web/issues/538)) ([e44749a](https://github.com/maloyan/manim-web/commit/e44749a1c1745ac851a8ca30234a2fffccb43cef))
* **graphing:** add tangent/secant/derivative toolkit to Axes ([ef8f0b1](https://github.com/maloyan/manim-web/commit/ef8f0b1372353ef718190ee4563a9f47d28e766e))
* make runtime asset fallbacks configurable ([#542](https://github.com/maloyan/manim-web/issues/542)) ([09fa01a](https://github.com/maloyan/manim-web/commit/09fa01aed2719f137222d2d4823f415d29d08810))


### Bug Fixes

* **ci:** raise docs build heap limit to 8192MB to fix OOM ([#513](https://github.com/maloyan/manim-web/issues/513)) ([5281739](https://github.com/maloyan/manim-web/commit/5281739d30164d780c619cd3131d778d76f13c21)), closes [#510](https://github.com/maloyan/manim-web/issues/510)
* **core:** avoid full geometry rebuild when opacity crosses 1 ([#548](https://github.com/maloyan/manim-web/issues/548)) ([22c1c8c](https://github.com/maloyan/manim-web/commit/22c1c8cd1cbc1758c63f90cc4a2ae3b17ee6916a))
* correct DashedLine Create and Transform behavior ([#546](https://github.com/maloyan/manim-web/issues/546)) ([9fc77ba](https://github.com/maloyan/manim-web/commit/9fc77ba30d376c02dc4b5a8427a4b2247bc43148)), closes [#544](https://github.com/maloyan/manim-web/issues/544) [#544](https://github.com/maloyan/manim-web/issues/544) [#544](https://github.com/maloyan/manim-web/issues/544) [#544](https://github.com/maloyan/manim-web/issues/544) [#545](https://github.com/maloyan/manim-web/issues/545) [#534](https://github.com/maloyan/manim-web/issues/534) [#534](https://github.com/maloyan/manim-web/issues/534)
* **graphing:** inherit NumberLine color in number labels ([#541](https://github.com/maloyan/manim-web/issues/541)) ([f749f21](https://github.com/maloyan/manim-web/commit/f749f21abe6bb533991710ea0e8d8d2d858da7c1))
* publish transitive declaration dependencies ([#540](https://github.com/maloyan/manim-web/issues/540)) ([96024eb](https://github.com/maloyan/manim-web/commit/96024eb67a176d99cf28a844ed1977cd349a5092))


### Documentation

* fix package links, link the build write-up and author site ([#550](https://github.com/maloyan/manim-web/issues/550)) ([2422e30](https://github.com/maloyan/manim-web/commit/2422e307f9a9d1af0540b2ae1a2e2834c5b23152))

### [0.3.24](https://github.com/maloyan/manim-web/compare/v0.3.23...v0.3.24) (2026-07-13)


### Features

* **PMobject:** per-point opacity via ShaderMaterial ([#475](https://github.com/maloyan/manim-web/issues/475)) ([e8bee85](https://github.com/maloyan/manim-web/commit/e8bee85))
* re-export THREE from the public API ([#510](https://github.com/maloyan/manim-web/issues/510)) ([66d133e](https://github.com/maloyan/manim-web/commit/66d133e))


### Bug Fixes

* **#501:** restore VGroup child opacities in Create opacity fallback ([#502](https://github.com/maloyan/manim-web/issues/502)) ([b6cdea3](https://github.com/maloyan/manim-web/commit/b6cdea3))
* **#503:** use npm ci in CI jobs for reproducible dependency versions ([#504](https://github.com/maloyan/manim-web/issues/504)) ([64b284c](https://github.com/maloyan/manim-web/commit/64b284c))
* **#505:** don't unpin fixed-in-frame mobjects when re-added to the scene ([#506](https://github.com/maloyan/manim-web/issues/506)) ([aed4a9b](https://github.com/maloyan/manim-web/commit/aed4a9b))

### [0.3.23](https://github.com/maloyan/manim-js/compare/v0.3.22...v0.3.23) (2026-06-17)


### ⚠ BREAKING CHANGES

* MobjectLike interface and transform behavior changes.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

* chore: remove arrow-dance debug example

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
* `circle.getCircleCenter` was removed, as well as other
shape-specific circles. `polygon.getCenter` now matches python manim;
use `polygon.getCenterOfMass` to get the construction center.

* fix center calculation for sector and star, rename matrix method

* remove getConstructionCenter logic from mobject

* add 2 forgeted methods

* fix: world-frame transforms + empty-getCenter convention

Coordinate-frame fixes (moveTo/rotate/scale lift the anchor into the
parent frame so scale-then-moveTo and rotate-about-center land correctly),
plus Star/Polygram centers via the full world matrix.

Empty getCenter() design:
- base Mobject.getCenter: warn (via logger) and fall back to world
  position (_localToWorld([0,0,0])) — not stable across normalizeTransform
- Group/VGroup: throw on empty (no geometry => no meaningful center)
- MathTex: override to return world position without warning (lazy-empty
  before render is expected)

Add getCenterOfMass/moveCenterOfMassTo to PMobject and VMobject.

Logging: route new logging through the logger utility, never raw
console.*; document the convention in AGENTS.md.

Tests: drop misattributed empty-group tests, assert empty VGroup throws,
brace a non-empty non-VMobject Group for the fallback path, use real
geometry (Dot) where empty fixtures relied on the old [0,0,0] default.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

* fix(image): copy() must preserve position so Transform translates

ImageMobject.copy() passed copyPosition:false, correct for points-baked
VMobjects but wrong for a textured mesh whose translation lives on
`position`. The constructor only seeds position from construction-time
`_centerPoint`, which shift()/moveTo()/normalizeTransform never update, so
copies snapped back to their original center. ShapeMorphStrategy reads
start/target position from those copies, so image translation interpolated
0->0 and never moved (regression from the normalize-transform refactor).

Drop copyPosition:false (default true), matching MathTexImage. Add a copy()
unit test and an end-to-end Transform-translation test, plus a pure-shift
step in the image_transform example.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
* MobjectLike interface and transform behavior changes.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

* chore: remove arrow-dance debug example

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

### Features

* **examples:** add Clickable example showcasing click vs drag ([#430](https://github.com/maloyan/manim-js/issues/430)) ([#433](https://github.com/maloyan/manim-js/issues/433)) ([b7c5d80](https://github.com/maloyan/manim-js/commit/b7c5d807463e6e187dda5634bbcd2228b5f4cec9))
* render PMobject points as circles by default ([#470](https://github.com/maloyan/manim-js/issues/470)) ([ca8eb03](https://github.com/maloyan/manim-js/commit/ca8eb037787e3fdeef3804ef206a5a768f55878e))
* **transform:** morph point clouds (PMobject) instead of crossfading ([#464](https://github.com/maloyan/manim-js/issues/464)) ([700b179](https://github.com/maloyan/manim-js/commit/700b1795b02f3ffd0924786e3f0b195f73df9191))


### Bug Fixes

* **#465:** disable 2D draw-order z-layering in 3D scenes ([#466](https://github.com/maloyan/manim-js/issues/466)) ([2ba6801](https://github.com/maloyan/manim-js/commit/2ba68014f7d8e97f1922967bca35d6a592d093ef)), closes [#465](https://github.com/maloyan/manim-js/issues/465) [#465](https://github.com/maloyan/manim-js/issues/465)
* **#467:** preserve mobject opacity in Add animation ([#468](https://github.com/maloyan/manim-js/issues/468)) ([5060274](https://github.com/maloyan/manim-js/commit/5060274c51943606622f9e0bb1d389b7fd14e78a)), closes [#467](https://github.com/maloyan/manim-js/issues/467)
* **3d:** add depth prepass so transparent surfaces self-occlude ([#416](https://github.com/maloyan/manim-js/issues/416)) ([#454](https://github.com/maloyan/manim-js/issues/454)) ([2b3a025](https://github.com/maloyan/manim-js/commit/2b3a0254ea30cb58af162e7ebee97604a3ceaf56)), closes [#255](https://github.com/maloyan/manim-js/issues/255) [#255](https://github.com/maloyan/manim-js/issues/255)
* **arrow:** geometry-derived endpoints + child-based GrowArrow ([#432](https://github.com/maloyan/manim-js/issues/432)) ([90e4224](https://github.com/maloyan/manim-js/commit/90e42242c599d6f3b9a0a7bd28f81749f15a3f4a)), closes [#339](https://github.com/maloyan/manim-js/issues/339)
* **camera:** read live camera position in Camera3D orbit angles ([#425](https://github.com/maloyan/manim-js/issues/425)) ([#429](https://github.com/maloyan/manim-js/issues/429)) ([d29e62c](https://github.com/maloyan/manim-js/commit/d29e62cc474002d36a24fd183578193d888f2270))
* **examples:** scale Gaussian surface about origin so its base sits on z=0 ([#455](https://github.com/maloyan/manim-js/issues/455)) ([ac5695b](https://github.com/maloyan/manim-js/commit/ac5695b4d4437349a5564adcaa0d57c65c4965a6))
* **geometry:** sweep rounded-corner arcs clockwise to match path direction ([#434](https://github.com/maloyan/manim-js/issues/434)) ([#452](https://github.com/maloyan/manim-js/issues/452)) ([7067ac0](https://github.com/maloyan/manim-js/commit/7067ac0a61866b50fafb64f6516c965b9c6c9f5f))
* **lint:** ban eslint-disable directives and remove all existing ones ([#398](https://github.com/maloyan/manim-js/issues/398)) ([#456](https://github.com/maloyan/manim-js/issues/456)) ([d1cb6f9](https://github.com/maloyan/manim-js/commit/d1cb6f9aa9506815ec9f8362c2cd46bb739e1642))
* **logging:** route all console.warn/error through structured logger ([#431](https://github.com/maloyan/manim-js/issues/431)) ([#453](https://github.com/maloyan/manim-js/issues/453)) ([f25f724](https://github.com/maloyan/manim-js/commit/f25f7242f7fffa24171b0de1e39411c1a23686d4))
* **mathtex:** unify @mathjax/src singleton across chunks ([#396](https://github.com/maloyan/manim-js/issues/396)) ([#412](https://github.com/maloyan/manim-js/issues/412)) ([208b6b5](https://github.com/maloyan/manim-js/commit/208b6b50c04462ebcf55a139a2f3271e705aa578))
* **pmobject:** include parent-chain transforms in getPoints() ([#392](https://github.com/maloyan/manim-js/issues/392)) ([#414](https://github.com/maloyan/manim-js/issues/414)) ([4204c07](https://github.com/maloyan/manim-js/commit/4204c07b2208bfeed492d067693b573aa556ce37))
* render scene during Draggable drags by default ([#450](https://github.com/maloyan/manim-js/issues/450)) ([2f7424e](https://github.com/maloyan/manim-js/commit/2f7424e30abd1204cae9226e62fb53c71fa96e6e)), closes [#419](https://github.com/maloyan/manim-js/issues/419) [#419](https://github.com/maloyan/manim-js/issues/419)
* restore textured-mobject scale/rotation and VGroup arrange centering after [#417](https://github.com/maloyan/manim-js/issues/417) normalize ([#428](https://github.com/maloyan/manim-js/issues/428)) ([bd565bd](https://github.com/maloyan/manim-js/commit/bd565bd4242c963978d276947d642caa8e84cc84))
* **transform:** correct corner tangents when resampling cubic bezier chains ([#446](https://github.com/maloyan/manim-js/issues/446)) ([4ad3f04](https://github.com/maloyan/manim-js/commit/4ad3f04d89f3ac813aa28cd72b42208c4f303e95))


* Normalize transform: follow-up on `copy` implementation (#427) ([cfcb6c0](https://github.com/maloyan/manim-js/commit/cfcb6c0e59bdc95c62d2278857883f2af3fc3304)), closes [#427](https://github.com/maloyan/manim-js/issues/427) [#391](https://github.com/maloyan/manim-js/issues/391) [#390](https://github.com/maloyan/manim-js/issues/390) [#251](https://github.com/maloyan/manim-js/issues/251) [#417](https://github.com/maloyan/manim-js/issues/417) [#1](https://github.com/maloyan/manim-js/issues/1) [#6](https://github.com/maloyan/manim-js/issues/6) [#427](https://github.com/maloyan/manim-js/issues/427) [#417](https://github.com/maloyan/manim-js/issues/417)
* Normalize transform (#417) ([93e8e70](https://github.com/maloyan/manim-js/commit/93e8e70bd62928f39d5e56e456545f3dba1ca178)), closes [#417](https://github.com/maloyan/manim-js/issues/417) [#391](https://github.com/maloyan/manim-js/issues/391) [#390](https://github.com/maloyan/manim-js/issues/390) [#251](https://github.com/maloyan/manim-js/issues/251) [#417](https://github.com/maloyan/manim-js/issues/417) [#1](https://github.com/maloyan/manim-js/issues/1) [#6](https://github.com/maloyan/manim-js/issues/6)

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

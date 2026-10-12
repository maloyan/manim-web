// Live example component for the "New in 0.27 and 0.28" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

// A Shadertoy-style fragment shader. The built-in iTime uniform advances each
// frame, so the plasma animates on the timeline. vUv is the plane UV in [0, 1].
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform float iTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 6.0;
    float v = sin(p.x + iTime)
      + sin(p.y + iTime * 0.8)
      + sin(p.x + p.y + iTime * 1.3)
      + sin(length(p - 3.0) - iTime * 1.5);
    vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + v * 1.5);
    gl_FragColor = vec4(col, 1.0);
  }
`;

async function animate(scene: any) {
  const { ShaderMobject } = await import('manim-web');

  const shader = new ShaderMobject({
    fragmentShader: FRAGMENT_SHADER,
    width: 9,
    height: 5,
  });

  // The frame updater advances iTime, so adding the shader and waiting animates it.
  scene.add(shader);
  await scene.wait(999999);
}

export default function ShaderMobjectExample() {
  return <ManimExample animationFn={animate} />;
}

import { Scene, SVGMobject, Create, BLACK } from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

// SVGMobject parses gradients, <text>, and <image> from the source. This
// inline string shows a linear gradient fill and a text label, so it renders
// with no network request.
const svgString = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#58C4DD"/>
        <stop offset="100%" stop-color="#D147BD"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="100" height="40" rx="8" fill="url(#grad)"/>
    <text x="60" y="72" font-size="14" fill="#ffffff" text-anchor="middle">manim-web</text>
  </svg>`;

const logo = new SVGMobject({ svgString, height: 3 });

async function run(): Promise<void> {
  await scene.play(new Create(logo, { duration: 2 }));
}

// Load from a URL instead when the SVG lives on a server:
//
//   const logo = await SVGMobject.fromUrl('./logo.svg', { height: 3 });
//   scene.add(logo);

const isEmbed = new URLSearchParams(window.location.search).has('embed');
if (isEmbed) {
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const cont = document.getElementById('container');
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
}

run();

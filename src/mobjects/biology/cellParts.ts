/**
 * Builders for the realistic organelle shapes of a {@link Cell}.
 *
 * Each builder returns a single VMobject (a composite VGroup, or a plain shape)
 * centered on the origin. The caller moves it to the organelle position. Sizes
 * scale with the cell radius so one set of numbers fits any cell. Every builder
 * is deterministic: the same inputs give the same shape, so the cell is easy to
 * test.
 */

import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Circle } from '../geometry/Circle';
import { Ellipse } from '../geometry/Ellipse';
import { Arc } from '../geometry/Arc';
import { Dot } from '../geometry/Dot';
import { ParametricFunction } from '../graphing/ParametricFunction';
import { interpolateColor } from '../../utils/color';
import type { Vector3Tuple } from '../../core/Mobject';

/** A darker shade of the fill color, for gentle outlines. */
function outlineColor(color: string): string {
  return interpolateColor(color, '#000000', 0.32);
}

/** A lighter shade of the fill color, for pale fills and highlights. */
function paleColor(color: string): string {
  return interpolateColor(color, '#FFFFFF', 0.25);
}

/** Build a short, smooth wavy line from x0 to x1 at height y. */
function wavyLine(
  x0: number,
  x1: number,
  y: number,
  amplitude: number,
  waves: number,
  color: string,
  strokeWidth: number,
): ParametricFunction {
  const k = (waves * 2 * Math.PI) / (x1 - x0);
  return new ParametricFunction({
    func: (t: number): [number, number] => [t, y + amplitude * Math.sin(k * (t - x0))],
    tRange: [x0, x1],
    numSamples: 40,
    color,
    strokeWidth,
  });
}

/** A mitochondrion: a bean body with inner cristae. */
function buildMitochondrion(color: string, scale: number): VMobject {
  const halfW = 0.31 * scale;
  const halfH = 0.17 * scale;
  const body = new Ellipse({
    width: 2 * halfW,
    height: 2 * halfH,
    color,
    fillOpacity: 0.5,
    strokeWidth: 2.5,
  });
  body.strokeColor = outlineColor(color);

  const group = new VGroup(body);
  const cristaColor = outlineColor(color);
  const cristaCount = 3;
  for (let i = 0; i < cristaCount; i++) {
    const y = ((i - (cristaCount - 1) / 2) / cristaCount) * (2 * halfH) * 0.9;
    const crista = wavyLine(-0.7 * halfW, 0.7 * halfW, y, 0.28 * halfH, 1.5, cristaColor, 2);
    crista.setStrokeOpacity(0.8);
    group.add(crista);
  }
  return group;
}

/** A golgi apparatus: stacked curved sacs (nested crescents). */
function buildGolgi(color: string, scale: number): VMobject {
  const group = new VGroup();
  const count = 4;
  for (let i = 0; i < count; i++) {
    const r = (0.12 + 0.045 * i) * scale;
    const arc = new Arc({
      radius: r,
      startAngle: Math.PI * 0.18,
      angle: Math.PI * 0.64,
      color,
      strokeWidth: 3,
      center: [0, -0.03 * scale * i, 0],
    });
    arc.setStrokeOpacity(0.6 + 0.12 * i);
    group.add(arc);
  }
  return group;
}

/** An endoplasmic reticulum: a few loose wavy membranes. */
function buildEndoplasmicReticulum(color: string, scale: number): VMobject {
  const group = new VGroup();
  const count = 3;
  for (let i = 0; i < count; i++) {
    const y = ((i - (count - 1) / 2) / count) * 0.34 * scale;
    const line = wavyLine(-0.3 * scale, 0.3 * scale, y, 0.05 * scale, 2, color, 2.5);
    line.setStrokeOpacity(0.9);
    group.add(line);
  }
  return group;
}

/** A ribosome cluster: a tight cluster of tiny dots. */
function buildRibosomeCluster(color: string, scale: number): VMobject {
  const group = new VGroup();
  const dotRadius = 0.045 * scale;
  // A fixed, compact hex-like cluster so the result is deterministic.
  const offsets: Vector3Tuple[] = [
    [0, 0, 0],
    [0.09 * scale, 0.04 * scale, 0],
    [-0.09 * scale, 0.05 * scale, 0],
    [0.05 * scale, -0.08 * scale, 0],
    [-0.06 * scale, -0.07 * scale, 0],
    [0.11 * scale, -0.02 * scale, 0],
  ];
  for (const offset of offsets) {
    const dot = new Dot({ radius: dotRadius, color, fillOpacity: 0.9 });
    dot.moveTo(offset);
    group.add(dot);
  }
  return group;
}

/** A vacuole: a large, pale, low-opacity bubble. */
function buildVacuole(color: string, scale: number): VMobject {
  const vacuole = new Circle({
    radius: 0.3 * scale,
    color,
    fillOpacity: 0.18,
    strokeWidth: 2,
  });
  vacuole.strokeColor = paleColor(color);
  return vacuole;
}

/** A lysosome: a small sac with a few enzyme dots inside. */
function buildLysosome(color: string, scale: number): VMobject {
  const body = new Circle({
    radius: 0.17 * scale,
    color,
    fillOpacity: 0.55,
    strokeWidth: 2.5,
  });
  body.strokeColor = outlineColor(color);

  const group = new VGroup(body);
  const enzymeColor = outlineColor(color);
  const offsets: Vector3Tuple[] = [
    [0.05 * scale, 0.04 * scale, 0],
    [-0.06 * scale, 0.02 * scale, 0],
    [0.02 * scale, -0.06 * scale, 0],
    [-0.03 * scale, -0.04 * scale, 0],
  ];
  for (const offset of offsets) {
    const dot = new Dot({ radius: 0.028 * scale, color: enzymeColor, fillOpacity: 0.85 });
    dot.moveTo(offset);
    group.add(dot);
  }
  return group;
}

/** A plain soft blob for an organelle with no dedicated shape. */
function buildGenericOrganelle(color: string, scale: number): VMobject {
  const blob = new Circle({
    radius: 0.18 * scale,
    color,
    fillOpacity: 0.55,
    strokeWidth: 2.5,
  });
  blob.strokeColor = outlineColor(color);
  return blob;
}

/**
 * Build a realistic organelle shape by its name. Unknown names fall back to a
 * soft blob.
 * @param name - The organelle name (any case).
 * @param color - The resolved fill color.
 * @param scale - The cell radius; organelle sizes scale with it.
 * @returns A single VMobject centered on the origin.
 */
export function buildOrganelleByName(name: string, color: string, scale: number): VMobject {
  const key = name.trim().toLowerCase();
  if (key.includes('mitochond')) {
    return buildMitochondrion(color, scale);
  }
  if (key.includes('golgi')) {
    return buildGolgi(color, scale);
  }
  if (key.includes('reticulum') || key === 'er') {
    return buildEndoplasmicReticulum(color, scale);
  }
  if (key.includes('ribosom')) {
    return buildRibosomeCluster(color, scale);
  }
  if (key.includes('vacuol')) {
    return buildVacuole(color, scale);
  }
  if (key.includes('lysosom')) {
    return buildLysosome(color, scale);
  }
  return buildGenericOrganelle(color, scale);
}

import { VMobject } from '../../core/VMobject';
import {
  collectLeafVMobjectSnapshots,
  type LeafVMobjectSnapshot,
} from '../../core/MobjectTraversal';
import { alignCompoundPathsForTransform } from '../../core/VMobjectGeometry';

function sum(values: number[]): number {
  let out = 0;
  for (const v of values) out += v;
  return out;
}

function assertSubpathLengthsMatchPoints(
  points: number[][],
  lengths: number[] | undefined,
  label: string,
): void {
  if (!lengths || lengths.length === 0) return;
  const total = sum(lengths);
  if (total !== points.length) {
    throw new Error(
      `${label}: subpath lengths sum (${total}) does not match point count (${points.length})`,
    );
  }
}

export interface AlignedTransformPair {
  startPoints: number[][];
  targetPoints: number[][];
  alignedSubpathLengths?: number[];
  finalTargetPoints: number[][];
  finalTargetSubpathLengths?: number[];
}

export function alignVmobjectPair(source: VMobject, target: VMobject): AlignedTransformPair {
  const startCopy = source.copy() as VMobject;
  const targetCopy = target.copy() as VMobject;

  const finalTargetPoints = targetCopy.getPoints();
  const finalTargetSubpathLengths =
    targetCopy.getEffectiveSubpathLengths?.() ?? target.getEffectiveSubpathLengths?.();

  const srcLengths =
    startCopy.getEffectiveSubpathLengths?.() ?? source.getEffectiveSubpathLengths?.();
  const tgtLengths = finalTargetSubpathLengths;

  const startPointsRaw = startCopy.getPoints();
  const targetPointsRaw = targetCopy.getPoints();

  assertSubpathLengthsMatchPoints(startPointsRaw, srcLengths, 'alignVmobjectPair(source)');
  assertSubpathLengthsMatchPoints(targetPointsRaw, tgtLengths, 'alignVmobjectPair(target)');

  const alignedCompound = alignCompoundPathsForTransform(
    startPointsRaw,
    srcLengths,
    targetPointsRaw,
    tgtLengths,
  );

  if (alignedCompound) {
    return {
      startPoints: alignedCompound.srcAlignedPoints,
      targetPoints: alignedCompound.tgtAlignedPoints,
      alignedSubpathLengths: alignedCompound.alignedSubpathLengths,
      finalTargetPoints,
      finalTargetSubpathLengths,
    };
  }

  startCopy.alignPoints(targetCopy);
  const fallbackStartPoints = startCopy.getPoints();
  const fallbackTargetPoints = targetCopy.getPoints();

  if (fallbackStartPoints.length !== fallbackTargetPoints.length) {
    throw new Error(
      `alignVmobjectPair: alignPoints fallback produced mismatched point counts (${fallbackStartPoints.length} vs ${fallbackTargetPoints.length})`,
    );
  }

  return {
    startPoints: fallbackStartPoints,
    targetPoints: fallbackTargetPoints,
    alignedSubpathLengths: undefined,
    finalTargetPoints,
    finalTargetSubpathLengths,
  };
}

export interface LeafPairByIndex {
  source?: LeafVMobjectSnapshot;
  target?: LeafVMobjectSnapshot;
}

export function pairLeafSnapshotsByIndex(
  sourceRoot: VMobject,
  targetRoot: VMobject,
): LeafPairByIndex[] {
  const sourceLeaves = collectLeafVMobjectSnapshots(sourceRoot);
  const targetLeaves = collectLeafVMobjectSnapshots(targetRoot);
  const maxLen = Math.max(sourceLeaves.length, targetLeaves.length);
  const pairs: LeafPairByIndex[] = [];

  for (let i = 0; i < maxLen; i++) {
    const source = sourceLeaves[i];
    const target = targetLeaves[i];
    if (!source && !target) {
      throw new Error(`pairLeafSnapshotsByIndex: invalid empty pair at index ${i}`);
    }
    pairs.push({ source, target });
  }

  return pairs;
}

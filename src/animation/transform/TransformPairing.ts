import { VMobject } from '../../core/VMobject';
import {
  collectLeafVMobjectSnapshots,
  type LeafVMobjectSnapshot,
} from '../../core/MobjectTraversal';
import { alignCompoundPathsForTransform } from '../../core/VMobjectGeometry';

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

  const alignedCompound = alignCompoundPathsForTransform(
    startCopy.getPoints(),
    srcLengths,
    targetCopy.getPoints(),
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
  return {
    startPoints: startCopy.getPoints(),
    targetPoints: targetCopy.getPoints(),
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
    pairs.push({ source: sourceLeaves[i], target: targetLeaves[i] });
  }

  return pairs;
}

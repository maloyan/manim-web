// 10-line MRE: GrowArrow changes arrow.position
import { Scene } from '../src/core/Scene';
import { Arrow, GrowArrow } from '../src/index';

const scene = Scene.createHeadless();
const a = new Arrow();
scene.add(a);
await scene.play(new GrowArrow(a, { duration: 0.01 }));
console.log('before:', 0, 'after:', a.position.x); // 0 -> 0.5

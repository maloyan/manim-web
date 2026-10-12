import { describe, it, expect } from 'vitest';
import { Animation } from '../../animation/Animation';
import { NeuralNetwork, FeedForwardLayer, forwardPass, backwardPass, EdgePulse } from './index';

/**
 * Build a 3-layer dense network (2 connection gaps).
 */
function makeNetwork(): NeuralNetwork {
  return new NeuralNetwork([
    new FeedForwardLayer({ numNodes: 2 }),
    new FeedForwardLayer({ numNodes: 3 }),
    new FeedForwardLayer({ numNodes: 2 }),
  ]);
}

describe('forwardPass', () => {
  it('returns an Animation', () => {
    const net = makeNetwork();
    const anim = forwardPass(net);
    expect(anim).toBeInstanceOf(Animation);
    expect(typeof anim.interpolate).toBe('function');
    expect(anim.duration).toBeGreaterThan(0);
  });

  it('covers all of the network connections', () => {
    const net = makeNetwork();
    const anim = forwardPass(net);
    anim.begin();
    anim.interpolate(1);
    anim.finish();
    // Every connection line ends fully lit (max stroke opacity).
    for (const line of net.getConnections()) {
      expect(line.opacity).toBeCloseTo(1, 5);
    }
  });

  it('progresses through layers: earlier gaps light before later gaps', () => {
    const net = makeNetwork();
    const stages = net.getConnectionStages();
    const anim = forwardPass(net, { lagRatio: 1 });
    anim.begin();

    // At the start, nothing is lit above the resting opacity.
    anim.interpolate(0);
    const restingEarly = stages[0][0].opacity;
    const restingLate = stages[1][0].opacity;
    expect(restingEarly).toBeCloseTo(restingLate, 5);

    // Part-way through, the first gap is lit more than the second gap.
    anim.interpolate(0.4);
    const early = stages[0][0].opacity;
    const late = stages[1][0].opacity;
    expect(early).toBeGreaterThan(late);

    // At the end, every gap is fully lit.
    anim.interpolate(1);
    for (const stage of stages) {
      for (const line of stage) {
        expect(line.opacity).toBeCloseTo(1, 5);
      }
    }
  });

  it('builds one EdgePulse per connection line', () => {
    const net = makeNetwork();
    const anim = forwardPass(net) as unknown as { animations: { animations: EdgePulse[] }[] };
    const pulseCount = anim.animations.reduce((sum, group) => sum + group.animations.length, 0);
    expect(pulseCount).toBe(net.getConnections().length);
  });

  it('does not throw for a single-layer network and yields a no-op animation', () => {
    const net = new NeuralNetwork([new FeedForwardLayer({ numNodes: 3 })]);
    let anim: Animation | undefined;
    expect(() => {
      anim = forwardPass(net);
    }).not.toThrow();
    expect(() => {
      anim!.begin();
      anim!.interpolate(0.5);
      anim!.interpolate(1);
    }).not.toThrow();
  });

  it('does not throw for an empty network', () => {
    const net = new NeuralNetwork([]);
    expect(() => {
      const anim = forwardPass(net);
      anim.begin();
      anim.interpolate(1);
    }).not.toThrow();
  });
});

describe('backwardPass', () => {
  it('returns an Animation covering the connections in reverse order', () => {
    const net = makeNetwork();
    const stages = net.getConnectionStages();
    const anim = backwardPass(net, { lagRatio: 1 });
    expect(anim).toBeInstanceOf(Animation);
    anim.begin();

    // Part-way through, the LAST gap lights before the first gap.
    anim.interpolate(0.4);
    const early = stages[0][0].opacity;
    const late = stages[1][0].opacity;
    expect(late).toBeGreaterThan(early);
  });
});

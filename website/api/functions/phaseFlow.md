# Function: phaseFlow()

> **phaseFlow**(`mobject`, `vectorField`, `options?`): [`PhaseFlow`](../classes/PhaseFlow.md)

Defined in: [animation/movement/Homotopy.ts:538](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/movement/Homotopy.ts#L538)

Create a PhaseFlow animation for a mobject.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to flow

### vectorField

[`VectorFieldFunction`](../type-aliases/VectorFieldFunction.md)

The vector field function defining the flow

### options?

`Omit`\<[`PhaseFlowOptions`](../interfaces/PhaseFlowOptions.md), `"vectorField"`\>

Animation options (duration, rateFunc, virtualTime)

## Returns

[`PhaseFlow`](../classes/PhaseFlow.md)

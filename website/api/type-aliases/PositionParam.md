# Type Alias: PositionParam

> **PositionParam** = `number` \| `string`

Defined in: [animation/Timeline.ts:16](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Timeline.ts#L16)

Position parameter for adding animations to the timeline.
- Number: absolute time in seconds
- '+=N': N seconds after the last animation ends
- '-=N': N seconds before the last animation ends
- '<': same start time as the previous animation
- '>': end of the previous animation (default)
